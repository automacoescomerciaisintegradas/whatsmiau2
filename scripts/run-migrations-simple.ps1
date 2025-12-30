# Simple migrations script
param(
    [string]$DatabasePath = ".\data.db"
)

Write-Host "Running CRM migrations..." -ForegroundColor Cyan

$migrations = @(
    "001_create_leads_table.sql",
    "002_create_messages_table.sql",
    "003_create_payments_table.sql",
    "004_create_email_campaigns_table.sql",
    "005_create_templates_table.sql",
    "006_create_activities_table.sql"
)

foreach ($migration in $migrations) {
    $migrationPath = "migrations\$migration"
    
    if (Test-Path $migrationPath) {
        Write-Host "  Running $migration..." -ForegroundColor Gray
        Get-Content $migrationPath | sqlite3 $DatabasePath 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  OK: $migration" -ForegroundColor Green
        }
    }
}

Write-Host "Migrations completed!" -ForegroundColor Green
