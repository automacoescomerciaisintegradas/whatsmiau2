document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return; // Auth checks handled elsewhere

    // Check if current page is restricted
    const path = window.location.pathname;
    const restrictedPages = [
        '/disparador.html',
        '/automacao.html',
        '/crm.html',
        '/kanban.html',
        '/exportar-contatos.html',
        '/resumo-grupos.html'
    ];

    // Pages that are ALWAYS allowed (besides public ones)
    // subscription.html, index.html (dashboard is partially allowed but shows banner)

    try {
        const response = await fetch('/v1/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const user = data.user;

            // If not subscriber
            if (user && !user.is_subscriber) {
                // If on a restricted page, redirect to subscription
                if (restrictedPages.some(p => path.includes(p))) {
                    console.log('Access denied: User is not a subscriber');
                    window.location.href = '/subscription.html?msg=upgrade_required';
                    return;
                }

                // If on dashboard (index.html) or just general UI lock, show banner
                if (path === '/' || path.includes('index.html') || path.includes('dashboard')) {
                    showUpgradeBanner();
                    lockFeatures();
                }

                // If on other pages (like connection), show locked features too just in case
                lockFeatures();
            }
        }
    } catch (e) {
        console.error('Access check failed', e);
    }
});

function showUpgradeBanner() {
    // Avoid duplicate
    if (document.getElementById('upgrade-banner')) return;

    const container = document.querySelector('.container-fluid');
    // If not container-fluid, maybe just body?
    const target = container || document.body;

    if (target) {
        const banner = document.createElement('div');
        banner.id = 'upgrade-banner';
        banner.className = 'alert alert-warning border-warning shadow d-flex justify-content-between align-items-center mb-4';
        banner.innerHTML = `
            <div>
                <strong><i class="fas fa-lock text-warning"></i> Modo Gratuito</strong>
                <span class="ms-2">Assine para desbloquear automação, disparador em massa e CRM ilimitado.</span>
            </div>
            <a href="/subscription.html" class="btn btn-warning btn-sm fw-bold text-dark">Desbloquear Premium</a>
        `;
        if (container) {
            container.insertBefore(banner, container.firstChild);
        } else {
            // Prepend to body
            document.body.prepend(banner);
        }
    }
}

function lockFeatures() {
    // Hide or disable specific sidebar items visually
    const sidebar = document.getElementById('sidebar-wrapper');
    if (sidebar) {
        const links = sidebar.querySelectorAll('a.list-group-item');
        links.forEach(link => {
            // List of restricted keywords in href
            if (['disparador', 'automacao', 'crm', 'kanban', 'resumo-grupos', 'exportar-contatos'].some(kw => link.href.includes(kw))) {
                // Add lock icon if not present
                if (!link.querySelector('.fa-lock')) {
                    const icon = document.createElement('i');
                    icon.className = 'fas fa-lock text-muted ms-auto small float-end mt-1';
                    link.appendChild(icon);

                    // Change link behavior?
                    // link.href = '/subscription.html?msg=locked_feature';
                    // Or let the page redirect logic handle it when clicked? 
                    // Better to redirect explicitly to avoid page load flicker
                    link.onclick = (e) => {
                        e.preventDefault();
                        window.location.href = '/subscription.html?msg=locked_feature'; // Redirect logic is safer
                    };
                }
            }
        });
    }
}
