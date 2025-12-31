# Script de Resgate e Deploy Completo
# Envia todo o código fonte e reconstrói o ambiente na VPS

$serverIp = "144.91.118.78"
$user = "root"
$remotePath = "/tmp/rescue_deploy"
$localPath = "c:\projetos2025\whatsmiau2"

Write-Host "--- INICIANDO DEPLOY DE RESGATE ---" -ForegroundColor Cyan

# 1. Limpar arquivos temporários locais
if (Test-Path "$localPath\deploy_package.zip") { Remove-Item "$localPath\deploy_package.zip" }
if (Test-Path "$localPath\temp_deploy") { Remove-Item "$localPath\temp_deploy" -Recurse -Force }

# 2. Preparar pacote
Write-Host "Preparando arquivos..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$localPath\temp_deploy" | Out-Null
Copy-Item "$localPath\package.json" "$localPath\temp_deploy\"
Copy-Item "$localPath\server.js" "$localPath\temp_deploy\"
Copy-Item "$localPath\public" "$localPath\temp_deploy\" -Recurse
# Copiar outros arquivos necessários se houver (ex: services, src)
if (Test-Path "$localPath\services") { Copy-Item "$localPath\services" "$localPath\temp_deploy\" -Recurse }

# 3. Zipar
Write-Host "Compactando..." -ForegroundColor Yellow
Compress-Archive -Path "$localPath\temp_deploy\*" -DestinationPath "$localPath\deploy_package.zip"

# 4. Enviar para VPS
Write-Host "Enviando para VPS ($serverIp)..." -ForegroundColor Yellow
# Criar pasta remota
ssh $user@$serverIp "rm -rf $remotePath && mkdir -p $remotePath"
# Enviar zip
scp "$localPath\deploy_package.zip" $user@$serverIp":"$remotePath/deploy_package.zip

# 5. Executar Deploy Remoto
Write-Host "Executando construção remota..." -ForegroundColor Yellow
$remoteScript = @"
cd $remotePath
unzip -o deploy_package.zip
ls -la

echo 'Criando Dockerfile...'
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [\"npm\", \"start\"]
EOF

echo 'Construindo imagem...'
docker build -t qrserver:latest .

echo 'Parando containers antigos...'
docker rm -f whatsmiau2_container || true
docker service rm whatsmiau2_qrserver || true

echo 'Iniciando novo container...'
# Rodar simples primeiro para garantir
docker run -d --name whatsmiau2_container --restart always -p 3001:3000 --network network_swarm_public qrserver:latest

echo 'DEPLOY CONCLUIDO!'
"@

ssh $user@$serverIp $remoteScript

Write-Host "--- FIM DO DEPLOY ---" -ForegroundColor Green
Write-Host "Verifique em http://$serverIp:3001" -ForegroundColor Cyan
