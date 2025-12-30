# 📋 Checklist de Homologação - WhatsMiau2 API

## 🎯 Objetivo
Validar todas as funcionalidades da API de WhatsApp antes de colocar em produção.

---

## 1️⃣ Infraestrutura

### Docker
- [ ] Docker Desktop está instalado e funcionando
- [ ] `docker-compose up -d` inicia sem erros
- [ ] Container `whatsmiau2` está rodando
- [ ] Container `whatsmiau2-redis` está rodando
- [ ] Container `qrserver` está rodando

### Rede
- [ ] API responde em `http://localhost:8081/health`
- [ ] QR Server responde em `http://localhost:3000/api/qrcode`

---

## 2️⃣ Autenticação

### API Key
- [ ] Requisição SEM api key retorna 401 Unauthorized
- [ ] Requisição COM api key válida funciona
- [ ] Header `apikey` funciona
- [ ] Header `Authorization: Bearer <key>` funciona

#### Comandos de teste:
```powershell
# Deve falhar (sem api key)
Invoke-RestMethod -Uri "http://localhost:8081/v1/instance" -Method Get

# Deve funcionar (com api key)
Invoke-RestMethod -Uri "http://localhost:8081/v1/instance" -Method Get -Headers @{apikey = "SUA_API_KEY"}
```

---

## 3️⃣ Gerenciamento de Instâncias

### Criar Instância
- [ ] POST `/v1/instance` cria uma nova instância
- [ ] Retorna instanceId único
- [ ] Retorna QR code se `qrcode: true`

```powershell
$body = '{"instanceName": "teste-homolog", "qrcode": true}'
Invoke-RestMethod -Uri "http://localhost:8081/v1/instance" `
  -Method Post -Body $body -ContentType "application/json" `
  -Headers @{apikey = "SUA_API_KEY"}
```

### Listar Instâncias
- [ ] GET `/v1/instance` lista todas as instâncias
- [ ] Retorna array com status de cada instância

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/v1/instance" -Method Get `
  -Headers @{apikey = "SUA_API_KEY"}
```

### Conectar Instância
- [ ] GET `/v1/instance/connect/:id` retorna QR code
- [ ] QR code é uma imagem PNG válida em base64
- [ ] Estado muda para "qrcode"

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/v1/instance/connect/teste-homolog" `
  -Method Get -Headers @{apikey = "SUA_API_KEY"}
```

### Status da Conexão
- [ ] GET `/v1/instance/connectionState/:id` retorna estado atual
- [ ] Estados possíveis: disconnected, qrcode, connecting, open

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/v1/instance/connectionState/teste-homolog" `
  -Method Get -Headers @{apikey = "SUA_API_KEY"}
```

### Desconectar/Logout
- [ ] DELETE `/v1/instance/logout/:id` desconecta a instância
- [ ] Estado muda para "disconnected"
- [ ] Sessão é removida

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/v1/instance/logout/teste-homolog" `
  -Method Delete -Headers @{apikey = "SUA_API_KEY"}
```

### Deletar Instância
- [ ] DELETE `/v1/instance/delete/:id` remove a instância
- [ ] Instância não aparece mais na listagem

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/v1/instance/delete/teste-homolog" `
  -Method Delete -Headers @{apikey = "SUA_API_KEY"}
```

---

## 4️⃣ Conexão WhatsApp

### Escaneamento do QR Code
- [ ] QR Code aparece na página HTML
- [ ] QR Code pode ser escaneado pelo WhatsApp
- [ ] Após escanear, estado muda para "open"
- [ ] Celular mostra "Dispositivo conectado"

### Reconexão Automática
- [ ] Após reiniciar container, conexão é restaurada
- [ ] Não precisa escanear QR novamente

### Múltiplos Dispositivos
- [ ] Pode conectar até 4 dispositivos no mesmo número
- [ ] Cada instância tem sessão independente

---

## 5️⃣ Envio de Mensagens

### Mensagem de Texto
- [ ] POST `/v1/message/sendText/:instance` envia texto
- [ ] Mensagem aparece no destinatário
- [ ] Retorna messageId

```powershell
$body = '{"number": "5511999999999", "textMessage": {"text": "Teste de homologação!"}}'
Invoke-RestMethod -Uri "http://localhost:8081/v1/message/sendText/teste-homolog" `
  -Method Post -Body $body -ContentType "application/json" `
  -Headers @{apikey = "SUA_API_KEY"}
```

### Mensagem com Imagem
- [ ] POST `/v1/message/sendMedia/:instance` envia imagem
- [ ] Suporta URL da imagem
- [ ] Suporta base64 da imagem
- [ ] Caption/legenda funciona

```powershell
$body = @{
  number = "5511999999999"
  mediaMessage = @{
    mediaType = "image"
    media = "https://exemplo.com/imagem.jpg"
    caption = "Teste de imagem"
  }
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8081/v1/message/sendMedia/teste-homolog" `
  -Method Post -Body $body -ContentType "application/json" `
  -Headers @{apikey = "SUA_API_KEY"}
```

### Mensagem com Vídeo
- [ ] Envia vídeo via URL
- [ ] Envia vídeo via base64
- [ ] Caption funciona

### Mensagem com Documento
- [ ] Envia documento (PDF, DOC, etc)
- [ ] Nome do arquivo aparece corretamente

### Mensagem de Áudio (PTT)
- [ ] POST `/v1/message/sendWhatsAppAudio/:instance` envia áudio
- [ ] Áudio aparece como mensagem de voz
- [ ] Formato OGG/OPUS funciona

```powershell
$body = @{
  number = "5511999999999"
  audioMessage = @{
    audio = "https://exemplo.com/audio.ogg"
    ptt = $true
  }
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8081/v1/message/sendWhatsAppAudio/teste-homolog" `
  -Method Post -Body $body -ContentType "application/json" `
  -Headers @{apikey = "SUA_API_KEY"}
```

---

## 6️⃣ Funcionalidades de Chat

### Verificar Número
- [ ] POST `/v1/chat/whatsappNumbers/:instance` verifica se número está no WhatsApp
- [ ] Retorna true/false para cada número

```powershell
$body = '{"numbers": ["5511999999999", "5511888888888"]}'
Invoke-RestMethod -Uri "http://localhost:8081/v1/chat/whatsappNumbers/teste-homolog" `
  -Method Post -Body $body -ContentType "application/json" `
  -Headers @{apikey = "SUA_API_KEY"}
```

### Marcar como Lido
- [ ] POST `/v1/chat/markMessageAsRead/:instance` marca mensagens como lidas
- [ ] Aparece o duplo check azul no remetente

### Enviar Presença (Digitando)
- [ ] POST `/v1/chat/sendPresence/:instance` mostra "digitando..."
- [ ] Destinatário vê indicador de digitação

```powershell
$body = '{"number": "5511999999999", "presence": "composing"}'
Invoke-RestMethod -Uri "http://localhost:8081/v1/chat/sendPresence/teste-homolog" `
  -Method Post -Body $body -ContentType "application/json" `
  -Headers @{apikey = "SUA_API_KEY"}
```

---

## 7️⃣ Webhooks (Recebimento)

### Configuração
- [ ] Webhook URL pode ser configurado na criação da instância
- [ ] Webhook token é enviado no header

### Eventos
- [ ] Recebe evento `MESSAGES_UPSERT` quando chega mensagem
- [ ] Recebe evento `CONNECTION_UPDATE` quando status muda
- [ ] Recebe evento `QRCODE_UPDATED` quando QR é atualizado

---

## 8️⃣ Tratamento de Erros

### Validação de Entrada
- [ ] Retorna 400 quando JSON é inválido
- [ ] Retorna 400 quando campos obrigatórios estão faltando
- [ ] Retorna 404 quando instância não existe
- [ ] Retorna 500 com mensagem clara em caso de erro interno

### Mensagens de Erro
- [ ] Erros retornam JSON com campos `error` e `message`
- [ ] Mensagens são claras e acionáveis

---

## 9️⃣ Performance

### Tempo de Resposta
- [ ] Health check responde em < 100ms
- [ ] Listagem de instâncias responde em < 500ms
- [ ] Envio de texto responde em < 2s
- [ ] Envio de mídia responde em < 10s

### Concorrência
- [ ] Suporta múltiplas requisições simultâneas
- [ ] Não há deadlocks ou race conditions

---

## 🔟 Logs e Monitoramento

### Logs Docker
- [ ] `docker-compose logs` mostra logs úteis
- [ ] Erros são logados com stack trace
- [ ] Logs de conexão/desconexão são registrados

### Monitoramento
- [ ] Endpoint `/health` pode ser usado para healthcheck
- [ ] Container reinicia automaticamente se falhar

---

## ✅ Critérios de Aprovação

| Categoria | Mínimo para Aprovar |
|-----------|---------------------|
| Infraestrutura | 100% |
| Autenticação | 100% |
| Gerenciamento de Instâncias | 100% |
| Conexão WhatsApp | 100% |
| Envio de Mensagens | 80% (texto obrigatório) |
| Funcionalidades de Chat | 50% |
| Webhooks | 50% |
| Tratamento de Erros | 80% |
| Performance | 80% |
| Logs | 50% |

---

## 📝 Observações da Homologação

**Data:** _______________

**Responsável:** _______________

**Versão Testada:** _______________

### Problemas Encontrados:
1. 
2. 
3. 

### Ações Corretivas:
1. 
2. 
3. 

### Resultado Final:
- [ ] APROVADO
- [ ] REPROVADO
- [ ] APROVADO COM RESSALVAS

**Assinatura:** _______________
