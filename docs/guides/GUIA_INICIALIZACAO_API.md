# ============================================
# GUIA RÁPIDO - Inicializar API WhatsMiau2
# ============================================

## 🔐 PASSO 1: Conectar ao Servidor
```bash
ssh root@144.91.118.78
```

## 🐳 PASSO 2: Verificar Docker
```bash
# Verificar se Docker está rodando
systemctl status docker

# Se não estiver rodando, iniciar
systemctl start docker

# Verificar Docker Swarm
docker info --format '{{.Swarm.LocalNodeState}}'

# Se não estiver ativo, inicializar
docker swarm init
```

## 📦 PASSO 3: Verificar Imagens
```bash
# Listar imagens disponíveis
docker images | grep whatsmiau2

# Se as imagens não estiverem disponíveis, você precisa fazer o deploy primeiro
```

## 🚀 PASSO 4: Iniciar a API

### Opção A: Usando Docker Swarm (Recomendado para Produção)
```bash
# Navegar para o diretório
cd /opt/whatsmiau2

# Verificar se o arquivo existe
ls -l docker-compose.swarm.yml

# Deploy do stack
docker stack deploy -c docker-compose.swarm.yml whatsmiau2

# Verificar status
docker stack ps whatsmiau2
docker service ls
```

### Opção B: Usando Docker Compose (Mais Simples)
```bash
# Navegar para o diretório
cd /opt/whatsmiau2

# Verificar se o arquivo existe
ls -l docker-compose.prod.yml

# Iniciar serviços
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.prod.yml ps
```

## 📊 PASSO 5: Verificar Status
```bash
# Ver logs do serviço principal (Swarm)
docker service logs whatsmiau2_whatsmiau2 --tail 50

# Ver logs (Docker Compose)
docker-compose -f docker-compose.prod.yml logs -f

# Verificar portas em uso
netstat -tlnp | grep -E ':80 |:8081 |:3002 '

# Listar containers
docker ps -a
```

## 🔧 COMANDOS DE MANUTENÇÃO

### Parar a API
```bash
# Swarm
docker stack rm whatsmiau2

# Docker Compose
docker-compose -f docker-compose.prod.yml down
```

### Reiniciar a API
```bash
# Swarm
docker stack rm whatsmiau2
sleep 10
docker stack deploy -c docker-compose.swarm.yml whatsmiau2

# Docker Compose
docker-compose -f docker-compose.prod.yml restart
```

### Ver logs em tempo real
```bash
# Swarm
docker service logs -f whatsmiau2_whatsmiau2

# Docker Compose
docker-compose -f docker-compose.prod.yml logs -f whatsmiau2
```

## 🌐 ACESSAR A API

Após inicializar, acesse:
- **Frontend**: http://144.91.118.78
- **API Backend**: http://144.91.118.78:8081 (se exposta)

## ⚠️ SOLUÇÃO DE PROBLEMAS

### Se as imagens não existirem:
```bash
# Verificar se os arquivos .tar estão no servidor
ls -lh /tmp/docker-images/

# Carregar imagens manualmente
docker load -i /tmp/docker-images/whatsmiau2_latest.tar
docker load -i /tmp/docker-images/qrserver_latest.tar
```

### Se o diretório /opt/whatsmiau2 não existir:
```bash
# Criar diretório
mkdir -p /opt/whatsmiau2

# Você precisará copiar os arquivos do seu computador local:
# (Execute no seu computador Windows)
scp -P 22 docker-compose.swarm.yml root@144.91.118.78:/opt/whatsmiau2/
scp -P 22 docker-compose.prod.yml root@144.91.118.78:/opt/whatsmiau2/
```

## 🔄 DEPLOY COMPLETO (Do Zero)

Se você ainda não fez o deploy inicial, execute no seu computador Windows:

```powershell
# 1. Configurar SSH (uma vez)
.\configurar-ssh.ps1

# 2. Fazer deploy das imagens
.\deploy-to-vps.ps1

# 3. Copiar arquivos de configuração
scp docker-compose.swarm.yml root@144.91.118.78:/opt/whatsmiau2/

# 4. Iniciar stack (via SSH)
ssh root@144.91.118.78 "cd /opt/whatsmiau2 && docker stack deploy -c docker-compose.swarm.yml whatsmiau2"
```

## 📱 VERIFICAÇÃO RÁPIDA

Execute este comando para um diagnóstico completo:
```bash
curl -fsSL https://raw.githubusercontent.com/automacoescomerciaisintegradas/whatsmiau2/main/diagnostico-vps.sh | bash
```

Ou copie o script diagnostico-vps.sh para o servidor e execute:
```bash
chmod +x diagnostico-vps.sh
./diagnostico-vps.sh
```
