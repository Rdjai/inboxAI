const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const EmailAccount = require('../models/EmailAccount');
const Email = require('../models/Email');
const EmailService = require('../services/emailService');


router.get('/accounts', auth, async (req, res) => {
    try {
        const accounts = await EmailAccount.find({
            $or: [
                { userId: req.user._id },
                { 'permissions.userId': req.user._id }
            ]
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            accounts: accounts.map(acc => ({
                _id: acc._id,
                email: acc.email,
                displayName: acc.displayName,
                provider: acc.provider,
                isActive: acc.isActive,
                unreadCount: acc.unreadCount,
                lastSynced: acc.lastSynced,
                createdAt: acc.createdAt
            })),
            count: accounts.length
        });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// server/routes/emailRoutes.js - POST /accounts route
router.post('/accounts', auth, async (req, res) => {
    try {
        const { email, smtpHost, smtpPort, smtpUsername, smtpPassword, displayName, provider, isTest } = req.body;

        console.log('📥 Creating email account:', {
            email,
            provider,
            isTest,
            hasPassword: !!smtpPassword
        });

        // Check if user already has this email
        const existing = await EmailAccount.findOne({
            userId: req.user._id,
            email: email.toLowerCase()
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Email account already exists'
            });
        }

        // Create account with provided data or defaults
        const account = new EmailAccount({
            userId: req.user._id,
            email: email.toLowerCase(),
            displayName: displayName || email.split('@')[0],
            provider: provider || 'custom',
            smtpHost: smtpHost || 'smtp.gmail.com',
            smtpPort: smtpPort ? parseInt(smtpPort) : 587,
            smtpUsername: smtpUsername || email.toLowerCase(),
            smtpPassword: smtpPassword || 'dummy-password-for-testing',
            imapHost: req.body.imapHost || '',
            imapPort: req.body.imapPort || 993,
            useSSL: req.body.useSSL !== false,
            useTLS: req.body.useTLS !== false,
            isActive: true,
            unreadCount: 0,
            lastSynced: null,
            isTest: isTest || false
        });

        // ✅ SKIP SMTP CONNECTION TEST FOR DEVELOPMENT
        console.log('✅ Skipping SMTP connection test for development');

        // If you want to test later, uncomment this:
        /*
        if (!isTest) {
            try {
                const emailService = new EmailService(account);
                await emailService.fetchEmails(1);
                console.log('✅ SMTP connection test passed');
            } catch (error) {
                console.error('❌ SMTP connection test failed:', error.message);
                // Don't fail, just log for development
                console.log('⚠️  Continuing without SMTP test for development');
            }
        }
        */

        await account.save();
        console.log('✅ Account saved to database:', account._id);

        // Return success with account data
        res.status(201).json({
            success: true,
            message: 'Email account added successfully',
            account: {
                _id: account._id,
                email: account.email,
                displayName: account.displayName,
                provider: account.provider,
                smtpHost: account.smtpHost,
                smtpPort: account.smtpPort,
                isActive: account.isActive,
                unreadCount: account.unreadCount,
                lastSynced: account.lastSynced,
                createdAt: account.createdAt,
                isTest: account.isTest
            }
        });

    } catch (error) {
        console.error('❌ Create account error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create account'
        });
    }
});
// router.post('/accounts', auth, async (req, res) => {
//     try {
//         const { email, smtpHost, smtpPort, smtpUsername, smtpPassword, displayName, provider } = req.body;

//         const existing = await EmailAccount.findOne({
//             userId: req.user._id,
//             email: email.toLowerCase()
//         });

//         if (existing) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Email account already exists'
//             });
//         }

//         const account = new EmailAccount({
//             userId: req.user._id,
//             email: email.toLowerCase(),
//             displayName,
//             provider: provider || 'custom',
//             smtpHost,
//             smtpPort: parseInt(smtpPort),
//             smtpUsername,
//             smtpPassword,
//             imapHost: req.body.imapHost || '',
//             imapPort: req.body.imapPort || 993,
//             useSSL: req.body.useSSL !== false,
//             useTLS: req.body.useTLS !== false,
//             isActive: true,
//             unreadCount: 0,
//             lastSynced: null
//         });

//         await account.save();

//         // Return success response
//         res.status(201).json({
//             success: true,
//             message: 'Email account added successfully',
//             account: {
//                 _id: account._id,
//                 email: account.email,
//                 displayName: account.displayName,
//                 provider: account.provider,
//                 smtpHost: account.smtpHost,
//                 smtpPort: account.smtpPort,
//                 isActive: account.isActive,
//                 unreadCount: account.unreadCount,
//                 lastSynced: account.lastSynced,
//                 createdAt: account.createdAt,
//                 updatedAt: account.updatedAt
//             }
//         });

//     } catch (error) {
//         console.error('Create account error:', error);
//         res.status(400).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// Get emails for specific account
router.get('/accounts/:accountId/emails', auth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const {
            limit = 50,
            page = 1,
            category,
            isRead,
            search,
            label
        } = req.query;

        // Check permission
        const account = await EmailAccount.findOne({
            _id: accountId,
            $or: [
                { userId: req.user._id },
                { 'permissions.userId': req.user._id }
            ]
        });

        if (!account) {
            return res.status(404).json({ error: 'Email account not found or no permission' });
        }

        // Build query
        const query = { emailAccountId: accountId };

        if (category) query.category = category;
        if (isRead !== undefined) query.isRead = isRead === 'true';
        if (label) query.labels = label;

        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { 'body.text': { $regex: search, $options: 'i' } },
                { 'from.email': { $regex: search, $options: 'i' } },
                { 'from.name': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const emails = await Email.find(query)
            .sort({ receivedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Email.countDocuments(query);

        res.json({
            emails,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send email from specific account
// server/routes/emailRoutes.js - POST /send route
router.post('/accounts/:accountId/send', auth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { to, subject, body, attachments, cc, bcc } = req.body;

        console.log('📤 Send email request:', {
            accountId,
            to,
            subject,
            bodyLength: body?.length || 0
        });

        // Find the account
        const account = await EmailAccount.findOne({
            _id: accountId,
            userId: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                error: 'Email account not found'
            });
        }

        // ✅ If it's a test account, skip real SMTP and return success
        if (account.isTest) {
            console.log('✅ Test account detected, skipping real SMTP send');

            // Create a mock sent email record
            const mockEmail = new Email({
                emailAccountId: account._id,
                userId: req.user._id,
                messageId: `mock-${Date.now()}`,
                threadId: Date.now().toString(36),
                from: {
                    name: account.displayName || '',
                    email: account.email
                },
                to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
                cc: cc ? (Array.isArray(cc) ? cc.map(email => ({ email })) : [{ email: cc }]) : [],
                bcc: bcc ? (Array.isArray(bcc) ? bcc.map(email => ({ email })) : [{ email: bcc }]) : [],
                subject: subject || '(No Subject)',
                body: { html: body },
                sentAt: new Date(),
                category: 'sent'
            });

            await mockEmail.save();
            console.log('✅ Mock email saved to database:', mockEmail._id);

            return res.json({
                success: true,
                message: 'Email sent successfully (test mode)',
                data: {
                    messageId: mockEmail.messageId,
                    preview: `To: ${to}, Subject: ${subject}`
                }
            });
        }

        // For real accounts, use the real email service
        const emailService = new EmailService(account);
        const result = await emailService.sendEmail(to, subject, body, attachments, cc, bcc);

        res.json({
            success: true,
            message: 'Email sent successfully',
            data: result
        });

    } catch (error) {
        console.error('❌ Send email error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send email'
        });
    }
});

// Share email account with another user
router.post('/accounts/:accountId/share', auth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { userId, role } = req.body;

        // Only account owner (admin) can share
        const account = await EmailAccount.findOne({
            _id: accountId,
            userId: req.user._id
        });

        if (!account) {
            return res.status(403).json({
                error: 'Only account owner can share this account'
            });
        }

        // Check if permission already exists
        const existingPermission = account.permissions.find(
            p => p.userId.toString() === userId
        );

        if (existingPermission) {
            existingPermission.role = role;
        } else {
            account.permissions.push({
                userId,
                role
            });
        }

        await account.save();

        res.json({
            success: true,
            message: 'Account shared successfully',
            account
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sync emails for account
router.post('/accounts/:accountId/sync', auth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { limit = 50 } = req.body;

        // Check permission
        const account = await EmailAccount.findOne({
            _id: accountId,
            $or: [
                { userId: req.user._id },
                { 'permissions.userId': req.user._id }
            ]
        });

        if (!account) {
            return res.status(403).json({
                error: 'No permission to sync this account'
            });
        }

        const emailService = new EmailService(account);
        const emails = await emailService.fetchEmails(limit);

        res.json({
            success: true,
            message: `Synced ${emails.length} emails`,
            count: emails.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;