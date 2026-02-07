const mongoose = require('mongoose');
const { EMAIL_STATUS, EMAIL_CATEGORIES, PRIORITY } = require('../utils/constants');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailMetadataSchema = new mongoose.Schema(
    {
        source: {
            type: String,
            trim: true,
            maxlength: 64
        },
        fetchedAt: Date,
        hasAttachments: {
            type: Boolean,
            default: false
        },
        sentVia: {
            type: String,
            trim: true,
            maxlength: 64
        }
    },
    {
        _id: false,
        strict: false
    }
);

const emailSchema = new mongoose.Schema({
    fromAddress: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 320,
        match: EMAIL_PATTERN
    },
    toAddress: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 320,
        match: EMAIL_PATTERN
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300,
        index: true
    },
    bodyText: {
        type: String,
        required: true,
        minlength: 1
    },
    bodyHtml: {
        type: String,
        default: ''
    },

    category: {
        type: String,
        enum: EMAIL_CATEGORIES,
        index: true
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1
    },
    draftText: {
        type: String
    },
    status: {
        type: String,
        enum: Object.values(EMAIL_STATUS),
        default: EMAIL_STATUS.NEW,
        index: true
    },

    assignedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    priority: {
        type: String,
        enum: Object.values(PRIORITY),
        default: PRIORITY.MEDIUM,
        index: true
    },

    threadId: {
        type: String,
        trim: true,
        maxlength: 255,
        index: true
    },
    messageId: {
        type: String,
        unique: true,
        trim: true,
        maxlength: 500,
        default: () => `<${new mongoose.Types.ObjectId().toString()}@processmail.local>`
    },
    inReplyTo: {
        type: String,
        trim: true,
        maxlength: 500
    },
    references: [{
        type: String,
        trim: true,
        maxlength: 500
    }],

    metadata: {
        type: emailMetadataSchema,
        default: () => ({})
    },

    processedAt: Date,
    sentAt: Date
}, {
    timestamps: true,
    minimize: false
});

emailSchema.index({ status: 1, createdAt: -1 });
emailSchema.index({ category: 1, createdAt: -1 });
emailSchema.index({ assignedUserId: 1, status: 1 });
emailSchema.index({ priority: 1, createdAt: -1 });
emailSchema.index({ fromAddress: 1, createdAt: -1 });
emailSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Email', emailSchema);
