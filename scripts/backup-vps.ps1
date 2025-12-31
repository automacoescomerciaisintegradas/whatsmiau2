# Script de Backup VPS - WhatsMiau2
# Data: 2025-12-31

param(
    [string]$BackupDir = "backups",
    [switch]$IncludeNodeModules = $false,
    [switch]$CompressBackup = $true
)

# Configuracoes
$timestamp = Get-Date -Format "yyyy_MM_dd_HHmmss"
$date = Get-Date -Format "yyyy_MM_dd"
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupPath = Join-Path $projectRoot $BackupDir
$todayBackupPath = Join-Path $backupPath "backup_$date"
$fullBackupPath = Join-Path $todayBackupPath "full_$timestamp"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  WhatsMiau2 - Backup VPS" -ForegroundColor White
Write-Host "  Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Criar diretorios de backup
Write-Host "[1/6] Criando estrutura de diretorios..." -ForegroundColor Yellow
if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
}
if (!(Test-Path $todayBackupPath)) {
    New-Item -ItemType Directory -Path $todayBackupPath -Force | Out-Null
}
New-Item -ItemType Directory -Path $fullBackupPath -Force | Out-Null
Write-Host "   OK Diretorios criados: $fullBackupPath" -ForegroundColor Green

# Backup de arquivos de configuracao
Write-Host "[2/6] Backup de arquivos de configuracao..." -ForegroundColor Yellow
$configFiles = @(
    ".env",
    ".env.example",
    "docker-compose.yml",
    "docker-compose.prod.yml",
    "docker-compose.swarm.yml",
    "docker-compose.easypanel.yml",
    "docker-compose.local.yml",
    "Dockerfile",
    "Dockerfile.qrserver",
    "Dockerfile.web",
    "nginx.conf",
    "package.json",
    "package-lock.json",
    "go.mod",
    "go.sum",
    "main.go",
    "server.js",
    "README.md",
    "VERSION"
)

$configBackupPath = Join-Path $fullBackupPath "config"
New-Item -ItemType Directory -Path $configBackupPath -Force | Out-Null

foreach ($file in $configFiles) {
    $sourcePath = Join-Path $projectRoot $file
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $configBackupPath -Force
        Write-Host "   OK $file" -ForegroundColor Green
    }
}

# Backup de diretorios importantes
Write-Host "[3/6] Backup de diretorios da aplicacao..." -ForegroundColor Yellow
$directories = @(
    "public",
    "internal",
    "cmd",
    "migrations",
    "scripts",
    "services",
    "tests",
    "docs"
)

foreach ($dir in $directories) {
    $sourcePath = Join-Path $projectRoot $dir
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $fullBackupPath $dir
        $parentDir = Split-Path -Parent $destPath
        if (!(Test-Path $parentDir)) {
            New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
        }
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
        Write-Host "   OK $dir" -ForegroundColor Green
    }
}

# Backup de frontend
$frontendSrc = Join-Path $projectRoot "frontend\src"
if (Test-Path $frontendSrc) {
    $destPath = Join-Path $fullBackupPath "frontend\src"
    New-Item -ItemType Directory -Path (Split-Path -Parent $destPath) -Force | Out-Null
    Copy-Item -Path $frontendSrc -Destination $destPath -Recurse -Force
    Write-Host "   OK frontend/src" -ForegroundColor Green
}

$frontendPublic = Join-Path $projectRoot "frontend\public"
if (Test-Path $frontendPublic) {
    $destPath = Join-Path $fullBackupPath "frontend\public"
    Copy-Item -Path $frontendPublic -Destination $destPath -Recurse -Force
    Write-Host "   OK frontend/public" -ForegroundColor Green
}

# Backup de bancos de dados
Write-Host "[4/6] Backup de bancos de dados..." -ForegroundColor Yellow
$dbBackupPath = Join-Path $fullBackupPath "databases"
New-Item -ItemType Directory -Path $dbBackupPath -Force | Out-Null

$databases = @(
    "data.db",
    "sessions.db"
)

foreach ($db in $databases) {
    $sourcePath = Join-Path $projectRoot $db
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $dbBackupPath -Force
        Write-Host "   OK $db" -ForegroundColor Green
    }
}

# Backup de dados persistentes
Write-Host "[5/6] Backup de dados persistentes..." -ForegroundColor Yellow
$dataPath = Join-Path $projectRoot "data"
if (Test-Path $dataPath) {
    $dataBackupPath = Join-Path $fullBackupPath "data"
    Copy-Item -Path $dataPath -Destination $dataBackupPath -Recurse -Force
    Write-Host "   OK Dados persistentes copiados" -ForegroundColor Green
}

# Criar arquivo de informacoes do backup
$backupDate = Get-Date -Format 'dd/MM/yyyy HH:mm:ss'
$versionPath = Join-Path $projectRoot "VERSION"
$versionContent = "N/A"
if (Test-Path $versionPath) {
    $versionContent = Get-Content $versionPath
}

$infoContent = "WhatsMiau2 - Informacoes do Backup`r`n"
$infoContent += "===================================`r`n"
$infoContent += "Data do Backup: $backupDate`r`n"
$infoContent += "Timestamp: $timestamp`r`n"
$infoContent += "Servidor: $env:COMPUTERNAME`r`n"
$infoContent += "Usuario: $env:USERNAME`r`n"
$infoContent += "Versao: $versionContent`r`n`r`n"
$infoContent += "Conteudo do Backup:`r`n"
$infoContent += "- Arquivos de configuracao`r`n"
$infoContent += "- Codigo-fonte (Go e JavaScript)`r`n"
$infoContent += "- Frontend`r`n"
$infoContent += "- Bancos de dados SQLite`r`n"
$infoContent += "- Dados persistentes`r`n"
$infoContent += "- Scripts e documentacao`r`n`r`n"

$infoPath = Join-Path $fullBackupPath "BACKUP_INFO.txt"
$infoContent | Out-File -FilePath $infoPath -Encoding UTF8
Write-Host "   OK Arquivo de informacoes criado" -ForegroundColor Green

# Compactar backup
if ($CompressBackup) {
    Write-Host "[6/6] Compactando backup..." -ForegroundColor Yellow
    $zipFile = Join-Path $todayBackupPath "backup_$timestamp.zip"
    
    try {
        Compress-Archive -Path $fullBackupPath -DestinationPath $zipFile -CompressionLevel Optimal -Force
        $zipSize = (Get-Item $zipFile).Length / 1MB
        $zipSizeRounded = [math]::Round($zipSize, 2)
        Write-Host "   OK Backup compactado: backup_$timestamp.zip ($zipSizeRounded MB)" -ForegroundColor Green
        
        # Remover pasta descompactada apos compactacao bem-sucedida
        Remove-Item -Path $fullBackupPath -Recurse -Force
        Write-Host "   OK Pasta temporaria removida" -ForegroundColor Green
    }
    catch {
        Write-Host "   ERRO ao compactar: $_" -ForegroundColor Red
    }
}

# Resumo
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Backup Concluido!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Localizacao: $todayBackupPath" -ForegroundColor White
Write-Host ""

# Listar backups do dia
Write-Host "Backups de hoje:" -ForegroundColor Yellow
Get-ChildItem -Path $todayBackupPath | ForEach-Object {
    if ($_.PSIsContainer) {
        Write-Host "  [DIR] $($_.Name)" -ForegroundColor Cyan
    }
    else {
        $size = $_.Length / 1MB
        $sizeRounded = [math]::Round($size, 2)
        Write-Host "  [ZIP] $($_.Name) - $sizeRounded MB" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Backup realizado com sucesso!" -ForegroundColor Green
