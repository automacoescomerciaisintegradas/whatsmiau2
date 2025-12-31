# Script para reorganizar menu em todos os arquivos HTML
# Move "Chat Interno" para depois de "Kanban" e "Tickets"

$files = @(
    "public\instancias.html",
    "public\connections.html",
    "public\tickets.html",
    "public\settings.html",
    "public\resumo-grupos.html",
    "public\kanban.html",
    "public\internal-chat.html",
    "public\exportar-contatos.html",
    "public\disparador.html",
    "public\contacts.html",
    "public\ai-agents.html"
)

$projectRoot = "c:\projetos2025\whatsmiau2"

foreach ($file in $files) {
    $filePath = Join-Path $projectRoot $file
    
    if (Test-Path $filePath) {
        Write-Host "Atualizando: $file" -ForegroundColor Yellow
        
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # Padrão para encontrar a seção do menu
        # Procura por: Conexões -> Chat Interno -> Kanban -> Tickets
        # E substitui por: Conexões -> Kanban -> Tickets -> Chat Interno
        
        $pattern = '(<a href="/connections"[^>]*>[\s\S]*?</a>\s*)(<a href="/internal-chat"[^>]*>[\s\S]*?</a>\s*)(<a href="/kanban"[^>]*>[\s\S]*?</a>\s*)(<a href="/tickets"[^>]*>[\s\S]*?</a>)'
        $replacement = '$1$3$4$2'
        
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $content | Out-File -FilePath $filePath -Encoding UTF8 -NoNewline
            Write-Host "  OK Atualizado!" -ForegroundColor Green
        }
        else {
            Write-Host "  SKIP Padrão não encontrado" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  ERRO Arquivo não encontrado: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Reorganização concluída!" -ForegroundColor Green
