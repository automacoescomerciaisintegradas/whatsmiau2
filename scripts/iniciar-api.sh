#!/bin/bash
# ============================================
# Script de Inicialização - WhatsMiau2 API
# ============================================

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         INICIALIZAÇÃO WHATSMIAU2 - VPS                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 1. Verificar Docker
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. VERIFICANDO DOCKER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! systemctl is-active --quiet docker; then
    echo "[AVISO] Docker não está rodando. Iniciando..."
    systemctl start docker
    sleep 3
fi

if systemctl is-active --quiet docker; then
    echo "[OK] Docker está rodando"
else
    echo "[ERRO] Falha ao iniciar Docker"
    exit 1
fi

# 2. Verificar Docker Swarm
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. VERIFICANDO DOCKER SWARM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SWARM_STATE=$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null)

if [ "$SWARM_STATE" != "active" ]; then
    echo "[AVISO] Docker Swarm não está ativo. Inicializando..."
    docker swarm init 2>/dev/null || docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')
    echo "[OK] Docker Swarm inicializado"
else
    echo "[OK] Docker Swarm já está ativo"
fi

# 3. Verificar diretório de deploy
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. VERIFICANDO DIRETÓRIO DE DEPLOY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "/opt/whatsmiau2" ]; then
    echo "[AVISO] Diretório /opt/whatsmiau2 não existe. Criando..."
    mkdir -p /opt/whatsmiau2
fi

cd /opt/whatsmiau2 || exit 1
echo "[OK] Diretório: $(pwd)"

# 4. Verificar arquivo docker-compose
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. VERIFICANDO ARQUIVOS DE CONFIGURAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

COMPOSE_FILE=""
if [ -f "docker-compose.swarm.yml" ]; then
    COMPOSE_FILE="docker-compose.swarm.yml"
    echo "[OK] Encontrado: docker-compose.swarm.yml"
elif [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo "[OK] Encontrado: docker-compose.prod.yml"
elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
    echo "[OK] Encontrado: docker-compose.yml"
else
    echo "[ERRO] Nenhum arquivo docker-compose encontrado!"
    echo "Arquivos no diretório:"
    ls -la
    echo ""
    echo "Você precisa copiar o arquivo docker-compose para este diretório."
    echo "Execute no seu computador:"
    echo "  scp docker-compose.swarm.yml root@144.91.118.78:/opt/whatsmiau2/"
    exit 1
fi

# 5. Verificar imagens Docker
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. VERIFICANDO IMAGENS DOCKER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep -E "whatsmiau2|qrserver|REPOSITORY"

if ! docker images | grep -q "whatsmiau2"; then
    echo ""
    echo "[AVISO] Imagem 'whatsmiau2' não encontrada!"
    echo "Você precisa fazer o deploy das imagens primeiro."
    echo "Execute no seu computador:"
    echo "  .\deploy-to-vps.ps1"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# 6. Verificar stack existente
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. VERIFICANDO STACK EXISTENTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker stack ls | grep -q "whatsmiau2"; then
    echo "[INFO] Stack 'whatsmiau2' já existe"
    read -p "Deseja remover e recriar? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "[INFO] Removendo stack existente..."
        docker stack rm whatsmiau2
        echo "[INFO] Aguardando remoção completa (15 segundos)..."
        sleep 15
    else
        echo "[INFO] Mantendo stack existente"
        docker stack ps whatsmiau2
        exit 0
    fi
else
    echo "[OK] Nenhum stack existente"
fi

# 7. Criar rede overlay (se não existir)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. VERIFICANDO REDE OVERLAY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! docker network ls | grep -q "network_swarm_public"; then
    echo "[INFO] Criando rede overlay 'network_swarm_public'..."
    docker network create --driver=overlay network_swarm_public
    echo "[OK] Rede criada"
else
    echo "[OK] Rede overlay já existe"
fi

# 8. Deploy do stack
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. INICIANDO STACK WHATSMIAU2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$COMPOSE_FILE" = "docker-compose.swarm.yml" ]; then
    echo "[INFO] Usando Docker Swarm..."
    docker stack deploy -c "$COMPOSE_FILE" whatsmiau2
else
    echo "[INFO] Usando Docker Compose..."
    docker-compose -f "$COMPOSE_FILE" up -d
fi

echo ""
echo "[INFO] Aguardando serviços iniciarem (10 segundos)..."
sleep 10

# 9. Verificar status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. STATUS DOS SERVIÇOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$COMPOSE_FILE" = "docker-compose.swarm.yml" ]; then
    docker service ls
    echo ""
    echo "Detalhes do stack:"
    docker stack ps whatsmiau2
else
    docker-compose -f "$COMPOSE_FILE" ps
fi

# 10. Verificar portas
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "10. PORTAS EM USO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
netstat -tlnp | grep -E ":80 |:443 |:8081 |:3002 " || echo "Aguardando portas serem abertas..."

# 11. Resumo
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              INICIALIZAÇÃO CONCLUÍDA!                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

IP=$(hostname -I | awk '{print $1}')
echo "🌐 Acesse a API em:"
echo "   http://$IP"
echo "   http://144.91.118.78"
echo ""

echo "📊 Comandos úteis:"
echo "   docker service ls                    # Listar serviços"
echo "   docker service logs -f whatsmiau2_whatsmiau2  # Ver logs"
echo "   docker stack ps whatsmiau2           # Status do stack"
echo "   docker stack rm whatsmiau2           # Remover stack"
echo ""

echo "📝 Ver logs agora? (s/N): "
read -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    docker service logs --tail 50 -f whatsmiau2_whatsmiau2 2>/dev/null || \
    docker-compose -f "$COMPOSE_FILE" logs -f
fi
