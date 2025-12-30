#!/bin/bash
# ============================================
# Script de Diagnóstico - WhatsMiau2 VPS
# ============================================

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         DIAGNÓSTICO WHATSMIAU2 - VPS                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 1. Verificar Docker
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. STATUS DO DOCKER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
systemctl status docker --no-pager | head -20
echo ""

# 2. Verificar Docker Swarm
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. STATUS DO DOCKER SWARM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || echo "Swarm não inicializado"
echo ""

# 3. Listar Stacks
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. STACKS DOCKER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker stack ls 2>/dev/null || echo "Nenhum stack encontrado"
echo ""

# 4. Listar Serviços
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. SERVIÇOS DOCKER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker service ls 2>/dev/null || echo "Nenhum serviço encontrado"
echo ""

# 5. Listar Containers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. CONTAINERS ATIVOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 6. Verificar Imagens
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. IMAGENS DOCKER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep -E "whatsmiau2|qrserver|REPOSITORY"
echo ""

# 7. Verificar Portas em Uso
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. PORTAS EM USO (80, 443, 8081, 3002)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
netstat -tlnp 2>/dev/null | grep -E ":80 |:443 |:8081 |:3002 " || echo "Nenhuma porta relevante em uso"
echo ""

# 8. Verificar Logs do Stack WhatsMiau2 (se existir)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. LOGS DO STACK WHATSMIAU2 (últimas 20 linhas)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if docker stack ps whatsmiau2 2>/dev/null | grep -q whatsmiau2; then
    docker service logs whatsmiau2_whatsmiau2 --tail 20 2>/dev/null || echo "Serviço whatsmiau2_whatsmiau2 não encontrado"
else
    echo "Stack 'whatsmiau2' não está rodando"
fi
echo ""

# 9. Verificar Diretórios de Deploy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. DIRETÓRIOS DE DEPLOY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh /opt/whatsmiau2/ 2>/dev/null || echo "Diretório /opt/whatsmiau2 não existe"
echo ""

# 10. Uso de Recursos
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "10. USO DE RECURSOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Memória:"
free -h
echo ""
echo "Disco:"
df -h | grep -E "Filesystem|/$"
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              DIAGNÓSTICO CONCLUÍDO                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
