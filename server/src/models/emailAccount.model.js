const mongoose = require('mongoose');

const labelSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        color: { type: String, default: '#3B82F6' },
        type: { type: String, enum: ['system', 'user'], default: 'user' }
    },
    { _id: false }
);

const sharedWithSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        permissions: {
            type: [String],
            enum: ['read', 'write', 'delete', 'admin'],
            default: ['read']
        },
        addedAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const connectionSchema = new mongoose.Schema(
    {
        host: { type: String, required: true, trim: true },
        port: { type: Number, required: true },
        secure: { type: Boolean, default: true },
        auth: {
            user: { type: String, required: true, trim: true },
            pass: { type: String, required: true }
        }
    },
    { _id: false }
);

const emailAccountSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        provider: {
            type: String,
            enum: ['gmail', 'outlook', 'yahoo', 'office365', 'imap', 'pop3', 'smtp', 'other'],
            required: true
        },
        imapConfig: { type: connectionSchema, required: true },
        smtpConfig: { type: connectionSchema, required: true },
        syncFrequency: {
            type: String,
            enum: ['15min', '30min', '1hour', '3hour', '6hour', '12hour', 'daily', 'manual'],
            default: '30min'
        },
        isDefault: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        labels: { type: [labelSchema], default: [] },
        sharedWith: { type: [sharedWithSchema], default: [] },
        statistics: {
            totalEmails: { type: Number, default: 0 },
            unreadEmails: { type: Number, default: 0 },
            lastSyncDuration: { type: Number, default: 0 }
        },
        lastSyncedAt: { type: Date, default: null },
        lastError: { type: String, default: null },
        metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
    },
    { timestamps: true }
);

emailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('EmailAccount', emailAccountSchema);
