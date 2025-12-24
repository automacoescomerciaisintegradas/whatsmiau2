# WhatsMiau2 - API WhatsApp em Go

Uma API de WhatsApp leve e eficiente construída em Go, usando a biblioteca [whatsmeow](https://github.com/tulir/whatsmeow).

## 🚀 Sobre o Projeto

WhatsMiau2 é um serviço backend para WhatsApp que fornece uma API HTTP para enviar e receber mensagens. É projetado para ser compatível com a [Evolution API](https://doc.evolution-api.com/), facilitando a migração.

### Características

- ⚡ **Leve e Eficiente**: Otimizado para baixo consumo de memória
- 🔧 **Production Ready**: Estável e confiável
- 📱 **Integração WhatsApp**: Conecta ao WhatsApp para enviar e receber mensagens
- 🌐 **HTTP API**: API RESTful para fácil integração
- 💾 **Redis Support**: Usa Redis para cache de sessões
- 📂 **SQLite/PostgreSQL**: Suporta múltiplos bancos de dados
- 🔐 **Autenticação**: Protegido por API Key
- 📝 **Logging Estruturado**: Usa Zap para logs

## 📋 Pré-requisitos

- Go 1.24 ou superior
- Redis (opcional, para cache)
- SQLite ou PostgreSQL

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/whatsmiau2.git
cd whatsmiau2
```

### 2. Instale as dependências

```bash
go mod tidy
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### 4. Execute a aplicação

```bash
go run main.go
```

## 🐳 Executando com Docker

### Build e execução

```bash
docker-compose up -d --build
```

### Ver logs

```bash
docker-compose logs -f
```

### Parar

```bash
docker-compose down
```

## ⚙️ Configuração

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| PORT | Porta do servidor | 8081 |
| DEBUG_MODE | Modo debug | false |
| DEBUG_WHATSMEOW | Debug do whatsmeow | false |
| REDIS_URL | URL do Redis | localhost:6379 |
| REDIS_PASSWORD | Senha do Redis | `` |
| DIALECT_DB | Tipo de banco (sqlite3/postgres) | sqlite3 |
| DB_URL | URL de conexão do banco | file:data.db?_foreign_keys=on |
| API_KEY | Chave de autenticação da API | `` |

## 📚 API Routes

### Instâncias

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /v1/instance | Criar nova instância |
| GET | /v1/instance | Listar instâncias |
| POST | /v1/instance/:id/connect | Conectar instância |
| POST | /v1/instance/:id/logout | Desconectar instância |
| DELETE | /v1/instance/:id | Deletar instância |
| GET | /v1/instance/:id/status | Status da instância |

### Mensagens

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /v1/message/sendText/:instance | Enviar texto |
| POST | /v1/message/sendMedia/:instance | Enviar mídia |
| POST | /v1/message/sendWhatsAppAudio/:instance | Enviar áudio |
| POST | /v1/message/sendReaction/:instance | Enviar reação |

### Chat

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /v1/chat/sendPresence/:instance | Enviar presença |
| POST | /v1/chat/markMessageAsRead/:instance | Marcar como lido |
| POST | /v1/chat/whatsappNumbers/:instance | Verificar números |

## 📝 Exemplos de Uso

### Criar Instância

```bash
curl -X POST 'http://localhost:8081/v1/instance' \
  -H 'Content-Type: application/json' \
  -H 'apikey: SUA_API_KEY' \
  -d '{
    "instanceName": "minha-instancia",
    "qrcode": true
  }'
```

### Conectar e Obter QR Code

```bash
curl -X POST 'http://localhost:8081/v1/instance/minha-instancia/connect' \
  -H 'apikey: SUA_API_KEY'
```

### Enviar Mensagem de Texto

```bash
curl -X POST 'http://localhost:8081/v1/message/sendText/minha-instancia' \
  -H 'Content-Type: application/json' \
  -H 'apikey: SUA_API_KEY' \
  -d '{
    "number": "5511999999999",
    "textMessage": {
      "text": "Olá, esta é uma mensagem de teste!"
    }
  }'
```

### Enviar Imagem

```bash
curl -X POST 'http://localhost:8081/v1/message/sendMedia/minha-instancia' \
  -H 'Content-Type: application/json' \
  -H 'apikey: SUA_API_KEY' \
  -d '{
    "number": "5511999999999",
    "mediaMessage": {
      "mediatype": "image",
      "media": "https://exemplo.com/imagem.jpg",
      "caption": "Legenda da imagem"
    }
  }'
```

### Enviar Áudio (Push-to-Talk)

```bash
curl -X POST 'http://localhost:8081/v1/message/sendWhatsAppAudio/minha-instancia' \
  -H 'Content-Type: application/json' \
  -H 'apikey: SUA_API_KEY' \
  -d '{
    "number": "5511999999999",
    "audioMessage": {
      "audio": "https://exemplo.com/audio.ogg",
      "ptt": true
    }
  }'
```

## 📡 Webhooks

Configure o webhook ao criar a instância para receber eventos:

```bash
curl -X POST 'http://localhost:8081/v1/instance' \
  -H 'Content-Type: application/json' \
  -H 'apikey: SUA_API_KEY' \
  -d '{
    "instanceName": "minha-instancia",
    "webhook": "https://seu-servidor.com/webhook",
    "webhookToken": "token-opcional"
  }'
```

### Eventos Suportados

| Evento | Descrição |
|--------|-----------|
| MESSAGES_UPSERT | Nova mensagem recebida |
| MESSAGES_UPDATE | Status de mensagem atualizado |
| CONTACTS_UPSERT | Contato criado/atualizado |
| CONNECTION_UPDATE | Estado da conexão alterado |
| QRCODE_UPDATED | Novo QR code gerado |

### Exemplo de Payload (MESSAGES_UPSERT)

```json
{
  "event": "MESSAGES_UPSERT",
  "instance": "minha-instancia",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0ABC123"
    },
    "pushName": "João",
    "message": {
      "conversation": "Olá!"
    },
    "messageType": "conversation",
    "messageTimestamp": 1702999999
  }
}
```

## 🔄 Compatibilidade com Evolution API

Esta API é compatível com a Evolution API. Se você está migrando da Evolution API, pode usar os mesmos endpoints:

| Evolution API | WhatsMiau2 |
|---------------|------------|
| POST /message/sendText/:instance | POST /v1/message/sendText/:instance |
| GET /instance/connect/:id | GET /v1/instance/connect/:id |

## 📁 Estrutura do Projeto

```
whatsmiau2/
├── main.go                    # Ponto de entrada
├── go.mod                     # Dependências Go
├── .env                       # Variáveis de ambiente
├── Dockerfile                 # Docker build
├── docker-compose.yml         # Docker Compose
└── internal/
    ├── config/
    │   └── config.go          # Carregamento de configurações
    ├── database/
    │   └── database.go        # Conexão com banco de dados
    ├── handlers/
    │   ├── instance.go        # Handlers de instância
    │   ├── message.go         # Handlers de mensagem
    │   └── chat.go            # Handlers de chat
    ├── middleware/
    │   └── middleware.go      # Middlewares (auth, cors, logger)
    ├── models/
    │   ├── instance.go        # Modelos de instância
    │   └── message.go         # Modelos de mensagem
    ├── server/
    │   └── server.go          # Servidor HTTP
    └── whatsapp/
        ├── manager.go         # Gerenciador de clientes
        ├── events.go          # Handler de eventos
        └── webhook.go         # Emissor de webhooks
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.

## 🙏 Agradecimentos

- [whatsmeow](https://github.com/tulir/whatsmeow) - Biblioteca Go para WhatsApp
- [Gin](https://github.com/gin-gonic/gin) - Framework HTTP
- [GORM](https://gorm.io/) - ORM para Go
- [Evolution API](https://doc.evolution-api.com/) - Referência de API
