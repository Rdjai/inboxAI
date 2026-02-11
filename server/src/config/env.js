require('dotenv').config();

module.exports = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3000,

    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/processmail',

    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || 587,
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',

    // File Upload
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 5242880, // 5MB

    // AI Service
    AI_SERVICE_ENABLED: process.env.AI_SERVICE_ENABLED === 'true',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

    // OAuth (Google)
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/email/accounts/google/callback',
    CLIENT_BASE_URL: process.env.CLIENT_BASE_URL || 'http://localhost:5173',

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100
};