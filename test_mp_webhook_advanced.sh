#!/bin/bash

# Script avançado para testar webhook do Mercado Pago
# Simula o formato exato enviado pelo MP

echo "🧪 TESTE AVANÇADO - WEBHOOK MERCADO PAGO"
echo "========================================"
echo ""

# Função para simular webhook
test_webhook() {
    local action=$1
    local payment_id=$2
    local status=$3

    echo "📤 Enviando webhook: $action (ID: $payment_id, Status: $status)"

    # Formato exato do Mercado Pago
    local payload="{
        \"action\": \"$action\",
        \"api_version\": \"v1\",
        \"data\": {
            \"id\": \"$payment_id\"
        },
        \"date_created\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
        \"id\": $(date +%s),
        \"live_mode\": false,
        \"type\": \"payment\",
        \"user_id\": \"1035963718\"
    }"

    # Se for payment.updated, adicionar status
    if [ "$action" = "payment.updated" ]; then
        payload=$(echo "$payload" | sed 's/}/,"status":"'$status'"}/')
    fi

    local response=$(curl -s -X POST http://localhost:8085/v1/webhooks/mercadopago \
        -H "Content-Type: application/json" \
        -H "User-Agent: MercadoPago/1.0" \
        -d "$payload")

    echo "📥 Resposta: $response"
    echo ""

    # Verificar logs
    if tail -10 server.log 2>/dev/null | grep -q "Webhook received"; then
        echo "✅ Webhook registrado nos logs"
    else
        echo "⚠️ Webhook não encontrado nos logs"
    fi
    echo ""
}

# Teste 1: Payment Created
echo "1️⃣ TESTE: Payment Created"
test_webhook "payment.created" "123456789" ""

# Teste 2: Payment Approved
echo "2️⃣ TESTE: Payment Approved"
test_webhook "payment.updated" "123456789" "approved"

# Teste 3: Payment Rejected
echo "3️⃣ TESTE: Payment Rejected"
test_webhook "payment.updated" "123456789" "rejected"

# Verificar status da assinatura
echo "4️⃣ VERIFICANDO STATUS DA ASSINATURA:"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RlMkB3aGF0cy5jb20iLCJleHAiOjE3NjkyMTg2MzYsInVzZXJfaWQiOjN9.KpdRuPK2b3mx6UmJeSYXruytNZANdfx1dPC6SafMjlQ"

subscription_status=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8085/v1/subscription/me)

if echo "$subscription_status" | grep -q '"status":"active"'; then
    echo "✅ Assinatura ATIVA! Webhook funcionando!"
elif echo "$subscription_status" | grep -q '"status":"none"'; then
    echo "⚠️ Assinatura ainda PENDENTE"
else
    echo "ℹ️ Status: $subscription_status"
fi

echo ""
echo "🎯 PRÓXIMO PASSO:"
echo "Configure o webhook no painel do MP e teste um pagamento real!"
echo "Monitore: tail -f server.log | grep Webhook"