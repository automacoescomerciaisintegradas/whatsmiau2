# Teste de Conexão WhatsApp - Diagnóstico Completo

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║      DIAGNÓSTICO DE CONEXÃO WHATSAPP                      ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$INSTANCE = "minha-instancia"
$API_URL = "http://localhost:8085/v1"
$API_KEY = "2wtLvtb20wXePp8D9uRhm55aCjINiciO"

# 1. Verificar status atual
Write-Host "[1/5] Verificando status atual..." -ForegroundColor Yellow
try {
    $status = Invoke-WebRequest -Uri "$API_URL/instance/connectionState/$INSTANCE" `
        -Headers @{"apikey" = $API_KEY } -UseBasicParsing
    $statusData = $status.Content | ConvertFrom-Json
    Write-Host "   Estado: $($statusData.state)" -ForegroundColor Cyan
    Write-Host "   Resposta completa: $($status.Content)" -ForegroundColor Gray
}
catch {
    Write-Host "   Erro: $_" -ForegroundColor Red
}

# 2. Listar instâncias
Write-Host "`n[2/5] Listando instâncias..." -ForegroundColor Yellow
try {
    $instances = Invoke-WebRequest -Uri "$API_URL/instance/fetchInstances" `
        -Headers @{"apikey" = $API_KEY } -UseBasicParsing
    Write-Host "   Instâncias encontradas:" -ForegroundColor Cyan
    $instances.Content | ConvertFrom-Json | ForEach-Object {
        Write-Host "   - $($_.instance.instanceName): $($_.instance.status)" -ForegroundColor White
    }
}
catch {
    Write-Host "   Erro: $_" -ForegroundColor Red
}

# 3. Verificar se há sessão ativa
Write-Host "`n[3/5] Verificando sessão..." -ForegroundColor Yellow
$sessionPath = "data/store/minha-instancia"
if (Test-Path $sessionPath) {
    Write-Host "   Pasta de sessão existe: $sessionPath" -ForegroundColor Green
    $files = Get-ChildItem $sessionPath -Recurse | Measure-Object
    Write-Host "   Arquivos na sessão: $($files.Count)" -ForegroundColor Cyan
}
else {
    Write-Host "   Pasta de sessão NÃO existe" -ForegroundColor Yellow
}

# 4. Tentar limpar sessão
Write-Host "`n[4/5] Limpando sessão..." -ForegroundColor Yellow
try {
    $logout = Invoke-WebRequest -Uri "$API_URL/instance/logout/$INSTANCE" `
        -Method DELETE -Headers @{"apikey" = $API_KEY } -UseBasicParsing
    Write-Host "   Sessão limpa com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "   Aviso: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5. Solicitar novo código
Write-Host "`n[5/5] Gerando novo código de pareamento..." -ForegroundColor Yellow
$phone = Read-Host "Digite seu número WhatsApp (ex: 5511999999999)"

if ($phone) {
    try {
        $body = @{phoneNumber = $phone } | ConvertTo-Json
        $pairResponse = Invoke-WebRequest -Uri "$API_URL/instance/pairPhone/$INSTANCE" `
            -Method POST `
            -Headers @{"apikey" = $API_KEY; "Content-Type" = "application/json" } `
            -Body $body `
            -UseBasicParsing
        
        $pairData = $pairResponse.Content | ConvertFrom-Json
        
        if ($pairData.code) {
            $code = $pairData.code.ToUpper()
            $formatted = $code.Substring(0, 4) + "-" + $code.Substring(4)
            
            Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Green
            Write-Host "║     CÓDIGO DE PAREAMENTO              ║" -ForegroundColor Green
            Write-Host "║                                       ║" -ForegroundColor Green
            Write-Host "║          $formatted                  ║" -ForegroundColor Green
            Write-Host "║                                       ║" -ForegroundColor Green
            Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Green
            
            Write-Host "`nDigite este código no WhatsApp do celular!" -ForegroundColor Yellow
            Write-Host "Pressione ENTER após digitar o código no celular..." -ForegroundColor Cyan
            Read-Host
            
            # Verificar conexão
            Write-Host "`nVerificando conexão..." -ForegroundColor Yellow
            for ($i = 1; $i -le 10; $i++) {
                Start-Sleep -Seconds 2
                $check = Invoke-WebRequest -Uri "$API_URL/instance/connectionState/$INSTANCE" `
                    -Headers @{"apikey" = $API_KEY } -UseBasicParsing
                $checkData = $check.Content | ConvertFrom-Json
                
                Write-Host "   Tentativa $i/10 - Estado: $($checkData.state)" -ForegroundColor Cyan
                
                if ($checkData.state -eq "open") {
                    Write-Host "`n🎉 CONECTADO COM SUCESSO!" -ForegroundColor Green
                    Write-Host "Owner: $($checkData.instance.owner)" -ForegroundColor Cyan
                    break
                }
            }
            
            if ($checkData.state -ne "open") {
                Write-Host "`n❌ Não conectou após 20 segundos" -ForegroundColor Red
                Write-Host "Estado final: $($checkData.state)" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "   Erro: Código não foi gerado" -ForegroundColor Red
            Write-Host "   Resposta: $($pairResponse.Content)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "   Erro: $_" -ForegroundColor Red
        Write-Host "   Detalhes: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n✅ Diagnóstico concluído!" -ForegroundColor Cyan
