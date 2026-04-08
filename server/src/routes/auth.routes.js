// src/modules/auth/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { authRateLimiter } = require('../middleware/rateLimit.middleware');
const { validate, authSchemas } = require('../middleware/validation.middleware');
const { ROLES } = require('../utils/constants');

// Public routes
router.post('/register', authRateLimiter, validate(authSchemas.register), authController.register);
router.post('/login', authRateLimiter, validate(authSchemas.login), authController.login);

// Protected routes
router.use(authMiddleware);

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);

// Admin only routes
router.get('/users', roleMiddleware(ROLES.ADMIN), authController.getUsers);

module.exports = router;
