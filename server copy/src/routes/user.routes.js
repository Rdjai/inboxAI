const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const {
    authMiddleware,
    permissionMiddleware,
    adminOnly,
    resourceOwnership
} = require('../middleware/auth.middleware');
const { validate, userSchemas } = require('../middleware/validation.middleware');
const { PERMISSIONS } = require('../utils/constants');

// Apply authentication to all routes
router.use(authMiddleware);

// ===== PROFILE ROUTES =====
router.get('/profile', userController.getProfile);
router.put('/profile',
    validate(userSchemas.updateProfile),
    userController.updateProfile
);

// ===== USER MANAGEMENT ROUTES =====
router.get('/',
    permissionMiddleware(PERMISSIONS.USER_VIEW, PERMISSIONS.USER_VIEW_ALL),
    validate(userSchemas.filter, 'query'),
    userController.getAllUsers
);

router.get('/roles',
    permissionMiddleware(PERMISSIONS.USER_VIEW),
    userController.getAvailableRoles
);

router.post('/',
    permissionMiddleware(PERMISSIONS.USER_CREATE),
    validate(userSchemas.createUser),
    userController.createUser
);

router.get('/:id',
    permissionMiddleware(PERMISSIONS.USER_VIEW, PERMISSIONS.USER_VIEW_ALL),
    userController.getUserById
);

router.put('/:id',
    permissionMiddleware(PERMISSIONS.USER_EDIT, PERMISSIONS.USER_EDIT_ALL),
    validate(userSchemas.updateUser),
    userController.updateUser
);

router.patch('/:id/role',
    permissionMiddleware(PERMISSIONS.USER_ROLE_CHANGE),
    validate(userSchemas.changeRole),
    userController.changeUserRole
);

router.patch('/:id/password',
    validate(userSchemas.changePassword),
    userController.changePassword
);

router.get('/:id/permissions',
    permissionMiddleware(PERMISSIONS.USER_VIEW, PERMISSIONS.USER_VIEW_ALL),
    userController.getUserPermissions
);

router.delete('/:id',
    permissionMiddleware(PERMISSIONS.USER_DELETE),
    userController.deleteUser
);

// ===== BULK OPERATIONS =====
router.post('/bulk',
    permissionMiddleware(PERMISSIONS.USER_EDIT_ALL),
    validate(userSchemas.bulkAction),
    userController.bulkUserAction
);

module.exports = router;