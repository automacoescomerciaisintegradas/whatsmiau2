// ============================================
// WHATSMIAU2 DISPARADOR - JAVASCRIPT
// ============================================

let isRunning = false;
let shouldStop = false;
let currentTab = 'text';
let groupModal;
let INSTANCE_READY = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    const toggleSwitch = document.querySelector('#darkModeSwitch');
    const body = document.body;
    const toggleButton = document.getElementById("menu-toggle");
    const wrapper = document.getElementById("wrapper");

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

    if (toggleButton && wrapper) {
        toggleButton.onclick = () => wrapper.classList.toggle("sb-sidenav-toggled");
    }

    // Initialize Bootstrap modal
    const modalEl = document.getElementById('groupModal');
    if (modalEl) {
        groupModal = new bootstrap.Modal(modalEl);
    }

    // Setup event listeners
    const targetList = document.getElementById('target-list');
    if (targetList) {
        targetList.addEventListener('input', updateCount);
    }

    checkInstanceStatus();
    log('[Sistema] Disparador carregado e pronto.', 'success');
});

// Instance management
const urlParams = new URLSearchParams(window.location.search);
let INSTANCE_NAME =
    urlParams.get('instance') ||
    localStorage.getItem('whatsmiau_instance') ||
    localStorage.getItem('disparador_instance') ||
    '';

async function checkInstanceStatus() {
    const selector = document.getElementById('instance-selector');
    const statusDot = document.getElementById('instance-status-dot');
    INSTANCE_READY = false;

    try {
        const res = await fetch(`/v1/instance/fetchInstances`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await res.json();
        const instances = Array.isArray(data) ? data : (data.instances || []);

        if (instances.length > 0) {
            const names = instances.map(i => i.instance?.instanceName || i.instance?.name || i.instanceName || i.name || '');
            if (!INSTANCE_NAME || !names.some(n => n.toLowerCase() === INSTANCE_NAME.toLowerCase())) {
                INSTANCE_NAME = names[0];
            }
        }

        if (selector) {
            selector.innerHTML = '';
            instances.forEach(i => {
                const name = i.instance?.instanceName || i.instance?.name || i.instanceName || i.name || "Sem Nome";
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name.toUpperCase();
                if (name.toLowerCase() === INSTANCE_NAME.toLowerCase()) opt.selected = true;
                selector.appendChild(opt);
            });

            // If list is empty
            if (instances.length === 0) {
                selector.innerHTML = '<option value="">SEM INSTÂNCIAS</option>';
            }

            // Listener for change
            if (!selector.dataset.listener) {
                selector.addEventListener('change', (e) => {
                    INSTANCE_NAME = e.target.value;
                    localStorage.setItem('whatsmiau_instance', INSTANCE_NAME);
                    localStorage.setItem('disparador_instance', INSTANCE_NAME);
                    checkInstanceStatus(); // Refresh status dot
                    log(`Instância alterada para: ${INSTANCE_NAME}`, 'info');
                });
                selector.dataset.listener = 'true';
            }
        }

        const myInst = instances.find(i => {
            const name = (i.instance?.instanceName || i.instance?.name || i.instanceName || i.name || "").toLowerCase();
            return name === INSTANCE_NAME.toLowerCase();
        });

        if (!myInst) {
            if (statusDot) statusDot.className = 'badge rounded-circle p-1 bg-warning';
            log(`⚠️ Instância "${INSTANCE_NAME}" não encontrada.`, 'warning');
            return;
        }

        const rawStatus = (myInst.instance?.status || myInst.status || 'disconnected').toLowerCase();

        if (rawStatus === 'connected' || rawStatus === 'open' || rawStatus === 'conectado') {
            INSTANCE_READY = true;
            localStorage.setItem('whatsmiau_instance', INSTANCE_NAME);
            localStorage.setItem('disparador_instance', INSTANCE_NAME);
            if (statusDot) {
                statusDot.className = 'badge rounded-circle p-1 bg-success';
                statusDot.title = "Instância Ativa";
            }
            log(`Instância ${INSTANCE_NAME} está PRONTA.`, 'success');
        } else {
            if (statusDot) {
                statusDot.className = 'badge rounded-circle p-1 bg-danger';
                statusDot.title = `Status: ${rawStatus.toUpperCase()}`;
            }
            log(`⚠️ AVISO: ${INSTANCE_NAME} está ${rawStatus.toUpperCase()}.`, 'warning');
        }
    } catch (e) {
        log(`Erro ao carger status: ${e.message}`, 'error');
    }
}

// ============================================
// TAB MANAGEMENT
// ============================================

function setTab(tab) {
    currentTab = tab;

    // Update buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Show/hide sections
    document.getElementById('section-text').style.display = 'none';
    document.getElementById('section-audio').style.display = 'none';
    document.getElementById('section-media').style.display = 'none';
    document.getElementById('section-video').style.display = 'none';
    document.getElementById(`section-${tab}`).style.display = 'block';

    if (tab !== 'video') {
        stopCamera();
    }

    log(`Modo alterado para: ${tab.toUpperCase()}`, 'info');
}

// ============================================
// MICROPHONE RECORDING
// ============================================

let mediaRecorder;
let audioChunks = [];
let recordingInterval;
let startTime;

async function toggleRecording() {
    const btn = document.getElementById('btn-record');
    const icon = document.getElementById('record-icon');
    const status = document.getElementById('record-status');
    const timer = document.getElementById('record-timer');

    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        // Start Recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(audioBlob);

                // Create a File object to mimic input file
                const file = new File([audioBlob], `gravacao_${new Date().getTime()}.mp3`, { type: 'audio/mpeg' });

                // Show preview
                const container = document.getElementById('audio-preview-container');
                document.getElementById('audio-file-name').textContent = file.name;
                document.getElementById('audio-file-info').textContent = `${(file.size / 1024).toFixed(2)} KB • Gravado via Mic`;

                const audioPlayer = document.getElementById('audio-preview');
                audioPlayer.src = audioUrl;
                container.style.display = 'block';

                // Important: Store this file globally or in a way startDispatch can find it
                window.recordedAudioFile = file;

                log('Gravação finalizada.', 'success');
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            btn.classList.add('recording', 'pulse-red');
            icon.classList.remove('fa-microphone');
            icon.classList.add('fa-stop');
            status.textContent = 'GRAVANDO...';
            status.classList.add('text-danger');
            timer.style.display = 'block';

            startTime = Date.now();
            recordingInterval = setInterval(updateTimer, 1000);
            log('Iniciando gravação do microfone...', 'info');

        } catch (err) {
            log('Erro ao acessar microfone: ' + err.message, 'error');
            alert('Não foi possível acessar o microfone. Verifique as permissões.');
        }
    } else {
        // Stop Recording
        mediaRecorder.stop();
        btn.classList.remove('recording', 'pulse-red');
        icon.classList.remove('fa-stop');
        icon.classList.add('fa-microphone');
        status.textContent = 'GRAVAR VOZ (MIC)';
        status.classList.remove('text-danger');
        timer.style.display = 'none';
        clearInterval(recordingInterval);
    }
}

function updateTimer() {
    const timer = document.getElementById('record-timer');
    const now = Date.now();
    const diff = now - startTime;
    const mins = Math.floor(diff / 60000).toString().padStart(2, '0');
    const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    timer.textContent = `${mins}:${secs}`;
}

// ============================================
// VIDEO RECORDING
// ============================================

let videoStream;
let videoRecorder;
let videoChunks = [];
let videoStartTime;
let videoTimerInterval;

async function startCamera() {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoElement = document.getElementById('video-preview-live');
        if (videoElement) {
            videoElement.srcObject = videoStream;
        }
        log('Câmera ativada.', 'info');
    } catch (err) {
        log('Erro ao acessar a câmera: ' + err.message, 'error');
        alert('Não foi possível acessar a câmera. Verifique as permissões.');
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

function openVideoModal() {
    const modal = document.getElementById('video-recorder-modal');
    if (modal) {
        modal.showModal();
        startCamera();
    }
}

function closeVideoModal() {
    const modal = document.getElementById('video-recorder-modal');
    if (modal) {
        if (videoRecorder && videoRecorder.state === 'recording') {
            if (!confirm('A gravação está em andamento. Deseja cancelar?')) return;
            videoRecorder.stop();
        }
        modal.close();
        stopCamera();
    }
}

async function toggleVideoRecording() {
    const btn = document.getElementById('btn-record-video');
    const timerOverlay = document.getElementById('video-timer-overlay');

    if (!videoRecorder || videoRecorder.state === 'inactive') {
        // Start
        if (!videoStream) await startCamera();

        videoChunks = [];
        videoRecorder = new MediaRecorder(videoStream);

        videoRecorder.ondataavailable = (e) => videoChunks.push(e.data);

        videoRecorder.onstop = () => {
            const blob = new Blob(videoChunks, { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            const file = new File([blob], `video_${Date.now()}.mp4`, { type: 'video/mp4' });

            window.recordedVideoFile = file;

            document.getElementById('video-result-container').style.display = 'block';
            document.getElementById('video-file-info').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB • Gravado com sucesso`;

            const playback = document.getElementById('video-playback');
            playback.src = url;

            log('Vídeo gravado com sucesso. Você pode fechar o gravador agora.', 'success');
        };

        videoRecorder.start();
        btn.classList.add('recording');
        timerOverlay.style.display = 'flex';
        videoStartTime = Date.now();
        videoTimerInterval = setInterval(updateVideoTimer, 1000);
        log('Gravando vídeo...', 'info');
    } else {
        // Stop
        videoRecorder.stop();
        btn.classList.remove('recording');
        timerOverlay.style.display = 'none';
        clearInterval(videoTimerInterval);
    }
}

function updateVideoTimer() {
    const timer = document.getElementById('video-timer');
    if (!timer) return;
    const now = Date.now();
    const diff = now - videoStartTime;
    const mins = Math.floor(diff / 60000).toString().padStart(2, '0');
    const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    timer.textContent = `${mins}:${secs}`;
}

function clearVideoRecording() {
    window.recordedVideoFile = null;
    document.getElementById('video-result-container').style.display = 'none';
    document.getElementById('video-playback').src = '';
    log('Gravação removida.', 'info');
}

// ============================================
// PREVIEW FUNCTIONS
// ============================================

function previewAudio(input) {
    const file = input.files[0];
    const container = document.getElementById('audio-preview-container');

    // Clear any previous recording if a file is manually picked
    window.recordedAudioFile = null;

    if (file) {
        document.getElementById('audio-file-name').textContent = file.name;
        document.getElementById('audio-file-info').textContent = `${(file.size / 1024).toFixed(2)} KB • ${file.type}`;

        const audioPlayer = document.getElementById('audio-preview');
        audioPlayer.src = URL.createObjectURL(file);

        container.style.display = 'block';
        log(`Áudio selecionado: ${file.name}`, 'success');
    } else {
        container.style.display = 'none';
    }
}

function previewMedia(input) {
    const file = input.files[0];
    const container = document.getElementById('media-preview-container');
    const previewContent = document.getElementById('media-preview-content');
    const typeIcon = document.getElementById('media-type-icon');

    if (file) {
        document.getElementById('media-file-name').textContent = file.name;
        document.getElementById('media-file-info').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type}`;

        previewContent.innerHTML = '';

        if (file.type.startsWith('image/')) {
            typeIcon.textContent = '🖼️';
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '8px';
            previewContent.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            typeIcon.textContent = '🎬';
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            video.style.maxWidth = '100%';
            video.style.maxHeight = '200px';
            video.style.borderRadius = '8px';
            previewContent.appendChild(video);
        } else {
            typeIcon.textContent = '📄';
            previewContent.innerHTML = '<div style="padding: 20px; color: var(--text-secondary);">Documento sem preview</div>';
        }

        container.style.display = 'block';
        log(`Mídia selecionada: ${file.name}`, 'success');
    } else {
        container.style.display = 'none';
    }
}

function toggleAudioSource() {
    const url = document.getElementById('audio-url').value.trim();
    const fileInput = document.getElementById('audio-file');
    const container = document.getElementById('audio-preview-container');

    if (url) {
        fileInput.disabled = true;
        container.style.display = 'none';
        log('Modo URL de áudio ativado', 'info');
    } else {
        fileInput.disabled = false;
    }
}

function toggleMediaSource() {
    const url = document.getElementById('media-url').value.trim();
    const fileInput = document.getElementById('media-file');
    const container = document.getElementById('media-preview-container');

    if (url) {
        fileInput.disabled = true;
        container.style.display = 'none';
        log('Modo URL de mídia ativado', 'info');
    } else {
        fileInput.disabled = false;
    }
}

// ============================================
// TARGET LIST HANDLING
// ============================================

function updateCount() {
    const text = document.getElementById('target-list').value;
    const jids = extractJids(text);
    document.getElementById('target-count').innerText = `${jids.length} destinatários identificados`;
}

function extractChannelInviteLinks(text) {
    if (!text) return [];
    const matches = String(text).match(/(?:https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[A-Za-z0-9]+(?:[^\s,;]*)?|whatsapp:\/\/channel\/[A-Za-z0-9]+)/gi) || [];
    const clean = matches
        .map(link => String(link).trim().replace(/[),.;]+$/g, ''))
        .filter(Boolean);
    return Array.from(new Set(clean));
}

function extractJids(text) {
    if (!text) return [];
    const found = new Set();
    const normalizedText = String(text)
        .replace(/@lid\s+(\d{10,25})/gi, '$1@lid')
        .replace(/\blid\s*[:\-]?\s*(\d{10,25})/gi, '$1@lid');

    // 1. Regex for full JIDs (case insensitive, replaces c.us with s.whatsapp.net)
    const jidRegex = /([a-zA-Z0-9.\-_]+@(g\.us|s\.whatsapp\.net|newsletter|c\.us|lid))/gi;
    let match;
    while ((match = jidRegex.exec(normalizedText)) !== null) {
        found.add(match[0].toLowerCase().replace('@c.us', '@s.whatsapp.net'));
    }

    // 2. Extraction of phone numbers from messy text
    // Split by common delimiters and clean up
    const parts = normalizedText.split(/[\s,;:\n\r\t|]+/);
    parts.forEach(part => {
        const digits = part.replace(/[^0-9]/g, '');

        // Brazilian phones only (avoids LID IDs and other non-phone numeric identifiers)
        // Accepted:
        // - local BR with DDD: 10 or 11 digits (auto-prefix 55)
        // - E164 BR: 55 + DDD + number => 12 or 13 digits
        if (digits.length === 10 || digits.length === 11 || (digits.startsWith('55') && (digits.length === 12 || digits.length === 13))) {
            let processed = digits;
            // Brazil auto-55
            if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
                processed = '55' + digits;
            }
            found.add(processed + '@s.whatsapp.net');
        }
        // Potential Group ID (usually 18+ digits)
        else if (digits.length > 15 && digits.length <= 25) {
            found.add(digits + '@g.us');
        }
    });

    return Array.from(found);
}

async function resolveChannelLinksToJids(links) {
    if (!Array.isArray(links) || links.length === 0) {
        return { resolved: [], unresolved: [] };
    }

    try {
        const res = await fetch('/api/whatsmiau2/channels/resolve-links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                instance: INSTANCE_NAME,
                links
            })
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || payload.success === false) {
            throw new Error(payload.error || `Falha ao resolver links (${res.status})`);
        }
        return {
            resolved: Array.isArray(payload.resolved) ? payload.resolved : [],
            unresolved: Array.isArray(payload.unresolved) ? payload.unresolved : []
        };
    } catch (err) {
        log(`⚠️ Não foi possível resolver links de canal: ${err.message}`, 'warning');
        return { resolved: [], unresolved: links.map(link => ({ link, reason: err.message })) };
    }
}

async function normalizeTargetListInput() {
    const inputEl = document.getElementById('target-list');
    const rawText = inputEl?.value || '';
    const baseJids = extractJids(rawText);
    const channelLinks = extractChannelInviteLinks(rawText);
    const finalSet = new Set(baseJids);

    if (channelLinks.length > 0) {
        log(`Detectados ${channelLinks.length} link(s) de canal. Tentando converter para @newsletter...`, 'info');
        const { resolved, unresolved } = await resolveChannelLinksToJids(channelLinks);

        resolved.forEach(item => {
            if (item?.jid && String(item.jid).endsWith('@newsletter')) {
                finalSet.add(String(item.jid).toLowerCase());
            }
        });

        if (resolved.length > 0) {
            log(`✅ ${resolved.length} link(s) de canal convertidos para JID @newsletter.`, 'success');
        }
        if (unresolved.length > 0) {
            unresolved.forEach(item => {
                log(`⚠️ Canal não resolvido: ${item.link} (${item.reason || 'sem detalhe'})`, 'warning');
            });
            log('Dica: siga o canal na instância e use o JID @newsletter listado em /channels ou /exportar-contatos.', 'info');
        }
    }

    const normalized = Array.from(finalSet);
    if (inputEl) inputEl.value = normalized.join('\n');
    updateCount();
    return normalized;
}

async function cleanList() {
    window.recordedAudioFile = null; // Clear recording cache
    const jids = await normalizeTargetListInput();
    if (jids.length > 0) {
        log('Lista limpa e formatada.', 'success');
    } else {
        log('Nenhum JID válido encontrado para formatar.', 'warning');
    }
}

// ============================================
// GROUP SELECTOR
// ============================================

async function openGroupSelector() {
    if (!groupModal) return;

    const container = document.getElementById('group-list-container');
    groupModal.show();
    container.innerHTML = '<div class="text-center py-4">Carregando...</div>';

    // Helper to render groups
    const renderGroups = (groups) => {
        container.innerHTML = '';
        if (groups.length === 0) {
            container.innerHTML = '<div class="p-3 text-center text-muted">Nenhum grupo encontrado.</div>';
            return;
        }

        // Select All Header
        const selectAllDiv = document.createElement('div');
        selectAllDiv.className = 'form-check p-3 border-bottom bg-light';
        selectAllDiv.innerHTML = `
            <input class="form-check-input" type="checkbox" id="select-all-groups">
            <label class="form-check-label fw-bold" for="select-all-groups">Selecionar Todos os Grupos (${groups.length})</label>
        `;
        selectAllDiv.querySelector('#select-all-groups').onclick = (e) => {
            const checked = e.target.checked;
            container.querySelectorAll('.group-checkbox').forEach(cb => cb.checked = checked);
        };
        container.appendChild(selectAllDiv);

        groups.forEach(g => {
            const item = document.createElement('div');
            item.className = 'form-check p-3 border-bottom';
            const checkbox = document.createElement('input');
            checkbox.className = 'form-check-input group-checkbox';
            checkbox.type = 'checkbox';
            checkbox.value = g.id;
            checkbox.id = `group-${g.id}`;
            checkbox.dataset.name = g.subject || 'Sem Nome';
            const label = document.createElement('label');
            label.className = 'form-check-label w-100';
            label.htmlFor = `group-${g.id}`;
            label.textContent = g.subject || 'Sem Nome';
            item.appendChild(checkbox);
            item.appendChild(label);
            container.appendChild(item);
        });
    };

    try {
        const response = await fetch(`/v1/group/list/${INSTANCE_NAME}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText || 'Falha na resposta do servidor'}`);
        }

        const json = await response.json();

        // Normalize data (some endpoints return array directly, some { data: [] })
        const groups = Array.isArray(json) ? json : (json.data || []);

        // Save to Cache
        localStorage.setItem('cachedGroups', JSON.stringify(groups));
        localStorage.setItem('cachedGroupsTime', Date.now());

        renderGroups(groups);

    } catch (err) {
        // Fallback to Cache
        const cached = localStorage.getItem('cachedGroups');
        if (cached) {
            const groups = JSON.parse(cached);
            renderGroups(groups);
            const msg = err.message.includes('429')
                ? '⚠️ WhatsApp sobrecarregado (429). Exibindo lista salva (Cache).'
                : `⚠️ Erro de conexão: ${err.message}. Exibindo cache local.`;

            // Show alert inside modal
            const alert = document.createElement('div');
            alert.className = 'alert alert-warning m-3 small';
            alert.innerText = msg;
            container.insertBefore(alert, container.firstChild);
            log(msg, 'warning');
        } else {
            const errorMsg = err.message.includes('429')
                ? '❌ WhatsApp limitou as requisições (Erro 429). Aguarde alguns minutos.'
                : `Erro: ${err.message}`;
            container.innerHTML = `<div class="alert alert-danger m-3">${errorMsg}</div>`;
            log(errorMsg, 'error');
        }
    }
}

// ============================================
// FILE UPLOAD HANDLERS
// ============================================

// Include SheetJS via CDN dynamically if not present
if (!document.querySelector('script[src*="xlsx"]')) {
    const script = document.createElement('script');
    script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
    document.head.appendChild(script);
}

function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'csv') {
        readSpreadsheet(file, 'target-list');
    } else if (fileType === 'txt') {
        readTextFile(file, 'target-list');
    } else {
        alert('Formato não suportado. Use .txt, .csv, .xls ou .xlsx');
    }
    // Reset input
    input.value = '';
}

function handleIgFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'csv') {
        readSpreadsheet(file, 'ig-input-list');
    } else if (fileType === 'txt') {
        readTextFile(file, 'ig-input-list');
    } else {
        alert('Formato não suportado. Use .txt, .csv, .xls ou .xlsx');
    }
    // Reset input
    input.value = '';
}

function readTextFile(file, targetElementId) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        appendToList(targetElementId, text);
    };
    reader.readAsText(file);
}

function readSpreadsheet(file, targetElementId) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Assume first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON with headers to detect columns
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // defval ensures empty cells don't break row structure

        let extractedValues = [];
        const isIgImport = targetElementId === 'ig-input-list';
        const isDisparador = targetElementId === 'target-list';

        if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            const keys = Object.keys(firstRow);

            if (isIgImport) {
                // --- OSINT IMPORT LOGIC (IDs, Usernames) ---
                // Priorities: "Instagram ID", "pk", "id", "Username", "user"
                const idKey = keys.find(k => ['instagram id', 'pk', 'id', 'user id', 'user_id', 'pk_id'].includes(k.toLowerCase().trim()));
                const userKey = keys.find(k => ['username', 'usuario', 'user', 'login'].includes(k.toLowerCase().trim()));

                if (idKey || userKey) {
                    jsonData.forEach(row => {
                        let val = row[idKey];
                        if (!val && userKey) val = row[userKey];
                        if (val) extractedValues.push(val.toString().trim());
                    });
                    log(`Importando OSINT: Coluna detectada [${idKey || userKey}]`, 'info');
                } else {
                    // Fallback: First column
                    jsonData.forEach(row => {
                        const vals = Object.values(row);
                        if (vals.length > 0) extractedValues.push(vals[0].toString().trim());
                    });
                }
            } else if (isDisparador) {
                // --- DISPARADOR IMPORT LOGIC (Phones, Whatsapp) ---
                // Priorities: "Phone", "Whatsapp", "Mobile", "Tel", "Celular"
                const phoneKey = keys.find(k =>
                    ['phone', 'phone number', 'whatsapp', 'mobile', 'celular', 'telefone', 'tel', 'contato', 'numero'].includes(k.toLowerCase().trim())
                );

                if (phoneKey) {
                    jsonData.forEach(row => {
                        let val = row[phoneKey];
                        if (val) {
                            // Clean number: remove non-digits
                            const cleaned = val.toString().replace(/\D/g, '');
                            if (cleaned.length >= 8) extractedValues.push(cleaned);
                        }
                    });
                    log(`Importando Disparador: Coluna detectada [${phoneKey}]`, 'info');
                } else {
                    // Fallback: search for any column that looks like phone numbers
                    // or just take the first one and clean it
                    jsonData.forEach(row => {
                        const vals = Object.values(row);
                        // Try to find a value that looks like a phone in the row
                        const phoneVal = vals.find(v => v && v.toString().replace(/\D/g, '').length >= 10);
                        if (phoneVal) {
                            extractedValues.push(phoneVal.toString().replace(/\D/g, ''));
                        } else if (vals.length > 0) {
                            // Last resort: first column, clean it
                            const v = vals[0];
                            if (v) extractedValues.push(v.toString().replace(/\D/g, ''));
                        }
                    });
                }
            }
        }

        // Fallback for empty JSON or weird formats (plain array)
        if (extractedValues.length === 0) {
            const jsonArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            jsonArray.forEach(row => {
                row.forEach(cell => {
                    if (cell) {
                        const val = cell.toString().trim();
                        // Minimal cleaning based on target
                        if (isDisparador) {
                            const nums = val.replace(/\D/g, '');
                            if (nums.length > 5) extractedValues.push(nums);
                        } else {
                            if (!val.includes('http')) extractedValues.push(val);
                        }
                    }
                });
            });
        }

        // Final cleanup & dedup
        extractedValues = [...new Set(extractedValues)]; // Remove duplicates
        extractedValues = extractedValues.filter(v => v.length > 0);

        if (extractedValues.length > 0) {
            appendToList(targetElementId, extractedValues.join('\n'));
        } else {
            alert('Nenhum dado válido encontrado para importação.\nVerifique se a planilha tem cabeçalhos como "Phone", "ID" ou "Username".');
        }
    };
    reader.readAsArrayBuffer(file);
}

function appendToList(elementId, newText) {
    const textarea = document.getElementById(elementId);
    const existing = textarea.value.trim();
    const separator = existing.length > 0 ? '\n' : '';
    textarea.value = existing + separator + newText.trim();

    // Trigger update events
    if (elementId === 'target-list') updateCount();
    if (elementId === 'ig-input-list') {
        const count = textarea.value.split('\n').filter(l => l.trim()).length;
        document.getElementById('ig-count').innerText = `${count} itens`;
    }

    log(`Importação concluída para ${elementId}.`, 'success');
}

function addSelectedGroups() {
    const container = document.getElementById('group-list-container');
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');

    if (checkboxes.length === 0) {
        alert('Selecione pelo menos um grupo.');
        return;
    }

    let newText = '';
    checkboxes.forEach(cb => {
        newText += `${cb.dataset.name}\n${cb.value}\n\n`;
    });

    const targetList = document.getElementById('target-list');
    const currentVal = targetList.value.trim();
    targetList.value = currentVal ? (currentVal + '\n\n' + newText) : newText;

    updateCount();
    groupModal.hide();
    log(`${checkboxes.length} grupos adicionados à lista`, 'success');
}

// ============================================
// FILE IMPORT HANDLERS
// ============================================

async function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    log(`Lendo arquivo: ${file.name}...`, 'info');

    try {
        const data = await file.arrayBuffer();
        // Use SheetJS to read file
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to text to extract JIDs
        const textContent = XLSX.utils.sheet_to_csv(worksheet); // sheet_to_csv is the standard SheetJS function

        const extracted = extractJids(textContent);

        if (extracted.length > 0) {
            const currentVal = document.getElementById('target-list').value;
            const newVal = extracted.join('\n');
            document.getElementById('target-list').value = currentVal ? (currentVal + '\n' + newVal) : newVal;

            updateCount();
            log(`✅ ${extracted.length} contatos importados de ${file.name}`, 'success');
        } else {
            log(`⚠️ Nenhum contato válido encontrado em ${file.name}`, 'warning');
        }

    } catch (e) {
        log(`❌ Erro ao ler arquivo: ${e.message}`, 'error');
        console.error(e);
    }

    // Reset input
    input.value = '';
}

async function importFromGoogle() {
    const url = prompt("Insira o Link Público do Google Sheets:\n(O arquivo deve estar visível para 'Qualquer pessoa com o link')");
    if (!url) return;

    // Convert /edit URL to /export?format=csv
    let csvUrl = url;
    if (url.includes('docs.google.com/spreadsheets')) {
        // Extract ID
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
            csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
    }

    log(`Baixando planilha do Google...`, 'info');

    try {
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const text = await response.text();
        const extracted = extractJids(text);

        if (extracted.length > 0) {
            const currentVal = document.getElementById('target-list').value;
            const newVal = extracted.join('\n');
            document.getElementById('target-list').value = currentVal ? (currentVal + '\n' + newVal) : newVal;

            updateCount();
            log(`✅ ${extracted.length} contatos importados do Google Sheets`, 'success');
        } else {
            log(`⚠️ Nenhum contato encontrado na planilha.`, 'warning');
        }

    } catch (e) {
        log(`❌ Erro ao importar do Google: ${e.message}`, 'error');
        if (e.message.includes('Cors') || e.message.includes('Failed to fetch')) {
            log(`Dica: Verifique se a planilha está 'Pública' (Arquivo > Compartilhar > Qualquer pessoa com link)`, 'info');
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function log(msg, type = 'info') {
    const consoleDiv = document.getElementById('log-console');
    const time = new Date().toLocaleTimeString();
    const el = document.createElement('div');
    el.className = `log-${type}`;
    el.innerText = `[${time}] ${msg}`;
    consoleDiv.appendChild(el);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function toggleRunning(running) {
    isRunning = running;
    document.getElementById('btn-start').style.display = running ? 'none' : 'block';
    document.getElementById('btn-stop').style.display = running ? 'block' : 'none';
    document.getElementById('target-list').disabled = running;
}

function stopDispatch() {
    if (isRunning) {
        shouldStop = true;
        log('Parando disparo... Aguarde o último envio.', 'warning');
    }
}

function cleanBase64(base64) {
    if (!base64) return null;
    // Remove data:audio/mpeg;base64, prefix if exists
    if (base64.includes(',')) {
        return base64.split(',')[1];
    }
    return base64;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// ============================================
// MAIN DISPATCH FUNCTION
// ============================================

async function startDispatch() {
    await checkInstanceStatus();

    if (!INSTANCE_NAME) {
        alert('Selecione uma instância antes de disparar.');
        return;
    }
    if (!INSTANCE_READY) {
        alert(`A instância "${INSTANCE_NAME}" não está conectada. Conecte primeiro em Conexões.`);
        log(`❌ Instância "${INSTANCE_NAME}" não conectada para disparo.`, 'error');
        return;
    }

    const delaySec = parseInt(document.getElementById('delay-seconds').value) || 10;
    const jids = await normalizeTargetListInput();

    // Validation
    if (currentTab === 'text') {
        const msg = document.getElementById('message-content').value;
        if (!msg.trim()) return alert('Digite a mensagem de texto.');
    } else if (currentTab === 'audio') {
        const file = document.getElementById('audio-file').files[0];
        const url = document.getElementById('audio-url').value.trim();
        if (!file && !url && !window.recordedAudioFile) return alert('Selecione um arquivo de áudio ou grave uma mensagem de voz.');
    } else if (currentTab === 'video') {
        if (!window.recordedVideoFile) return alert('Grave um vídeo para enviar.');
    } else if (currentTab === 'media') {
        const file = document.getElementById('media-file').files[0];
        const url = document.getElementById('media-url').value.trim();
        if (!file && !url) return alert('Selecione um arquivo de mídia ou insira uma URL.');
    }

    if (jids.length === 0) return alert('Nenhum destinatário encontrado.');

    if (!confirm(`Confirmar envio para ${jids.length} destinatários? Modo: ${currentTab.toUpperCase()}`)) return;

    // Prepare payload
    let base64File = null;
    let mediaUrl = null;
    let fileName = null;
    let mimeType = null;
    let caption = '';

    if (currentTab === 'audio') {
        const audioUrl = document.getElementById('audio-url').value.trim();

        if (audioUrl) {
            mediaUrl = audioUrl;
            log(`Usando URL de áudio: ${audioUrl}`, 'info');
        } else {
            log('Carregando áudio...', 'info');
            try {
                // Priority: Recorded Audio > Uploaded File
                const file = window.recordedAudioFile || document.getElementById('audio-file').files[0];
                if (!file) return log('Erro: Nenhum áudio gravado ou selecionado.', 'error');

                base64File = await fileToBase64(file);
                log(`Áudio carregado: ${file.name} (${formatFileSize(file.size)})`, 'success');
            } catch (e) {
                return log('Erro ao ler áudio: ' + e.message, 'error');
            }
        }
    } else if (currentTab === 'video') {
        try {
            const file = window.recordedVideoFile;
            fileName = file.name;
            mimeType = 'video/mp4';
            base64File = await fileToBase64(file);
            caption = document.getElementById('video-caption').value || '';
            log(`Vídeo carregado: ${file.name} (${formatFileSize(file.size)})`, 'success');
        } catch (e) {
            return log('Erro ao preparar vídeo: ' + e.message, 'error');
        }
    } else if (currentTab === 'media') {
        const mediaUrlValue = document.getElementById('media-url').value.trim();
        caption = document.getElementById('media-caption').value || '';

        if (mediaUrlValue) {
            mediaUrl = mediaUrlValue;
            const ext = mediaUrlValue.split('.').pop().toLowerCase().split('?')[0];
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                mimeType = 'image/' + (ext === 'jpg' ? 'jpeg' : ext);
            } else if (['mp4', 'webm', 'mov'].includes(ext)) {
                mimeType = 'video/' + ext;
            } else {
                mimeType = 'application/octet-stream';
            }
            fileName = mediaUrlValue.split('/').pop().split('?')[0];
            log(`Usando URL de mídia: ${fileName}`, 'info');
        } else {
            log('Carregando mídia...', 'info');
            try {
                const file = document.getElementById('media-file').files[0];
                fileName = file.name;
                mimeType = file.type;
                base64File = await fileToBase64(file);
                log(`Mídia carregada: ${file.name} (${formatFileSize(file.size)})`, 'success');
            } catch (e) {
                return log('Erro ao ler mídia: ' + e.message, 'error');
            }
        }
    }

    shouldStop = false;
    toggleRunning(true);
    log(`Iniciando disparo... Delay: ${delaySec}s | Destinatários: ${jids.length}`, 'info');

    const pBar = document.getElementById('progress-bar');
    document.getElementById('progress-text').innerText = `0/${jids.length}`;
    pBar.style.width = '0%';

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < jids.length; i++) {
        if (shouldStop) {
            log('Disparo interrompido pelo usuário.', 'warning');
            break;
        }

        const jid = jids[i];
        document.getElementById('progress-text').innerText = `${i + 1}/${jids.length}`;
        pBar.style.width = `${((i + 1) / jids.length) * 100}%`;
        document.getElementById('status-text').innerText = `Enviando para ${jid.split('@')[0]}...`;

        try {
            let endpoint = '';
            let body = { number: jid.includes('@') ? jid : `${jid}@s.whatsapp.net` };

            if (currentTab === 'text') {
                endpoint = `/v1/message/sendText/${INSTANCE_NAME}`;
                body.textMessage = { text: document.getElementById('message-content').value };
            }
            else if (currentTab === 'audio') {
                endpoint = `/v1/message/sendWhatsAppAudio/${INSTANCE_NAME}`;
                body.audioMessage = {
                    audio: mediaUrl || cleanBase64(base64File),
                    ptt: true
                };
            }
            else if (currentTab === 'media') {
                endpoint = `/v1/message/sendMedia/${INSTANCE_NAME}`;
                body.mediaMessage = {
                    media: mediaUrl || cleanBase64(base64File),
                    mediatype: mimeType.startsWith('image') ? 'image' : (mimeType.startsWith('video') ? 'video' : 'document'),
                    mimetype: mimeType,
                    fileName: fileName,
                    caption: caption
                };
            }
            else if (currentTab === 'video') {
                endpoint = `/v1/message/sendMedia/${INSTANCE_NAME}`;
                body.mediaMessage = {
                    media: cleanBase64(base64File),
                    mediatype: 'video',
                    mimetype: 'video/mp4',
                    fileName: fileName,
                    caption: caption
                };
            }

            const timeoutMs = (currentTab === 'text') ? 30000 : 120000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            log(`📤 Enviando ${currentTab} para ${jid.split('@')[0]}...`, 'info');

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const rawText = await res.text();
            let json = {};
            try {
                json = rawText ? JSON.parse(rawText) : {};
            } catch {
                json = { error: rawText || `HTTP ${res.status}` };
            }

            if (res.ok && json.success !== false) {
                log(`✅ Enviado para ${jid.split('@')[0]}`, 'success');
                successCount++;
            } else {
                const errMsg = json.error || json.message || json.details?.message || rawText || `HTTP ${res.status}`;
                log(`❌ Erro ${jid.split('@')[0]}: ${errMsg}`, 'error');
                errorCount++;
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                log(`⏰ Timeout ${jid.split('@')[0]}: Requisição demorou mais de 2 minutos`, 'error');
            } else {
                log(`❌ Falha conexão ${jid.split('@')[0]}: ${err.message}`, 'error');
            }
            errorCount++;
        }

        if (i < jids.length - 1 && !shouldStop) {
            log(`⏳ Aguardando ${delaySec}s...`, 'info');
            await new Promise(r => setTimeout(r, delaySec * 1000));
        }
    }

    log(`🏁 Finalizado! Sucesso: ${successCount} | Erros: ${errorCount}`, successCount > 0 ? 'success' : 'warning');
    document.getElementById('status-text').innerText = `Finalizado - ${successCount} sucesso, ${errorCount} erros`;
    toggleRunning(false);
}
