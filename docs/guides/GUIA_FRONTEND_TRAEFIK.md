# ============================================
# GUIA: Configurar Frontend com Traefik
# ============================================

## 📋 Situação Atual

Você tem:
- ✅ Traefik rodando e configurado
- ✅ Domínios configurados no docker-compose.swarm.yml:
  - api.iau2.com.br → API Backend
  - qr.iau2.com.br → QR Server
  - automacao.iau2.com.br → Frontend
  - pairing.iau2.com.br → Frontend
  - painel.iau2.com.br → Frontend

## ⚠️ Problema

Os arquivos HTML (automacao.html, pairing.html, etc.) não estão sendo servidos porque:
1. O QR Server atual não está configurado para servir arquivos estáticos
2. Os arquivos HTML não foram copiados para o container

## 🚀 Solução 1: Usar Nginx para servir os arquivos HTML

### Passo 1: Criar um novo serviço no docker-compose.swarm.yml

Cole no SSH e edite o arquivo:

```bash
cd /opt/whatsmiau2
nano docker-compose.swarm.yml
```

Adicione este serviço ANTES da seção `networks:`:

```yaml
  frontend:
    image: nginx:alpine
    volumes:
      - frontend_data:/usr/share/nginx/html:ro
    networks:
      - network_swarm_public
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - traefik.enable=true
        # Automação
        - traefik.http.routers.automacao.rule=Host(`automacao.iau2.com.br`)
        - traefik.http.routers.automacao.entrypoints=websecure
        - traefik.http.routers.automacao.tls=true
        - traefik.http.routers.automacao.tls.certresolver=letsencryptresolver
        - traefik.http.routers.automacao.service=frontend
        # Pairing
        - traefik.http.routers.pairing.rule=Host(`pairing.iau2.com.br`)
        - traefik.http.routers.pairing.entrypoints=websecure
        - traefik.http.routers.pairing.tls=true
        - traefik.http.routers.pairing.tls.certresolver=letsencryptresolver
        - traefik.http.routers.pairing.service=frontend
        # Painel
        - traefik.http.routers.painel.rule=Host(`painel.iau2.com.br`)
        - traefik.http.routers.painel.entrypoints=websecure
        - traefik.http.routers.painel.tls=true
        - traefik.http.routers.painel.tls.certresolver=letsencryptresolver
        - traefik.http.routers.painel.service=frontend
        # Service port
        - traefik.http.services.frontend.loadbalancer.server.port=80
```

E adicione o volume na seção `volumes:`:

```yaml
volumes:
  whatsmiau2_data:
    external: true
    name: whatsmiau2_data
  qrserver_data:
    external: true
    name: qrserver_data
  whatsmiau2_redis_data:
    external: true
    name: whatsmiau2_redis_data
  frontend_data:  # ADICIONAR ESTA LINHA
```

### Passo 2: Criar o volume e copiar arquivos HTML

No seu **Windows**, execute:

```powershell
# 1. Criar um arquivo temporário com todos os HTMLs
$htmlFiles = @(
    "automacao.html",
    "pairing.html",
    "disparador.html",
    "instancias.html",
    "manager.html",
    "crm.html",
    "webhooks.html",
    "diagnostico.html",
    "index.html",
    "styles.css"
)

# 2. Copiar para o servidor
foreach ($file in $htmlFiles) {
    if (Test-Path $file) {
        scp $file root@144.91.118.78:/tmp/
    }
}

# 3. No SSH, copiar para o volume
# (Execute no servidor SSH)
```

### Passo 3: No SSH, copiar arquivos para o volume

```bash
# Criar volume
docker volume create frontend_data

# Criar container temporário para copiar arquivos
docker run --rm -v frontend_data:/data -v /tmp:/source alpine sh -c "cp /source/*.html /data/ && cp /source/*.css /data/ 2>/dev/null || true"

# Verificar
docker run --rm -v frontend_data:/data alpine ls -la /data/
```

### Passo 4: Fazer deploy do stack atualizado

```bash
cd /opt/whatsmiau2
docker stack deploy -c docker-compose.swarm.yml whatsmiau2
```

### Passo 5: Verificar

```bash
docker service ls | grep frontend
docker service logs whatsmiau2_frontend
```

## 🚀 Solução 2: Acesso direto via porta (Mais Rápido)

Se você só quer testar rapidamente sem configurar domínios:

```bash
# No SSH
cd /tmp
# Os arquivos HTML já devem estar aqui se você executou o SCP

# Iniciar um servidor HTTP simples
python3 -m http.server 8080 &

# Ou usar Nginx standalone
docker run -d --name frontend-temp \
  -p 8080:80 \
  -v /tmp:/usr/share/nginx/html:ro \
  nginx:alpine
```

Depois acesse: **http://144.91.118.78:8080/automacao.html**

## 🌐 Configurar DNS

Para os domínios funcionarem, você precisa configurar os registros DNS:

```
automacao.iau2.com.br  →  A  →  144.91.118.78
pairing.iau2.com.br    →  A  →  144.91.118.78
painel.iau2.com.br     →  A  →  144.91.118.78
api.iau2.com.br        →  A  →  144.91.118.78
qr.iau2.com.br         →  A  →  144.91.118.78
```

Ou use um wildcard:
```
*.iau2.com.br  →  A  →  144.91.118.78
```

## ✅ Resumo

1. **Solução 1** (Profissional): Adicionar serviço Nginx no docker-compose
2. **Solução 2** (Rápida): Usar container temporário ou Python HTTP server
3. **Configurar DNS** para os domínios funcionarem

Escolha a solução que preferir!
