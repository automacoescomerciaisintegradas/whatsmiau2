# ============================================
# Deploy COMPLETO - Imagens + Stack
# WhatsMiau2 - Automações Comerciais
# ============================================

param(
    [string]$VpsHost = "144.91.118.78",
    [string]$VpsUser = "root",
    [int]$VpsPort = 22,
    [string]$StackName = "whatsmiau2",
    [string]$RemotePath = "/opt/whatsmiau2"
)

$ErrorActionPreference = "Stop"

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║     DEPLOY COMPLETO - WhatsMiau2 para VPS                 ║
║           Imagens + Compose + Stack                        ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# ============================================
# FASE 1: Deploy das Imagens
# ============================================
Write-Host "`n[FASE 1] Executando deploy das imagens..." -ForegroundColor Yellow
& "$PSScriptRoot\deploy-to-vps.ps1" -VpsHost $VpsHost -VpsUser $VpsUser -VpsPort $VpsPort

# ============================================
# FASE 2: Enviar docker-compose
# ============================================
Write-Host "`n[FASE 2] Enviando docker-compose.swarm.yml..." -ForegroundColor Yellow

# Criar diretório remoto
ssh -p $VpsPort "$VpsUser@$VpsHost" "mkdir -p $RemotePath"

# Enviar arquivo compose
$composeFile = "$PSScriptRoot\docker-compose.swarm.yml"
if (Test-Path $composeFile) {
    scp -P $VpsPort $composeFile "$VpsUser@$VpsHost`:$RemotePath/"
    Write-Host "[OK] docker-compose.swarm.yml enviado!" -ForegroundColor Green
} else {
    Write-Host "[ERRO] docker-compose.swarm.yml não encontrado!" -ForegroundColor Red
    exit 1
}

# Enviar .env se existir
$envFile = "$PSScriptRoot\.env"
if (Test-Path $envFile) {
    scp -P $VpsPort $envFile "$VpsUser@$VpsHost`:$RemotePath/"
    Write-Host "[OK] .env enviado!" -ForegroundColor Green
}

# ============================================
# FASE 3: Preparar VPS
# ============================================
Write-Host "`n[FASE 3] Preparando ambiente na VPS..." -ForegroundColor Yellow

# Criar volumes se não existirem
$volumeCommands = @"
docker volume create whatsmiau2_data 2>/dev/null || true
docker volume create qrserver_data 2>/dev/null || true
docker volume create whatsmiau2_redis_data 2>/dev/null || true
echo 'Volumes criados/verificados!'
"@

ssh -p $VpsPort "$VpsUser@$VpsHost" $volumeCommands
Write-Host "[OK] Volumes preparados!" -ForegroundColor Green

# Verificar/criar rede overlay
$networkCommands = @"
docker network create --driver=overlay network_swarm_public 2>/dev/null || echo 'Rede já existe'
docker network ls | grep network_swarm_public
"@

ssh -p $VpsPort "$VpsUser@$VpsHost" $networkCommands
Write-Host "[OK] Rede overlay verificada!" -ForegroundColor Green

# ============================================
# FASE 4: Deploy do Stack
# ============================================
Write-Host "`n[FASE 4] Fazendo deploy do stack..." -ForegroundColor Yellow

# Remover stack antigo se existir
Write-Host "  Removendo stack antigo (se existir)..." -ForegroundColor Gray
ssh -p $VpsPort "$VpsUser@$VpsHost" "docker stack rm $StackName 2>/dev/null || true"
Start-Sleep -Seconds 5

# Deploy novo stack
Write-Host "  Deployando novo stack..." -ForegroundColor Gray
$deployResult = ssh -p $VpsPort "$VpsUser@$VpsHost" "cd $RemotePath && docker stack deploy -c docker-compose.swarm.yml $StackName" 2>&1
Write-Host $deployResult

# Aguardar serviços subirem
Write-Host "`n  Aguardando serviços iniciarem (30s)..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# ============================================
# RESUMO FINAL
# ============================================
Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║              DEPLOY COMPLETO FINALIZADO!                   ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

Write-Host "Status dos serviços:" -ForegroundColor Cyan
ssh -p $VpsPort "$VpsUser@$VpsHost" "docker stack services $StackName"

Write-Host "`nContainers em execução:" -ForegroundColor Cyan
ssh -p $VpsPort "$VpsUser@$VpsHost" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep $StackName"

Write-Host "`n" -NoNewline
Write-Host "URLs de Acesso:" -ForegroundColor Yellow
Write-Host "  API WhatsMiau2: http://$VpsHost`:8085" -ForegroundColor White
Write-Host "  QR Server:      http://$VpsHost`:3001" -ForegroundColor White
Write-Host ""

# Verificar saúde da API
Write-Host "Testando saúde da API..." -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "http://$VpsHost`:8085/health" -TimeoutSec 10 -UseBasicParsing
    Write-Host "[OK] API respondendo! Status: $($health.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] API ainda não respondeu. Pode demorar alguns segundos para iniciar." -ForegroundColor Yellow
}

Write-Host "`nDeploy concluído!" -ForegroundColor Cyan
