package manager

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// NewsletterInfo represents information about a newsletter/channel.
type NewsletterInfo struct {
	JID         string `json:"jid"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Subscribers int    `json:"subscribers"`
}

// FollowNewsletter follows a newsletter (WhatsApp channel).
func (c *Client) FollowNewsletter(instanceID, newsletterJID string) error {
	payload := map[string]interface{}{
		"jid": newsletterJID,
	}
	resp, err := c.do(http.MethodPost, fmt.Sprintf("/newsletter/follow/%s", instanceID), payload)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		var apiErr struct {
			Message string `json:"message"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err == nil && apiErr.Message != "" {
			return fmt.Errorf("API error %d: %s", resp.StatusCode, apiErr.Message)
		}
		return fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	return nil
}

// UnfollowNewsletter unfollows a newsletter (WhatsApp channel).
func (c *Client) UnfollowNewsletter(instanceID, newsletterJID string) error {
	payload := map[string]interface{}{
		"jid": newsletterJID,
	}
	resp, err := c.do(http.MethodPost, fmt.Sprintf("/newsletter/unfollow/%s", instanceID), payload)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		var apiErr struct {
			Message string `json:"message"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err == nil && apiErr.Message != "" {
			return fmt.Errorf("API error %d: %s", resp.StatusCode, apiErr.Message)
		}
		return fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	return nil
}

// GetNewsletterInfo retrieves information about a newsletter.
func (c *Client) GetNewsletterInfo(instanceID, newsletterJID string) (*NewsletterInfo, error) {
	resp, err := c.do(http.MethodGet, fmt.Sprintf("/newsletter/%s/info?jid=%s", instanceID, newsletterJID), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var apiErr struct {
			Message string `json:"message"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err == nil && apiErr.Message != "" {
			return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, apiErr.Message)
		}
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}

	var result NewsletterInfo
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}
