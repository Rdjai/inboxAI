const mongoose = require('mongoose');

const EmailAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    displayName: {
        type: String,
        default: ''
    },
    provider: {
        type: String,
        enum: ['gmail', 'outlook', 'yahoo', 'custom'],
        default: 'custom'
    },
    smtpHost: {
        type: String,
        required: true
    },
    smtpPort: {
        type: Number,
        required: true
    },
    smtpUsername: {
        type: String,
        required: true
    },
    smtpPassword: {
        type: String,
        required: true
    },
    imapHost: {
        type: String,
        default: ''
    },
    imapPort: {
        type: Number,
        default: 993
    },
    useSSL: {
        type: Boolean,
        default: true
    },
    useTLS: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastSynced: {
        type: Date
    },
    unreadCount: {
        type: Number,
        default: 0
    },
    totalEmails: {
        type: Number,
        default: 0
    },
    // Role-based permissions for this email account
    permissions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['read', 'write', 'admin'],
            default: 'read'
        },
        grantedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index for faster queries
EmailAccountSchema.index({ userId: 1, email: 1 });

module.exports = mongoose.model('EmailAccount', EmailAccountSchema);