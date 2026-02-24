// src/modules/emails/email.routes.js
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { validate, emailSchemas } = require('../middleware/validation.middleware');
const { ROLES } = require('../utils/constants');

router.use(authMiddleware);

// ===== SEARCH ROUTES =====
router.get(
    '/search',
    validate(emailSchemas.search, 'query'),
    emailController.searchEmails
);

router.get(
    '/search/suggestions',
    emailController.getSearchSuggestions
);

router.get(
    '/search/analytics',
    emailController.getSearchAnalytics
);

router.get(
    '/search/popular-terms',
    emailController.getPopularSearchTerms
);

router.get(
    '/search/metrics',
    roleMiddleware(ROLES.ADMIN),
    emailController.getSearchMetrics
);

router.post(
    '/search/metrics/reset',
    roleMiddleware(ROLES.ADMIN),
    emailController.resetSearchMetrics
);

router.get(
    '/search/entity/:entityType/:entityValue',
    emailController.searchByEntity
);

// ===== STANDARD EMAIL ROUTES =====
router.get(
    '/',
    validate(emailSchemas.filter, 'query'),
    emailController.getAllEmails
);

router.get('/:id', emailController.getEmailById);

router.patch('/:id/read', emailController.markAsRead);
router.patch('/:id/unread', emailController.markAsUnread);

router.put(
    '/:id/draft',
    roleMiddleware(ROLES.REVIEWER, ROLES.AGENT, ROLES.ADMIN),
    validate(emailSchemas.updateDraft),
    emailController.updateDraft
);

router.post(
    '/:id/approve',
    roleMiddleware(ROLES.REVIEWER, ROLES.ADMIN),
    emailController.approveEmail
);

router.post(
    '/:id/send',
    roleMiddleware(ROLES.REVIEWER, ROLES.ADMIN),
    emailController.sendEmail
);

router.post(
    '/:id/reply',
    roleMiddleware(ROLES.REVIEWER, ROLES.AGENT, ROLES.ADMIN),
    validate(emailSchemas.reply),
    emailController.replyToEmail
);

router.post(
    '/:id/forward',
    roleMiddleware(ROLES.REVIEWER, ROLES.AGENT, ROLES.ADMIN),
    validate(emailSchemas.forward),
    emailController.forwardEmail
);

router.post(
    '/bulk',
    roleMiddleware(ROLES.ADMIN),
    validate(emailSchemas.bulkAction),
    emailController.bulkAction
);

router.post(
    '/',
    roleMiddleware(ROLES.REVIEWER, ROLES.AGENT, ROLES.ADMIN),
    emailController.createEmail
);

module.exports = router;