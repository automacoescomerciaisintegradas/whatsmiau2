# Script de Deploy Simplificado - WhatsMiau2
# Usa SCP nativo do Windows/PowerShell
# Data: 2025-12-31

param(
    [string]$VpsHost = "144.91.118.78",
    [string]$VpsUser = "root",
    [string]$RemotePath = "/root/whatsmiau2"
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format "yyyy_MM_dd_HHmmss"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Deploy Simplificado - WhatsMiau2" -ForegroundColor White
Write-Host "  Local v2.2.0 -> Producao v2.1.0" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Lista de arquivos
$files = @(
    "public\styles.css",
    "public\assets\css\style.css",
    "public\index.html",
    "public\home.html",
    "public\instancias.html",
    "public\disparador.html",
    "public\webhooks.html",
    "public\contacts.html",
    "public\groups.html",
    "public\internal-chat.html",
    "public\exportar-contatos.html",
    "public\settings.html",
    "public\tickets.html",
    "public\kanban.html",
    "public\resumo-grupos.html",
    "public\manager-socket.js",
    "public\service-worker.js",
    "server.js"
)

Write-Host "[1/3] Criando pacote de deploy..." -ForegroundColor Yellow
$deployDir = Join-Path $projectRoot "deploy_temp"
if (Test-Path $deployDir) {
    Remove-Item -Path $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

# Copiar arquivos mantendo estrutura
foreach ($file in $files) {
    $sourcePath = Join-Path $projectRoot $file
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $deployDir $file
        $destDir = Split-Path -Parent $destPath
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "   OK $file" -ForegroundColor Green
    }
    else {
        Write-Host "   FALTA $file" -ForegroundColor Red
    }
}

# Criar script de deploy remoto
$deployScript = @"
#!/bin/bash
# Script de deploy automatico
cd $RemotePath

# Backup
echo "Criando backup..."
tar -czf backup_pre_deploy_$timestamp.tar.gz public/*.html public/*.css public/*.js public/assets server.js 2>/dev/null || true

# Copiar novos arquivos
echo "Copiando arquivos..."
cp -r /tmp/deploy_whatsmiau2/* .

# Reiniciar servicos
echo "Reiniciando servicos..."
pm2 restart whatsmiau2-web 2>/dev/null || (pkill -f "node server.js" && nohup node server.js > /dev/null 2>&1 &)
pm2 restart whatsmiau2-api 2>/dev/null || (pkill -f "./whatsmiau2" && nohup ./whatsmiau2 > /dev/null 2>&1 &)

echo "Deploy concluido!"
"@

$deployScriptPath = Join-Path $deployDir "deploy.sh"
$deployScript | Out-File -FilePath $deployScriptPath -Encoding ASCII -NoNewline

Write-Host ""
Write-Host "[2/3] Comandos para executar manualmente:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# 1. Enviar arquivos para VPS:" -ForegroundColor Cyan
Write-Host "scp -r $deployDir/* ${VpsUser}@${VpsHost}:/tmp/deploy_whatsmiau2/" -ForegroundColor White
Write-Host ""
Write-Host "# 2. Executar deploy na VPS:" -ForegroundColor Cyan
Write-Host "ssh ${VpsUser}@${VpsHost} 'bash /tmp/deploy_whatsmiau2/deploy.sh'" -ForegroundColor White
Write-Host ""
Write-Host "# OU execute tudo de uma vez:" -ForegroundColor Cyan
Write-Host "scp -r $deployDir/* ${VpsUser}@${VpsHost}:/tmp/deploy_whatsmiau2/ && ssh ${VpsUser}@${VpsHost} 'bash /tmp/deploy_whatsmiau2/deploy.sh'" -ForegroundColor White
Write-Host ""

Write-Host "[3/3] Pacote criado em: $deployDir" -ForegroundColor Green
Write-Host ""
Write-Host "Execute os comandos acima no terminal para fazer o deploy!" -ForegroundColor Yellow
