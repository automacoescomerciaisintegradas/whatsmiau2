# 📋 CONFIGURAÇÃO DO WEBHOOK - MERCADO PAGO

## 🎯 PASSO A PASSO PARA CONFIGURAR

### 1. Acesse o Painel do Mercado Pago
```
🔗 URL: https://www.mercadopago.com.br/developers/panel
📧 Faça login com sua conta do Mercado Pago
```

### 2. Selecione sua Aplicação
- Na lista de aplicações, clique na que você criou para o WhatsMiau2
- Se não tiver uma aplicação, crie uma nova:
  - Nome: "WhatsMiau2"
  - Tipo: "Online payments"

### 3. Vá para Webhooks
- No menu lateral esquerdo, clique em **"Webhooks"**
- Ou **"Notificações"** (dependendo do idioma)

### 4. Adicione um Novo Webhook
- Clique no botão **"Adicionar URL"** ou **"Criar notificação"**
- **URL do Webhook** (copie exatamente):
  ```
  https://api.automacoescomerciais.com.br/v1/webhooks/mercadopago
  ```

### 5. Configure os Eventos
Marque estes eventos específicos:
- ✅ **Pagamentos (Payments)**
  - `payment.created` - Quando um pagamento é criado
  - `payment.updated` - Quando o status do pagamento muda

### 6. Salve as Configurações
- Clique em **"Salvar"** ou **"Criar"**
- Você deve ver uma confirmação de que o webhook foi criado

---

## 🔍 VERIFICAÇÃO DA CONFIGURAÇÃO

### Teste 1: Verificar se o Webhook Está Registrado
Após salvar, você deve ver na lista:
- ✅ URL: `https://api.automacoescomerciais.com.br/v1/webhooks/mercadopago`
- ✅ Status: "Ativo" ou "Active"
- ✅ Eventos: payment.created, payment.updated

### Teste 2: Enviar um Teste Manual
```bash
# Teste o endpoint do webhook
curl -X POST https://api.automacoescomerciais.com.br/v1/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.created",
    "data": {"id": "test_123"},
    "type": "payment"
  }'
```

**Resposta esperada**: `{"status":"received"}`

---

## 🧪 TESTE COM PAGAMENTO REAL

### 1. Acesse a Página de Teste
```
http://localhost:8085/subscription-simple.html
```

### 2. Faça um Pagamento de Teste
- Clique em qualquer plano "Testar Agora"
- Use as **credenciais de teste** do Mercado Pago:
  - Cartão: `5031 4332 1540 6351`
  - Validade: `11/25`
  - CVV: `123`
  - Nome: `APRO`

### 3. Monitore os Logs
```bash
# Em outro terminal, veja os logs em tempo real
tail -f server.log | grep -E "Webhook|Subscription|payment"
```

### 4. Verifique se Funcionou
Após o pagamento, você deve ver nos logs:
```
INFO  Webhook received
INFO  Processing real Mercado Pago payment
INFO  Subscription activated via MP Payment
```

---

## 📊 VERIFICAÇÃO DO STATUS DA ASSINATURA

### Antes do Pagamento:
```bash
curl http://localhost:8085/v1/subscription/me \
  -H "Authorization: Bearer SEU_TOKEN"
```
**Resposta**: `{"status":"none","subscription":null}`

### Após o Pagamento:
```bash
curl http://localhost:8085/v1/subscription/me \
  -H "Authorization: Bearer SEU_TOKEN"
```
**Resposta esperada**:
```json
{
  "status": "active",
  "subscription": {
    "id": 123,
    "plan_id": 1,
    "status": "active",
    "current_period_start": "2026-01-22T...",
    "current_period_end": "2026-02-22T..."
  }
}
```

---

## 🛠️ SOLUÇÃO DE PROBLEMAS

### ❌ Webhook Não Está Chegando

**Possíveis causas:**
1. URL incorreta
2. Servidor não acessível publicamente
3. Firewall bloqueando

**Soluções:**
```bash
# Teste se o servidor está acessível
curl -I https://api.automacoescomerciais.com.br/v1/webhooks/mercadopago

# Verifique se o endpoint responde
curl -X POST https://api.automacoescomerciais.com.br/v1/webhooks/mercadopago \
  -d '{"test": true}'
```

### ❌ Assinatura Não Ativa

**Verifique:**
1. O `external_reference` no webhook
2. Se a assinatura existe no banco
3. Os logs detalhados do servidor

```bash
# Ver logs específicos
grep "SUB_" server.log | tail -5
```

### ❌ Erro 404 no Webhook

**Causa:** Servidor não está rodando ou rota incorreta

```bash
# Verifique se o servidor está rodando
ps aux | grep "go run main.go"

# Teste localmente
curl http://localhost:8085/v1/webhooks/mercadopago
```

---

## 📞 SUPORTE

Se tiver problemas:

1. **Verifique os logs** do servidor
2. **Teste localmente** primeiro
3. **Use credenciais de teste** do MP
4. **Confirme a URL** do webhook

**Documentação oficial do Mercado Pago:**
https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

---

## ✅ CHECKLIST FINAL

- [ ] Acessou o painel do Mercado Pago
- [ ] Selecionou a aplicação correta
- [ ] Configurou a URL do webhook
- [ ] Selecionou os eventos payment.created e payment.updated
- [ ] Salvou as configurações
- [ ] Testou com um pagamento real
- [ ] Verificou os logs do servidor
- [ ] Confirmou que a assinatura foi ativada

**Status atual**: Aguardando configuração no painel do Mercado Pago ⏳

**Quando terminar, faça um teste e me informe o resultado!** 🎯</content>
<parameter name="filePath">D:\projetos2025\whatsmiau2\WEBHOOK_SETUP_GUIDE.md