package models

import "time"

// SendTextRequest represents the request to send a text message
type SendTextRequest struct {
	Number      string      `json:"number" binding:"required"`
	TextMessage TextMessage `json:"textMessage" binding:"required"`
	Options     *Options    `json:"options,omitempty"`
}

// TextMessage contains the text content
type TextMessage struct {
	Text string `json:"text" binding:"required"`
}

// SendMediaRequest represents the request to send a media message
type SendMediaRequest struct {
	Number       string      `json:"number" binding:"required"`
	MediaMessage MediaData   `json:"mediaMessage" binding:"required"`
	Options      *Options    `json:"options,omitempty"`
}

// MediaData contains media information
type MediaData struct {
	MediaType string `json:"mediatype" binding:"required"` // image, video, document
	MimeType  string `json:"mimetype,omitempty"`
	Caption   string `json:"caption,omitempty"`
	FileName  string `json:"fileName,omitempty"`
	Media     string `json:"media" binding:"required"` // URL or base64
}

// SendAudioRequest represents the request to send an audio message
type SendAudioRequest struct {
	Number       string    `json:"number" binding:"required"`
	AudioMessage AudioData `json:"audioMessage" binding:"required"`
	Options      *Options  `json:"options,omitempty"`
}

// AudioData contains audio information
type AudioData struct {
	Audio string `json:"audio" binding:"required"` // URL or base64
	PTT   bool   `json:"ptt,omitempty"`            // Push to talk (voice note)
}

// SendReactionRequest represents the request to send a reaction
type SendReactionRequest struct {
	Key      MessageKey `json:"key" binding:"required"`
	Reaction string     `json:"reaction" binding:"required"`
}

// MessageKey identifies a specific message
type MessageKey struct {
	RemoteJID string `json:"remoteJid" binding:"required"`
	FromMe    bool   `json:"fromMe"`
	ID        string `json:"id" binding:"required"`
}

// Options contains message options
type Options struct {
	Delay       int    `json:"delay,omitempty"`
	Presence    string `json:"presence,omitempty"`
	LinkPreview bool   `json:"linkPreview,omitempty"`
}

// MarkAsReadRequest represents the request to mark messages as read
type MarkAsReadRequest struct {
	ReadMessages []MessageKey `json:"readMessages" binding:"required"`
}

// SendPresenceRequest represents the request to send presence
type SendPresenceRequest struct {
	Number   string `json:"number" binding:"required"`
	Presence string `json:"presence" binding:"required"` // composing, recording, paused, unavailable, available
}

// CheckNumberRequest represents the request to check if numbers are on WhatsApp
type CheckNumberRequest struct {
	Numbers []string `json:"numbers" binding:"required"`
}

// CheckNumberResponse represents the response for checking numbers
type CheckNumberResponse struct {
	Number string `json:"number"`
	Exists bool   `json:"exists"`
	JID    string `json:"jid,omitempty"`
}

// MessageResponse represents the response after sending a message
type MessageResponse struct {
	Key       MessageKey `json:"key"`
	Message   any        `json:"message"`
	Status    string     `json:"status"`
	Timestamp time.Time  `json:"messageTimestamp"`
}

// WebhookEvent represents a webhook event
type WebhookEvent struct {
	Event    string      `json:"event"`
	Instance string      `json:"instance"`
	Data     interface{} `json:"data"`
}

// MessagesUpsertEvent represents the MESSAGES_UPSERT event data
type MessagesUpsertEvent struct {
	Key         MessageKey  `json:"key"`
	PushName    string      `json:"pushName"`
	Message     MessageInfo `json:"message"`
	MessageType string      `json:"messageType"`
	Status      string      `json:"status"`
	Timestamp   int64       `json:"messageTimestamp"`
}

// MessageInfo contains message details
type MessageInfo struct {
	Conversation       string         `json:"conversation,omitempty"`
	ExtendedTextMessage *ExtendedText  `json:"extendedTextMessage,omitempty"`
	ImageMessage       *ImageMessage  `json:"imageMessage,omitempty"`
	AudioMessage       *AudioMessage  `json:"audioMessage,omitempty"`
	VideoMessage       *VideoMessage  `json:"videoMessage,omitempty"`
	DocumentMessage    *DocumentMessage `json:"documentMessage,omitempty"`
}

// ExtendedText represents an extended text message
type ExtendedText struct {
	Text        string `json:"text"`
	MatchedText string `json:"matchedText,omitempty"`
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
}

// ImageMessage represents an image message
type ImageMessage struct {
	URL           string `json:"url"`
	MimeType      string `json:"mimetype"`
	Caption       string `json:"caption,omitempty"`
	FileSHA256    []byte `json:"fileSha256,omitempty"`
	FileLength    uint64 `json:"fileLength,omitempty"`
	MediaKey      []byte `json:"mediaKey,omitempty"`
	DirectPath    string `json:"directPath,omitempty"`
}

// AudioMessage represents an audio message
type AudioMessage struct {
	URL       string `json:"url"`
	MimeType  string `json:"mimetype"`
	Seconds   uint32 `json:"seconds,omitempty"`
	PTT       bool   `json:"ptt,omitempty"`
	MediaKey  []byte `json:"mediaKey,omitempty"`
}

// VideoMessage represents a video message
type VideoMessage struct {
	URL        string `json:"url"`
	MimeType   string `json:"mimetype"`
	Caption    string `json:"caption,omitempty"`
	Seconds    uint32 `json:"seconds,omitempty"`
	FileLength uint64 `json:"fileLength,omitempty"`
	MediaKey   []byte `json:"mediaKey,omitempty"`
}

// DocumentMessage represents a document message
type DocumentMessage struct {
	URL        string `json:"url"`
	MimeType   string `json:"mimetype"`
	Title      string `json:"title,omitempty"`
	FileName   string `json:"fileName,omitempty"`
	FileLength uint64 `json:"fileLength,omitempty"`
	MediaKey   []byte `json:"mediaKey,omitempty"`
}
