const chartAggregationService = require('../services/chartAggregation.service');
const { AppError } = require('../middleware/errorHandler.middleware');
const logger = require('../utils/logger');

class ChartAggregationController {

    async getEmailVolume(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId, groupBy = 'date' } = req.query;

            const filters = { fromDate, toDate, userId, accountId };

            let data;
            if (groupBy === 'hour') {
                data = await chartAggregationService.getEmailVolumeByHour(filters);
            } else if (groupBy === 'dayOfWeek') {
                data = await chartAggregationService.getEmailVolumeByDayOfWeek(filters);
            } else {
                data = await chartAggregationService.getEmailVolumeByDate(filters);
            }

            res.json({
                success: true,
                data,
                groupBy,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get status distribution
     */
    async getStatusDistribution(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId, category } = req.query;

            const filters = { fromDate, toDate, userId, accountId, category };
            const data = await chartAggregationService.getStatusDistribution(filters);

            res.json({
                success: true,
                data,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get category distribution
     */
    async getCategoryDistribution(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId } = req.query;

            const filters = { fromDate, toDate, userId, accountId };
            const data = await chartAggregationService.getCategoryDistribution(filters);

            res.json({
                success: true,
                data,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get priority distribution
     */
    async getPriorityDistribution(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId } = req.query;

            const filters = { fromDate, toDate, userId, accountId };
            const data = await chartAggregationService.getPriorityDistribution(filters);

            res.json({
                success: true,
                data,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get sentiment distribution
     */
    async getSentimentDistribution(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId } = req.query;

            const filters = { fromDate, toDate, userId, accountId };
            const data = await chartAggregationService.getSentimentDistribution(filters);

            res.json({
                success: true,
                data,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get response time statistics
     */
    async getResponseTimeStats(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId } = req.query;

            const filters = { fromDate, toDate, userId, accountId };
            const data = await chartAggregationService.getResponseTimeStats(filters);

            res.json({
                success: true,
                data,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get response time by date
     */
    async getResponseTimeByDate(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId } = req.query;

            const filters = { fromDate, toDate, userId, accountId };
            const data = await chartAggregationService.getResponseTimeByDate(filters);

            res.json({
                success: true,
                data,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user activity statistics
     */
    async getUserActivityStats(req, res, next) {
        try {
            const { fromDate, toDate, accountId, limit = 50 } = req.query;

            const filters = { fromDate, toDate, accountId, limit: parseInt(limit) };
            const data = await chartAggregationService.getUserActivityStats(filters);

            res.json({
                success: true,
                data,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get activity heatmap
     */
    async getActivityHeatmap(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId } = req.query;

            const filters = { fromDate, toDate, userId, accountId };
            const data = await chartAggregationService.getActivityHeatmap(filters);

            res.json({
                success: true,
                data,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get email processing flow
     */
    async getEmailProcessingFlow(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId } = req.query;

            const filters = { fromDate, toDate, userId, accountId };
            const data = await chartAggregationService.getEmailProcessingFlow(filters);

            res.json({
                success: true,
                data,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get confidence distribution
     */
    async getConfidenceDistribution(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId } = req.query;

            const filters = { fromDate, toDate, userId, accountId };
            const data = await chartAggregationService.getConfidenceDistribution(filters);

            res.json({
                success: true,
                data,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get comprehensive aggregation (all data at once)
     */
    async getComprehensiveAggregation(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId } = req.query;

            const filters = { fromDate, toDate, userId, accountId };
            const data = await chartAggregationService.getComprehensiveAggregation(filters);

            res.json({
                success: true,
                data,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get multiple aggregations (selective)
     */
    async getMultipleAggregations(req, res, next) {
        try {
            const { fromDate, toDate, userId, accountId, types = [] } = req.query;
            const typeArray = Array.isArray(types) ? types : types.split(',');

            const filters = { fromDate, toDate, userId, accountId };
            const results = {};

            // Map of available aggregations
            const aggregationMap = {
                volume: () => chartAggregationService.getEmailVolumeByDate(filters),
                status: () => chartAggregationService.getStatusDistribution(filters),
                category: () => chartAggregationService.getCategoryDistribution(filters),
                priority: () => chartAggregationService.getPriorityDistribution(filters),
                sentiment: () => chartAggregationService.getSentimentDistribution(filters),
                responseTime: () => chartAggregationService.getResponseTimeStats(filters),
                responseTimeByDate: () => chartAggregationService.getResponseTimeByDate(filters),
                userActivity: () => chartAggregationService.getUserActivityStats(filters),
                heatmap: () => chartAggregationService.getActivityHeatmap(filters),
                processingFlow: () => chartAggregationService.getEmailProcessingFlow(filters),
                confidence: () => chartAggregationService.getConfidenceDistribution(filters)
            };

            // Execute requested aggregations
            for (const type of typeArray) {
                if (aggregationMap[type]) {
                    results[type] = await aggregationMap[type]();
                }
            }

            res.json({
                success: true,
                data: results,
                requestedTypes: typeArray,
                filters: { fromDate, toDate }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ChartAggregationController();
