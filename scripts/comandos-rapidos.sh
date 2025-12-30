# ============================================
# COMANDOS RÁPIDOS - Cole no terminal SSH
# ============================================

# 1. Verificar se Docker Swarm está ativo
docker info --format '{{.Swarm.LocalNodeState}}'

# Se não estiver ativo, inicializar:
docker swarm init

# 2. Criar diretório (se não existir)
mkdir -p /opt/whatsmiau2
cd /opt/whatsmiau2

# 3. Listar arquivos disponíveis
ls -la

# 4. Verificar imagens Docker disponíveis
docker images | grep -E "whatsmiau2|qrserver"

# 5. Criar rede overlay (se necessário)
docker network create --driver=overlay network_swarm_public 2>/dev/null || echo "Rede já existe"

# 6. Se o arquivo docker-compose.swarm.yml existir, iniciar stack:
if [ -f docker-compose.swarm.yml ]; then
    docker stack deploy -c docker-compose.swarm.yml whatsmiau2
    echo "Stack iniciado!"
else
    echo "ERRO: docker-compose.swarm.yml não encontrado!"
    echo "Execute no Windows: scp docker-compose.swarm.yml root@144.91.118.78:/opt/whatsmiau2/"
fi

# 7. Verificar status
docker service ls
docker stack ps whatsmiau2

# 8. Ver logs (últimas 50 linhas)
docker service logs --tail 50 whatsmiau2_whatsmiau2
