# 📓 NotebookLM Sync

Sincronize seus **workflows**, **skills** e **agents** do Antigravity com o Google NotebookLM!

## ✨ Funcionalidades

### 📤 Exportação (Antigravity → NotebookLM)
- Consolida todos os seus workflows da pasta `.agent/workflows/`
- Inclui skills e tasks do BMad (`.bmad-core/`)
- Gera um arquivo `.txt` otimizado para upload no NotebookLM
- Atalho rápido: `Ctrl+Shift+N`

### 📥 Importação (NotebookLM → Antigravity)
- Monitora pasta `.notebooklm/imports/` para novos arquivos
- Cole notas diretamente do NotebookLM
- Notificação automática de novos arquivos

### 📊 Painel Lateral
- Visualize exportações recentes
- Acesse importações rapidamente
- Ações de um clique

## 🚀 Como Usar

### Exportar para NotebookLM
1. Pressione `Ctrl+Shift+N` (ou use o comando "NotebookLM: Exportar")
2. O arquivo será gerado em `.notebooklm/exports/`
3. Faça upload do arquivo `NotebookLM_Latest.txt` no Google NotebookLM

### Importar do NotebookLM
1. Execute "NotebookLM: Importar Notas"
2. Cole o conteúdo copiado do NotebookLM **OU**
3. Salve arquivos diretamente em `.notebooklm/imports/`

## ⚙️ Configurações

| Configuração | Padrão | Descrição |
|--------------|--------|-----------|
| `notebooklm-sync.exportPath` | `.notebooklm/exports` | Pasta para exportações |
| `notebooklm-sync.importPath` | `.notebooklm/imports` | Pasta para importações |
| `notebooklm-sync.autoExport` | `false` | Exportar automaticamente ao salvar |
| `notebooklm-sync.includeWorkflows` | `true` | Incluir workflows |
| `notebooklm-sync.includeSkills` | `true` | Incluir skills/BMad |
| `notebooklm-sync.includeAgents` | `true` | Incluir agents |

## 📋 Comandos

| Comando | Atalho | Descrição |
|---------|--------|-----------|
| NotebookLM: Exportar | `Ctrl+Shift+N` | Exporta workflows e skills |
| NotebookLM: Importar | - | Importa notas do NotebookLM |
| NotebookLM: Abrir Arquivo | - | Abre última exportação |
| NotebookLM: Mostrar Painel | - | Mostra output channel |

## 📁 Estrutura de Arquivos

```
seu-projeto/
├── .notebooklm/
│   ├── exports/
│   │   ├── NotebookLM_Latest.txt      # Sempre a última versão
│   │   └── NotebookLM_Export_*.txt    # Histórico de exportações
│   └── imports/
│       └── NotebookLM_Import_*.md     # Suas importações
├── .agent/workflows/                   # Seus workflows
└── .bmad-core/                         # Suas skills e agents
```

## 🔧 Instalação

### Via VSIX
1. Baixe o arquivo `.vsix`
2. No VS Code/Antigravity: `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
3. Selecione o arquivo

### Via Desenvolvimento
```bash
cd notebooklm-sync-extension
npm install
npm run package
```

## 📝 Notas

- O Google NotebookLM **não possui API pública**, portanto:
  - A exportação gera um arquivo para upload manual
  - A importação aceita conteúdo colado ou arquivos salvos manualmente
- O arquivo `NotebookLM_Latest.txt` é sempre atualizado com a última exportação
- Histórico de exportações é mantido com timestamps

## 🤝 Contribuição

Desenvolvido para integração Antigravity + NotebookLM.

---

**Atalho Principal:** `Ctrl+Shift+N` para exportar rapidamente! 🚀
