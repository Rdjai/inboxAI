// src/modules/emails/email.routes.js
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const {
    authMiddleware,
    permissionMiddleware,
    adminOnly,
    resourceOwnership
} = require('../middleware/auth.middleware');
const { validate, emailSchemas } = require('../middleware/validation.middleware');
const { PERMISSIONS } = require('../utils/constants');

router.use(authMiddleware);

// ===== SEARCH ROUTES =====
router.get(
    '/search',
    permissionMiddleware(PERMISSIONS.SEARCH_BASIC, PERMISSIONS.SEARCH_ADVANCED),
    validate(emailSchemas.search, 'query'),
    emailController.searchEmails
);

router.get(
    '/search/suggestions',
    permissionMiddleware(PERMISSIONS.SEARCH_BASIC),
    emailController.getSearchSuggestions
);

router.get(
    '/search/analytics',
    permissionMiddleware(PERMISSIONS.SEARCH_ANALYTICS),
    emailController.getSearchAnalytics
);

router.get(
    '/search/popular-terms',
    permissionMiddleware(PERMISSIONS.SEARCH_ANALYTICS),
    emailController.getPopularSearchTerms
);

router.get(
    '/search/metrics',
    permissionMiddleware(PERMISSIONS.SEARCH_METRICS),
    emailController.getSearchMetrics
);

router.post(
    '/search/metrics/reset',
    adminOnly,
    emailController.resetSearchMetrics
);

router.get(
    '/search/entity/:entityType/:entityValue',
    permissionMiddleware(PERMISSIONS.SEARCH_ADVANCED),
    emailController.searchByEntity
);

// ===== STANDARD EMAIL ROUTES =====
router.get(
    '/',
    resourceOwnership('assignedUserId', PERMISSIONS.EMAIL_VIEW_ALL),
    validate(emailSchemas.filter, 'query'),
    emailController.getAllEmails
);

router.get(
    '/:id',
    resourceOwnership('assignedUserId', PERMISSIONS.EMAIL_VIEW_ALL),
    emailController.getEmailById
);

router.patch(
    '/:id/read',
    permissionMiddleware(PERMISSIONS.EMAIL_VIEW),
    emailController.markAsRead
);

router.patch(
    '/:id/unread',
    permissionMiddleware(PERMISSIONS.EMAIL_VIEW),
    emailController.markAsUnread
);

router.put(
    '/:id/draft',
    resourceOwnership('assignedUserId', PERMISSIONS.EMAIL_EDIT_ALL),
    permissionMiddleware(PERMISSIONS.EMAIL_EDIT),
    validate(emailSchemas.updateDraft),
    emailController.updateDraft
);

router.post(
    '/:id/approve',
    permissionMiddleware(PERMISSIONS.EMAIL_APPROVE),
    emailController.approveEmail
);

router.post(
    '/:id/send',
    permissionMiddleware(PERMISSIONS.EMAIL_SEND),
    emailController.sendEmail
);

router.post(
    '/:id/reply',
    resourceOwnership('assignedUserId', PERMISSIONS.EMAIL_EDIT_ALL),
    permissionMiddleware(PERMISSIONS.EMAIL_EDIT),
    validate(emailSchemas.reply),
    emailController.replyToEmail
);

router.post(
    '/:id/forward',
    resourceOwnership('assignedUserId', PERMISSIONS.EMAIL_EDIT_ALL),
    permissionMiddleware(PERMISSIONS.EMAIL_EDIT),
    validate(emailSchemas.forward),
    emailController.forwardEmail
);

router.post(
    '/bulk',
    permissionMiddleware(PERMISSIONS.EMAIL_BULK_ACTIONS),
    validate(emailSchemas.bulkAction),
    emailController.bulkAction
);

router.post(
    '/',
    permissionMiddleware(PERMISSIONS.EMAIL_CREATE),
    emailController.createEmail
);

module.exports = router;