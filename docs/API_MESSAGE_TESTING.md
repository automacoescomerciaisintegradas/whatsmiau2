# Guia de Testes - API de Mensagens

Este documento contém exemplos práticos para testar o envio de mensagens via API.

## Endpoints Disponíveis

### 1. Enviar Mensagem de Texto
```
POST /v1/message/sendText/:instance
```

### Formato Correto do Payload

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

## Exemplos de Uso

### Exemplo 1: Mensagem Simples

```bash
curl --location 'http://localhost:8085/v1/message/sendText/sua-instancia' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer SEU_TOKEN_JWT' \
--data '{
  "number": "558894227586",
  "textMessage": {
    "text": "Olá! Esta é uma mensagem de teste."
  }
}'
```

### Exemplo 2: Mensagem com Delay e Presença

```bash
curl --location 'http://localhost:8085/v1/message/sendText/sua-instancia' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer SEU_TOKEN_JWT' \
--data '{
  "number": "558894227586",
  "textMessage": {
    "text": "Mensagem com delay de 2 segundos e indicador de digitação"
  },
  "options": {
    "delay": 2000,
    "presence": "composing"
  }
}'
```

### Exemplo 3: Mensagem com Preview de Link

```bash
curl --location 'http://localhost:8085/v1/message/sendText/sua-instancia' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer SEU_TOKEN_JWT' \
--data '{
  "number": "558894227586",
  "textMessage": {
    "text": "Confira nosso site: https://automacoescomerciais.com.br"
  },
  "options": {
    "linkPreview": true
  }
}'
```

## Opções Disponíveis

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `delay` | number | Atraso em milissegundos antes de enviar (ex: 1000 = 1 segundo) |
| `presence` | string | Indicador de presença: `composing`, `recording`, `paused` |
| `linkPreview` | boolean | Habilita preview de links na mensagem |

## Formatos de Número

O número pode ser enviado nos seguintes formatos:
- `558894227586` (sem símbolos)
- `55 88 9422-7586` (formatado - será normalizado)
- `+558894227586` (com código do país)

**Importante**: O sistema normaliza automaticamente para o formato WhatsApp: `558894227586@s.whatsapp.net`

## Obtendo o Token de Autenticação

### 1. Faça Login

```bash
curl --location 'http://localhost:8085/v1/auth/login' \
--header 'Content-Type: application/json' \
--data '{
  "email": "seu-email@example.com",
  "password": "sua-senha"
}'
```

### 2. Copie o Token da Resposta

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "seu-email@example.com",
    "name": "Seu Nome"
  }
}
```

### 3. Use o Token nas Requisições

Adicione o token no header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Listando Instâncias

Para descobrir o ID da sua instância:

```bash
curl --location 'http://localhost:8085/v1/instance' \
--header 'Authorization: Bearer SEU_TOKEN_JWT'
```

Resposta:
```json
[
  {
    "id": "minha-instancia",
    "name": "WhatsApp Business",
    "status": "open",
    "profilePictureUrl": "..."
  }
]
```

Use o campo `id` no endpoint de envio: `/v1/message/sendText/minha-instancia`

## Códigos de Erro Comuns

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Instance is not connected"
}
```
**Solução**: Conecte a instância primeiro via QR Code

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Solução**: Verifique se o token JWT está correto e não expirado

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Instance not found"
}
```
**Solução**: Verifique se o ID da instância está correto

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this instance"
}
```
**Solução**: Verifique se você é o dono da instância

## Resposta de Sucesso

```json
{
  "key": {
    "remoteJid": "558894227586@s.whatsapp.net",
    "fromMe": true,
    "id": "3EB0F5F5F5F5F5F5F5F5F5F5F5F5F5F5"
  },
  "message": {
    "conversation": "Sua mensagem aqui"
  },
  "status": "PENDING",
  "messageTimestamp": "2026-01-22T21:30:00Z"
}
```

## Enviando Outros Tipos de Mensagem

### Imagem

```bash
curl --location 'http://localhost:8085/v1/instance/sua-instancia/message/image' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer SEU_TOKEN_JWT' \
--data '{
  "number": "558894227586",
  "mediaMessage": {
    "mediatype": "image",
    "caption": "Legenda da imagem",
    "media": "https://exemplo.com/imagem.jpg"
  }
}'
```

### Áudio

```bash
curl --location 'http://localhost:8085/v1/instance/sua-instancia/message/audio' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer SEU_TOKEN_JWT' \
--data '{
  "number": "558894227586",
  "audioMessage": {
    "audio": "https://exemplo.com/audio.mp3",
    "ptt": true
  }
}'
```

## Testando em Produção

Para ambiente de produção, substitua `localhost:8085` pelo domínio configurado:

```bash
curl --location 'https://api.automacoescomerciais.com.br/v1/message/sendText/sua-instancia' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer SEU_TOKEN_JWT' \
--data '{
  "number": "558894227586",
  "textMessage": {
    "text": "Mensagem em produção"
  }
}'
```

## Webhook de Retorno

Após enviar a mensagem, você receberá um webhook quando ela for entregue/lida.

Configure a URL do webhook em: `/v1/instance/:instance/webhook`

Exemplo de webhook recebido:
```json
{
  "event": "messages.update",
  "instance": "sua-instancia",
  "data": {
    "key": {
      "remoteJid": "558894227586@s.whatsapp.net",
      "id": "3EB0F5F5F5F5F5F5F5F5F5F5F5F5F5F5"
    },
    "status": "READ"
  }
}
```

## Troubleshooting

### Mensagem não é enviada

1. Verifique se a instância está conectada:
   ```bash
   curl 'http://localhost:8085/v1/instance/sua-instancia'
   ```

2. Verifique os logs do servidor:
   ```bash
   tail -f server.log | grep "SendText"
   ```

3. Teste a conexão com um número conhecido que tem WhatsApp

### Número inválido

Verifique se o número existe no WhatsApp:
```bash
curl --location 'http://localhost:8085/v1/instance/sua-instancia/chat/checkNumber' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer SEU_TOKEN_JWT' \
--data '{
  "numbers": ["558894227586"]
}'
```
