const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    email: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Email',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    action: {
        type: String,
        enum: ['created', 'classified', 'drafted', 'edited', 'approved', 'sent', 'failed', 'assigned', 'replied', 'reviewed'], // Added 'reviewed'
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes
auditLogSchema.index({ email: 1, createdAt: -1 });
auditLogSchema.index({ user: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);