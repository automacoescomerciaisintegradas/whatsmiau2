# ============================================
# Deploy Frontend - Solução Rápida
# ============================================

param(
    [string]$VpsHost = "144.91.118.78",
    [string]$VpsUser = "root"
)

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║         DEPLOY FRONTEND - SOLUÇÃO RÁPIDA                   ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Arquivos para copiar
$htmlFiles = @(
    "automacao.html",
    "pairing.html",
    "disparador.html",
    "instancias.html",
    "manager.html",
    "crm.html",
    "webhooks.html",
    "diagnostico.html",
    "index.html",
    "styles.css"
)

# 1. Copiar arquivos para o servidor
Write-Host "[1/3] Copiando arquivos HTML para o servidor..." -ForegroundColor Yellow

$copiedCount = 0
foreach ($file in $htmlFiles) {
    if (Test-Path $file) {
        Write-Host "  Copiando: $file" -ForegroundColor Gray
        scp $file "${VpsUser}@${VpsHost}`:/tmp/"
        if ($LASTEXITCODE -eq 0) {
            $copiedCount++
        }
    }
    else {
        Write-Host "  [SKIP] Arquivo não encontrado: $file" -ForegroundColor Yellow
    }
}

Write-Host "[OK] $copiedCount arquivos copiados!" -ForegroundColor Green

# 2. Criar container Nginx para servir os arquivos
Write-Host "`n[2/3] Criando container Nginx..." -ForegroundColor Yellow

$nginxCmd = @"
docker rm -f frontend-temp 2>/dev/null || true && \
docker run -d --name frontend-temp \
  -p 8080:80 \
  -v /tmp:/usr/share/nginx/html:ro \
  --restart unless-stopped \
  nginx:alpine
"@

ssh "$VpsUser@$VpsHost" $nginxCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Container Nginx criado!" -ForegroundColor Green
}
else {
    Write-Host "[ERRO] Falha ao criar container!" -ForegroundColor Red
    exit 1
}

# 3. Verificar
Write-Host "`n[3/3] Verificando..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$testResult = ssh "$VpsUser@$VpsHost" "curl -I http://localhost:8080/automacao.html 2>&1 | head -5"
Write-Host $testResult

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║              DEPLOY CONCLUÍDO COM SUCESSO!                 ║
╚═══════════════════════════════════════════════════════════╝

🌐 Acesse os frontends:

  📱 Automação:    http://144.91.118.78:8080/automacao.html
  🔗 Pairing:      http://144.91.118.78:8080/pairing.html
  📤 Disparador:   http://144.91.118.78:8080/disparador.html
  📊 Instâncias:   http://144.91.118.78:8080/instancias.html
  🎛️  Manager:      http://144.91.118.78:8080/manager.html
  👥 CRM:          http://144.91.118.78:8080/crm.html
  🔔 Webhooks:     http://144.91.118.78:8080/webhooks.html
  🔍 Diagnóstico:  http://144.91.118.78:8080/diagnostico.html

📝 Nota: Esta é uma solução temporária para testes.
   Para produção, use o guia GUIA_FRONTEND_TRAEFIK.md

"@ -ForegroundColor Green

Write-Host "Comandos úteis:" -ForegroundColor Yellow
Write-Host "  Ver logs:    ssh $VpsUser@$VpsHost 'docker logs -f frontend-temp'" -ForegroundColor Gray
Write-Host "  Parar:       ssh $VpsUser@$VpsHost 'docker stop frontend-temp'" -ForegroundColor Gray
Write-Host "  Remover:     ssh $VpsUser@$VpsHost 'docker rm -f frontend-temp'" -ForegroundColor Gray
Write-Host ""
