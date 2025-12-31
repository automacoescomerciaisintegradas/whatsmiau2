# 🔌 GUIA: Como Conectar o WhatsApp - WhatsMiau2

## ✅ Status Atual
- ✅ Servidor Node.js: RODANDO (porta 3002)
- ✅ Backend Go API: RODANDO (porta 8085)
- ⚠️ Instância WhatsApp: DESCONECTADA

---

## 📱 Passo a Passo para Conectar

### **1. Abra a Página de Pareamento**
```
http://localhost:3002/pairing?instance=minha-instancia
```

### **2. Prepare seu Número**
Você precisa saber o número EXATO do seu WhatsApp Business.

**Formato correto:**
```
55 11 999999999
└┘ └┘ └────────┘
│  │  └─ Número (8 ou 9 dígitos)
│  └─ DDD (2 dígitos)
└─ Código do país (55 = Brasil)
```

**Exemplos válidos:**
- `5511999998888` ✅ (SP - 9 dígitos)
- `5511988887777` ✅ (SP - 9 dígitos)  
- `55113333444` ✅ (SP - 8 dígitos - linha antiga)
- `5521987654321` ✅ (RJ - 9 dígitos)

**Como descobrir seu número:**
1. Abra o WhatsApp no celular
2. Vá em **Configurações**
3. Toque no seu perfil
4. Veja o número que aparece

---

## 🎯 Processo de Conexão

### **PASSO 1: Limpar Sessão Antiga**
1. Na página de pareamento, clique no botão vermelho **"Limpar Sessão"**
2. Aguarde aparecer: "✅ Sessão limpa!"
3. Espere **3 segundos**

### **PASSO 2: Digite seu Número**
1. No campo "Número do WhatsApp Business"
2. Digite APENAS números (sem espaços, parênteses ou hífens)
3. Exemplo: `5511999999999`

### **PASSO 3: Obter Código**
1. Clique no botão verde **"Obter Código"**
2. Aguarde alguns segundos
3. Um código aparecerá na tela (formato: `XXXX-XXXX`)
4. Exemplo: `ABCD-1234`

### **PASSO 4: No WhatsApp do Celular**

**No Android:**
1. Abra o **WhatsApp**
2. Toque nos **3 pontinhos** (canto superior direito)
3. Toque em **"Aparelhos conectados"**
4. Toque em **"Conectar um aparelho"**
5. Toque em **"Conectar com número de telefone"**
6. Digite o código que apareceu na tela do computador
7. Toque em **"Conectar"**

**No iPhone:**
1. Abra o **WhatsApp**
2. Vá em **Configurações** (canto inferior direito)
3. Toque em **"Aparelhos conectados"**
4. Toque em **"Conectar um aparelho"**
5. Toque em **"Conectar com número de telefone"**
6. Digite o código que apareceu na tela do computador
7. Toque em **"Conectar"**

### **PASSO 5: Aguarde a Confirmação**
- A página vai monitorar automaticamente
- Quando conectar, você verá: **"🎉 Conectado com sucesso!"**
- Será redirecionado para `/connections`

---

## ⚠️ Problemas Comuns

### ❌ "Número inválido"
**Causa:** O número não está no formato correto ou não corresponde ao WhatsApp

**Solução:**
1. Verifique se o número está EXATAMENTE como no WhatsApp
2. Tente **sem o 9** na frente:
   - Em vez de: `55119XXXXXXXX`
   - Use: `5511XXXXXXXX`
3. Alguns números antigos têm 8 dígitos após o DDD

### ❌ "Código expirado"
**Causa:** O código tem validade de 2 minutos

**Solução:**
1. Clique em "Limpar Sessão"
2. Clique em "Obter Código" novamente
3. Digite o novo código mais rápido

### ❌ "Erro ao gerar código"
**Causa:** Problema de comunicação com a API

**Solução:**
1. Verifique se o backend está rodando:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8085/health" -UseBasicParsing
   ```
2. Se não estiver, inicie o backend Go
3. Tente novamente

### ❌ Fica "Conectando..." infinitamente
**Causa:** Sessão antiga travada

**Solução:**
1. Clique em "Limpar Sessão"
2. Aguarde 5 segundos
3. Recarregue a página (F5)
4. Tente novamente do zero

---

## 🔍 Verificar Status da Conexão

### Via Browser
```
http://localhost:3002/connections
```

### Via PowerShell
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3002/api/instance/connectionState/minha-instancia" -UseBasicParsing
$response.Content | ConvertFrom-Json
```

**Possíveis estados:**
- `"state": "open"` ✅ = Conectado
- `"state": "close"` ❌ = Desconectado
- `"state": "connecting"` 🔄 = Conectando

---

## 📝 Checklist de Conexão

Antes de tentar conectar, verifique:

- [ ] Servidor Node.js rodando (porta 3002)
- [ ] Backend Go rodando (porta 8085)
- [ ] Número do WhatsApp correto e completo
- [ ] WhatsApp instalado e funcionando no celular
- [ ] Celular com internet ativa
- [ ] Página de pareamento aberta no navegador

---

## 🎓 Dicas Importantes

### ✅ Faça Isso
- Use o método de **código** (mais confiável que QR)
- Limpe a sessão antes de cada tentativa
- Digite o número **exatamente** como está no WhatsApp
- Aguarde até 30 segundos após gerar o código
- Mantenha o celular com boa conexão de internet

### ❌ Evite Isso
- Não tente conectar múltiplas vezes rapidamente
- Não use números com espaços ou caracteres especiais
- Não feche a página enquanto aguarda conexão
- Não use o mesmo código mais de uma vez

---

## 🚀 Após Conectar com Sucesso

Quando a conexão for estabelecida, você poderá:

1. ✅ Ver a instância como "Conectado" em `/connections`
2. ✅ Usar o Disparador para enviar mensagens
3. ✅ Gerenciar grupos e contatos
4. ✅ Exportar contatos
5. ✅ Ver resumo de grupos
6. ✅ Usar todas as funcionalidades do WhatsMiau2

---

## 📞 Comandos Úteis

### Verificar se servidores estão rodando
```powershell
# Node.js
Invoke-WebRequest -Uri "http://localhost:3002/health" -UseBasicParsing

# Backend Go
Invoke-WebRequest -Uri "http://localhost:8085/health" -UseBasicParsing
```

### Ver status da instância
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/instance/connectionState/minha-instancia" -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Limpar sessão via comando
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/instance/logout/minha-instancia" -Method DELETE -UseBasicParsing
```

---

## ✨ Resumo Rápido

```
1. Abra: http://localhost:3002/pairing?instance=minha-instancia
2. Clique: "Limpar Sessão" → Aguarde 3s
3. Digite: Seu número (ex: 5511999999999)
4. Clique: "Obter Código"
5. Veja: Código na tela (ex: ABCD-1234)
6. No celular: WhatsApp → Configurações → Aparelhos conectados
7. Toque: "Conectar com número de telefone"
8. Digite: O código
9. Aguarde: "🎉 Conectado!"
10. Pronto! ✅
```

---

**Última atualização:** 2025-12-30 22:04 BRT  
**Status dos Serviços:** ✅ Todos operacionais  
**Pronto para conectar!** 🚀
