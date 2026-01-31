import axios from 'axios';
import { getStatusColor, getPriorityColor, getCategoryIcon } from '../utils/helpers';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.error || error.message || 'An error occurred';

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        return Promise.reject({ message, status: error.response?.status });
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => {
        console.log('📤 [authAPI.login] Sending credentials:', credentials);
        return api.post('/auth/login', {
            email: credentials.email,
            password: credentials.password
        });
    },
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.post('/auth/change-password', data),
    getUsers: () => api.get('/auth/users'),
    updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
};

// Email Accounts API
export const emailAccountsAPI = {
    getAccounts: () => api.get('/email/accounts'),
    createAccount: (data) => api.post('/email/accounts', data),
    updateAccount: (id, data) => api.put(`/email/accounts/${id}`, data),
    deleteAccount: (id) => api.delete(`/email/accounts/${id}`),
    syncAccount: (accountId, limit) =>
        api.post(`/email/accounts/${accountId}/sync`, { limit }),
    shareAccount: (accountId, data) =>
        api.post(`/email/accounts/${accountId}/share`, data),
};

// Emails API
export const emailsAPI = {
    getEmails: (accountId, params = {}) =>
        api.get(`/email/accounts/${accountId}/emails`, { params }),
    getEmail: (emailId) => api.get(`/email/${emailId}`),
    sendEmail: (accountId, data) =>
        api.post(`/email/accounts/${accountId}/send`, data),
    updateEmail: (emailId, data) => api.put(`/email/${emailId}`, data),
    deleteEmail: (emailId) => api.delete(`/email/${emailId}`),
    markAsRead: (emailId) => api.put(`/email/${emailId}/read`),
    markAsUnread: (emailId) => api.put(`/email/${emailId}/unread`),
    addLabel: (emailId, label) => api.post(`/email/${emailId}/labels`, { label }),
    removeLabel: (emailId, label) => api.delete(`/email/${emailId}/labels`, { data: { label } }),
};

// AI API
export const aiAPI = {
    analyzeEmail: (emailId) => api.post(`/ai/analyze/${emailId}`),
    generateReply: (emailId, tone) => api.post(`/ai/reply/${emailId}`, { tone }),
    categorizeEmails: (accountId) => api.post(`/ai/categorize/${accountId}`),
    summarizeEmail: (emailId) => api.post(`/ai/summarize/${emailId}`),
};

// Analytics API
export const analyticsAPI = {
    getOverview: () => api.get('/analytics/overview'),
    getEmailStats: (period = 'week') => api.get(`/analytics/email-stats?period=${period}`),
    getAccountStats: () => api.get('/analytics/account-stats'),
    getUserActivity: () => api.get('/analytics/user-activity'),
    getCategoryDistribution: () => api.get('/analytics/category-distribution'),
    getSentimentAnalysis: () => api.get('/analytics/sentiment'),
};

// Health check
export const healthAPI = {
    check: () => api.get('/health'),
};

// Export utility functions
export { getStatusColor, getPriorityColor, getCategoryIcon };

export default api;