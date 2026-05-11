const User = require('../models/user.model');
const permissionService = require('../services/permission.service');
const { ROLES, PERMISSIONS, AUDIT_ACTIONS } = require('../utils/constants');
const { AppError } = require('../middleware/errorHandler.middleware');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const { normalizePaginationParams, buildPaginationMeta } = require('../utils/pagination');

class UserController {
    /**
     * Get all users (with permission filtering)
     */
    async getAllUsers(req, res, next) {
        try {
            const {
                page = 1,
                limit = 20,
                role,
                isActive,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build query
            let query = {};

            // Permission-based filtering
            if (!permissionService.hasPermission(req.user, PERMISSIONS.USER_VIEW_ALL)) {
                // Non-admin users can only see their own profile
                query._id = req.user._id;
            }

            // Apply filters
            if (role) query.role = role;
            if (typeof isActive !== 'undefined') {
                query.isActive = isActive === 'true';
            }
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            const { page: parsedPage, limit: parsedLimit, skip } = normalizePaginationParams({ page, limit });

            // Sorting
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            const [users, total] = await Promise.all([
                User.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(parsedLimit)
                    .select('-password')
                    .lean(),
                User.countDocuments(query)
            ]);

            // Add permission info to each user
            const usersWithPermissions = users.map(user => ({
                ...user,
                permissions: permissionService.getPermissionSummary({ role: user.role }),
                canEdit: permissionService.canAccessResource(
                    req.user,
                    user,
                    PERMISSIONS.USER_EDIT
                ),
                canDelete: permissionService.canAccessResource(
                    req.user,
                    user,
                    PERMISSIONS.USER_DELETE
                ),
                canChangeRole: req.user.canManageRole(user.role)
            }));

            res.json({
                success: true,
                data: usersWithPermissions,
                pagination: buildPaginationMeta({ page: parsedPage, limit: parsedLimit, total })
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(req, res, next) {
        try {
            const { id } = req.params;

            const user = await User.findById(id).select('-password');
            if (!user) {
                throw new AppError('User not found', 404);
            }

            // Check permissions
            if (!permissionService.canAccessResource(req.user, user, PERMISSIONS.USER_VIEW)) {
                throw new AppError('Insufficient permissions to view this user', 403);
            }

            const userWithPermissions = {
                ...user.toObject(),
                permissions: permissionService.getPermissionSummary(user),
                canEdit: permissionService.canAccessResource(req.user, user, PERMISSIONS.USER_EDIT),
                canDelete: permissionService.canAccessResource(req.user, user, PERMISSIONS.USER_DELETE),
                canChangeRole: req.user.canManageRole(user.role)
            };

            res.json({
                success: true,
                data: userWithPermissions
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create new user
     */
    async createUser(req, res, next) {
        try {
            const { name, email, password, role = ROLES.MEMBER } = req.body;

            // Check if user can create users
            if (!permissionService.hasPermission(req.user, PERMISSIONS.USER_CREATE)) {
                throw new AppError('Insufficient permissions to create users', 403);
            }

            // Check if user can assign this role
            if (!req.user.canManageRole(role)) {
                throw new AppError('Insufficient permissions to assign this role', 403);
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                throw new AppError('User with this email already exists', 400);
            }

            // Create user
            const user = new User({
                name,
                email: email.toLowerCase(),
                password,
                role,
                isActive: true
            });

            await user.save();

            // Log audit action
            logger.info('User created', {
                createdBy: req.user._id,
                createdUser: user._id,
                role: user.role,
                action: AUDIT_ACTIONS.USER_CREATED
            });

            const userResponse = {
                ...user.toObject(),
                permissions: permissionService.getPermissionSummary(user)
            };
            delete userResponse.password;

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: userResponse
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user
     */
    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const { name, email, isActive } = req.body;

            const user = await User.findById(id);
            if (!user) {
                throw new AppError('User not found', 404);
            }

            // Check permissions
            if (!permissionService.canAccessResource(req.user, user, PERMISSIONS.USER_EDIT)) {
                throw new AppError('Insufficient permissions to edit this user', 403);
            }

            // Update fields
            if (name) user.name = name;
            if (email) {
                // Check if email is already taken
                const existingUser = await User.findOne({
                    email: email.toLowerCase(),
                    _id: { $ne: id }
                });
                if (existingUser) {
                    throw new AppError('Email already in use', 400);
                }
                user.email = email.toLowerCase();
            }
            if (typeof isActive !== 'undefined') {
                // Only admin can deactivate users
                if (!permissionService.hasPermission(req.user, PERMISSIONS.USER_EDIT_ALL)) {
                    throw new AppError('Insufficient permissions to change user status', 403);
                }
                user.isActive = isActive;
            }

            await user.save();

            // Log audit action
            logger.info('User updated', {
                updatedBy: req.user._id,
                updatedUser: user._id,
                changes: { name, email, isActive },
                action: AUDIT_ACTIONS.USER_UPDATED
            });

            const userResponse = {
                ...user.toObject(),
                permissions: permissionService.getPermissionSummary(user)
            };
            delete userResponse.password;

            res.json({
                success: true,
                message: 'User updated successfully',
                data: userResponse
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Change user role
     */
    async changeUserRole(req, res, next) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!role || !Object.values(ROLES).includes(role)) {
                throw new AppError('Invalid role specified', 400);
            }

            const user = await User.findById(id);
            if (!user) {
                throw new AppError('User not found', 404);
            }

            // Validate role change
            const roleValidation = permissionService.validateRoleChange(
                user.role,
                role,
                req.user
            );

            if (!roleValidation.valid) {
                throw new AppError(roleValidation.reason, 403);
            }

            const oldRole = user.role;
            user.role = role;
            await user.save();

            // Log audit action
            logger.info('User role changed', {
                changedBy: req.user._id,
                changedUser: user._id,
                oldRole,
                newRole: role,
                action: AUDIT_ACTIONS.ROLE_CHANGED
            });

            const userResponse = {
                ...user.toObject(),
                permissions: permissionService.getPermissionSummary(user)
            };
            delete userResponse.password;

            res.json({
                success: true,
                message: 'User role updated successfully',
                data: userResponse
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete user
     */
    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;

            if (id === req.user._id.toString()) {
                throw new AppError('Cannot delete your own account', 400);
            }

            const user = await User.findById(id);
            if (!user) {
                throw new AppError('User not found', 404);
            }

            // Check permissions
            if (!permissionService.hasPermission(req.user, PERMISSIONS.USER_DELETE)) {
                throw new AppError('Insufficient permissions to delete users', 403);
            }

            // Check if user can manage this role
            if (!req.user.canManageRole(user.role)) {
                throw new AppError('Insufficient permissions to delete user with this role', 403);
            }

            await User.findByIdAndDelete(id);

            // Log audit action
            logger.info('User deleted', {
                deletedBy: req.user._id,
                deletedUser: id,
                deletedRole: user.role,
                action: AUDIT_ACTIONS.USER_DELETED
            });

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Change user password
     */
    async changePassword(req, res, next) {
        try {
            const { id } = req.params;
            const { currentPassword, newPassword } = req.body;

            const user = await User.findById(id);
            if (!user) {
                throw new AppError('User not found', 404);
            }

            // Users can only change their own password unless admin
            if (id !== req.user._id.toString() && req.user.role !== ROLES.ADMIN) {
                throw new AppError('Can only change your own password', 403);
            }

            // Verify current password (not required for admin changing other's password)
            if (id === req.user._id.toString()) {
                const isValidPassword = await user.comparePassword(currentPassword);
                if (!isValidPassword) {
                    throw new AppError('Current password is incorrect', 400);
                }
            }

            // Update password
            user.password = newPassword;
            await user.save();

            logger.info('Password changed', {
                changedBy: req.user._id,
                changedFor: id,
                action: 'PASSWORD_CHANGED'
            });

            res.json({
                success: true,
                message: 'Password updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user profile
     */
    async getProfile(req, res, next) {
        try {
            const userWithPermissions = {
                ...req.user.toObject(),
                permissions: permissionService.getPermissionSummary(req.user)
            };
            delete userWithPermissions.password;

            res.json({
                success: true,
                data: userWithPermissions
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update current user profile
     */
    async updateProfile(req, res, next) {
        try {
            const { name, email } = req.body;

            const user = await User.findById(req.user._id);
            if (!user) {
                throw new AppError('User not found', 404);
            }

            // Update fields
            if (name) user.name = name;
            if (email) {
                // Check if email is already taken
                const existingUser = await User.findOne({
                    email: email.toLowerCase(),
                    _id: { $ne: req.user._id }
                });
                if (existingUser) {
                    throw new AppError('Email already in use', 400);
                }
                user.email = email.toLowerCase();
            }

            await user.save();

            const userResponse = {
                ...user.toObject(),
                permissions: permissionService.getPermissionSummary(user)
            };
            delete userResponse.password;

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: userResponse
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get available roles for assignment
     */
    async getAvailableRoles(req, res, next) {
        try {
            const assignableRoles = permissionService.getAssignableRoles(req.user.role);

            const rolesWithInfo = assignableRoles.map(role => ({
                role,
                ...permissionService.getRoleInfo(role)
            }));

            res.json({
                success: true,
                data: rolesWithInfo
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user permissions
     */
    async getUserPermissions(req, res, next) {
        try {
            const { id } = req.params;

            const user = await User.findById(id).select('-password');
            if (!user) {
                throw new AppError('User not found', 404);
            }

            // Check permissions
            if (!permissionService.canAccessResource(req.user, user, PERMISSIONS.USER_VIEW)) {
                throw new AppError('Insufficient permissions to view user permissions', 403);
            }

            const permissions = permissionService.getPermissionSummary(user);

            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Bulk user operations
     */
    async bulkUserAction(req, res, next) {
        try {
            const { userIds, action, data } = req.body;

            if (!permissionService.hasPermission(req.user, PERMISSIONS.USER_EDIT_ALL)) {
                throw new AppError('Insufficient permissions for bulk user operations', 403);
            }

            let result;

            switch (action) {
                case 'activate':
                    result = await User.updateMany(
                        { _id: { $in: userIds } },
                        { $set: { isActive: true } }
                    );
                    break;

                case 'deactivate':
                    // Prevent deactivating own account
                    const filteredIds = userIds.filter(id => id !== req.user._id.toString());
                    result = await User.updateMany(
                        { _id: { $in: filteredIds } },
                        { $set: { isActive: false } }
                    );
                    break;

                case 'change-role':
                    if (!data.role || !Object.values(ROLES).includes(data.role)) {
                        throw new AppError('Invalid role specified', 400);
                    }

                    // Check if user can assign this role
                    if (!req.user.canManageRole(data.role)) {
                        throw new AppError('Insufficient permissions to assign this role', 403);
                    }

                    result = await User.updateMany(
                        { _id: { $in: userIds } },
                        { $set: { role: data.role } }
                    );
                    break;

                case 'delete':
                    // Prevent deleting own account
                    const deleteIds = userIds.filter(id => id !== req.user._id.toString());
                    result = await User.deleteMany({ _id: { $in: deleteIds } });
                    break;

                default:
                    throw new AppError('Invalid bulk action', 400);
            }

            logger.info('Bulk user action performed', {
                performedBy: req.user._id,
                action,
                userIds,
                data,
                result
            });

            res.json({
                success: true,
                message: `Bulk action '${action}' completed successfully`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();
