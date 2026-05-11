const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
    threadId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    subject: {
        type: String,
        required: true,
        index: true
    },
    participants: [{
        email: String,
        name: String
    }],
    status: {
        type: String,
        default: 'active'
    },
    assignedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    tags: [String],
    lastMessageAt: {
        type: Date,
        index: true
    },
    messageCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EmailThread', threadSchema);