// server/models/Email.js (if not exists)
const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    emailAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailAccount',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messageId: {
        type: String,
        required: true
    },
    threadId: {
        type: String,
        required: true
    },
    from: {
        name: String,
        email: String
    },
    to: [{
        name: String,
        email: String
    }],
    cc: [{
        name: String,
        email: String
    }],
    bcc: [{
        name: String,
        email: String
    }],
    subject: String,
    body: {
        text: String,
        html: String
    },
    attachments: [{
        filename: String,
        contentType: String,
        size: Number
    }],
    labels: [String],
    receivedAt: {
        type: Date
    },
    category: {
        type: String,
        enum: ['inbox', 'sent', 'draft', 'spam', 'trash'],
        default: 'sent'
    },
    isRead: {
        type: Boolean,
        default: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Email', emailSchema);
