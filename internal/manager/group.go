package manager

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type GroupInfo struct {
	JID   string `json:"jid"`
	Title string `json:"title"`
	// add other fields as needed
}

// ListGroups returns all groups for the instance.
func (c *Client) ListGroups(instanceID string) ([]GroupInfo, error) {
	resp, err := c.do(http.MethodGet, fmt.Sprintf("/group/list/%s", instanceID), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var groups []GroupInfo
	if err := json.NewDecoder(resp.Body).Decode(&groups); err != nil {
		return nil, err
	}
	return groups, nil
}

// GetGroupInfo returns metadata of a specific group (jid passed as query param).
func (c *Client) GetGroupInfo(instanceID, jid string) (*GroupInfo, error) {
	path := fmt.Sprintf("/group/info/%s?jid=%s", instanceID, jid)
	resp, err := c.do(http.MethodGet, path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var info GroupInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}
	return &info, nil
}

// CreateGroup creates a new group with title and participants (numbers).
func (c *Client) CreateGroup(instanceID, title string, participants []string) (string, error) {
	payload := map[string]interface{}{"title": title, "participants": participants}
	resp, err := c.do(http.MethodPost, fmt.Sprintf("/group/create/%s", instanceID), payload)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var result struct {
		GroupJID string `json:"groupJID"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	return result.GroupJID, nil
}

// AddParticipants adds participants to an existing group.
func (c *Client) AddParticipants(instanceID, groupJID string, participants []string) error {
	payload := map[string]interface{}{"groupJid": groupJID, "participants": participants}
	resp, err := c.do(http.MethodPost, fmt.Sprintf("/group/add/%s", instanceID), payload)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	return nil
}

// RemoveParticipants removes participants from a group.
func (c *Client) RemoveParticipants(instanceID, groupJID string, participants []string) error {
	payload := map[string]interface{}{"groupJid": groupJID, "participants": participants}
	resp, err := c.do(http.MethodPost, fmt.Sprintf("/group/remove/%s", instanceID), payload)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	return nil
}

// LeaveGroup makes the instance leave the group.
func (c *Client) LeaveGroup(instanceID, groupJID string) error {
	payload := map[string]string{"groupJid": groupJID}
	resp, err := c.do(http.MethodPost, fmt.Sprintf("/group/leave/%s", instanceID), payload)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	return nil
}
