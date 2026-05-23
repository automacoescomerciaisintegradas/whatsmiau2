#!/bin/bash
# Script para configurar o servidor (rodar no servidor)

set -euo pipefail

GITHUB_USER="${GITHUB_USER:-automacoescomerciaisintegradas}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "[ERRO] Defina a variavel GITHUB_TOKEN antes de executar este script."
  echo "Exemplo: export GITHUB_TOKEN=seu_token"
  exit 1
fi

# 1. Login no GitHub Container Registry (para baixar as imagens)
echo "Fazendo login no ghcr.io..."
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin

# 2. Login no NPM (se necessario para builds futuros)
echo "Fazendo login no NPM..."
npm config set registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken "$GITHUB_TOKEN"

# 3. Configurar o Webhook Watcher
echo "Configurando Webhook Watcher..."
if [ -f "webhook-watcher.service" ]; then
    sudo cp webhook-watcher.service /etc/systemd/system/webhook-watcher.service
    sudo systemctl daemon-reload
    sudo systemctl enable webhook-watcher
    sudo systemctl restart webhook-watcher
    echo "Webhook Watcher configurado e iniciado."
else
    echo "Arquivo webhook-watcher.service nao encontrado no diretorio atual."
fi

# 4. Verificar status
sudo systemctl status webhook-watcher --no-pager
