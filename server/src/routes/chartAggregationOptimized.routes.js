// src/routes/chartAggregationOptimized.routes.js
const express = require('express');
const router = express.Router();
const chartAggregationController = require('../controllers/chartAggregationOptimized.controller');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../utils/constants');

// All routes require authentication
router.use(authMiddleware);

/**
 * Email Volume Aggregation (Optimized)
 * GET /api/charts/volume
 * Query params: fromDate, toDate, userId, accountId, groupBy (date|hour|dayOfWeek)
 */
router.get(
    '/volume',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getEmailVolume
);

/**
 * Status Distribution (Optimized)
 * GET /api/charts/status
 * Query params: fromDate, toDate, userId, accountId, category
 */
router.get(
    '/status',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getStatusDistribution
);

/**
 * Category Distribution (Optimized)
 * GET /api/charts/category
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/category',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getCategoryDistribution
);

/**
 * Priority Distribution (Optimized)
 * GET /api/charts/priority
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/priority',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getPriorityDistribution
);

/**
 * Sentiment Distribution (Optimized)
 * GET /api/charts/sentiment
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/sentiment',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getSentimentDistribution
);

/**
 * Response Time Statistics (Optimized)
 * GET /api/charts/response-time/stats
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/response-time/stats',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getResponseTimeStats
);

/**
 * Response Time by Date (Optimized)
 * GET /api/charts/response-time/by-date
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/response-time/by-date',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getResponseTimeByDate
);

/**
 * User Activity Statistics (Optimized)
 * GET /api/charts/user-activity
 * Query params: fromDate, toDate, accountId, limit
 */
router.get(
    '/user-activity',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getUserActivityStats
);

/**
 * Activity Heatmap (Optimized)
 * GET /api/charts/heatmap
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/heatmap',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getActivityHeatmap
);

/**
 * Email Processing Flow (Optimized)
 * GET /api/charts/processing-flow
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/processing-flow',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getEmailProcessingFlow
);

/**
 * Confidence Distribution (Optimized)
 * GET /api/charts/confidence
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/confidence',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getConfidenceDistribution
);

/**
 * Comprehensive Aggregation (Optimized)
 * GET /api/charts/comprehensive
 * Query params: fromDate, toDate, userId, accountId
 */
router.get(
    '/comprehensive',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getComprehensiveAggregation
);

/**
 * Multiple Aggregations (Optimized)
 * GET /api/charts/multiple
 * Query params: fromDate, toDate, userId, accountId, types (comma-separated)
 * Example: /api/charts/multiple?types=volume,status,sentiment
 */
router.get(
    '/multiple',
    permissionMiddleware(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_ANALYTICS),
    chartAggregationController.getMultipleAggregations
);

/**
 * Cache Management Endpoints
 */

// Get cache statistics
router.get(
    '/cache/stats',
    permissionMiddleware(PERMISSIONS.SYSTEM_METRICS),
    chartAggregationController.getCacheStats
);

// Clear cache (with optional pattern)
router.post(
    '/cache/clear',
    permissionMiddleware(PERMISSIONS.SYSTEM_SETTINGS),
    chartAggregationController.clearCache
);

/**
 * Performance Monitoring Endpoints
 */

// Get performance metrics
router.get(
    '/performance/metrics',
    permissionMiddleware(PERMISSIONS.SYSTEM_METRICS),
    chartAggregationController.getPerformanceMetrics
);

// Get query statistics
router.get(
    '/performance/query-stats',
    permissionMiddleware(PERMISSIONS.SYSTEM_METRICS),
    chartAggregationController.getQueryStats
);

// Reset performance metrics
router.post(
    '/performance/reset',
    permissionMiddleware(PERMISSIONS.SYSTEM_SETTINGS),
    chartAggregationController.resetPerformanceMetrics
);

module.exports = router;
