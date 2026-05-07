const mongoose = require('mongoose');
const { EMAIL_STATUS, EMAIL_CATEGORIES, PRIORITY } = require('../utils/constants');

const emailSchema = new mongoose.Schema({
    fromAddress: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    toAddress: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    bodyText: {
        type: String,
        required: true
    },
    bodyHtml: {
        type: String
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
        index: true
    },
    messageId: {
        type: String,
        unique: true,
        default: () => `<${new mongoose.Types.ObjectId().toString()}@processmail.local>`
    },
    inReplyTo: {
        type: String
    },
    references: [{
        type: String
    }],

    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },

    processedAt: Date,
    sentAt: Date
}, {
    timestamps: true
});

emailSchema.index({ status: 1, createdAt: -1 });
emailSchema.index({ category: 1, createdAt: -1 });
emailSchema.index({ assignedUserId: 1, status: 1 });
emailSchema.index({ priority: 1, createdAt: -1 });
emailSchema.index({ fromAddress: 1, createdAt: -1 });

module.exports = mongoose.model('Email', emailSchema);
