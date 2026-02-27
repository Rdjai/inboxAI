// src/services/permission.service.js
const { ROLES, PERMISSIONS, ROLE_PERMISSIONS, ROLE_HIERARCHY } = require('../utils/constants');
const logger = require('../utils/logger');

class PermissionService {
    /**
     * Check if a user has a specific permission
     * @param {Object} user - User object with role
     * @param {string} permission - Permission to check
     * @returns {boolean} - Whether user has permission
     */
    hasPermission(user, permission) {
        if (!user || !user.role) {
            return false;
        }

        const userPermissions = this.getUserPermissions(user.role);
        return userPermissions.includes(permission);
    }

    /**
     * Check if user has any of the specified permissions
     * @param {Object} user - User object
     * @param {Array} permissions - Array of permissions to check
     * @returns {boolean} - Whether user has any of the permissions
     */
    hasAnyPermission(user, permissions) {
        return permissions.some(permission => this.hasPermission(user, permission));
    }

    /**
     * Check if user has all specified permissions
     * @param {Object} user - User object
     * @param {Array} permissions - Array of permissions to check
     * @returns {boolean} - Whether user has all permissions
     */
    hasAllPermissions(user, permissions) {
        return permissions.every(permission => this.hasPermission(user, permission));
    }

    /**
     * Get all permissions for a role
     * @param {string} role - Role name
     * @returns {Array} - Array of permissions
     */
    getUserPermissions(role) {
        if (!role || !ROLE_PERMISSIONS[role]) {
            return [];
        }

        return ROLE_PERMISSIONS[role] || [];
    }

    /**
     * Check if user can access resource owned by another user
     * @param {Object} currentUser - Current user
     * @param {Object} resourceOwner - Resource owner user
     * @param {string} permission - Required permission
     * @returns {boolean} - Whether access is allowed
     */
    canAccessResource(currentUser, resourceOwner, permission) {
        // Admin can access everything
        if (currentUser.role === ROLES.ADMIN) {
            return true;
        }

        // Check if user has permission to access all resources of this type
        const allAccessPermission = permission.replace(':edit', ':edit:all')
            .replace(':view', ':view:all')
            .replace(':delete', ':delete:all');

        if (this.hasPermission(currentUser, allAccessPermission)) {
            return true;
        }

        // Check if user owns the resource
        if (resourceOwner && currentUser._id.toString() === resourceOwner._id.toString()) {
            return this.hasPermission(currentUser, permission);
        }

        return false;
    }

    /**
     * Check role hierarchy - if user can manage another role
     * @param {string} userRole - Current user's role
     * @param {string} targetRole - Target role to manage
     * @returns {boolean} - Whether user can manage target role
     */
    canManageRole(userRole, targetRole) {
        const userLevel = ROLE_HIERARCHY[userRole] || 0;
        const targetLevel = ROLE_HIERARCHY[targetRole] || 0;

        // Can only manage roles at same level or below
        return userLevel >= targetLevel;
    }

    /**
     * Get available roles that a user can assign
     * @param {string} userRole - Current user's role
     * @returns {Array} - Array of assignable roles
     */
    getAssignableRoles(userRole) {
        const userLevel = ROLE_HIERARCHY[userRole] || 0;

        return Object.keys(ROLE_HIERARCHY).filter(role => {
            const roleLevel = ROLE_HIERARCHY[role];
            return roleLevel <= userLevel;
        });
    }

    /**
     * Filter data based on user permissions
     * @param {Object} user - User object
     * @param {Array} data - Data to filter
     * @param {string} ownerField - Field that contains owner information
     * @param {string} permission - Required permission
     * @returns {Array} - Filtered data
     */
    filterByPermission(user, data, ownerField = 'assignedUserId', permission = 'email:view:all') {
        // Admin sees everything
        if (user.role === ROLES.ADMIN) {
            return data;
        }

        // If user has "view all" permission, return everything
        if (this.hasPermission(user, permission)) {
            return data;
        }

        // Otherwise, filter to only user's own data
        return data.filter(item => {
            const owner = item[ownerField];
            return owner && owner.toString() === user._id.toString();
        });
    }

    /**
     * Build query filter based on user permissions
     * @param {Object} user - User object
     * @param {Object} baseQuery - Base query object
     * @param {string} ownerField - Field that contains owner information
     * @param {string} permission - Required permission
     * @returns {Object} - Modified query
     */
    buildPermissionQuery(user, baseQuery = {}, ownerField = 'assignedUserId', permission = 'email:view:all') {
        // Admin sees everything
        if (user.role === ROLES.ADMIN) {
            return baseQuery;
        }

        // If user has "view all" permission, return base query
        if (this.hasPermission(user, permission)) {
            return baseQuery;
        }

        // Otherwise, add owner filter
        return {
            ...baseQuery,
            [ownerField]: user._id
        };
    }

    /**
     * Get permission summary for a user
     * @param {Object} user - User object
     * @returns {Object} - Permission summary
     */
    getPermissionSummary(user) {
        const permissions = this.getUserPermissions(user.role);
        const assignableRoles = this.getAssignableRoles(user.role);

        return {
            role: user.role,
            roleLevel: ROLE_HIERARCHY[user.role] || 0,
            permissions,
            permissionCount: permissions.length,
            assignableRoles,
            capabilities: {
                canViewAllEmails: this.hasPermission(user, PERMISSIONS.EMAIL_VIEW_ALL),
                canEditAllEmails: this.hasPermission(user, PERMISSIONS.EMAIL_EDIT_ALL),
                canDeleteEmails: this.hasPermission(user, PERMISSIONS.EMAIL_DELETE),
                canApproveEmails: this.hasPermission(user, PERMISSIONS.EMAIL_APPROVE),
                canManageUsers: this.hasPermission(user, PERMISSIONS.USER_CREATE),
                canChangeRoles: this.hasPermission(user, PERMISSIONS.USER_ROLE_CHANGE),
                canAccessSystemSettings: this.hasPermission(user, PERMISSIONS.SYSTEM_SETTINGS),
                canViewAnalytics: this.hasPermission(user, PERMISSIONS.ANALYTICS_VIEW),
                canExportData: this.hasPermission(user, PERMISSIONS.ANALYTICS_EXPORT)
            }
        };
    }

    /**
     * Validate role transition
     * @param {string} currentRole - Current role
     * @param {string} newRole - New role to assign
     * @param {Object} assigningUser - User making the change
     * @returns {Object} - Validation result
     */
    validateRoleChange(currentRole, newRole, assigningUser) {
        const result = {
            valid: false,
            reason: null
        };

        // Check if assigning user can manage both roles
        if (!this.canManageRole(assigningUser.role, currentRole)) {
            result.reason = 'Insufficient permissions to modify current role';
            return result;
        }

        if (!this.canManageRole(assigningUser.role, newRole)) {
            result.reason = 'Insufficient permissions to assign new role';
            return result;
        }

        // Check if new role exists
        if (!Object.values(ROLES).includes(newRole)) {
            result.reason = 'Invalid role specified';
            return result;
        }

        result.valid = true;
        return result;
    }

    /**
     * Get role description and capabilities
     * @param {string} role - Role name
     * @returns {Object} - Role information
     */
    getRoleInfo(role) {
        const roleDescriptions = {
            [ROLES.ADMIN]: {
                name: 'Administrator',
                description: 'Full system access with all permissions',
                level: 'System Administrator',
                capabilities: [
                    'Manage all users and roles',
                    'Access system settings and logs',
                    'Full email management capabilities',
                    'Export and backup data',
                    'System maintenance and monitoring'
                ]
            },
            [ROLES.EDITOR]: {
                name: 'Editor',
                description: 'Advanced user with content management permissions',
                level: 'Content Manager',
                capabilities: [
                    'Manage emails and content',
                    'Create and edit user accounts',
                    'Approve and assign emails',
                    'Access analytics and reports',
                    'Manage email accounts'
                ]
            },
            [ROLES.MEMBER]: {
                name: 'Member',
                description: 'Basic user with limited permissions',
                level: 'Standard User',
                capabilities: [
                    'View and create emails',
                    'Edit own content',
                    'Basic search functionality',
                    'View own profile',
                    'Access assigned emails'
                ]
            },
            [ROLES.REVIEWER]: {
                name: 'Reviewer (Legacy)',
                description: 'Legacy role with review and approval permissions',
                level: 'Content Reviewer',
                capabilities: [
                    'Review and approve emails',
                    'Bulk email operations',
                    'Advanced search and analytics',
                    'Send approved emails',
                    'Assign emails to users'
                ]
            },
            [ROLES.AGENT]: {
                name: 'Agent (Legacy)',
                description: 'Legacy role with agent-level permissions',
                level: 'Support Agent',
                capabilities: [
                    'Handle customer emails',
                    'Create and edit responses',
                    'Advanced search capabilities',
                    'View analytics',
                    'Manage assigned emails'
                ]
            }
        };

        const roleInfo = roleDescriptions[role] || {
            name: 'Unknown Role',
            description: 'Role not found',
            level: 'Unknown',
            capabilities: []
        };

        return {
            ...roleInfo,
            permissions: this.getUserPermissions(role),
            hierarchy: ROLE_HIERARCHY[role] || 0
        };
    }

    /**
     * Check if operation is allowed based on business rules
     * @param {Object} user - Current user
     * @param {string} operation - Operation to perform
     * @param {Object} context - Additional context
     * @returns {Object} - Authorization result
     */
    authorizeOperation(user, operation, context = {}) {
        const result = {
            allowed: false,
            reason: null,
            requiredPermission: null
        };

        switch (operation) {
            case 'email:approve':
                result.requiredPermission = PERMISSIONS.EMAIL_APPROVE;
                if (this.hasPermission(user, PERMISSIONS.EMAIL_APPROVE)) {
                    result.allowed = true;
                } else {
                    result.reason = 'Email approval permission required';
                }
                break;

            case 'email:send':
                result.requiredPermission = PERMISSIONS.EMAIL_SEND;
                if (this.hasPermission(user, PERMISSIONS.EMAIL_SEND)) {
                    result.allowed = true;
                } else {
                    result.reason = 'Email send permission required';
                }
                break;

            case 'user:role:change':
                result.requiredPermission = PERMISSIONS.USER_ROLE_CHANGE;
                if (this.hasPermission(user, PERMISSIONS.USER_ROLE_CHANGE)) {
                    if (context.targetRole && context.currentRole) {
                        const roleValidation = this.validateRoleChange(
                            context.currentRole,
                            context.targetRole,
                            user
                        );
                        result.allowed = roleValidation.valid;
                        result.reason = roleValidation.reason;
                    } else {
                        result.allowed = true;
                    }
                } else {
                    result.reason = 'Role change permission required';
                }
                break;

            case 'system:settings':
                result.requiredPermission = PERMISSIONS.SYSTEM_SETTINGS;
                if (this.hasPermission(user, PERMISSIONS.SYSTEM_SETTINGS)) {
                    result.allowed = true;
                } else {
                    result.reason = 'System settings access required';
                }
                break;

            default:
                result.reason = 'Unknown operation';
        }

        return result;
    }
}

module.exports = new PermissionService();