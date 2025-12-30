# ============================================
# Deploy Docker Images to VPS - WhatsMiau2
# ============================================
# Este script exporta imagens Docker locais e 
# faz upload para o servidor VPS via SSH/SCP
# ============================================

param(
    [string]$VpsHost = "144.91.118.78",
    [string]$VpsUser = "root",
    [int]$VpsPort = 22,
    [string]$TempDir = "$env:TEMP\docker-deploy",
    [switch]$SkipStandardImages,
    [switch]$CleanupOnly
)

# Cores para output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-Host "`n[$Step] " -ForegroundColor Cyan -NoNewline
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
║       DEPLOY DOCKER IMAGES TO VPS - WhatsMiau2            ║
║                   Automações Comerciais                    ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "VPS Target: $VpsUser@$VpsHost`:$VpsPort" -ForegroundColor Yellow
Write-Host "Temp Directory: $TempDir" -ForegroundColor Yellow
Write-Host ""

# Imagens para deploy
$ImagesToExport = @(
    "whatsmiau2:latest",
    "qrserver:latest"
)

# Imagens padrão (menor prioridade - geralmente já estão no servidor)
$StandardImages = @(
    "redis:alpine",
    "nginx:alpine"
)

if (-not $SkipStandardImages) {
    $ImagesToExport += $StandardImages
}

# Cleanup only mode
if ($CleanupOnly) {
    Write-Step "CLEANUP" "Removendo arquivos temporários..."
    if (Test-Path $TempDir) {
        Remove-Item -Path $TempDir -Recurse -Force
        Write-Success "Diretório temporário removido: $TempDir"
    } else {
        Write-Host "Nenhum arquivo temporário encontrado." -ForegroundColor Yellow
    }
    exit 0
}

# ============================================
# PASSO 1: Verificar conexão SSH
# ============================================
Write-Step "1/6" "Verificando conexão SSH com a VPS..."

try {
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes -p $VpsPort "$VpsUser@$VpsHost" "echo 'SSH_OK'" 2>&1
    if ($sshTest -match "SSH_OK") {
        Write-Success "Conexão SSH estabelecida com sucesso!"
    } else {
        Write-Error "Falha na conexão SSH. Verifique suas credenciais."
        Write-Host "Dica: Tente executar manualmente: ssh $VpsUser@$VpsHost" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Se precisar configurar a chave SSH:" -ForegroundColor Yellow
        Write-Host "  1. ssh-keygen -t rsa -b 4096" -ForegroundColor Gray
        Write-Host "  2. type `$env:USERPROFILE\.ssh\id_rsa.pub | ssh $VpsUser@$VpsHost 'cat >> ~/.ssh/authorized_keys'" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Error "Erro ao testar conexão SSH: $_"
    exit 1
}

# ============================================
# PASSO 2: Verificar Docker na VPS
# ============================================
Write-Step "2/6" "Verificando Docker na VPS..."

$dockerVersion = ssh -p $VpsPort "$VpsUser@$VpsHost" "docker --version" 2>&1
if ($dockerVersion -match "Docker version") {
    Write-Success "Docker encontrado: $dockerVersion"
} else {
    Write-Error "Docker não encontrado na VPS!"
    exit 1
}

# Verificar Docker Swarm
$swarmStatus = ssh -p $VpsPort "$VpsUser@$VpsHost" "docker info --format '{{.Swarm.LocalNodeState}}'" 2>&1
if ($swarmStatus -match "active") {
    Write-Success "Docker Swarm está ativo!"
} else {
    Write-Host "[AVISO] Docker Swarm não está ativo. Execute 'docker swarm init' na VPS se necessário." -ForegroundColor Yellow
}

# ============================================
# PASSO 3: Criar diretório temporário
# ============================================
Write-Step "3/6" "Criando diretório temporário..."

if (-not (Test-Path $TempDir)) {
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
}
Write-Success "Diretório criado: $TempDir"

# ============================================
# PASSO 4: Exportar imagens Docker
# ============================================
Write-Step "4/6" "Exportando imagens Docker..."

$exportedFiles = @()

foreach ($image in $ImagesToExport) {
    $safeName = $image -replace ":", "_" -replace "/", "_"
    $tarFile = "$TempDir\$safeName.tar"
    
    Write-Host "  Exportando: $image" -ForegroundColor Gray
    
    # Verificar se imagem existe
    $imageExists = docker images -q $image 2>&1
    if (-not $imageExists) {
        Write-Host "    [SKIP] Imagem não encontrada localmente: $image" -ForegroundColor Yellow
        continue
    }
    
    # Exportar imagem
    $exportResult = docker save -o $tarFile $image 2>&1
    if ($LASTEXITCODE -eq 0) {
        $fileSize = [math]::Round((Get-Item $tarFile).Length / 1MB, 2)
        Write-Host "    [OK] Exportado: $safeName.tar ($fileSize MB)" -ForegroundColor Green
        $exportedFiles += @{
            "Image" = $image
            "File" = $tarFile
            "FileName" = "$safeName.tar"
            "Size" = $fileSize
        }
    } else {
        Write-Host "    [ERRO] Falha ao exportar: $exportResult" -ForegroundColor Red
    }
}

if ($exportedFiles.Count -eq 0) {
    Write-Error "Nenhuma imagem foi exportada!"
    exit 1
}

Write-Success "Total de imagens exportadas: $($exportedFiles.Count)"

# ============================================
# PASSO 5: Transferir para VPS via SCP
# ============================================
Write-Step "5/6" "Transferindo arquivos para VPS..."

# Criar diretório remoto
ssh -p $VpsPort "$VpsUser@$VpsHost" "mkdir -p /tmp/docker-images" 2>&1 | Out-Null

$transferredCount = 0
foreach ($file in $exportedFiles) {
    Write-Host "  Enviando: $($file.FileName) ($($file.Size) MB)..." -ForegroundColor Gray
    
    $scpResult = scp -P $VpsPort $file.File "$VpsUser@$VpsHost`:/tmp/docker-images/" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    [OK] Transferido com sucesso!" -ForegroundColor Green
        $transferredCount++
    } else {
        Write-Host "    [ERRO] Falha na transferência: $scpResult" -ForegroundColor Red
    }
}

Write-Success "Total transferido: $transferredCount/$($exportedFiles.Count) arquivos"

# ============================================
# PASSO 6: Carregar imagens na VPS
# ============================================
Write-Step "6/6" "Carregando imagens no Docker da VPS..."

foreach ($file in $exportedFiles) {
    Write-Host "  Carregando: $($file.Image)..." -ForegroundColor Gray
    
    $loadResult = ssh -p $VpsPort "$VpsUser@$VpsHost" "docker load -i /tmp/docker-images/$($file.FileName)" 2>&1
    
    if ($loadResult -match "Loaded image") {
        Write-Host "    [OK] Imagem carregada!" -ForegroundColor Green
    } else {
        Write-Host "    [ERRO] $loadResult" -ForegroundColor Red
    }
}

# Limpar arquivos temporários na VPS
Write-Host "`n  Limpando arquivos temporários na VPS..." -ForegroundColor Gray
ssh -p $VpsPort "$VpsUser@$VpsHost" "rm -rf /tmp/docker-images" 2>&1 | Out-Null
Write-Success "Arquivos temporários removidos da VPS"

# ============================================
# RESUMO FINAL
# ============================================
Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                    DEPLOY CONCLUÍDO!                       ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

Write-Host "Imagens disponíveis na VPS:" -ForegroundColor Cyan
$vpsImages = ssh -p $VpsPort "$VpsUser@$VpsHost" "docker images --format 'table {{.Repository}}:{{.Tag}}\t{{.Size}}' | head -10" 2>&1
Write-Host $vpsImages

Write-Host "`n" -NoNewline
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Copie o docker-compose.swarm.yml para a VPS:" -ForegroundColor Gray
Write-Host "     scp -P $VpsPort docker-compose.swarm.yml $VpsUser@$VpsHost`:/opt/whatsmiau2/" -ForegroundColor White
Write-Host ""
Write-Host "  2. Faça o deploy do stack:" -ForegroundColor Gray
Write-Host "     ssh -p $VpsPort $VpsUser@$VpsHost 'cd /opt/whatsmiau2 && docker stack deploy -c docker-compose.swarm.yml whatsmiau2'" -ForegroundColor White
Write-Host ""

# Perguntar se quer limpar arquivos locais
$cleanup = Read-Host "Deseja remover os arquivos temporários locais? (S/N)"
if ($cleanup -eq "S" -or $cleanup -eq "s") {
    Remove-Item -Path $TempDir -Recurse -Force
    Write-Success "Arquivos temporários locais removidos!"
}

Write-Host "`nScript finalizado!" -ForegroundColor Cyan
