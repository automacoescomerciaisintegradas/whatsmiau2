#!/bin/bash

# Script de teste para envio de mensagens
# WhatsMiau2 API Testing

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8085"

echo "==================================="
echo "  WhatsMiau2 - Teste de Mensagens"
echo "==================================="
echo ""

# Passo 1: Login
echo -e "${YELLOW}[1/3]${NC} Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "test123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗${NC} Falha no login"
    echo "Resposta: $LOGIN_RESPONSE"
    echo ""
    echo "Para criar um usuário de teste, execute:"
    echo "curl -X POST $BASE_URL/v1/auth/register \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"name\":\"Test User\",\"email\":\"test@test.com\",\"password\":\"test123\"}'"
    exit 1
fi

echo -e "${GREEN}✓${NC} Login bem-sucedido!"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Passo 2: Listar instâncias
echo -e "${YELLOW}[2/3]${NC} Listando instâncias..."
INSTANCES=$(curl -s -X GET "$BASE_URL/v1/instance" \
  -H "Authorization: Bearer $TOKEN")

echo "Instâncias encontradas:"
echo "$INSTANCES" | jq -r '.[] | "  - ID: \(.id) | Status: \(.status)"' 2>/dev/null || echo "$INSTANCES"

# Pegar primeira instância
INSTANCE_ID=$(echo $INSTANCES | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$INSTANCE_ID" ]; then
    echo -e "${RED}✗${NC} Nenhuma instância encontrada"
    echo "Crie uma instância em: $BASE_URL/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Usando instância: $INSTANCE_ID"
echo ""

# Passo 3: Enviar mensagem
echo -e "${YELLOW}[3/3]${NC} Enviando mensagem de teste..."

PHONE_NUMBER="558894227586"
MESSAGE="Olá! Esta é uma mensagem de teste do WhatsMiau2. Enviada em $(date '+%d/%m/%Y às %H:%M:%S')"

SEND_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/message/sendText/$INSTANCE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"number\": \"$PHONE_NUMBER\",
    \"textMessage\": {
      \"text\": \"$MESSAGE\"
    },
    \"options\": {
      \"delay\": 1000,
      \"presence\": \"composing\"
    }
  }")

# Verificar se foi sucesso (status 200)
if echo "$SEND_RESPONSE" | grep -q '"status"'; then
    echo -e "${GREEN}✓${NC} Mensagem enviada com sucesso!"
    echo "Para: $PHONE_NUMBER"
    echo "Mensagem: $MESSAGE"
    echo ""
    echo "Resposta:"
    echo "$SEND_RESPONSE" | jq '.' 2>/dev/null || echo "$SEND_RESPONSE"
else
    echo -e "${RED}✗${NC} Erro ao enviar mensagem"
    echo "Resposta:"
    echo "$SEND_RESPONSE" | jq '.' 2>/dev/null || echo "$SEND_RESPONSE"
    
    # Dicas de troubleshooting
    if echo "$SEND_RESPONSE" | grep -q "Instance is not connected"; then
        echo ""
        echo -e "${YELLOW}💡 Dica:${NC} A instância não está conectada."
        echo "   Acesse $BASE_URL/ e conecte via QR Code"
    fi
fi

echo ""
echo "==================================="
