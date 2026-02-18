import axios from 'axios';
import { io } from 'socket.io-client';
import { getStatusColor, getPriorityColor, getCategoryIcon } from '../utils/helpers';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// In api.js, add:
export const setupSocket = () => {
    const socket = io('http://localhost:3000', {
        auth: { token: localStorage.getItem('token') }
    });

    socket.on('email:updated', (data) => {
        // Dispatch to state management
        window.dispatchEvent(new CustomEvent('email-update', { detail: data }));
    });
};

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        return Promise.reject({ message, status, data });
    }
);

const shouldTryFallback = (status) => !status || [403, 404, 405].includes(status);

const getWithFallback = async (paths, config) => {
    const candidates = Array.isArray(paths) ? paths : [paths];
    let lastError;
    for (const path of candidates) {
        try {
            return await api.get(path, config);
        } catch (error) {
            lastError = error;
            if (!shouldTryFallback(error?.status)) {
                throw error;
            }
        }
    }
    throw lastError;
};

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    getUsers: () => api.get('/auth/users'),
};

export const emailsAPI = {
    getAllEmails: (params = {}) => api.get('/emails', { params }),
    getEmails: (accountId, params = {}) => api.get('/emails', { params: { ...params, accountId } }),
    getEmail: (id) => api.get(`/emails/${id}`),
    updateDraft: (id, data) => api.put(`/emails/${id}/draft`, data),
    approveEmail: (id) => api.post(`/emails/${id}/approve`),
    sendEmail: (id) => api.post(`/emails/${id}/send`),
    replyToEmail: (id, data) => api.post(`/emails/${id}/reply`, data),
    forwardEmail: (id, data) => api.post(`/emails/${id}/forward`, data),
    bulkAction: (data) => api.post('/emails/bulk', data),
    createEmail: (data) => api.post('/emails', data),
    markAsRead: (emailId) => api.patch(`/emails/${emailId}/read`),
    markAsUnread: (emailId) => api.patch(`/emails/${emailId}/unread`),
    deleteEmail: (emailId) => Promise.resolve({ success: true, data: { emailId } }),
};

export const emailAccountsAPI = {
    getAccounts: () => api.get('/email/accounts'),
    getStats: () => api.get('/email/accounts/stats'),
    getGoogleOAuthUrl: () => api.post('/email/accounts/google/oauth-url'),
    getAccount: (id) => api.get(`/email/accounts/${id}`),
    createAccount: (data) => api.post('/email/accounts', data),
    quickCreate: (data) => api.post('/email/accounts/quick-create', data),
    updateAccount: (id, data) => api.put(`/email/accounts/${id}`, data),
    deleteAccount: (id) => api.delete(`/email/accounts/${id}`),
    syncAccount: (accountId, limit = 50, extra = {}) => api.post(`/email/accounts/${accountId}/sync`, { limit, ...extra }),
    syncManual: (data) => api.post('/email/sync/manual', data),
    shareAccount: (accountId, data) => api.post(`/email/accounts/${accountId}/share`, data),
    testConnection: (accountId) => api.post(`/email/accounts/${accountId}/test`, {}),
    testSendEmail: (data) => api.post('/test-send-email', data),
    fixGmailSettings: () => api.post('/email/accounts/fix-gmail'),
};

export const dashboardAPI = {
    getDashboard: (params = {}) => getWithFallback(['/analytics/dashboard', '/dashboard'], { params }),
    getCategoryAnalytics: (params = {}) => getWithFallback(
        ['/analytics/analytics/category', '/analytics/category'],
        { params }
    ),
    getTeamAnalytics: (params = {}) => getWithFallback(
        ['/analytics/analytics/team', '/analytics/team', '/analytics/account-stats'],
        { params }
    ),
    getQueueStatus: () => getWithFallback(['/analytics/queue/status', '/queue/status']),
};

export const aiAPI = {
    analyzeEmail: (emailId) => api.post(`/ai/analyze/${emailId}`),
    generateReply: (emailId, tone = 'professional', context = {}) => api.post(`/ai/reply/${emailId}`, { tone, ...context }),
    bulkCategorize: (accountId) => api.post(`/ai/categorize/${accountId}`),
    summarizeEmail: (emailId) => api.post(`/ai/summarize/${emailId}`),
};

export const analyticsAPI = {
    getOverview: (params = {}) => dashboardAPI.getDashboard(params),
    getCategoryAnalytics: (params = {}) => dashboardAPI.getCategoryAnalytics(params),
    getTeamAnalytics: (params = {}) => dashboardAPI.getTeamAnalytics(params),
    getQueueStatus: () => dashboardAPI.getQueueStatus(),
};

export const healthAPI = {
    check: () => api.get('/health'),
};

let socket = null;

// export const setupSocket = (tokenOverride) => {
//     const token = tokenOverride || localStorage.getItem('token');
//     if (!socket && token) {
//         socket = io(SOCKET_BASE_URL, {
//             auth: { token },
//             transports: ['websocket', 'polling'],
//         });
//     }
//     return socket;
// };

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinEmailRoom = (emailId) => {
    if (socket) {
        socket.emit('join:email', emailId);
    }
};

export const joinDashboardRoom = () => {
    if (socket) {
        socket.emit('join:dashboard');
    }
};

export { getStatusColor, getPriorityColor, getCategoryIcon };
export default api;
