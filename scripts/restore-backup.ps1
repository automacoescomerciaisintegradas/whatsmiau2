# Script de Restauracao de Backup - WhatsMiau2
# Data: 2025-12-31

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    
    [string]$RestoreDir = "restore_temp",
    
    [switch]$RestoreConfig = $true,
    [switch]$RestoreDatabases = $true,
    [switch]$RestoreCode = $true,
    [switch]$RestoreData = $true,
    
    [switch]$Force = $false
)

$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  WhatsMiau2 - Restauracao de Backup" -ForegroundColor White
Write-Host "  Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo de backup existe
if (!(Test-Path $BackupFile)) {
    Write-Host "ERRO: Arquivo de backup nao encontrado: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "Arquivo de backup: $BackupFile" -ForegroundColor White
$backupSize = (Get-Item $BackupFile).Length / 1MB
$backupSizeRounded = [math]::Round($backupSize, 2)
Write-Host "Tamanho: $backupSizeRounded MB" -ForegroundColor White
Write-Host ""

# Confirmar restauracao
if (!$Force) {
    Write-Host "ATENCAO: Esta operacao ira sobrescrever arquivos existentes!" -ForegroundColor Yellow
    $confirm = Read-Host "Deseja continuar? (S/N)"
    if ($confirm -ne "S" -and $confirm -ne "s") {
        Write-Host "Operacao cancelada pelo usuario." -ForegroundColor Yellow
        exit 0
    }
}

# Extrair backup
Write-Host "[1/5] Extraindo backup..." -ForegroundColor Yellow
$restorePath = Join-Path $projectRoot $RestoreDir
if (Test-Path $restorePath) {
    Remove-Item -Path $restorePath -Recurse -Force
}
New-Item -ItemType Directory -Path $restorePath -Force | Out-Null

try {
    Expand-Archive -Path $BackupFile -DestinationPath $restorePath -Force
    Write-Host "   OK Backup extraido para: $restorePath" -ForegroundColor Green
}
catch {
    Write-Host "   ERRO ao extrair backup: $_" -ForegroundColor Red
    exit 1
}

# Encontrar o diretorio full_*
$fullDir = Get-ChildItem -Path $restorePath -Directory | Where-Object { $_.Name -like "full_*" } | Select-Object -First 1
if (!$fullDir) {
    Write-Host "ERRO: Diretorio de backup nao encontrado no arquivo" -ForegroundColor Red
    exit 1
}
$fullPath = $fullDir.FullName

# Restaurar arquivos de configuracao
if ($RestoreConfig) {
    Write-Host "[2/5] Restaurando arquivos de configuracao..." -ForegroundColor Yellow
    $configPath = Join-Path $fullPath "config"
    if (Test-Path $configPath) {
        $configFiles = Get-ChildItem -Path $configPath -File
        foreach ($file in $configFiles) {
            $destPath = Join-Path $projectRoot $file.Name
            
            # Backup do arquivo existente
            if (Test-Path $destPath) {
                $backupName = "$($file.Name).backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
                Copy-Item -Path $destPath -Destination (Join-Path $projectRoot $backupName) -Force
                Write-Host "   Backup criado: $backupName" -ForegroundColor Cyan
            }
            
            Copy-Item -Path $file.FullName -Destination $destPath -Force
            Write-Host "   OK $($file.Name)" -ForegroundColor Green
        }
    }
}

# Restaurar bancos de dados
if ($RestoreDatabases) {
    Write-Host "[3/5] Restaurando bancos de dados..." -ForegroundColor Yellow
    $dbPath = Join-Path $fullPath "databases"
    if (Test-Path $dbPath) {
        $dbFiles = Get-ChildItem -Path $dbPath -File
        foreach ($db in $dbFiles) {
            $destPath = Join-Path $projectRoot $db.Name
            
            # Backup do banco existente
            if (Test-Path $destPath) {
                $backupName = "$($db.Name).backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
                Copy-Item -Path $destPath -Destination (Join-Path $projectRoot $backupName) -Force
                Write-Host "   Backup criado: $backupName" -ForegroundColor Cyan
            }
            
            Copy-Item -Path $db.FullName -Destination $destPath -Force
            Write-Host "   OK $($db.Name)" -ForegroundColor Green
        }
    }
}

# Restaurar codigo-fonte
if ($RestoreCode) {
    Write-Host "[4/5] Restaurando codigo-fonte..." -ForegroundColor Yellow
    $codeDirs = @("public", "internal", "cmd", "migrations", "scripts", "services", "frontend", "docs")
    
    foreach ($dir in $codeDirs) {
        $sourcePath = Join-Path $fullPath $dir
        if (Test-Path $sourcePath) {
            $destPath = Join-Path $projectRoot $dir
            
            # Backup do diretorio existente
            if (Test-Path $destPath) {
                $backupName = "$dir.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
                $backupPath = Join-Path $projectRoot $backupName
                Copy-Item -Path $destPath -Destination $backupPath -Recurse -Force
                Write-Host "   Backup criado: $backupName" -ForegroundColor Cyan
            }
            
            # Remover diretorio existente
            if (Test-Path $destPath) {
                Remove-Item -Path $destPath -Recurse -Force
            }
            
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            Write-Host "   OK $dir" -ForegroundColor Green
        }
    }
}

# Restaurar dados persistentes
if ($RestoreData) {
    Write-Host "[5/5] Restaurando dados persistentes..." -ForegroundColor Yellow
    $dataSourcePath = Join-Path $fullPath "data"
    if (Test-Path $dataSourcePath) {
        $dataDestPath = Join-Path $projectRoot "data"
        
        # Backup dos dados existentes
        if (Test-Path $dataDestPath) {
            $backupName = "data.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            $backupPath = Join-Path $projectRoot $backupName
            Copy-Item -Path $dataDestPath -Destination $backupPath -Recurse -Force
            Write-Host "   Backup criado: $backupName" -ForegroundColor Cyan
        }
        
        # Remover dados existentes
        if (Test-Path $dataDestPath) {
            Remove-Item -Path $dataDestPath -Recurse -Force
        }
        
        Copy-Item -Path $dataSourcePath -Destination $dataDestPath -Recurse -Force
        Write-Host "   OK Dados persistentes restaurados" -ForegroundColor Green
    }
}

# Limpar arquivos temporarios
Write-Host ""
Write-Host "Limpando arquivos temporarios..." -ForegroundColor Yellow
Remove-Item -Path $restorePath -Recurse -Force
Write-Host "   OK Arquivos temporarios removidos" -ForegroundColor Green

# Resumo
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Restauracao Concluida!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Itens restaurados:" -ForegroundColor White
if ($RestoreConfig) { Write-Host "  - Arquivos de configuracao" -ForegroundColor Green }
if ($RestoreDatabases) { Write-Host "  - Bancos de dados" -ForegroundColor Green }
if ($RestoreCode) { Write-Host "  - Codigo-fonte" -ForegroundColor Green }
if ($RestoreData) { Write-Host "  - Dados persistentes" -ForegroundColor Green }
Write-Host ""
Write-Host "IMPORTANTE: Verifique os arquivos .backup_* criados" -ForegroundColor Yellow
Write-Host "Eles contem os arquivos originais antes da restauracao" -ForegroundColor Yellow
Write-Host ""
Write-Host "Restauracao realizada com sucesso!" -ForegroundColor Green
