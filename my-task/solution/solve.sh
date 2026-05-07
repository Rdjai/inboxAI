#!/usr/bin/env bash
set -euo pipefail

python <<'PY'
from pathlib import Path

root = Path.cwd()

email_model_path = root / "server" / "src" / "models" / "email.model.js"
email_controller_path = root / "server" / "src" / "controllers" / "email.controller.js"
analytics_controller_path = root / "server" / "src" / "controllers" / "analytics.controller.js"

email_model_path.write_text(
    """const mongoose = require('mongoose');
const { EMAIL_STATUS, EMAIL_CATEGORIES, PRIORITY } = require('../utils/constants');

const emailSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailAccount',
        index: true
    },
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

emailSchema.index({ userId: 1, createdAt: -1 });
emailSchema.index({ userId: 1, status: 1, createdAt: -1 });
emailSchema.index({ status: 1, createdAt: -1 });
emailSchema.index({ category: 1, createdAt: -1 });
emailSchema.index({ assignedUserId: 1, status: 1 });
emailSchema.index({ priority: 1, createdAt: -1 });
emailSchema.index({ fromAddress: 1, createdAt: -1 });

module.exports = mongoose.model('Email', emailSchema);
""",
    encoding="utf-8",
)

email_controller = email_controller_path.read_text(encoding="utf-8")
replacements = [
    (
        "const { EMAIL_STATUS, AUDIT_ACTIONS } = require('../utils/constants');",
        "const { EMAIL_STATUS, AUDIT_ACTIONS, QUEUES } = require('../utils/constants');",
    ),
    (
        """const emitEmailUpdate = (emailId, payload) => {\n    const socketService = global.socketService;\n    if (socketService && typeof socketService.emitEmailUpdate === 'function') {\n        socketService.emitEmailUpdate(emailId, payload);\n    }\n};\n""",
        """const emitEmailUpdate = (emailId, payload) => {\n    const socketService = global.socketService;\n    if (socketService && typeof socketService.emitEmailUpdate === 'function') {\n        socketService.emitEmailUpdate(emailId, payload);\n    }\n};\n\nconst buildEmailListSort = (sortBy, sortOrder) => {\n    const direction = sortOrder === 'desc' ? -1 : 1;\n    const sort = { [sortBy]: direction };\n\n    if (sortBy !== '_id') {\n        sort._id = direction;\n    }\n\n    return sort;\n};\n""",
    ),
    (
        """            // Build query\n            const query = {};\n""",
        """            // Build query\n            const query = { userId: req.user._id };\n            const pageNumber = parseInt(page, 10);\n            const pageSize = parseInt(limit, 10);\n""",
    ),
    (
        """            // Sorting\n            const sort = {};\n            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;\n\n            // Pagination\n            const skip = (page - 1) * limit;\n""",
        """            // Sorting\n            const sort = buildEmailListSort(sortBy, sortOrder);\n\n            // Pagination\n            const skip = (pageNumber - 1) * pageSize;\n""",
    ),
    (
        ".limit(parseInt(limit))",
        ".limit(pageSize)",
    ),
    (
        """                pagination: {\n                    page: parseInt(page),\n                    limit: parseInt(limit),\n                    total,\n                    pages: Math.ceil(total / limit)\n                },\n""",
        """                pagination: {\n                    page: pageNumber,\n                    limit: pageSize,\n                    total,\n                    pages: Math.ceil(total / pageSize)\n                },\n""",
    ),
    (
        """            let emailQuery = Email.findById(req.params.id)\n                .populate('assignedUserId', 'name email');\n""",
        """            let emailQuery = Email.findOne({\n                _id: req.params.id,\n                userId: req.user._id\n            }).populate('assignedUserId', 'name email');\n""",
    ),
    (
        """            const originalEmail = await Email.findById(id);\n""",
        """            const originalEmail = await Email.findOne({\n                _id: id,\n                userId\n            });\n""",
    ),
    (
        """            const replyEmail = await Email.create({\n                fromAddress: originalEmail.toAddress,\n""",
        """            const replyEmail = await Email.create({\n                userId,\n                accountId: originalEmail.accountId,\n                fromAddress: originalEmail.toAddress,\n""",
    ),
    (
        """            const forwardEmail = await Email.create({\n                fromAddress: originalEmail.toAddress,\n""",
        """            const forwardEmail = await Email.create({\n                userId,\n                accountId: originalEmail.accountId,\n                fromAddress: originalEmail.toAddress,\n""",
    ),
    (
        """            const email = await Email.create({\n                fromAddress,\n""",
        """            const email = await Email.create({\n                userId,\n                fromAddress,\n""",
    ),
]

for old, new in replacements:
    if old not in email_controller:
        raise SystemExit(f"Expected snippet not found in email controller: {old[:80]!r}")
    email_controller = email_controller.replace(old, new, 1)

email_controller_path.write_text(email_controller, encoding="utf-8")

analytics_controller = analytics_controller_path.read_text(encoding="utf-8")
analytics_replacements = [
    (
        "const { EMAIL_STATUS, EMAIL_CATEGORIES } = require('../utils/constants');\n",
        """const { EMAIL_STATUS, EMAIL_CATEGORIES } = require('../utils/constants');\n\nconst buildEmailDateFilter = (userId, fromDate, toDate) => {\n    const filter = { userId };\n\n    if (fromDate || toDate) {\n        filter.createdAt = {};\n        if (fromDate) filter.createdAt.$gte = new Date(fromDate);\n        if (toDate) filter.createdAt.$lte = new Date(toDate);\n    }\n\n    return filter;\n};\n""",
    ),
    (
        """            const dateFilter = {};\n            if (fromDate || toDate) {\n                dateFilter.createdAt = {};\n                if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);\n                if (toDate) dateFilter.createdAt.$lte = new Date(toDate);\n            }\n""",
        """            const dateFilter = buildEmailDateFilter(req.user._id, fromDate, toDate);\n""",
    ),
]

for old, new in analytics_replacements:
    count = analytics_controller.count(old)
    if count == 0:
        raise SystemExit(f"Expected snippet not found in analytics controller: {old[:80]!r}")
    analytics_controller = analytics_controller.replace(old, new, count)

analytics_controller_path.write_text(analytics_controller, encoding="utf-8")
PY
