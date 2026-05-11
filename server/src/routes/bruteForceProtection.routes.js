const express = require('express');
const router = express.Router();
const bruteForceProtectionMiddleware = require('../middleware/bruteForceProtection.middleware');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * Get brute-force protection metrics
 * GET /api/brute-force/metrics
 */
router.get(
    '/metrics',
    adminOnly,
    bruteForceProtectionMiddleware.getMetricsMiddleware
);

/**
 * Get client status
 * GET /api/brute-force/status
 * Query params: email (optional)
 */
router.get(
    '/status',
    bruteForceProtectionMiddleware.getClientStatusMiddleware
);

/**
 * Unlock account
 * POST /api/brute-force/unlock
 * Body: { clientId: string }
 */
router.post(
    '/unlock',
    adminOnly,
    bruteForceProtectionMiddleware.unlockAccountMiddleware
);

/**
 * Clear client data
 * POST /api/brute-force/clear
 * Body: { clientId: string }
 */
router.post(
    '/clear',
    adminOnly,
    bruteForceProtectionMiddleware.clearClientDataMiddleware
);

/**
 * Get configuration
 * GET /api/brute-force/config
 */
router.get(
    '/config',
    adminOnly,
    (req, res) => {
        const config = require('../services/bruteForceProtection.service').getConfig();
        res.json({
            success: true,
            data: config
        });
    }
);

/**
 * Update configuration
 * PUT /api/brute-force/config
 * Body: { maxAttempts, lockoutDuration, windowDuration, ipRateLimit, ipRateLimitWindow }
 */
router.put(
    '/config',
    adminOnly,
    (req, res) => {
        try {
            const { maxAttempts, lockoutDuration, windowDuration, ipRateLimit, ipRateLimitWindow } = req.body;

            const config = {};
            if (maxAttempts !== undefined) config.maxAttempts = maxAttempts;
            if (lockoutDuration !== undefined) config.lockoutDuration = lockoutDuration;
            if (windowDuration !== undefined) config.windowDuration = windowDuration;
            if (ipRateLimit !== undefined) config.ipRateLimit = ipRateLimit;
            if (ipRateLimitWindow !== undefined) config.ipRateLimitWindow = ipRateLimitWindow;

            require('../services/bruteForceProtection.service').configure(config);

            res.json({
                success: true,
                message: 'Configuration updated',
                config
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update configuration',
                error: error.message
            });
        }
    }
);

module.exports = router;
