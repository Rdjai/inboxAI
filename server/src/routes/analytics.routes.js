const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const queueController = require('../modules/analytics/queue.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { ROLES } = require('../utils/constants');

router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboardStats);

router.get(
    '/category',
    roleMiddleware(ROLES.ADMIN, ROLES.REVIEWER),
    analyticsController.getCategoryAnalytics
);

router.get(
    '/team',
    roleMiddleware(ROLES.ADMIN, ROLES.REVIEWER),
    analyticsController.getTeamAnalytics
);

router.get(
    '/queue/status',
    roleMiddleware(ROLES.ADMIN),
    queueController.getQueueStatus
);

module.exports = router;
