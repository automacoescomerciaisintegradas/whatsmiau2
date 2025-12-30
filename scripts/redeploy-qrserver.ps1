# ============================================
# Rebuild e Redeploy do QR Server com Frontend
# ============================================

param(
    [string]$VpsHost = "144.91.118.78",
    [string]$VpsUser = "root"
)

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║       REBUILD QR SERVER COM FRONTEND - WhatsMiau2         ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# 1. Build da nova imagem
Write-Host "[1/5] Building nova imagem do QR Server..." -ForegroundColor Yellow
docker build -f Dockerfile.qrserver -t qrserver:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao buildar imagem!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Imagem buildada com sucesso!" -ForegroundColor Green

# 2. Salvar imagem
Write-Host "`n[2/5] Exportando imagem..." -ForegroundColor Yellow
$tempDir = "$env:TEMP\qrserver-deploy"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

docker save -o "$tempDir\qrserver-latest.tar" qrserver:latest

if ($LASTEXITCODE -eq 0) {
    $fileSize = [math]::Round((Get-Item "$tempDir\qrserver-latest.tar").Length / 1MB, 2)
    Write-Host "[OK] Imagem exportada: $fileSize MB" -ForegroundColor Green
}
else {
    Write-Host "[ERRO] Falha ao exportar imagem!" -ForegroundColor Red
    exit 1
}

# 3. Transferir para VPS
Write-Host "`n[3/5] Transferindo para VPS..." -ForegroundColor Yellow
ssh "$VpsUser@$VpsHost" "mkdir -p /tmp/qrserver-deploy" 2>&1 | Out-Null
scp "$tempDir\qrserver-latest.tar" "${VpsUser}@${VpsHost}`:/tmp/qrserver-deploy/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Transferência concluída!" -ForegroundColor Green
}
else {
    Write-Host "[ERRO] Falha na transferência!" -ForegroundColor Red
    exit 1
}

# 4. Carregar imagem na VPS
Write-Host "`n[4/5] Carregando imagem no Docker da VPS..." -ForegroundColor Yellow
ssh "$VpsUser@$VpsHost" "docker load -i /tmp/qrserver-deploy/qrserver-latest.tar"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Imagem carregada!" -ForegroundColor Green
}
else {
    Write-Host "[ERRO] Falha ao carregar imagem!" -ForegroundColor Red
    exit 1
}

# 5. Atualizar serviço
Write-Host "`n[5/5] Atualizando serviço no Swarm..." -ForegroundColor Yellow
ssh "$VpsUser@$VpsHost" "docker service update --image qrserver:latest --force whatsmiau2_qrserver"

Write-Host "[OK] Serviço atualizado!" -ForegroundColor Green

# Limpar arquivos temporários
Write-Host "`n[INFO] Limpando arquivos temporários..." -ForegroundColor Yellow
ssh "$VpsUser@$VpsHost" "rm -rf /tmp/qrserver-deploy" 2>&1 | Out-Null
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║              DEPLOY CONCLUÍDO COM SUCESSO!                 ║
╚═══════════════════════════════════════════════════════════╝

Aguarde alguns segundos para o serviço reiniciar...

Acesse os frontends:
  • http://144.91.118.78:3001/automacao.html
  • http://144.91.118.78:3001/pairing.html
  • http://144.91.118.78:3001/disparador.html
  • http://144.91.118.78:3001/instancias.html

Ou via domínios (se DNS configurado):
  • https://automacao.iau2.com.br
  • https://pairing.iau2.com.br
  • https://qr.iau2.com.br
  • https://painel.iau2.com.br

"@ -ForegroundColor Green

Write-Host "Verificar status do serviço:" -ForegroundColor Yellow
Write-Host "  ssh $VpsUser@$VpsHost 'docker service ps whatsmiau2_qrserver'" -ForegroundColor Gray
Write-Host ""
