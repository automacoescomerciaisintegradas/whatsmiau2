package handlers

import (
	"context"
	"net/http"
	"strings"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
)

// GroupHandler implements operations related to WhatsApp groups.
type GroupHandler struct {
	manager *whatsapp.Manager
	db      *database.Database
}

func NewGroupHandler(manager *whatsapp.Manager, db *database.Database) *GroupHandler {
	return &GroupHandler{manager: manager, db: db}
}

func (h *GroupHandler) getClient(instanceID string) (*whatsapp.Client, error) {
	if client, ok := h.manager.GetClient(instanceID); ok {
		return client, nil
	}
	// fallback by name
	inst, err := h.db.GetInstanceByName(instanceID)
	if err != nil {
		return nil, err
	}
	client, ok := h.manager.GetClient(inst.ID)
	if !ok {
		return nil, err
	}
	return client, nil
}

// ListGroups returns all groups the user participates in.
// GET /v1/group/list/:instance
func (h *GroupHandler) ListGroups(c *gin.Context) {
	instanceID := c.Param("instance")

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance not found"})
		return
	}

	if !client.IsConnected() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "instance is not connected"})
		return
	}

	ctx := context.Background()
	groups, err := client.WA.GetJoinedGroups(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Format response
	type GroupInfo struct {
		JID          string `json:"jid"`
		Name         string `json:"name"`
		OwnerJID     string `json:"ownerJid,omitempty"`
		Subject      string `json:"subject"`
		Participants int    `json:"participantCount"`
	}

	result := make([]GroupInfo, 0, len(groups))
	for _, g := range groups {
		result = append(result, GroupInfo{
			JID:          g.JID.String(),
			Name:         g.Name,
			OwnerJID:     g.OwnerJID.String(),
			Subject:      g.Name,
			Participants: len(g.Participants),
		})
	}

	c.JSON(http.StatusOK, result)
}

// GetInfo returns metadata of a specific group.
// GET /v1/group/info/:instance?jid=xxxxx@g.us
func (h *GroupHandler) GetInfo(c *gin.Context) {
	instanceID := c.Param("instance")
	jidStr := c.Query("jid")
	if jidStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "jid query param required"})
		return
	}
	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance not found"})
		return
	}
	jid, err := types.ParseJID(jidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid jid"})
		return
	}

	// Try adding context
	ctx := context.Background()
	info, err := client.WA.GetGroupInfo(ctx, jid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, info)
}

// CreateGroup creates a new group with a title and participants.
// POST /v1/group/create/:instance
func (h *GroupHandler) CreateGroup(c *gin.Context) {
	instanceID := c.Param("instance")

	var req struct {
		Title        string   `json:"title" binding:"required"`
		Participants []string `json:"participants" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance not found"})
		return
	}

	participantsJID := make([]types.JID, 0, len(req.Participants))
	for _, p := range req.Participants {
		if !strings.Contains(p, "@") {
			p += "@s.whatsapp.net"
		}

		jid, err := types.ParseJID(p)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":       "invalid participant JID",
				"participant": p,
			})
			return
		}
		participantsJID = append(participantsJID, jid)
	}

	groupReq := whatsmeow.ReqCreateGroup{
		Name:         req.Title,
		Participants: participantsJID,
	}

	// Fix: Add context.Background() as required by compiler
	ctx := context.Background()
	groupInfo, err := client.WA.CreateGroup(ctx, groupReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to create group",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"groupJID": groupInfo.JID.String(),
		"name":     groupInfo.Name,
	})
}

// AddParticipants adds users to an existing group.
// POST /v1/group/add/:instance
func (h *GroupHandler) AddParticipants(c *gin.Context) {
	instanceID := c.Param("instance")
	var req struct {
		GroupJID     string   `json:"groupJid" binding:"required"`
		Participants []string `json:"participants" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance not found"})
		return
	}
	groupJID, err := types.ParseJID(req.GroupJID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group jid"})
		return
	}

	participantsJID := make([]types.JID, 0, len(req.Participants))
	for _, p := range req.Participants {
		if !strings.Contains(p, "@") {
			p = p + "@s.whatsapp.net"
		}
		jid, parseErr := types.ParseJID(p)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid participant: " + p})
			return
		}
		participantsJID = append(participantsJID, jid)
	}

	ctx := context.Background()
	_, err = client.WA.UpdateGroupParticipants(ctx, groupJID, participantsJID, whatsmeow.ParticipantChangeAdd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "participants added"})
}

// RemoveParticipants removes users from a group.
// POST /v1/group/remove/:instance
func (h *GroupHandler) RemoveParticipants(c *gin.Context) {
	instanceID := c.Param("instance")
	var req struct {
		GroupJID     string   `json:"groupJid" binding:"required"`
		Participants []string `json:"participants" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance not found"})
		return
	}
	groupJID, err := types.ParseJID(req.GroupJID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group jid"})
		return
	}

	participantsJID := make([]types.JID, 0, len(req.Participants))
	for _, p := range req.Participants {
		if !strings.Contains(p, "@") {
			p = p + "@s.whatsapp.net"
		}
		jid, parseErr := types.ParseJID(p)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid participant: " + p})
			return
		}
		participantsJID = append(participantsJID, jid)
	}

	ctx := context.Background()
	_, err = client.WA.UpdateGroupParticipants(ctx, groupJID, participantsJID, whatsmeow.ParticipantChangeRemove)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "participants removed"})
}

// LeaveGroup makes the user leave a group.
// POST /v1/group/leave/:instance
func (h *GroupHandler) LeaveGroup(c *gin.Context) {
	instanceID := c.Param("instance")
	var req struct {
		GroupJID string `json:"groupJid" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance not found"})
		return
	}
	groupJID, err := types.ParseJID(req.GroupJID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group jid"})
		return
	}

	ctx := context.Background()
	err = client.WA.LeaveGroup(ctx, groupJID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "left group"})
}

// GetGroupInviteLink returns the invite link for a group.
// GET /v1/group/invite-link/:instance?group_id=xxxxx@g.us
func (h *GroupHandler) GetGroupInviteLink(c *gin.Context) {
	instanceID := c.Param("instance")
	groupID := c.Query("group_id")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group_id query param required"})
		return
	}

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance not found"})
		return
	}

	groupJID, err := types.ParseJID(groupID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group jid"})
		return
	}

	ctx := context.Background()
	link, err := client.WA.GetGroupInviteLink(ctx, groupJID, false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// whatsmeow.GetGroupInviteLink returns the code, e.g. ABC123XYZ456DEF
	// but the user wants the full link
	if !strings.HasPrefix(link, "http") {
		link = "https://chat.whatsapp.com/" + link
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Success",
		"results": gin.H{
			"link": link,
		},
	})
}

// GetGroupByJID returns full group info including participant list with phone numbers.
// GET /v1/whatsmiau2/groups/:jid?instance=xxx
// Used by the contact export feature.
func (h *GroupHandler) GetGroupByJID(c *gin.Context) {
	jidStr := c.Param("jid")
	instanceID := c.Query("instance")
	if instanceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "instance query param required"})
		return
	}

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "instance not found"})
		return
	}

	if !client.IsConnected() {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "instance is not connected"})
		return
	}

	jid, err := types.ParseJID(jidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid jid: " + jidStr})
		return
	}

	ctx := context.Background()
	info, err := client.WA.GetGroupInfo(ctx, jid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Build a participant list with phone numbers and roles
	type ParticipantOut struct {
		JID     string `json:"JID"`
		Number  string `json:"PhoneNumber"`
		IsAdmin bool   `json:"IsAdmin"`
		Role    string `json:"role"`
	}

	parts := make([]ParticipantOut, 0, len(info.Participants))
	for _, p := range info.Participants {
		number := p.JID.User // e.g. "558899999999"
		isAdmin := p.IsAdmin || p.IsSuperAdmin
		role := "member"
		if p.IsSuperAdmin {
			role = "superadmin"
		} else if p.IsAdmin {
			role = "admin"
		}
		parts = append(parts, ParticipantOut{
			JID:     p.JID.String(),
			Number:  number,
			IsAdmin: isAdmin,
			Role:    role,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"JID":              info.JID.String(),
			"Name":             info.Name,
			"Subject":          info.Name,
			"ParticipantCount": len(info.Participants),
			"Participants":     parts,
		},
	})
}
