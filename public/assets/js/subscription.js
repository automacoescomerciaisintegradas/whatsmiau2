document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        await loadSubscriptionStatus(token);
        await loadPlans(token);
    } catch (error) {
        console.error('Error loading subscription data:', error);
    }
});

async function loadSubscriptionStatus(token) {
    const alertArea = document.getElementById('subscription-alert-area');

    try {
        const response = await fetch('/v1/subscription/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/login.html';
            return;
        }

        const data = await response.json();

        // Check if no subscription
        if (response.status === 404 || !data || !data.status || data.status === 'none' || data.status === 'expired') {
            alertArea.innerHTML = `
                <div class="alert alert-warning alert-subscription fade show" role="alert">
                    <h4 class="alert-heading"><i class="fas fa-exclamation-circle me-2"></i> Assinatura não encontrada</h4>
                    <p class="mb-0">Você ainda não possui uma assinatura ativa. Escolha um dos planos abaixo para desbloquear todos os recursos.</p>
                </div>
            `;
        } else if (data.status === 'active') {
            // If active, maybe show a small success banner or redirect to Dashboard if we want strictly "Plans Page only for buying".
            // But user might want to manage/cancel.
            const nextBilling = data.next_billing_date ? new Date(data.next_billing_date).toLocaleDateString() : 'N/A';
            alertArea.innerHTML = `
                <div class="alert alert-success alert-active-subscription shadow-sm rounded-4 border-0" role="alert">
                    <div class="active-subscription-top">
                        <div class="active-subscription-icon-wrap">
                            <i class="fas fa-check-circle text-success fs-4"></i>
                        </div>
                        <div class="active-subscription-copy">
                            <h5 class="alert-heading mb-1">Assinatura ativa: ${data.plan ? data.plan.name : 'Premium'}</h5>
                            <p class="mb-0 text-muted">Próxima renovação em: <strong>${nextBilling}</strong></p>
                        </div>
                    </div>
                    <div class="active-subscription-cta">
                        <button class="btn btn-success btn-active-dashboard" onclick="window.location.href='/connections'">Ir para dashboard</button>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.error("Error loading status:", e);
    }
}

async function loadPlans(token) {
    const plansContainer = document.getElementById('plans-container');
    try {
        const response = await fetch('/v1/plans', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Resposta do endpoint /v1/plans:', response.status); // Debug log

        if (!response.ok) {
            plansContainer.innerHTML = '<div class="col-12 text-center text-danger">Erro ao carregar planos.</div>';
            return;
        }

        const plans = await response.json();
        console.log('Planos recebidos:', plans); // Debug log

        if (plans.length === 0) {
            plansContainer.innerHTML = '<div class="col-12 text-center text-muted">Nenhum plano disponível no momento.</div>';
            return;
        }

        const sortedPlans = [...plans].sort((a, b) => {
            const isAFree = Number(a.price || 0) <= 0;
            const isBFree = Number(b.price || 0) <= 0;
            if (isAFree && !isBFree) return -1;
            if (!isAFree && isBFree) return 1;
            return Number(a.price || 0) - Number(b.price || 0);
        });

        plansContainer.innerHTML = sortedPlans.map(plan => {
            console.log('Processando plano:', plan); // Debug log
            let features = [];
            try {
                features = JSON.parse(plan.features || '[]');
            } catch (e) {
                if (plan.features) features = [plan.features];
            }
            if (!Array.isArray(features)) features = [];

            // Logic to customize appearance based on Plan Name
            let badgeHtml = '';
            let btnText = 'Testar Agora';
            let popularClass = '';
            const isFreePlan = Number(plan.price || 0) <= 0;

            if (isFreePlan) {
                badgeHtml = '<div class="badge-endpoints" style="background: #10b981;">Teste Grátis</div>';
                btnText = 'Ativar Teste 3h';
                popularClass = 'border-primary';
            }

            if (plan.name.toLowerCase().includes('business')) {
                badgeHtml = '<div class="badge-endpoints">118 Endpoints</div>';
                popularClass = 'border-primary shadow-lg'; // Highlight Business
                btnText = 'Testar Agora';
            } else if (plan.name.toLowerCase().includes('start')) {
                badgeHtml = '<div class="badge-endpoints" style="background: #ef4444;">32 Endpoints</div>';
            }

            // Duration format
            let period = '/mês';
            if (isFreePlan) {
                period = '/3h';
            } else if (plan.duration_days !== 30) {
                period = `/${plan.duration_days} dias`;
            }

            // Verificar se o ID do plano está definido
            const planId = plan.id || plan.ID || plan.Id || 0;
            console.log('ID do plano:', planId); // Debug log

            return `
            <div class="pricing-card ${popularClass}">
                ${badgeHtml}
                <h3 class="pricing-title">${plan.name}</h3>
                <div class="pricing-price">R$ ${plan.price}<span class="pricing-period">${period}</span></div>
                <div class="pricing-instances">${plan.description || 'Plano mensal'}</div>

                <ul class="features-list">
                    ${features.map(f => {
                        // Verificar se é uma feature de documentação para formatar diferente
                        if (f.includes('Documentação da Minha API')) {
                            return `<li><i class="fas fa-book"></i> ${f}
                                <div class="documentation-links mt-2">
                                    <div class="doc-option">
                                        <a href="http://localhost:3002/docs" target="_blank" class="doc-link">
                                            <i class="fas fa-book"></i> Documentação da API
                                        </a>
                                    </div>
                                    <div class="doc-option">
                                        <a href="https://swagger.io" target="_blank" class="doc-link">
                                            <i class="fas fa-swagger"></i> Swagger
                                        </a>
                                    </div>
                                    <div class="doc-option">
                                        <a href="https://pkg.go.dev/github.com/go-whatsapp/whatsmeow" target="_blank" class="doc-link">
                                            <i class="fas fa-book"></i> Whatsmeow Docs
                                        </a>
                                    </div>
                                </div>
                            </li>`;
                        } else {
                            return `<li><i class="fas fa-check"></i> ${f}</li>`;
                        }
                    }).join('')}
                </ul>

                <button class="btn-subscribe" onclick="subscribe(${planId}, event)" data-plan-id="${planId}" data-plan-name="${plan.name}">${btnText}</button>
                <a href="#" class="btn-secondary-action">Saibo Mais <i class="fas fa-arrow-right small ms-1"></i></a>
            </div>
        `}).join('');
    } catch (e) {
        console.error('Erro ao carregar planos:', e); // Debug log
        plansContainer.innerHTML = `<div class="col-12 text-center text-danger">Erro: ${e.message}</div>`;
    }
}

window.subscribe = async function (planId, ev) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const btn = ev?.currentTarget || ev?.target;
    const oldText = btn ? btn.innerHTML : '';

    console.log('Tentando assinar plano com ID:', planId); // Debug log

    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        btn.disabled = true;
    }

    try {
        const response = await fetch('/v1/subscription/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ plan_id: planId })
        });

        console.log('Resposta da API:', response); // Debug log

        const rawText = await response.text();
        let result = {};
        if (rawText) {
            try {
                result = JSON.parse(rawText);
            } catch (parseError) {
                if (!response.ok) {
                    throw new Error(`Resposta inválida do servidor (${response.status}): ${rawText.substring(0, 120)}`);
                }
                throw new Error(`Resposta inesperada do servidor: ${rawText.substring(0, 120)}`);
            }
        }

        if (!response.ok) {
            throw new Error(result.error || result.message || `Erro HTTP ${response.status}`);
        }

        if (result.checkout_url) {
            if (result.checkout_url === '#') {
                alert('Assinatura criada com sucesso! Redirecionando para o dashboard...');
                setTimeout(() => {
                    window.location.href = '/connections';
                }, 1200);
            } else {
                window.location.href = result.checkout_url;
            }
        } else {
            alert('Erro ao criar assinatura: ' + (result.error || result.message || `HTTP ${response.status}`));
        }
    } catch (e) {
        console.error('Erro na requisição:', e); // Debug log
        alert('Erro de conexão: ' + e.message);
    } finally {
        if (btn) {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    }
}
