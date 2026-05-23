# 🚀 Guia Rápido - WhatsMiau2

Este guia mostra como executar os testes e usar o sistema.

## ⚡ Quick Start (3 minutos)

### 1. Inicie o servidor
```bash
go run main.go
```

### 2. Execute os testes
```bash
# Teste completo automatizado
go run cmd/test_mp/main.go        # Testa Mercado Pago
go run cmd/test_webhook/main.go   # Testa Webhooks
go run cmd/test_message/main.go   # Testa envio de mensagens
```

### 3. Acesse a interface
Abra no navegador: http://localhost:8085/

---

## 🧪 Testes Disponíveis

### Mercado Pago
```bash
go run cmd/test_mp/main.go
```
**Testa**: Criação de preferências de pagamento  
**Tempo**: ~2s  
**Resultado esperado**: URL de checkout gerada

### Webhooks
```bash
go run cmd/test_webhook/main.go
```
**Testa**: Recebimento de notificações do MP  
**Tempo**: ~1s  
**Resultado esperado**: Status 200

### Mensagens
```bash
go run cmd/test_message/main.go
```
**Testa**: Login → Listar instâncias → Enviar mensagem  
**Tempo**: ~1s  
**Resultado esperado**: Login OK (instâncias podem estar vazias)

---

## 🔧 Se algo der errado

### "UNIQUE constraint failed: users.google_id"
Execute a migração:
```bash
go run cmd/migrate_db/main.go
```

### "Instance not found"
Crie uma instância em: http://localhost:8085/

### "Unauthorized"
Crie um usuário:
```bash
curl -X POST http://localhost:8085/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Seu Nome","email":"seu@email.com","password":"senha123"}'
```

---

## 📝 Formato Correto de Envio de Mensagem

```bash
curl -X POST 'http://localhost:8085/v1/message/sendText/sua-instancia' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -d '{
    "number": "558894227586",
    "textMessage": {
      "text": "Olá! Esta é uma mensagem de teste."
    },
    "options": {
      "delay": 1000,
      "presence": "composing"
    }
  }'
```

---

## 📚 Documentação Completa

- **API de Mensagens**: `docs/API_MESSAGE_TESTING.md`
- **Webhooks do MP**: `docs/MERCADOPAGO_WEBHOOK_SETUP.md`
- **Relatório de Testes**: `docs/TEST_REPORT.md`
- **Guia de Testes**: `TESTING.md`

---

## ✅ Checklist de Produção

- [ ] Configurar webhook no painel do Mercado Pago
- [ ] Testar com credenciais de produção
- [ ] Configurar domínio (api.automacoescomerciais.com.br)
- [ ] Habilitar HTTPS
- [ ] Configurar backup do banco de dados
- [ ] Monitorar logs de webhooks

---

## 🆘 Suporte

**Email**: automacoescomerciais@gmail.com  
**Logs**: `tail -f server.log`  
**Status**: Todos os testes passando ✅

---

**Última atualização**: 22/01/2026  
**Versão**: 1.0.0
