package server

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"whatsmiau2/internal/config"
	"whatsmiau2/internal/crm"
	"whatsmiau2/internal/database"
	"whatsmiau2/internal/handlers"
	"whatsmiau2/internal/middleware"
	"whatsmiau2/internal/services"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Server represents the HTTP server
type Server struct {
	config    *config.Config
	router    *gin.Engine
	db        *database.Database
	manager   *whatsapp.Manager
	crmServer *crm.Server
}

// New creates a new server
func New(cfg *config.Config, db *database.Database, manager *whatsapp.Manager) *Server {
	// Set Gin mode based on debug
	if cfg.DebugMode {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CORSMiddleware())

	// Initialize CRM Server
	// Get *sql.DB from GORM
	sqlDB, err := db.DB.DB()
	if err != nil {
		zap.L().Fatal("Failed to get SQL DB from GORM", zap.Error(err))
	}
	crmServer := crm.NewServerWithManager(sqlDB, manager)

	server := &Server{
		config:    cfg,
		router:    router,
		db:        db,
		manager:   manager,
		crmServer: crmServer,
	}

	server.setupRoutes()

	return server
}

// setupRoutes configures all API routes
func (s *Server) setupRoutes() {
	// Create handlers
	instanceHandler := handlers.NewInstanceHandler(s.manager, s.db)
	messageHandler := handlers.NewMessageHandler(s.manager, s.db)
	chatHandler := handlers.NewChatHandler(s.manager, s.db)
	newsletterHandler := handlers.NewNewsletterHandler(s.manager, s.db)
	appHandler := handlers.NewAppHandler(s.manager, s.db)
	groupHandler := handlers.NewGroupHandler(s.manager, s.db)
	authHandler := handlers.NewAuthHandler(s.manager, s.db)
	contactHandler := handlers.NewContactHandler(s.manager, s.db)

	// Initialize new services
	notSv := services.NewNotifierService(s.config)
	subSv := crm.NewSubscriptionService(s.db)
	mpSv := services.NewMercadoPagoService(s.config)
	telnyxSv := services.NewTelnyxService(s.config)
	callMgr := services.NewCallManager()

	// Initialize handlers
	telnyxWebhookHandler := handlers.NewTelnyxWebhookHandler(callMgr, telnyxSv)
	monitoringSv := services.NewMonitoringService(s.db.DB)
	monitoringSv.StartPeriodicFlush(5 * time.Minute) // Flush a cada 5 minutos

	// Initialize dashboard handler
	dashboardHandler := handlers.NewDashboardHandler(monitoringSv, s.manager)
	
	// Initialize SIP Handler
	sipHandler := handlers.NewSIPHandler(telnyxSv, s.db)

	// Set the OnAudioMessage callback to handle SIP Audio routing
	s.manager.OnAudioMessage = func(instanceID string, audioBytes []byte, mimeType string, sender string) {
		// Get instance config
		instance, err := s.db.GetInstance(instanceID)
		if err != nil || instance.SIPDestination == "" {
			return // Not configured for SIP Gateway or PBX Destination
		}
		
		// 1. Save audio to public/media_cache
		fileName := fmt.Sprintf("%s_%d.ogg", instanceID, time.Now().UnixNano())
		filePath := filepath.Join("public", "media_cache", fileName)
		if err := os.WriteFile(filePath, audioBytes, 0644); err != nil {
			zap.L().Error("Failed to save audio cache", zap.Error(err))
			return
		}

		audioURL := fmt.Sprintf("%s/media_cache/%s", s.config.PublicURL, fileName)
		
		// 2. Trigger Telnyx CallPBX
		callControlID, err := telnyxSv.CallPBX(instance.SIPDestination, audioURL, instanceID)
		if err == nil {
			// Save the intention to play audio when PBX answers
			callMgr.AddCall(&services.CallSession{
				CallControlID: callControlID,
				InstanceID:    instanceID,
				Destination:   instance.SIPDestination,
				Status:        "initiated",
				AudioToPlay:   audioURL,
				CreatedAt:     time.Now(),
			})
		}
	}

	// Seed Plans
	if err := subSv.SeedPlans(); err != nil {
		zap.L().Error("Failed to seed plans", zap.Error(err))
	}

	// Initialize new handlers

	paymentWebhookHandler := handlers.NewPaymentWebhookHandler(s.config, subSv, notSv)
	subscriptionHandler := handlers.NewSubscriptionHandler(s.config, s.db, subSv, mpSv)

	// Health check (no auth required)
	s.router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "whatsmiau2",
		})
	})

	// API version 1
	v1 := s.router.Group("/v1")
	v1.Use(middleware.AuthMiddleware(s.config))
	{
		// Instance routes - Evolution API compatibility routes (must come first to avoid conflicts)
		instance := v1.Group("/instance")
		{
			// Evolution API compatibility routes
			instance.POST("/create", instanceHandler.CreateInstance)
			instance.GET("/fetchInstances", instanceHandler.ListInstances)
			instance.GET("/connect/:id", instanceHandler.ConnectInstance)
			instance.GET("/connectionState/:id", instanceHandler.GetInstanceStatus)
			instance.DELETE("/logout/:id", instanceHandler.LogoutInstance)
			instance.DELETE("/delete/:id", instanceHandler.DeleteInstance)
			instance.PUT("/update/:id", instanceHandler.UpdateInstance)
			// Phone pairing route
			instance.POST("/pairPhone/:id", instanceHandler.PairPhoneInstance)

			// Webhook configuration routes
			instance.GET("/webhook/:id", instanceHandler.GetWebhookConfig)
			instance.PUT("/webhook/:id", instanceHandler.UpdateWebhookConfig)
			instance.POST("/webhook/:id/test", instanceHandler.TestWebhook)

			// SIP Gateway Integration routes
			instance.POST("/sip/:id/setup", sipHandler.SetupSIPConnection)
			instance.GET("/sip/:id", sipHandler.GetSIPConfig)

			// Standard routes (base routes, no path prefix)
			instance.POST("", instanceHandler.CreateInstance)
			instance.GET("", instanceHandler.ListInstances)
		}

		// Instance actions with :id parameter - separate group to avoid conflicts
		v1.POST("/instance/:id/connect", instanceHandler.ConnectInstance)
		v1.POST("/instance/:id/pairPhone", instanceHandler.PairPhoneInstance)
		v1.POST("/instance/:id/logout", instanceHandler.LogoutInstance)
		v1.DELETE("/instance/:id", instanceHandler.DeleteInstance)
		v1.GET("/instance/:id/status", instanceHandler.GetInstanceStatus)

		// App routes (login, logout, reconnect, devices)
		app := v1.Group("/app")
		{
			app.GET("/login/:instance", appHandler.Login)
			app.POST("/login-with-code/:instance", appHandler.LoginWithCode)
			app.GET("/logout/:instance", appHandler.Logout)
			app.GET("/reconnect/:instance", appHandler.Reconnect)
			app.GET("/devices/:instance", appHandler.ListDevices)
		}

		// Protected groups with PlanGuard (High Value Features)
		premium := v1.Group("")
		// TEMPORARY: Commented out for local development
		// premium.Use(middleware.PlanGuard(subSv))
		{
			// Message routes
			message := premium.Group("/message")
			{
				message.POST("/sendText/:instance", messageHandler.SendText)
				message.POST("/sendWhatsAppAudio/:instance", messageHandler.SendAudio)
				message.POST("/sendMedia/:instance", messageHandler.SendMedia)
				message.POST("/sendReaction/:instance", messageHandler.SendReaction)
			}

			// Standard message aliases
			premium.POST("/send/:instance/text", messageHandler.SendText)
			premium.POST("/send/:instance/audio", messageHandler.SendAudio)
			premium.POST("/send/:instance/image", messageHandler.SendMedia)
			premium.POST("/send/:instance/document", messageHandler.SendMedia)

			// Chat routes
			chat := premium.Group("/chat")
			{
				chat.POST("/markMessageAsRead/:instance", chatHandler.MarkAsRead)
				chat.POST("/sendPresence/:instance", chatHandler.SendPresence)
				chat.POST("/whatsappNumbers/:instance", chatHandler.CheckWhatsAppNumbers)
				chat.POST("/getProfilePic/:instance", chatHandler.GetProfilePicture)
				chat.GET("/getProfilePic/:instance", chatHandler.GetProfilePicture)
				chat.POST("/fetchStatus/:instance", chatHandler.GetUserStatus)
			}

			// Newsletter routes
			newsletter := premium.Group("/newsletter")
			{
				newsletter.GET("/list/:instance", newsletterHandler.ListNewsletters)
				newsletter.POST("/follow/:instance", newsletterHandler.FollowNewsletter)
				newsletter.POST("/unfollow/:instance", newsletterHandler.UnfollowNewsletter)
				newsletter.POST("/send/:instance", newsletterHandler.SendMessage)
				newsletter.GET("/:instance/info", newsletterHandler.GetNewsletterInfo)
			}

			// Group routes
			group := premium.Group("/group")
			{
				group.GET("/list/:instance", groupHandler.ListGroups)
				group.GET("/info/:instance", groupHandler.GetInfo)
				group.POST("/create/:instance", groupHandler.CreateGroup)
				group.POST("/add/:instance", groupHandler.AddParticipants)
				group.POST("/remove/:instance", groupHandler.RemoveParticipants)
				group.POST("/leave/:instance", groupHandler.LeaveGroup)
				group.GET("/invite-link/:instance", groupHandler.GetGroupInviteLink)
			}

			// Contact routes
			contact := premium.Group("/whatsmiau2")
			{
				contact.GET("/contacts", contactHandler.ListContacts)
				contact.GET("/contacts/:id", contactHandler.GetContact)
				contact.POST("/contacts", contactHandler.CreateContact)
				contact.PUT("/contacts/:id", contactHandler.UpdateContact)
				contact.DELETE("/contacts/:id", contactHandler.DeleteContact)
				// Group details by JID (used by export feature)
				contact.GET("/groups/:jid", groupHandler.GetGroupByJID)
			}

			// CRM routes
			crmGrp := premium.Group("/crm")
			{
				// Leads
				crmGrp.POST("/leads", s.crmServer.CreateLead)
				crmGrp.GET("/leads", s.crmServer.ListLeads)
				crmGrp.GET("/leads/:id", s.crmServer.GetLead)
				crmGrp.PUT("/leads/:id", s.crmServer.UpdateLead)
				crmGrp.DELETE("/leads/:id", s.crmServer.DeleteLead)
				crmGrp.GET("/leads/stats", s.crmServer.GetLeadStats)

				// Tickets
				crmGrp.GET("/tickets", s.crmServer.ListTickets)
				crmGrp.POST("/tickets", s.crmServer.CreateTicket)
				crmGrp.PATCH("/tickets/:id", s.crmServer.UpdateTicketStatus)
				crmGrp.DELETE("/tickets/:id", s.crmServer.DeleteTicket)

				// Automation (Premium Feature)
				automation := crmGrp.Group("/automation")
				{
					automation.POST("/rules", s.crmServer.CreateAutomationRule)
					automation.GET("/rules", s.crmServer.ListAutomationRules)
					automation.GET("/rules/:id", s.crmServer.GetAutomationRule)
					automation.PUT("/rules/:id", s.crmServer.UpdateAutomationRule)
					automation.DELETE("/rules/:id", s.crmServer.DeleteAutomationRule)
					automation.POST("/trigger", s.crmServer.TriggerAutomation)
				}
			}
		}

		// Standard chat aliases (Outside premium if desired, or keep inside)
		premium.POST("/chat/:instance/presence", chatHandler.SendPresence)
		premium.POST("/chat/:instance/read-messages", chatHandler.MarkAsRead)
		premium.POST("/chat/:instance/whatsapp-numbers", chatHandler.CheckWhatsAppNumbers)
		premium.POST("/chat/:instance/profile-picture", chatHandler.GetProfilePicture)
		premium.POST("/chat/:instance/status", chatHandler.GetUserStatus)

		// Dashboard and Monitoring routes
		dashboard := premium.Group("/dashboard")
		{
			dashboard.GET("/summary", dashboardHandler.GetSummary)
			dashboard.GET("/sessions/active", dashboardHandler.GetActiveSessions)
			dashboard.GET("/instances/:instance/stats", dashboardHandler.GetInstanceStats)
			dashboard.GET("/instances/:instance/daily", dashboardHandler.GetDailyStats)
			dashboard.GET("/instances/:instance/hourly", dashboardHandler.GetHourlyStats)
			dashboard.GET("/realtime", dashboardHandler.GetRealtimeStatus)
			dashboard.GET("/health", dashboardHandler.GetSystemHealth)
			dashboard.GET("/charts/messages", dashboardHandler.GetMessagesChart)
		}

		// Subscription Routes (v1 style)
		v1.GET("/plans", subscriptionHandler.ListPlans)
		v1.GET("/subscription/me", subscriptionHandler.GetMySubscription)
		v1.POST("/subscription/checkout", subscriptionHandler.CreateCheckout)
		v1.PATCH("/subscription/change-plan", subscriptionHandler.ChangePlan)
		v1.POST("/enterprise/leads", subscriptionHandler.CreateEnterpriseLead)

		// Contact routes for API compatibility
		api := s.router.Group("/api")
		api.Use(middleware.AuthMiddleware(s.config)) // Using the same middleware as v1
		{
			// Contact routes for API compatibility
			contactAPI := api.Group("/whatsmiau2")
			{
				contactAPI.GET("/contacts", contactHandler.ListContacts)
				contactAPI.GET("/contacts/:id", contactHandler.GetContact)
				contactAPI.POST("/contacts", contactHandler.CreateContact)
				contactAPI.PUT("/contacts/:id", contactHandler.UpdateContact)
				contactAPI.DELETE("/contacts/:id", contactHandler.DeleteContact)
			}

			// Other API routes
			api.GET("/plans", subscriptionHandler.ListPlans)
			api.GET("/subscriptions/me", subscriptionHandler.GetMySubscription)
			api.POST("/subscriptions", subscriptionHandler.CreateCheckout)
			api.PATCH("/subscriptions/change-plan", subscriptionHandler.ChangePlan)
			api.POST("/enterprise/leads", subscriptionHandler.CreateEnterpriseLead)
		}

		// Admin/Manual Cancel
		v1.POST("/admin/subscription/:id/cancel", paymentWebhookHandler.HandleManualCancel)
	}

	// Webhooks (Public)
	webhooks := s.router.Group("/v1/webhooks")
	{
		webhooks.POST("/mercadopago", paymentWebhookHandler.Handle)
		// Legacy endpoint for compatibility
		webhooks.POST("/payment", paymentWebhookHandler.Handle)
		// Telnyx Call Control Webhook
		webhooks.POST("/telnyx/events", telnyxWebhookHandler.HandleEvent)
	}

	// Authentication routes (no auth required for login/register)
	auth := s.router.Group("/v1/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/forgot-password", authHandler.ForgotPassword)
		auth.GET("/me", authHandler.GetCurrentUser)
		auth.DELETE("/me", authHandler.DeleteAccount)
	}

	// Serve static files (HTML, CSS, JS)
	s.router.Static("/static", "./")
	s.router.Static("/assets", "./public/assets")
	// Landing page pública na raiz; dashboard permanece em /dashboard.
	s.router.StaticFile("/", "./public/home.html")
	s.router.StaticFile("/index.html", "./public/index.html")
	s.router.StaticFile("/home", "./public/home.html")
	s.router.StaticFile("/home.html", "./public/home.html")
	s.router.StaticFile("/login.html", "./public/login.html")
	s.router.StaticFile("/register.html", "./public/register.html")
	s.router.StaticFile("/forgot-password.html", "./public/forgot-password.html")
	s.router.StaticFile("/profile.html", "./public/profile.html")
	s.router.StaticFile("/manager.html", "./public/manager.html")
	s.router.StaticFile("/manager-socket.js", "./public/manager-socket.js")
	s.router.StaticFile("/crm.html", "./public/crm-full.html")
	s.router.StaticFile("/automacao.html", "./public/automacao.html")
	s.router.StaticFile("/pairing.html", "./public/pairing.html")
	s.router.StaticFile("/pairing", "./public/pairing.html")
	s.router.StaticFile("/instancias.html", "./public/instancias.html")
	s.router.StaticFile("/disparador.html", "./public/disparador.html")
	s.router.StaticFile("/styles.css", "./public/styles.css")
	s.router.StaticFile("/subscription.html", "./public/subscription.html")
	s.router.StaticFile("/subscription-simple.html", "./public/subscription-simple.html")
	s.router.StaticFile("/test_subscription_page.html", "./test_subscription_page.html")
	s.router.StaticFile("/docs", "./public/docs.html")
	s.router.StaticFile("/docs.html", "./public/docs.html")
	s.router.Static("/docs-assets", "./docs")
	s.router.Static("/media_cache", "./public/media_cache")
	s.router.StaticFile("/webhooks.html", "./public/webhooks.html")
	s.router.StaticFile("/channels.html", "./public/channels.html")
	s.router.StaticFile("/groups.html", "./public/groups.html")
	s.router.StaticFile("/contacts.html", "./public/contacts.html")
	s.router.StaticFile("/tickets.html", "./public/tickets.html")
	s.router.StaticFile("/kanban.html", "./public/kanban.html")
	s.router.StaticFile("/settings.html", "./public/settings.html")
	s.router.StaticFile("/internal-chat.html", "./public/internal-chat.html")

	// Extensionless Aliases (Match Sidebar Links)
	s.router.StaticFile("/dashboard", "./public/index.html")
	s.router.StaticFile("/connections", "./public/instancias.html")
	s.router.StaticFile("/disparador", "./public/disparador.html")
	s.router.StaticFile("/contacts", "./public/contacts.html")
	s.router.StaticFile("/webhooks", "./public/webhooks.html")
	s.router.StaticFile("/crm-full", "./public/crm-full.html")
	s.router.StaticFile("/resumo-grupos", "./public/groups.html")
	s.router.StaticFile("/exportar-contatos", "./public/exportar-contatos.html")
	s.router.StaticFile("/automacao", "./public/automacao.html")
	s.router.StaticFile("/tickets", "./public/tickets.html")
	s.router.StaticFile("/kanban", "./public/kanban.html")
	s.router.StaticFile("/settings", "./public/settings.html")
	s.router.StaticFile("/internal-chat", "./public/internal-chat.html")
	s.router.StaticFile("/crm-new", "./public/crm-new.html")

	// Additional aliases without extensions for important pages
	s.router.StaticFile("/login", "./public/login.html")
	s.router.StaticFile("/register", "./public/register.html")
	s.router.StaticFile("/profile", "./public/profile.html")
	s.router.StaticFile("/subscription", "./public/subscription.html")
	s.router.StaticFile("/channels", "./public/channels.html")
	s.router.StaticFile("/crm", "./public/crm-full.html")
	s.router.StaticFile("/groups", "./public/groups.html")
	s.router.StaticFile("/instancias", "./public/instancias.html")
	s.router.StaticFile("/forgot-password", "./public/forgot-password.html")

	// AI Agents pages
	s.router.StaticFile("/ai-agents", "./public/ai-agents.html")
	s.router.StaticFile("/ai-agents.html", "./public/ai-agents.html")
	s.router.StaticFile("/agent-builder", "./public/agent-builder.html")
	s.router.StaticFile("/agent-builder.html", "./public/agent-builder.html")

	// Automação pages
	s.router.StaticFile("/automacao-dashboard", "./public/automacao-dashboard.html")
	s.router.StaticFile("/automacao-dashboard.html", "./public/automacao-dashboard.html")
	s.router.StaticFile("/automacao-editor", "./public/automacao-editor.html")
	s.router.StaticFile("/automacao-editor.html", "./public/automacao-editor.html")

	// Resumo grupos (correto)
	s.router.StaticFile("/resumo-grupos.html", "./public/resumo-grupos.html")

	// Utility pages
	s.router.StaticFile("/test-qr", "./public/test-qr.html")
	s.router.StaticFile("/test-qr.html", "./public/test-qr.html")
	s.router.StaticFile("/debug-connections", "./public/debug-connections.html")
	s.router.StaticFile("/debug-connections.html", "./public/debug-connections.html")
	s.router.StaticFile("/subscription-simple", "./public/subscription-simple.html")
	s.router.StaticFile("/crm-full.html", "./public/crm-full.html")
	s.router.StaticFile("/crm-new.html", "./public/crm-new.html")
	s.router.StaticFile("/exportar-contatos.html", "./public/exportar-contatos.html")

	zap.L().Info("Routes configured successfully")

}

// Run starts the HTTP server
func (s *Server) Run() error {
	addr := fmt.Sprintf(":%s", s.config.Port)
	zap.L().Info("Starting server", zap.String("address", addr))
	return s.router.Run(addr)
}

// Router returns the Gin router for testing
func (s *Server) Router() *gin.Engine {
	return s.router
}
