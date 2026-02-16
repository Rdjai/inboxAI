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
        UNASSIGNED: 'UNASSIGNED'
    },


    MODIFICATION_TYPES: {
        REPLY: 'REPLY',
        FORWARD: 'FORWARD',
        EDIT: 'EDIT'
    },


    ROLES: {
        ADMIN: 'admin',
        REVIEWER: 'reviewer',
        AGENT: 'agent'
    },


    QUEUES: {
        CLASSIFICATION: 'classification_queue',
        DRAFTING: 'drafting_queue',
        SENDING: 'sending_queue'
    }
};