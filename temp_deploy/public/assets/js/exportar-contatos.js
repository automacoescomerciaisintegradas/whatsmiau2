/**
 * exportar-contatos.js
 * Script para gerenciar a exportação de contatos do WhatsMiau2
 */

// State
const state = {
    groups: [],
    channels: [],
    newsletters: [],
    selectedGroups: [],
    stats: {
        groups: 0,
        channels: 0,
        contacts: 0
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupSidebar();

    // Initial Load
    carregarEstatisticas();

    console.log('[Export] Sistema pronto');
});

// UI Setup (Theme & Sidebar)
function setupTheme() {
    const toggleSwitch = document.querySelector('#darkModeSwitch');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark') {
        body.setAttribute('data-theme', 'dark');
        if (toggleSwitch) toggleSwitch.checked = true;
    }

    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', () => {
            const theme = toggleSwitch.checked ? 'dark' : 'light';
            body.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }
}

function setupSidebar() {
    const toggleButton = document.getElementById("menu-toggle");
    const wrapper = document.getElementById("wrapper");
    if (toggleButton && wrapper) {
        toggleButton.onclick = () => wrapper.classList.toggle("sb-sidenav-toggled");
    }
}

// Logic Functions
async function carregarEstatisticas() {
    const statGroups = document.getElementById('stat-groups');
    const statChannels = document.getElementById('stat-channels');
    const statContacts = document.getElementById('stat-contacts');
    const previewList = document.getElementById('preview-list');

    previewList.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div><p class="mt-2">Carregando dados...</p></div>';

    try {
        // Fetch groups and newsletters concurrently
        const [groupsResponse, channelsResponse] = await Promise.all([
            fetch('/api/whatsmiau2/groups?getParticipants=false'),
            fetch('/api/whatsmiau2/newsletters')
        ]);

        const groupsData = await groupsResponse.json();
        const channelsData = await channelsResponse.json();

        // Handle Groups
        if (groupsData.success && groupsData.data) {
            state.groups = groupsData.data; // All from here are groups
        }

        // Handle Channels
        if (channelsData.success && channelsData.data) {
            state.channels = channelsData.data;
        }

        // Update stats
        state.stats.groups = state.groups.length;
        state.stats.channels = state.channels.length;

        // Calc total participants (Group participants + Channel subscribers/viewers)
        // Group: participantCount, Channel: subscriberCount (usually)
        const groupsTotal = state.groups.reduce((sum, item) => sum + (item.participantCount || 0), 0);
        // Channels often have 'subscriberCount' or similar
        const channelsTotal = state.channels.reduce((sum, item) => sum + (item.subscriberCount || 0), 0);

        const total = groupsTotal + channelsTotal;

        statGroups.textContent = state.stats.groups;
        statChannels.textContent = state.stats.channels;
        statContacts.textContent = total > 0 ? `~${total}` : '0';

        // Render Preview
        renderPreview([...state.groups, ...state.channels]);

    } catch (error) {
        console.error('[Export Error]', error);
        previewList.innerHTML = `<div class="text-center text-danger py-4"><i class="fas fa-exclamation-triangle mb-2"></i><br>${error.message}</div>`;
    }
}

function renderPreview(items) {
    const previewList = document.getElementById('preview-list');
    previewList.innerHTML = '';

    if (items.length === 0) {
        previewList.innerHTML = '<div class="text-center text-muted py-4">Nenhum item encontrado</div>';
        return;
    }

    // Show first 20 items
    items.slice(0, 20).forEach(item => {
        const div = document.createElement('div');
        div.className = 'd-flex justify-content-between align-items-center p-2 border-bottom';
        div.innerHTML = `
            <div>
                <i class="fas ${item.jid.endsWith('@newsletter') ? 'fa-bullhorn text-primary' : 'fa-users text-success'} me-2"></i>
                <span class="fw-bold">${item.subject || item.name || 'Sem nome'}</span>
            </div>
            <span class="badge bg-secondary">${item.participantCount || '?'} parts.</span>
        `;
        previewList.appendChild(div);
    });

    if (items.length > 20) {
        const moreDiv = document.createElement('div');
        moreDiv.className = 'text-center text-muted p-2';
        moreDiv.textContent = `... e mais ${items.length - 20} itens`;
        previewList.appendChild(moreDiv);
    }
}

async function exportarContatos() {
    const format = document.getElementById('export-format').value;
    const includeParticipants = document.getElementById('include-participants').checked;
    const statusDiv = document.getElementById('status-export');

    statusDiv.style.display = 'block';
    statusDiv.className = 'alert alert-info mt-3';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Extraindo contatos... Isso pode demorar.';

    try {
        let allContacts = [];

        // 1. Get List of Groups to Process
        const itemsToProcess = [...state.groups, ...state.channels];

        if (itemsToProcess.length === 0) {
            throw new Error("Nenhum grupo ou canal disponível para exportar.");
        }

        // 2. Fetch Participants for each group (if checked)
        if (includeParticipants) {
            let processed = 0;
            const total = itemsToProcess.length;

            // Process in chunks to avoid rate limiting/overload
            for (const item of itemsToProcess) {
                processed++;
                statusDiv.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i> Processando ${processed}/${total}: ${item.subject || item.name}`;

                try {
                    // Try to fetch participants detail
                    const resp = await fetch(`/api/whatsmiau2/groups/${encodeURIComponent(item.jid)}`);
                    const json = await resp.json();

                    if (json.success && json.data) {
                        const participants = json.data.Participants || json.data.participants || [];

                        participants.forEach(p => {
                            const jid = p.JID || p.jid || p.id;
                            const contactJid = p.PhoneNumber || (typeof jid === 'string' ? jid : '');

                            if (!contactJid) return;

                            const isAdmin = p.IsAdmin || p.isAdmin || p.admin;
                            const role = isAdmin ? 'admin' : 'member';

                            allContacts.push({
                                source: item.subject || item.name || 'Desconhecido',
                                jid: contactJid,
                                number: contactJid.split('@')[0],
                                role: role
                            });
                        });
                    }
                } catch (e) {
                    console.warn(`[Export Warn] Failed to fetch participants for ${item.jid}`, e);
                    // Continue anyway
                }

                // Small delay to be nice to server
                await new Promise(r => setTimeout(r, 100)); // 100ms delay
            }
        } else {
            // Only export Group Info if participants not checked
            allContacts = itemsToProcess.map(i => ({
                source: 'System',
                jid: i.jid,
                number: i.jid.split('@')[0],
                role: 'owner/system'
            }));
        }

        // 3. Remove Duplicates (Optional, but good practice)
        // For distinct list: const uniqueContacts = [...new Map(allContacts.map(item => [item.jid, item])).values()];
        // For CSV with Source, we might want to keep duplicates if appearing in multiple groups?
        // Let's keep them to know origin, but maybe add a 'Unique' export option later.

        state.stats.contacts = allContacts.length;
        document.getElementById('stat-contacts').textContent = state.stats.contacts;

        // 4. Generate File Content
        let content = '';
        let mimeType = 'text/plain';
        let extension = 'txt';

        if (format === 'csv') {
            mimeType = 'text/csv;charset=utf-8';
            extension = 'csv';
            // Add BOM for correct Excel encoding of special characters
            content = "\uFEFF";
            // Use semicolon (;) which is the standard CSV separator for Excel in Brazil/Europe
            content += "Origem;Numero;JID;Papel\n";
            content += allContacts.map(c => {
                // Escape quotes in content
                const source = (c.source || '').replace(/"/g, '""');
                return `"${source}";"${c.number}";"${c.jid}";"${c.role}"`;
            }).join("\n");
        } else if (format === 'csv-numbers') {
            mimeType = 'text/csv;charset=utf-8';
            extension = 'csv';
            // BOM for Excel
            content = "\uFEFF";
            // Header
            content += "Numero\n";
            // Filter distinct numbers and ensure they look like valid mobile numbers (BR: 12-13 digits, starts with 55)
            const uniqueNumbers = [...new Set(allContacts
                .map(c => c.number.replace(/\D/g, '')) // Remove any non-numeric chars just in case
                .filter(n => {
                    // Check if it is a potentially valid number
                    // User Example: 558899745661 (12 digits? No, 55 + 88 + 99745661 = 13 digits usually)
                    // BR Landline: 55 11 3333 4444 = 12 digits
                    // BR Mobile: 55 11 99999 8888 = 13 digits

                    // Allow 12 or 13 digits starting with 55 (Brazil)
                    if (n.startsWith('55') && (n.length === 12 || n.length === 13)) {
                        return true;
                    }
                    // Optional: Allow international numbers?
                    //return n.length > 10; 
                    return false; // For now, restrict to BR format as requested "55..."
                })
            )];
            content += uniqueNumbers.join("\n");
        } else if (format === 'json') {
            mimeType = 'application/json';
            extension = 'json';
            content = JSON.stringify(allContacts, null, 2);
        } else if (format === 'vcf') {
            mimeType = 'text/vcard';
            extension = 'vcf';
            content = allContacts.map(c =>
                `BEGIN:VCARD
VERSION:3.0
FN:WA Contact ${c.number}
TEL;TYPE=CELL:${c.number}
NOTE:Imported from ${c.source}
END:VCARD`).join("\n");
        } else {
            // TXT
            content = allContacts.map(c => `${c.number} (${c.source})`).join("\n");
        }

        // 5. Download
        downloadFile(content, `contatos_whatsapp_${new Date().toISOString().slice(0, 10)}.${extension}`, mimeType);

        statusDiv.className = 'alert alert-success mt-3';
        statusDiv.innerHTML = `<i class="fas fa-check-circle me-2"></i> Sucesso! ${allContacts.length} contatos exportados.`;

    } catch (error) {
        console.error(error);
        statusDiv.className = 'alert alert-danger mt-3';
        statusDiv.innerHTML = `<i class="fas fa-times-circle me-2"></i> Erro: ${error.message}`;
    }
}

function downloadFile(content, fileName, mimeType) {
    const a = document.createElement('a');
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function limparDados() {
    if (confirm('Limpar dados carregados?')) {
        document.getElementById('stat-groups').textContent = '0';
        document.getElementById('stat-channels').textContent = '0';
        document.getElementById('stat-contacts').textContent = '0';
        document.getElementById('preview-list').innerHTML = '<div class="text-center text-muted py-4">Clique em "Atualizar"</div>';
        document.getElementById('status-export').style.display = 'none';
    }
}
