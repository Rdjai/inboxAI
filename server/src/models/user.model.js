const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 80
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 320,
        match: EMAIL_PATTERN
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 128
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.AGENT
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLoginAt: Date,
    preferences: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    minimize: false
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
