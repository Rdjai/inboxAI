module.exports = {

    EMAIL_STATUS: {
        NEW: 'NEW',
        CLASSIFIED: 'CLASSIFIED',
        DRAFTED: 'DRAFTED',
        REVIEWED: 'REVIEWED',
        APPROVED: 'APPROVED',
        SENT: 'SENT',
        FAILED: 'FAILED'
    },


    EMAIL_CATEGORIES: [
        'Complaint',
        'Issue',
        'Refund',
        'Billing',
        'Feedback',
        'Sales',
        'Other'
    ],

    PRIORITY: {
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        URGENT: 'URGENT'
    },

    SENTIMENT: {
        POSITIVE: 'POSITIVE',
        NEUTRAL: 'NEUTRAL',
        NEGATIVE: 'NEGATIVE'
    },


    AUDIT_ACTIONS: {
        CREATED: 'CREATED',
        CLASSIFIED: 'CLASSIFIED',
        DRAFTED: 'DRAFTED',
        EDITED: 'EDITED',
        APPROVED: 'APPROVED',
        SENT: 'SENT',
        FAILED: 'FAILED',
        FORWARDED: 'FORWARDED',
        REPLIED: 'REPLIED',
        ASSIGNED: 'ASSIGNED',
        UNASSIGNED: 'UNASSIGNED',
        ROLE_CHANGED: 'ROLE_CHANGED',
        USER_CREATED: 'USER_CREATED',
        USER_UPDATED: 'USER_UPDATED',
        USER_DELETED: 'USER_DELETED',
        PERMISSION_GRANTED: 'PERMISSION_GRANTED',
        PERMISSION_REVOKED: 'PERMISSION_REVOKED'
    },


    MODIFICATION_TYPES: {
        REPLY: 'REPLY',
        FORWARD: 'FORWARD',
        EDIT: 'EDIT'
    },

    // Enhanced Role System
    ROLES: {
        ADMIN: 'admin',
        EDITOR: 'editor',
        MEMBER: 'member',
        // Legacy roles for backward compatibility
        REVIEWER: 'reviewer',
        AGENT: 'agent'
    },

    // Role Hierarchy (higher number = more permissions)
    ROLE_HIERARCHY: {
        member: 1,
        agent: 2,      // Legacy
        editor: 3,
        reviewer: 4,   // Legacy
        admin: 5
    },

    // Comprehensive Permission System
    PERMISSIONS: {
        // Email Management
        EMAIL_VIEW: 'email:view',
        EMAIL_VIEW_ALL: 'email:view:all',
        EMAIL_CREATE: 'email:create',
        EMAIL_EDIT: 'email:edit',
        EMAIL_EDIT_ALL: 'email:edit:all',
        EMAIL_DELETE: 'email:delete',
        EMAIL_DELETE_ALL: 'email:delete:all',
        EMAIL_APPROVE: 'email:approve',
        EMAIL_SEND: 'email:send',
        EMAIL_ASSIGN: 'email:assign',
        EMAIL_BULK_ACTIONS: 'email:bulk',

        // Search & Analytics
        SEARCH_BASIC: 'search:basic',
        SEARCH_ADVANCED: 'search:advanced',
        SEARCH_ANALYTICS: 'search:analytics',
        SEARCH_METRICS: 'search:metrics',

        // User Management
        USER_VIEW: 'user:view',
        USER_VIEW_ALL: 'user:view:all',
        USER_CREATE: 'user:create',
        USER_EDIT: 'user:edit',
        USER_EDIT_ALL: 'user:edit:all',
        USER_DELETE: 'user:delete',
        USER_ROLE_CHANGE: 'user:role:change',

        // Account Management
        ACCOUNT_VIEW: 'account:view',
        ACCOUNT_VIEW_ALL: 'account:view:all',
        ACCOUNT_CREATE: 'account:create',
        ACCOUNT_EDIT: 'account:edit',
        ACCOUNT_DELETE: 'account:delete',

        // System Administration
        SYSTEM_SETTINGS: 'system:settings',
        SYSTEM_LOGS: 'system:logs',
        SYSTEM_METRICS: 'system:metrics',
        SYSTEM_BACKUP: 'system:backup',
        SYSTEM_MAINTENANCE: 'system:maintenance',

        // Analytics & Reporting
        ANALYTICS_VIEW: 'analytics:view',
        ANALYTICS_EXPORT: 'analytics:export',
        REPORTS_CREATE: 'reports:create',
        REPORTS_SCHEDULE: 'reports:schedule'
    },

    // Role-based Permission Mapping
    ROLE_PERMISSIONS: {
        member: [
            'email:view',
            'email:create',
            'email:edit',
            'search:basic',
            'user:view',
            'account:view'
        ],

        agent: [ // Legacy role
            'email:view',
            'email:view:all',
            'email:create',
            'email:edit',
            'email:edit:all',
            'search:basic',
            'search:advanced',
            'user:view',
            'account:view',
            'analytics:view'
        ],

        editor: [
            'email:view',
            'email:view:all',
            'email:create',
            'email:edit',
            'email:edit:all',
            'email:delete',
            'email:approve',
            'email:assign',
            'search:basic',
            'search:advanced',
            'search:analytics',
            'user:view',
            'user:view:all',
            'user:create',
            'user:edit',
            'account:view',
            'account:view:all',
            'account:create',
            'account:edit',
            'analytics:view',
            'analytics:export',
            'reports:create'
        ],

        reviewer: [ // Legacy role
            'email:view',
            'email:view:all',
            'email:create',
            'email:edit',
            'email:edit:all',
            'email:delete',
            'email:approve',
            'email:send',
            'email:assign',
            'email:bulk',
            'search:basic',
            'search:advanced',
            'search:analytics',
            'user:view',
            'user:view:all',
            'account:view',
            'account:view:all',
            'analytics:view',
            'analytics:export'
        ],

        admin: [
            // All permissions - full system access
            'email:view',
            'email:view:all',
            'email:create',
            'email:edit',
            'email:edit:all',
            'email:delete',
            'email:delete:all',
            'email:approve',
            'email:send',
            'email:assign',
            'email:bulk',
            'search:basic',
            'search:advanced',
            'search:analytics',
            'search:metrics',
            'user:view',
            'user:view:all',
            'user:create',
            'user:edit',
            'user:edit:all',
            'user:delete',
            'user:role:change',
            'account:view',
            'account:view:all',
            'account:create',
            'account:edit',
            'account:delete',
            'system:settings',
            'system:logs',
            'system:metrics',
            'system:backup',
            'system:maintenance',
            'analytics:view',
            'analytics:export',
            'reports:create',
            'reports:schedule'
        ]
    },

    QUEUES: {
        CLASSIFICATION: 'classification_queue',
        DRAFTING: 'drafting_queue',
        SENDING: 'sending_queue'
    }
};