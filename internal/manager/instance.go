package manager

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Instance struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Connected bool   `json:"connected"`
	// add other fields as needed
}

// CreateInstance creates a new instance.
func (c *Client) CreateInstance(name string) (*Instance, error) {
	payload := map[string]string{"name": name}
	resp, err := c.do(http.MethodPost, "/instance/create", payload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var result Instance
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

// ConnectInstance triggers a connection (QR or phone pairing).
func (c *Client) ConnectInstance(id string) (*Instance, error) {
	resp, err := c.do(http.MethodGet, fmt.Sprintf("/instance/connect/%s", id), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var result Instance
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

// LogoutInstance removes the session and DB.
func (c *Client) LogoutInstance(id string) error {
	resp, err := c.do(http.MethodDelete, fmt.Sprintf("/instance/logout/%s", id), nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	return nil
}

// ListInstances returns all instances registered in the server.
func (c *Client) ListInstances() ([]Instance, error) {
	resp, err := c.do(http.MethodGet, "/instance/fetchInstances", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var result []Instance
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result, nil
}

// GetInstanceStatus returns the connection status of an instance.
func (c *Client) GetInstanceStatus(id string) (*Instance, error) {
	resp, err := c.do(http.MethodGet, fmt.Sprintf("/instance/connectionState/%s", id), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var result Instance
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}
