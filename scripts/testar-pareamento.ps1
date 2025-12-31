# ============================================
# Teste Rápido de Pareamento - WhatsMiau2
# ============================================

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║      TESTE RÁPIDO DE PAREAMENTO - WhatsMiau2             ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Configurações
$INSTANCE = "minha-instancia"
$API_URL = "http://localhost:3000/api"

Write-Host "1. Testando conexão com o servidor..." -ForegroundColor Yellow

try {
    $health = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ Servidor Node.js está rodando!" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Servidor Node.js NÃO está respondendo!" -ForegroundColor Red
    Write-Host "   Execute: npm start" -ForegroundColor Gray
    exit 1
}

Write-Host "`n2. Verificando status da instância..." -ForegroundColor Yellow

try {
    $status = Invoke-WebRequest -Uri "$API_URL/instance/connectionState/$INSTANCE" -UseBasicParsing -TimeoutSec 5
    $statusData = $status.Content | ConvertFrom-Json
    
    $state = $statusData.instance.state
    Write-Host "   📊 Estado atual: $state" -ForegroundColor Cyan
    
    if ($state -eq "open") {
        Write-Host "   🎉 JÁ ESTÁ CONECTADO!" -ForegroundColor Green
        Write-Host "`n   Número conectado: $($statusData.instance.owner)" -ForegroundColor Cyan
        Write-Host "`n   Você já pode usar todas as funcionalidades!" -ForegroundColor Yellow
        exit 0
    }
    elseif ($state -eq "close" -or $state -eq "qrcode") {
        Write-Host "   ⚠️ Não conectado - precisa fazer pareamento" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   ⚠️ Não foi possível verificar o status" -ForegroundColor Yellow
}

Write-Host "`n3. Instruções para conectar:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   📱 MÉTODO RECOMENDADO: Código de Pareamento" -ForegroundColor Green
Write-Host ""
Write-Host "   Passo 1: Abra no navegador:" -ForegroundColor White
Write-Host "   http://localhost:3000/pairing.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Passo 2: Digite seu número (ex: 5511999999999)" -ForegroundColor White
Write-Host ""
Write-Host "   Passo 3: Clique em 'Limpar Sessão' (aguarde 3s)" -ForegroundColor White
Write-Host ""
Write-Host "   Passo 4: Clique em 'Obter Código'" -ForegroundColor White
Write-Host ""
Write-Host "   Passo 5: No celular:" -ForegroundColor White
Write-Host "   WhatsApp → Configurações → Aparelhos conectados" -ForegroundColor Gray
Write-Host "   → Conectar um aparelho → Conectar com número" -ForegroundColor Gray
Write-Host ""
Write-Host "   Passo 6: Digite o código que apareceu na tela" -ForegroundColor White
Write-Host ""

# Perguntar se quer abrir o navegador
$open = Read-Host "`nDeseja abrir a página de pareamento agora? (S/N)"

if ($open -eq "S" -or $open -eq "s") {
    Write-Host "`n🌐 Abrindo navegador..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000/pairing.html"
    Write-Host "✅ Página aberta! Siga as instruções acima." -ForegroundColor Green
}

Write-Host "`n📚 Para mais detalhes, consulte:" -ForegroundColor Yellow
Write-Host ".system\GUIA_PAREAMENTO.md" -ForegroundColor Cyan
Write-Host ""
