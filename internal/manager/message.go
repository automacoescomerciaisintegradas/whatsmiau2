package manager

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// SendText sends a text message to a recipient.
func (c *Client) SendText(instanceID, to, text string) error {
	payload := map[string]interface{}{
		"number": to,
		"text":   text,
	}
	resp, err := c.do(http.MethodPost, fmt.Sprintf("/message/sendText/%s", instanceID), payload)
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

// SendMedia sends a media message (image, video, document) to a recipient.
// mediaURL can be a URL or a data URI (base64).
func (c *Client) SendMedia(instanceID, to, mediaURL, caption string) error {
	payload := map[string]interface{}{
		"number":   to,
		"mediaUrl": mediaURL,
		"caption":  caption,
	}
	resp, err := c.do(http.MethodPost, fmt.Sprintf("/message/sendMedia/%s", instanceID), payload)
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
