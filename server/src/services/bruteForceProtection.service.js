// src/services/bruteForceProtection.service.js
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

/**
 * Brute-force login protection service
 * Implements rate limiting, account lockout, and security monitoring
 */
class BruteForceProtectionService {
    constructor() {
        // Configuration
        this.config = {
            maxAttempts: 5,              // Max failed attempts before lockout
            lockoutDuration: 900,        // Lockout duration in seconds (15 minutes)
            windowDuration: 300,         // Time window in seconds (5 minutes)
            ipRateLimit: 100,            // Max requests per IP per window
            ipRateLimitWindow: 60,       // IP rate limit window in seconds
            failedAttemptsCacheTTL: 3600 // Cache TTL for failed attempts
        };

        // In-memory storage
        this.failedAttempts = new NodeCache({ stdTTL: this.config.failedAttemptsCacheTTL });
        this.ipRateLimits = new NodeCache({ stdTTL: this.config.ipRateLimitWindow });
        this.lockouts = new NodeCache({ stdTTL: this.config.lockoutDuration });
        this.metrics = {
            totalAttempts: 0,
            successfulLogins: 0,
            failedLogins: 0,
            lockouts: 0,
            ipRateLimited: 0,
            suspiciousActivities: 0
        };
    }

    /**
     * Configure the service
     */
    configure(options = {}) {
        this.config = { ...this.config, ...options };

        // Update cache TTLs
        this.failedAttempts = new NodeCache({
            stdTTL: this.config.failedAttemptsCacheTTL
        });

        logger.info('Brute-force protection configured:', this.config);
    }

    /**
     * Get client identifier (IP or user-specific)
     */
    getClientIdentifier(req, userId = null) {
        // Use user ID if available, otherwise use IP
        if (userId) {
            return `user:${userId}`;
        }
        return `ip:${req.ip || req.connection.remoteAddress || 'unknown'}`;
    }

    /**
     * Check if client is rate limited
     */
    isRateLimited(clientId) {
        const currentCount = this.ipRateLimits.get(clientId) || 0;
        return currentCount >= this.config.ipRateLimit;
    }

    /**
     * Increment rate limit counter
     */
    incrementRateLimit(clientId) {
        const currentCount = this.ipRateLimits.get(clientId) || 0;
        this.ipRateLimits.set(clientId, currentCount + 1, this.config.ipRateLimitWindow);
        return currentCount + 1;
    }

    /**
     * Check if user is locked out
     */
    isLockedOut(clientId) {
        const lockoutData = this.lockouts.get(clientId);

        if (!lockoutData) {
            return false;
        }

        const now = Date.now();
        if (now >= lockoutData.unlockTime) {
            // Lockout expired, remove it
            this.lockouts.del(clientId);
            return false;
        }

        return true;
    }

    /**
     * Get remaining lockout time
     */
    getRemainingLockoutTime(clientId) {
        const lockoutData = this.lockouts.get(clientId);

        if (!lockoutData) {
            return 0;
        }

        const now = Date.now();
        const remaining = Math.ceil((lockoutData.unlockTime - now) / 1000);

        return Math.max(0, remaining);
    }

    /**
     * Lock out a user/IP
     */
    lockOut(clientId, duration = this.config.lockoutDuration) {
        const unlockTime = Date.now() + (duration * 1000);
        this.lockouts.set(clientId, { unlockTime, lockedAt: Date.now() });

        this.metrics.lockouts++;
        logger.warn(`Account/IP locked out: ${clientId} for ${duration}s`);

        return {
            locked: true,
            duration,
            unlockTime
        };
    }

    /**
     * Unlock a user/IP
     */
    unlock(clientId) {
        this.lockouts.del(clientId);
        logger.info(`Account/IP unlocked: ${clientId}`);

        return { unlocked: true };
    }

    /**
     * Check if user has exceeded failed attempts
     */
    hasExceededAttempts(clientId) {
        const attempts = this.getFailedAttempts(clientId);
        return attempts >= this.config.maxAttempts;
    }

    /**
     * Get failed attempts count
     */
    getFailedAttempts(clientId) {
        return this.failedAttempts.get(clientId) || 0;
    }

    /**
     * Increment failed attempts
     */
    incrementFailedAttempts(clientId) {
        const currentCount = this.getFailedAttempts(clientId);
        const newCount = currentCount + 1;

        this.failedAttempts.set(clientId, newCount, this.config.windowDuration);

        this.metrics.failedLogins++;

        return {
            attempts: newCount,
            maxAttempts: this.config.maxAttempts,
            remaining: this.config.maxAttempts - newCount
        };
    }

    /**
     * Reset failed attempts
     */
    resetFailedAttempts(clientId) {
        this.failedAttempts.del(clientId);
        this.metrics.successfulLogins++;

        return { reset: true };
    }

    /**
     * Record login attempt
     */
    recordAttempt(clientId, success, req = null) {
        this.metrics.totalAttempts++;

        if (success) {
            this.resetFailedAttempts(clientId);
            return { success: true, message: 'Login successful' };
        } else {
            const attemptData = this.incrementFailedAttempts(clientId);

            // Check if we should lock out
            if (attemptData.attempts >= this.config.maxAttempts) {
                const lockoutResult = this.lockOut(clientId);
                return {
                    success: false,
                    locked: true,
                    attempts: attemptData.attempts,
                    lockout: lockoutResult
                };
            }

            return {
                success: false,
                locked: false,
                attempts: attemptData.attempts,
                remaining: attemptData.remaining
            };
        }
    }

    /**
     * Check login attempt (comprehensive check)
     */
    async checkLoginAttempt(req, email = null) {
        const clientId = this.getClientIdentifier(req, email);

        // Check IP rate limit
        if (this.isRateLimited(clientId)) {
            this.metrics.ipRateLimited++;
            this.metrics.suspiciousActivities++;

            return {
                allowed: false,
                reason: 'Rate limit exceeded',
                retryAfter: this.config.ipRateLimitWindow,
                code: 'RATE_LIMITED'
            };
        }

        // Check if locked out
        if (this.isLockedOut(clientId)) {
            const remaining = this.getRemainingLockoutTime(clientId);
            this.metrics.suspiciousActivities++;

            return {
                allowed: false,
                reason: 'Account is locked due to too many failed attempts',
                retryAfter: remaining,
                code: 'ACCOUNT_LOCKED'
            };
        }

        // Check if user has exceeded attempts
        if (this.hasExceededAttempts(clientId)) {
            const remaining = this.config.maxAttempts - this.getFailedAttempts(clientId);
            this.metrics.suspiciousActivities++;

            return {
                allowed: false,
                reason: 'Too many failed attempts',
                retryAfter: this.config.windowDuration,
                code: 'MAX_ATTEMPTS_EXCEEDED'
            };
        }

        // Increment rate limit counter
        this.incrementRateLimit(clientId);

        return {
            allowed: true,
            clientId
        };
    }

    /**
     * Record suspicious activity
     */
    recordSuspiciousActivity(clientId, type, details = {}) {
        this.metrics.suspiciousActivities++;

        logger.warn(`Suspicious activity detected: ${type}`, {
            clientId,
            details,
            timestamp: new Date().toISOString()
        });

        // Lock out for suspicious activity
        this.lockOut(clientId, 3600); // 1 hour lockout for suspicious activity

        return {
            locked: true,
            duration: 3600,
            reason: 'Suspicious activity detected'
        };
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            config: this.config,
            activeLockouts: this.lockouts.keys().length,
            activeRateLimits: this.ipRateLimits.keys().length,
            failedAttemptsCount: this.failedAttempts.keys().length
        };
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            totalAttempts: 0,
            successfulLogins: 0,
            failedLogins: 0,
            lockouts: 0,
            ipRateLimited: 0,
            suspiciousActivities: 0
        };
    }

    /**
     * Get client status
     */
    getClientStatus(clientId) {
        const failedAttempts = this.getFailedAttempts(clientId);
        const isLocked = this.isLockedOut(clientId);
        const remainingLockout = isLocked ? this.getRemainingLockoutTime(clientId) : 0;
        const isRateLimited = this.isRateLimited(clientId);

        return {
            clientId,
            failedAttempts,
            maxAttempts: this.config.maxAttempts,
            isLocked,
            remainingLockout,
            isRateLimited,
            lockoutDuration: this.config.lockoutDuration,
            windowDuration: this.config.windowDuration
        };
    }

    /**
     * Clear all data for a client
     */
    clearClientData(clientId) {
        this.failedAttempts.del(clientId);
        this.lockouts.del(clientId);
        this.ipRateLimits.del(clientId);

        return { cleared: true, clientId };
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        const failedKeys = this.failedAttempts.keys();
        const lockoutKeys = this.lockouts.keys();
        const rateLimitKeys = this.ipRateLimits.keys();

        logger.info('Brute-force protection cleanup:', {
            failedKeys: failedKeys.length,
            lockoutKeys: lockoutKeys.length,
            rateLimitKeys: rateLimitKeys.length
        });

        return {
            failedKeys: failedKeys.length,
            lockoutKeys: lockoutKeys.length,
            rateLimitKeys: rateLimitKeys.length
        };
    }

    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
}

module.exports = new BruteForceProtectionService();
