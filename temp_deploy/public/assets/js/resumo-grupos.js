// ============================================
// WHATSMIAU2 RESUMO DE GRUPOS - JAVASCRIPT
// ============================================

// State
const state = {
    gruposSelecionados: [],
    todosGrupos: [],
    ranking: [],
    config: {}
};

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

    // Set today's date
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('data').value = hoje;

    // Auto-load groups on page load
    setTimeout(() => {
        carregarGrupos();
    }, 500);

    log('Sistema carregado e pronto', 'success');
});

// ============================================
// GROUP MANAGEMENT
// ============================================

async function carregarGrupos() {
    mostrarStatus('preview', 'info', '🔄 Carregando grupos...');

    try {
        const response = await fetch('/api/whatsmiau2/groups?getParticipants=true');
        const data = await response.json();

        if (!response.ok) {
            // Handle specific error cases
            if (data.details && data.details.error) {
                const errorMsg = data.details.error;

                if (errorMsg.includes('not connected')) {
                    throw new Error('A instância não está conectada ao WhatsApp. Conecte-se primeiro na página de Conexões.');
                } else if (errorMsg.includes('not found')) {
                    throw new Error('Instância não encontrada. Verifique a configuração.');
                }
            }
            throw new Error(data.error || 'Erro ao carregar grupos');
        }

        if (data.success && data.data) {
            state.todosGrupos = data.data;
            renderizarListaGrupos();
            mostrarStatus('preview', 'success', `✅ ${state.todosGrupos.length} grupos carregados`);
        } else {
            throw new Error(data.error || 'Erro ao carregar grupos');
        }
    } catch (error) {
        console.error('Erro ao carregar grupos:', error);
        mostrarStatus('preview', 'error', `❌ ${error.message}`);
    }
}

function renderizarListaGrupos() {
    const lista = document.getElementById('grupos-lista');
    lista.innerHTML = '';

    if (state.todosGrupos.length === 0) {
        lista.innerHTML = '<div class="text-center py-4 text-muted">Nenhum grupo encontrado</div>';
        return;
    }

    state.todosGrupos.forEach(grupo => {
        const isSelected = state.gruposSelecionados.some(g => g.id === grupo.id);
        const div = document.createElement('div');
        div.className = `group-option${isSelected ? ' selected' : ''}`;
        div.dataset.groupId = grupo.id;
        div.onclick = () => toggleGrupo(grupo, div);

        div.innerHTML = `
            <div class="group-checkbox">${isSelected ? '✓' : ''}</div>
            <div class="flex-grow-1">
                <div class="fw-bold">${grupo.subject || grupo.id}</div>
                <div class="small text-muted">${grupo.id}</div>
            </div>
        `;
        lista.appendChild(div);
    });

    atualizarContadorGrupos();
}

function toggleGrupo(grupo, element) {
    const index = state.gruposSelecionados.findIndex(g => g.jid === grupo.jid);

    if (index === -1) {
        state.gruposSelecionados.push(grupo);
        element.classList.add('selected');
        element.querySelector('.group-checkbox').textContent = '✓';
    } else {
        state.gruposSelecionados.splice(index, 1);
        element.classList.remove('selected');
        element.querySelector('.group-checkbox').textContent = '';
    }

    atualizarContadorGrupos();

    // Auto-update ranking when selecting a group (fetches details for the first selected group)
    if (state.gruposSelecionados.length > 0) {
        atualizarRanking();
    }
}

function selecionarTodosGrupos() {
    state.gruposSelecionados = [...state.todosGrupos];
    renderizarListaGrupos();
    mostrarStatus('preview', 'success', `✅ ${state.gruposSelecionados.length} grupos selecionados`);
}

function deselecionarTodosGrupos() {
    state.gruposSelecionados = [];
    renderizarListaGrupos();
    mostrarStatus('preview', 'info', '⬜ Seleção limpa');
}

function atualizarContadorGrupos() {
    const contador = document.getElementById('grupos-contador');
    const qtd = state.gruposSelecionados.length;
    contador.textContent = `${qtd} selecionado${qtd !== 1 ? 's' : ''}`;
}

// ============================================
// RANKING MANAGEMENT
// ============================================

async function atualizarRanking() {
    // Auto-select first group if none selected
    if (state.gruposSelecionados.length === 0 && state.todosGrupos.length > 0) {
        state.gruposSelecionados = [state.todosGrupos[0]];
        renderizarListaGrupos();
        mostrarStatus('ranking', 'info', '💡 Primeiro grupo selecionado automaticamente');
    }

    if (state.gruposSelecionados.length === 0) {
        mostrarStatus('ranking', 'warning', '⚠️ Carregue os grupos primeiro clicando em "Carregar" acima');
        return;
    }

    const grupoId = state.gruposSelecionados[0].jid;
    const grupoNome = state.gruposSelecionados[0].subject || state.gruposSelecionados[0].name || grupoId;
    mostrarStatus('ranking', 'info', `🔄 Buscando participantes de "${grupoNome}"...`);

    try {
        const response = await fetch(`/api/whatsmiau2/groups/${encodeURIComponent(grupoId)}`);
        const json = await response.json();

        if (!response.ok) {
            if (response.status === 403) {
                mostrarStatus('ranking', 'error',
                    '🚫 Acesso negado: A instância não é membro deste grupo');
                return;
            }
            throw new Error(json.error || 'Erro ao buscar dados do grupo');
        }

        if (!json.success || !json.data) {
            throw new Error(json.error || 'Resposta inválida da API');
        }

        const participants = json.data.Participants || json.data.participants || [];
        renderizarParticipantes(participants);

    } catch (error) {
        console.error('[Ranking Error]', error);
        mostrarStatus('ranking', 'error', `❌ ${error.message}`);
    }
}

// Helper to format phone numbers
function formatarTelefone(jid) {
    let number = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    if (number.length === 12 || number.length === 13) {
        if (number.startsWith('55')) {
            const ddd = number.substring(2, 4);
            const prefix = number.substring(4, number.length - 4);
            const suffix = number.substring(number.length - 4);
            return `+55 (${ddd}) ${prefix}-${suffix}`;
        }
    }
    return number;
}

function renderizarParticipantes(participants) {
    if (!participants || participants.length === 0) {
        mostrarStatus('ranking', 'warning', '⚠️ Nenhum participante encontrado');
        return;
    }

    state.ranking = participants.map(p => {
        // Try to find the best name available
        // Backend keys might be pascalCase or camelCase
        const displayName = p.DisplayName || p.displayName || '';
        const notifyName = p.Notify || p.notify || ''; // Some implementations map notify name
        const jid = p.JID || p.jid || p.id || '';
        const formattedNumber = formatarTelefone(jid);

        let nomeExibicao = formattedNumber;
        if (displayName) nomeExibicao = `${displayName} (${formattedNumber})`;
        else if (notifyName) nomeExibicao = `${notifyName} (${formattedNumber})`;

        return {
            nome: nomeExibicao,
            id: jid,
            total_mensagens: 0 // Placeholder until we have message analysis
        };
    });

    const lista = document.getElementById('ranking-lista');
    lista.innerHTML = '';

    state.ranking.forEach((p, i) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';

        let posClass = 'default';
        if (i === 0) posClass = 'gold';
        else if (i === 1) posClass = 'silver';
        else if (i === 2) posClass = 'bronze';

        item.innerHTML = `
            <div class="ranking-position ${posClass}">${i + 1}</div>
            <div class="flex-grow-1 fw-bold">${p.nome}</div>
            <div class="text-muted small">-- msgs</div>
        `;
        lista.appendChild(item);
    });

    mostrarStatus('ranking', 'success',
        `✅ ${participants.length} participantes carregados`);

    // Auto-generate preview after ranking updates
    gerarResumo();
}

// ============================================
// PREVIEW MANAGEMENT
// ============================================

function gerarResumo() {
    try {
        const dataInput = document.getElementById('data').value;
        const topRanking = document.getElementById('top-ranking').value;
        const mensagemAbertura = document.getElementById('mensagem-abertura').value;

        const now = new Date();
        const dataFormatada = now.toLocaleDateString('pt-BR');
        const horaFormatada = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const grupoNome = state.gruposSelecionados.length > 0
            ? (state.gruposSelecionados[0].subject || state.gruposSelecionados[0].name || "Grupo")
            : "Nenhum Grupo Selecionado";

        // Ranking Logic
        let rankingText = '';
        if (state.ranking && state.ranking.length > 0) {
            const topParticipants = state.ranking.slice(0, parseInt(topRanking));
            rankingText = topParticipants.map((p, i) => {
                const emojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
                const badge = emojis[i] || '•';
                return `${badge} ${p.nome}`;
            }).join('\n');
        } else {
            rankingText = "(Carregue os dados do grupo para ver o ranking)";
        }

        let preview = '';

        // Header (Exact match to N8N Workflow Prompt)
        // Minimal Header
        preview += `🤖 *${grupoNome}*\n`;
        preview += `📅 ${dataFormatada} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
        preview += `---\n\n`;

        preview += `📝 *Destaques:*\n\n\n`; // Empty space for user to paste content

        // Ranking (Crucial for user)
        preview += `🏆 *Participantes Ativos:*\n`;
        preview += `${rankingText}\n\n`;

        preview += `_Gerado por WhatsMiau2_`;

        document.getElementById('preview-texto').textContent = preview;
        mostrarStatus('preview', 'success', '✅ Modelo de resumo atualizado!');

    } catch (error) {
        console.error('Erro ao gerar resumo:', error);
        mostrarStatus('preview', 'error', '❌ Erro ao gerar preview');
    }
}

async function copiarPreview() {
    const texto = document.getElementById('preview-texto').textContent;

    try {
        await navigator.clipboard.writeText(texto);
        mostrarStatus('preview', 'success', '📋 Texto copiado!');
    } catch (error) {
        mostrarStatus('preview', 'error', '❌ Erro ao copiar');
    }
}

async function gerarAudio() {
    const texto = document.getElementById('preview-texto').textContent;

    if (!texto || texto.trim().length === 0) {
        mostrarStatus('preview', 'warning', '⚠️ Gere o resumo primeiro!');
        return;
    }
    mostrarStatus('preview', 'info', '🔊 Gerando áudio... (Isso pode demorar um pouco)');

    const voiceSelect = document.getElementById('voice-select');
    const selectedVoice = voiceSelect ? voiceSelect.value : 'female';

    // Reset audio state
    state.latestAudioUrl = null;

    // === INTELLIGENT AUDIO PARSER ===
    const rawText = texto;
    const lines = rawText.split('\n');
    let processedScript = "";

    // Create ID->Name Map
    const idMap = {};
    if (state.ranking) {
        state.ranking.forEach(p => {
            const cleanId = p.id.split('@')[0];
            // Clean name for audio (remove parentheses, emojis)
            let cleanName = p.nome.replace(/[()]/g, '').replace(/\+55\s?/, '').trim();
            // If name is just the number, mark it null so we format it nicely later
            if (cleanName.includes(cleanId)) cleanName = null;

            idMap[cleanId] = cleanName;
        });
    }

    lines.forEach(line => {
        let t = line.trim();
        if (!t) return;

        // 1. FILTER: Skip Template Placeholders
        // 1. FILTER: Skip Template Placeholders and Headers
        if (t.includes('[Título') ||
            t.includes('(Escreva aqui') ||
            t.includes('📝 Destaques') ||
            t.includes('🤖 Resumo') ||
            t.includes('Gerado por') ||
            t.includes('---')) {
            return;
        }

        // 2. ENRICH: Replace IDs with Names or "Final XXXX"
        // Match numbers with 10+ digits
        t = t.replace(/\d{10,}/g, (match) => {
            const foundName = idMap[match];
            if (foundName) return foundName;
            // If no name found, shorten it
            return `Número final ${match.slice(-4)}`;
        });

        // 3. CLEAN: Remove formatting
        t = t.replace(/\*/g, '').replace(/_/g, '');

        // Accumulate
        processedScript += t + ".\n";
    });

    if (processedScript.length < 5) processedScript = "O resumo está vazio.";

    // console.log("Script de Áudio Pré-Processado:", processedScript);

    try {
        // Send to AI Summarizer first (Gemini) to interpret interactions
        // It will return audioUrl generated from the AI summary
        const response = await fetch('/api2/whatsmiau2/generate-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: processedScript, voice: selectedVoice })
        });

        const data = await response.json();

        if (data.success && data.audioUrl) {
            const audioContainer = document.getElementById('audio-player-container');
            const audioPlayer = document.getElementById('audio-preview');

            audioPlayer.src = data.audioUrl;
            audioContainer.style.display = 'block';

            // Try to play automatically
            try { audioPlayer.play(); } catch (e) { }

            // Save for sending
            state.latestAudioUrl = data.audioUrl;

            mostrarStatus('preview', 'success', '✅ Áudio gerado com sucesso!');
        } else {
            throw new Error(data.error || 'Falha ao gerar áudio');
        }
    } catch (error) {
        console.error('Erro ao gerar áudio:', error);
        mostrarStatus('preview', 'error', `❌ ${error.message}`);
    }
}

async function enviarResumo() {
    const texto = document.getElementById('preview-texto').textContent;

    if (state.gruposSelecionados.length === 0) {
        mostrarStatus('preview', 'error', '❌ Selecione pelo menos um grupo');
        return;
    }

    const total = state.gruposSelecionados.length;
    let enviados = 0;
    let falhas = [];

    mostrarStatus('preview', 'info', `📤 Enviando para ${total} grupo(s)... (0/${total})`);

    for (const grupo of state.gruposSelecionados) {
        try {
            const response = await fetch('/api/whatsmiau2/send-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: grupo.jid, text: texto })
            });

            const data = await response.json();

            if (data.success) {

                // If we implemented text sending above, now send Audio if available
                if (state.latestAudioUrl) {
                    try {
                        mostrarStatus('preview', 'info', `📤 Enviando áudio para grupo...`);
                        const fullAudioUrl = window.location.origin + state.latestAudioUrl;

                        await fetch('/api/message/sendWhatsAppAudio/minha-instancia', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                number: grupo.jid,
                                audioMessage: {
                                    audio: fullAudioUrl,
                                    ptt: true
                                }
                            })
                        });
                        console.log("Áudio enviado para", grupo.jid);
                    } catch (audioErr) {
                        console.error("Falha ao enviar áudio:", audioErr);
                        // Don't fail the batch if audio fails
                    }
                }

                enviados++;
            } else {
                falhas.push({ destino: grupo.subject || grupo.name || grupo.jid, erro: data.error });
            }
        } catch (error) {
            falhas.push({ destino: grupo.subject || grupo.name || grupo.jid, erro: error.message });
        }

        mostrarStatus('preview', 'info',
            `📤 Enviando para ${total} grupo(s)... (${enviados + falhas.length}/${total})`);

        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    if (falhas.length === 0) {
        mostrarStatus('preview', 'success',
            `✅ Resumo enviado com sucesso para ${enviados} grupo(s)!`);
    } else if (enviados > 0) {
        mostrarStatus('preview', 'warning',
            `⚠️ Enviado para ${enviados}/${total} grupos. ${falhas.length} falhas.`);
    } else {
        mostrarStatus('preview', 'error',
            `❌ Falha ao enviar para todos os grupos.`);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function limparCampos() {
    document.getElementById('data').value = new Date().toISOString().split('T')[0];
    document.getElementById('horas').value = '24';
    document.getElementById('top-ranking').value = '5';
    document.getElementById('mensagem-abertura').value = '';
    mostrarStatus('preview', 'info', '🗑️ Campos limpos!');
}

function mostrarStatus(area, tipo, mensagem) {
    const statusEl = document.getElementById(`status-${area}`);
    if (!statusEl) return;

    const classes = {
        success: 'alert alert-success',
        error: 'alert alert-danger',
        warning: 'alert alert-warning',
        info: 'alert alert-info'
    };

    statusEl.className = classes[tipo] || classes.info;
    statusEl.innerHTML = mensagem;
    statusEl.style.display = 'block';

    if (tipo !== 'info') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

function log(msg, type = 'info') {
    console.log(`[Resumo Grupos] ${msg}`);
}
