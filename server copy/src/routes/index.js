const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const authRoutes = require('./auth.routes');
const emailRoutes = require('./email.routes');
const analyticsRoutes = require('./analytics.routes');
const emailAccountRoutes = require('./emailAccount.routes');
const userRoutes = require('./user.routes');
const chartAggregationRoutes = require('./chartAggregation.routes');
const bruteForceProtectionRoutes = require('./bruteForceProtection.routes');
const { authMiddleware } = require('../middleware/auth.middleware');
const Email = require('../models/email.model');
const EmailAccount = require('../models/emailAccount.model');
const mailService = require('../services/mail.service');
const syncService = require('../services/sync.service');
const aiService = require('../services/ai.service');
const logger = require('../utils/logger');

const DB_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

function buildHealthPayload() {
    const code = mongoose.connection.readyState;
    const dbState = DB_STATES[code] || 'unknown';
    return {
        success: dbState === 'connected',
        service: 'processmail-api',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: { state: dbState }
    };
}

router.get('/health', (req, res) => {
    const payload = buildHealthPayload();
    res.status(payload.success ? 200 : 503).json(payload);
});

router.post('/email/sync/manual', authMiddleware, async (req, res, next) => {
    try {
        const { accountId, limit = 50 } = req.body;
        const userId = req.user._id;

        const account = await EmailAccount.findOne({ _id: accountId, userId });
        if (!account) {
            return res.status(404).json({ success: false, message: 'Email account not found' });
        }

        const result = await syncService.runAccountSync(account, { limit, userId });
        res.json({ success: true, message: 'Sync completed', data: result });
    } catch (err) {
        next(err);
    }
});

router.post('/email/accounts/quick-create', authMiddleware, async (req, res, next) => {
    try {
        const { name, email, provider, imapConfig, smtpConfig } = req.body;
        if (!name || !email || !provider || !imapConfig || !smtpConfig) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const account = await EmailAccount.create({
            userId: req.user._id,
            name,
            email: email.toLowerCase(),
            provider,
            imapConfig,
            smtpConfig,
            syncFrequency: req.body.syncFrequency || '30min',
            isDefault: req.body.isDefault || false,
            isActive: req.body.isActive !== false,
            labels: [
                { name: 'Inbox', color: '#3B82F6', type: 'system' },
                { name: 'Sent', color: '#10B981', type: 'system' },
                { name: 'Drafts', color: '#F59E0B', type: 'system' },
                { name: 'Trash', color: '#EF4444', type: 'system' }
            ],
            statistics: { totalEmails: 0, unreadEmails: 0 }
        });

        res.status(201).json({ success: true, data: account });
    } catch (err) {
        next(err);
    }
});

router.post('/ai/analyze/:id', authMiddleware, async (req, res, next) => {
    try {
        const email = await Email.findById(req.params.id).lean();
        if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

        const classification = await aiService.classifyEmail(email.subject || '', email.bodyText || '');
        res.json({ success: true, data: { ...classification, urgency: email.priority || 'MEDIUM' } });
    } catch (err) {
        next(err);
    }
});

router.post('/ai/reply/:id', authMiddleware, async (req, res, next) => {
    try {
        const { tone = 'professional', subject = '', bodyText = '' } = req.body;

        if (req.params.id === 'compose') {
            const classification = await aiService.classifyEmail(subject, bodyText || subject);
            const draft = await aiService.generateSmartReply({
                category: classification.category,
                originalText: bodyText || subject,
                tone,
                sentiment: classification.sentiment
            });
            return res.json({ success: true, data: { draft, meta: classification } });
        }

        const email = await Email.findById(req.params.id);
        if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

        const classification = await aiService.classifyEmail(email.subject || '', email.bodyText || '');
        const draft = await aiService.generateSmartReply({
            category: classification.category,
            originalText: email.bodyText || '',
            tone,
            sentiment: classification.sentiment
        });
        res.json({ success: true, data: { draft, meta: classification } });
    } catch (err) {
        next(err);
    }
});

router.use('/auth', authRoutes);
router.use('/emails', emailRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/email/accounts', emailAccountRoutes);
router.use('/users', userRoutes);
router.use('/charts', chartAggregationRoutes);
router.use('/security', bruteForceProtectionRoutes);

module.exports = router;
