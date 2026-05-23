/**
 * exportar-contatos.js
 * Exportação de contatos por grupo/canal — com botão individual por grupo
 */

// State
const state = {
    groups: [],
    channels: [],
    stats: { groups: 0, channels: 0, contacts: 0 },
    currentInstance: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupSidebar();
    loadInstances().then(() => {
        carregarEstatisticas();
    });
    console.log('[Export] Sistema pronto');
});

// --- Theme & Sidebar ---
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
    const toggleButton = document.getElementById('menu-toggle');
    const wrapper = document.getElementById('wrapper');
    if (toggleButton && wrapper) {
        toggleButton.onclick = () => wrapper.classList.toggle('sb-sidenav-toggled');
    }
}

// --- Instance Management ---
async function loadInstances() {
    try {
        const response = await fetch('/v1/instance/fetchInstances', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const instances = await response.json();
        const listEl = document.getElementById('instance-list');
        listEl.innerHTML = '<li><h6 class="dropdown-header">Selecione a Instância</h6></li><li><hr class="dropdown-divider"></li>';

        if (Array.isArray(instances) && instances.length > 0) {
            const savedInstance = localStorage.getItem('whatsmiau_instance');
            const getName = (item) => (item.instance && item.instance.instanceName) || item.instanceName || item.name;
            const getStatus = (item) => (item.instance && item.instance.status) || item.status;

            let activeInstance = savedInstance || getName(instances[0]);
            if (!instances.some(i => getName(i) === activeInstance)) {
                activeInstance = getName(instances[0]);
            }

            state.currentInstance = activeInstance;
            updateInstanceUI(activeInstance, instances);

            instances.forEach(item => {
                const name = getName(item);
                const status = getStatus(item);
                const owner = (item.instance && item.instance.owner) || item.owner;
                const statusColor = status === 'connected' ? 'text-success' : 'text-danger';
                const icon = status === 'connected' ? 'fa-check-circle' : 'fa-times-circle';
                const li = document.createElement('li');
                li.innerHTML = `
                    <a class="dropdown-item d-flex justify-content-between align-items-center ${name === activeInstance ? 'active' : ''}"
                       href="#" onclick="selectInstance('${name}')">
                        <span>${name} <small class="text-muted ms-1">(${owner || '---'})</small></span>
                        <i class="fas ${icon} ${statusColor}"></i>
                    </a>
                `;
                listEl.appendChild(li);
            });
        } else {
            listEl.innerHTML += '<li><a class="dropdown-item disabled" href="#">Nenhuma instância</a></li>';
            document.getElementById('current-instance-name').textContent = 'Sem Instâncias';
        }
    } catch (error) {
        console.error('Erro ao carregar instâncias:', error);
        document.getElementById('current-instance-name').textContent = 'Erro Conexão';
    }
}

function selectInstance(name) {
    state.currentInstance = name;
    localStorage.setItem('whatsmiau_instance', name);
    location.reload();
}
window.selectInstance = selectInstance;

function updateInstanceUI(name, instances) {
    const getName = (item) => (item.instance && item.instance.instanceName) || item.instanceName || item.name;
    const getStatus = (item) => (item.instance && item.instance.status) || item.status;
    const item = instances.find(i => getName(i) === name);
    const status = item ? getStatus(item) : 'unknown';
    const statusColor = status === 'connected' ? 'text-success' : 'text-danger';
    document.getElementById('current-instance-name').innerHTML = `
        ${name} <i class="fas fa-circle ${statusColor} ms-2" style="font-size:0.6rem;"></i>
    `;
}

// --- Carregar grupos e canais ---
async function carregarEstatisticas() {
    const statGroups = document.getElementById('stat-groups');
    const statChannels = document.getElementById('stat-channels');
    const statContacts = document.getElementById('stat-contacts');
    const previewList = document.getElementById('preview-list');

    previewList.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div><p class="mt-2">Carregando grupos e canais...</p></div>';

    try {
        const instance = state.currentInstance || 'default';

        const [groupsResult, channelsResult] = await Promise.allSettled([
            fetch(`/api/whatsmiau2/groups?instance=${encodeURIComponent(instance)}`),
            fetch(`/api/whatsmiau2/newsletters?instance=${encodeURIComponent(instance)}`)
        ]);

        if (groupsResult.status === 'fulfilled') {
            const groupsResponse = groupsResult.value;
            const groupsData = await groupsResponse.json().catch(() => ({}));
            if (groupsResponse.ok) {
                if (Array.isArray(groupsData)) {
                    state.groups = groupsData;
                } else if (groupsData.success && Array.isArray(groupsData.data)) {
                    state.groups = groupsData.data;
                }
            } else {
                console.warn('[Export] Falha ao carregar grupos:', groupsData.error || groupsResponse.status);
                state.groups = [];
            }
        } else {
            console.warn('[Export] Falha de rede ao carregar grupos:', groupsResult.reason?.message || groupsResult.reason);
            state.groups = [];
        }

        if (channelsResult.status === 'fulfilled') {
            const channelsResponse = channelsResult.value;
            const channelsData = await channelsResponse.json().catch(() => ({}));
            if (channelsResponse.ok) {
                if (Array.isArray(channelsData)) {
                    state.channels = channelsData;
                } else if (channelsData.success && Array.isArray(channelsData.data)) {
                    state.channels = channelsData.data;
                }
            } else {
                console.warn('[Export] Falha ao carregar canais:', channelsData.error || channelsResponse.status);
                state.channels = [];
            }
        } else {
            console.warn('[Export] Falha de rede ao carregar canais:', channelsResult.reason?.message || channelsResult.reason);
            state.channels = [];
        }

        state.stats.groups = state.groups.length;
        state.stats.channels = state.channels.length;

        const groupsTotal = state.groups.reduce((sum, item) => sum + (item.participantCount || 0), 0);
        const channelsTotal = state.channels.reduce((sum, item) => sum + (item.subscriberCount || 0), 0);
        const total = groupsTotal + channelsTotal;

        statGroups.textContent = state.stats.groups;
        statChannels.textContent = state.stats.channels;
        statContacts.textContent = total > 0 ? `~${total}` : '0';

        renderGroupCards([...state.groups, ...state.channels]);

    } catch (error) {
        console.error('[Export Error]', error);
        document.getElementById('preview-list').innerHTML =
            `<div class="text-center text-danger py-4"><i class="fas fa-exclamation-triangle mb-2"></i><br>${error.message}</div>`;
    }
}

// --- Renderiza um card por grupo com botão individual ---
function renderGroupCards(items) {
    const previewList = document.getElementById('preview-list');
    previewList.innerHTML = '';

    if (items.length === 0) {
        previewList.innerHTML = '<div class="text-center text-muted py-4">Nenhum grupo ou canal encontrado</div>';
        return;
    }

    items.forEach((item, idx) => {
        const jid = item.jid || '';
        const isNewsletter = jid.endsWith('@newsletter');
        const label = item.subject || item.name || jid || 'Sem nome';
        const count = item.participantCount != null ? item.participantCount : '?';
        const icon = isNewsletter ? 'fa-bullhorn' : 'fa-users';
        const color = isNewsletter ? 'primary' : 'success';
        const safeName = label.replace(/'/g, "\\'").replace(/`/g, '');

        const card = document.createElement('div');
        card.className = 'card border-0 shadow-sm mb-2';
        card.id = `group-card-${idx}`;
        card.dataset.jid = jid;
        card.innerHTML = `
            <div class="card-body py-2 px-3 d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width:0;">
                    <i class="fas ${icon} text-${color}" style="font-size:1.1rem;min-width:18px;"></i>
                    <div style="min-width:0;">
                        <div class="fw-semibold text-truncate" style="max-width:300px;" title="${label.replace(/"/g, '&quot;')}">${label}</div>
                        <small class="text-muted group-jid" style="font-size:0.72rem;">${jid}</small>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2 ms-2 flex-shrink-0">
                    <span class="badge bg-secondary">${count} parts.</span>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-${color} dropdown-toggle btn-export"
                                type="button"
                                data-bs-toggle="dropdown"
                                id="btn-export-${idx}">
                            <i class="fas fa-download me-1"></i>Exportar
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0" style="min-width:180px;">
                            <li><h6 class="dropdown-header small">Formato de exportação</h6></li>
                            <li><a class="dropdown-item small" href="#" onclick="exportarGrupo(${idx},'csv');return false;">
                                <i class="fas fa-file-csv me-2 text-success"></i>CSV Completo
                            </a></li>
                            <li><a class="dropdown-item small" href="#" onclick="exportarGrupo(${idx},'csv-numbers');return false;">
                                <i class="fas fa-list-ol me-2 text-primary"></i>CSV Só Números
                            </a></li>
                            <li><a class="dropdown-item small" href="#" onclick="exportarGrupo(${idx},'txt');return false;">
                                <i class="fas fa-file-alt me-2 text-secondary"></i>TXT
                            </a></li>
                            <li><a class="dropdown-item small" href="#" onclick="exportarGrupo(${idx},'json');return false;">
                                <i class="fas fa-code me-2 text-warning"></i>JSON
                            </a></li>
                            <li><a class="dropdown-item small" href="#" onclick="exportarGrupo(${idx},'vcf');return false;">
                                <i class="fas fa-address-card me-2 text-info"></i>VCF (vCard)
                            </a></li>
                        </ul>
                    </div>
                    <span class="status-badge" id="status-badge-${idx}" style="display:none;"></span>
                </div>
            </div>
        `;
        previewList.appendChild(card);
    });
}

// --- Exporta contatos de UM grupo/canal específico ---
window.exportarGrupo = async function (idx, format) {
    const card = document.getElementById(`group-card-${idx}`);
    if (!card) return;

    const jid = card.dataset.jid;
    const label = card.querySelector('.fw-semibold')?.textContent.trim() || jid;
    const btnEl = document.getElementById(`btn-export-${idx}`);
    const statusEl = document.getElementById(`status-badge-${idx}`);
    const instance = state.currentInstance || 'default';

    if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Buscando...';
    }

    try {
        const participants = await fetchParticipantsByJid(jid, instance);

        if (participants.length === 0) {
            throw new Error('Nenhum participante encontrado neste grupo');
        }

        const contacts = participants
            .map(p => normalizeParticipant(p, label))
            .filter(Boolean)
            .map(p => ({
                source: label,
                jid: p.jid,
                number: p.number,
                role: p.role
            }))
            .filter(c => c.number);

        const content = buildFileContent(contacts, format);
        const safeName = label.replace(/[^\w\-]/g, '_').substring(0, 40);
        const ext = formatToExt(format);
        const mime = formatToMime(format);

        downloadFile(content, `${safeName}_${new Date().toISOString().slice(0, 10)}.${ext}`, mime);

        if (statusEl) {
            statusEl.style.display = 'inline';
            statusEl.innerHTML = `<span class="badge bg-success ms-1"><i class="fas fa-check me-1"></i>${contacts.length} exportados</span>`;
            setTimeout(() => { statusEl.style.display = 'none'; statusEl.innerHTML = ''; }, 5000);
        }

    } catch (error) {
        console.error('[ExportGrupo]', error);
        if (statusEl) {
            statusEl.style.display = 'inline';
            statusEl.innerHTML = `<span class="badge bg-danger ms-1" title="${error.message}"><i class="fas fa-times me-1"></i>Erro</span>`;
            setTimeout(() => { statusEl.style.display = 'none'; statusEl.innerHTML = ''; }, 5000);
        }
        alert(`Erro ao exportar "${label}":\n${error.message}`);
    } finally {
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.innerHTML = '<i class="fas fa-download me-1"></i>Exportar';
        }
    }
};

// --- Exportar TODOS os grupos (botão geral) ---
async function exportarContatos() {
    const format = document.getElementById('export-format').value;
    const includeGroups = document.getElementById('include-groups').checked;
    const includeChannels = document.getElementById('include-channels').checked;
    const statusDiv = document.getElementById('status-export');

    statusDiv.style.display = 'block';
    statusDiv.className = 'alert alert-info mt-3';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando exportação de todos os grupos...';

    let items = [];
    if (includeGroups) items = [...items, ...state.groups];
    if (includeChannels) items = [...items, ...state.channels];

    if (items.length === 0) {
        statusDiv.className = 'alert alert-warning mt-3';
        statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Nenhum grupo ou canal disponível.';
        return;
    }

    const instance = state.currentInstance || 'default';
    let allContacts = [];
    let processed = 0;
    let failed = 0;

    for (const item of items) {
        processed++;
        const label = item.subject || item.name || item.jid;
        statusDiv.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${processed}/${items.length} — Processando: <strong>${label}</strong>`;

        try {
            const participants = await fetchParticipantsByJid(item.jid, instance);
            participants.forEach(p => {
                const normalized = normalizeParticipant(p, label);
                if (!normalized) return;
                allContacts.push({
                    source: label,
                    jid: normalized.jid,
                    number: normalized.number,
                    role: normalized.role
                });
            });
        } catch (e) {
            failed++;
            console.warn(`[Export Warn] ${item.jid}:`, e.message);
        }

        await new Promise(r => setTimeout(r, 150));
    }

    if (allContacts.length === 0) {
        statusDiv.className = 'alert alert-warning mt-3';
        statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Nenhum contato encontrado nos grupos.';
        return;
    }

    const content = buildFileContent(allContacts, format);
    const ext = formatToExt(format);
    const mime = formatToMime(format);
    downloadFile(content, `contatos_todos_${new Date().toISOString().slice(0, 10)}.${ext}`, mime);

    const failMsg = failed > 0 ? ` (${failed} grupo(s) com erro)` : '';
    statusDiv.className = 'alert alert-success mt-3';
    statusDiv.innerHTML = `<i class="fas fa-check-circle me-2"></i><strong>${allContacts.length}</strong> contatos exportados com sucesso!${failMsg}`;
}

// --- Helpers ---
function authHeaders() {
    return { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` };
}

function extractParticipantsFromPayload(payload) {
    const root = payload?.data || payload || {};
    const candidates = [
        root?.Participants,
        root?.participants,
        root?.group?.Participants,
        root?.group?.participants
    ];
    for (const c of candidates) {
        if (Array.isArray(c)) return c;
    }
    return [];
}

function normalizeParticipant(p, sourceLabel) {
    if (!p || typeof p !== 'object') return null;
    const rawJid = p.JID || p.jid || p.id || '';
    const rawNumber = p.PhoneNumber || p.phoneNumber || p.phone || p.number || '';
    const number = String(rawNumber || (rawJid ? rawJid.split('@')[0] : '')).replace(/\D/g, '');
    if (!number) return null;
    return {
        source: sourceLabel,
        jid: rawJid || `${number}@s.whatsapp.net`,
        number,
        role: p.role || (p.IsAdmin || p.isAdmin ? 'admin' : 'member')
    };
}

async function fetchParticipantsByJid(jid, instance) {
    const isNewsletter = String(jid).endsWith('@newsletter');
    const endpoints = isNewsletter
        ? [
            `/api/whatsmiau2/newsletters/${encodeURIComponent(jid)}?instance=${encodeURIComponent(instance)}`
        ]
        : [
            `/api/whatsmiau2/groups/${encodeURIComponent(jid)}?instance=${encodeURIComponent(instance)}`
        ];

    let lastError = null;

    for (const endpoint of endpoints) {
        try {
            const resp = await fetch(endpoint, { headers: authHeaders() });
            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${resp.status}`);
            }
            const json = await resp.json();
            const participants = extractParticipantsFromPayload(json);
            if (participants.length > 0) return participants;
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError || new Error('Não foi possível carregar participantes do grupo');
}

function buildFileContent(contacts, format) {
    if (format === 'csv') {
        let c = '\uFEFFOrigem;Numero;JID;Papel\n';
        c += contacts.map(r => `"${(r.source || '').replace(/"/g, '""')}";"${r.number}";"${r.jid}";"${r.role}"`).join('\n');
        return c;
    }
    if (format === 'csv-numbers') {
        const nums = [...new Set(
            contacts.map(r => r.number.replace(/\D/g, ''))
                .filter(n => n.startsWith('55') && (n.length === 12 || n.length === 13))
        )];
        return '\uFEFFNumero\n' + nums.join('\n');
    }
    if (format === 'json') {
        return JSON.stringify(contacts, null, 2);
    }
    if (format === 'vcf') {
        return contacts.map(r =>
            `BEGIN:VCARD\nVERSION:3.0\nFN:WA ${r.number}\nTEL;TYPE=CELL:${r.number}\nNOTE:${r.source}\nEND:VCARD`
        ).join('\n');
    }
    // txt
    return contacts.map(r => `${r.number} (${r.source}) [${r.role}]`).join('\n');
}

function formatToExt(format) {
    const map = { csv: 'csv', 'csv-numbers': 'csv', json: 'json', vcf: 'vcf', txt: 'txt' };
    return map[format] || 'txt';
}

function formatToMime(format) {
    const map = {
        csv: 'text/csv;charset=utf-8',
        'csv-numbers': 'text/csv;charset=utf-8',
        json: 'application/json',
        vcf: 'text/vcard',
        txt: 'text/plain'
    };
    return map[format] || 'text/plain';
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
        URL.revokeObjectURL(url);
    }, 0);
}

function limparDados() {
    if (confirm('Limpar dados carregados?')) {
        ['stat-groups', 'stat-channels', 'stat-contacts'].forEach(id => {
            document.getElementById(id).textContent = '0';
        });
        document.getElementById('preview-list').innerHTML =
            '<div class="text-center text-muted py-4">Clique em "Atualizar" para recarregar</div>';
        document.getElementById('status-export').style.display = 'none';
        state.groups = [];
        state.channels = [];
    }
}
