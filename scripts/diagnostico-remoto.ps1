# ============================================
# Script de Diagnóstico e Inicialização Remota
# WhatsMiau2 VPS - 144.91.118.78
# ============================================

param(
    [string]$VpsHost = "144.91.118.78",
    [string]$VpsUser = "root",
    [switch]$StartStack,
    [switch]$StopStack,
    [switch]$RestartStack,
    [switch]$ViewLogs
)

# Cores para output
function Write-Step {
    param([string]$Message)
    Write-Host "`n[INFO] " -ForegroundColor Cyan -NoNewline
    Write-Host $Message -ForegroundColor White
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERRO] $Message" -ForegroundColor Red
}

# Banner
Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║       DIAGNÓSTICO E CONTROLE REMOTO - WhatsMiau2          ║
║                   VPS: $VpsHost                    ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# ============================================
# DIAGNÓSTICO COMPLETO
# ============================================

Write-Step "Verificando conexão SSH..."
$sshTest = ssh -o ConnectTimeout=10 "$VpsUser@$VpsHost" "echo 'OK'" 2>&1
if ($sshTest -match "OK") {
    Write-Success "Conexão SSH estabelecida!"
} else {
    Write-Error "Falha na conexão SSH. Verifique suas credenciais."
    Write-Host "Erro: $sshTest" -ForegroundColor Yellow
    exit 1
}

Write-Step "Verificando status do Docker..."
$dockerStatus = ssh "$VpsUser@$VpsHost" "systemctl is-active docker" 2>&1
if ($dockerStatus -match "active") {
    Write-Success "Docker está rodando"
} else {
    Write-Error "Docker não está ativo! Status: $dockerStatus"
    Write-Host "Tentando iniciar o Docker..." -ForegroundColor Yellow
    ssh "$VpsUser@$VpsHost" "systemctl start docker"
    Start-Sleep -Seconds 3
}

Write-Step "Verificando Docker Swarm..."
$swarmStatus = ssh "$VpsUser@$VpsHost" "docker info --format '{{.Swarm.LocalNodeState}}'" 2>&1
if ($swarmStatus -match "active") {
    Write-Success "Docker Swarm está ativo"
} else {
    Write-Host "[AVISO] Docker Swarm não está ativo: $swarmStatus" -ForegroundColor Yellow
    Write-Host "Deseja inicializar o Docker Swarm? (S/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Write-Step "Inicializando Docker Swarm..."
        ssh "$VpsUser@$VpsHost" "docker swarm init" 2>&1
        Write-Success "Docker Swarm inicializado!"
    }
}

Write-Step "Listando stacks Docker..."
$stacks = ssh "$VpsUser@$VpsHost" "docker stack ls" 2>&1
Write-Host $stacks

Write-Step "Listando serviços Docker..."
$services = ssh "$VpsUser@$VpsHost" "docker service ls" 2>&1
Write-Host $services

Write-Step "Listando containers..."
$containers = ssh "$VpsUser@$VpsHost" "docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" 2>&1
Write-Host $containers

Write-Step "Verificando imagens disponíveis..."
$images = ssh "$VpsUser@$VpsHost" "docker images --format 'table {{.Repository}}:{{.Tag}}\t{{.Size}}' | grep -E 'whatsmiau2|qrserver|REPOSITORY'" 2>&1
Write-Host $images

Write-Step "Verificando portas em uso..."
$ports = ssh "$VpsUser@$VpsHost" "netstat -tlnp 2>/dev/null | grep -E ':80 |:443 |:8081 |:3002 '" 2>&1
if ($ports) {
    Write-Host $ports
} else {
    Write-Host "Nenhuma porta relevante em uso" -ForegroundColor Yellow
}

# ============================================
# AÇÕES ESPECÍFICAS
# ============================================

if ($StartStack) {
    Write-Step "Iniciando stack WhatsMiau2..."
    
    # Verificar se o arquivo docker-compose existe
    $composeExists = ssh "$VpsUser@$VpsHost" "test -f /opt/whatsmiau2/docker-compose.swarm.yml && echo 'exists'" 2>&1
    
    if ($composeExists -match "exists") {
        ssh "$VpsUser@$VpsHost" "cd /opt/whatsmiau2 && docker stack deploy -c docker-compose.swarm.yml whatsmiau2" 2>&1
        Write-Success "Stack iniciado! Aguarde alguns segundos para os serviços subirem..."
        Start-Sleep -Seconds 5
        
        Write-Step "Status dos serviços:"
        ssh "$VpsUser@$VpsHost" "docker service ls" 2>&1
    } else {
        Write-Error "Arquivo docker-compose.swarm.yml não encontrado em /opt/whatsmiau2/"
        Write-Host "Execute o script de deploy primeiro!" -ForegroundColor Yellow
    }
}

if ($StopStack) {
    Write-Step "Parando stack WhatsMiau2..."
    ssh "$VpsUser@$VpsHost" "docker stack rm whatsmiau2" 2>&1
    Write-Success "Stack removido!"
}

if ($RestartStack) {
    Write-Step "Reiniciando stack WhatsMiau2..."
    ssh "$VpsUser@$VpsHost" "docker stack rm whatsmiau2" 2>&1
    Write-Host "Aguardando remoção completa..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    ssh "$VpsUser@$VpsHost" "cd /opt/whatsmiau2 && docker stack deploy -c docker-compose.swarm.yml whatsmiau2" 2>&1
    Write-Success "Stack reiniciado!"
}

if ($ViewLogs) {
    Write-Step "Exibindo logs do serviço principal..."
    ssh "$VpsUser@$VpsHost" "docker service logs whatsmiau2_whatsmiau2 --tail 50" 2>&1
}

# ============================================
# RESUMO E PRÓXIMOS PASSOS
# ============================================

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                  DIAGNÓSTICO CONCLUÍDO                     ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

Write-Host "Comandos disponíveis:" -ForegroundColor Yellow
Write-Host "  .\diagnostico-remoto.ps1 -StartStack      # Iniciar stack" -ForegroundColor Gray
Write-Host "  .\diagnostico-remoto.ps1 -StopStack       # Parar stack" -ForegroundColor Gray
Write-Host "  .\diagnostico-remoto.ps1 -RestartStack    # Reiniciar stack" -ForegroundColor Gray
Write-Host "  .\diagnostico-remoto.ps1 -ViewLogs        # Ver logs" -ForegroundColor Gray
Write-Host ""

Write-Host "Para acessar a API:" -ForegroundColor Yellow
Write-Host "  http://$VpsHost" -ForegroundColor White
Write-Host ""
