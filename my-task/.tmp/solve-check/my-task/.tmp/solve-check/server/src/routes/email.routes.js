// src/modules/emails/email.routes.js
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { validate, emailSchemas } = require('../middleware/validation.middleware');
const { ROLES } = require('../utils/constants');

router.use(authMiddleware);

router.get(
    '/',
    validate(emailSchemas.filter, 'query'),
    emailController.getAllEmails
);

router.get('/:id', emailController.getEmailById);

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