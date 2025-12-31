# Script de Backup HTML - WhatsMiau2
# Data: 2025-12-31
# Descricao: Cria backup de todos os arquivos HTML do projeto

param(
    [string]$BackupBaseDir = "backups-html",
    [switch]$IncludeNodeModules = $false
)

$timestamp = Get-Date -Format "yyyy_MM_dd_HHmmss"
$date = Get-Date -Format "yyyy_MM_dd"
$projectRoot = Split-Path -Parent $PSScriptRoot

# Criar nome do backup com data
$backupDirName = "backup_html_$date"
$backupPath = Join-Path $projectRoot $backupDirName

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  WhatsMiau2 - Backup HTML" -ForegroundColor White
Write-Host "  Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Criar diretorio de backup
Write-Host "[1/4] Criando diretorio de backup..." -ForegroundColor Yellow
if (Test-Path $backupPath) {
    Write-Host "   AVISO: Diretorio ja existe, adicionando timestamp..." -ForegroundColor Yellow
    $backupDirName = "backup_html_$timestamp"
    $backupPath = Join-Path $projectRoot $backupDirName
}
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
Write-Host "   OK Diretorio criado: $backupDirName" -ForegroundColor Green

# Definir diretorios para buscar HTML
$searchDirs = @(
    "public",
    "public\crm",
    "public\premium",
    "frontend\public",
    "frontend\src",
    "docs"
)

$htmlCount = 0
$totalSize = 0

# Backup de arquivos HTML
Write-Host "[2/4] Copiando arquivos HTML..." -ForegroundColor Yellow

foreach ($dir in $searchDirs) {
    $sourcePath = Join-Path $projectRoot $dir
    if (Test-Path $sourcePath) {
        # Buscar todos os arquivos HTML no diretorio
        $htmlFiles = Get-ChildItem -Path $sourcePath -Filter "*.html" -File -ErrorAction SilentlyContinue
        
        if ($htmlFiles.Count -gt 0) {
            # Criar subdiretorio no backup mantendo estrutura
            $relativeDir = $dir -replace '\\', '_'
            $destDir = Join-Path $backupPath $relativeDir
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            
            foreach ($file in $htmlFiles) {
                Copy-Item -Path $file.FullName -Destination $destDir -Force
                $fileSize = $file.Length / 1KB
                $totalSize += $fileSize
                $htmlCount++
                Write-Host "   OK $dir\$($file.Name) ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
            }
        }
    }
}

# Backup de CSS e JS relacionados
Write-Host "[3/4] Copiando arquivos CSS e JS..." -ForegroundColor Yellow
$cssJsCount = 0

foreach ($dir in $searchDirs) {
    $sourcePath = Join-Path $projectRoot $dir
    if (Test-Path $sourcePath) {
        # Buscar CSS e JS
        $cssFiles = Get-ChildItem -Path $sourcePath -Filter "*.css" -File -ErrorAction SilentlyContinue
        $jsFiles = Get-ChildItem -Path $sourcePath -Filter "*.js" -File -ErrorAction SilentlyContinue
        
        $allFiles = @()
        if ($cssFiles) { $allFiles += $cssFiles }
        if ($jsFiles) { $allFiles += $jsFiles }
        
        if ($allFiles.Count -gt 0) {
            $relativeDir = $dir -replace '\\', '_'
            $destDir = Join-Path $backupPath $relativeDir
            
            foreach ($file in $allFiles) {
                # Pular node_modules a menos que especificado
                if (!$IncludeNodeModules -and $file.FullName -like "*node_modules*") {
                    continue
                }
                
                Copy-Item -Path $file.FullName -Destination $destDir -Force
                $fileSize = $file.Length / 1KB
                $totalSize += $fileSize
                $cssJsCount++
                Write-Host "   OK $dir\$($file.Name) ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
            }
        }
    }
}

# Criar arquivo de informacoes
Write-Host "[4/4] Criando arquivo de informacoes..." -ForegroundColor Yellow

$backupDate = Get-Date -Format 'dd/MM/yyyy HH:mm:ss'
$infoContent = "WhatsMiau2 - Backup HTML`r`n"
$infoContent += "========================`r`n`r`n"
$infoContent += "Data do Backup: $backupDate`r`n"
$infoContent += "Timestamp: $timestamp`r`n"
$infoContent += "Servidor: $env:COMPUTERNAME`r`n"
$infoContent += "Usuario: $env:USERNAME`r`n`r`n"
$infoContent += "Estatisticas:`r`n"
$infoContent += "- Arquivos HTML: $htmlCount`r`n"
$infoContent += "- Arquivos CSS/JS: $cssJsCount`r`n"
$infoContent += "- Total de arquivos: $($htmlCount + $cssJsCount)`r`n"
$infoContent += "- Tamanho total: $([math]::Round($totalSize / 1024, 2)) MB`r`n`r`n"
$infoContent += "Diretorios incluidos:`r`n"
foreach ($dir in $searchDirs) {
    $infoContent += "- $dir`r`n"
}

$infoPath = Join-Path $backupPath "BACKUP_INFO.txt"
$infoContent | Out-File -FilePath $infoPath -Encoding UTF8
Write-Host "   OK Arquivo de informacoes criado" -ForegroundColor Green

# Criar arquivo index.html listando todos os arquivos
$indexContent = @"
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backup HTML - WhatsMiau2 - $date</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .stat-card .number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .stat-card .label {
            color: #666;
            font-size: 0.9em;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .file-list {
            display: grid;
            gap: 10px;
        }
        .file-item {
            background: #f8f9fa;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        }
        .file-item:hover {
            background: #e9ecef;
            transform: translateX(5px);
        }
        .file-name {
            font-weight: 500;
            color: #333;
        }
        .file-path {
            color: #666;
            font-size: 0.9em;
            margin-left: 10px;
        }
        .file-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
            padding: 5px 15px;
            border-radius: 5px;
            background: white;
            transition: all 0.3s ease;
        }
        .file-link:hover {
            background: #667eea;
            color: white;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #dee2e6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗂️ Backup HTML - WhatsMiau2</h1>
            <p>Data: $backupDate</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="number">$htmlCount</div>
                <div class="label">Arquivos HTML</div>
            </div>
            <div class="stat-card">
                <div class="number">$cssJsCount</div>
                <div class="label">Arquivos CSS/JS</div>
            </div>
            <div class="stat-card">
                <div class="number">$($htmlCount + $cssJsCount)</div>
                <div class="label">Total de Arquivos</div>
            </div>
            <div class="stat-card">
                <div class="number">$([math]::Round($totalSize / 1024, 2))</div>
                <div class="label">MB</div>
            </div>
        </div>
        
        <div class="content">
"@

# Adicionar secoes por diretorio
foreach ($dir in $searchDirs) {
    $relativeDir = $dir -replace '\\', '_'
    $destDir = Join-Path $backupPath $relativeDir
    
    if (Test-Path $destDir) {
        $files = Get-ChildItem -Path $destDir -File
        if ($files.Count -gt 0) {
            $indexContent += @"
            <div class="section">
                <h2>📁 $dir</h2>
                <div class="file-list">
"@
            foreach ($file in $files) {
                $relativePath = "$relativeDir\$($file.Name)"
                $indexContent += @"
                    <div class="file-item">
                        <div>
                            <span class="file-name">$($file.Name)</span>
                            <span class="file-path">$dir</span>
                        </div>
                        <a href="$relativePath" class="file-link" target="_blank">Abrir</a>
                    </div>
"@
            }
            $indexContent += @"
                </div>
            </div>
"@
        }
    }
}

$indexContent += @"
        </div>
        
        <div class="footer">
            <p>WhatsMiau2 - Backup HTML criado em $backupDate</p>
            <p>Total: $($htmlCount + $cssJsCount) arquivos | $([math]::Round($totalSize / 1024, 2)) MB</p>
        </div>
    </div>
</body>
</html>
"@

$indexPath = Join-Path $backupPath "index.html"
$indexContent | Out-File -FilePath $indexPath -Encoding UTF8
Write-Host "   OK index.html criado" -ForegroundColor Green

# Resumo
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Backup HTML Concluido!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Localizacao: $backupPath" -ForegroundColor White
Write-Host ""
Write-Host "Estatisticas:" -ForegroundColor Yellow
Write-Host "  - Arquivos HTML: $htmlCount" -ForegroundColor Green
Write-Host "  - Arquivos CSS/JS: $cssJsCount" -ForegroundColor Green
Write-Host "  - Total: $($htmlCount + $cssJsCount) arquivos" -ForegroundColor Green
Write-Host "  - Tamanho: $([math]::Round($totalSize / 1024, 2)) MB" -ForegroundColor Green
Write-Host ""
Write-Host "Abra o arquivo index.html para navegar pelos backups!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backup HTML realizado com sucesso!" -ForegroundColor Green
