/**
 * WhatsMiau2 - Authentication Module
 * Gerencia login, registro, logout e sessão do usuário
 */

// API Base URL
const API_BASE = '/v1';

// Storage Keys
const STORAGE_KEYS = {
    TOKEN: 'authToken',
    USER: 'user',
    REMEMBER: 'rememberEmail'
};

/**
 * Faz login do usuário
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} Resposta da API
 */
async function login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
    }

    return data;
}

/**
 * Registra novo usuário
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>}
 */
async function register(name, email, password) {
    const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar conta');
    }

    return data;
}

/**
 * Solicita recuperação de senha
 * @param {string} email 
 * @returns {Promise<Object>}
 */
async function forgotPassword(email) {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erro ao solicitar recuperação');
    }

    return data;
}

/**
 * Obtém dados do usuário logado
 * @returns {Promise<Object>}
 */
async function getCurrentUser() {
    const token = getToken();
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erro ao obter usuário');
    }

    return data;
}

/**
 * Faz logout do usuário
 */
function logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    window.location.href = '/home';
}

/**
 * Apaga a conta do usuário
 * @returns {Promise<Object>}
 */
async function deleteAccount() {
    const token = getToken();
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao apagar conta');
    }

    logout();
}

/**
 * Salva sessão do usuário
 * @param {string} token 
 * @param {Object} user 
 */
function saveSession(token, user) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

/**
 * Sincroniza dados do usuario atual com a API e atualiza o localStorage
 * @param {{ throwOnError?: boolean }} options
 * @returns {Promise<Object|null>}
 */
async function syncCurrentUser(options = {}) {
    const { throwOnError = false } = options;
    const token = getToken();

    if (!token) {
        if (throwOnError) {
            throw new Error('Não autenticado');
        }
        return null;
    }

    try {
        const data = await getCurrentUser();
        if (data?.user) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
            return data.user;
        }
        return null;
    } catch (error) {
        if (throwOnError) {
            throw error;
        }
        console.warn('Falha ao sincronizar perfil do usuário:', error);
        return null;
    }
}

/**
 * Obtém token armazenado
 * @returns {string|null}
 */
function getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

/**
 * Obtém usuário armazenado
 * @returns {Object|null}
 */
function getUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Verifica se está autenticado
 * @returns {boolean}
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Protege página - redireciona se não autenticado
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// ============================================
// Event Handlers para formulários
// ============================================

// Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        // Carregar email salvo
        const savedEmail = localStorage.getItem(STORAGE_KEYS.REMEMBER);
        if (savedEmail) {
            document.getElementById('email').value = savedEmail;
            document.getElementById('remember').checked = true;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            const loginBtn = document.getElementById('login-btn');

            // Validação
            if (!email || !password) {
                showWarning('Preencha todos os campos');
                return;
            }

            // Loading state
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<div class="auth-spinner"></div> Entrando...';

            try {
                const data = await login(email, password);

                // Salvar sessão
                saveSession(data.token, data.user);
                await syncCurrentUser();

                // Lembrar email
                if (remember) {
                    localStorage.setItem(STORAGE_KEYS.REMEMBER, email);
                } else {
                    localStorage.removeItem(STORAGE_KEYS.REMEMBER);
                }

                showSuccess('Login realizado com sucesso!');

                // Redirecionar após breve delay
                setTimeout(() => {
                    window.location.href = '/profile.html';
                }, 1000);

            } catch (error) {
                showError(error.message);
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
            }
        });
    }

    // Register Form Handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const registerBtn = document.getElementById('register-btn');

            // Validação
            if (!name || !email || !password) {
                showWarning('Preencha todos os campos');
                return;
            }

            if (password.length < 6) {
                showWarning('A senha deve ter no mínimo 6 caracteres');
                return;
            }

            if (password !== confirmPassword) {
                showError('As senhas não coincidem');
                return;
            }

            // Loading state
            registerBtn.disabled = true;
            registerBtn.innerHTML = '<div class="auth-spinner"></div> Criando conta...';

            try {
                const data = await register(name, email, password);

                // Salvar sessão (auto-login após registro)
                saveSession(data.token, data.user);
                await syncCurrentUser();

                showSuccess('Conta criada com sucesso!');

                // Redirecionar
                setTimeout(() => {
                    window.location.href = '/profile.html';
                }, 1000);

            } catch (error) {
                showError(error.message);
                registerBtn.disabled = false;
                registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Criar Conta';
            }
        });
    }

    // Forgot Password Form Handler
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const submitBtn = document.getElementById('forgot-btn');

            if (!email) {
                showWarning('Informe seu email');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="auth-spinner"></div> Enviando...';

            try {
                await forgotPassword(email);
                showSuccess('Instruções enviadas para o email!');

                // Mostrar mensagem de sucesso
                document.getElementById('forgot-form').innerHTML = `
                    <div style="text-align: center; padding: 2rem 0;">
                        <i class="fas fa-envelope-open-text" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                        <h3 style="margin-bottom: 0.5rem;">Email enviado!</h3>
                        <p style="color: var(--text-muted);">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
                        <a href="/login.html" class="auth-btn auth-btn-primary" style="margin-top: 1.5rem; text-decoration: none;">
                            <i class="fas fa-arrow-left"></i> Voltar para Login
                        </a>
                    </div>
                `;

            } catch (error) {
                showError(error.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Instruções';
            }
        });
    }
});

// Exportar funções globais
window.login = login;
window.register = register;
window.logout = logout;
window.isAuthenticated = isAuthenticated;
window.getUser = getUser;
window.requireAuth = requireAuth;
window.deleteAccount = deleteAccount;
window.syncCurrentUser = syncCurrentUser;
