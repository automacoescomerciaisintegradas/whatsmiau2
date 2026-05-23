#!/bin/bash

# Script para testar webhook do Mercado Pago
# Execute após configurar o webhook no painel

echo "🧪 TESTANDO WEBHOOK DO MERCADO PAGO"
echo "=================================="
echo ""

# Teste 1: Verificar se o endpoint responde
echo "1️⃣ Testando endpoint do webhook..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8085/v1/webhooks/mercadopago)

if [ "$RESPONSE" = "405" ]; then
    echo "   ✅ Endpoint responde (405 = método não permitido, esperado)"
elif [ "$RESPONSE" = "200" ]; then
    echo "   ✅ Endpoint responde"
else
    echo "   ❌ Endpoint não responde (código: $RESPONSE)"
    exit 1
fi

echo ""

# Teste 2: Simular webhook
echo "2️⃣ Simulando webhook de teste..."
WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:8085/v1/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.created",
    "type": "payment",
    "data": {"id": "test_123"}
  }')

if [ "$WEBHOOK_RESPONSE" = '{"status":"received"}' ]; then
    echo "   ✅ Webhook simulado recebido com sucesso"
else
    echo "   ❌ Webhook simulado falhou"
    echo "   Resposta: $WEBHOOK_RESPONSE"
fi

echo ""

# Teste 3: Verificar logs recentes
echo "3️⃣ Verificando logs recentes..."
if tail -20 server.log 2>/dev/null | grep -q "Webhook received"; then
    echo "   ✅ Webhook aparece nos logs"
else
    echo "   ⚠️ Webhook não encontrado nos logs (ainda)"
fi

echo ""

# Instruções finais
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Configure o webhook no painel do MP (se ainda não fez)"
echo "2. Teste um pagamento real:"
echo "   - Acesse: http://localhost:8085/subscription-simple.html"
echo "   - Clique em 'Testar Agora'"
echo "   - Use cartão de teste: 5031 4332 1540 6351"
echo "3. Monitore os logs: tail -f server.log | grep Webhook"
echo ""
echo "📞 Se der certo, você verá: 'Subscription activated via MP Payment'"