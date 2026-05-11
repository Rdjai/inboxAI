const bruteForceProtection = require('../services/bruteForceProtection.service');
const logger = require('../utils/logger');

/**
 * Brute-force protection middleware
 */
class BruteForceProtectionMiddleware {
    /**
     * Login attempt middleware
     */
    async loginAttemptMiddleware(req, res, next) {
        try {
            const { email } = req.body;

            // Get client identifier
            const clientId = bruteForceProtection.getClientIdentifier(req, email);

            // Check login attempt
            const checkResult = await bruteForceProtection.checkLoginAttempt(req, email);

            if (!checkResult.allowed) {
                // Log the blocked attempt
                logger.warn(`Blocked login attempt: ${checkResult.code}`, {
                    clientId,
                    ip: req.ip,
                    email,
                    timestamp: new Date().toISOString()
                });

                // Return appropriate response
                if (checkResult.code === 'ACCOUNT_LOCKED') {
                    return res.status(423).json({
                        success: false,
                        message: checkResult.reason,
                        retryAfter: checkResult.retryAfter,
                        code: checkResult.code
                    });
                }

                if (checkResult.code === 'RATE_LIMITED') {
                    return res.status(429).json({
                        success: false,
                        message: checkResult.reason,
                        retryAfter: checkResult.retryAfter,
                        code: checkResult.code
                    });
                }

                if (checkResult.code === 'MAX_ATTEMPTS_EXCEEDED') {
                    return res.status(429).json({
                        success: false,
                        message: checkResult.reason,
                        retryAfter: checkResult.retryAfter,
                        code: checkResult.code
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: checkResult.reason,
                    code: checkResult.code
                });
            }

            // Store client ID for later use
            req.clientId = checkResult.clientId;
            req.email = email;

            next();
        } catch (error) {
            logger.error('Brute-force protection middleware error:', error);
            next(error);
        }
    }

    /**
     * Login success middleware
     */
    async loginSuccessMiddleware(req, res, next) {
        try {
            const clientId = req.clientId;
            const email = req.email;

            if (clientId) {
                // Reset failed attempts on successful login
                bruteForceProtection.resetFailedAttempts(clientId);

                logger.info('Login successful', {
                    clientId,
                    email,
                    ip: req.ip,
                    timestamp: new Date().toISOString()
                });
            }

            next();
        } catch (error) {
            logger.error('Login success middleware error:', error);
            next(error);
        }
    }

    /**
     * Login failure middleware
     */
    async loginFailureMiddleware(req, res, next) {
        try {
            const clientId = req.clientId;
            const email = req.email;

            if (clientId) {
                // Record failed attempt
                const attemptData = bruteForceProtection.recordAttempt(clientId, false, req);

                logger.warn('Login failed', {
                    clientId,
                    email,
                    ip: req.ip,
                    attempts: attemptData.attempts,
                    remaining: attemptData.remaining,
                    locked: attemptData.locked,
                    timestamp: new Date().toISOString()
                });

                // Store attempt data for response
                req.loginAttemptData = attemptData;
            }

            next();
        } catch (error) {
            logger.error('Login failure middleware error:', error);
            next(error);
        }
    }

    /**
     * Rate limit middleware (for all endpoints)
     */
    async rateLimitMiddleware(req, res, next) {
        try {
            const clientId = bruteForceProtection.getClientIdentifier(req);

            // Check if rate limited
            if (bruteForceProtection.isRateLimited(clientId)) {
                bruteForceProtection.metrics.ipRateLimited++;
                bruteForceProtection.metrics.suspiciousActivities++;

                logger.warn('Rate limit exceeded', {
                    clientId,
                    ip: req.ip,
                    endpoint: req.path,
                    timestamp: new Date().toISOString()
                });

                return res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please try again later.',
                    retryAfter: bruteForceProtection.config.ipRateLimitWindow,
                    code: 'RATE_LIMITED'
                });
            }

            // Increment rate limit counter
            bruteForceProtection.incrementRateLimit(clientId);

            next();
        } catch (error) {
            logger.error('Rate limit middleware error:', error);
            next(error);
        }
    }

    /**
     * Suspicious activity middleware
     */
    async suspiciousActivityMiddleware(req, res, next) {
        try {
            const clientId = bruteForceProtection.getClientIdentifier(req);

            // Check for suspicious patterns
            const suspiciousPatterns = [
                { pattern: /admin|root|administrator/i, reason: 'Admin account targeting' },
                { pattern: /password|secret|token/i, reason: 'Sensitive field access' },
                { pattern: /\.\.\/|\.\.\\/i, reason: 'Path traversal attempt' },
                { pattern: /<script|javascript:/i, reason: 'XSS attempt' },
                { pattern: /union.*select|drop.*table/i, reason: 'SQL injection attempt' }
            ];

            const requestString = JSON.stringify({
                path: req.path,
                query: req.query,
                body: req.body,
                headers: req.headers
            });

            for (const { pattern, reason } of suspiciousPatterns) {
                if (pattern.test(requestString)) {
                    const lockoutResult = bruteForceProtection.recordSuspiciousActivity(
                        clientId,
                        reason,
                        { pattern: pattern.toString() }
                    );

                    return res.status(403).json({
                        success: false,
                        message: 'Suspicious activity detected. Account locked.',
                        lockout: lockoutResult,
                        code: 'SUSPICIOUS_ACTIVITY'
                    });
                }
            }

            next();
        } catch (error) {
            logger.error('Suspicious activity middleware error:', error);
            next(error);
        }
    }

    /**
     * Get client status middleware
     */
    async getClientStatusMiddleware(req, res, next) {
        try {
            const clientId = bruteForceProtection.getClientIdentifier(req);
            const status = bruteForceProtection.getClientStatus(clientId);

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            logger.error('Get client status middleware error:', error);
            next(error);
        }
    }

    /**
     * Unlock account middleware
     */
    async unlockAccountMiddleware(req, res, next) {
        try {
            const { clientId } = req.body;

            if (!clientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Client ID is required'
                });
            }

            const result = bruteForceProtection.unlock(clientId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Unlock account middleware error:', error);
            next(error);
        }
    }

    /**
     * Get metrics middleware
     */
    async getMetricsMiddleware(req, res, next) {
        try {
            const metrics = bruteForceProtection.getMetrics();

            res.json({
                success: true,
                data: metrics
            });
        } catch (error) {
            logger.error('Get metrics middleware error:', error);
            next(error);
        }
    }

    /**
     * Clear client data middleware
     */
    async clearClientDataMiddleware(req, res, next) {
        try {
            const { clientId } = req.body;

            if (!clientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Client ID is required'
                });
            }

            const result = bruteForceProtection.clearClientData(clientId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Clear client data middleware error:', error);
            next(error);
        }
    }

    /**
     * Configure middleware
     */
    configureMiddleware(options = {}) {
        bruteForceProtection.configure(options);

        return (req, res, next) => {
            next();
        };
    }

    /**
     * Get middleware instance
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new BruteForceProtectionMiddleware();
        }
        return this.instance;
    }
}

// Export singleton instance
module.exports = BruteForceProtectionMiddleware.getInstance();
