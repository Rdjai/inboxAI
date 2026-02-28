// src/routes/chartAggregation.routes.js
const express = require('express');
const router = express.Router();
const chartAggregationController = require('../controllers/chartAggregation.controller');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../utils/constants');

// All routes require authentication
router.use(authMiddleware);

/**
 * Email Volume Aggregation
 * GET /api/charts/volume
 * Query params: fromDate, toDate, userId, accountId, groupBy (date|hour|dayOfWeek)
 */
router.get(
    '/volume',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getEmailVolume
);

/**
 * Status Distribution
 * GET /api/charts/status
 * Query params: fromDate, toDate, userId, accountId, category
 */
router.get(
    '/status',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getStatusDistribution
);

/**
 * Category Distribution
 * GET /api/charts/category
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/category',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getCategoryDistribution
);

/**
 * Priority Distribution
 * GET /api/charts/priority
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/priority',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getPriorityDistribution
);

/**
 * Sentiment Distribution
 * GET /api/charts/sentiment
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/sentiment',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getSentimentDistribution
);

/**
 * Response Time Statistics
 * GET /api/charts/response-time/stats
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/response-time/stats',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getResponseTimeStats
);

/**
 * Response Time by Date
 * GET /api/charts/response-time/by-date
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/response-time/by-date',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getResponseTimeByDate
);

/**
 * User Activity Statistics
 * GET /api/charts/user-activity
 * Query params: fromDate, toDate, accountId, limit
 */
router.get(
    '/user-activity',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getUserActivityStats
);

/**
 * Activity Heatmap
 * GET /api/charts/heatmap
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/heatmap',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getActivityHeatmap
);

/**
 * Email Processing Flow
 * GET /api/charts/processing-flow
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/processing-flow',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getEmailProcessingFlow
);

/**
 * Confidence Distribution
 * GET /api/charts/confidence
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/confidence',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getConfidenceDistribution
);

/**
 * Comprehensive Aggregation (all data)
 * GET /api/charts/comprehensive
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/comprehensive',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getComprehensiveAggregation
);

/**
 * Multiple Aggregations (selective)
 * GET /api/charts/multiple
 * Query params: fromDate, toDate, userId, accountId, types (comma-separated)
 * Example: /api/charts/multiple?types=volume,status,sentiment
 */
router.get(
    '/multiple',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getMultipleAggregations
);

module.exports = router;
