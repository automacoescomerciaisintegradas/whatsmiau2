# ============================================
# Configurar Chave SSH para VPS
# ============================================

param(
    [string]$VpsHost = "144.91.118.78",
    [string]$VpsUser = "root"
)

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║          CONFIGURAÇÃO DE CHAVE SSH - WhatsMiau2           ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Verificar se já existe chave SSH
$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
$sshPubKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"

if (-not (Test-Path $sshKeyPath)) {
    Write-Host "[INFO] Gerando nova chave SSH..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -f $sshKeyPath -N '""'
    Write-Host "[OK] Chave SSH gerada!" -ForegroundColor Green
}
else {
    Write-Host "[INFO] Chave SSH já existe em: $sshKeyPath" -ForegroundColor Cyan
}

# Copiar chave pública para o servidor
Write-Host "`n[INFO] Copiando chave pública para o servidor..." -ForegroundColor Yellow
Write-Host "Você precisará digitar a senha do servidor UMA ÚLTIMA VEZ." -ForegroundColor Yellow
Write-Host ""

$pubKey = Get-Content $sshPubKeyPath
$command = "mkdir -p ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

ssh "$VpsUser@$VpsHost" $command

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] Chave SSH configurada com sucesso!" -ForegroundColor Green
    Write-Host "Agora você pode conectar sem senha!" -ForegroundColor Green
    
    # Testar conexão
    Write-Host "`n[INFO] Testando conexão sem senha..." -ForegroundColor Yellow
    $test = ssh -o BatchMode=yes "$VpsUser@$VpsHost" "echo 'Conexão OK!'" 2>&1
    
    if ($test -match "Conexão OK") {
        Write-Host "[OK] Teste bem-sucedido! Conexão SSH sem senha funcionando!" -ForegroundColor Green
    }
    else {
        Write-Host "[AVISO] Teste falhou. Você pode precisar tentar novamente." -ForegroundColor Yellow
    }
}
else {
    Write-Host "`n[ERRO] Falha ao configurar chave SSH" -ForegroundColor Red
}

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                  CONFIGURAÇÃO CONCLUÍDA                    ║
╚═══════════════════════════════════════════════════════════╝

Próximo passo: Execute o diagnóstico novamente
  .\diagnostico-remoto.ps1

"@ -ForegroundColor Cyan
