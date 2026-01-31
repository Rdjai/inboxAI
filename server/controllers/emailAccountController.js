const EmailAccount = require('../models/EmailAccount');
const Email = require('../models/Email');
const EmailService = require('../services/emailService');

const getAccounts = async (req, res) => {
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
};

const createAccount = async (req, res) => {
    try {
        const { email, smtpHost, smtpPort, smtpUsername, smtpPassword, displayName, provider, isTest } = req.body;

        console.log('ðŸ“¥ Creating email account:', {
            email,
            provider,
            isTest,
            hasPassword: !!smtpPassword
        });

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

        console.log('âœ… Skipping SMTP connection test for development');

        /*
        if (!isTest) {
            try {
                const emailService = new EmailService(account);
                await emailService.fetchEmails(1);
                console.log('âœ… SMTP connection test passed');
            } catch (error) {
                console.error('âŒ SMTP connection test failed:', error.message);
                console.log('âš ï¸  Continuing without SMTP test for development');
            }
        }
        */

        await account.save();
        console.log('âœ… Account saved to database:', account._id);

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
        console.error('âŒ Create account error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create account'
        });
    }
};

const getAccountEmails = async (req, res) => {
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
};

const sendAccountEmail = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { to, subject, body, attachments, cc, bcc } = req.body;

        console.log('ðŸ“¤ Send email request:', {
            accountId,
            to,
            subject,
            bodyLength: body?.length || 0
        });

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

        if (account.isTest) {
            console.log('âœ… Test account detected, skipping real SMTP send');

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
            console.log('âœ… Mock email saved to database:', mockEmail._id);

            return res.json({
                success: true,
                message: 'Email sent successfully (test mode)',
                data: {
                    messageId: mockEmail.messageId,
                    preview: `To: ${to}, Subject: ${subject}`
                }
            });
        }

        const emailService = new EmailService(account);
        const result = await emailService.sendEmail(to, subject, body, attachments, cc, bcc);

        res.json({
            success: true,
            message: 'Email sent successfully',
            data: result
        });
    } catch (error) {
        console.error('âŒ Send email error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send email'
        });
    }
};

const shareAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { userId, role } = req.body;

        const account = await EmailAccount.findOne({
            _id: accountId,
            userId: req.user._id
        });

        if (!account) {
            return res.status(403).json({
                error: 'Only account owner can share this account'
            });
        }

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
};

const syncAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { limit = 50 } = req.body;

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
};

const getAllUserEmails = async (req, res) => {
    try {
        const {
            limit = 50,
            page = 1,
            category,
            isRead,
            search,
            label
        } = req.query;

        const query = { userId: req.user._id };

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
            .sort({ receivedAt: -1, sentAt: -1, createdAt: -1 })
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
};

module.exports = {
    getAccounts,
    createAccount,
    getAccountEmails,
    sendAccountEmail,
    shareAccount,
    syncAccount,
    getAllUserEmails
};
