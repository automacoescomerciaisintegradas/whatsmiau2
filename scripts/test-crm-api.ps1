# Test CRM API
$headers = @{
    "Content-Type" = "application/json"
    "apikey"       = "2wtLvtb20wXePp8D9uRhm55aCjINiciO"
}

$body = @{
    nome        = "Joao Silva"
    whatsapp    = "5511999999999"
    email       = "joao@example.com"
    empresa     = "Tech Corp"
    valor       = 5000.00
    fonte       = "instagram"
    temperatura = "quente"
} | ConvertTo-Json

Write-Host "Creating lead..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:8081/v1/crm/leads" -Method Post -Headers $headers -Body $body
$response | ConvertTo-Json -Depth 10

Write-Host "`nListing leads..." -ForegroundColor Cyan
$leads = Invoke-RestMethod -Uri "http://localhost:8081/v1/crm/leads" -Method Get -Headers $headers
$leads | ConvertTo-Json -Depth 10

Write-Host "`nGetting stats..." -ForegroundColor Cyan
$stats = Invoke-RestMethod -Uri "http://localhost:8081/v1/crm/leads/stats" -Method Get -Headers $headers
$stats | ConvertTo-Json -Depth 10
