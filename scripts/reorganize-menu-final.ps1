# Script para reorganizar menu na ordem especificada pelo usuário
# Ordem: Dashboard, Conexões, Disparador, Exportar Contatos, Resumo de Grupos, Contatos, Tickets, Kanban, Chat Interno

$files = @(
    "public\instancias.html",
    "public\connections.html",
    "public\disparador.html",
    "public\exportar-contatos.html",
    "public\resumo-grupos.html",
    "public\contacts.html",
    "public\tickets.html",
    "public\kanban.html",
    "public\internal-chat.html",
    "public\settings.html",
    "public\ai-agents.html",
    "public\channels.html"
)

$projectRoot = "c:\projetos2025\whatsmiau2"

# Template do menu na ordem correta
$menuTemplate = @'
                <a href="/dashboard" class="list-group-item list-group-item-action bg-transparent">
                    <i class="fas fa-tachometer-alt me-2"></i> Dashboard
                </a>

                <a href="/connections" class="list-group-item list-group-item-action bg-transparent">
                    <i class="fas fa-wifi me-2"></i> Conexões
                </a>

                <a href="/disparador" class="list-group-item list-group-item-action bg-transparent">
                    <i class="fas fa-paper-plane me-2"></i> Disparador
                </a>

                <a href="/exportar-contatos" class="list-group-item list-group-item-action bg-transparent">
                    <i class="fas fa-file-export me-2"></i> Exportar Contatos
                </a>

                <a href="/resumo-grupos" class="list-group-item list-group-item-action bg-transparent">
                    <i class="fas fa-chart-bar me-2"></i> Resumo de Grupos
                </a>

                <a href="/contacts" class="list-group-item list-group-item-action bg-transparent">
                    <i class="fas fa-address-book me-2"></i> Contatos
                </a>

                <a href="/tickets" class="list-group-item list-group-item-action bg-transparent">
                    <i class="fas fa-ticket-alt me-2"></i> Tickets
                </a>

                <a href="/kanban" class="list-group-item list-group-item-action bg-transparent">
                    <i class="fas fa-columns me-2"></i> Kanban
                </a>

                <a href="/internal-chat" class="list-group-item list-group-item-action bg-transparent">
                    <i class="fas fa-comments me-2"></i> Chat Interno
                </a>
'@

foreach ($file in $files) {
    $filePath = Join-Path $projectRoot $file
    
    if (Test-Path $filePath) {
        Write-Host "Atualizando: $file" -ForegroundColor Yellow
        
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # Encontrar o início e fim da seção de menu
        # Procura por <div class="list-group list-group-flush até o próximo <div class="border-top ou <div class="p-3 mt-auto
        $pattern = '(<div class="list-group list-group-flush[^>]*>)([\s\S]*?)(<div class="(?:border-top|p-3 mt-auto))'
        
        if ($content -match $pattern) {
            # Pegar o início do menu
            $menuStart = $matches[1]
            # Pegar o final (border-top ou footer)
            $menuEnd = $matches[3]
            
            # Substituir o conteúdo do menu
            $newMenu = $menuStart + "`r`n" + $menuTemplate + "`r`n`r`n                " + $menuEnd
            $content = $content -replace $pattern, $newMenu
            
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
Write-Host "Ordem final: Dashboard → Conexões → Disparador → Exportar Contatos → Resumo de Grupos → Contatos → Tickets → Kanban → Chat Interno" -ForegroundColor Cyan
