const mongoose = require('mongoose');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/i;

const labelSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 1, maxlength: 50 },
        color: { type: String, default: '#3B82F6', match: HEX_COLOR_PATTERN },
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
            default: ['read'],
            validate: {
                validator: (permissions) => Array.isArray(permissions) && new Set(permissions).size === permissions.length,
                message: 'Permissions must not contain duplicates'
            }
        },
        addedAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const connectionSchema = new mongoose.Schema(
    {
        host: { type: String, required: true, trim: true, lowercase: true, minlength: 3, maxlength: 255 },
        port: { type: Number, required: true, min: 1, max: 65535 },
        secure: { type: Boolean, default: true },
        auth: {
            user: { type: String, required: true, trim: true, maxlength: 320 },
            pass: { type: String, required: true, minlength: 1, maxlength: 512 }
        }
    },
    { _id: false }
);

const accountMetadataSchema = new mongoose.Schema(
    {},
    {
        _id: false,
        strict: false
    }
);

const emailAccountSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 320,
            match: EMAIL_PATTERN
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
            totalEmails: { type: Number, default: 0, min: 0 },
            unreadEmails: { type: Number, default: 0, min: 0 },
            lastSyncDuration: { type: Number, default: 0, min: 0 }
        },
        lastSyncedAt: { type: Date, default: null },
        lastError: { type: String, default: null, maxlength: 500 },
        metadata: { type: accountMetadataSchema, default: () => ({}) }
    },
    { timestamps: true, minimize: false }
);

emailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });
emailAccountSchema.index({ userId: 1, isDefault: -1, createdAt: -1 });
emailAccountSchema.index({ userId: 1, provider: 1, isActive: 1 });
emailAccountSchema.index({ 'sharedWith.userId': 1, isActive: 1 });
emailAccountSchema.index({ userId: 1, lastSyncedAt: -1 });

module.exports = mongoose.model('EmailAccount', emailAccountSchema);
