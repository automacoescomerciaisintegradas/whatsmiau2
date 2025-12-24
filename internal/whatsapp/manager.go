package whatsapp

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"sync"

	"whatsmiau2/internal/config"
	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"

	_ "github.com/ncruces/go-sqlite3/driver"
	_ "github.com/ncruces/go-sqlite3/embed"
	"github.com/skip2/go-qrcode"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
	"go.uber.org/zap"
)

// Manager manages multiple WhatsApp client instances
type Manager struct {
	clients   map[string]*Client
	mu        sync.RWMutex
	config    *config.Config
	db        *database.Database
	container *sqlstore.Container
}

// Client represents a single WhatsApp client instance
type Client struct {
	WA         *whatsmeow.Client
	InstanceID string
	Store      *store.Device
	QRChannel  chan string
	Connected  bool
	manager    *Manager
}

// NewManager creates a new WhatsApp manager
func NewManager(cfg *config.Config, db *database.Database) (*Manager, error) {
	// Create the whatsmeow database container
	dbLog := waLog.Stdout("Database", "INFO", true)

	// Use a separate SQLite database for whatsmeow sessions
	ctx := context.Background()
	container, err := sqlstore.New(ctx, "sqlite3", "file:sessions.db?_foreign_keys=on", dbLog)
	if err != nil {
		return nil, fmt.Errorf("failed to create session store: %w", err)
	}

	manager := &Manager{
		clients:   make(map[string]*Client),
		config:    cfg,
		db:        db,
		container: container,
	}

	// Load existing instances from database
	instances, err := db.GetAllInstances()
	if err != nil {
		zap.L().Warn("Failed to load existing instances", zap.Error(err))
	} else {
		for _, instance := range instances {
			if instance.Status == models.StatusConnected {
				// Try to reconnect existing instances
				go func(inst models.Instance) {
					_, err := manager.GetOrCreateClient(inst.ID)
					if err != nil {
						zap.L().Error("Failed to reconnect instance",
							zap.String("instanceId", inst.ID),
							zap.Error(err),
						)
					}
				}(instance)
			}
		}
	}

	return manager, nil
}

// GetOrCreateClient gets an existing client or creates a new one
func (m *Manager) GetOrCreateClient(instanceID string) (*Client, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if client already exists
	if client, exists := m.clients[instanceID]; exists {
		return client, nil
	}

	// Get or create device store - use instance-specific device
	ctx := context.Background()

	// Get all devices and find one for this instance, or create new
	devices, err := m.container.GetAllDevices(ctx)
	var device *store.Device

	if err == nil && len(devices) > 0 {
		// Try to find an existing device that matches this instanceID
		// For now, use the first available device or create new
		for _, d := range devices {
			if d.ID != nil {
				device = d
				break
			}
		}
	}

	// If no valid device found, create a new one
	if device == nil {
		device = m.container.NewDevice()
		zap.L().Info("Created new device store", zap.String("instanceId", instanceID))
	} else {
		zap.L().Info("Using existing device store",
			zap.String("instanceId", instanceID),
			zap.Bool("hasJID", device.ID != nil),
		)
	}

	// Apply custom OS/Platform configuration
	// Note: Platform sets the browser name in the QR scan
	if m.config.SessionPhoneName != "" {
		device.Platform = m.config.SessionPhoneName
	} else {
		device.Platform = "Chrome (Windows)"
	}
	// We could also set specific version here if needed, but whatsmeow handles it well by default

	// Create log level based on config - force ERROR level to improve performance
	logLevel := "ERROR"
	if m.config.DebugWhatsmeow {
		logLevel = "DEBUG"
	}

	clientLog := waLog.Stdout("Client-"+instanceID, logLevel, true)

	// Create the WhatsApp client
	waClient := whatsmeow.NewClient(device, clientLog)

	// Optimize for performance
	waClient.EnableAutoReconnect = true

	client := &Client{
		WA:         waClient,
		InstanceID: instanceID,
		Store:      device,
		QRChannel:  make(chan string, 10),
		Connected:  false,
		manager:    m,
	}

	// Set up event handler
	waClient.AddEventHandler(client.eventHandler)

	m.clients[instanceID] = client

	zap.L().Info("Created new WhatsApp client", zap.String("instanceId", instanceID))

	return client, nil
}

// GetClient gets an existing client
func (m *Manager) GetClient(instanceID string) (*Client, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	client, exists := m.clients[instanceID]
	return client, exists
}

// RemoveClient removes a client from the manager
func (m *Manager) RemoveClient(instanceID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if client, exists := m.clients[instanceID]; exists {
		client.Disconnect()
		delete(m.clients, instanceID)
		zap.L().Info("Removed WhatsApp client", zap.String("instanceId", instanceID))
	}
}

// GetAllClients returns all active clients
func (m *Manager) GetAllClients() map[string]*Client {
	m.mu.RLock()
	defer m.mu.RUnlock()

	clients := make(map[string]*Client)
	for k, v := range m.clients {
		clients[k] = v
	}
	return clients
}

// Close closes all clients and the container
func (m *Manager) Close() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for _, client := range m.clients {
		client.Disconnect()
	}
	m.clients = make(map[string]*Client)
}

// Connect connects the WhatsApp client with improved error handling and logging
func (c *Client) Connect(ctx context.Context) error {
	zap.L().Info("Attempting to connect WhatsApp client",
		zap.String("instanceId", c.InstanceID),
		zap.Bool("hasExistingSession", c.WA.Store.ID != nil),
	)

	if c.WA.Store.ID == nil {
		// No existing session, need to login with QR code
		zap.L().Info("No existing session found, will generate QR code",
			zap.String("instanceId", c.InstanceID),
		)

		qrChan, _ := c.WA.GetQRChannel(ctx)

		err := c.WA.Connect()
		if err != nil {
			zap.L().Error("Failed to connect to WhatsApp",
				zap.String("instanceId", c.InstanceID),
				zap.Error(err),
			)
			return fmt.Errorf("failed to connect: %w", err)
		}

		zap.L().Info("WhatsApp connection initiated, waiting for QR code",
			zap.String("instanceId", c.InstanceID),
		)

		// Handle QR code events in a goroutine
		go func() {
			for evt := range qrChan {
				if evt.Event == "code" {
					c.QRChannel <- evt.Code
					zap.L().Info("QR code received and sent to channel",
						zap.String("instanceId", c.InstanceID),
					)
				} else if evt.Event == "success" {
					zap.L().Info("QR code scan successful, completing pairing",
						zap.String("instanceId", c.InstanceID),
					)
				} else if evt.Event == "timeout" {
					zap.L().Warn("QR code timed out, will generate new one",
						zap.String("instanceId", c.InstanceID),
					)
				}
			}
			zap.L().Info("QR code channel closed",
				zap.String("instanceId", c.InstanceID),
			)
		}()
	} else {
		// Already have a session, just connect
		zap.L().Info("Existing session found, connecting directly",
			zap.String("instanceId", c.InstanceID),
			zap.String("jid", c.WA.Store.ID.String()),
		)

		err := c.WA.Connect()
		if err != nil {
			zap.L().Error("Failed to reconnect with existing session",
				zap.String("instanceId", c.InstanceID),
				zap.Error(err),
			)
			return fmt.Errorf("failed to connect: %w", err)
		}
		c.Connected = true

		zap.L().Info("Successfully reconnected with existing session",
			zap.String("instanceId", c.InstanceID),
		)
	}

	return nil
}

// Disconnect disconnects the WhatsApp client
func (c *Client) Disconnect() {
	if c.WA != nil && c.WA.IsConnected() {
		c.WA.Disconnect()
	}
	c.Connected = false
}

// Logout logs out and removes the session completely
func (c *Client) Logout() error {
	if c.WA != nil {
		// First disconnect
		if c.WA.IsConnected() {
			c.WA.Disconnect()
		}

		// Then logout from WhatsApp (this invalidates the session on WhatsApp servers)
		ctx := context.Background()
		err := c.WA.Logout(ctx)
		if err != nil {
			zap.L().Warn("Logout error (may be expected if already logged out)",
				zap.String("instanceId", c.InstanceID),
				zap.Error(err),
			)
		}

		// Delete the device from the store to clear the session completely
		if c.Store != nil && c.Store.ID != nil {
			err = c.Store.Delete(ctx)
			if err != nil {
				zap.L().Warn("Failed to delete device store",
					zap.String("instanceId", c.InstanceID),
					zap.Error(err),
				)
			} else {
				zap.L().Info("Device store deleted successfully",
					zap.String("instanceId", c.InstanceID),
				)
			}
		}
	}
	c.Connected = false
	return nil
}

// IsConnected returns whether the client is connected and has a valid session
func (c *Client) IsConnected() bool {
	if c.WA == nil {
		return false
	}

	// Check if whatsmeow thinks we're connected
	if !c.WA.IsConnected() {
		return false
	}

	// Also verify we have a valid device JID (session)
	if c.WA.Store == nil || c.WA.Store.ID == nil {
		return false
	}

	return true
}

// GetQRCodeBase64 generates a QR code image in base64
func (c *Client) GetQRCodeBase64(code string) (string, error) {
	png, err := qrcode.Encode(code, qrcode.Medium, 256)
	if err != nil {
		return "", err
	}
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(png), nil
}

// GetJID returns the JID of the connected account
func (c *Client) GetJID() types.JID {
	if c.WA.Store.ID != nil {
		return *c.WA.Store.ID
	}
	return types.JID{}
}

// DownloadMediaFromURL downloads media from a URL
func (c *Client) DownloadMediaFromURL(url string) ([]byte, string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	contentType := resp.Header.Get("Content-Type")
	return data, contentType, nil
}

// PairPhone pairs with a phone number
func (c *Client) PairPhone(phone string) (string, error) {
	if c.WA.Store.ID != nil {
		return "", fmt.Errorf("already connected")
	}

	// Ensure client is connected to WebSocket
	if !c.WA.IsConnected() {
		err := c.WA.Connect()
		if err != nil {
			return "", fmt.Errorf("failed to connect: %w", err)
		}
	}

	// Request pairing code
	// Ensure only numbers
	cleanPhone := ""
	for _, c := range phone {
		if c >= '0' && c <= '9' {
			cleanPhone += string(c)
		}
	}

	ctx := context.Background()
	code, err := c.WA.PairPhone(ctx, cleanPhone, true, whatsmeow.PairClientChrome, "Chrome (Windows)")
	if err != nil {
		return "", err
	}

	zap.L().Info("Pairing code requested",
		zap.String("instanceId", c.InstanceID),
		zap.String("phone", phone),
	)

	return code, nil
}
