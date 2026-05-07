const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../../utils/constants');

const auditSchema = new mongoose.Schema({
    emailId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Email',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    action: {
        type: String,
        enum: Object.values(AUDIT_ACTIONS),
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

auditSchema.index({ createdAt: -1 });
auditSchema.index({ emailId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditSchema);