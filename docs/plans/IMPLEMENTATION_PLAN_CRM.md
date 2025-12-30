# 🚀 CRM - WhatsApp Omnichannel Platform
## Implementation Plan v1.0

---

## 📋 Visão Geral

Este documento descreve a arquitetura e plano de implementação de uma plataforma de atendimento omnichannel com CRM integrado, similar ao sistema "Agentes de AI".

### Funcionalidades Principais

| Módulo | Descrição | Prioridade |
|--------|-----------|------------|
| Dashboard | Métricas e KPIs em tempo real | 🔴 Alta |
| Tickets | Sistema de atendimento | 🔴 Alta |
| Contacts | Gestão de contatos/leads | 🔴 Alta |
| Connections | Instâncias WhatsApp | 🔴 Alta |
| Internal Chat | Chat entre atendentes | 🟡 Média |
| Kanban | Gestão visual de leads | 🟡 Média |
| Queues | Filas de atendimento | 🟡 Média |
| Tags | Etiquetas | 🟡 Média |
| Campaigns | Disparos em massa | 🟡 Média |
| Schedules | Agendamentos | 🟡 Média |
| Sales | Módulo de vendas | 🟢 Normal |
| Catalog | Catálogo de produtos | 🟢 Normal |
| Stores | Multi-lojas | 🟢 Normal |
| Flows | Fluxos de automação | 🟡 Média |
| Reports | Relatórios | 🟢 Normal |
| Chatbot | Bot automatizado | 🟡 Média |
| AI Agents | Agentes com IA | 🔴 Alta |
| Conditional Responses | Respostas automáticas | 🟡 Média |
| Followups | Acompanhamentos | 🟢 Normal |

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                     React + Vite + TailwindCSS                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Dashboard │ │ Tickets  │ │ Contacts │ │ Settings │   ...     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST + WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                             │
│                   Node.js + Express + Socket.io                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Auth   │ │  Routes  │ │ Services │ │  Socket  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   PostgreSQL     │ │      Redis       │ │  WhatsMiau2 API  │
│   (Database)     │ │  (Cache/Queue)   │ │  (WhatsApp)      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │   Evolution API  │
                                         │   (WhatsApp)     │
                                         └──────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.x | Framework UI |
| Vite | 5.x | Build tool |
| TailwindCSS | 3.x | Estilização |
| Zustand | 4.x | State management |
| Socket.io-client | 4.x | WebSocket |
| React Router | 6.x | Navegação |
| Lucide React | Latest | Ícones |
| React Query | 5.x | Data fetching |
| React Hook Form | 7.x | Formulários |
| Recharts | 2.x | Gráficos |

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 20.x | Runtime |
| Express | 4.x | HTTP Server |
| Socket.io | 4.x | WebSocket |
| Sequelize | 6.x | ORM |
| Bull | 4.x | Job Queue |
| JWT | 9.x | Autenticação |
| Bcrypt | 5.x | Hashing |
| Multer | 1.x | Upload arquivos |
| Winston | 3.x | Logging |

### Infraestrutura (Já disponível)
| Serviço | Uso |
|---------|-----|
| PostgreSQL | Banco de dados principal |
| Redis | Cache e filas |
| Evolution API | WhatsApp Business |
| WhatsMiau2 | WhatsApp Web |
| N8N | Automações |
| Traefik | Reverse proxy + SSL |

---

## 📁 Estrutura de Diretórios

```
whatsmiau2/
├── 📂 frontend/                     # React Application
│   ├── 📂 public/
│   │   └── favicon.ico
│   ├── 📂 src/
│   │   ├── 📂 assets/              # Imagens, fontes
│   │   ├── 📂 components/          # Componentes reutilizáveis
│   │   │   ├── 📂 ui/              # Componentes base (Button, Input, etc)
│   │   │   ├── 📂 layout/          # Sidebar, Header, etc
│   │   │   └── 📂 shared/          # Componentes compartilhados
│   │   ├── 📂 pages/               # Páginas da aplicação
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tickets.jsx
│   │   │   ├── Contacts.jsx
│   │   │   ├── Connections.jsx
│   │   │   ├── Kanban.jsx
│   │   │   ├── Campaigns.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   ├── AIAgents.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Settings.jsx
│   │   ├── 📂 hooks/               # Custom React hooks
│   │   ├── 📂 services/            # API calls
│   │   ├── 📂 store/               # Zustand stores
│   │   ├── 📂 utils/               # Utilitários
│   │   ├── App.jsx                 # Componente raiz
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Estilos globais
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── 📂 backend/                      # Node.js API
│   ├── 📂 src/
│   │   ├── 📂 config/              # Configurações
│   │   │   ├── database.js
│   │   │   ├── redis.js
│   │   │   └── socket.js
│   │   ├── 📂 controllers/         # Route handlers
│   │   │   ├── AuthController.js
│   │   │   ├── TicketController.js
│   │   │   ├── ContactController.js
│   │   │   └── ...
│   │   ├── 📂 models/              # Sequelize models
│   │   │   ├── User.js
│   │   │   ├── Ticket.js
│   │   │   ├── Contact.js
│   │   │   ├── Message.js
│   │   │   └── ...
│   │   ├── 📂 routes/              # Express routes
│   │   │   ├── auth.routes.js
│   │   │   ├── ticket.routes.js
│   │   │   └── ...
│   │   ├── 📂 services/            # Business logic
│   │   │   ├── WhatsAppService.js
│   │   │   ├── AIService.js
│   │   │   └── ...
│   │   ├── 📂 socket/              # WebSocket handlers
│   │   │   ├── TicketSocket.js
│   │   │   └── ChatSocket.js
│   │   ├── 📂 middlewares/         # Express middlewares
│   │   │   ├── auth.js
│   │   │   └── error.js
│   │   ├── 📂 jobs/                # Bull queue jobs
│   │   │   ├── SendMessageJob.js
│   │   │   └── CampaignJob.js
│   │   └── app.js                  # Entry point
│   ├── package.json
│   └── .env
│
├── 📂 database/
│   ├── 📂 migrations/              # Sequelize migrations
│   └── 📂 seeders/                 # Dados iniciais
│
├── 📂 docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── nginx.conf
│
├── docker-compose.crm.yml          # Docker Compose para CRM
└── README.md
```

---

## 🗃️ Schema do Banco de Dados

### Diagrama ER (Principais Entidades)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   companies  │       │ connections  │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ company_id   │───┐   │ name         │   ┌───│ company_id   │
│ name         │   │   │ plan         │   │   │ name         │
│ email        │   │   │ settings     │   │   │ status       │
│ password     │   └──▶│ created_at   │◀──┘   │ phone        │
│ role         │       └──────────────┘       │ instance_id  │
│ avatar       │                              └──────────────┘
│ status       │
└──────────────┘
        │
        │ 1:N
        ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   tickets    │       │  messages    │       │  contacts    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ company_id   │   ┌───│ ticket_id    │       │ company_id   │
│ contact_id   │───┤   │ contact_id   │───────│ name         │
│ user_id      │   │   │ body         │       │ phone        │
│ queue_id     │   │   │ media_url    │       │ email        │
│ status       │◀──┘   │ from_me      │       │ avatar       │
│ priority     │       │ timestamp    │       │ tags         │
│ created_at   │       └──────────────┘       │ custom_data  │
└──────────────┘                              └──────────────┘
```

### Tabelas Detalhadas

#### 1. users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'agent', -- admin, supervisor, agent
    avatar TEXT,
    status VARCHAR(50) DEFAULT 'active',
    online BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. companies
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. connections
```sql
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected',
    phone VARCHAR(20),
    qrcode TEXT,
    evolution_instance_id VARCHAR(255),
    whatsmiau_instance_id VARCHAR(255),
    webhook_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. contacts
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    avatar TEXT,
    profile_name VARCHAR(255),
    is_group BOOLEAN DEFAULT false,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contact_tags (
    contact_id UUID REFERENCES contacts(id),
    tag_id UUID REFERENCES tags(id),
    PRIMARY KEY (contact_id, tag_id)
);
```

#### 5. tickets
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    contact_id UUID REFERENCES contacts(id),
    connection_id UUID REFERENCES connections(id),
    user_id UUID REFERENCES users(id),
    queue_id UUID REFERENCES queues(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, open, closed
    is_group BOOLEAN DEFAULT false,
    unread_count INTEGER DEFAULT 0,
    last_message TEXT,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);
```

#### 6. messages
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id),
    contact_id UUID REFERENCES contacts(id),
    body TEXT,
    media_url TEXT,
    media_type VARCHAR(50),
    from_me BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    wpp_message_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT NOW(),
    ack INTEGER DEFAULT 0, -- 0: pending, 1: sent, 2: received, 3: read
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. queues
```sql
CREATE TABLE queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3498db',
    greeting_message TEXT,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE queue_users (
    queue_id UUID REFERENCES queues(id),
    user_id UUID REFERENCES users(id),
    PRIMARY KEY (queue_id, user_id)
);
```

#### 8. tags
```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3498db',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 9. campaigns
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    connection_id UUID REFERENCES connections(id),
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, cancelled
    contacts_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    delay_seconds INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campaign_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    contact_id UUID REFERENCES contacts(id),
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP,
    error_message TEXT
);
```

#### 10. chatbots
```sql
CREATE TABLE chatbots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    flow_json JSONB NOT NULL,
    trigger_keywords TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 11. ai_agents
```sql
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    model VARCHAR(100) DEFAULT 'gpt-4o-mini',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    queue_id UUID REFERENCES queues(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 12. schedules
```sql
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    contact_id UUID REFERENCES contacts(id),
    connection_id UUID REFERENCES connections(id),
    message TEXT NOT NULL,
    media_url TEXT,
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 13. products (Catálogo)
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 14. sales
```sql
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    contact_id UUID REFERENCES contacts(id),
    user_id UUID REFERENCES users(id),
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, cancelled
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2),
    total DECIMAL(10,2)
);
```

---

## 🔌 API Endpoints

### Autenticação
```
POST   /api/auth/login          # Login
POST   /api/auth/logout         # Logout
POST   /api/auth/refresh        # Refresh token
GET    /api/auth/me             # Current user
```

### Usuários
```
GET    /api/users               # Listar usuários
POST   /api/users               # Criar usuário
GET    /api/users/:id           # Detalhes
PUT    /api/users/:id           # Atualizar
DELETE /api/users/:id           # Deletar
```

### Tickets
```
GET    /api/tickets             # Listar tickets
POST   /api/tickets             # Criar ticket
GET    /api/tickets/:id         # Detalhes
PUT    /api/tickets/:id         # Atualizar
DELETE /api/tickets/:id         # Deletar
PUT    /api/tickets/:id/accept  # Aceitar ticket
PUT    /api/tickets/:id/close   # Fechar ticket
PUT    /api/tickets/:id/transfer # Transferir
```

### Mensagens
```
GET    /api/tickets/:id/messages    # Listar mensagens
POST   /api/tickets/:id/messages    # Enviar mensagem
DELETE /api/messages/:id            # Deletar mensagem
```

### Contatos
```
GET    /api/contacts            # Listar contatos
POST   /api/contacts            # Criar contato
GET    /api/contacts/:id        # Detalhes
PUT    /api/contacts/:id        # Atualizar
DELETE /api/contacts/:id        # Deletar
POST   /api/contacts/import     # Importar CSV
GET    /api/contacts/export     # Exportar CSV
```

### Conexões
```
GET    /api/connections         # Listar conexões
POST   /api/connections         # Criar conexão
GET    /api/connections/:id     # Detalhes
DELETE /api/connections/:id     # Deletar
POST   /api/connections/:id/qrcode      # Gerar QR
POST   /api/connections/:id/disconnect  # Desconectar
```

### Filas
```
GET    /api/queues              # Listar filas
POST   /api/queues              # Criar fila
PUT    /api/queues/:id          # Atualizar
DELETE /api/queues/:id          # Deletar
```

### Tags
```
GET    /api/tags                # Listar tags
POST   /api/tags                # Criar tag
PUT    /api/tags/:id            # Atualizar
DELETE /api/tags/:id            # Deletar
```

### Campanhas
```
GET    /api/campaigns           # Listar campanhas
POST   /api/campaigns           # Criar campanha
GET    /api/campaigns/:id       # Detalhes
PUT    /api/campaigns/:id       # Atualizar
DELETE /api/campaigns/:id       # Deletar
POST   /api/campaigns/:id/start # Iniciar
POST   /api/campaigns/:id/stop  # Parar
```

### Chatbots
```
GET    /api/chatbots            # Listar chatbots
POST   /api/chatbots            # Criar chatbot
GET    /api/chatbots/:id        # Detalhes
PUT    /api/chatbots/:id        # Atualizar
DELETE /api/chatbots/:id        # Deletar
```

### AI Agents
```
GET    /api/ai-agents           # Listar agentes
POST   /api/ai-agents           # Criar agente
GET    /api/ai-agents/:id       # Detalhes
PUT    /api/ai-agents/:id       # Atualizar
DELETE /api/ai-agents/:id       # Deletar
POST   /api/ai-agents/:id/test  # Testar agente
```

### Agendamentos
```
GET    /api/schedules           # Listar agendamentos
POST   /api/schedules           # Criar agendamento
PUT    /api/schedules/:id       # Atualizar
DELETE /api/schedules/:id       # Deletar/Cancelar
```

### Produtos
```
GET    /api/products            # Listar produtos
POST   /api/products            # Criar produto
PUT    /api/products/:id        # Atualizar
DELETE /api/products/:id        # Deletar
```

### Vendas
```
GET    /api/sales               # Listar vendas
POST   /api/sales               # Criar venda
GET    /api/sales/:id           # Detalhes
PUT    /api/sales/:id           # Atualizar status
```

### Dashboard/Reports
```
GET    /api/dashboard/stats     # Estatísticas gerais
GET    /api/reports/tickets     # Relatório de tickets
GET    /api/reports/messages    # Relatório de mensagens
GET    /api/reports/agents      # Desempenho de agentes
GET    /api/reports/sales       # Relatório de vendas
```

---

## 🔄 Eventos WebSocket

### Namespace: /
```javascript
// Conexão
socket.on('connect')
socket.on('disconnect')

// Tickets
socket.emit('joinTicket', ticketId)
socket.emit('leaveTicket', ticketId)
socket.on('ticket:created', ticket)
socket.on('ticket:updated', ticket)
socket.on('ticket:deleted', ticketId)

// Mensagens
socket.on('message:created', message)
socket.on('message:updated', message)
socket.on('message:deleted', messageId)

// Usuários
socket.on('user:online', userId)
socket.on('user:offline', userId)

// Conexões WhatsApp
socket.on('connection:status', { id, status })
socket.on('connection:qrcode', { id, qrcode })
```

---

## 📅 Cronograma de Implementação

### Fase 1 - Core (Semana 1)
| Dia | Tarefa | Status |
|-----|--------|--------|
| 1 | Setup projeto (Vite + Express) | ⬜ |
| 1 | Configurar TailwindCSS | ⬜ |
| 1 | Estrutura de diretórios | ⬜ |
| 2 | Migrations do banco de dados | ⬜ |
| 2 | Models Sequelize | ⬜ |
| 3 | Autenticação (JWT) | ⬜ |
| 3 | Login/Logout frontend | ⬜ |
| 4 | Layout principal (Sidebar, Header) | ⬜ |
| 4 | Dashboard com métricas | ⬜ |
| 5 | CRUD Conexões WhatsApp | ⬜ |
| 5 | Integração WhatsMiau2/Evolution | ⬜ |

### Fase 2 - Atendimento (Semana 2)
| Dia | Tarefa | Status |
|-----|--------|--------|
| 1 | CRUD Contatos | ⬜ |
| 1 | Import/Export CSV | ⬜ |
| 2 | CRUD Tags | ⬜ |
| 2 | CRUD Filas | ⬜ |
| 3 | Sistema de Tickets | ⬜ |
| 3 | Chat de mensagens | ⬜ |
| 4 | WebSocket tempo real | ⬜ |
| 4 | Envio de mídias | ⬜ |
| 5 | Kanban de leads | ⬜ |

### Fase 3 - Automação (Semana 3)
| Dia | Tarefa | Status |
|-----|--------|--------|
| 1 | CRUD Campanhas | ⬜ |
| 1 | Disparador de campanhas | ⬜ |
| 2 | Agendamentos | ⬜ |
| 3 | Chatbot Builder | ⬜ |
| 4 | AI Agents | ⬜ |
| 5 | Respostas condicionais | ⬜ |

### Fase 4 - Vendas e Reports (Semana 4)
| Dia | Tarefa | Status |
|-----|--------|--------|
| 1 | Catálogo de produtos | ⬜ |
| 2 | Sistema de vendas | ⬜ |
| 3 | Relatórios | ⬜ |
| 4 | Chat interno | ⬜ |
| 5 | Testes e deploy | ⬜ |

---

## 🚀 Deploy

### Docker Compose (CRM)
```yaml
version: '3.8'

services:
  crm-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - VITE_API_URL=https://api.iau2.com.br
      - VITE_SOCKET_URL=wss://api.iau2.com.br
    networks:
      - easypanel
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.crm.rule=Host(`crm.iau2.com.br`)"
      - "traefik.http.routers.crm.tls.certresolver=letsencrypt"

  crm-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgres://user:pass@postgres:5432/crm
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
      - WHATSMIAU_API_URL=http://whatsmiau2_whatsmiau2:8081
      - EVOLUTION_API_URL=http://aci_evolution:8080
    networks:
      - easypanel
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.crm-api.rule=Host(`api.iau2.com.br`) && PathPrefix(`/crm`)"
      - "traefik.http.routers.crm-api.tls.certresolver=letsencrypt"

networks:
  easypanel:
    external: true
```

---

## ✅ Próximos Passos

1. **Confirmar stack tecnológico** com o usuário
2. **Iniciar Fase 1** - Setup do projeto
3. **Criar migrations** do banco de dados
4. **Implementar autenticação**
5. **Construir layout principal**

---

*Documento criado em: 2025-12-26*
*Versão: 1.0*
