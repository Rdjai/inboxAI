const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const logger = require('../utils/logger');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, NODE_ENV } = require('../config/env');

const toPositiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const defaultWindowMs = toPositiveInteger(RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const defaultMaxRequests = toPositiveInteger(RATE_LIMIT_MAX_REQUESTS, 100);

const buildRateLimitResponse = (message, retryAfter, code = 'RATE_LIMIT_EXCEEDED') => ({
    success: false,
    message,
    code,
    retryAfter
});

const createRateLimiter = ({
    windowMs = defaultWindowMs,
    max = defaultMaxRequests,
    message = 'Too many requests. Please try again later.',
    code = 'RATE_LIMIT_EXCEEDED',
    keyPrefix = 'api'
} = {}) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    validate: {
        xForwardedForHeader: false
    },
    keyGenerator: (req) => `${keyPrefix}:${ipKeyGenerator(req.ip || '')}`,
    handler: (req, res) => {
        const retryAfterSeconds = Math.max(Math.ceil(windowMs / 1000), 1);

        logger.warn('Rate limit exceeded', {
            scope: keyPrefix,
            ip: req.ip,
            method: req.method,
            path: req.originalUrl,
            retryAfterSeconds
        });

        res.status(429).json(buildRateLimitResponse(message, retryAfterSeconds, code));
    }
});

const apiRateLimiter = createRateLimiter();
const authRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: 'Too many authentication attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    keyPrefix: 'auth'
});

const heavyOperationRateLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000,
    max: NODE_ENV === 'production' ? 30 : 60,
    message: 'Too many intensive requests. Please slow down and retry shortly.',
    code: 'HEAVY_RATE_LIMIT_EXCEEDED',
    keyPrefix: 'heavy'
});

module.exports = {
    createRateLimiter,
    apiRateLimiter,
    authRateLimiter,
    heavyOperationRateLimiter
};
