const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Email = require('../models/Email');
const AuditLog = require('../models/AuditLog');

router.get('/dashboard', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 30);

        // Get counts
        const [
            totalEmails,
            todayEmails,
            pendingEmails,
            categories,
            statusCounts,
            responseTime
        ] = await Promise.all([
            Email.countDocuments(),
            Email.countDocuments({ createdAt: { $gte: today } }),
            Email.countDocuments({ status: { $in: ['new', 'classified', 'drafted', 'reviewed'] } }),
            Email.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Email.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Email.aggregate([
                { $match: { sentAt: { $exists: true } } },
                {
                    $group: {
                        _id: null,
                        avgResponseTime: {
                            $avg: { $subtract: ['$sentAt', '$createdAt'] }
                        }
                    }
                }
            ])
        ]);

        // Format response time (milliseconds to hours)
        const avgResponseHours = responseTime[0]
            ? Math.round(responseTime[0].avgResponseTime / (1000 * 60 * 60) * 10) / 10
            : 0;

        res.json({
            success: true,
            data: {
                totals: {
                    all: totalEmails,
                    today: todayEmails,
                    pending: pendingEmails
                },
                categories,
                status: statusCounts,
                performance: {
                    avgResponseTime: avgResponseHours
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/activity', auth, async (req, res) => {
    try {
        const activities = await AuditLog.find()
            .populate('email', 'subject from')
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;