const jwtValidation = require('./jwtValidation.middleware');

const authMiddleware = (req, res, next) => jwtValidation.authMiddleware(req, res, next);
const adminOnly = (req, res, next) => jwtValidation.adminOnly(req, res, next);

const roleMiddleware = (...roles) => jwtValidation.roleMiddleware(...roles);
const permissionMiddleware = (...permissions) => jwtValidation.permissionMiddleware(...permissions);
const requireAllPermissions = (...permissions) => jwtValidation.requireAllPermissions(...permissions);
const resourceOwnership = (resourceField, permission) => jwtValidation.resourceOwnership(resourceField, permission);
const conditionalPermission = (conditions) => jwtValidation.conditionalPermission(conditions);

module.exports = {
    authMiddleware,
    roleMiddleware,
    permissionMiddleware,
    requireAllPermissions,
    adminOnly,
    resourceOwnership,
    conditionalPermission,
    jwtValidation
};
