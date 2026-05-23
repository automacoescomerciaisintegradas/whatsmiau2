$Server = "cleudocode@144.91.118.78"
$RemotePath = "/dockerlabs"

Write-Host "Iniciando pacote de deploy para $Server..."

# 1. Copiar arquivos de configuração essenciais
Write-Host "Copiando arquivos de configuração..."
scp docker-compose.yaml "${Server}:${RemotePath}/docker-compose.yaml"
scp .env "${Server}:${RemotePath}/.env"
scp webhook-watcher.service "${Server}:${RemotePath}/webhook-watcher.service"
scp scripts/server_setup.sh "${Server}:${RemotePath}/server_setup.sh"

# 2. Executar setup remotamente
Write-Host "Executando setup no servidor (Login Docker + Serviço)..."
ssh $Server "cd /dockerlabs && chmod +x server_setup.sh && ./server_setup.sh"

# 3. Executar bootstrap
Write-Host "Executando bootstrap..."
ssh $Server "cd /dockerlabs && chmod +x data/scripts/bootstrap && ./data/scripts/bootstrap"

Write-Host "✅ Deploy completo!"
