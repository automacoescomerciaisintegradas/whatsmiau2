# Configuração de Webhooks - Mercado Pago

Este documento explica como configurar os webhooks do Mercado Pago para receber notificações de pagamento automaticamente.

## URL do Webhook

A URL do webhook já está configurada automaticamente nas preferências de checkout:

```
https://api.automacoescomerciais.com.br/v1/webhooks/mercadopago
```

## Como Configurar no Painel do Mercado Pago

### 1. Acesse o Painel de Desenvolvedores

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Faça login com sua conta Mercado Pago
3. Selecione sua aplicação ou crie uma nova

### 2. Configure os Webhooks

1. No menu lateral, clique em **"Webhooks"** ou **"Notificações"**
2. Clique em **"Configurar notificações"** ou **"Adicionar URL"**
3. Insira a URL do webhook:
   ```
   https://api.automacoescomerciais.com.br/v1/webhooks/mercadopago
   ```

### 3. Selecione os Eventos

Marque os seguintes eventos para receber notificações:

- ✅ **Pagamentos** (payments)
  - payment.created
  - payment.updated
  
- ✅ **Planos de assinatura** (plan)
  - preapproval_plan.created
  - preapproval_plan.updated

- ✅ **Assinaturas** (subscription)
  - subscription.created
  - subscription.updated
  - subscription.preapproval_plan_id_updated
  - subscription.application_id_updated
  - subscription.authorized_payment.created

### 4. Salve as Configurações

Clique em **"Salvar"** para aplicar as configurações.

## Formato dos Webhooks

### Webhook de Pagamento (payment)

Quando um pagamento é aprovado, o Mercado Pago envia:

```json
{
  "action": "payment.created",
  "api_version": "v1",
  "data": {
    "id": "1234567890"
  },
  "date_created": "2026-01-22T21:00:00Z",
  "id": 123456789,
  "live_mode": true,
  "type": "payment",
  "user_id": "1035963718"
}
```

### Como o Sistema Processa

1. O sistema recebe o webhook em `/v1/webhooks/mercadopago`
2. Extrai o `data.id` (ID do pagamento)
3. Consulta os detalhes do pagamento na API do Mercado Pago
4. Busca o `external_reference` (formato: `SUB_123`)
5. Se o status for `approved`, ativa a assinatura correspondente

## Testando Webhooks Localmente

### Usando ngrok (Desenvolvimento Local)

Para testar webhooks em ambiente local:

1. Instale o ngrok: https://ngrok.com/download

2. Execute:
   ```bash
   ngrok http 8085
   ```

3. Copie a URL gerada (ex: `https://abc123.ngrok.io`)

4. Configure no Mercado Pago:
   ```
   https://abc123.ngrok.io/v1/webhooks/mercadopago
   ```

### Script de Teste Manual

Execute o script de teste incluído:

```bash
go run cmd/test_webhook/main.go
```

Este script simula webhooks do Mercado Pago para testar a integração.

## Logs e Debugging

### Verificando Logs

Os webhooks são logados com detalhes completos. Para ver os logs:

```bash
# Ver logs em tempo real
tail -f server.log

# Filtrar apenas webhooks
grep "Webhook" server.log
```

### Informações Logadas

- ✅ Cabeçalhos HTTP recebidos
- ✅ Body completo do webhook
- ✅ Dados parseados do payload
- ✅ Ações executadas (ativação de assinatura, etc)
- ✅ Erros e warnings

## Endpoints Disponíveis

### Webhook Principal
```
POST /v1/webhooks/mercadopago
```
Recebe notificações do Mercado Pago

### Webhook Legacy (Compatibilidade)
```
POST /v1/webhooks/payment
```
Mantido para compatibilidade com versões anteriores

## Segurança

### Validação de Origem

Embora não seja obrigatório, recomenda-se validar a origem dos webhooks:

1. **IP Whitelist**: Configure seu firewall para aceitar apenas IPs do Mercado Pago
2. **Verificação de Signature**: Implemente verificação de assinatura (x-signature)

### IPs do Mercado Pago

Os webhooks virão dos seguintes ranges de IP:
- 209.225.49.0/24
- 216.33.196.0/24
- 216.33.197.0/24
- 52.0.0.0/8

## Troubleshooting

### Webhook não está sendo recebido

1. Verifique se a URL está acessível publicamente
2. Teste com curl:
   ```bash
   curl -X POST https://api.automacoescomerciais.com.br/v1/webhooks/mercadopago \
        -H "Content-Type: application/json" \
        -d '{"type":"payment","data":{"id":"test"}}'
   ```

3. Verifique os logs do servidor
4. Certifique-se de que o firewall permite conexões na porta 443/80

### Webhook retorna erro 500

1. Verifique os logs do servidor para detalhes do erro
2. Confirme que o token de acesso do Mercado Pago está configurado
3. Teste a API do MP manualmente

### Assinatura não é ativada

1. Verifique se o `external_reference` foi enviado corretamente (formato: `SUB_123`)
2. Confirme que a assinatura existe no banco de dados
3. Verifique se o status do pagamento é `approved`

## Documentação Oficial

- [Webhooks - Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [IPN - Instant Payment Notification](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/ipn)

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Execute o script de teste
3. Consulte a documentação oficial do Mercado Pago
