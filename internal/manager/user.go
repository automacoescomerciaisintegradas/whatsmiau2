package manager

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type UserInfo struct {
	JID      string `json:"jid"`
	PushName string `json:"pushName"`
	// add other fields as needed
}

type AvatarInfo struct {
	URL  string `json:"url"`
	ID   string `json:"id"`
	Type string `json:"type"`
}

// GetInfo returns basic user information.
func (c *Client) GetInfo(instanceID string) (*UserInfo, error) {
	resp, err := c.do(http.MethodGet, fmt.Sprintf("/user/info/%s", instanceID), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var info UserInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}
	return &info, nil
}

// GetAvatar fetches the user's avatar. preview=true returns a thumbnail.
func (c *Client) GetAvatar(instanceID string, preview bool) (*AvatarInfo, error) {
	path := fmt.Sprintf("/user/avatar/%s?preview=%t", instanceID, preview)
	resp, err := c.do(http.MethodGet, path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var avatar AvatarInfo
	if err := json.NewDecoder(resp.Body).Decode(&avatar); err != nil {
		return nil, err
	}
	return &avatar, nil
}

// ChangeAvatar updates the user's avatar. media can be a URL or base64 data URI.
func (c *Client) ChangeAvatar(instanceID, media string) error {
	payload := map[string]string{"media": media}
	resp, err := c.do(http.MethodPost, fmt.Sprintf("/user/avatar/%s", instanceID), payload)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	return nil
}

// ChangePushName updates the display name (push name).
func (c *Client) ChangePushName(instanceID, name string) error {
	payload := map[string]string{"name": name}
	resp, err := c.do(http.MethodPost, fmt.Sprintf("/user/pushname/%s", instanceID), payload)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	return nil
}

// GetPrivacy returns the user's privacy settings.
func (c *Client) GetPrivacy(instanceID string) (map[string]interface{}, error) {
	resp, err := c.do(http.MethodGet, fmt.Sprintf("/user/privacy/%s", instanceID), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}
	return data, nil
}

// GetGroups returns the list of groups the user participates in.
func (c *Client) GetGroups(instanceID string) ([]map[string]interface{}, error) {
	resp, err := c.do(http.MethodGet, fmt.Sprintf("/user/groups/%s", instanceID), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var groups []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&groups); err != nil {
		return nil, err
	}
	return groups, nil
}

// GetNewsletter returns the list of newsletters (channels) the user follows.
func (c *Client) GetNewsletter(instanceID string) ([]map[string]interface{}, error) {
	resp, err := c.do(http.MethodGet, fmt.Sprintf("/user/newsletters/%s", instanceID), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var list []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// GetContacts returns the user's contacts.
func (c *Client) GetContacts(instanceID string) (map[string]interface{}, error) {
	resp, err := c.do(http.MethodGet, fmt.Sprintf("/user/contacts/%s", instanceID), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var contacts map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&contacts); err != nil {
		return nil, err
	}
	return contacts, nil
}

// CheckUser verifies if numbers are on WhatsApp.
func (c *Client) CheckUser(instanceID string, numbers []string) (map[string]interface{}, error) {
	payload := map[string][]string{"numbers": numbers}
	resp, err := c.do(http.MethodPost, fmt.Sprintf("/user/check/%s", instanceID), payload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result, nil
}

// GetBusinessProfile returns business profile information.
func (c *Client) GetBusinessProfile(instanceID string) (map[string]interface{}, error) {
	resp, err := c.do(http.MethodGet, fmt.Sprintf("/user/business/%s", instanceID), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	var profile map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		return nil, err
	}
	return profile, nil
}
