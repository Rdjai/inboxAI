const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    email: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Email',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Attachment', attachmentSchema);