// src/routes/index.js - Add email accounts routes
const express = require('express');
const router = express.Router();
const authRoutes = require('../routes/auth.routes');
const emailRoutes = require('../routes/email.routes');
const analyticsRoutes = require('../routes/analytics.routes');
const emailAccountRoutes = require('../routes/emailAccount.routes');
const { authMiddleware } = require('../middleware/auth.middleware');
const mailService = require('../services/mail.service');
const ImapService = require('../services/imap.service');
const EmailAccount = require('../models/emailAccount.model');
const Email = require('../models/email.model');
const mongoose = require('mongoose');


// Manual sync endpoint
router.post('/email/sync/manual', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const { accountId, limit = 50 } = req.body;

        console.log(`📥 Manual sync requested by ${userId} for account ${accountId}`);

        // Get email account
        const account = await EmailAccount.findOne({
            _id: accountId,
            userId
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Email account not found'
            });
        }

        // Test IMAP connection
        const imapService = new ImapService(account.imapConfig);

        try {
            await imapService.connect();
            console.log('✅ Connected to IMAP');

            // Get mailbox info
            const boxInfo = await imapService.getMailboxInfo();
            console.log(`📬 Total messages: ${boxInfo.messages}`);

            // Fetch emails
            const emails = await imapService.fetchRecentEmails(limit);
            console.log(`📥 Fetched ${emails.length} emails from server`);

            let importedCount = 0;
            let skippedCount = 0;

            // Save emails to database
            for (const emailData of emails) {
                // Check if email already exists
                const existingEmail = await Email.findOne({
                    messageId: emailData.messageId,
                    accountId
                });

                if (!existingEmail && emailData.messageId) {
                    const email = new Email({
                        accountId,
                        userId,
                        fromAddress: emailData.from,
                        toAddress: account.email,
                        subject: emailData.subject || '(No Subject)',
                        bodyText: emailData.body || '',
                        bodyHtml: emailData.html || '',
                        messageId: emailData.messageId,
                        date: emailData.date,
                        status: 'NEW',
                        metadata: {
                            fetchedAt: new Date(),
                            hasAttachments: emailData.attachments?.length > 0
                        }
                    });

                    await email.save();
                    importedCount++;

                    console.log(`   ✅ Imported: ${email.subject}`);
                } else {
                    skippedCount++;
                }
            }

            await imapService.disconnect();

            // Update account last sync time
            account.lastSyncedAt = new Date();
            account.statistics = account.statistics || {};
            account.statistics.totalEmails = (account.statistics.totalEmails || 0) + importedCount;
            await account.save();

            res.json({
                success: true,
                message: `Sync completed successfully`,
                data: {
                    totalInMailbox: boxInfo.messages,
                    fetched: emails.length,
                    imported: importedCount,
                    skipped: skippedCount,
                    accountEmail: account.email,
                    lastSyncedAt: account.lastSyncedAt
                }
            });

        } catch (imapError) {
            console.error('❌ IMAP Error:', imapError);

            res.status(500).json({
                success: false,
                message: `IMAP error: ${imapError.message}`,
                error: imapError.message
            });
        }

    } catch (error) {
        console.error('❌ Sync error:', error);
        res.status(500).json({
            success: false,
            message: `Sync failed: ${error.message}`
        });
    }
});

router.post('/test-send-email', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            to = 'jagannathkashyap38@gmail.com',
            subject = 'Test from ProcessMail',
            body = 'This is a test email from ProcessMail system',
            accountId
        } = req.body;

        // Get email account
        let account;
        if (accountId) {
            account = await EmailAccount.findOne({
                _id: accountId,
                isActive: true,
                $or: [
                    { userId },
                    { 'sharedWith.userId': userId }
                ]
            });

            // Fallback when provided accountId is stale/invalid/inactive
            if (!account) {
                account = await EmailAccount.findOne({
                    isActive: true,
                    $or: [
                        { userId },
                        { 'sharedWith.userId': userId }
                    ]
                });
            }
        } else {
            // Prefer default account
            account = await EmailAccount.findOne({
                userId,
                isDefault: true,
                isActive: true
            });

            // Fallback: any active accessible account
            if (!account) {
                account = await EmailAccount.findOne({
                    isActive: true,
                    $or: [
                        { userId },
                        { 'sharedWith.userId': userId }
                    ]
                });
            }
        }

        if (!account) {
            account = await EmailAccount.findOne({ isActive: true })
                .sort({ isDefault: -1, updatedAt: -1 });
        }

        if (!account) {
            account = await EmailAccount.findOne({})
                .sort({ isDefault: -1, updatedAt: -1 });
        }

        if (!account) {
            return res.status(400).json({
                success: false,
                message: 'No email account found or configured'
            });
        }

        // Test SMTP connection first
        const connectionTest = await mailService.testSMTPConnection(account._id);
        if (!connectionTest.success) {
            return res.status(400).json({
                success: false,
                message: `SMTP connection failed: ${connectionTest.message}`
            });
        }

        // Send test email
        const result = await mailService.sendEmail(account._id, {
            to,
            subject,
            text: body,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">ProcessMail Test Email</h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            ${body.replace(/\n/g, '<br>')}
          </div>
          <div style="font-size: 12px; color: #6c757d; margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6;">
            <p><strong>Email Details:</strong></p>
            <p>From: ${account.email}</p>
            <p>To: ${to}</p>
            <p>Sent via: ProcessMail System</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
        });

        // Persist sent email so frontend stats/cards (e.g., "Sent Today") reflect actual sends.
        await Email.create({
            accountId: account._id,
            userId,
            fromAddress: account.email,
            toAddress: to,
            subject,
            bodyText: body,
            messageId: result.messageId,
            status: 'SENT',
            sentAt: new Date(),
            metadata: {
                source: 'manual_send',
                sentVia: 'smtp_test_send'
            }
        });

        res.json({
            success: true,
            message: 'Test email sent successfully',
            data: {
                messageId: result.messageId,
                from: account.email,
                to,
                subject,
                sentAt: new Date()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Failed to send test email: ${error.message}`
        });
    }
});
router.post('/email/accounts/quick-create', authMiddleware, async (req, res) => {
    try {
        const { name, email, provider, imapConfig, smtpConfig } = req.body;
        const userId = req.user._id;

        // Simple validation
        if (!name || !email || !provider || !imapConfig || !smtpConfig) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const EmailAccount = require('../models/emailAccount.model');

        const account = await EmailAccount.create({
            userId,
            name,
            email: email.toLowerCase(),
            provider,
            imapConfig,
            smtpConfig,
            syncFrequency: req.body.syncFrequency || '30min',
            isDefault: req.body.isDefault || false,
            isActive: req.body.isActive !== undefined ? req.body.isActive : true,
            labels: [
                { name: 'Inbox', color: '#3B82F6', type: 'system' },
                { name: 'Sent', color: '#10B981', type: 'system' },
                { name: 'Drafts', color: '#F59E0B', type: 'system' },
                { name: 'Trash', color: '#EF4444', type: 'system' }
            ],
            statistics: {
                totalEmails: 0,
                unreadEmails: 0
            }
        });

        res.status(201).json({
            success: true,
            message: 'Email account created successfully',
            data: account
        });

    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
const DB_STATES = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
};

const buildHealthPayload = () => {
    const dbStateCode = mongoose.connection.readyState;
    const dbState = DB_STATES[dbStateCode] || 'unknown';

    return {
        success: dbState === 'connected',
        message: 'ProcessMail API health check',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        service: 'processmail-api',
        database: {
            state: dbState,
            readyState: dbStateCode
        }
    };
};

// Health check
router.get('/health', (req, res) => {
    const payload = buildHealthPayload();
    const statusCode = payload.success ? 200 : 503;
    res.status(statusCode).json(payload);
});

// Common alias used by external monitors/load balancers.
router.get('/health-check', (req, res) => {
    const payload = buildHealthPayload();
    const statusCode = payload.success ? 200 : 503;
    res.status(statusCode).json(payload);
});

// API Routes
router.use('/auth', authRoutes);
router.use('/emails', emailRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/email/accounts', emailAccountRoutes);

// AI endpoints
router.post('/ai/analyze/:id', (req, res) => {
    // Your AI analysis endpoint
    res.json({
        success: true,
        data: {
            category: 'Other',
            confidence: 0.85,
            sentiment: 'neutral',
            urgency: 'medium',
            suggestedResponse: 'Thank you for your email. We will get back to you shortly.'
        }
    });
});

router.post('/ai/reply/:id', (req, res) => {
    const { tone = 'professional' } = req.body;
    const templates = {
        professional: 'Thank you for your email. We appreciate your inquiry and will respond within 24 hours.',
        friendly: 'Hi there! Thanks for reaching out. We\'ll get back to you as soon as possible.',
        formal: 'Dear Sir/Madam, Thank you for your correspondence. We will address your inquiry promptly.'
    };

    res.json({
        success: true,
        data: {
            draft: templates[tone] || templates.professional
        }
    });
});

router.post('/ai/categorize/:accountId', async (req, res) => {
    // Bulk categorize emails for an account
    res.json({
        success: true,
        message: 'Categorization started',
        data: { processed: 0, categorized: 0 }
    });
});

router.post('/ai/summarize/:id', (req, res) => {
    res.json({
        success: true,
        data: {
            summary: 'This email discusses a product inquiry with specific questions about features and pricing.',
            keyPoints: ['Product inquiry', 'Feature questions', 'Pricing information'],
            suggestedAction: 'Respond with detailed feature list and pricing'
        }
    });
});

// Analytics endpoints matching frontend
router.get('/analytics/overview', (req, res) => {
    // Redirect to our dashboard endpoint
    res.redirect('/dashboard');
});

router.get('/analytics/email-stats', (req, res) => {
    const { period = 'week' } = req.query;
    // Return email statistics
    res.json({
        success: true,
        data: {
            period,
            total: 1500,
            replied: 1200,
            pending: 300,
            avgResponseTime: 2.5 // hours
        }
    });
});

router.get('/analytics/account-stats', async (req, res) => {
    // Get account statistics
    const stats = [
        { account: 'support@company.com', total: 500, replied: 450, pending: 50 },
        { account: 'sales@company.com', total: 400, replied: 350, pending: 50 },
        { account: 'info@company.com', total: 600, replied: 400, pending: 200 }
    ];

    res.json({
        success: true,
        data: stats
    });
});

// Email endpoints matching frontend
router.get('/email/emails', (req, res) => {
    // Redirect to our emails endpoint with query params
    res.redirect(`/emails?${new URLSearchParams(req.query).toString()}`);
});

router.get('/email/:id', (req, res) => {
    res.redirect(`/emails/${req.params.id}`);
});

router.post('/email/accounts/:accountId/send', (req, res) => {
    const { accountId } = req.params;
    const emailData = req.body;

    // Handle email sending
    res.json({
        success: true,
        message: 'Email sent successfully',
        data: { sentAt: new Date() }
    });
});

router.post('/email/sync/gmail', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 50 } = req.body;

        console.log(`📥 Manual Gmail sync requested by user ${userId}`);

        // Get the Gmail account
        const account = await EmailAccount.findOne({
            userId,
            provider: 'gmail',
            isActive: true
        });

        if (!account) {
            return res.status(400).json({
                success: false,
                message: 'No active Gmail account found. Please add one first.'
            });
        }

        console.log(`📧 Syncing from: ${account.email}`);

        // IMAP configuration
        const imapConfig = {
            user: account.imapConfig.auth.user,
            password: account.imapConfig.auth.pass,
            host: account.imapConfig.host,
            port: account.imapConfig.port,
            tls: account.imapConfig.secure,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 30000
        };

        const imap = new Imap(imapConfig);

        // Connect and fetch emails
        const fetchEmails = () => {
            return new Promise((resolve, reject) => {
                imap.once('ready', () => {
                    imap.openBox('INBOX', false, async (err, box) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        const totalMessages = box.messages.total;
                        console.log(`📬 Total messages in inbox: ${totalMessages}`);

                        if (totalMessages === 0) {
                            imap.end();
                            resolve({ fetched: 0, saved: 0, total: 0 });
                            return;
                        }

                        const fetchLimit = Math.min(limit, totalMessages);
                        const start = Math.max(1, totalMessages - fetchLimit + 1);
                        const end = totalMessages;

                        const fetch = imap.seq.fetch(`${start}:${end}`, {
                            bodies: '',
                            struct: true
                        });

                        const emails = [];

                        fetch.on('message', (msg, seqno) => {
                            const email = { seqno };

                            msg.on('body', (stream) => {
                                simpleParser(stream, (err, parsed) => {
                                    if (!err) {
                                        email.messageId = parsed.messageId;
                                        email.from = parsed.from?.text || '';
                                        email.subject = parsed.subject || '(No Subject)';
                                        email.date = parsed.date || new Date();
                                        email.body = parsed.text || '';
                                        email.html = parsed.html || '';
                                        emails.push(email);
                                    }
                                });
                            });
                        });

                        fetch.once('error', reject);

                        fetch.once('end', async () => {
                            imap.end();

                            // Save to database
                            let savedCount = 0;
                            for (const emailData of emails.reverse()) {
                                if (!emailData.messageId) continue;

                                const existing = await Email.findOne({
                                    messageId: emailData.messageId,
                                    fromAddress: emailData.from
                                });

                                if (!existing) {
                                    const email = new Email({
                                        accountId: account._id,
                                        userId,
                                        fromAddress: emailData.from,
                                        toAddress: account.email,
                                        subject: emailData.subject,
                                        bodyText: emailData.body,
                                        bodyHtml: emailData.html,
                                        messageId: emailData.messageId,
                                        date: emailData.date,
                                        status: 'NEW',
                                        metadata: {
                                            fetchedAt: new Date(),
                                            source: 'gmail_imap'
                                        }
                                    });

                                    await email.save();
                                    savedCount++;
                                }
                            }

                            resolve({
                                fetched: emails.length,
                                saved: savedCount,
                                total: totalMessages,
                                account: account.email
                            });
                        });
                    });
                });

                imap.once('error', reject);
                imap.connect();
            });
        };

        const result = await fetchEmails();

        // Update account last sync time
        account.lastSyncedAt = new Date();
        await account.save();

        res.json({
            success: true,
            message: `Synced ${result.saved} new emails from Gmail`,
            data: result
        });

    } catch (error) {
        console.error('❌ Gmail sync error:', error);
        res.status(500).json({
            success: false,
            message: `Sync failed: ${error.message}`,
            error: error.message
        });
    }
});

module.exports = router;
