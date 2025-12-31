# 📱 Guia Rápido: Conectar WhatsApp via Código

## ✅ Método Recomendado: Pareamento por Código

O método de código é **mais confiável** e **mais rápido** que o QR Code!

---

## 🚀 Passo a Passo

### 1. **Acesse a Página de Pareamento**
```
http://localhost:3000/pairing.html
```

### 2. **Digite seu Número**
- Formato: `5511999999999` (código do país + DDD + número)
- **IMPORTANTE:** Digite exatamente como aparece nas configurações do WhatsApp
- Se tiver 9 dígitos após o DDD, use: `55119XXXXXXXX`
- Se tiver 8 dígitos (linhas antigas), use: `5511XXXXXXXX`

### 3. **Clique em "Limpar Sessão"** (Primeiro)
- Isso remove qualquer conexão antiga
- Evita erros de "já conectado"

### 4. **Clique em "Obter Código"**
- Um código de 8 caracteres será gerado
- Formato: `XXXX-XXXX`
- Exemplo: `HTK2-LMP9`

### 5. **No seu Celular (WhatsApp)**
1. Abra o **WhatsApp**
2. Vá em **⚙️ Configurações**
3. Toque em **Aparelhos conectados**
4. Toque em **Conectar um aparelho**
5. Toque em **Conectar com número de telefone**
6. Digite o código que apareceu na tela

### 6. **Aguarde a Conexão**
- A página vai monitorar automaticamente
- Quando conectar, você verá: **"🎉 CONECTADO COM SUCESSO!"**
- Será redirecionado para a página de conexões

---

## ⚠️ Problemas Comuns e Soluções

### ❌ "Número inválido"
**Solução:** Tente sem o 9 na frente
- Em vez de: `55119XXXXXXXX`
- Use: `5511XXXXXXXX`

### ❌ "Instance is not connected"
**Solução:** 
1. Clique em "Limpar Sessão"
2. Aguarde 3 segundos
3. Tente gerar o código novamente

### ❌ "Código expirado"
**Solução:**
- Clique em "Obter Código" novamente
- Você tem 2 minutos para usar cada código

### ❌ "404 page not found"
**Solução:**
- O backend Go não está rodando
- Verifique se a API está ativa em `http://localhost:8085`

---

## 🔧 Verificar Status da Conexão

### Via Browser
```
http://localhost:3000/connections
```

### Via API (PowerShell)
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/instance/connectionState/minha-instancia" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

---

## 📊 Estados da Instância

| Estado | Significado | Ação Necessária |
|--------|-------------|-----------------|
| `open` | ✅ Conectado | Nenhuma - tudo OK! |
| `close` | ❌ Desconectado | Fazer pareamento |
| `connecting` | 🔄 Conectando | Aguardar ou refazer |
| `qrcode` | 📱 Aguardando QR/Código | Escanear QR ou digitar código |

---

## 🎯 Dicas de Sucesso

### ✅ Faça Isso
- Use o método de **código** (mais confiável)
- Limpe a sessão antes de conectar
- Digite o número **exatamente** como está no WhatsApp
- Aguarde até 30 segundos após gerar o código

### ❌ Evite Isso
- Não use o QR Code se o código funcionar
- Não tente conectar múltiplas vezes rapidamente
- Não use números com espaços ou caracteres especiais
- Não feche a página enquanto aguarda conexão

---

## 🔄 Fluxo Completo (Resumo)

```
1. Acesse: http://localhost:3000/pairing.html
2. Digite seu número: 5511999999999
3. Clique: "Limpar Sessão" → Aguarde 3s
4. Clique: "Obter Código"
5. Veja o código: XXXX-XXXX
6. No celular: WhatsApp → Configurações → Aparelhos conectados
7. Toque: "Conectar com número de telefone"
8. Digite o código
9. Aguarde: "🎉 CONECTADO!"
10. Pronto! Use o disparador e outras funcionalidades
```

---

## 📞 Endpoints da API

### Gerar Código de Pareamento
```http
POST /api/instance/pairPhone/minha-instancia
Content-Type: application/json

{
  "phoneNumber": "5511999999999"
}
```

### Limpar Sessão
```http
DELETE /api/instance/logout/minha-instancia
```

### Verificar Status
```http
GET /api/instance/connectionState/minha-instancia
```

---

## 🎓 Informações Técnicas

### Formato do Número
- **Internacional:** Sempre use código do país (55 para Brasil)
- **DDD:** 2 dígitos (11, 21, 31, etc.)
- **Número:** 8 ou 9 dígitos
- **Sem formatação:** Apenas números, sem espaços, parênteses ou hífens

### Exemplo de Números Válidos
```
5511999998888  ✅ (SP - 9 dígitos)
5511988887777  ✅ (SP - 9 dígitos)
55113333444    ✅ (SP - 8 dígitos - linha antiga)
5521987654321  ✅ (RJ - 9 dígitos)
```

### Exemplo de Números Inválidos
```
11999998888    ❌ (falta código do país)
(11) 99999-8888 ❌ (tem formatação)
55 11 99999-8888 ❌ (tem espaços)
```

---

## 🚨 Troubleshooting Avançado

### Se NADA funcionar:

1. **Reinicie o servidor Node.js**
   ```powershell
   # No terminal do projeto
   Ctrl+C
   npm start
   ```

2. **Verifique se a API Go está rodando**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8085/health" -UseBasicParsing
   ```

3. **Limpe o cache do navegador**
   - Ctrl+Shift+Delete
   - Limpar cache e cookies

4. **Tente outro navegador**
   - Chrome, Edge, Firefox

5. **Verifique os logs do servidor**
   - Veja o terminal onde rodou `npm start`
   - Procure por erros em vermelho

---

## ✨ Após Conectar

Quando a conexão for bem-sucedida, você poderá:

- ✅ Usar o **Disparador** para enviar mensagens em massa
- ✅ Acessar o **Kanban (CRM)** para gerenciar leads
- ✅ Usar o **Chat Interno** para atendimento
- ✅ Gerenciar **Tickets** de suporte
- ✅ Configurar **Webhooks** para automações
- ✅ Criar **Campanhas de Email**

---

**Última atualização:** 2025-12-30  
**Versão:** WhatsMiau2 v2.0  
**Status:** ✅ Método de código totalmente funcional
