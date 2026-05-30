# 📐 Arquitetura do Sistema WhatsMiau2

## 1. Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 WHATSMIAU2                                       │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────────┤
│   FRONTEND   │   GATEWAY    │   SERVICES   │   DATABASE   │     WHATSAPP       │
│  (HTML/JS)   │  (Gin/HTTP)  │   (Golang)   │  (SQLite/PG) │   (whatsmeow)      │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────────────┘
```

---

## 2. Estrutura de Diretórios

```
whatsmiau2/
├── main.go                 # Entry point
├── go.mod                  # Dependências Go
├── sessions.db             # Sessões Whatsmeow
├── whatsmiau.db            # Banco principal
│
├── internal/               # Código interno
│   ├── config/             # Configurações
│   │   └── config.go
│   │
│   ├── server/             # Servidor HTTP
│   │   └── server.go       # Rotas e inicialização
│   │
│   ├── handlers/           # Handlers de API (12 arquivos)
│   │   ├── app.go          # Handlers de app
│   │   ├── auth.go         # Autenticação
│   │   ├── chat.go         # Chat handlers
│   │   ├── contact.go      # Contatos
│   │   ├── group.go        # Grupos
│   │   ├── instance.go     # Instâncias WhatsApp
│   │   ├── message.go      # Mensagens
│   │   ├── newsletter.go   # Newsletters
│   │   ├── oauth.go        # OAuth Google
│   │   ├── subscription_handler.go  # Assinaturas
│   │   ├── user.go         # Usuários
│   │   └── webhook_payment.go  # Webhooks MP
│   │
│   ├── middleware/         # Middlewares (3 arquivos)
│   │   ├── auth.go         # Auth middleware
│   │   ├── cors.go         # CORS
│   │   └── premium.go      # Verificação de plano
│   │
│   ├── models/             # Modelos de dados (4 arquivos)
│   │   ├── instance.go     # Instance model
│   │   ├── message.go      # Message model
│   │   ├── subscription.go # Subscription/Plan
│   │   └── user.go         # User model
│   │
│   ├── database/           # Camada de persistência
│   │   ├── database.go     # Conexão e operações
│   │   └── seeds.go        # Seeds de dados
│   │
│   ├── services/           # Serviços de negócio
│   │   ├── mercadopago.go  # Integração MP
│   │   └── [outros]
│   │
│   ├── whatsapp/           # Integração Whatsmeow
│   │   ├── manager.go      # Gerenciador de clientes
│   │   ├── events.go       # Event handlers
│   │   └── webhook.go      # Webhooks
│   │
│   ├── crm/                # CRM completo (18 arquivos)
│   │   ├── server.go       # CRM routes
│   │   ├── handlers/       # CRM handlers
│   │   ├── models/         # CRM models
│   │   ├── repository/     # CRM repositories
│   │   └── services/       # CRM services
│   │
│   └── manager/            # Manager adicional (7 arquivos)
│
├── public/                 # Frontend (36 páginas HTML)
│   ├── assets/
│   │   ├── css/            # Estilos (~37KB total)
│   │   └── js/             # Scripts
│   └── *.html              # Páginas
│
└── docs/                   # Documentação
```

---

## 3. Fluxo de Dados

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    Gin      │────▶│  Handler    │────▶│   Service   │
│   (HTTP)    │     │  (Router)   │     │  (API)      │     │  (Logic)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                   │                   │
                           ▼                   ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │ Middleware  │     │   Model     │     │  Database   │
                    │ (Auth/CORS) │     │  (Struct)   │     │  (GORM)     │
                    └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │  WhatsApp   │
                                                            │ (Whatsmeow) │
                                                            └─────────────┘
```

---

## 4. Componentes Atuais

### 4.1 Handlers Existentes

| Handler | Arquivo | Funcionalidades |
|---------|---------|-----------------|
| AppHandler | app.go | Status da aplicação |
| AuthHandler | auth.go | Login, Registro, JWT |
| ChatHandler | chat.go | Conversas |
| ContactHandler | contact.go | CRUD Contatos |
| GroupHandler | group.go | Grupos WhatsApp |
| InstanceHandler | instance.go | Instâncias WhatsApp |
| MessageHandler | message.go | Envio/recebimento |
| NewsletterHandler | newsletter.go | Canais/Newsletters |
| OAuthHandler | oauth.go | Login Google |
| SubscriptionHandler | subscription_handler.go | Planos/Assinaturas |
| UserHandler | user.go | Perfil usuário |
| WebhookPaymentHandler | webhook_payment.go | Mercado Pago |

### 4.2 Modelos Existentes

| Modelo | Campos Principais |
|--------|-------------------|
| Instance | ID, Name, Status, PhoneNumber, UserID |
| User | ID, Email, Password, Role |
| Subscription | ID, UserID, PlanID, Status |
| Plan | ID, Name, Price, MaxInstances |
| Message | ID, Content, From, To, Timestamp |

### 4.3 Rotas API

**Prefixo: `/v1`**

| Grupo | Rotas |
|-------|-------|
| `/auth` | login, register, me |
| `/instance` | create, delete, connect, fetchInstances |
| `/message` | send/text, send/media, send/batch |
| `/group` | list, participants, invite-link |
| `/newsletter` | list |
| `/crm` | leads, tickets, automation |
| `/subscription` | plans, checkout, my-subscription |

---

## 5. Componentes Faltantes (Identificados)

### 5.1 Alta Prioridade

| Componente | Descrição | Status |
|------------|-----------|--------|
| MonitoringService | Monitoramento de sessões em tempo real | ❌ Faltando |
| DashboardHandler | API para métricas do dashboard | ❌ Faltando |
| AnalyticsService | Análise de dados e relatórios | ❌ Faltando |
| SessionMetrics | Modelo para métricas de sessão | ❌ Faltando |
| PerformanceMonitor | Monitoramento de performance | ❌ Faltando |

### 5.2 Média Prioridade

| Componente | Descrição | Status |
|------------|-----------|--------|
| RateLimitMiddleware | Limitação de requisições | ❌ Faltando |
| AuditMiddleware | Log de auditoria | ❌ Faltando |
| StructuredLogger | Logging estruturado | ⚠️ Parcial (usa zap) |
| HealthCheckService | Verificação de saúde | ⚠️ Parcial (/health) |

### 5.3 Baixa Prioridade

| Componente | Descrição | Status |
|------------|-----------|--------|
| Testes Unitários | Cobertura de testes | ❌ Faltando |
| Testes E2E | Testes de integração | ❌ Faltando |
| Docker Config | Dockerfiles atualizados | ⚠️ Verificar |

---

## 6. Dependências

```go
// go.mod principais
go.mau.fi/whatsmeow v0.0.0-20251217143725
github.com/gin-gonic/gin v1.x
gorm.io/gorm v1.x
github.com/glebarez/sqlite v1.x
go.uber.org/zap v1.x (logging)
github.com/skip2/go-qrcode v0.x (QR)
github.com/golang-jwt/jwt v5.x (auth)
```

---

## 7. Próximos Passos

1. ✅ Análise de arquitetura completa
2. ⏳ Criar modelos SessionMetrics e InstanceStats
3. ⏳ Implementar MonitoringService
4. ⏳ Criar DashboardHandler com endpoints de métricas
5. ⏳ Implementar dashboard.html com gráficos
6. ⏳ Adicionar testes unitários

---

*Documento gerado em 2026-01-23*
