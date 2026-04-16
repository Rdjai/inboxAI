// src/services/chartAggregationOptimized.service.js
const Email = require('../models/email.model');
const User = require('../models/user.model');
const cacheService = require('./cacheService');
const queryOptimizer = require('./queryOptimizer.service');
const logger = require('../utils/logger');

/**
 * Optimized chart aggregation service with caching and performance improvements
 */
class ChartAggregationOptimizedService {
    constructor() {
        this.cacheTTL = {
            short: 60,      // 1 minute for real-time data
            medium: 300,    // 5 minutes for standard queries
            long: 3600      // 1 hour for historical data
        };
    }

    /**
     * Determine cache TTL based on date range
     */
    determineCacheTTL(fromDate, toDate) {
        if (!fromDate || !toDate) return this.cacheTTL.medium;

        const now = new Date();
        const from = new Date(fromDate);
        const to = new Date(toDate);

        // If querying today's data, use short TTL
        if (to.toDateString() === now.toDateString()) {
            return this.cacheTTL.short;
        }

        // If querying recent data (last 7 days), use medium TTL
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (from >= sevenDaysAgo) {
            return this.cacheTTL.medium;
        }

        // Historical data can use longer TTL
        return this.cacheTTL.long;
    }

    /**
     * Get email volume by date with caching
     */
    async getEmailVolumeByDate(filters = {}) {
        const cacheKey = cacheService.generateKey('volume:date', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const { fromDate, toDate, userId, accountId, status } = filters;

            const matchStage = {};
            if (fromDate || toDate) {
                matchStage.createdAt = {};
                if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
                if (toDate) matchStage.createdAt.$lte = new Date(toDate);
            }
            if (userId) matchStage.userId = userId;
            if (accountId) matchStage.accountId = accountId;
            if (status) matchStage.status = status;

            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            status: '$status'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.date': 1 } },
                { $limit: 365 } // Limit to 1 year of data
            ];

            const results = await Email.aggregate(pipeline).allowDiskUse(true);

            // Transform results
            const volumeData = {};
            results.forEach(item => {
                const date = item._id.date;
                if (!volumeData[date]) {
                    volumeData[date] = {
                        date,
                        received: 0,
                        sent: 0,
                        failed: 0,
                        total: 0
                    };
                }

                if (item._id.status === 'SENT') {
                    volumeData[date].sent += item.count;
                } else if (item._id.status === 'FAILED') {
                    volumeData[date].failed += item.count;
                } else {
                    volumeData[date].received += item.count;
                }
                volumeData[date].total += item.count;
            });

            return Object.values(volumeData).sort((a, b) => new Date(a.date) - new Date(b.date));
        }, ttl);
    }

    /**
     * Get status distribution with caching
     */
    async getStatusDistribution(filters = {}) {
        const cacheKey = cacheService.generateKey('distribution:status', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const { fromDate, toDate, userId, accountId, category } = filters;

            const matchStage = {};
            if (fromDate || toDate) {
                matchStage.createdAt = {};
                if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
                if (toDate) matchStage.createdAt.$lte = new Date(toDate);
            }
            if (userId) matchStage.userId = userId;
            if (accountId) matchStage.accountId = accountId;
            if (category) matchStage.category = category;

            const pipeline = [
                { $match: matchStage },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ];

            const results = await Email.aggregate(pipeline);

            const distribution = {};
            results.forEach(item => {
                distribution[item._id || 'UNKNOWN'] = item.count;
            });

            return distribution;
        }, ttl);
    }

    /**
     * Get user activity stats with caching
     */
    async getUserActivityStats(filters = {}) {
        const cacheKey = cacheService.generateKey('stats:user-activity', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const { fromDate, toDate, accountId, limit = 50 } = filters;

            const matchStage = {};
            if (fromDate || toDate) {
                matchStage.createdAt = {};
                if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
                if (toDate) matchStage.createdAt.$lte = new Date(toDate);
            }
            if (accountId) matchStage.accountId = accountId;

            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: '$userId',
                        emailsProcessed: { $sum: 1 },
                        emailsSent: {
                            $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] }
                        },
                        avgResponseTime: { $avg: '$responseTime' },
                        completionRate: {
                            $avg: { $cond: [{ $eq: ['$status', 'SENT'] }, 100, 0] }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'userInfo'
                    }
                },
                { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        userId: '$_id',
                        name: { $ifNull: ['$userInfo.name', 'Unknown'] },
                        email: { $ifNull: ['$userInfo.email', 'Unknown'] },
                        emailsProcessed: 1,
                        emailsSent: 1,
                        avgResponseTime: { $round: ['$avgResponseTime', 0] },
                        completionRate: { $round: ['$completionRate', 0] },
                        lastActive: '$userInfo.lastLoginAt'
                    }
                },
                { $sort: { emailsProcessed: -1 } },
                { $limit: Math.min(limit, 100) }
            ];

            return await Email.aggregate(pipeline).allowDiskUse(true);
        }, ttl);
    }

    /**
     * Get activity heatmap with caching
     */
    async getActivityHeatmap(filters = {}) {
        const cacheKey = cacheService.generateKey('heatmap:activity', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const { fromDate, toDate, userId, accountId } = filters;

            const matchStage = {};
            if (fromDate || toDate) {
                matchStage.createdAt = {};
                if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
                if (toDate) matchStage.createdAt.$lte = new Date(toDate);
            }
            if (userId) matchStage.userId = userId;
            if (accountId) matchStage.accountId = accountId;

            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            dayOfWeek: { $dayOfWeek: '$createdAt' },
                            hour: { $hour: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                }
            ];

            const results = await Email.aggregate(pipeline);

            // Initialize heatmap structure
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const heatmap = {};

            days.forEach((day, index) => {
                heatmap[day] = {};
                for (let hour = 0; hour < 24; hour++) {
                    heatmap[day][hour] = 0;
                }
            });

            // Populate with data
            results.forEach(item => {
                const day = days[item._id.dayOfWeek - 1] || 'Unknown';
                const hour = item._id.hour;
                if (heatmap[day]) {
                    heatmap[day][hour] = item.count;
                }
            });

            return heatmap;
        }, ttl);
    }

    /**
     * Get email processing flow with caching
     */
    async getEmailProcessingFlow(filters = {}) {
        const cacheKey = cacheService.generateKey('flow:processing', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const { fromDate, toDate, userId, accountId } = filters;

            const matchStage = {};
            if (fromDate || toDate) {
                matchStage.createdAt = {};
                if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
                if (toDate) matchStage.createdAt.$lte = new Date(toDate);
            }
            if (userId) matchStage.userId = userId;
            if (accountId) matchStage.accountId = accountId;

            const pipeline = [
                { $match: matchStage },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ];

            const results = await Email.aggregate(pipeline);

            const flow = {
                received: 0,
                classified: 0,
                drafted: 0,
                reviewed: 0,
                approved: 0,
                sent: 0,
                failed: 0
            };

            results.forEach(item => {
                const status = item._id || 'NEW';
                if (status === 'NEW') flow.received = item.count;
                else if (status === 'CLASSIFIED') flow.classified = item.count;
                else if (status === 'DRAFTED') flow.drafted = item.count;
                else if (status === 'REVIEWED') flow.reviewed = item.count;
                else if (status === 'APPROVED') flow.approved = item.count;
                else if (status === 'SENT') flow.sent = item.count;
                else if (status === 'FAILED') flow.failed = item.count;
            });

            const total = flow.received || 1;
            return {
                ...flow,
                total,
                successRate: Math.round((flow.sent / total) * 100),
                processingRate: Math.round(((flow.classified + flow.drafted + flow.approved) / total) * 100)
            };
        }, ttl);
    }

    /**
     * Get response time stats with caching
     */
    async getResponseTimeStats(filters = {}) {
        const cacheKey = cacheService.generateKey('stats:response-time', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const { fromDate, toDate, userId, accountId } = filters;

            const matchStage = {
                responseTime: { $exists: true, $ne: null }
            };
            if (fromDate || toDate) {
                matchStage.createdAt = {};
                if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
                if (toDate) matchStage.createdAt.$lte = new Date(toDate);
            }
            if (userId) matchStage.userId = userId;
            if (accountId) matchStage.accountId = accountId;

            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        avgResponseTime: { $avg: '$responseTime' },
                        minResponseTime: { $min: '$responseTime' },
                        maxResponseTime: { $max: '$responseTime' },
                        count: { $sum: 1 }
                    }
                }
            ];

            const results = await Email.aggregate(pipeline);

            if (results.length === 0) {
                return {
                    avgResponseTime: 0,
                    minResponseTime: 0,
                    maxResponseTime: 0,
                    count: 0
                };
            }

            return {
                avgResponseTime: Math.round(results[0].avgResponseTime || 0),
                minResponseTime: Math.round(results[0].minResponseTime || 0),
                maxResponseTime: Math.round(results[0].maxResponseTime || 0),
                count: results[0].count
            };
        }, ttl);
    }

    /**
     * Get response time by date
     */
    async getResponseTimeByDate(filters = {}) {
        const cacheKey = cacheService.generateKey('response-time:by-date', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const { fromDate, toDate, userId, accountId } = filters;

            const matchStage = {
                responseTime: { $exists: true, $ne: null }
            };
            if (fromDate || toDate) {
                matchStage.createdAt = {};
                if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
                if (toDate) matchStage.createdAt.$lte = new Date(toDate);
            }
            if (userId) matchStage.userId = userId;
            if (accountId) matchStage.accountId = accountId;

            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            date: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$createdAt'
                                }
                            }
                        },
                        avgResponseTime: { $avg: '$responseTime' },
                        minResponseTime: { $min: '$responseTime' },
                        maxResponseTime: { $max: '$responseTime' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.date': 1 }
                }
            ];

            const results = await Email.aggregate(pipeline);

            return results.map(item => ({
                date: item._id.date,
                avgResponseTime: Math.round(item.avgResponseTime || 0),
                minResponseTime: Math.round(item.minResponseTime || 0),
                maxResponseTime: Math.round(item.maxResponseTime || 0),
                count: item.count
            }));
        }, ttl);
    }

    /**
     * Get comprehensive aggregation with parallel execution
     */
    async getComprehensiveAggregation(filters = {}) {
        const cacheKey = cacheService.generateKey('comprehensive', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const [
                volumeByDate,
                statusDist,
                categoryDist,
                priorityDist,
                sentimentDist,
                responseTimeStats,
                userStats,
                processingFlow,
                heatmap
            ] = await Promise.all([
                this.getEmailVolumeByDate(filters),
                this.getStatusDistribution(filters),
                this.getCategoryDistribution(filters),
                this.getPriorityDistribution(filters),
                this.getSentimentDistribution(filters),
                this.getResponseTimeStats(filters),
                this.getUserActivityStats(filters),
                this.getEmailProcessingFlow(filters),
                this.getActivityHeatmap(filters)
            ]);

            return {
                volumeByDate,
                statusDistribution: statusDist,
                categoryDistribution: categoryDist,
                priorityDistribution: priorityDist,
                sentimentDistribution: sentimentDist,
                responseTimeStats,
                userActivityStats: userStats,
                processingFlow,
                activityHeatmap: heatmap,
                timestamp: new Date().toISOString()
            };
        }, ttl);
    }

    /**
     * Get multiple aggregations (selective)
     */
    async getMultipleAggregations(filters = {}) {
        const { fromDate, toDate, userId, accountId, types = [] } = filters;
        const typeArray = Array.isArray(types) ? types : String(types).split(',').map(type => type.trim()).filter(Boolean);
        const results = {};

        const aggregationMap = {
            volume: () => this.getEmailVolumeByDate(filters),
            status: () => this.getStatusDistribution(filters),
            category: () => this.getCategoryDistribution(filters),
            priority: () => this.getPriorityDistribution(filters),
            sentiment: () => this.getSentimentDistribution(filters),
            responseTime: () => this.getResponseTimeStats(filters),
            responseTimeByDate: () => this.getResponseTimeByDate(filters),
            userActivity: () => this.getUserActivityStats(filters),
            heatmap: () => this.getActivityHeatmap(filters),
            processingFlow: () => this.getEmailProcessingFlow(filters),
            confidence: () => this.getConfidenceDistribution(filters)
        };

        await Promise.all(typeArray.map(async type => {
            if (aggregationMap[type]) {
                results[type] = await aggregationMap[type]();
            }
        }));

        return {
            requestedTypes: typeArray,
            data: results,
            filters: { fromDate, toDate }
        };
    }

    /**
     * Invalidate cache for specific patterns
     */
    invalidateCache(pattern) {
        const count = cacheService.deletePattern(pattern);
        logger.info(`Invalidated ${count} cache entries matching pattern: ${pattern}`);
        return count;
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return cacheService.getStats();
    }

    /**
     * Placeholder methods for other distributions
     */
    async getCategoryDistribution(filters = {}) {
        const cacheKey = cacheService.generateKey('distribution:category', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const { fromDate, toDate, userId, accountId } = filters;
            const matchStage = {};
            if (fromDate || toDate) {
                matchStage.createdAt = {};
                if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
                if (toDate) matchStage.createdAt.$lte = new Date(toDate);
            }
            if (userId) matchStage.userId = userId;
            if (accountId) matchStage.accountId = accountId;

            const pipeline = [
                { $match: matchStage },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ];

            const results = await Email.aggregate(pipeline);
            const distribution = {};
            results.forEach(item => {
                distribution[item._id || 'Other'] = item.count;
            });
            return distribution;
        }, ttl);
    }

    async getPriorityDistribution(filters = {}) {
        const cacheKey = cacheService.generateKey('distribution:priority', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const { fromDate, toDate, userId, accountId } = filters;
            const matchStage = {};
            if (fromDate || toDate) {
                matchStage.createdAt = {};
                if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
                if (toDate) matchStage.createdAt.$lte = new Date(toDate);
            }
            if (userId) matchStage.userId = userId;
            if (accountId) matchStage.accountId = accountId;

            const pipeline = [
                { $match: matchStage },
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ];

            const results = await Email.aggregate(pipeline);
            const distribution = {};
            results.forEach(item => {
                distribution[item._id || 'MEDIUM'] = item.count;
            });
            return distribution;
        }, ttl);
    }

    async getSentimentDistribution(filters = {}) {
        const cacheKey = cacheService.generateKey('distribution:sentiment', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const { fromDate, toDate, userId, accountId } = filters;
            const matchStage = {};
            if (fromDate || toDate) {
                matchStage.createdAt = {};
                if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
                if (toDate) matchStage.createdAt.$lte = new Date(toDate);
            }
            if (userId) matchStage.userId = userId;
            if (accountId) matchStage.accountId = accountId;

            const pipeline = [
                { $match: matchStage },
                { $group: { _id: '$sentiment', count: { $sum: 1 } } }
            ];

            const results = await Email.aggregate(pipeline);
            const distribution = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
            results.forEach(item => {
                if (distribution.hasOwnProperty(item._id)) {
                    distribution[item._id] = item.count;
                }
            });
            return distribution;
        }, ttl);
    }

    async getConfidenceDistribution(filters = {}) {
        const cacheKey = cacheService.generateKey('distribution:confidence', filters);
        const ttl = this.determineCacheTTL(filters.fromDate, filters.toDate);

        return cacheService.getOrSet(cacheKey, async () => {
            const { fromDate, toDate, userId, accountId } = filters;
            const matchStage = {
                confidence: { $exists: true, $ne: null }
            };
            if (fromDate || toDate) {
                matchStage.createdAt = {};
                if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
                if (toDate) matchStage.createdAt.$lte = new Date(toDate);
            }
            if (userId) matchStage.userId = userId;
            if (accountId) matchStage.accountId = accountId;

            const pipeline = [
                { $match: matchStage },
                {
                    $bucket: {
                        groupBy: '$confidence',
                        boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
                        default: 'other',
                        output: {
                            count: { $sum: 1 }
                        }
                    }
                }
            ];

            const results = await Email.aggregate(pipeline);
            const distribution = {
                'Very Low (0-20%)': 0,
                'Low (20-40%)': 0,
                'Medium (40-60%)': 0,
                'High (60-80%)': 0,
                'Very High (80-100%)': 0
            };

            results.forEach(item => {
                if (item._id === 0) distribution['Very Low (0-20%)'] = item.count;
                else if (item._id === 0.2) distribution['Low (20-40%)'] = item.count;
                else if (item._id === 0.4) distribution['Medium (40-60%)'] = item.count;
                else if (item._id === 0.6) distribution['High (60-80%)'] = item.count;
                else if (item._id === 0.8) distribution['Very High (80-100%)'] = item.count;
            });

            return distribution;
        }, ttl);
    }
}

module.exports = new ChartAggregationOptimizedService();
