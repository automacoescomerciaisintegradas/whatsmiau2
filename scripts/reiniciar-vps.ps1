# ============================================
# Reiniciar Servidor VPS - WhatsMiau2
# ============================================

param(
    [string]$VpsHost = "144.91.118.78",
    [string]$VpsUser = "root",
    [int]$VpsPort = 22,
    [string]$StackName = "whatsmiau2"
)

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║         REINICIAR SERVIDOR VPS - WhatsMiau2               ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "VPS: $VpsUser@$VpsHost" -ForegroundColor Yellow
Write-Host ""

# 1. Verificar conexão
Write-Host "[1/4] Verificando conexão com VPS..." -ForegroundColor Yellow
try {
    $test = ssh -o ConnectTimeout=10 -p $VpsPort "$VpsUser@$VpsHost" "echo 'OK'" 2>&1
    if ($test -match "OK") {
        Write-Host "   ✅ Conexão estabelecida!" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Falha na conexão" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "   ❌ Erro: $_" -ForegroundColor Red
    exit 1
}

# 2. Parar stack atual
Write-Host "`n[2/4] Parando stack atual..." -ForegroundColor Yellow
ssh -p $VpsPort "$VpsUser@$VpsHost" "docker stack rm $StackName 2>/dev/null || true"
Write-Host "   Aguardando serviços pararem (15s)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# 3. Limpar recursos
Write-Host "`n[3/4] Limpando recursos..." -ForegroundColor Yellow
$cleanupCommands = @"
# Remover containers parados
docker container prune -f 2>/dev/null || true

# Limpar networks não utilizadas
docker network prune -f 2>/dev/null || true

echo 'Limpeza concluída'
"@

ssh -p $VpsPort "$VpsUser@$VpsHost" $cleanupCommands
Write-Host "   ✅ Recursos limpos!" -ForegroundColor Green

# 4. Reiniciar stack
Write-Host "`n[4/4] Reiniciando stack..." -ForegroundColor Yellow
$deployCommand = "cd /opt/whatsmiau2 && docker stack deploy -c docker-compose.swarm.yml $StackName --detach=false"
ssh -p $VpsPort "$VpsUser@$VpsHost" $deployCommand

Write-Host "`n   Aguardando serviços iniciarem (30s)..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Verificar status
Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              STACK REINICIADO!                            ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nStatus dos serviços:" -ForegroundColor Cyan
ssh -p $VpsPort "$VpsUser@$VpsHost" "docker stack services $StackName"

Write-Host "`nContainers em execução:" -ForegroundColor Cyan
ssh -p $VpsPort "$VpsUser@$VpsHost" "docker ps --filter 'name=$StackName' --format 'table {{.Names}}\t{{.Status}}'"

Write-Host "`n✅ Reinicialização concluída!" -ForegroundColor Green
Write-Host "`nAguarde 1-2 minutos para os serviços estabilizarem." -ForegroundColor Yellow
