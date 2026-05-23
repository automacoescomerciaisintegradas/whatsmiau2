# Testes e Exemplos - WhatsMiau2

Este diretório contém scripts e documentação para testar as funcionalidades do WhatsMiau2.

## 📚 Documentação

- **[API_MESSAGE_TESTING.md](docs/API_MESSAGE_TESTING.md)** - Guia completo de testes de envio de mensagens
- **[MERCADOPAGO_WEBHOOK_SETUP.md](docs/MERCADOPAGO_WEBHOOK_SETUP.md)** - Configuração de webhooks do Mercado Pago

## 🧪 Scripts de Teste

### 1. Teste de Mensagens (Go)

```bash
go run cmd/test_message/main.go
```

Este script:
- ✅ Faz login automaticamente
- ✅ Lista instâncias disponíveis
- ✅ Envia uma mensagem de teste
- ✅ Mostra dicas de troubleshooting

### 2. Teste de Mensagens (Shell)

```bash
chmod +x test_send_message.sh
./test_send_message.sh
```

Versão em shell script para ambientes Unix/Linux.

### 3. Teste do Mercado Pago

```bash
go run cmd/test_mp/main.go
```

Testa a criação de preferências de pagamento no Mercado Pago.

### 4. Teste de Webhooks

```bash
go run cmd/test_webhook/main.go
```

Simula webhooks do Mercado Pago para testar a integração.

## 🚀 Quick Start

### 1. Inicie o servidor

```bash
go run main.go
```

### 2. Crie um usuário de teste

```bash
curl -X POST http://localhost:8085/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "test123"
  }'
```

### 3. Faça login

```bash
curl -X POST http://localhost:8085/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@test.com",
    "password": "test123"
  }'
```

### 4. Crie uma instância

Acesse http://localhost:8085/ e:
1. Faça login com as credenciais criadas
2. Clique em "Nova Instância"
3. Escaneie o QR Code com seu WhatsApp

### 5. Envie uma mensagem de teste

```bash
# Substitua SEU_TOKEN e SUA_INSTANCIA pelos valores reais
curl -X POST 'http://localhost:8085/v1/message/sendText/SUA_INSTANCIA' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -d '{
    "number": "558894227586",
    "textMessage": {
      "text": "Olá! Mensagem de teste."
    }
  }'
```

## 📝 Formato Correto das Mensagens

### Mensagem de Texto

```json
{
  "number": "558894227586",
  "textMessage": {
    "text": "Sua mensagem aqui"
  },
  "options": {
    "delay": 1000,
    "presence": "composing",
    "linkPreview": true
  }
}
```

### Mensagem com Imagem

```json
{
  "number": "558894227586",
  "mediaMessage": {
    "mediatype": "image",
    "caption": "Legenda da imagem",
    "media": "https://exemplo.com/imagem.jpg"
  }
}
```

### Mensagem com Áudio

```json
{
  "number": "558894227586",
  "audioMessage": {
    "audio": "https://exemplo.com/audio.mp3",
    "ptt": true
  }
}
```

## ⚠️ Erros Comuns

### "Instance is not connected"

**Causa**: A instância do WhatsApp não está conectada.

**Solução**: 
1. Acesse http://localhost:8085/
2. Selecione a instância
3. Escaneie o QR Code

### "Instance not found"

**Causa**: O ID da instância está incorreto.

**Solução**: Liste as instâncias disponíveis:
```bash
curl http://localhost:8085/v1/instance \
  -H "Authorization: Bearer SEU_TOKEN"
```

### "Unauthorized"

**Causa**: Token JWT inválido ou expirado.

**Solução**: Faça login novamente para obter um novo token.

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Servidor
PORT=8085
DEBUG_MODE=true

# Banco de Dados
DIALECT_DB=sqlite3
DB_URL=file:data.db?_foreign_keys=on

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui

# Mercado Pago
ML_ACCESS_TOKEN=seu_token_aqui
ML_APP_ID=seu_app_id
ML_CLIENT_SECRET=seu_client_secret

# Evolution API (opcional)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_key
EVOLUTION_INSTANCE=pagamentos
```

## 📊 Monitoramento

### Ver logs em tempo real

```bash
tail -f server.log
```

### Filtrar logs de mensagens

```bash
grep "SendText" server.log
```

### Filtrar logs de webhooks

```bash
grep "Webhook" server.log
```

## 🌐 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/v1/auth/register` | Registrar novo usuário |
| POST | `/v1/auth/login` | Fazer login |
| GET | `/v1/instance` | Listar instâncias |
| POST | `/v1/instance` | Criar nova instância |
| POST | `/v1/message/sendText/:instance` | Enviar mensagem de texto |
| POST | `/v1/webhooks/mercadopago` | Webhook do Mercado Pago |
| GET | `/v1/plans` | Listar planos de assinatura |
| POST | `/v1/subscription/checkout` | Criar checkout de assinatura |

## 🆘 Suporte

Para dúvidas ou problemas:

1. Verifique a documentação completa em `docs/`
2. Execute os scripts de teste para diagnóstico
3. Consulte os logs do servidor
4. Abra uma issue no repositório

## 📄 Licença

Este projeto é parte do WhatsMiau2.
