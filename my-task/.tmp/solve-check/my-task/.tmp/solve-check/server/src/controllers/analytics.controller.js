const Email = require('../models/email.model');
const AuditLog = require('../modules/audit/audit.model');
const { EMAIL_STATUS, EMAIL_CATEGORIES } = require('../utils/constants');

class AnalyticsController {
    constructor() {
        this.getDashboardStats = this.getDashboardStats.bind(this);
        this.getCategoryAnalytics = this.getCategoryAnalytics.bind(this);
        this.getTeamAnalytics = this.getTeamAnalytics.bind(this);
        this.calculateAvgResponseTime = this.calculateAvgResponseTime.bind(this);
    }

    async getDashboardStats(req, res, next) {
        try {
            const { fromDate, toDate } = req.query;

            const dateFilter = {};
            if (fromDate || toDate) {
                dateFilter.createdAt = {};
                if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
                if (toDate) dateFilter.createdAt.$lte = new Date(toDate);
            }

            // Get all stats in parallel
            const [
                totalEmails,
                unprocessedEmails,
                avgResponseTime,
                categoryStats,
                statusStats,
                priorityStats,
                recentActivity
            ] = await Promise.all([
                // Total emails
                Email.countDocuments(dateFilter),

                // Unprocessed emails (NEW, CLASSIFIED, DRAFTED)
                Email.countDocuments({
                    ...dateFilter,
                    status: { $in: [EMAIL_STATUS.NEW, EMAIL_STATUS.CLASSIFIED, EMAIL_STATUS.DRAFTED] }
                }),

                // Average response time (sent - received)
                this.calculateAvgResponseTime(dateFilter),

                // Category distribution
                Email.aggregate([
                    { $match: dateFilter },
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),

                // Status distribution
                Email.aggregate([
                    { $match: dateFilter },
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),

                // Priority distribution
                Email.aggregate([
                    { $match: dateFilter },
                    { $group: { _id: '$priority', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),

                // Recent activity
                AuditLog.find(dateFilter)
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .populate('userId', 'name email')
                    .populate('emailId', 'subject')
            ]);

            // Format data for frontend
            const categoryData = {};
            EMAIL_CATEGORIES.forEach(cat => {
                categoryData[cat] = categoryStats.find(s => s._id === cat)?.count || 0;
            });

            const statusData = {};
            Object.values(EMAIL_STATUS).forEach(status => {
                statusData[status] = statusStats.find(s => s._id === status)?.count || 0;
            });

            res.json({
                success: true,
                data: {
                    overview: {
                        totalEmails,
                        unprocessedEmails,
                        processedEmails: totalEmails - unprocessedEmails,
                        avgResponseTime: avgResponseTime || 0,
                        processingRate: totalEmails > 0 ?
                            ((totalEmails - unprocessedEmails) / totalEmails * 100).toFixed(1) : 0
                    },
                    categories: categoryData,
                    status: statusData,
                    priorities: priorityStats.reduce((acc, stat) => {
                        acc[stat._id] = stat.count;
                        return acc;
                    }, {}),
                    recentActivity
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getCategoryAnalytics(req, res, next) {
        try {
            const { fromDate, toDate } = req.query;

            const dateFilter = {};
            if (fromDate || toDate) {
                dateFilter.createdAt = {};
                if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
                if (toDate) dateFilter.createdAt.$lte = new Date(toDate);
            }

            const analytics = await Email.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: '$category',
                        total: { $sum: 1 },
                        avgConfidence: { $avg: '$confidence' },
                        avgResponseTime: {
                            $avg: {
                                $subtract: ['$sentAt', '$createdAt']
                            }
                        },
                        byStatus: {
                            $push: {
                                status: '$status',
                                emailId: '$_id'
                            }
                        }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        total: 1,
                        avgConfidence: { $round: ['$avgConfidence', 2] },
                        avgResponseTime: {
                            $divide: [
                                { $ifNull: ['$avgResponseTime', 0] },
                                1000 * 60 // Convert to minutes
                            ]
                        },
                        statusCounts: {
                            $arrayToObject: {
                                $map: {
                                    input: '$byStatus',
                                    as: 'item',
                                    in: {
                                        k: '$$item.status',
                                        v: { $size: { $filter: { input: '$byStatus', as: 's', cond: { $eq: ['$$s.status', '$$item.status'] } } } }
                                    }
                                }
                            }
                        }
                    }
                },
                { $sort: { total: -1 } }
            ]);

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            next(error);
        }
    }

    async getTeamAnalytics(req, res, next) {
        try {
            const { fromDate, toDate } = req.query;

            const dateFilter = {};
            if (fromDate || toDate) {
                dateFilter.createdAt = {};
                if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
                if (toDate) dateFilter.createdAt.$lte = new Date(toDate);
            }

            const analytics = await Email.aggregate([
                { $match: { ...dateFilter, assignedUserId: { $ne: null } } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'assignedUserId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $group: {
                        _id: '$assignedUserId',
                        userName: { $first: '$user.name' },
                        userEmail: { $first: '$user.email' },
                        totalAssigned: { $sum: 1 },
                        completed: {
                            $sum: {
                                $cond: [{ $in: ['$status', [EMAIL_STATUS.SENT]] }, 1, 0]
                            }
                        },
                        pending: {
                            $sum: {
                                $cond: [{ $in: ['$status', [EMAIL_STATUS.NEW, EMAIL_STATUS.CLASSIFIED, EMAIL_STATUS.DRAFTED, EMAIL_STATUS.REVIEWED]] }, 1, 0]
                            }
                        },
                        avgResponseTime: {
                            $avg: {
                                $cond: [
                                    { $eq: ['$status', EMAIL_STATUS.SENT] },
                                    { $subtract: ['$sentAt', '$createdAt'] },
                                    null
                                ]
                            }
                        },
                        byCategory: {
                            $push: {
                                category: '$category',
                                emailId: '$_id'
                            }
                        }
                    }
                },
                {
                    $project: {
                        user: {
                            _id: '$_id',
                            name: '$userName',
                            email: '$userEmail'
                        },
                        totalAssigned: 1,
                        completed: 1,
                        pending: 1,
                        completionRate: {
                            $cond: [
                                { $eq: ['$totalAssigned', 0] },
                                0,
                                { $multiply: [{ $divide: ['$completed', '$totalAssigned'] }, 100] }
                            ]
                        },
                        avgResponseTime: {
                            $divide: [
                                { $ifNull: ['$avgResponseTime', 0] },
                                1000 * 60 // Convert to minutes
                            ]
                        },
                        categoryDistribution: {
                            $arrayToObject: {
                                $map: {
                                    input: '$byCategory',
                                    as: 'item',
                                    in: {
                                        k: '$$item.category',
                                        v: { $size: { $filter: { input: '$byCategory', as: 'c', cond: { $eq: ['$$c.category', '$$item.category'] } } } }
                                    }
                                }
                            }
                        }
                    }
                },
                { $sort: { completed: -1 } }
            ]);

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            next(error);
        }
    }

    async calculateAvgResponseTime(dateFilter) {
        const result = await Email.aggregate([
            {
                $match: {
                    ...dateFilter,
                    status: EMAIL_STATUS.SENT,
                    sentAt: { $ne: null },
                    createdAt: { $ne: null }
                }
            },
            {
                $group: {
                    _id: null,
                    avgTime: {
                        $avg: {
                            $subtract: ['$sentAt', '$createdAt']
                        }
                    }
                }
            }
        ]);

        if (result.length > 0 && result[0].avgTime) {
            return Math.round(result[0].avgTime / (1000 * 60)); // Convert to minutes
        }

        return 0;
    }
}

module.exports = new AnalyticsController();
