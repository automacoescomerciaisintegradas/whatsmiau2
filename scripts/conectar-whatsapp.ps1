# ============================================
# Script de Conexão WhatsApp - WhatsMiau2
# ============================================

param(
    [string]$Instance = "minha-instancia",
    [string]$ApiUrl = "http://localhost:8085",
    [string]$ApiKey = "2wtLvtb20wXePp8D9uRhm55aCjINiciO",
    [string]$Method = "qr"  # "qr" ou "code"
)

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║         CONECTAR WHATSAPP - WhatsMiau2                    ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "Instância: $Instance" -ForegroundColor Yellow
Write-Host "Método: $Method" -ForegroundColor Yellow
Write-Host ""

# Função para verificar status
function Get-InstanceStatus {
    try {
        $response = Invoke-WebRequest -Uri "$ApiUrl/instance/connectionState/$Instance" `
            -Headers @{"apikey" = $ApiKey } `
            -UseBasicParsing -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        return $data
    }
    catch {
        Write-Host "⚠️ Erro ao verificar status: $_" -ForegroundColor Yellow
        return $null
    }
}

# Verificar status inicial
Write-Host "[1/4] Verificando status da instância..." -ForegroundColor Cyan
$status = Get-InstanceStatus

if ($status) {
    Write-Host "✅ Status atual: $($status.instance.state)" -ForegroundColor Green
    
    if ($status.instance.state -eq "open") {
        Write-Host "🎉 Instância já está conectada!" -ForegroundColor Green
        exit 0
    }
}

# Limpar sessão antiga (se necessário)
Write-Host "`n[2/4] Limpando sessão antiga..." -ForegroundColor Cyan
try {
    $logout = Invoke-WebRequest -Uri "$ApiUrl/instance/logout/$Instance" `
        -Method DELETE `
        -Headers @{"apikey" = $ApiKey } `
        -UseBasicParsing -ErrorAction SilentlyContinue
    
    Write-Host "✅ Sessão limpa!" -ForegroundColor Green
    Start-Sleep -Seconds 2
}
catch {
    Write-Host "ℹ️ Nenhuma sessão para limpar" -ForegroundColor Gray
}

# Gerar QR Code ou Código
Write-Host "`n[3/4] Gerando método de conexão..." -ForegroundColor Cyan

if ($Method -eq "qr") {
    # Método QR Code
    try {
        $qrResponse = Invoke-WebRequest -Uri "$ApiUrl/instance/connect/$Instance" `
            -Headers @{"apikey" = $ApiKey } `
            -UseBasicParsing -ErrorAction Stop
        
        $qrData = $qrResponse.Content | ConvertFrom-Json
        
        if ($qrData.base64) {
            Write-Host "✅ QR Code gerado com sucesso!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📱 INSTRUÇÕES:" -ForegroundColor Yellow
            Write-Host "1. Abra o navegador em: http://localhost:3000/pairing.html?method=qr" -ForegroundColor White
            Write-Host "2. Clique em 'Gerar QR Code'" -ForegroundColor White
            Write-Host "3. Escaneie o QR Code com seu WhatsApp" -ForegroundColor White
            Write-Host ""
            
            # Abrir navegador automaticamente
            Start-Process "http://localhost:3000/pairing.html?method=qr"
        }
        else {
            Write-Host "❌ Erro: QR Code não foi gerado" -ForegroundColor Red
            Write-Host "Resposta: $($qrResponse.Content)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "❌ Erro ao gerar QR Code: $_" -ForegroundColor Red
    }
}
else {
    # Método Código
    Write-Host "⚠️ Para usar o método de código, você precisa fornecer seu número:" -ForegroundColor Yellow
    $phone = Read-Host "Digite seu número (ex: 5511999998888)"
    
    try {
        $codeResponse = Invoke-WebRequest -Uri "$ApiUrl/instance/pairPhone/$Instance" `
            -Method POST `
            -Headers @{"apikey" = $ApiKey; "Content-Type" = "application/json" } `
            -Body (@{phoneNumber = $phone } | ConvertTo-Json) `
            -UseBasicParsing -ErrorAction Stop
        
        $codeData = $codeResponse.Content | ConvertFrom-Json
        
        if ($codeData.code) {
            $formattedCode = $codeData.code.ToUpper()
            if ($formattedCode.Length -eq 8) {
                $formattedCode = $formattedCode.Substring(0, 4) + "-" + $formattedCode.Substring(4)
            }
            
            Write-Host ""
            Write-Host "╔═══════════════════════════════════════╗" -ForegroundColor Green
            Write-Host "║     CÓDIGO DE PAREAMENTO              ║" -ForegroundColor Green
            Write-Host "║                                       ║" -ForegroundColor Green
            Write-Host "║          $formattedCode                  ║" -ForegroundColor Green -NoNewline
            Write-Host "              ║" -ForegroundColor Green
            Write-Host "║                                       ║" -ForegroundColor Green
            Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Green
            Write-Host ""
            Write-Host "📱 INSTRUÇÕES:" -ForegroundColor Yellow
            Write-Host "1. Abra o WhatsApp no celular" -ForegroundColor White
            Write-Host "2. Vá em Configurações → Aparelhos conectados" -ForegroundColor White
            Write-Host "3. Toque em 'Conectar um aparelho'" -ForegroundColor White
            Write-Host "4. Toque em 'Conectar com número de telefone'" -ForegroundColor White
            Write-Host "5. Digite o código: $formattedCode" -ForegroundColor Cyan
            Write-Host ""
        }
    }
    catch {
        Write-Host "❌ Erro ao gerar código: $_" -ForegroundColor Red
    }
}

# Monitorar conexão
Write-Host "`n[4/4] Aguardando conexão..." -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para cancelar" -ForegroundColor Gray
Write-Host ""

$maxAttempts = 40  # 2 minutos (40 x 3 segundos)
$attempt = 0

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 3
    $attempt++
    
    $currentStatus = Get-InstanceStatus
    
    if ($currentStatus -and $currentStatus.instance.state -eq "open") {
        Write-Host ""
        Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║          🎉 CONECTADO COM SUCESSO! 🎉                     ║" -ForegroundColor Green
        Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ WhatsApp conectado e pronto para uso!" -ForegroundColor Green
        Write-Host "📱 Número: $($currentStatus.instance.owner)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Você já pode usar o disparador e outras funcionalidades!" -ForegroundColor Yellow
        exit 0
    }
    
    # Mostrar progresso
    $progress = [math]::Round(($attempt / $maxAttempts) * 100)
    Write-Host "`r⏳ Aguardando... ($progress%) " -NoNewline -ForegroundColor Yellow
}

Write-Host ""
Write-Host "⏱️ Tempo esgotado. A conexão não foi estabelecida." -ForegroundColor Yellow
Write-Host "Tente novamente ou use o outro método de conexão." -ForegroundColor Gray
