# Script para adicionar melhorias de dark mode em todas as páginas HTML

$htmlFiles = Get-ChildItem "public\*.html" -File

$linkTag = '    <link href="/assets/css/dark-mode-improvements.css" rel="stylesheet">'

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Verificar se já tem o link
    if ($content -notmatch "dark-mode-improvements.css") {
        # Procurar por style.css e adicionar logo depois
        if ($content -match '(<link href="/assets/css/style.css" rel="stylesheet">)') {
            $content = $content -replace '(<link href="/assets/css/style.css" rel="stylesheet">)', "`$1`r`n$linkTag"
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "✅ Atualizado: $($file.Name)" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️  Pulado (sem style.css): $($file.Name)" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "ℹ️  Já tem: $($file.Name)" -ForegroundColor Cyan
    }
}

Write-Host "`n✅ Processo concluído!" -ForegroundColor Green
