// src/controllers/chartAggregationOptimized.controller.js
const chartAggregationService = require('../services/chartAggregationOptimized.service');
const performanceMonitor = require('../services/performanceMonitor.service');
const cacheService = require('../services/cacheService');
const { AppError } = require('../middleware/errorHandler.middleware');
const logger = require('../utils/logger');

class ChartAggregationOptimizedController {
    /**
     * Wrapper to record query performance
     */
    async executeWithMonitoring(queryName, queryFn, req, res, next) {
        try {
            const startTime = Date.now();
            const data = await queryFn();
            const executionTime = Date.now() - startTime;

            // Record performance metrics
            performanceMonitor.recordQuery(queryName, executionTime,
                Array.isArray(data) ? data.length : Object.keys(data).length,
                req.query
            );

            res.json({
                success: true,
                data,
                performance: {
                    executionTime: `${executionTime}ms`,
                    cached: false
                },
                filters: { fromDate: req.query.fromDate, toDate: req.query.toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get email volume data
     */
    async getEmailVolume(req, res, next) {
        await this.executeWithMonitoring(
            'getEmailVolume',
            () => chartAggregationService.getEmailVolumeByDate(req.query),
            req, res, next
        );
    }

    /**
     * Get status distribution
     */
    async getStatusDistribution(req, res, next) {
        await this.executeWithMonitoring(
            'getStatusDistribution',
            () => chartAggregationService.getStatusDistribution(req.query),
            req, res, next
        );
    }

    /**
     * Get category distribution
     */
    async getCategoryDistribution(req, res, next) {
        await this.executeWithMonitoring(
            'getCategoryDistribution',
            () => chartAggregationService.getCategoryDistribution(req.query),
            req, res, next
        );
    }

    /**
     * Get priority distribution
     */
    async getPriorityDistribution(req, res, next) {
        await this.executeWithMonitoring(
            'getPriorityDistribution',
            () => chartAggregationService.getPriorityDistribution(req.query),
            req, res, next
        );
    }

    /**
     * Get sentiment distribution
     */
    async getSentimentDistribution(req, res, next) {
        await this.executeWithMonitoring(
            'getSentimentDistribution',
            () => chartAggregationService.getSentimentDistribution(req.query),
            req, res, next
        );
    }

    /**
     * Get response time statistics
     */
    async getResponseTimeStats(req, res, next) {
        await this.executeWithMonitoring(
            'getResponseTimeStats',
            () => chartAggregationService.getResponseTimeStats(req.query),
            req, res, next
        );
    }

    /**
     * Get user activity statistics
     */
    async getUserActivityStats(req, res, next) {
        await this.executeWithMonitoring(
            'getUserActivityStats',
            () => chartAggregationService.getUserActivityStats(req.query),
            req, res, next
        );
    }

    /**
     * Get activity heatmap
     */
    async getActivityHeatmap(req, res, next) {
        await this.executeWithMonitoring(
            'getActivityHeatmap',
            () => chartAggregationService.getActivityHeatmap(req.query),
            req, res, next
        );
    }

    /**
     * Get email processing flow
     */
    async getEmailProcessingFlow(req, res, next) {
        await this.executeWithMonitoring(
            'getEmailProcessingFlow',
            () => chartAggregationService.getEmailProcessingFlow(req.query),
            req, res, next
        );
    }

    /**
     * Get comprehensive aggregation
     */
    async getComprehensiveAggregation(req, res, next) {
        await this.executeWithMonitoring(
            'getComprehensiveAggregation',
            () => chartAggregationService.getComprehensiveAggregation(req.query),
            req, res, next
        );
    }

    /**
     * Get cache statistics
     */
    async getCacheStats(req, res, next) {
        try {
            const stats = cacheService.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Clear cache
     */
    async clearCache(req, res, next) {
        try {
            const { pattern } = req.query;

            if (pattern) {
                const count = chartAggregationService.invalidateCache(pattern);
                res.json({
                    success: true,
                    message: `Cleared ${count} cache entries matching pattern: ${pattern}`
                });
            } else {
                cacheService.clear();
                res.json({
                    success: true,
                    message: 'All cache cleared'
                });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get performance metrics
     */
    async getPerformanceMetrics(req, res, next) {
        try {
            const metrics = performanceMonitor.getPerformanceReport();
            res.json({
                success: true,
                data: metrics
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get query statistics
     */
    async getQueryStats(req, res, next) {
        try {
            const { queryName } = req.query;

            if (!queryName) {
                return res.status(400).json({
                    success: false,
                    message: 'queryName parameter is required'
                });
            }

            const stats = performanceMonitor.getQueryStats(queryName);

            if (!stats) {
                return res.status(404).json({
                    success: false,
                    message: `No statistics found for query: ${queryName}`
                });
            }

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reset performance metrics
     */
    async resetPerformanceMetrics(req, res, next) {
        try {
            performanceMonitor.resetMetrics();
            res.json({
                success: true,
                message: 'Performance metrics reset'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ChartAggregationOptimizedController();
