// Utility functions for email management

// Get status color based on email status
export const getStatusColor = (status) => {
    const colors = {
        'sent': 'bg-green-100 text-green-800',
        'draft': 'bg-yellow-100 text-yellow-800',
        'failed': 'bg-red-100 text-red-800',
        'scheduled': 'bg-blue-100 text-blue-800',
        'processing': 'bg-purple-100 text-purple-800',
        'pending': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

// Get priority color
export const getPriorityColor = (priority) => {
    const colors = {
        'high': 'bg-red-100 text-red-800',
        'medium': 'bg-yellow-100 text-yellow-800',
        'low': 'bg-green-100 text-green-800',
        'urgent': 'bg-red-100 text-red-800',
        'normal': 'bg-blue-100 text-blue-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
};

// Get category icon
export const getCategoryIcon = (category) => {
    const icons = {
        'urgent': '🔥',
        'important': '⭐',
        'newsletter': '📰',
        'social': '👥',
        'promotional': '🎯',
        'spam': '🚫',
        'general': '📧',
        'work': '💼',
        'personal': '👤',
    };
    return icons[category] || '📧';
};

// Format date
export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return d.toLocaleDateString([], { weekday: 'short' });
    } else {
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};

// Format full date
export const formatFullDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Validate email
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Get initials from name
export const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Debounce function
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Sleep function
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate random ID
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};