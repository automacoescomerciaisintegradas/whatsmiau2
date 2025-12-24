# Documentação da API WhatsMiau2
**Versão da API:** 1.0.0  
**Base URL:** `https://api.iau2.com.br`

Bem-vindo à documentação oficial da API WhatsMiau2. Esta API permite a integração completa com o WhatsApp Multi-Device para envio de mensagens, gestão de instâncias e automação.

---

## 🔐 Autenticação

Todas as requisições devem incluir a chave de API no cabeçalho (Header) para autenticação.

| Header | Valor | Descrição |
| :--- | :--- | :--- |
| `apikey` | `SuaApiKeyAqui` | Chave de autenticação definida no seu arquivo .env |

---

## 📱 Gestão de Instâncias

### 1. Criar Nova Instância
Cria uma nova instância para conexão com o WhatsApp.

- **Método:** `POST`
- **Endpoint:** `/v1/instance/create`

**Corpo da Requisição (JSON):**
```json
{
  "instanceName": "minha-instancia",
  "token": "token-seguro-opcional",
  "qrcode": false
}
```

**Resposta de Sucesso:**
```json
{
  "instance": {
    "instanceName": "minha-instancia",
    "instanceId": "uuid-gerado",
    "status": "disconnected"
  },
  "hash": "uuid-gerado"
}
```

### 2. Conectar Instância (Gerar QR Code)
Inicia a sessão e retorna o QR Code para leitura se não estiver conectado.

- **Método:** `GET` ou `POST`
- **Endpoint:** `/v1/instance/connect/{id_da_instancia}`

**Resposta (QR Code gerado):**
```json
{
  "instance": "minha-instancia",
  "state": "qrcode",
  "qrcode": {
    "code": "2@...",
    "base64": "data:image/png;base64,..."
  }
}
```

### 3. Conectar com Código de Telefone (Recomendado)
Gera um código de 8 dígitos para conectar via "Conectar com número de telefone" no WhatsApp, evitando problemas de câmera/QR Code.

- **Método:** `POST`
- **Endpoint:** `/v1/instance/{id_da_instancia}/pairPhone`

**Corpo da Requisição (JSON):**
```json
{
  "phoneNumber": "5511999999999"
}
```

**Resposta:**
```json
{
  "instance": "minha-instancia",
  "code": "XYZ-123-ABC",
  "message": "Pairing code generated successfully"
}
```

### 4. Verificar Status de Conexão
Retorna o estado atual da instância (conectado, desconectado, qrcode).

- **Método:** `GET`
- **Endpoint:** `/v1/instance/connectionState/{id_da_instancia}`

**Resposta:**
```json
{
  "instance": "minha-instancia",
  "state": "open" 
}
```
*Note: `open` significa conectado e pronto.*

### 5. Desconectar (Logout)
Remove a sessão do WhatsApp e limpa os dados de conexão.

- **Método:** `DELETE`
- **Endpoint:** `/v1/instance/logout/{id_da_instancia}`

---

## 💬 Envio de Mensagens

### 1. Enviar Texto Simples
Envia uma mensagem de texto para um número ou grupo.

- **Método:** `POST`
- **Endpoint:** `/v1/message/sendText/{id_da_instancia}`

**Corpo da Requisição (JSON):**
```json
{
  "number": "5511999999999",
  "text": "Olá! Esta é uma mensagem de teste da API.",
  "options": {
    "delay": 1200,
    "presence": "composing"
  }
}
```

### 2. Enviar Mídia (Imagem/Vídeo/Documento)
Envia arquivos de mídia. Suporta URL pública ou Base64.

- **Método:** `POST`
- **Endpoint:** `/v1/message/sendMedia/{id_da_instancia}`

**Corpo da Requisição (JSON):**
```json
{
  "number": "5511999999999",
  "mediaMessage": {
    "mediatype": "image",
    "caption": "Foto do produto",
    "media": "https://exemplo.com/imagem.jpg"
  },
  "options": {
    "delay": 1200
  }
}
```

### 3. Enviar Áudio (Gravador)
Envia um arquivo de áudio como se tivesse sido gravado na hora (PTT/Ogg).

- **Método:** `POST`
- **Endpoint:** `/v1/message/sendWhatsAppAudio/{id_da_instancia}`

**Corpo da Requisição (JSON):**
```json
{
  "number": "5511999999999",
  "audio": "https://exemplo.com/audio.mp3"
}
```

---

## 👥 Chat e Presença

### 1. Verificar Números no WhatsApp
Verifica se uma lista de números possui conta no WhatsApp.

- **Método:** `POST`
- **Endpoint:** `/v1/chat/whatsappNumbers/{id_da_instancia}`

**Corpo da Requisição (JSON):**
```json
{
  "numbers": ["5511999999999", "5511888888888"]
}
```

### 2. Enviar Presença (Digitando/Gravando)
Simula ações de presença no chat.

- **Método:** `POST`
- **Endpoint:** `/v1/chat/sendPresence/{id_da_instancia}`

**Corpo da Requisição (JSON):**
```json
{
  "number": "5511999999999",
  "presence": "composing" 
}
```
### 2. Enviar Presença (Digitando/Gravando)
Simula ações de presença no chat.

- **Método:** `POST`
- **Endpoint:** `/v1/chat/sendPresence/{id_da_instancia}`

**Corpo da Requisição (JSON):**
```json
{
  "number": "5511999999999",
  "presence": "composing" 
}
```
*Valores possíveis para presence: `composing` (digitando), `recording` (gravando), `available`, `unavailable`.*

---

## 👤 Perfil e Contatos

### 1. Obter Foto de Perfil (Avatar)
Busca a URL da foto de perfil de um usuário.

- **Método:** `POST`
- **Endpoint:** `/v1/chat/getProfilePic/{id_da_instancia}`

**Corpo da Requisição (JSON):**
```json
{
  "number": "5511999999999",
  "preview": false
}
```
*Use `preview: true` para obter a miniatura.*

**Resposta:**
```json
{
  "url": "https://pps.whatsapp.net/...",
  "type": "image",
  "direct_path": "..."
}
```

### 2. Obter Status (Recado)
Busca o texto de "Recado" (About) de um usuário.

- **Método:** `POST`
- **Endpoint:** `/v1/chat/fetchStatus/{id_da_instancia}`

**Corpo da Requisição (JSON):**
```json
{
  "number": "5511999999999"
}
```

**Resposta:**
```json
{
  "status": "Busy at work 👨‍💻",
  "statusTime": 1678900000
}
```

---

## � Newsletter (Canais)

### 1. Seguir Canal
Segue um canal (newsletter) pelo JID.

- **Método:** `POST`
- **Endpoint:** `/v1/newsletter/follow/{id_da_instancia}`

**Corpo da Requisição (JSON):**
```json
{
  "jid": "1234567890@newsletter"
}
```

### 2. Deixar de Seguir Canal
Deixa de seguir um canal.

- **Método:** `POST`
- **Endpoint:** `/v1/newsletter/unfollow/{id_da_instancia}`

**Corpo da Requisição (JSON):**
```json
{
  "jid": "1234567890@newsletter"
}
```

### 3. Informações do Canal
Obtém metadados de um canal.

- **Método:** `GET`
- **Endpoint:** `/v1/newsletter/{id_da_instancia}/info?jid=1234567890@newsletter`

---

## �🛠️ Suporte e Créditos

Para suporte técnico ou dúvidas sobre a integração, entre em contato com nossa equipe.

**Desenvolvido por:**  
**Automações Comerciais Integradas! ⚙️**  
📧 [contato@automacoescomerciais.com.br](mailto:contato@automacoescomerciais.com.br)

© 2025 Automações Comerciais Integradas. Todos os direitos reservados.
