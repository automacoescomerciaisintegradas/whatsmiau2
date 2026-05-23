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

// Mapa de DDDs brasileiros (67 códigos geográficos em uso)
const BR_DDD_MAP = {
    '11': { uf: 'SP', region: 'São Paulo e região metropolitana' },
    '12': { uf: 'SP', region: 'São José dos Campos e Vale do Paraíba' },
    '13': { uf: 'SP', region: 'Santos e Baixada Santista' },
    '14': { uf: 'SP', region: 'Bauru e Marília' },
    '15': { uf: 'SP', region: 'Sorocaba e Itapetininga' },
    '16': { uf: 'SP', region: 'Ribeirão Preto e Franca' },
    '17': { uf: 'SP', region: 'São José do Rio Preto' },
    '18': { uf: 'SP', region: 'Presidente Prudente e Araçatuba' },
    '19': { uf: 'SP', region: 'Campinas e Piracicaba' },
    '21': { uf: 'RJ', region: 'Rio de Janeiro e Grande Rio' },
    '22': { uf: 'RJ', region: 'Campos dos Goytacazes e Região dos Lagos' },
    '24': { uf: 'RJ', region: 'Volta Redonda, Petrópolis e Angra' },
    '27': { uf: 'ES', region: 'Vitória e região central/norte' },
    '28': { uf: 'ES', region: 'Cachoeiro de Itapemirim e sul do ES' },
    '31': { uf: 'MG', region: 'Belo Horizonte e região metropolitana' },
    '32': { uf: 'MG', region: 'Juiz de Fora e Zona da Mata' },
    '33': { uf: 'MG', region: 'Governador Valadares e leste de MG' },
    '34': { uf: 'MG', region: 'Uberlândia e Triângulo Mineiro' },
    '35': { uf: 'MG', region: 'Poços de Caldas e sul de MG' },
    '37': { uf: 'MG', region: 'Divinópolis e centro-oeste de MG' },
    '38': { uf: 'MG', region: 'Montes Claros e norte de MG' },
    '41': { uf: 'PR', region: 'Curitiba e região metropolitana' },
    '42': { uf: 'PR', region: 'Ponta Grossa e Campos Gerais' },
    '43': { uf: 'PR', region: 'Londrina e norte do PR' },
    '44': { uf: 'PR', region: 'Maringá e noroeste do PR' },
    '45': { uf: 'PR', region: 'Cascavel e oeste do PR' },
    '46': { uf: 'PR', region: 'Francisco Beltrão e sudoeste do PR' },
    '47': { uf: 'SC', region: 'Joinville, Blumenau e Itajaí' },
    '48': { uf: 'SC', region: 'Florianópolis e sul de SC' },
    '49': { uf: 'SC', region: 'Chapecó e oeste de SC' },
    '51': { uf: 'RS', region: 'Porto Alegre e região metropolitana' },
    '53': { uf: 'RS', region: 'Pelotas e Rio Grande' },
    '54': { uf: 'RS', region: 'Caxias do Sul e Serra Gaúcha' },
    '55': { uf: 'RS', region: 'Santa Maria e noroeste do RS' },
    '61': { uf: 'DF', region: 'Brasília e entorno' },
    '62': { uf: 'GO', region: 'Goiânia e região central de GO' },
    '63': { uf: 'TO', region: 'Palmas e Tocantins' },
    '64': { uf: 'GO', region: 'Rio Verde, Itumbiara e sul de GO' },
    '65': { uf: 'MT', region: 'Cuiabá e região' },
    '66': { uf: 'MT', region: 'Rondonópolis, Sinop e interior de MT' },
    '67': { uf: 'MS', region: 'Campo Grande e Mato Grosso do Sul' },
    '68': { uf: 'AC', region: 'Rio Branco e Acre' },
    '69': { uf: 'RO', region: 'Porto Velho e Rondônia' },
    '71': { uf: 'BA', region: 'Salvador e região metropolitana' },
    '73': { uf: 'BA', region: 'Ilhéus, Itabuna e sul da BA' },
    '74': { uf: 'BA', region: 'Juazeiro e norte da BA' },
    '75': { uf: 'BA', region: 'Feira de Santana e interior da BA' },
    '77': { uf: 'BA', region: 'Vitória da Conquista e oeste da BA' },
    '79': { uf: 'SE', region: 'Aracaju e Sergipe' },
    '81': { uf: 'PE', region: 'Recife e região metropolitana' },
    '82': { uf: 'AL', region: 'Maceió e Alagoas' },
    '83': { uf: 'PB', region: 'João Pessoa e Paraíba' },
    '84': { uf: 'RN', region: 'Natal e Rio Grande do Norte' },
    '85': { uf: 'CE', region: 'Fortaleza e região metropolitana' },
    '86': { uf: 'PI', region: 'Teresina e centro-norte do PI' },
    '87': { uf: 'PE', region: 'Petrolina e interior de PE' },
    '88': { uf: 'CE', region: 'Sobral, Juazeiro do Norte e interior do CE' },
    '89': { uf: 'PI', region: 'Picos e sul do PI' },
    '91': { uf: 'PA', region: 'Belém e região metropolitana' },
    '92': { uf: 'AM', region: 'Manaus e região central do AM' },
    '93': { uf: 'PA', region: 'Santarém e oeste do PA' },
    '94': { uf: 'PA', region: 'Marabá e sudeste do PA' },
    '95': { uf: 'RR', region: 'Boa Vista e Roraima' },
    '96': { uf: 'AP', region: 'Macapá e Amapá' },
    '97': { uf: 'AM', region: 'Interior do Amazonas' },
    '98': { uf: 'MA', region: 'São Luís e norte do MA' },
    '99': { uf: 'MA', region: 'Imperatriz e sul do MA' }
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
            fetchGroupsWithFallback(instance),
            fetchNewslettersWithFallback(instance)
        ]);

        if (groupsResult.status === 'fulfilled') {
            state.groups = groupsResult.value;
        } else {
            console.warn('[Export] Falha de rede ao carregar grupos:', groupsResult.reason?.message || groupsResult.reason);
            state.groups = [];
        }

        if (channelsResult.status === 'fulfilled') {
            state.channels = channelsResult.value;
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
        card.className = 'card border-0 shadow-sm mb-2 export-preview-item';
        card.id = `group-card-${idx}`;
        card.dataset.jid = jid;
        card.innerHTML = `
            <div class="card-body py-3 px-3 d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width:0;">
                    <i class="fas ${icon} text-${color}" style="font-size:1.1rem;min-width:18px;"></i>
                    <div style="min-width:0;">
                        <div class="fw-semibold text-truncate" style="max-width:420px;" title="${label.replace(/"/g, '&quot;')}">${label}</div>
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
                            <li><a class="dropdown-item small" href="#" onclick="exportarGrupo(${idx},'numbers');return false;">
                                <i class="fas fa-hashtag me-2 text-dark"></i>Lista Só Números
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
window.exportarGrupo = function (idx, format) {
    const card = document.getElementById(`group-card-${idx}`);
    if (!card) return;

    const jid = card.dataset.jid;
    const label = card.querySelector('.fw-semibold')?.textContent.trim() || jid;
    const btnEl = document.getElementById(`btn-export-${idx}`);
    const statusEl = document.getElementById(`status-badge-${idx}`);
    const instance = state.currentInstance || 'default';
    const dddFilter = getDddFilterValueRaw();

    if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Preparando...';
    }

    const url = `/api/whatsmiau2/export/contacts?instance=${encodeURIComponent(instance)}&jid=${encodeURIComponent(jid)}&format=${encodeURIComponent(format)}&label=${encodeURIComponent(label)}${dddFilter ? `&ddd=${encodeURIComponent(dddFilter)}` : ''}`;
    triggerDirectDownload(url);

    if (statusEl) {
        statusEl.style.display = 'inline';
        statusEl.innerHTML = `<span class="badge bg-success ms-1"><i class="fas fa-check me-1"></i>Download iniciado</span>`;
        setTimeout(() => { statusEl.style.display = 'none'; statusEl.innerHTML = ''; }, 4000);
    }

    setTimeout(() => {
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.innerHTML = '<i class="fas fa-download me-1"></i>Exportar';
        }
    }, 900);
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
    const dddFilterRaw = getDddFilterValueRaw();
    const dddFilterSet = resolveDddFilterSet(dddFilterRaw);
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

    if (dddFilterSet) {
        allContacts = allContacts.filter(c => dddFilterSet.has(parseBrazilNumber(c.number).ddd));
    }

    if (allContacts.length === 0) {
        statusDiv.className = 'alert alert-warning mt-3';
        statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>Nenhum contato encontrado para o filtro ${dddFilterRaw || '-'}.`;
        return;
    }

    const content = buildFileContent(allContacts, format);
    const ext = formatToExt(format);
    const mime = formatToMime(format);
    downloadFile(content, `contatos_todos_${new Date().toISOString().slice(0, 10)}.${ext}`, mime);

    const failMsg = failed > 0 ? ` (${failed} grupo(s) com erro)` : '';
    statusDiv.className = 'alert alert-success mt-3';
    statusDiv.innerHTML = `<i class="fas fa-check-circle me-2"></i><strong>${allContacts.length}</strong> contatos exportados com sucesso!${dddFilterRaw ? ` (Filtro ${dddFilterRaw})` : ''}${failMsg}`;
}

// --- Helpers ---
async function fetchGroupsWithFallback(instance) {
    // 1) Preferred proxy route
    try {
        const resp = await fetch(`/api/whatsmiau2/groups?instance=${encodeURIComponent(instance)}`);
        if (resp.ok) {
            const payload = await resp.json().catch(() => ({}));
            const groups = Array.isArray(payload)
                ? payload
                : (payload?.success && Array.isArray(payload?.data) ? payload.data : []);
            if (groups.length > 0) return groups;
        }
    } catch (e) {
        console.warn('[Export] /api groups fallback trigger:', e.message);
    }

    // 2) Direct backend route fallback
    const direct = await fetch(`/v1/group/list/${encodeURIComponent(instance)}`, {
        headers: authHeaders()
    });
    if (!direct.ok) {
        throw new Error(`Falha ao carregar grupos (${direct.status})`);
    }
    const directPayload = await direct.json().catch(() => []);
    return Array.isArray(directPayload) ? directPayload : (directPayload?.groups || []);
}

async function fetchNewslettersWithFallback(instance) {
    // 1) Preferred proxy route
    try {
        const resp = await fetch(`/api/whatsmiau2/newsletters?instance=${encodeURIComponent(instance)}`);
        if (resp.ok) {
            const payload = await resp.json().catch(() => ({}));
            const channels = Array.isArray(payload)
                ? payload
                : (payload?.success && Array.isArray(payload?.data) ? payload.data : []);
            if (channels.length > 0) return channels;
        }
    } catch (e) {
        console.warn('[Export] /api newsletters fallback trigger:', e.message);
    }

    // 2) Direct backend route fallback
    const direct = await fetch(`/v1/newsletter/list/${encodeURIComponent(instance)}`, {
        headers: authHeaders()
    });
    if (!direct.ok) {
        throw new Error(`Falha ao carregar canais (${direct.status})`);
    }
    const directPayload = await direct.json().catch(() => ({}));
    if (Array.isArray(directPayload)) return directPayload;
    return Array.isArray(directPayload?.newsletters) ? directPayload.newsletters : [];
}

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
        const seen = new Set();
        const rows = [];

        contacts.forEach((r) => {
            const parsed = parseBrazilNumber(String(r?.number || r?.jid || ''));
            if (!parsed.numberE164 || seen.has(parsed.numberE164)) return;
            seen.add(parsed.numberE164);

            rows.push([
                parsed.countryCode,
                parsed.ddd,
                parsed.uf,
                parsed.region,
                parsed.localNumber,
                parsed.numberE164
            ]);
        });

        let csv = '\uFEFFPais;DDD;UF;Regiao;NumeroLocal;NumeroE164\n';
        csv += rows.map(cols => cols.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';')).join('\n');
        return csv;
    }
    if (format === 'numbers') {
        const nums = [...new Set(
            contacts
                .map(r => parseBrazilNumber(String(r?.number || r?.jid || '')).numberE164)
                .filter(Boolean)
        )];
        return nums.join('\n');
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

function parseBrazilNumber(input) {
    let digits = String(input || '').replace(/\D/g, '');
    digits = digits.replace(/^0+/, '');

    let countryCode = '';
    let ddd = '';
    let localNumber = '';

    if (digits.startsWith('55') && digits.length >= 12) {
        countryCode = '55';
        ddd = digits.slice(2, 4);
        localNumber = digits.slice(4);
    } else if (digits.length >= 10) {
        countryCode = '55';
        ddd = digits.slice(0, 2);
        localNumber = digits.slice(2);
    } else {
        return {
            countryCode: '',
            ddd: '',
            uf: '',
            region: '',
            localNumber: digits,
            numberE164: ''
        };
    }

    const dddInfo = BR_DDD_MAP[ddd] || { uf: '', region: 'DDD não mapeado' };
    return {
        countryCode,
        ddd,
        uf: dddInfo.uf,
        region: dddInfo.region,
        localNumber,
        numberE164: `${countryCode}${ddd}${localNumber}`
    };
}

function formatToExt(format) {
    const map = { csv: 'csv', 'csv-numbers': 'csv', numbers: 'txt', json: 'json', vcf: 'vcf', txt: 'txt' };
    return map[format] || 'txt';
}

function formatToMime(format) {
    const map = {
        csv: 'text/csv;charset=utf-8',
        'csv-numbers': 'text/csv;charset=utf-8',
        numbers: 'text/plain;charset=utf-8',
        json: 'application/json',
        vcf: 'text/vcard',
        txt: 'text/plain'
    };
    return map[format] || 'text/plain';
}

function getDddFilterValueRaw() {
    const input = document.getElementById('filter-ddd');
    if (!input) return '';
    return String(input.value || '').trim().toUpperCase();
}

function normalizeDddToken(token) {
    let t = String(token || '').replace(/\D/g, '');
    if (!t) return '';
    if (t.length === 3 && t.startsWith('0')) t = t.slice(1);
    if (t.length > 2) t = t.slice(-2);
    return BR_DDD_MAP[t] ? t : '';
}

function resolveDddFilterSet(raw) {
    const value = String(raw || '').trim().toUpperCase();
    if (!value) return null;

    // UF ex: PR, SP, RJ
    if (/^[A-Z]{2}$/.test(value)) {
        const ddds = Object.keys(BR_DDD_MAP).filter(ddd => BR_DDD_MAP[ddd].uf === value);
        return ddds.length ? new Set(ddds) : null;
    }

    // Lista ex: 41,42,43 ou 041;042
    const tokens = value.split(/[,\s;|/]+/).map(normalizeDddToken).filter(Boolean);
    return tokens.length ? new Set(tokens) : null;
}

function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });

    // IE/legacy fallback
    if (window.navigator && typeof window.navigator.msSaveOrOpenBlob === 'function') {
        window.navigator.msSaveOrOpenBlob(blob, fileName);
        return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    a.rel = 'noopener';
    document.body.appendChild(a);

    try {
        a.click();
    } catch (err) {
        // Safari/WKWebView fallback
        const reader = new FileReader();
        reader.onloadend = () => {
            const fallback = document.createElement('a');
            fallback.href = reader.result;
            fallback.download = fileName;
            fallback.style.display = 'none';
            document.body.appendChild(fallback);
            fallback.click();
            document.body.removeChild(fallback);
        };
        reader.readAsDataURL(blob);
    } finally {
        setTimeout(() => {
            if (a.parentNode) document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 300);
    }
}

function triggerDirectDownload(url) {
    const a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        if (a.parentNode) document.body.removeChild(a);
    }, 100);
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
