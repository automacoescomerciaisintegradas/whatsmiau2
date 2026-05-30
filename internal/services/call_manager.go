package services

import (
	"sync"
	"time"

	"go.uber.org/zap"
)

// CallSession representa uma chamada ativa entre o PBX(SIP) e o WhatsApp
type CallSession struct {
	CallControlID string
	ConnectionID  string
	InstanceID    string
	Destination   string
	Status        string // initiated, ringing, answered, completed
	AudioToPlay   string // URL do áudio recebido do WhatsApp para tocar quando atender
	CreatedAt     time.Time
}

// CallManager is responsible for keeping track of active calls
type CallManager struct {
	mu           sync.RWMutex
	activeCalls  map[string]*CallSession // map[CallControlID]*CallSession
}

// NewCallManager initializes a new Call Manager
func NewCallManager() *CallManager {
	return &CallManager{
		activeCalls: make(map[string]*CallSession),
	}
}

// AddCall registers a new call session
func (cm *CallManager) AddCall(session *CallSession) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.activeCalls[session.CallControlID] = session
	zap.L().Info("New call session tracked", zap.String("CallControlID", session.CallControlID))
}

// GetCall retrieves a call session by its control ID
func (cm *CallManager) GetCall(callControlID string) (*CallSession, bool) {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	session, exists := cm.activeCalls[callControlID]
	return session, exists
}

// UpdateCallStatus updates the status of an active call
func (cm *CallManager) UpdateCallStatus(callControlID string, status string) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	if session, exists := cm.activeCalls[callControlID]; exists {
		session.Status = status
		zap.L().Debug("Call status updated", zap.String("CallControlID", callControlID), zap.String("Status", status))
	}
}

// RemoveCall deletes a call session when it's completed or failed
func (cm *CallManager) RemoveCall(callControlID string) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	delete(cm.activeCalls, callControlID)
	zap.L().Info("Call session removed", zap.String("CallControlID", callControlID))
}
