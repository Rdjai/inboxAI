const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/user.model');
const { ROLES, PERMISSIONS } = require('../utils/constants');
const permissionService = require('../services/permission.service');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated.'
            });
        }

        // Add permission helper methods to user object
        user.hasPermission = (permission) => permissionService.hasPermission(user, permission);
        user.hasAnyPermission = (permissions) => permissionService.hasAnyPermission(user, permissions);
        user.hasAllPermissions = (permissions) => permissionService.hasAllPermissions(user, permissions);
        user.canManageRole = (targetRole) => permissionService.canManageRole(user.role, targetRole);

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        logger.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

/**
 * Role-based middleware (legacy support)
 * @param {...string} roles - Allowed roles
 */
const roleMiddleware = (...roles) => {
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
                current: req.user.role
            });
        }

        next();
    };
};

/**
 * Permission-based middleware (new enhanced system)
 * @param {...string} permissions - Required permissions
 */
const permissionMiddleware = (...permissions) => {
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
                userPermissions: permissionService.getUserPermissions(req.user.role)
            });
        }

        next();
    };
};

/**
 * Require all specified permissions
 * @param {...string} permissions - Required permissions (all must be present)
 */
const requireAllPermissions = (...permissions) => {
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
                userRole: req.user.role
            });
        }

        next();
    };
};

/**
 * Admin-only middleware
 */
const adminOnly = (req, res, next) => {
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
            userRole: req.user.role
        });
    }

    next();
};

/**
 * Resource ownership middleware
 * Checks if user owns resource or has permission to access all resources
 */
const resourceOwnership = (resourceField = 'assignedUserId', permission = PERMISSIONS.EMAIL_VIEW_ALL) => {
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
};

/**
 * Conditional permission middleware
 * Applies different permissions based on conditions
 */
const conditionalPermission = (conditions) => {
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
                userRole: req.user.role
            });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    roleMiddleware,
    permissionMiddleware,
    requireAllPermissions,
    adminOnly,
    resourceOwnership,
    conditionalPermission
};