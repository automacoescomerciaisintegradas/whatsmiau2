import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
        const { state } = JSON.parse(authStorage)
        if (state?.token) {
            config.headers.Authorization = `Bearer ${state.token}`
        }
    }
    return config
})

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth-storage')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api

// ==================== AUTH ====================
export const authService = {
    login: async (email, password) => {
        // For now, simulate login - in production, call actual API
        return { user: { id: '1', name: 'Admin', email, role: 'admin' }, token: 'demo-token' }
    },
}

// ==================== INSTANCES/CONNECTIONS ====================
export const instanceService = {
    list: async () => {
        const { data } = await api.get('/api/instance/list')
        return data
    },

    get: async (instanceName) => {
        const { data } = await api.get(`/api/instance/info/${instanceName}`)
        return data
    },

    create: async (instanceName, qrcode = true) => {
        const { data } = await api.post('/api/instance/create', {
            instanceName,
            qrcode
        })
        return data
    },

    delete: async (instanceName) => {
        const { data } = await api.delete(`/api/instance/delete/${instanceName}`)
        return data
    },

    getQRCode: async (instanceName) => {
        const { data } = await api.get(`/api/instance/qrcode/${instanceName}`)
        return data
    },

    getConnectionState: async (instanceName) => {
        const { data } = await api.get(`/api/instance/connectionState/${instanceName}`)
        return data
    },

    disconnect: async (instanceName) => {
        const { data } = await api.delete(`/api/instance/logout/${instanceName}`)
        return data
    },

    pairPhone: async (instanceName, phoneNumber) => {
        const { data } = await api.post(`/api/instance/pairPhone/${instanceName}`, { phoneNumber })
        return data
    },
}

// ==================== MESSAGES ====================
export const messageService = {
    sendText: async (number, text, instance) => {
        const { data } = await api.post('/api/whatsmiau2/send-text', {
            number,
            text,
            instance
        })
        return data
    },

    sendMedia: async (number, mediatype, media, caption, instance) => {
        const { data } = await api.post('/api/whatsmiau2/send-media', {
            number,
            mediatype,
            media,
            caption,
            instance
        })
        return data
    },

    sendAudio: async (number, audio, ptt = true, instance) => {
        const { data } = await api.post('/api/whatsmiau2/send-audio', {
            number,
            audio,
            ptt,
            instance
        })
        return data
    },
}

// ==================== GROUPS ====================
export const groupService = {
    list: async () => {
        const { data } = await api.get('/api/whatsmiau2/groups')
        return data
    },

    getInviteLink: async (groupId) => {
        const { data } = await api.get(`/api/group/invite-link?group_id=${groupId}`)
        return data
    },
}

// ==================== NEWSLETTERS/CHANNELS ====================
export const newsletterService = {
    list: async () => {
        const { data } = await api.get('/api/newsletter/list')
        return data
    },

    follow: async (jid) => {
        const { data } = await api.post('/api/newsletter/follow', { jid })
        return data
    },

    unfollow: async (jid) => {
        const { data } = await api.post('/api/newsletter/unfollow', { jid })
        return data
    },
}

// ==================== CONTACTS ====================
export const contactService = {
    list: async (instance) => {
        const { data } = await api.get(`/api/whatsmiau2/contacts`, {
            params: { instance }
        })
        return data
    },

    create: async (contact, instance) => {
        const { data } = await api.post('/api/whatsmiau2/contacts', { ...contact, instance })
        return data
    },

    update: async (id, contact, instance) => {
        const { data } = await api.put(`/api/whatsmiau2/contacts/${id}`, { ...contact, instance })
        return data
    },

    delete: async (id, instance) => {
        const { data } = await api.delete(`/api/whatsmiau2/contacts/${id}`, {
            data: { instance }
        })
        return data
    },

    checkNumber: async (numbers) => {
        const { data } = await api.post('/api/chat/check-number', { numbers })
        return data
    },
}

// ==================== STATUS ====================
export const statusService = {
    getApiStatus: async () => {
        const { data } = await api.get('/api/whatsmiau2/status')
        return data
    },

    health: async () => {
        const { data } = await api.get('/health')
        return data
    },
}
