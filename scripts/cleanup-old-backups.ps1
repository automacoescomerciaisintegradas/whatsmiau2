# Script de Limpeza de Backups Antigos - WhatsMiau2
# Data: 2025-12-31

param(
    [int]$DaysToKeep = 7,
    [string]$BackupDir = "backups",
    [switch]$DryRun = $false
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupPath = Join-Path $projectRoot $BackupDir

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  WhatsMiau2 - Limpeza de Backups Antigos" -ForegroundColor White
Write-Host "  Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path $backupPath)) {
    Write-Host "ERRO: Diretorio de backups nao encontrado: $backupPath" -ForegroundColor Red
    exit 1
}

Write-Host "Diretorio de backups: $backupPath" -ForegroundColor White
Write-Host "Manter backups dos ultimos: $DaysToKeep dias" -ForegroundColor White
if ($DryRun) {
    Write-Host "MODO DE TESTE: Nenhum arquivo sera removido" -ForegroundColor Yellow
}
Write-Host ""

# Calcular data limite
$cutoffDate = (Get-Date).AddDays(-$DaysToKeep)
Write-Host "Removendo backups anteriores a: $($cutoffDate.ToString('dd/MM/yyyy'))" -ForegroundColor Yellow
Write-Host ""

# Encontrar diretorios de backup antigos
$backupDirs = Get-ChildItem -Path $backupPath -Directory | Where-Object { $_.Name -match "backup_\d{4}_\d{2}_\d{2}" }

$totalSize = 0
$removedCount = 0
$keptCount = 0

foreach ($dir in $backupDirs) {
    # Extrair data do nome do diretorio
    if ($dir.Name -match "backup_(\d{4})_(\d{2})_(\d{2})") {
        $year = [int]$matches[1]
        $month = [int]$matches[2]
        $day = [int]$matches[3]
        
        try {
            $backupDate = Get-Date -Year $year -Month $month -Day $day
            
            if ($backupDate -lt $cutoffDate) {
                # Calcular tamanho
                $dirSize = (Get-ChildItem -Path $dir.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
                $totalSize += $dirSize
                
                Write-Host "[REMOVER] $($dir.Name) - $($backupDate.ToString('dd/MM/yyyy')) - $([math]::Round($dirSize, 2)) MB" -ForegroundColor Red
                
                if (!$DryRun) {
                    Remove-Item -Path $dir.FullName -Recurse -Force
                    Write-Host "   OK Removido" -ForegroundColor Green
                }
                $removedCount++
            }
            else {
                $dirSize = (Get-ChildItem -Path $dir.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
                Write-Host "[MANTER]  $($dir.Name) - $($backupDate.ToString('dd/MM/yyyy')) - $([math]::Round($dirSize, 2)) MB" -ForegroundColor Green
                $keptCount++
            }
        }
        catch {
            Write-Host "[ERRO] Nao foi possivel processar: $($dir.Name)" -ForegroundColor Yellow
        }
    }
}

# Resumo
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Limpeza Concluida!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumo:" -ForegroundColor White
Write-Host "  Backups mantidos: $keptCount" -ForegroundColor Green
Write-Host "  Backups removidos: $removedCount" -ForegroundColor Red
Write-Host "  Espaco liberado: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DE TESTE: Execute novamente sem -DryRun para remover os arquivos" -ForegroundColor Yellow
}
else {
    Write-Host "Limpeza realizada com sucesso!" -ForegroundColor Green
}
