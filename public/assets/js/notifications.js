/**
 * WhatsMiau2 - Notification System
 * Sistema de notificações toast para feedback visual
 */

const NotificationTypes = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

const NotificationIcons = {
    success: 'fa-check',
    error: 'fa-times',
    warning: 'fa-exclamation',
    info: 'fa-info'
};

const NotificationTitles = {
    success: 'Sucesso',
    error: 'Erro',
    warning: 'Atenção',
    info: 'Informação'
};

/**
 * Exibe uma notificação toast
 * @param {string} message - Mensagem da notificação
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duração em ms (default: 5000)
 */
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.warn('Notification container not found');
        return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${NotificationIcons[type]}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${NotificationTitles[type]}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(notification);

    // Auto remove after duration
    setTimeout(() => {
        removeNotification(notification);
    }, duration);

    return notification;
}

/**
 * Remove uma notificação com animação
 * @param {HTMLElement} notification - Elemento da notificação
 */
function removeNotification(notification) {
    if (!notification || !notification.parentNode) return;

    notification.classList.add('hiding');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/**
 * Fecha notificação ao clicar no X
 * @param {HTMLElement} button - Botão de fechar
 */
function closeNotification(button) {
    const notification = button.closest('.notification');
    removeNotification(notification);
}

// Funções de atalho
function showSuccess(message, duration) {
    return showNotification(message, 'success', duration);
}

function showError(message, duration) {
    return showNotification(message, 'error', duration);
}

function showWarning(message, duration) {
    return showNotification(message, 'warning', duration);
}

function showInfo(message, duration) {
    return showNotification(message, 'info', duration);
}

// Exportar para uso global
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
