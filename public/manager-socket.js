// Socket.IO Integration for WhatsMiau2 Manager
// Real-time events and notifications
// DEMO MODE: Simulates events when Socket.IO server is not available

// Socket.IO connection
let socket;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let demoMode = false;

// Initialize Socket.IO
function initializeSocketIO() {
    console.log('🔌 Initializing Socket.IO...');

    // Try to connect to Socket.IO server
    try {
        socket = io({
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            timeout: 3000
        });

        // Connection events
        socket.on('connect', () => {
            console.log('✅ Socket.IO connected!');
            demoMode = false;
            reconnectAttempts = 0;
            updateConnectionStatus('online', 'Conectado');
            showNotification('Conectado ao servidor Socket.IO', 'success');
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket.IO disconnected:', reason);
            updateConnectionStatus('offline', 'Desconectado');

            if (!demoMode) {
                showNotification('Desconectado do servidor', 'warning');
            }
        });

        socket.on('connect_error', (error) => {
            console.warn('🔴 Connection error:', error.message);
            reconnectAttempts++;

            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                console.log('⚠️ Socket.IO server not available, entering DEMO mode');
                demoMode = true;
                updateConnectionStatus('online', 'Conectado (Demo)');
                showNotification('Modo demonstração ativado', 'info');
                startDemoMode();
            } else {
                updateConnectionStatus('connecting', 'Reconectando...');
            }
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Reconnected after', attemptNumber, 'attempts');
            demoMode = false;
            updateConnectionStatus('online', 'Reconectado');
            showNotification('Reconectado ao servidor', 'success');
            loadDashboardData();
        });

        // WhatsApp events
        socket.on('whatsapp:message', (data) => {
            console.log('📨 New WhatsApp message:', data);
            handleNewMessage(data);
        });

        socket.on('whatsapp:connection', (data) => {
            console.log('📱 WhatsApp connection update:', data);
            handleConnectionUpdate(data);
        });

        socket.on('whatsapp:qr', (data) => {
            console.log('🔲 QR Code received:', data);
            handleQRCode(data);
        });

        // CRM events
        socket.on('crm:lead:created', (data) => {
            console.log('👤 New lead created:', data);
            handleNewLead(data);
        });

        socket.on('crm:lead:updated', (data) => {
            console.log('📝 Lead updated:', data);
            handleLeadUpdate(data);
        });

        // Webhook events
        socket.on('webhook:event', (data) => {
            console.log('🔔 Webhook event:', data);
            handleWebhookEvent(data);
        });

        // System events
        socket.on('system:notification', (data) => {
            console.log('🔔 System notification:', data);
            showNotification(data.message, data.type || 'info');
        });

    } catch (error) {
        console.error('❌ Failed to initialize Socket.IO:', error);
        demoMode = true;
        startDemoMode();
    }
}

// Demo mode - simulates events
function startDemoMode() {
    console.log('🎭 Starting DEMO mode - simulating real-time events...');

    // Simulate events every 10 seconds
    setInterval(() => {
        if (!demoMode) return;

        const events = [
            () => handleNewMessage({
                from: '5588994227586',
                message: 'Olá! Gostaria de mais informações sobre seus serviços.',
                timestamp: new Date()
            }),
            () => handleNewLead({
                nome: 'João Silva',
                telefone: '5588994227586',
                origem: 'WhatsApp'
            }),
            () => handleConnectionUpdate({
                status: 'open',
                instance: 'peerjs'
            }),
            () => handleWebhookEvent({
                event: 'MESSAGE_RECEIVED',
                data: { from: '5588994227586' }
            })
        ];

        // Pick random event
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        randomEvent();

    }, 10000);

    // Show initial demo event
    setTimeout(() => {
        showNotification('Sistema em modo demonstração - eventos simulados', 'info');
        handleNewMessage({
            from: 'Demo User',
            message: 'Esta é uma mensagem de demonstração!',
            timestamp: new Date()
        });
    }, 2000);
}

// Handle new WhatsApp message
function handleNewMessage(data) {
    // Update message count
    const messagesCount = document.getElementById('messages-count');
    if (messagesCount) {
        const current = parseInt(messagesCount.textContent) || 0;
        messagesCount.textContent = current + 1;
    }

    // Show notification
    const from = data.from || 'Desconhecido';
    const message = data.message || 'Nova mensagem';
    const preview = message.length > 50 ? message.substring(0, 50) + '...' : message;
    showNotification(`Nova mensagem de ${from}: ${preview}`, 'info');

    // Add to real-time events (if dashboard is active)
    addRealTimeEvent({
        type: 'message',
        icon: '💬',
        title: 'Nova Mensagem',
        description: `De: ${from}`,
        timestamp: new Date()
    });
}

// Handle connection update
function handleConnectionUpdate(data) {
    const status = data.status || 'unknown';
    const instance = data.instance || currentInstance;

    if (status === 'open' || status === 'connected') {
        updateConnectionStatus('online', demoMode ? 'Conectado (Demo)' : 'Conectado');
        showNotification(`Instância ${instance} conectada`, 'success');
    } else if (status === 'connecting') {
        updateConnectionStatus('connecting', 'Conectando...');
    } else {
        updateConnectionStatus('offline', 'Desconectado');
        showNotification(`Instância ${instance} desconectada`, 'warning');
    }

    // Update current instance
    document.getElementById('current-instance').textContent = instance;
}

// Handle QR Code
function handleQRCode(data) {
    console.log('QR Code received, redirecting to pairing page...');
    showNotification('QR Code disponível para pareamento', 'info');
}

// Handle new lead
function handleNewLead(data) {
    showNotification(`Novo lead: ${data.nome || 'Sem nome'}`, 'success');

    // Update contacts count
    const contactsCount = document.getElementById('contacts-count');
    if (contactsCount) {
        const current = parseInt(contactsCount.textContent) || 0;
        contactsCount.textContent = current + 1;
    }

    // Add to real-time events
    addRealTimeEvent({
        type: 'lead',
        icon: '👤',
        title: 'Novo Lead',
        description: data.nome || 'Sem nome',
        timestamp: new Date()
    });
}

// Handle lead update
function handleLeadUpdate(data) {
    showNotification(`Lead atualizado: ${data.nome || 'Sem nome'}`, 'info');
}

// Handle webhook event
function handleWebhookEvent(data) {
    addRealTimeEvent({
        type: 'webhook',
        icon: '🔔',
        title: 'Webhook Event',
        description: data.event || 'Unknown event',
        timestamp: new Date()
    });
}

// Add real-time event to dashboard
function addRealTimeEvent(event) {
    // Check if we're on dashboard
    const dashboard = document.getElementById('view-dashboard');
    if (!dashboard || !dashboard.classList.contains('active')) {
        return;
    }

    // Get or create events container
    let eventsContainer = document.getElementById('real-time-events');
    if (!eventsContainer) {
        // Create events section if it doesn't exist
        const statusCard = document.querySelector('#view-dashboard .card');
        if (statusCard) {
            const eventsCard = document.createElement('div');
            eventsCard.className = 'card';
            eventsCard.style.marginTop = '24px';
            eventsCard.innerHTML = `
                <h3 style="margin-bottom: 20px;">📡 Eventos em Tempo Real ${demoMode ? '(Demo)' : ''}</h3>
                <div id="real-time-events" style="max-height: 300px; overflow-y: auto;"></div>
            `;
            statusCard.parentNode.insertBefore(eventsCard, statusCard.nextSibling);
            eventsContainer = document.getElementById('real-time-events');
        }
    }

    if (eventsContainer) {
        const eventElement = document.createElement('div');
        eventElement.style.cssText = `
            padding: 12px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.03);
            border-left: 3px solid var(--accent-indigo);
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
        `;

        eventElement.innerHTML = `
            <span style="font-size: 24px;">${event.icon}</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${event.title}</div>
                <div style="font-size: 13px; color: var(--text-secondary);">${event.description}</div>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
                ${event.timestamp.toLocaleTimeString()}
            </div>
        `;

        eventsContainer.prepend(eventElement);

        // Keep only last 10 events
        while (eventsContainer.children.length > 10) {
            eventsContainer.removeChild(eventsContainer.lastChild);
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 9999;
        padding: 16px 24px;
        background: var(--surface);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;

    // Set color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#6366f1'
    };

    notification.style.borderLeftColor = colors[type] || colors.info;
    notification.style.borderLeftWidth = '4px';

    // Set icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">${icons[type] || icons.info}</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${type.toUpperCase()}</div>
                <div style="font-size: 14px; color: var(--text-secondary);">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                font-size: 20px;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize Socket.IO when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing WhatsMiau2 Manager...');
    initializeSocketIO();
});

// Export functions for use in manager.html
window.socketIO = {
    init: initializeSocketIO,
    showNotification,
    addRealTimeEvent,
    isDemoMode: () => demoMode
};
