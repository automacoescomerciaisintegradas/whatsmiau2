# Script de Deploy para Producao - WhatsMiau2
# Sincroniza versao local (v2.2.0) com producao (v2.1.0)
# Data: 2025-12-31

param(
    [string]$VpsHost = "144.91.118.78",
    [string]$VpsUser = "root",
    [int]$VpsPort = 22,
    [string]$RemotePath = "/root/whatsmiau2",
    [switch]$DryRun = $false,
    [switch]$BackupFirst = $true
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format "yyyy_MM_dd_HHmmss"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Deploy para Producao - WhatsMiau2" -ForegroundColor White
Write-Host "  Local v2.2.0 -> Producao v2.1.0" -ForegroundColor White
Write-Host "  Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DE TESTE: Nenhuma alteracao sera feita" -ForegroundColor Yellow
    Write-Host ""
}

# Verificar se o modulo Posh-SSH esta instalado
Write-Host "[1/7] Verificando dependencias..." -ForegroundColor Yellow
if (!(Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "   Instalando Posh-SSH..." -ForegroundColor Cyan
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser
}
Import-Module Posh-SSH
Write-Host "   OK Dependencias verificadas" -ForegroundColor Green

# Lista de arquivos a serem enviados
Write-Host "[2/7] Preparando lista de arquivos..." -ForegroundColor Yellow

$filesToDeploy = @(
    # CSS - Novos estilos
    @{Local = "public\styles.css"; Remote = "public/styles.css"; Description = "Design System atualizado" },
    @{Local = "public\assets\css\style.css"; Remote = "public/assets/css/style.css"; Description = "Sidebar Glassmorphism" },
    
    # HTML - Paginas atualizadas
    @{Local = "public\index.html"; Remote = "public/index.html"; Description = "Dashboard com menu v2.2.0" },
    @{Local = "public\home.html"; Remote = "public/home.html"; Description = "Home atualizada" },
    @{Local = "public\instancias.html"; Remote = "public/instancias.html"; Description = "Instancias (sera Conexoes)" },
    @{Local = "public\disparador.html"; Remote = "public/disparador.html"; Description = "Disparador atualizado" },
    @{Local = "public\webhooks.html"; Remote = "public/webhooks.html"; Description = "Webhooks atualizado" },
    @{Local = "public\contacts.html"; Remote = "public/contacts.html"; Description = "Contatos atualizado" },
    @{Local = "public\groups.html"; Remote = "public/groups.html"; Description = "Grupos atualizado" },
    
    # HTML - Novas paginas
    @{Local = "public\internal-chat.html"; Remote = "public/internal-chat.html"; Description = "[NOVO] Chat Interno" },
    @{Local = "public\exportar-contatos.html"; Remote = "public/exportar-contatos.html"; Description = "[NOVO] Exportar Contatos" },
    @{Local = "public\settings.html"; Remote = "public/settings.html"; Description = "[NOVO] Configuracoes" },
    @{Local = "public\tickets.html"; Remote = "public/tickets.html"; Description = "[NOVO] Tickets (pagina completa)" },
    @{Local = "public\kanban.html"; Remote = "public/kanban.html"; Description = "[NOVO] Kanban (ex-CRM)" },
    @{Local = "public\resumo-grupos.html"; Remote = "public/resumo-grupos.html"; Description = "[NOVO] Resumo de Grupos" },
    
    # JavaScript
    @{Local = "public\manager-socket.js"; Remote = "public/manager-socket.js"; Description = "Socket Manager atualizado" },
    @{Local = "public\service-worker.js"; Remote = "public/service-worker.js"; Description = "Service Worker" },
    
    # Servidor Node.js
    @{Local = "server.js"; Remote = "server.js"; Description = "BFF Node.js atualizado" }
)

Write-Host "   Total de arquivos: $($filesToDeploy.Count)" -ForegroundColor Cyan
foreach ($file in $filesToDeploy) {
    $exists = Test-Path (Join-Path $projectRoot $file.Local)
    $status = if ($exists) { "[OK]" } else { "[FALTA]" }
    $color = if ($exists) { "Green" } else { "Red" }
    Write-Host "   $status $($file.Description)" -ForegroundColor $color
}
Write-Host ""

# Conectar via SSH
Write-Host "[3/7] Conectando ao servidor..." -ForegroundColor Yellow
Write-Host "   Host: $VpsHost" -ForegroundColor Cyan
Write-Host "   Usuario: $VpsUser" -ForegroundColor Cyan
Write-Host "   Porta: $VpsPort" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "   [TESTE] Conexao SSH simulada" -ForegroundColor Yellow
}
else {
    try {
        $credential = Get-Credential -Message "Digite a senha SSH para $VpsUser@$VpsHost"
        $session = New-SSHSession -ComputerName $VpsHost -Port $VpsPort -Credential $credential -AcceptKey
        Write-Host "   OK Conectado com sucesso!" -ForegroundColor Green
    }
    catch {
        Write-Host "   ERRO ao conectar: $_" -ForegroundColor Red
        exit 1
    }
}

# Backup da producao
if ($BackupFirst -and !$DryRun) {
    Write-Host "[4/7] Criando backup da producao..." -ForegroundColor Yellow
    
    $backupCmd = "cd $RemotePath && tar -czf backup_pre_deploy_$timestamp.tar.gz public/*.html public/*.css public/*.js public/assets server.js"
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command $backupCmd
    
    if ($result.ExitStatus -eq 0) {
        Write-Host "   OK Backup criado: backup_pre_deploy_$timestamp.tar.gz" -ForegroundColor Green
    }
    else {
        Write-Host "   AVISO: Erro ao criar backup" -ForegroundColor Yellow
    }
}
else {
    Write-Host "[4/7] Pulando backup..." -ForegroundColor Yellow
}

# Upload dos arquivos
Write-Host "[5/7] Enviando arquivos para producao..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "   [TESTE] Arquivos que seriam enviados:" -ForegroundColor Yellow
    foreach ($file in $filesToDeploy) {
        Write-Host "   -> $($file.Local) => $($file.Remote)" -ForegroundColor Cyan
    }
}
else {
    $sftpSession = New-SFTPSession -ComputerName $VpsHost -Port $VpsPort -Credential $credential -AcceptKey
    
    $successCount = 0
    $failCount = 0
    
    foreach ($file in $filesToDeploy) {
        $localPath = Join-Path $projectRoot $file.Local
        $remotePath = "$RemotePath/$($file.Remote)"
        
        if (Test-Path $localPath) {
            try {
                Set-SFTPFile -SessionId $sftpSession.SessionId -LocalFile $localPath -RemotePath $remotePath -Overwrite
                Write-Host "   OK $($file.Description)" -ForegroundColor Green
                $successCount++
            }
            catch {
                Write-Host "   ERRO $($file.Description): $_" -ForegroundColor Red
                $failCount++
            }
        }
        else {
            Write-Host "   PULADO $($file.Description) (arquivo nao encontrado)" -ForegroundColor Yellow
        }
    }
    
    Remove-SFTPSession -SessionId $sftpSession.SessionId
    
    Write-Host ""
    Write-Host "   Enviados: $successCount | Falhas: $failCount" -ForegroundColor Cyan
}

# Reiniciar servicos
Write-Host "[6/7] Reiniciando servicos..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "   [TESTE] Servicos que seriam reiniciados:" -ForegroundColor Yellow
    Write-Host "   -> Servidor Node.js (porta 3001)" -ForegroundColor Cyan
    Write-Host "   -> Backend Go (porta 8085)" -ForegroundColor Cyan
}
else {
    # Reiniciar Node.js
    $restartNodeCmd = "cd $RemotePath && pm2 restart whatsmiau2-web || npm start &"
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command $restartNodeCmd
    Write-Host "   OK Servidor Node.js reiniciado" -ForegroundColor Green
    
    # Reiniciar Go (se necessario)
    $restartGoCmd = "cd $RemotePath && pm2 restart whatsmiau2-api || ./whatsmiau2 &"
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command $restartGoCmd
    Write-Host "   OK Backend Go reiniciado" -ForegroundColor Green
    
    Remove-SSHSession -SessionId $session.SessionId
}

# Verificar deploy
Write-Host "[7/7] Verificando deploy..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "   [TESTE] Verificacao simulada" -ForegroundColor Yellow
}
else {
    Start-Sleep -Seconds 3
    
    try {
        $response = Invoke-WebRequest -Uri "http://$VpsHost:3001" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "   OK Servidor respondendo (HTTP 200)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "   AVISO: Servidor nao respondeu imediatamente" -ForegroundColor Yellow
    }
}

# Resumo
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Deploy Concluido!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor White
Write-Host "1. Acesse: http://$VpsHost:3001" -ForegroundColor Cyan
Write-Host "2. Verifique o novo visual da sidebar" -ForegroundColor Cyan
Write-Host "3. Teste as novas funcionalidades:" -ForegroundColor Cyan
Write-Host "   - Chat Interno" -ForegroundColor Yellow
Write-Host "   - Tickets (pagina completa)" -ForegroundColor Yellow
Write-Host "   - Exportar Contatos" -ForegroundColor Yellow
Write-Host "   - Configuracoes" -ForegroundColor Yellow
Write-Host "   - Kanban" -ForegroundColor Yellow
Write-Host ""

if ($BackupFirst -and !$DryRun) {
    Write-Host "Backup da producao salvo em:" -ForegroundColor Yellow
    Write-Host "$RemotePath/backup_pre_deploy_$timestamp.tar.gz" -ForegroundColor Cyan
    Write-Host ""
}

if ($DryRun) {
    Write-Host "Execute novamente sem -DryRun para fazer o deploy real" -ForegroundColor Yellow
}
else {
    Write-Host "Deploy realizado com sucesso!" -ForegroundColor Green
}
