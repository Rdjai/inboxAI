const express = require('express');
const router = express.Router();
const emailAccountController = require('../controllers/emailAccount.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate, emailAccountSchemas } = require('../middleware/validation.middleware');

// OAuth callback must be public (state token is validated server-side).
router.get('/google/callback', emailAccountController.connectGoogleOAuth);

// All routes require authentication
router.use(authMiddleware);

// Email account routes
router.get('/', emailAccountController.getAccounts);
router.get('/stats', emailAccountController.getAccountStats);
router.post('/google/oauth-url', emailAccountController.getGoogleOAuthUrl);
router.get('/:id', emailAccountController.getAccount);

// Create account with proper validation
router.post(
    '/',
    validate(emailAccountSchemas.createAccount),
    emailAccountController.createAccount
);

// Update account
router.put(
    '/:id',
    validate(emailAccountSchemas.updateAccount),
    emailAccountController.updateAccount
);

// Delete account
router.delete('/:id', emailAccountController.deleteAccount);

// Sync emails
router.post(
    '/:accountId/sync',
    validate(emailAccountSchemas.syncAccount),
    emailAccountController.syncAccount
);

// Share account
router.post(
    '/:accountId/share',
    validate(emailAccountSchemas.shareAccount),
    emailAccountController.shareAccount
);

// Fix Gmail settings
router.post('/fix-gmail', emailAccountController.fixGmailSettings);

// Test connection
router.post(
    '/:accountId/test',
    validate(emailAccountSchemas.testConnection),
    emailAccountController.testConnection
);

module.exports = router;