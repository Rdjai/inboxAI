const mongoose = require('mongoose');
const { MODIFICATION_TYPES } = require('../../utils/constants');

const modificationSchema = new mongoose.Schema({
    emailId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Email',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    modificationType: {
        type: String,
        enum: Object.values(MODIFICATION_TYPES),
        required: true
    },
    previousContent: {
        type: mongoose.Schema.Types.Mixed
    },
    newContent: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EmailModification', modificationSchema);