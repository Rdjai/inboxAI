// src/modules/emails/email.model.js - Add accountId field
const mongoose = require('mongoose');
const { EMAIL_STATUS, EMAIL_CATEGORIES, PRIORITY } = require('../../utils/constants');

const emailSchema = new mongoose.Schema({
    // Add this line:
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailAccount',
        index: true
    },

    // Existing fields...
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
    // ... rest of your existing schema
}, {
    timestamps: true
});

// Update indexes to include accountId
emailSchema.index({ accountId: 1, status: 1, createdAt: -1 });
emailSchema.index({ accountId: 1, category: 1, createdAt: -1 });
emailSchema.index({ accountId: 1, assignedUserId: 1, status: 1 });