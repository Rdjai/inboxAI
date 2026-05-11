const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    emailId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Email',
        required: true,
        index: true
    },
    filename: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    sizeBytes: {
        type: Number,
        required: true
    },
    storageKey: {
        type: String,
        required: true
    },
    path: String,
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Attachment', attachmentSchema);