const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const User = require('../models/user.model');
const { ROLES, PERMISSIONS } = require('../utils/constants');
const permissionService = require('../services/permission.service');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const { parseJwtExpiresInToSeconds } = require('../utils/jwt');

const AUTH_STATUS_BY_CODE = {
    INVALID_FORMAT: 400,
    TOKEN_TOO_SHORT: 400,
    TOKEN_BLACKLISTED: 401,
    TOKEN_EXPIRED: 401,
    INVALID_SIGNATURE: 401,
    TOKEN_NOT_YET_VALID: 401,
    VERIFICATION_FAILED: 401,
    INVALID_PAYLOAD: 401,
    MISSING_USER_ID: 401,
    INVALID_USER_ID_FORMAT: 401,
    MISSING_IAT: 401,
    MISSING_EXP: 401,
    TOKEN_TOO_OLD: 401,
    USER_NOT_FOUND: 401,
    ACCOUNT_DEACTIVATED: 401,
    ACCOUNT_LOCKED: 401,
    EMAIL_NOT_VERIFIED: 403,
    INVALID_TOKEN_TYPE: 401,
    VALIDATION_ERROR: 500
};

class JWTValidationMiddleware {
    constructor() {
        this.tokenBlacklist = new Map();
        this.tokenBlacklistTTL = 60 * 60 * 1000;
        this.metrics = this.createEmptyMetrics();
    }

    createEmptyMetrics() {
        return {
            validTokens: 0,
            invalidTokens: 0,
            expiredTokens: 0,
            blacklistedTokens: 0,
            userNotFound: 0,
            deactivatedAccounts: 0
        };
    }

    getAuthorizationToken(headerValue) {
        if (!headerValue || typeof headerValue !== 'string') {
            return null;
        }

        const trimmed = headerValue.trim();
        if (!trimmed) {
            return null;
        }

        return trimmed.startsWith('Bearer ')
            ? trimmed.slice('Bearer '.length).trim()
            : trimmed;
    }

    buildFailure(code, error, extra = {}) {
        if (code === 'TOKEN_EXPIRED') {
            this.metrics.expiredTokens++;
        } else if (code === 'TOKEN_BLACKLISTED') {
            this.metrics.blacklistedTokens++;
        } else if (code === 'USER_NOT_FOUND') {
            this.metrics.userNotFound++;
        } else if (code === 'ACCOUNT_DEACTIVATED' || code === 'ACCOUNT_LOCKED') {
            this.metrics.deactivatedAccounts++;
        } else {
            this.metrics.invalidTokens++;
        }

        return {
            valid: false,
            error,
            code,
            ...extra
        };
    }

    attachPermissionHelpers(user) {
        if (!user) {
            return user;
        }

        user.hasPermission = (permission) => permissionService.hasPermission(user, permission);
        user.hasAnyPermission = (permissions) => permissionService.hasAnyPermission(user, permissions);
        user.hasAllPermissions = (permissions) => permissionService.hasAllPermissions(user, permissions);
        user.canManageRole = (targetRole) => permissionService.canManageRole(user.role, targetRole);

        return user;
    }

    respondWithValidationError(res, validation) {
        const statusCode = AUTH_STATUS_BY_CODE[validation.code] || 401;

        return res.status(statusCode).json({
            success: false,
            message: validation.error,
            code: validation.code,
            expiredAt: validation.expiredAt || null
        });
    }

    ensureAuthenticated(req, res) {
        if (req.user) {
            return true;
        }

        res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });

        return false;
    }

    getRequiredPermissionsFromConditions(req, conditions = []) {
        for (const condition of conditions) {
            if (typeof condition?.when === 'function' && condition.when(req)) {
                return Array.isArray(condition.permissions) ? condition.permissions : [];
            }
        }

        return [];
    }

    validatePayload(payload) {
        if (!payload?.userId) {
            return {
                valid: false,
                error: 'Missing userId in token',
                code: 'MISSING_USER_ID'
            };
        }

        if (typeof payload.userId !== 'string' || !payload.userId.match(/^[0-9a-fA-F]{24}$/)) {
            return {
                valid: false,
                error: 'Invalid userId format',
                code: 'INVALID_USER_ID_FORMAT'
            };
        }

        if (!payload.iat || typeof payload.iat !== 'number') {
            return {
                valid: false,
                error: 'Missing or invalid issued at timestamp',
                code: 'MISSING_IAT'
            };
        }

        if (!payload.exp || typeof payload.exp !== 'number') {
            return {
                valid: false,
                error: 'Missing or invalid expiration timestamp',
                code: 'MISSING_EXP'
            };
        }

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp <= now) {
            return {
                valid: false,
                error: 'Token has expired',
                code: 'TOKEN_EXPIRED',
                expiredAt: new Date(payload.exp * 1000).toISOString()
            };
        }

        const maxAgeSeconds = 365 * 24 * 60 * 60;
        if (now - payload.iat > maxAgeSeconds) {
            return {
                valid: false,
                error: 'Token is too old',
                code: 'TOKEN_TOO_OLD'
            };
        }

        const configuredMaxAge = Math.max(parseJwtExpiresInToSeconds(JWT_EXPIRES_IN), 1);
        if (now - payload.iat > configuredMaxAge) {
            return {
                valid: false,
                error: 'Token has expired',
                code: 'TOKEN_EXPIRED',
                expiredAt: new Date(payload.exp * 1000).toISOString()
            };
        }

        return { valid: true };
    }

    async getUser(userId) {
        try {
            const cacheKey = `user:${userId}`;
            const cachedUser = cacheService.get(cacheKey);
            if (cachedUser) {
                return cachedUser;
            }

            const user = await User.findById(userId).select('-password -__v');

            if (user) {
                cacheService.set(cacheKey, user, 300);
            }

            return user;
        } catch (error) {
            logger.error('Error getting user:', error);
            return null;
        }
    }

    isTokenBlacklisted(token) {
        const blacklistEntry = this.tokenBlacklist.get(token);
        if (!blacklistEntry) {
            return false;
        }

        if (Date.now() > blacklistEntry.expiry) {
            this.tokenBlacklist.delete(token);
            return false;
        }

        return true;
    }

    blacklistToken(token, ttl = this.tokenBlacklistTTL) {
        const cleanToken = this.getAuthorizationToken(token);
        if (!cleanToken) {
            return;
        }

        this.tokenBlacklist.set(cleanToken, { expiry: Date.now() + ttl });
        logger.info(`Token blacklisted: ${cleanToken.substring(0, 20)}...`);
    }

    unblacklistToken(token) {
        const cleanToken = this.getAuthorizationToken(token);
        if (!cleanToken) {
            return;
        }

        this.tokenBlacklist.delete(cleanToken);
        logger.info(`Token unblacklisted: ${cleanToken.substring(0, 20)}...`);
    }

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

    async validateToken(token, options = {}) {
        const { skipBlacklist = false, skipUserCheck = false, requireEmailVerified = false } = options;

        try {
            const cleanToken = this.getAuthorizationToken(token);
            if (!cleanToken) {
                return this.buildFailure('INVALID_FORMAT', 'Invalid token format');
            }

            if (cleanToken.length < 10) {
                return this.buildFailure('TOKEN_TOO_SHORT', 'Token is too short');
            }

            if (!skipBlacklist && this.isTokenBlacklisted(cleanToken)) {
                logger.warn(`Blacklisted token used: ${cleanToken.substring(0, 20)}...`);
                return this.buildFailure('TOKEN_BLACKLISTED', 'Token has been invalidated');
            }

            let decoded;
            try {
                decoded = jwt.verify(cleanToken, JWT_SECRET);
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    return this.buildFailure('TOKEN_EXPIRED', 'Token has expired', {
                        expiredAt: error.expiredAt
                    });
                }

                if (error.name === 'NotBeforeError') {
                    return this.buildFailure('TOKEN_NOT_YET_VALID', 'Token is not valid yet');
                }

                if (error.name === 'JsonWebTokenError') {
                    return this.buildFailure('INVALID_SIGNATURE', 'Invalid token signature');
                }

                return this.buildFailure('VERIFICATION_FAILED', 'Token verification failed');
            }

            const payloadValidation = this.validatePayload(decoded);
            if (!payloadValidation.valid) {
                return this.buildFailure(payloadValidation.code, payloadValidation.error, {
                    expiredAt: payloadValidation.expiredAt || null
                });
            }

            if (skipUserCheck) {
                this.metrics.validTokens++;
                return {
                    valid: true,
                    decoded,
                    token: cleanToken,
                    expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null
                };
            }

            const user = await this.getUser(decoded.userId);
            if (!user) {
                logger.warn(`User not found for token: ${decoded.userId}`);
                return this.buildFailure('USER_NOT_FOUND', 'User not found');
            }

            if (!user.isActive) {
                logger.warn(`Deactivated account used: ${decoded.userId}`);
                return this.buildFailure('ACCOUNT_DEACTIVATED', 'Account is deactivated');
            }

            if (user.isLocked) {
                logger.warn(`Locked account used: ${decoded.userId}`);
                return this.buildFailure('ACCOUNT_LOCKED', 'Account is locked');
            }

            if (requireEmailVerified && !user.isEmailVerified) {
                return this.buildFailure('EMAIL_NOT_VERIFIED', 'Email must be verified');
            }

            this.metrics.validTokens++;

            return {
                valid: true,
                decoded,
                token: cleanToken,
                user: this.attachPermissionHelpers(user),
                expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null
            };
        } catch (error) {
            logger.error('JWT validation error:', error);
            return this.buildFailure('VALIDATION_ERROR', 'Token validation failed');
        }
    }

    async authenticateRequest(req, res, next, options = {}) {
        try {
            const token = req.header('Authorization');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            }

            const validation = await this.validateToken(token, options);
            if (!validation.valid) {
                return this.respondWithValidationError(res, validation);
            }

            req.token = validation.token;
            req.tokenPayload = validation.decoded;
            if (validation.user) {
                req.user = validation.user;
            }

            return next();
        } catch (error) {
            logger.error('Auth middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authentication error',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    async authMiddleware(req, res, next) {
        return this.authenticateRequest(req, res, next);
    }

    async validateTokenMiddleware(req, res, next) {
        return this.authenticateRequest(req, res, next, { skipUserCheck: true });
    }

    async verifyTokenMiddleware(req, res, next) {
        return this.authenticateRequest(req, res, next);
    }

    async refreshMiddleware(req, res) {
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
                return this.respondWithValidationError(res, validation);
            }

            if (!validation.decoded.isRefreshToken) {
                return this.respondWithValidationError(res, {
                    error: 'Invalid token type',
                    code: 'INVALID_TOKEN_TYPE'
                });
            }

            const newAccessToken = jwt.sign(
                {
                    userId: validation.decoded.userId,
                    role: validation.decoded.role,
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + parseJwtExpiresInToSeconds(JWT_EXPIRES_IN)
                },
                JWT_SECRET
            );

            this.blacklistToken(refreshToken);

            return res.json({
                success: true,
                accessToken: newAccessToken,
                expiresIn: parseJwtExpiresInToSeconds(JWT_EXPIRES_IN)
            });
        } catch (error) {
            logger.error('Token refresh error:', error);
            return res.status(500).json({
                success: false,
                message: 'Token refresh failed'
            });
        }
    }

    async invalidateTokenMiddleware(req, res) {
        try {
            const token = req.header('Authorization');
            const cleanToken = this.getAuthorizationToken(token);

            if (!cleanToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Token is required'
                });
            }

            this.blacklistToken(cleanToken);

            return res.json({
                success: true,
                message: 'Token has been invalidated'
            });
        } catch (error) {
            logger.error('Token invalidation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Token invalidation failed'
            });
        }
    }

    roleMiddleware(...roles) {
        return (req, res, next) => {
            if (!this.ensureAuthenticated(req, res)) {
                return;
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

            return next();
        };
    }

    permissionMiddleware(...permissions) {
        return (req, res, next) => {
            if (!this.ensureAuthenticated(req, res)) {
                return;
            }

            if (!permissionService.hasAnyPermission(req.user, permissions)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions.',
                    required: permissions,
                    userRole: req.user.role,
                    userPermissions: permissionService.getUserPermissions(req.user.role),
                    availablePermissions: Object.values(PERMISSIONS)
                });
            }

            return next();
        };
    }

    requireAllPermissions(...permissions) {
        return (req, res, next) => {
            if (!this.ensureAuthenticated(req, res)) {
                return;
            }

            if (!permissionService.hasAllPermissions(req.user, permissions)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions. All specified permissions required.',
                    required: permissions,
                    userRole: req.user.role,
                    userPermissions: permissionService.getUserPermissions(req.user.role)
                });
            }

            return next();
        };
    }

    adminOnly(req, res, next) {
        if (!this.ensureAuthenticated(req, res)) {
            return;
        }

        if (req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({
                success: false,
                message: 'Administrator access required.',
                userRole: req.user.role,
                requiredRole: ROLES.ADMIN
            });
        }

        return next();
    }

    resourceOwnership(resourceField = 'assignedUserId', permission = PERMISSIONS.EMAIL_VIEW_ALL) {
        return (req, res, next) => {
            if (!this.ensureAuthenticated(req, res)) {
                return;
            }

            if (req.user.role === ROLES.ADMIN || permissionService.hasPermission(req.user, permission)) {
                return next();
            }

            req.requireOwnership = {
                field: resourceField,
                userId: req.user._id
            };

            return next();
        };
    }

    conditionalPermission(conditions) {
        return (req, res, next) => {
            if (!this.ensureAuthenticated(req, res)) {
                return;
            }

            const requiredPermissions = this.getRequiredPermissionsFromConditions(req, conditions);
            if (requiredPermissions.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'No applicable permissions found.'
                });
            }

            if (!permissionService.hasAnyPermission(req.user, requiredPermissions)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions for this operation.',
                    required: requiredPermissions,
                    userRole: req.user.role,
                    userPermissions: permissionService.getUserPermissions(req.user.role)
                });
            }

            return next();
        };
    }

    getMetrics() {
        const total = Object.values(this.metrics).reduce((sum, value) => sum + value, 0);

        return {
            ...this.metrics,
            total,
            validRate: total > 0 ? `${((this.metrics.validTokens / total) * 100).toFixed(2)}%` : '0%',
            invalidRate: total > 0 ? `${((this.metrics.invalidTokens / total) * 100).toFixed(2)}%` : '0%',
            blacklistCount: this.tokenBlacklist.size
        };
    }

    resetMetrics() {
        this.metrics = this.createEmptyMetrics();
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new JWTValidationMiddleware();
        }

        return this.instance;
    }
}

module.exports = JWTValidationMiddleware.getInstance();
