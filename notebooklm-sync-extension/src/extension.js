const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let statusBarItem;
let fileWatcher;
let outputChannel;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    outputChannel = vscode.window.createOutputChannel('NotebookLM Sync');
    outputChannel.appendLine('🚀 NotebookLM Sync ativado!');

    // Status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(notebook) NotebookLM';
    statusBarItem.tooltip = 'Clique para exportar para NotebookLM';
    statusBarItem.command = 'notebooklm-sync.exportToNotebookLM';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Registrar comandos
    context.subscriptions.push(
        vscode.commands.registerCommand('notebooklm-sync.exportToNotebookLM', exportToNotebookLM),
        vscode.commands.registerCommand('notebooklm-sync.importFromNotebookLM', importFromNotebookLM),
        vscode.commands.registerCommand('notebooklm-sync.openExportFile', openExportFile),
        vscode.commands.registerCommand('notebooklm-sync.showPanel', showPanel)
    );

    // Registrar Tree View Providers
    const overviewProvider = new OverviewTreeProvider();
    const exportsProvider = new ExportsTreeProvider();
    const importsProvider = new ImportsTreeProvider();

    vscode.window.registerTreeDataProvider('notebooklm-sync.overview', overviewProvider);
    vscode.window.registerTreeDataProvider('notebooklm-sync.exports', exportsProvider);
    vscode.window.registerTreeDataProvider('notebooklm-sync.imports', importsProvider);

    // Configurar file watcher para imports
    setupFileWatcher(context);

    // Auto-export se configurado
    if (vscode.workspace.getConfiguration('notebooklm-sync').get('autoExport')) {
        setupAutoExport(context);
    }

    outputChannel.appendLine('✅ Extensão inicializada com sucesso');
}

async function exportToNotebookLM() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Nenhum workspace aberto');
        return;
    }

    const config = vscode.workspace.getConfiguration('notebooklm-sync');
    const exportPath = path.join(workspaceFolder.uri.fsPath, config.get('exportPath'));

    // Criar pasta de exportação se não existir
    if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath, { recursive: true });
    }

    statusBarItem.text = '$(sync~spin) Exportando...';
    outputChannel.appendLine('\n📤 Iniciando exportação...');

    let content = '';
    content += generateHeader();

    // Coletar workflows
    if (config.get('includeWorkflows')) {
        content += await collectWorkflows(workspaceFolder.uri.fsPath);
    }

    // Coletar skills/BMad
    if (config.get('includeSkills')) {
        content += await collectSkills(workspaceFolder.uri.fsPath);
    }

    // Coletar agents
    if (config.get('includeAgents')) {
        content += await collectAgents(workspaceFolder.uri.fsPath);
    }

    content += generateFooter();

    // Salvar arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `NotebookLM_Export_${timestamp}.txt`;
    const filepath = path.join(exportPath, filename);

    fs.writeFileSync(filepath, content, 'utf8');

    // Também criar/atualizar arquivo "latest"
    const latestPath = path.join(exportPath, 'NotebookLM_Latest.txt');
    fs.writeFileSync(latestPath, content, 'utf8');

    statusBarItem.text = '$(notebook) NotebookLM ✓';
    setTimeout(() => { statusBarItem.text = '$(notebook) NotebookLM'; }, 3000);

    const stats = {
        size: (content.length / 1024).toFixed(2),
        lines: content.split('\n').length
    };

    outputChannel.appendLine(`✅ Exportado: ${filename}`);
    outputChannel.appendLine(`   📊 Tamanho: ${stats.size} KB | Linhas: ${stats.lines}`);

    const action = await vscode.window.showInformationMessage(
        `✅ Exportado para NotebookLM! (${stats.size} KB)`,
        'Abrir Arquivo',
        'Abrir Pasta',
        'Copiar Caminho'
    );

    if (action === 'Abrir Arquivo') {
        const doc = await vscode.workspace.openTextDocument(filepath);
        await vscode.window.showTextDocument(doc);
    } else if (action === 'Abrir Pasta') {
        vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(exportPath));
    } else if (action === 'Copiar Caminho') {
        await vscode.env.clipboard.writeText(filepath);
        vscode.window.showInformationMessage('Caminho copiado!');
    }
}

function generateHeader() {
    return `================================================================================
                    NOTEBOOKLM SYNC - EXPORTAÇÃO AUTOMÁTICA
================================================================================
Exportado em: ${new Date().toLocaleString('pt-BR')}
Fonte: Antigravity Workspace

Este arquivo contém seus workflows, skills e agents para uso no Google NotebookLM.
Faça upload deste arquivo como fonte no NotebookLM para consultar seu conhecimento.

================================================================================

`;
}

function generateFooter() {
    return `

================================================================================
                              FIM DA EXPORTAÇÃO
================================================================================
Gerado automaticamente pela extensão NotebookLM Sync
Para atualizar, use Ctrl+Shift+N no Antigravity
================================================================================
`;
}

async function collectWorkflows(rootPath) {
    let content = '';
    const workflowPaths = [
        path.join(rootPath, '.agent', 'workflows'),
        path.join(rootPath, '.bmad-core', 'workflows')
    ];

    content += `
================================================================================
                              📋 WORKFLOWS
================================================================================

`;

    for (const workflowPath of workflowPaths) {
        if (fs.existsSync(workflowPath)) {
            const files = fs.readdirSync(workflowPath).filter(f => f.endsWith('.md') || f.endsWith('.yaml'));

            for (const file of files) {
                const filePath = path.join(workflowPath, file);
                const fileContent = fs.readFileSync(filePath, 'utf8');

                content += `
--- WORKFLOW: ${file} ---
Caminho: ${filePath.replace(rootPath, '')}
--------------------------------------------------------------------------------
${fileContent}
--------------------------------------------------------------------------------

`;
                outputChannel.appendLine(`   📋 Workflow: ${file}`);
            }
        }
    }

    return content;
}

async function collectSkills(rootPath) {
    let content = '';
    const skillPaths = [
        path.join(rootPath, '.bmad-core', 'tasks'),
        path.join(rootPath, '.bmad-core', 'templates'),
        path.join(rootPath, '.bmad-core', 'checklists'),
        path.join(rootPath, '.bmad-core', 'utils'),
        path.join(rootPath, '.gemini', 'skills')
    ];

    content += `
================================================================================
                              🛠️ SKILLS & TASKS
================================================================================

`;

    for (const skillPath of skillPaths) {
        if (fs.existsSync(skillPath)) {
            const folderName = path.basename(skillPath);
            const files = fs.readdirSync(skillPath).filter(f =>
                f.endsWith('.md') || f.endsWith('.yaml') || f.endsWith('.txt')
            );

            for (const file of files) {
                const filePath = path.join(skillPath, file);
                try {
                    const fileContent = fs.readFileSync(filePath, 'utf8');

                    content += `
--- ${folderName.toUpperCase()}: ${file} ---
Caminho: ${filePath.replace(rootPath, '')}
--------------------------------------------------------------------------------
${fileContent}
--------------------------------------------------------------------------------

`;
                    outputChannel.appendLine(`   🛠️ ${folderName}: ${file}`);
                } catch (err) {
                    outputChannel.appendLine(`   ⚠️ Erro ao ler: ${file}`);
                }
            }
        }
    }

    return content;
}

async function collectAgents(rootPath) {
    let content = '';
    const agentPath = path.join(rootPath, '.bmad-core', 'agents');

    content += `
================================================================================
                              🤖 AGENTS
================================================================================

`;

    if (fs.existsSync(agentPath)) {
        const files = fs.readdirSync(agentPath).filter(f => f.endsWith('.md') || f.endsWith('.yaml'));

        for (const file of files) {
            const filePath = path.join(agentPath, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');

            content += `
--- AGENT: ${file} ---
Caminho: ${filePath.replace(rootPath, '')}
--------------------------------------------------------------------------------
${fileContent}
--------------------------------------------------------------------------------

`;
            outputChannel.appendLine(`   🤖 Agent: ${file}`);
        }
    }

    return content;
}

async function importFromNotebookLM() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Nenhum workspace aberto');
        return;
    }

    const config = vscode.workspace.getConfiguration('notebooklm-sync');
    const importPath = path.join(workspaceFolder.uri.fsPath, config.get('importPath'));

    // Criar pasta de importação se não existir
    if (!fs.existsSync(importPath)) {
        fs.mkdirSync(importPath, { recursive: true });
    }

    // Abrir diálogo para colar conteúdo do NotebookLM
    const content = await vscode.window.showInputBox({
        prompt: 'Cole aqui o conteúdo do NotebookLM (ou deixe vazio para abrir pasta)',
        placeHolder: 'Conteúdo do NotebookLM...',
        ignoreFocusOut: true
    });

    if (content === undefined) {
        return; // Cancelado
    }

    if (content === '') {
        // Abrir pasta de importação
        vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(importPath));
        vscode.window.showInformationMessage(
            `📁 Pasta de importação: ${importPath}\n\nSalve seus arquivos do NotebookLM aqui!`
        );
        return;
    }

    // Salvar conteúdo colado
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `NotebookLM_Import_${timestamp}.md`;
    const filepath = path.join(importPath, filename);

    fs.writeFileSync(filepath, `# Importação do NotebookLM\n\nImportado em: ${new Date().toLocaleString('pt-BR')}\n\n---\n\n${content}`, 'utf8');

    vscode.window.showInformationMessage(`✅ Importado: ${filename}`);

    // Abrir arquivo importado
    const doc = await vscode.workspace.openTextDocument(filepath);
    await vscode.window.showTextDocument(doc);
}

async function openExportFile() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const config = vscode.workspace.getConfiguration('notebooklm-sync');
    const exportPath = path.join(workspaceFolder.uri.fsPath, config.get('exportPath'));
    const latestPath = path.join(exportPath, 'NotebookLM_Latest.txt');

    if (fs.existsSync(latestPath)) {
        const doc = await vscode.workspace.openTextDocument(latestPath);
        await vscode.window.showTextDocument(doc);
    } else {
        vscode.window.showWarningMessage('Nenhuma exportação encontrada. Use Ctrl+Shift+N para exportar.');
    }
}

function showPanel() {
    outputChannel.show();
}

function setupFileWatcher(context) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const config = vscode.workspace.getConfiguration('notebooklm-sync');
    const importPath = path.join(workspaceFolder.uri.fsPath, config.get('importPath'));

    // Criar pasta se não existir
    if (!fs.existsSync(importPath)) {
        fs.mkdirSync(importPath, { recursive: true });
    }

    const pattern = new vscode.RelativePattern(importPath, '**/*.{md,txt}');
    fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    fileWatcher.onDidCreate((uri) => {
        vscode.window.showInformationMessage(
            `📥 Novo arquivo detectado: ${path.basename(uri.fsPath)}`,
            'Abrir'
        ).then(action => {
            if (action === 'Abrir') {
                vscode.workspace.openTextDocument(uri).then(doc => {
                    vscode.window.showTextDocument(doc);
                });
            }
        });
    });

    context.subscriptions.push(fileWatcher);
}

function setupAutoExport(context) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const patterns = [
        new vscode.RelativePattern(workspaceFolder, '.agent/workflows/**/*.md'),
        new vscode.RelativePattern(workspaceFolder, '.bmad-core/**/*.md'),
        new vscode.RelativePattern(workspaceFolder, '.bmad-core/**/*.yaml')
    ];

    for (const pattern of patterns) {
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        watcher.onDidChange(() => {
            outputChannel.appendLine('🔄 Arquivo alterado, auto-exportando...');
            exportToNotebookLM();
        });
        context.subscriptions.push(watcher);
    }
}

// Tree View Providers
class OverviewTreeProvider {
    getTreeItem(element) {
        return element;
    }

    getChildren() {
        const items = [];

        const exportItem = new vscode.TreeItem('📤 Exportar para NotebookLM', vscode.TreeItemCollapsibleState.None);
        exportItem.command = { command: 'notebooklm-sync.exportToNotebookLM', title: 'Exportar' };
        exportItem.tooltip = 'Ctrl+Shift+N';
        items.push(exportItem);

        const importItem = new vscode.TreeItem('📥 Importar do NotebookLM', vscode.TreeItemCollapsibleState.None);
        importItem.command = { command: 'notebooklm-sync.importFromNotebookLM', title: 'Importar' };
        items.push(importItem);

        const openItem = new vscode.TreeItem('📄 Abrir Última Exportação', vscode.TreeItemCollapsibleState.None);
        openItem.command = { command: 'notebooklm-sync.openExportFile', title: 'Abrir' };
        items.push(openItem);

        return items;
    }
}

class ExportsTreeProvider {
    getTreeItem(element) {
        return element;
    }

    getChildren() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return [];

        const config = vscode.workspace.getConfiguration('notebooklm-sync');
        const exportPath = path.join(workspaceFolder.uri.fsPath, config.get('exportPath'));

        if (!fs.existsSync(exportPath)) return [];

        const files = fs.readdirSync(exportPath)
            .filter(f => f.endsWith('.txt'))
            .sort()
            .reverse()
            .slice(0, 10);

        return files.map(file => {
            const item = new vscode.TreeItem(file, vscode.TreeItemCollapsibleState.None);
            item.command = {
                command: 'vscode.open',
                title: 'Abrir',
                arguments: [vscode.Uri.file(path.join(exportPath, file))]
            };
            item.contextValue = 'exportFile';
            return item;
        });
    }
}

class ImportsTreeProvider {
    getTreeItem(element) {
        return element;
    }

    getChildren() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return [];

        const config = vscode.workspace.getConfiguration('notebooklm-sync');
        const importPath = path.join(workspaceFolder.uri.fsPath, config.get('importPath'));

        if (!fs.existsSync(importPath)) return [];

        const files = fs.readdirSync(importPath)
            .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
            .sort()
            .reverse()
            .slice(0, 10);

        return files.map(file => {
            const item = new vscode.TreeItem(file, vscode.TreeItemCollapsibleState.None);
            item.command = {
                command: 'vscode.open',
                title: 'Abrir',
                arguments: [vscode.Uri.file(path.join(importPath, file))]
            };
            item.contextValue = 'importFile';
            return item;
        });
    }
}

function deactivate() {
    if (fileWatcher) {
        fileWatcher.dispose();
    }
    if (outputChannel) {
        outputChannel.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};
