# Especificações Técnicas - Implementação de Assinaturas e Controle de Inadimplentes

## 1. Rate Limiting

### Objetivo
Implementar controle de taxa para proteger a API contra sobrecarga e abuso.

### Implementação
```go
// internal/middleware/rate_limit.go
package middleware

import (
    "fmt"
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "golang.org/x/time/rate"
)

type RateLimiter struct {
    userLimits map[string]*rate.Limiter
    mu         sync.Mutex
    defaultRPS float64
    burst      int
}

func NewRateLimiter(defaultRPS float64, burst int) *RateLimiter {
    return &RateLimiter{
        userLimits: make(map[string]*rate.Limiter),
        defaultRPS: defaultRPS,
        burst:      burst,
    }
}

func (rl *RateLimiter) GetLimiter(userID string) *rate.Limiter {
    rl.mu.Lock()
    defer rl.mu.Unlock()

    limiter, exists := rl.userLimits[userID]
    if !exists {
        limiter = rate.NewLimiter(rate.Limit(rl.defaultRPS), rl.burst)
        rl.userLimits[userID] = limiter
    }

    return limiter
}

func RateLimitMiddleware(limiter *RateLimiter) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetString("user_id") // Obtido do token JWT
        if userID == "" {
            userID = c.ClientIP() // Fallback para IP
        }

        userLimiter := limiter.GetLimiter(userID)

        if !userLimiter.Allow() {
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Rate limit exceeded",
                "message": "Você excedeu o limite de requisições. Por favor, aguarde antes de tentar novamente.",
            })
            c.Abort()
            return
        }

        c.Next()
    }
}
```

## 2. Grace Period e Suspensão Automática

### Objetivo
Implementar período de carência após expiração da assinatura e suspensão automática após esse período.

### Modelo de Assinatura Estendido
```go
// internal/models/subscription.go
package models

import (
    "time"
    
    "gorm.io/gorm"
)

type SubscriptionStatus string

const (
    StatusActive      SubscriptionStatus = "active"
    StatusPastDue     SubscriptionStatus = "past_due"
    StatusCanceled    SubscriptionStatus = "canceled"
    StatusUnpaid      SubscriptionStatus = "unpaid"
    StatusSuspended   SubscriptionStatus = "suspended"
    StatusGracePeriod SubscriptionStatus = "grace_period"
)

type Subscription struct {
    ID             uint               `gorm:"primaryKey" json:"id"`
    UserID         string             `gorm:"not null" json:"user_id"`
    PlanID         string             `gorm:"not null" json:"plan_id"`
    Status         SubscriptionStatus `gorm:"default:active" json:"status"`
    CurrentPeriodStart time.Time       `json:"current_period_start"`
    CurrentPeriodEnd   time.Time       `json:"current_period_end"`
    GracePeriodEnd     *time.Time      `json:"grace_period_end,omitempty"`
    CanceledAt       *time.Time        `json:"canceled_at,omitempty"`
    CreatedAt      time.Time          `json:"created_at"`
    UpdatedAt      time.Time          `json:"updated_at"`
    
    // Relacionamentos
    User User `gorm:"foreignKey:UserID" json:"user"`
    Plan Plan `gorm:"foreignKey:PlanID" json:"plan"`
}

// Função para verificar se está no período de carência
func (s *Subscription) IsInGracePeriod() bool {
    if s.GracePeriodEnd == nil {
        return false
    }
    return time.Now().Before(*s.GracePeriodEnd) && s.Status == StatusPastDue
}

// Função para verificar se deve ser suspensa
func (s *Subscription) ShouldBeSuspended() bool {
    if s.GracePeriodEnd == nil {
        return s.Status == StatusPastDue
    }
    return time.Now().After(*s.GracePeriodEnd) && s.Status == StatusPastDue
}
```

### Middleware de Controle de Plano
```go
// internal/middleware/plan_guard.go
package middleware

import (
    "net/http"
    "time"

    "whatsmiau2/internal/database"
    "whatsmiau2/internal/models"

    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

func PlanGuard(db *database.Database) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetString("user_id")
        if userID == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
            c.Abort()
            return
        }

        // Buscar assinatura do usuário
        var subscription models.Subscription
        if err := db.First(&subscription, "user_id = ?", userID).Error; err != nil {
            // Usuário não tem assinatura, verificar se é trial
            c.JSON(http.StatusPaymentRequired, gin.H{
                "error": "Assinatura necessária",
                "message": "Por favor, realize a assinatura para acessar este recurso.",
            })
            c.Abort()
            return
        }

        // Verificar status da assinatura
        switch subscription.Status {
        case models.StatusActive:
            // Assinatura ativa, permitir acesso
            c.Next()
            return
            
        case models.StatusPastDue:
            // Verificar se está no período de carência
            if subscription.IsInGracePeriod() {
                // Permitir acesso durante o período de carência
                zap.L().Info("Acesso permitido durante período de carência",
                    zap.String("user_id", userID))
                c.Next()
                return
            }
            
            // Fora do período de carência, suspender acesso
            if subscription.ShouldBeSuspended() {
                zap.L().Info("Assinatura suspensa por inadimplência",
                    zap.String("user_id", userID))
                
                // Atualizar status para suspenso
                subscription.Status = models.StatusSuspended
                db.Save(&subscription)
                
                c.JSON(http.StatusPaymentRequired, gin.H{
                    "error": "Assinatura suspensa",
                    "message": "Sua assinatura foi suspensa devido à inadimplência. Por favor, regularize sua situação para continuar usando o serviço.",
                })
                c.Abort()
                return
            }
            
        case models.StatusSuspended, models.StatusCanceled, models.StatusUnpaid:
            c.JSON(http.StatusPaymentRequired, gin.H{
                "error": "Assinatura não ativa",
                "message": "Sua assinatura não está ativa. Por favor, regularize sua situação para continuar usando o serviço.",
            })
            c.Abort()
            return
        }

        c.Next()
    }
}
```

## 3. Job Automático de Suspensão

### Serviço de Processamento de Assinaturas
```go
// internal/services/subscription_processor.go
package services

import (
    "time"

    "whatsmiau2/internal/database"
    "whatsmiau2/internal/models"
    "whatsmiau2/internal/whatsapp"

    "go.uber.org/zap"
)

type SubscriptionProcessor struct {
    db      *database.Database
    manager *whatsapp.Manager
}

func NewSubscriptionProcessor(db *database.Database, manager *whatsapp.Manager) *SubscriptionProcessor {
    return &SubscriptionProcessor{
        db:      db,
        manager: manager,
    }
}

// ProcessExpiredSubscriptions processa assinaturas expiradas
func (sp *SubscriptionProcessor) ProcessExpiredSubscriptions() {
    zap.L().Info("Iniciando processamento de assinaturas expiradas")
    
    // Buscar assinaturas expiradas (fora do período ativo)
    var subscriptions []models.Subscription
    sp.db.Where("status IN ? AND current_period_end < ?", 
        []models.SubscriptionStatus{models.StatusActive, models.StatusPastDue}, 
        time.Now()).Find(&subscriptions)

    for _, sub := range subscriptions {
        sp.processSubscription(&sub)
    }
    
    zap.L().Info("Processamento de assinaturas expiradas concluído")
}

// processSubscription processa uma assinatura individualmente
func (sp *SubscriptionProcessor) processSubscription(sub *models.Subscription) {
    switch {
    case sub.Status == models.StatusActive && sub.CurrentPeriodEnd.Before(time.Now()):
        // Assinatura expirou, mudar para past_due
        sp.handleExpiration(sub)
        
    case sub.Status == models.StatusPastDue:
        if sub.IsInGracePeriod() {
            // Ainda no período de carência
            zap.L().Info("Assinatura ainda no período de carência",
                zap.String("user_id", sub.UserID))
        } else if sub.ShouldBeSuspended() {
            // Fora do período de carência, suspender
            sp.handleSuspension(sub)
        }
    }
}

// handleExpiration lida com expiração de assinatura
func (sp *SubscriptionProcessor) handleExpiration(sub *models.Subscription) {
    // Definir período de carência (por exemplo, 7 dias)
    gracePeriodEnd := time.Now().Add(7 * 24 * time.Hour)
    
    sub.Status = models.StatusPastDue
    sub.GracePeriodEnd = &gracePeriodEnd
    
    if err := sp.db.Save(sub).Error; err != nil {
        zap.L().Error("Falha ao atualizar assinatura expirada",
            zap.String("user_id", sub.UserID),
            zap.Error(err))
        return
    }
    
    zap.L().Info("Assinatura expirada, período de carência iniciado",
        zap.String("user_id", sub.UserID),
        zap.Time("grace_period_end", gracePeriodEnd))
}

// handleSuspension lida com suspensão de assinatura
func (sp *SubscriptionProcessor) handleSuspension(sub *models.Subscription) {
    sub.Status = models.StatusSuspended
    
    if err := sp.db.Save(sub).Error; err != nil {
        zap.L().Error("Falha ao suspender assinatura",
            zap.String("user_id", sub.UserID),
            zap.Error(err))
        return
    }
    
    // Desconectar instâncias WhatsApp do usuário
    sp.disconnectUserInstances(sub.UserID)
    
    zap.L().Info("Assinatura suspensa por inadimplência",
        zap.String("user_id", sub.UserID))
}

// disconnectUserInstances desconecta todas as instâncias do usuário
func (sp *SubscriptionProcessor) disconnectUserInstances(userID string) {
    // Buscar instâncias do usuário
    var instances []models.Instance
    sp.db.Where("user_id = ?", userID).Find(&instances)
    
    for _, instance := range instances {
        // Remover cliente do manager
        sp.manager.RemoveClient(instance.ID)
        
        // Atualizar status no banco
        instance.Status = models.StatusSuspended
        sp.db.Save(&instance)
    }
    
    zap.L().Info("Instâncias do usuário desconectadas devido à suspensão da assinatura",
        zap.String("user_id", userID),
        zap.Int("instances_count", len(instances)))
}

// StartScheduler inicia o scheduler de processamento
func (sp *SubscriptionProcessor) StartScheduler() {
    // Executar imediatamente
    sp.ProcessExpiredSubscriptions()
    
    // Executar a cada hora
    ticker := time.NewTicker(1 * time.Hour)
    go func() {
        for range ticker.C {
            sp.ProcessExpiredSubscriptions()
        }
    }()
}
```

## 4. Implementação no Servidor Principal

### Atualização do arquivo main.go
```go
// main.go (atualização)
package main

import (
    "sync"
    "time"

    "whatsmiau2/internal/config"
    "whatsmiau2/internal/database"
    "whatsmiau2/internal/server"
    "whatsmiau2/internal/services"
    "whatsmiau2/internal/whatsapp"

    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
    "golang.org/x/time/rate"
)

func main() {
    // ... código existente ...

    // Initialize WhatsApp manager
    manager, err := whatsapp.NewManager(cfg, db)
    if err != nil {
        zap.L().Fatal("Failed to initialize WhatsApp manager", zap.Error(err))
    }
    defer manager.Close()

    // Initialize subscription processor
    subscriptionProcessor := services.NewSubscriptionProcessor(db, manager)
    
    // Start subscription processing scheduler
    subscriptionProcessor.StartScheduler()

    // Initialize rate limiter
    rateLimiter := middleware.NewRateLimiter(10.0, 20) // 10 req/sec, burst 20

    // Create and start server with additional services
    srv := server.New(cfg, db, manager, rateLimiter, subscriptionProcessor)

    // ... resto do código ...
}
```

## 5. Atualização do Servidor

### Atualização do arquivo server.go
```go
// internal/server/server.go (atualização)
package server

import (
    "fmt"
    "net/http"

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

// Server representa o servidor HTTP
type Server struct {
    config                *config.Config
    router                *gin.Engine
    db                    *database.Database
    manager               *whatsapp.Manager
    crmServer             *crm.Server
    rateLimiter           *middleware.RateLimiter
    subscriptionProcessor *services.SubscriptionProcessor
}

// New cria um novo servidor
func New(cfg *config.Config, db *database.Database, manager *whatsapp.Manager, 
         rateLimiter *middleware.RateLimiter, 
         subscriptionProcessor *services.SubscriptionProcessor) *Server {
    // ... código existente ...

    server := &Server{
        config:                cfg,
        router:                router,
        db:                    db,
        manager:               manager,
        crmServer:             crmServer,
        rateLimiter:           rateLimiter,
        subscriptionProcessor: subscriptionProcessor,
    }

    server.setupRoutes()

    return server
}

// setupRoutes configura todas as rotas da API
func (s *Server) setupRoutes() {
    // ... código existente ...

    // Aplicar rate limiting globalmente às rotas protegidas
    protected := s.router.Group("/v1")
    protected.Use(middleware.AuthMiddleware(s.config))
    protected.Use(middleware.RateLimitMiddleware(s.rateLimiter))
    
    // Aplicar controle de plano às rotas premium
    premium := protected.Group("")
    premium.Use(middleware.PlanGuard(s.db))
    
    // ... resto da configuração de rotas ...
}
```

## 6. Atualização do Modelo de Instância

### Atualização do modelo de instância para incluir status de suspensão
```go
// internal/models/instance.go (atualização)
package models

import "time"

type InstanceStatus string

const (
    StatusConnected  InstanceStatus = "connected"
    StatusConnecting InstanceStatus = "connecting"
    StatusDisconnected InstanceStatus = "disconnected"
    StatusQRCode     InstanceStatus = "qrcode"
    StatusSuspended  InstanceStatus = "suspended"  // Novo status
)

type Instance struct {
    ID          string         `gorm:"primaryKey;size:255" json:"id"`
    Name        string         `gorm:"size:255;not null" json:"name"`
    UserID      string         `gorm:"size:255;not null" json:"user_id"`  // Para associação com usuário
    Status      InstanceStatus `gorm:"default:disconnected" json:"status"`
    PhoneNumber string         `gorm:"size:50" json:"phone_number"`
    PushName    string         `gorm:"size:255" json:"push_name"`
    ProfilePic  string         `gorm:"size:500" json:"profile_pic"`
    WebhookURL  string         `gorm:"size:500" json:"webhook_url"`
    WebhookToken string        `gorm:"size:255" json:"webhook_token"`
    CreatedAt   time.Time      `json:"created_at"`
    UpdatedAt   time.Time      `json:"updated_at"`
    
    // Relacionamentos
    User User `gorm:"foreignKey:UserID" json:"user"`
}
```

Este plano técnico detalha as implementações necessárias para adicionar os recursos de controle de assinaturas e inadimplência ao sistema WhatsMiau2, com foco em segurança, escalabilidade e conformidade.