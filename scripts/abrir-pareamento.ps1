# Conectar Instância - WhatsMiau2
# Abre automaticamente a página de pareamento

$INSTANCE = "minha-instancia"
$URL = "http://localhost:3002/pairing?instance=$INSTANCE"

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║         CONECTAR WHATSAPP - WhatsMiau2                    ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "Instância: $INSTANCE" -ForegroundColor Yellow
Write-Host "Abrindo página de pareamento..." -ForegroundColor Green
Write-Host ""

# Abrir navegador
Start-Process $URL

Write-Host "✅ Página aberta no navegador!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Siga as instruções na página:" -ForegroundColor Yellow
Write-Host "1. Digite seu número WhatsApp" -ForegroundColor White
Write-Host "2. Clique em 'Limpar Sessão'" -ForegroundColor White
Write-Host "3. Clique em 'Obter Código'" -ForegroundColor White
Write-Host "4. Digite o código no WhatsApp do celular" -ForegroundColor White
Write-Host ""
