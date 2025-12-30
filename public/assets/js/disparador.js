// ============================================
// WHATSMIAU2 DISPARADOR - JAVASCRIPT
// ============================================

let isRunning = false;
let shouldStop = false;
let currentTab = 'text';
let groupModal;

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

    log('[Sistema] Disparador carregado e pronto.', 'success');
});

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
    document.getElementById(`section-${tab}`).style.display = 'block';

    log(`Modo alterado para: ${tab.toUpperCase()}`, 'info');
}

// ============================================
// PREVIEW FUNCTIONS
// ============================================

function previewAudio(input) {
    const file = input.files[0];
    const container = document.getElementById('audio-preview-container');

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

function extractJids(text) {
    const found = [];
    const jidRegex = /([0-9-]+@(g\.us|s\.whatsapp\.net|newsletter))/gi;
    const phoneRegex = /\b55[0-9]{10,11}\b/g;

    let match;
    while ((match = jidRegex.exec(text)) !== null) {
        if (!found.includes(match[0])) found.push(match[0]);
    }

    if (found.length === 0) {
        while ((match = phoneRegex.exec(text)) !== null) {
            const num = match[0] + '@s.whatsapp.net';
            if (!found.includes(num)) found.push(num);
        }
    }

    return found;
}

function cleanList() {
    const jids = extractJids(document.getElementById('target-list').value);
    if (jids.length > 0) {
        document.getElementById('target-list').value = jids.join('\n');
        updateCount();
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
        groups.forEach(g => {
            const item = document.createElement('div');
            item.className = 'form-check p-3 border-bottom';
            const checkbox = document.createElement('input');
            checkbox.className = 'form-check-input';
            checkbox.type = 'checkbox';
            checkbox.value = g.id;
            checkbox.id = `group-${g.id}`;
            checkbox.dataset.name = g.subject || 'Sem Nome';
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `group-${g.id}`;
            label.textContent = g.subject || 'Sem Nome';
            item.appendChild(checkbox);
            item.appendChild(label);
            container.appendChild(item);
        });
    };

    try {
        const response = await fetch('/api/group/list/minha-instancia');

        if (response.status === 429) {
            throw new Error('Rate Limit (429)');
        }

        const json = await response.json();

        if (!json.success && !json.data) throw new Error(json.error || 'Erro ao carregar grupos');

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
        const textContent = XLSX.utils.sheet_to_txt(worksheet); // This handles CSV and Excel

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
    const delaySec = parseInt(document.getElementById('delay-seconds').value) || 10;
    const jids = extractJids(document.getElementById('target-list').value);

    // Validation
    if (currentTab === 'text') {
        const msg = document.getElementById('message-content').value;
        if (!msg.trim()) return alert('Digite a mensagem de texto.');
    } else if (currentTab === 'audio') {
        const file = document.getElementById('audio-file').files[0];
        const url = document.getElementById('audio-url').value.trim();
        if (!file && !url) return alert('Selecione um arquivo de áudio ou insira uma URL.');
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
                const file = document.getElementById('audio-file').files[0];
                base64File = await fileToBase64(file);
                log(`Áudio carregado: ${file.name} (${formatFileSize(file.size)})`, 'success');
            } catch (e) {
                return log('Erro ao ler áudio: ' + e.message, 'error');
            }
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
            let body = { number: jid };

            if (currentTab === 'text') {
                endpoint = '/api/whatsmiau2/send-text';
                body.text = document.getElementById('message-content').value;
            }
            else if (currentTab === 'audio') {
                endpoint = '/api/whatsmiau2/send-audio';
                body.audio = mediaUrl || base64File;
            }
            else if (currentTab === 'media') {
                endpoint = '/api/whatsmiau2/send-media';
                body.media = mediaUrl || base64File;
                body.mediatype = mimeType.startsWith('image') ? 'image' : (mimeType.startsWith('video') ? 'video' : 'document');
                body.mimetype = mimeType;
                body.fileName = fileName;
                body.caption = caption;
            }

            const timeoutMs = (currentTab === 'text') ? 30000 : 120000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            log(`📤 Enviando ${currentTab} para ${jid.split('@')[0]}...`, 'info');

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const json = await res.json();

            if (json.success) {
                log(`✅ Enviado para ${jid.split('@')[0]}`, 'success');
                successCount++;
            } else {
                log(`❌ Erro ${jid.split('@')[0]}: ${json.error}`, 'error');
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
