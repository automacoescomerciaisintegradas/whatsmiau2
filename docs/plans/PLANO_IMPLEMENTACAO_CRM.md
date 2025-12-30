# 🚀 Plano de Implementação - CRM WhatsMiau2
## Desenvolvimento Completo em 7 Semanas

---

## 📅 Cronograma Geral

| Fase | Duração | Período | Status |
|------|---------|---------|--------|
| **Fase 0**: Setup e Preparação | 3 dias | Semana 1 | 🟡 Planejamento |
| **Fase 1**: Core Backend | 2 semanas | Semanas 1-2 | ⚪ Pendente |
| **Fase 2**: Core Frontend | 2 semanas | Semanas 3-4 | ⚪ Pendente |
| **Fase 3**: Integrações | 1 semana | Semana 5 | ⚪ Pendente |
| **Fase 4**: Features Avançadas | 1 semana | Semana 6 | ⚪ Pendente |
| **Fase 5**: Testes e Deploy | 1 semana | Semana 7 | ⚪ Pendente |

---

## 🎯 FASE 0: Setup e Preparação (3 dias)

### Dia 1: Ambiente de Desenvolvimento
- [ ] **Setup do projeto**
  ```bash
  cd c:\projetos2025\whatsmiau2
  mkdir -p docs/{api,database,frontend}
  mkdir -p internal/crm/{models,handlers,services}
  ```

- [ ] **Configurar banco de dados**
  - Criar migrations para tabelas do CRM
  - Setup PostgreSQL (ou manter SQLite para dev)
  - Criar seeds de dados de teste

- [ ] **Documentação inicial**
  - API Spec (OpenAPI/Swagger)
  - Diagramas de arquitetura
  - Fluxogramas de processos

### Dia 2: Estrutura do Código
- [ ] **Backend (Go)**
  ```
  internal/crm/
  ├── models/
  │   ├── lead.go
  │   ├── message.go
  │   ├── payment.go
  │   ├── email.go
  │   └── template.go
  ├── handlers/
  │   ├── lead_handler.go
  │   ├── message_handler.go
  │   ├── payment_handler.go
  │   └── email_handler.go
  ├── services/
  │   ├── lead_service.go
  │   ├── mercadopago_service.go
  │   ├── resend_service.go
  │   └── analytics_service.go
  └── repository/
      └── crm_repository.go
  ```

- [ ] **Frontend**
  ```
  frontend/crm/
  ├── components/
  │   ├── Dashboard.js
  │   ├── LeadKanban.js
  │   ├── ChatWindow.js
  │   └── PaymentForm.js
  ├── services/
  │   ├── api.js
  │   ├── socket.js
  │   └── storage.js
  └── utils/
      ├── formatters.js
      └── validators.js
  ```

### Dia 3: CI/CD e Ferramentas
- [ ] **Setup de testes**
  - Go: `go test`
  - Frontend: Jest/Vitest
  - E2E: Playwright

- [ ] **Docker**
  - Dockerfile otimizado
  - docker-compose para dev
  - docker-compose para produção

- [ ] **Git Workflow**
  - Branches: `main`, `develop`, `feature/*`
  - Pull Request template
  - Code review checklist

---

## 🔧 FASE 1: Core Backend (2 semanas)

### Semana 1: Fundação

#### Sprint 1.1 - Modelos e Migrations (2 dias)
**Objetivo**: Criar estrutura de dados completa

**Tasks**:
- [ ] **Criar migrations SQL**
  ```sql
  -- 001_create_leads_table.sql
  CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    empresa VARCHAR(255),
    site VARCHAR(255),
    instagram VARCHAR(100),
    linkedin VARCHAR(255),
    localizacao VARCHAR(255),
    valor DECIMAL(10,2) DEFAULT 0,
    fonte VARCHAR(50),
    status VARCHAR(50) DEFAULT 'novo',
    temperatura VARCHAR(20) DEFAULT 'morno',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 002_create_messages_table.sql
  CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    direction VARCHAR(10) DEFAULT 'sent',
    status VARCHAR(20) DEFAULT 'pending',
    media_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 003_create_payments_table.sql
  CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id),
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    pix_code TEXT,
    pix_qr_code TEXT,
    mp_payment_id VARCHAR(100),
    expires_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 004_create_emails_table.sql
  CREATE TABLE email_campaigns (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    recipients JSONB,
    status VARCHAR(20) DEFAULT 'draft',
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 005_create_templates_table.sql
  CREATE TABLE message_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    variables JSONB,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 006_create_activities_table.sql
  CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **Criar models Go**
  ```go
  // internal/crm/models/lead.go
  type Lead struct {
    ID           int64     `json:"id"`
    Nome         string    `json:"nome"`
    WhatsApp     string    `json:"whatsapp"`
    Email        string    `json:"email"`
    Empresa      string    `json:"empresa"`
    Site         string    `json:"site"`
    Instagram    string    `json:"instagram"`
    LinkedIn     string    `json:"linkedin"`
    Localizacao  string    `json:"localizacao"`
    Valor        float64   `json:"valor"`
    Fonte        string    `json:"fonte"`
    Status       string    `json:"status"`
    Temperatura  string    `json:"temperatura"`
    Observacoes  string    `json:"observacoes"`
    CreatedAt    time.Time `json:"created_at"`
    UpdatedAt    time.Time `json:"updated_at"`
  }
  ```

- [ ] **Testes unitários dos models**

#### Sprint 1.2 - Repository Layer (2 dias)
**Objetivo**: Implementar acesso a dados

**Tasks**:
- [ ] **Criar CRM Repository**
  ```go
  type CRMRepository interface {
    // Leads
    CreateLead(lead *Lead) error
    GetLead(id int64) (*Lead, error)
    UpdateLead(lead *Lead) error
    DeleteLead(id int64) error
    ListLeads(filters LeadFilters) ([]*Lead, error)
    
    // Messages
    CreateMessage(msg *Message) error
    GetMessagesByLead(leadID int64) ([]*Message, error)
    
    // Payments
    CreatePayment(payment *Payment) error
    UpdatePaymentStatus(id int64, status string) error
    
    // Analytics
    GetDashboardStats() (*DashboardStats, error)
  }
  ```

- [ ] **Implementar queries SQL**
- [ ] **Testes de integração com banco**

#### Sprint 1.3 - API Handlers (3 dias)
**Objetivo**: Criar endpoints REST

**Tasks**:
- [ ] **Leads API**
  ```go
  POST   /api/crm/leads          // Criar lead
  GET    /api/crm/leads          // Listar leads (com filtros)
  GET    /api/crm/leads/:id      // Obter lead
  PUT    /api/crm/leads/:id      // Atualizar lead
  DELETE /api/crm/leads/:id      // Deletar lead
  GET    /api/crm/leads/:id/activities  // Histórico
  ```

- [ ] **Messages API**
  ```go
  POST   /api/crm/messages       // Enviar mensagem
  GET    /api/crm/messages/:leadId  // Histórico de mensagens
  ```

- [ ] **Payments API**
  ```go
  POST   /api/crm/payments       // Criar cobrança PIX
  GET    /api/crm/payments/:id   // Status do pagamento
  POST   /api/crm/payments/webhook  // Webhook Mercado Pago
  ```

- [ ] **Analytics API**
  ```go
  GET    /api/crm/dashboard      // Estatísticas gerais
  GET    /api/crm/analytics/funnel  // Funil de vendas
  GET    /api/crm/analytics/revenue  // Receita
  ```

- [ ] **Middleware**
  - Autenticação
  - Rate limiting
  - Logging
  - Error handling

- [ ] **Testes de API (Postman/Insomnia)**

### Semana 2: Integrações e Services

#### Sprint 1.4 - Mercado Pago Integration (2 dias)
**Objetivo**: Implementar pagamentos PIX

**Tasks**:
- [ ] **Service de Mercado Pago**
  ```go
  type MercadoPagoService struct {
    accessToken string
    client      *http.Client
  }

  func (s *MercadoPagoService) CreatePixPayment(req PaymentRequest) (*PaymentResponse, error)
  func (s *MercadoPagoService) GetPaymentStatus(paymentID string) (*PaymentStatus, error)
  func (s *MercadoPagoService) ProcessWebhook(data []byte) error
  ```

- [ ] **Gerar QR Code PIX**
- [ ] **Webhook handler**
- [ ] **Testes com sandbox MP**

#### Sprint 1.5 - Resend Integration (2 dias)
**Objetivo**: Implementar email marketing

**Tasks**:
- [ ] **Service de Resend**
  ```go
  type ResendService struct {
    apiKey string
    client *http.Client
  }

  func (s *ResendService) SendEmail(req EmailRequest) error
  func (s *ResendService) SendBulkEmail(recipients []string, template EmailTemplate) error
  func (s *ResendService) TrackEmail(emailID string) (*EmailStats, error)
  ```

- [ ] **Templates de email HTML**
- [ ] **Sistema de tracking**
- [ ] **Testes de envio**

#### Sprint 1.6 - WebSocket/Real-time (1 dia)
**Objetivo**: Comunicação em tempo real

**Tasks**:
- [ ] **Setup Socket.IO**
- [ ] **Eventos**:
  - `new_message` - Nova mensagem
  - `lead_updated` - Lead atualizado
  - `payment_received` - Pagamento confirmado
- [ ] **Rooms por usuário/lead**

---

## 🎨 FASE 2: Core Frontend (2 semanas)

### Semana 3: Componentes Base

#### Sprint 2.1 - Dashboard Melhorado (2 dias)
**Tasks**:
- [ ] **Integrar Chart.js**
  - Gráfico de conversão
  - Gráfico de receita
  - Funil de vendas
- [ ] **Cards de métricas animados**
- [ ] **Filtros de período**
- [ ] **Exportar relatório PDF**

#### Sprint 2.2 - Kanban de Leads (3 dias)
**Tasks**:
- [ ] **Implementar drag-and-drop** (SortableJS)
- [ ] **Colunas**: Novo → Contato → Negociação → Fechado
- [ ] **Card de lead**:
  - Avatar
  - Nome/Empresa
  - Valor
  - Temperatura
  - Ações rápidas
- [ ] **Filtros e busca**
- [ ] **Persistir estado**

#### Sprint 2.3 - Chat/Conversas (3 dias)
**Tasks**:
- [ ] **Interface de chat**
  - Lista de conversas
  - Janela de mensagens
  - Input com suporte a mídia
- [ ] **Real-time com Socket.IO**
- [ ] **Histórico infinito (scroll)**
- [ ] **Indicadores de digitação**
- [ ] **Notificações desktop**

### Semana 4: Features Avançadas

#### Sprint 2.4 - Formulários e Modais (2 dias)
**Tasks**:
- [ ] **Modal de Lead** (melhorado)
  - Validação em tempo real
  - Upload de avatar
  - Autocomplete de endereço
- [ ] **Modal de Pagamento**
  - Calculadora de valor
  - Preview do QR Code
  - Copiar código PIX
- [ ] **Modal de Email**
  - Editor WYSIWYG (Quill.js)
  - Seleção múltipla de destinatários
  - Preview do email

#### Sprint 2.5 - Templates e Automação (2 dias)
**Tasks**:
- [ ] **Editor de templates**
  - Syntax highlighting para variáveis
  - Preview em tempo real
  - Biblioteca de templates
- [ ] **Sistema de variáveis**
  - `{nome}`, `{empresa}`, `{valor}`, etc.
  - Funções: `{primeiroNome}`, `{dataFormatada}`

#### Sprint 2.6 - Importação/Exportação (1 dia)
**Tasks**:
- [ ] **Importar CSV**
  - Mapeamento de colunas
  - Validação de dados
  - Preview antes de importar
- [ ] **Exportar**
  - CSV
  - Excel
  - PDF (relatório)

---

## 🔌 FASE 3: Integrações e Polish (1 semana)

### Sprint 3.1 - Integrações Externas (3 dias)
**Tasks**:
- [ ] **WhatsApp Integration**
  - Sincronizar mensagens
  - Enviar mensagens via API
  - Webhooks de eventos
- [ ] **Google Contacts**
  - Importar contatos
  - Sincronização bidirecional
- [ ] **Zapier/Make**
  - Criar triggers
  - Criar actions
  - Documentação

### Sprint 3.2 - Analytics e Relatórios (2 dias)
**Tasks**:
- [ ] **Dashboard de analytics**
  - Taxa de conversão
  - Tempo médio de resposta
  - ROI de campanhas
- [ ] **Relatórios personalizados**
  - Filtros avançados
  - Exportação
  - Agendamento de relatórios

### Sprint 3.3 - Notificações (2 dias)
**Tasks**:
- [ ] **Sistema de notificações**
  - Push notifications
  - Email notifications
  - WhatsApp notifications
- [ ] **Preferências de usuário**
- [ ] **Centro de notificações**

---

## 🚀 FASE 4: Features Avançadas (1 semana)

### Sprint 4.1 - Automações (3 dias)
**Tasks**:
- [ ] **Workflow builder**
  - Triggers: Novo lead, Mensagem recebida, etc.
  - Actions: Enviar mensagem, Criar tarefa, etc.
  - Condições: If/Else
- [ ] **Templates de automação**
- [ ] **Logs de execução**

### Sprint 4.2 - Chatbot (2 dias)
**Tasks**:
- [ ] **Integração com IA** (Gemini/GPT)
- [ ] **Fluxos de conversa**
- [ ] **Fallback para humano**
- [ ] **Treinamento do bot**

### Sprint 4.3 - Permissões e Multi-usuário (2 dias)
**Tasks**:
- [ ] **Sistema de roles**
  - Admin
  - Vendedor
  - Atendente
- [ ] **Permissões granulares**
- [ ] **Auditoria de ações**

---

## ✅ FASE 5: Testes e Deploy (1 semana)

### Sprint 5.1 - Testes (3 dias)
**Tasks**:
- [ ] **Testes unitários** (>80% coverage)
- [ ] **Testes de integração**
- [ ] **Testes E2E** (Playwright)
- [ ] **Testes de carga** (k6)
- [ ] **Testes de segurança**

### Sprint 5.2 - Documentação (2 dias)
**Tasks**:
- [ ] **API Documentation** (Swagger)
- [ ] **User Guide**
- [ ] **Video Tutorials**
- [ ] **FAQ**

### Sprint 5.3 - Deploy (2 dias)
**Tasks**:
- [ ] **Setup produção**
  - PostgreSQL
  - Redis
  - CDN para assets
- [ ] **CI/CD Pipeline**
- [ ] **Monitoring** (Grafana/Prometheus)
- [ ] **Backup automático**
- [ ] **SSL/HTTPS**

---

## 📊 Métricas de Progresso

### Daily Standup
- O que fiz ontem?
- O que vou fazer hoje?
- Há algum bloqueio?

### Weekly Review
- Features completadas
- Bugs encontrados
- Próximos passos

### Sprint Retrospective
- O que funcionou bem?
- O que pode melhorar?
- Action items

---

## 🛠️ Ferramentas e Stack

### Backend
- **Linguagem**: Go 1.21+
- **Framework**: Gin/Echo
- **ORM**: GORM
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **Queue**: RabbitMQ (opcional)

### Frontend
- **Base**: HTML/CSS/JS (atual)
- **Opcional**: React/Vue
- **Bibliotecas**:
  - Chart.js (gráficos)
  - SortableJS (drag-drop)
  - Quill.js (editor)
  - Socket.IO (real-time)

### DevOps
- **Container**: Docker
- **Orchestration**: Docker Swarm
- **CI/CD**: GitHub Actions
- **Monitoring**: Grafana + Prometheus
- **Logs**: Loki

### Integrações
- **Mercado Pago**: API v1
- **Resend**: REST API
- **WhatsApp**: WhatsMiau2 API
- **Google**: OAuth2 + Contacts API

---

## 🎯 Próximos Passos Imediatos

1. **Revisar e aprovar este plano**
2. **Setup do ambiente (Fase 0)**
3. **Criar primeira migration**
4. **Implementar primeiro endpoint**
5. **Daily standup às 9h**

---

**Versão**: 1.0  
**Data**: 28/12/2025  
**Responsável**: Equipe WhatsMiau2  
**Status**: 📋 Pronto para Execução
