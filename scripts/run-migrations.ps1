# ============================================
# Script de Migrations - CRM WhatsMiau2
# ============================================

param(
    [string]$DatabasePath = ".\data.db",
    [switch]$Reset
)

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║         CRM MIGRATIONS - WHATSMIAU2                        ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Verificar se sqlite3 está disponível
$sqliteCmd = Get-Command sqlite3 -ErrorAction SilentlyContinue
if (-not $sqliteCmd) {
    Write-Host "❌ SQLite3 não encontrado!" -ForegroundColor Red
    Write-Host "   Baixe em: https://www.sqlite.org/download.html" -ForegroundColor Yellow
    exit 1
}

# Reset (dropar tabelas)
if ($Reset) {
    Write-Host "[RESET] Dropando tabelas existentes..." -ForegroundColor Yellow
    
    $dropTables = @"
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS message_templates;
DROP TABLE IF EXISTS email_campaigns;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS leads;
"@
    
    $dropTables | sqlite3 $DatabasePath
    Write-Host "[OK] Tabelas dropadas!" -ForegroundColor Green
}

# Lista de migrations
$migrations = @(
    "001_create_leads_table.sql",
    "002_create_messages_table.sql",
    "003_create_payments_table.sql",
    "004_create_email_campaigns_table.sql",
    "005_create_templates_table.sql",
    "006_create_activities_table.sql"
)

Write-Host "[INFO] Database: $DatabasePath" -ForegroundColor Cyan
Write-Host "[INFO] Migrations: $($migrations.Count)" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($migration in $migrations) {
    $migrationPath = "migrations\$migration"
    
    if (-not (Test-Path $migrationPath)) {
        Write-Host "  [SKIP] $migration - Arquivo não encontrado" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "  [RUN] $migration..." -ForegroundColor Gray
    
    try {
        Get-Content $migrationPath | sqlite3 $DatabasePath 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK]  $migration" -ForegroundColor Green
            $successCount++
        }
        else {
            Write-Host "  [ERR] $migration - Exit code: $LASTEXITCODE" -ForegroundColor Red
            $errorCount++
        }
    }
    catch {
        Write-Host "  [ERR] $migration - $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              MIGRATIONS CONCLUÍDAS                         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Sucesso: $successCount" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "  ❌ Erros:   $errorCount" -ForegroundColor Red
}
Write-Host ""

# Verificar tabelas criadas
Write-Host "[INFO] Verificando tabelas criadas..." -ForegroundColor Cyan
$tables = sqlite3 $DatabasePath "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>&1

if ($tables) {
    Write-Host ""
    Write-Host "📋 Tabelas no banco:" -ForegroundColor Yellow
    $tables -split "`n" | ForEach-Object {
        if ($_ -ne "") {
            Write-Host "   - $_" -ForegroundColor Gray
        }
    }
}
else {
    Write-Host "  ⚠️  Nenhuma tabela encontrada" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Pronto! Banco de dados configurado." -ForegroundColor Green
Write-Host ""

# Comandos úteis
Write-Host "Comandos úteis:" -ForegroundColor Yellow
Write-Host "  Ver tabelas:  sqlite3 $DatabasePath '.tables'" -ForegroundColor Gray
Write-Host "  Ver schema:   sqlite3 $DatabasePath '.schema leads'" -ForegroundColor Gray
Write-Host "  Abrir DB:     sqlite3 $DatabasePath" -ForegroundColor Gray
Write-Host "  Reset:        .\run-migrations.ps1 -Reset" -ForegroundColor Gray
Write-Host ""
