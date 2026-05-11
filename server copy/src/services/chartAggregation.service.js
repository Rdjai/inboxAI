const Email = require('../models/email.model');
const User = require('../models/user.model');
const AuditLog = require('../modules/audit/audit.model');
const logger = require('../utils/logger');

class ChartAggregationService {
    /**
     * Get email volume aggregation by date
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} - Aggregated volume data
     */
    async getEmailVolumeByDate(filters = {}) {
        try {
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
                            date: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$createdAt'
                                }
                            },
                            status: '$status'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.date': 1 }
                }
            ];

            const results = await Email.aggregate(pipeline);

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
        } catch (error) {
            logger.error('Error aggregating email volume by date:', error);
            throw error;
        }
    }

    /**
     * Get email volume aggregation by hour
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} - Hourly aggregation
     */
    async getEmailVolumeByHour(filters = {}) {
        try {
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
                            hour: {
                                $hour: '$createdAt'
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.hour': 1 }
                }
            ];

            const results = await Email.aggregate(pipeline);

            // Fill in missing hours
            const hourlyData = {};
            for (let i = 0; i < 24; i++) {
                hourlyData[i] = 0;
            }

            results.forEach(item => {
                hourlyData[item._id.hour] = item.count;
            });

            return Object.entries(hourlyData).map(([hour, count]) => ({
                hour: parseInt(hour),
                count
            }));
        } catch (error) {
            logger.error('Error aggregating email volume by hour:', error);
            throw error;
        }
    }

    /**
     * Get email volume aggregation by day of week
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} - Day of week aggregation
     */
    async getEmailVolumeByDayOfWeek(filters = {}) {
        try {
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
                            dayOfWeek: {
                                $dayOfWeek: '$createdAt'
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.dayOfWeek': 1 }
                }
            ];

            const results = await Email.aggregate(pipeline);

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayData = {};
            days.forEach((day, index) => {
                dayData[index + 1] = { day, count: 0 };
            });

            results.forEach(item => {
                if (dayData[item._id.dayOfWeek]) {
                    dayData[item._id.dayOfWeek].count = item.count;
                }
            });

            return Object.values(dayData);
        } catch (error) {
            logger.error('Error aggregating email volume by day of week:', error);
            throw error;
        }
    }

    /**
     * Get email status distribution
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>} - Status distribution
     */
    async getStatusDistribution(filters = {}) {
        try {
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
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ];

            const results = await Email.aggregate(pipeline);

            const distribution = {};
            results.forEach(item => {
                distribution[item._id || 'UNKNOWN'] = item.count;
            });

            return distribution;
        } catch (error) {
            logger.error('Error aggregating status distribution:', error);
            throw error;
        }
    }

    /**
     * Get email category distribution
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>} - Category distribution
     */
    async getCategoryDistribution(filters = {}) {
        try {
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
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                }
            ];

            const results = await Email.aggregate(pipeline);

            const distribution = {};
            results.forEach(item => {
                distribution[item._id || 'Other'] = item.count;
            });

            return distribution;
        } catch (error) {
            logger.error('Error aggregating category distribution:', error);
            throw error;
        }
    }

    /**
     * Get email priority distribution
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>} - Priority distribution
     */
    async getPriorityDistribution(filters = {}) {
        try {
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
                        _id: '$priority',
                        count: { $sum: 1 }
                    }
                }
            ];

            const results = await Email.aggregate(pipeline);

            const distribution = {};
            results.forEach(item => {
                distribution[item._id || 'MEDIUM'] = item.count;
            });

            return distribution;
        } catch (error) {
            logger.error('Error aggregating priority distribution:', error);
            throw error;
        }
    }

    /**
     * Get sentiment distribution
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>} - Sentiment distribution
     */
    async getSentimentDistribution(filters = {}) {
        try {
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
                        _id: '$sentiment',
                        count: { $sum: 1 }
                    }
                }
            ];

            const results = await Email.aggregate(pipeline);

            const distribution = {
                POSITIVE: 0,
                NEUTRAL: 0,
                NEGATIVE: 0
            };

            results.forEach(item => {
                if (distribution.hasOwnProperty(item._id)) {
                    distribution[item._id] = item.count;
                }
            });

            return distribution;
        } catch (error) {
            logger.error('Error aggregating sentiment distribution:', error);
            throw error;
        }
    }

    /**
     * Get response time statistics
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>} - Response time stats
     */
    async getResponseTimeStats(filters = {}) {
        try {
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
                        medianResponseTime: { $avg: '$responseTime' },
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
                    medianResponseTime: 0,
                    count: 0
                };
            }

            return {
                avgResponseTime: Math.round(results[0].avgResponseTime || 0),
                minResponseTime: Math.round(results[0].minResponseTime || 0),
                maxResponseTime: Math.round(results[0].maxResponseTime || 0),
                medianResponseTime: Math.round(results[0].medianResponseTime || 0),
                count: results[0].count
            };
        } catch (error) {
            logger.error('Error aggregating response time stats:', error);
            throw error;
        }
    }

    /**
     * Get response time by date
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} - Daily response time data
     */
    async getResponseTimeByDate(filters = {}) {
        try {
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
        } catch (error) {
            logger.error('Error aggregating response time by date:', error);
            throw error;
        }
    }

    /**
     * Get user activity statistics
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} - User activity data
     */
    async getUserActivityStats(filters = {}) {
        try {
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
                            $sum: {
                                $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0]
                            }
                        },
                        avgResponseTime: { $avg: '$responseTime' },
                        completionRate: {
                            $avg: {
                                $cond: [
                                    { $eq: ['$status', 'SENT'] },
                                    100,
                                    0
                                ]
                            }
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
                {
                    $unwind: {
                        path: '$userInfo',
                        preserveNullAndEmptyArrays: true
                    }
                },
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
                {
                    $sort: { emailsProcessed: -1 }
                },
                {
                    $limit: limit
                }
            ];

            return await Email.aggregate(pipeline);
        } catch (error) {
            logger.error('Error aggregating user activity stats:', error);
            throw error;
        }
    }

    /**
     * Get activity heatmap data (day of week × hour)
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>} - Heatmap data
     */
    async getActivityHeatmap(filters = {}) {
        try {
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
        } catch (error) {
            logger.error('Error aggregating activity heatmap:', error);
            throw error;
        }
    }

    /**
     * Get email processing flow statistics
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>} - Flow statistics
     */
    async getEmailProcessingFlow(filters = {}) {
        try {
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
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
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
        } catch (error) {
            logger.error('Error aggregating email processing flow:', error);
            throw error;
        }
    }

    /**
     * Get confidence score distribution
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>} - Confidence distribution
     */
    async getConfidenceDistribution(filters = {}) {
        try {
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
        } catch (error) {
            logger.error('Error aggregating confidence distribution:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive dashboard aggregation
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>} - All aggregated data
     */
    async getComprehensiveAggregation(filters = {}) {
        try {
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
        } catch (error) {
            logger.error('Error getting comprehensive aggregation:', error);
            throw error;
        }
    }
}

module.exports = new ChartAggregationService();
