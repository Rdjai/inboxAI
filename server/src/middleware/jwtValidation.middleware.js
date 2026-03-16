// src/middleware/jwtValidation.middleware.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const User = require('../models/user.model');
const { ROLES, PERMISSIONS } = require('../utils/constants');
const permissionService = require('../services/permission.service');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const { parseJwtExpiresInToSeconds } = require('../utils/jwt');

/**
 * Enhanced JWT validation middleware with comprehensive security features
 */
class JWTValidationMiddleware {
    constructor() {
        this.tokenBlacklist = new Map();
        this.tokenBlacklistTTL = 3600000; // 1 hour in milliseconds
        this.metrics = {
            validTokens: 0,
            invalidTokens: 0,
            expiredTokens: 0,
            blacklistedTokens: 0,
            userNotFound: 0,
            deactivatedAccounts: 0
        };
    }

    /**
     * Validate JWT token with comprehensive checks
     */
    async validateToken(token, options = {}) {
        const { skipBlacklist = false, skipUserCheck = false } = options;

        try {
            // Token format validation
            if (!token || typeof token !== 'string') {
                return {
                    valid: false,
                    error: 'Invalid token format',
                    code: 'INVALID_FORMAT'
                };
            }

            const cleanToken = token.startsWith('Bearer ')
                ? token.slice('Bearer '.length).trim()
                : token.trim();

            // Token structure validation
            if (!cleanToken || cleanToken.length < 10) {
                return {
                    valid: false,
                    error: 'Token is too short',
                    code: 'TOKEN_TOO_SHORT'
                };
            }

            // Check token blacklist
            if (!skipBlacklist && this.isTokenBlacklisted(cleanToken)) {
                this.metrics.blacklistedTokens++;
                logger.warn(`Blacklisted token used: ${cleanToken.substring(0, 20)}...`);
                return {
                    valid: false,
                    error: 'Token has been invalidated',
                    code: 'TOKEN_BLACKLISTED'
                };
            }

            // Verify token signature and decode
            let decoded;
            try {
                decoded = jwt.verify(cleanToken, JWT_SECRET);
            } catch (verifyError) {
                if (verifyError.name === 'TokenExpiredError') {
                    this.metrics.expiredTokens++;
                    return {
                        valid: false,
                        error: 'Token has expired',
                        code: 'TOKEN_EXPIRED',
                        expiredAt: verifyError.expiredAt
                    };
                }

                if (verifyError.name === 'NotBeforeError') {
                    this.metrics.invalidTokens++;
                    return {
                        valid: false,
                        error: 'Token is not valid yet',
                        code: 'TOKEN_NOT_YET_VALID'
                    };
                }

                if (verifyError.name === 'JsonWebTokenError') {
                    this.metrics.invalidTokens++;
                    return {
                        valid: false,
                        error: 'Invalid token signature',
                        code: 'INVALID_SIGNATURE'
                    };
                }

                this.metrics.invalidTokens++;
                return {
                    valid: false,
                    error: 'Token verification failed',
                    code: 'VERIFICATION_FAILED'
                };
            }

            // Validate token payload structure
            if (!decoded || !decoded.userId) {
                this.metrics.invalidTokens++;
                return {
                    valid: false,
                    error: 'Invalid token payload',
                    code: 'INVALID_PAYLOAD'
                };
            }

            // Validate token payload fields
            const payloadValidation = this.validatePayload(decoded);
            if (!payloadValidation.valid) {
                this.metrics.invalidTokens++;
                return payloadValidation;
            }

            // Check if user exists
            if (!skipUserCheck) {
                const user = await this.getUser(decoded.userId);
                if (!user) {
                    this.metrics.userNotFound++;
                    logger.warn(`User not found for token: ${decoded.userId}`);
                    return {
                        valid: false,
                        error: 'User not found',
                        code: 'USER_NOT_FOUND'
                    };
                }

                // Check if user is active
                if (!user.isActive) {
                    this.metrics.deactivatedAccounts++;
                    logger.warn(`Deactivated account used: ${decoded.userId}`);
                    return {
                        valid: false,
                        error: 'Account is deactivated',
                        code: 'ACCOUNT_DEACTIVATED'
                    };
                }

                // Check if user is locked
                if (user.isLocked) {
                    this.metrics.deactivatedAccounts++;
                    logger.warn(`Locked account used: ${decoded.userId}`);
                    return {
                        valid: false,
                        error: 'Account is locked',
                        code: 'ACCOUNT_LOCKED'
                    };
                }

                // Check if user's email is verified (if required)
                if (options.requireEmailVerified && !user.isEmailVerified) {
                    return {
                        valid: false,
                        error: 'Email must be verified',
                        code: 'EMAIL_NOT_VERIFIED'
                    };
                }

                // Add permission helper methods to user object
                user.hasPermission = (permission) => permissionService.hasPermission(user, permission);
                user.hasAnyPermission = (permissions) => permissionService.hasAnyPermission(user, permissions);
                user.hasAllPermissions = (permissions) => permissionService.hasAllPermissions(user, permissions);
                user.canManageRole = (targetRole) => permissionService.canManageRole(user.role, targetRole);

                return {
                    valid: true,
                    decoded,
                    user,
                    token: cleanToken
                };
            }

            return {
                valid: true,
                decoded,
                token: cleanToken,
                expiresAt: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null
            };

        } catch (error) {
            logger.error('JWT validation error:', error);
            this.metrics.invalidTokens++;
            return {
                valid: false,
                error: 'Token validation failed',
                code: 'VALIDATION_ERROR'
            };
        }
    }

    /**
     * Validate token payload structure
     */
    validatePayload(payload) {
        // Validate required fields
        if (!payload.userId) {
            return {
                valid: false,
                error: 'Missing userId in token',
                code: 'MISSING_USER_ID'
            };
        }

        // Validate userId format (MongoDB ObjectId)
        if (typeof payload.userId !== 'string' || !payload.userId.match(/^[0-9a-fA-F]{24}$/)) {
            return {
                valid: false,
                error: 'Invalid userId format',
                code: 'INVALID_USER_ID_FORMAT'
            };
        }

        // Validate iat (issued at) timestamp
        if (!payload.iat || typeof payload.iat !== 'number') {
            return {
                valid: false,
                error: 'Missing or invalid issued at timestamp',
                code: 'MISSING_IAT'
            };
        }

        // Validate exp (expiration) timestamp
        if (!payload.exp || typeof payload.exp !== 'number') {
            return {
                valid: false,
                error: 'Missing or invalid expiration timestamp',
                code: 'MISSING_EXP'
            };
        }

        // Check if token is not expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp <= now) {
            return {
                valid: false,
                error: 'Token has expired',
                code: 'TOKEN_EXPIRED'
            };
        }

        // Check if token is not too old (prevent token reuse attacks)
        const maxAge = 365 * 24 * 60 * 60; // 1 year max
        if (now - payload.iat > maxAge) {
            return {
                valid: false,
                error: 'Token is too old',
                code: 'TOKEN_TOO_OLD'
            };
        }

        // Validate token age (prevent replay attacks)
        const maxTokenAge = Math.max(parseJwtExpiresInToSeconds(JWT_EXPIRES_IN), 1);
        if (now - payload.iat > maxTokenAge) {
            return {
                valid: false,
                error: 'Token has expired',
                code: 'TOKEN_EXPIRED'
            };
        }

        return { valid: true };
    }

    /**
     * Get user from database
     */
    async getUser(userId) {
        try {
            // Check cache first
            const cacheKey = `user:${userId}`;
            const cachedUser = cacheService.get(cacheKey);
            if (cachedUser) {
                return cachedUser;
            }

            const user = await User.findById(userId).select('-password -__v');

            if (user) {
                // Cache user for 5 minutes
                cacheService.set(cacheKey, user, 300);
            }

            return user;
        } catch (error) {
            logger.error('Error getting user:', error);
            return null;
        }
    }

    /**
     * Check if token is blacklisted
     */
    isTokenBlacklisted(token) {
        const now = Date.now();
        const blacklistEntry = this.tokenBlacklist.get(token);

        if (!blacklistEntry) {
            return false;
        }

        // Clean up expired blacklist entries
        if (now > blacklistEntry.expiry) {
            this.tokenBlacklist.delete(token);
            return false;
        }

        return true;
    }

    /**
     * Blacklist a token
     */
    blacklistToken(token, ttl = this.tokenBlacklistTTL) {
        const expiry = Date.now() + ttl;
        this.tokenBlacklist.set(token, { expiry });
        logger.info(`Token blacklisted: ${token.substring(0, 20)}...`);
    }

    /**
     * Unblacklist a token
     */
    unblacklistToken(token) {
        this.tokenBlacklist.delete(token);
        logger.info(`Token unblacklisted: ${token.substring(0, 20)}...`);
    }

    /**
     * Clean up expired blacklist entries
     */
    cleanupBlacklist() {
        const now = Date.now();
        let cleaned = 0;

        for (const [token, entry] of this.tokenBlacklist.entries()) {
            if (now > entry.expiry) {
                this.tokenBlacklist.delete(token);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.info(`Cleaned up ${cleaned} expired blacklist entries`);
        }

        return cleaned;
    }

    /**
     * Get metrics
     */
    getMetrics() {
        const total = this.metrics.validTokens + this.metrics.invalidTokens + this.metrics.expiredTokens +
            this.metrics.blacklistedTokens + this.metrics.userNotFound + this.metrics.deactivatedAccounts;

        return {
            ...this.metrics,
            total: total,
            validRate: total > 0 ? ((this.metrics.validTokens / total) * 100).toFixed(2) + '%' : '0%',
            invalidRate: total > 0 ? ((this.metrics.invalidTokens / total) * 100).toFixed(2) + '%' : '0%',
            blacklistCount: this.tokenBlacklist.size
        };
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            validTokens: 0,
            invalidTokens: 0,
            expiredTokens: 0,
            blacklistedTokens: 0,
            userNotFound: 0,
            deactivatedAccounts: 0
        };
    }

    /**
     * Enhanced auth middleware
     */
    async authMiddleware(req, res, next) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            }

            const validation = await this.validateToken(token);

            if (!validation.valid) {
                const errorResponses = {
                    'INVALID_FORMAT': 400,
                    'TOKEN_TOO_SHORT': 400,
                    'TOKEN_BLACKLISTED': 401,
                    'TOKEN_EXPIRED': 401,
                    'INVALID_SIGNATURE': 401,
                    'TOKEN_NOT_YET_VALID': 401,
                    'VERIFICATION_FAILED': 401,
                    'INVALID_PAYLOAD': 401,
                    'MISSING_USER_ID': 401,
                    'INVALID_USER_ID_FORMAT': 401,
                    'MISSING_IAT': 401,
                    'MISSING_EXP': 401,
                    'TOKEN_TOO_OLD': 401,
                    'USER_NOT_FOUND': 401,
                    'ACCOUNT_DEACTIVATED': 401,
                    'ACCOUNT_LOCKED': 401,
                    'EMAIL_NOT_VERIFIED': 403,
                    'VALIDATION_ERROR': 500
                };

                const statusCode = errorResponses[validation.code] || 401;

                return res.status(statusCode).json({
                    success: false,
                    message: validation.error,
                    code: validation.code
                });
            }

            this.metrics.validTokens++;

            // Add permission helper methods to user object
            validation.user.hasPermission = (permission) => permissionService.hasPermission(validation.user, permission);
            validation.user.hasAnyPermission = (permissions) => permissionService.hasAnyPermission(validation.user, permissions);
            validation.user.hasAllPermissions = (permissions) => permissionService.hasAllPermissions(validation.user, permissions);
            validation.user.canManageRole = (targetRole) => permissionService.canManageRole(validation.user.role, targetRole);

            req.user = validation.user;
            req.token = validation.token;
            req.tokenPayload = validation.decoded;

            next();
        } catch (error) {
            logger.error('Auth middleware error:', error);
            this.metrics.invalidTokens++;

            return res.status(500).json({
                success: false,
                message: 'Authentication error',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    /**
     * Token refresh middleware
     */
    async refreshMiddleware(req, res, next) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            const validation = await this.validateToken(refreshToken);

            if (!validation.valid) {
                return res.status(401).json({
                    success: false,
                    message: validation.error,
                    code: validation.code
                });
            }

            // Check if refresh token is valid (different from access token)
            if (!validation.decoded.isRefreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token type',
                    code: 'INVALID_TOKEN_TYPE'
                });
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
                {
                    userId: validation.decoded.userId,
                    role: validation.decoded.role,
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + parseJwtExpiresInToSeconds(JWT_EXPIRES_IN)
                },
                JWT_SECRET
            );

            // Invalidate old refresh token
            this.blacklistToken(refreshToken);

            res.json({
                success: true,
                accessToken: newAccessToken,
                expiresIn: parseJwtExpiresInToSeconds(JWT_EXPIRES_IN)
            });
        } catch (error) {
            logger.error('Token refresh error:', error);
            res.status(500).json({
                success: false,
                message: 'Token refresh failed'
            });
        }
    }

    /**
     * Token invalidation middleware
     */
    async invalidateTokenMiddleware(req, res, next) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token is required'
                });
            }

            // Blacklist the token
            this.blacklistToken(token);

            res.json({
                success: true,
                message: 'Token has been invalidated'
            });
        } catch (error) {
            logger.error('Token invalidation error:', error);
            res.status(500).json({
                success: false,
                message: 'Token invalidation failed'
            });
        }
    }

    /**
     * Token validation middleware (for public endpoints)
     */
    async validateTokenMiddleware(req, res, next) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            }

            const validation = await this.validateToken(token, { skipUserCheck: true });

            if (!validation.valid) {
                return res.status(401).json({
                    success: false,
                    message: validation.error,
                    code: validation.code
                });
            }

            req.tokenPayload = validation.decoded;
            req.token = validation.token;

            next();
        } catch (error) {
            logger.error('Token validation error:', error);
            res.status(500).json({
                success: false,
                message: 'Token validation failed'
            });
        }
    }

    /**
     * Role-based middleware (enhanced)
     */
    roleMiddleware(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions.',
                    required: roles,
                    current: req.user.role,
                    availableRoles: Object.values(ROLES)
                });
            }

            next();
        };
    }

    /**
     * Permission-based middleware (enhanced)
     */
    permissionMiddleware(...permissions) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }

            const hasPermission = permissionService.hasAnyPermission(req.user, permissions);

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions.',
                    required: permissions,
                    userRole: req.user.role,
                    userPermissions: permissionService.getUserPermissions(req.user.role),
                    availablePermissions: Object.values(PERMISSIONS)
                });
            }

            next();
        };
    }

    /**
     * Require all specified permissions (enhanced)
     */
    requireAllPermissions(...permissions) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }

            const hasAllPermissions = permissionService.hasAllPermissions(req.user, permissions);

            if (!hasAllPermissions) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions. All specified permissions required.',
                    required: permissions,
                    userRole: req.user.role,
                    userPermissions: permissionService.getUserPermissions(req.user.role)
                });
            }

            next();
        };
    }

    /**
     * Admin-only middleware (enhanced)
     */
    adminOnly(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({
                success: false,
                message: 'Administrator access required.',
                userRole: req.user.role,
                requiredRole: ROLES.ADMIN
            });
        }

        next();
    }

    /**
     * Resource ownership middleware (enhanced)
     */
    resourceOwnership(resourceField = 'assignedUserId', permission = PERMISSIONS.EMAIL_VIEW_ALL) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }

            // Admin can access everything
            if (req.user.role === ROLES.ADMIN) {
                return next();
            }

            // Check if user has permission to access all resources
            if (permissionService.hasPermission(req.user, permission)) {
                return next();
            }

            // Add ownership check to request for later validation
            req.requireOwnership = {
                field: resourceField,
                userId: req.user._id
            };

            next();
        };
    }

    /**
     * Conditional permission middleware (enhanced)
     */
    conditionalPermission(conditions) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }

            let requiredPermissions = [];

            // Evaluate conditions
            for (const condition of conditions) {
                if (condition.when(req)) {
                    requiredPermissions = condition.permissions;
                    break;
                }
            }

            if (requiredPermissions.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'No applicable permissions found.'
                });
            }

            const hasPermission = permissionService.hasAnyPermission(req.user, requiredPermissions);

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions for this operation.',
                    required: requiredPermissions,
                    userRole: req.user.role,
                    userPermissions: permissionService.getUserPermissions(req.user.role)
                });
            }

            next();
        };
    }

    /**
     * Token verification middleware (for public endpoints)
     */
    async verifyTokenMiddleware(req, res, next) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            }

            const validation = await this.validateToken(token);

            if (!validation.valid) {
                return res.status(401).json({
                    success: false,
                    message: validation.error,
                    code: validation.code
                });
            }

            req.tokenPayload = validation.decoded;
            req.token = validation.token;

            next();
        } catch (error) {
            logger.error('Token verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Token verification failed'
            });
        }
    }

    /**
     * Get middleware instance
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new JWTValidationMiddleware();
        }
        return this.instance;
    }
}

// Export singleton instance
module.exports = JWTValidationMiddleware.getInstance();
