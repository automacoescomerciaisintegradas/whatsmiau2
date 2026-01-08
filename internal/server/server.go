package server

import (
	"fmt"
	"net/http"

	"whatsmiau2/internal/config"
	"whatsmiau2/internal/crm"
	"whatsmiau2/internal/database"
	"whatsmiau2/internal/handlers"
	"whatsmiau2/internal/middleware"
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

		// Message routes - Evolution API compatibility
		message := v1.Group("/message")
		{
			message.POST("/sendText/:instance", messageHandler.SendText)
			message.POST("/sendWhatsAppAudio/:instance", messageHandler.SendAudio)
			message.POST("/sendMedia/:instance", messageHandler.SendMedia)
			message.POST("/sendReaction/:instance", messageHandler.SendReaction)
		}

		// Standard message routes (using different path pattern)
		v1.POST("/send/:instance/text", messageHandler.SendText)
		v1.POST("/send/:instance/audio", messageHandler.SendAudio)
		v1.POST("/send/:instance/image", messageHandler.SendMedia)
		v1.POST("/send/:instance/document", messageHandler.SendMedia)

		// Chat routes - Evolution API compatibility
		chat := v1.Group("/chat")
		{
			chat.POST("/markMessageAsRead/:instance", chatHandler.MarkAsRead)
			chat.POST("/sendPresence/:instance", chatHandler.SendPresence)
			chat.POST("/whatsappNumbers/:instance", chatHandler.CheckWhatsAppNumbers)
			chat.POST("/getProfilePic/:instance", chatHandler.GetProfilePicture)
			chat.GET("/getProfilePic/:instance", chatHandler.GetProfilePicture)
			chat.POST("/fetchStatus/:instance", chatHandler.GetUserStatus)
		}

		// Standard chat routes
		v1.POST("/chat/:instance/presence", chatHandler.SendPresence)
		v1.POST("/chat/:instance/read-messages", chatHandler.MarkAsRead)
		v1.POST("/chat/:instance/whatsapp-numbers", chatHandler.CheckWhatsAppNumbers)
		v1.POST("/chat/:instance/profile-picture", chatHandler.GetProfilePicture)
		v1.POST("/chat/:instance/status", chatHandler.GetUserStatus)

		// Newsletter routes
		newsletter := v1.Group("/newsletter")
		{
			newsletter.GET("/list/:instance", newsletterHandler.ListNewsletters)
			newsletter.POST("/follow/:instance", newsletterHandler.FollowNewsletter)
			newsletter.POST("/unfollow/:instance", newsletterHandler.UnfollowNewsletter)
			newsletter.POST("/send/:instance", newsletterHandler.SendMessage)
			newsletter.GET("/:instance/info", newsletterHandler.GetNewsletterInfo)
		}

		// Group routes
		group := v1.Group("/group")
		{
			group.GET("/list/:instance", groupHandler.ListGroups)
			group.GET("/info/:instance", groupHandler.GetInfo)
			group.POST("/create/:instance", groupHandler.CreateGroup)
			group.POST("/add/:instance", groupHandler.AddParticipants)
			group.POST("/remove/:instance", groupHandler.RemoveParticipants)
			group.POST("/leave/:instance", groupHandler.LeaveGroup)
			group.GET("/invite-link/:instance", groupHandler.GetGroupInviteLink)
		}

		// CRM routes
		crm := v1.Group("/crm")
		{
			// Leads
			crm.POST("/leads", s.crmServer.CreateLead)
			crm.GET("/leads", s.crmServer.ListLeads)
			crm.GET("/leads/:id", s.crmServer.GetLead)
			crm.PUT("/leads/:id", s.crmServer.UpdateLead)
			crm.DELETE("/leads/:id", s.crmServer.DeleteLead)
			crm.GET("/leads/stats", s.crmServer.GetLeadStats)

			// Automation
			automation := crm.Group("/automation")
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

	// Serve static files (HTML, CSS, JS)
	s.router.Static("/static", "./")
	s.router.StaticFile("/", "./index.html")
	s.router.StaticFile("/manager.html", "./manager.html")
	s.router.StaticFile("/manager-socket.js", "./manager-socket.js")
	s.router.StaticFile("/crm.html", "./crm.html")
	s.router.StaticFile("/index.html", "./index.html")
	s.router.StaticFile("/automacao.html", "./automacao.html")
	s.router.StaticFile("/pairing.html", "./pairing.html")
	s.router.StaticFile("/instancias.html", "./instancias.html")
	s.router.StaticFile("/disparador.html", "./disparador.html")
	s.router.StaticFile("/styles.css", "./styles.css")

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
