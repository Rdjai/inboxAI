// src/modules/email-accounts/emailAccount.controller.js
const EmailAccount = require('../models/emailAccount.model');
const Email = require('../models/email.model');
const { AppError } = require('../middleware/errorHandler.middleware');
const logger = require('../utils/logger');
const ImapService = require('../services/imap.service');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI, CLIENT_BASE_URL } = require('../config/env');

const sanitizeAccount = (accountLike) => {
    if (!accountLike) return accountLike;
    const account = accountLike.toObject ? accountLike.toObject() : { ...accountLike };

    if (account.imapConfig?.auth) {
        account.imapConfig.auth = {
            ...account.imapConfig.auth,
            pass: undefined
        };
    }

    if (account.smtpConfig?.auth) {
        account.smtpConfig.auth = {
            ...account.smtpConfig.auth,
            pass: undefined
        };
    }

    if (account.metadata?.oauth) {
        account.metadata.oauth = {
            ...account.metadata.oauth,
            refreshToken: undefined,
            accessToken: undefined
        };
    }

    return account;
};

const buildImapConfigWithOAuth = (accountOrConfig) => {
    const source = accountOrConfig || {};
    const hasImap = source.imapConfig && source.smtpConfig;
    const imapConfig = hasImap ? source.imapConfig : source;
    const oauthMeta = hasImap ? source.metadata?.oauth : null;

    if (!oauthMeta?.refreshToken || oauthMeta.provider !== 'google') {
        return imapConfig;
    }

    return {
        ...imapConfig,
        oauth: {
            provider: 'google',
            refreshToken: oauthMeta.refreshToken,
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        }
    };
};

class EmailAccountController {
    constructor() {
        this.getAccounts = this.getAccounts.bind(this);
        this.getAccount = this.getAccount.bind(this);
        this.createAccount = this.createAccount.bind(this);
        this.updateAccount = this.updateAccount.bind(this);
        this.deleteAccount = this.deleteAccount.bind(this);
        this.syncAccount = this.syncAccount.bind(this);
        this.shareAccount = this.shareAccount.bind(this);
        this.fixGmailSettings = this.fixGmailSettings.bind(this);
        this.testConnection = this.testConnection.bind(this);
        this.getAccountStats = this.getAccountStats.bind(this);
        this.startBackgroundSync = this.startBackgroundSync.bind(this);
        this.getGoogleOAuthUrl = this.getGoogleOAuthUrl.bind(this);
        this.connectGoogleOAuth = this.connectGoogleOAuth.bind(this);
    }

    async getAccounts(req, res, next) {
        try {
            const userId = req.user._id;

            const accounts = await EmailAccount.find({ userId })
                .populate('sharedWith.userId', 'name email')
                .sort({ isDefault: -1, createdAt: -1 })
                .lean();

            res.json({
                success: true,
                data: accounts.map(sanitizeAccount)
            });
        } catch (error) {
            if (error && error.code === 11000) {
                return next(new AppError('Email account already exists', 400));
            }
            next(error);
        }
    }

    // Get single email account
    async getAccount(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            const account = await EmailAccount.findOne({
                _id: id,
                $or: [
                    { userId },
                    { 'sharedWith.userId': userId }
                ]
            }).populate('sharedWith.userId', 'name email');

            if (!account) {
                throw new AppError('Email account not found or access denied', 404);
            }

            res.json({
                success: true,
                data: sanitizeAccount(account)
            });
        } catch (error) {
            next(error);
        }
    }

    // Create new email account
    async createAccount(req, res, next) {
        try {
            const userId = req.user._id;
            const {
                name,
                email,
                provider,
                imapConfig,
                smtpConfig,
                syncFrequency = '30min'
            } = req.body;

            // Validate email configuration
            if (!imapConfig || !imapConfig.host || !imapConfig.auth?.user || !imapConfig.auth?.pass) {
                throw new AppError('IMAP configuration is required', 400);
            }

            // Check if account already exists
            const existingAccount = await EmailAccount.findOne({
                email: email.toLowerCase(),
                userId
            });

            if (existingAccount) {
                throw new AppError('Email account already exists', 400);
            }

            // Test IMAP connection
            const imapService = new ImapService(buildImapConfigWithOAuth(imapConfig));
            try {
                await imapService.testConnection();
            } catch (error) {
                throw new AppError(`IMAP connection failed: ${error.message}`, 400);
            }

            // If this is the first account or marked as default, ensure only one default
            let isDefault = req.body.isDefault || false;
            if (isDefault) {
                await EmailAccount.updateMany(
                    { userId, isDefault: true },
                    { $set: { isDefault: false } }
                );
            } else {
                // Check if user has any accounts, if not, make this default
                const accountCount = await EmailAccount.countDocuments({ userId });
                if (accountCount === 0) {
                    isDefault = true;
                }
            }

            // Create the account
            const account = await EmailAccount.create({
                userId,
                name,
                email: email.toLowerCase(),
                provider,
                imapConfig,
                smtpConfig,
                syncFrequency,
                isDefault,
                labels: [
                    { name: 'Inbox', color: '#3B82F6', type: 'system' },
                    { name: 'Sent', color: '#10B981', type: 'system' },
                    { name: 'Drafts', color: '#F59E0B', type: 'system' },
                    { name: 'Trash', color: '#EF4444', type: 'system' }
                ]
            });

            logger.info(`Email account created: ${account.email} for user ${userId}`);

            res.status(201).json({
                success: true,
                message: 'Email account created successfully',
                data: sanitizeAccount(account)
            });
        } catch (error) {
            next(error);
        }
    }

    // Update email account
    async updateAccount(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user._id;
            const updates = req.body;

            // Find account
            const account = await EmailAccount.findOne({
                _id: id,
                userId
            });

            if (!account) {
                throw new AppError('Email account not found', 404);
            }

            // Handle default account change
            if (updates.isDefault === true && !account.isDefault) {
                await EmailAccount.updateMany(
                    { userId, isDefault: true },
                    { $set: { isDefault: false } }
                );
            }

            // Test connection if credentials changed
            if (updates.imapConfig && (updates.imapConfig.auth?.pass || updates.imapConfig.host)) {
                const imapService = new ImapService(buildImapConfigWithOAuth({
                    ...account.imapConfig.toObject(),
                    ...updates.imapConfig
                }));
                await imapService.testConnection();
            }

            // Update account
            Object.assign(account, updates);
            await account.save();

            res.json({
                success: true,
                message: 'Email account updated successfully',
                data: sanitizeAccount(account)
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete email account
    async deleteAccount(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            const account = await EmailAccount.findOneAndDelete({
                _id: id,
                userId
            });

            if (!account) {
                throw new AppError('Email account not found', 404);
            }

            // If this was the default account, set another as default
            if (account.isDefault) {
                const nextAccount = await EmailAccount.findOne({ userId });
                if (nextAccount) {
                    nextAccount.isDefault = true;
                    await nextAccount.save();
                }
            }

            // Delete associated emails (optional - you might want to keep them)
            await Email.deleteMany({ accountId: id });

            logger.info(`Email account deleted: ${account.email} for user ${userId}`);

            res.json({
                success: true,
                message: 'Email account deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    // Sync emails from account
    async syncAccount(req, res, next) {
        try {
            const { accountId } = req.params;
            const { limit = 50 } = req.body;
            const userId = req.user._id;

            const account = await EmailAccount.findOne({
                _id: accountId,
                userId
            });

            if (!account) {
                throw new AppError('Email account not found', 404);
            }

            // Start sync in background
            this.startBackgroundSync(account, limit, userId);

            // Update last sync time
            account.lastSyncedAt = new Date();
            await account.save();

            res.json({
                success: true,
                message: 'Email sync started',
                data: {
                    accountId: account._id,
                    email: account.email,
                    syncStartedAt: new Date()
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Share account with other users
    async shareAccount(req, res, next) {
        try {
            const { accountId } = req.params;
            const { userId: targetUserId, permissions } = req.body;
            const userId = req.user._id;

            // Check if user exists and is not sharing with themselves
            if (targetUserId.toString() === userId.toString()) {
                throw new AppError('Cannot share account with yourself', 400);
            }

            const account = await EmailAccount.findOne({
                _id: accountId,
                userId
            });

            if (!account) {
                throw new AppError('Email account not found', 404);
            }

            // Check if already shared
            const alreadyShared = account.sharedWith.some(
                share => share.userId.toString() === targetUserId.toString()
            );

            if (alreadyShared) {
                throw new AppError('Account already shared with this user', 400);
            }

            // Add to sharedWith
            account.sharedWith.push({
                userId: targetUserId,
                permissions: permissions || ['read'],
                addedAt: new Date()
            });

            await account.save();

            res.json({
                success: true,
                message: 'Account shared successfully',
                data: {
                    sharedWith: account.sharedWith
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Fix Gmail settings (special helper for Gmail)
    async fixGmailSettings(req, res, next) {
        try {
            const userId = req.user._id;

            // Find Gmail accounts
            const gmailAccounts = await EmailAccount.find({
                userId,
                provider: 'gmail'
            });

            const updatedAccounts = [];

            for (const account of gmailAccounts) {
                // Update IMAP settings for Gmail
                account.imapConfig = {
                    host: 'imap.gmail.com',
                    port: 993,
                    secure: true,
                    auth: account.imapConfig.auth
                };

                // Update SMTP settings for Gmail
                account.smtpConfig = {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: account.smtpConfig.auth
                };

                await account.save();
                updatedAccounts.push(account.email);
            }

            res.json({
                success: true,
                message: 'Gmail settings updated',
                data: {
                    updatedAccounts,
                    note: 'Make sure to enable "Less secure app access" or use App Passwords for Gmail accounts'
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Test account connection
    async testConnection(req, res, next) {
        try {
            const { accountId } = req.params;
            const userId = req.user._id;

            const account = await EmailAccount.findOne({
                _id: accountId,
                userId
            });

            if (!account) {
                throw new AppError('Email account not found', 404);
            }

            const imapService = new ImapService(buildImapConfigWithOAuth(account));
            const connectionInfo = await imapService.testConnection();

            res.json({
                success: true,
                message: 'Connection test successful',
                data: connectionInfo
            });
        } catch (error) {
            res.json({
                success: false,
                message: `Connection failed: ${error.message}`,
                data: null
            });
        }
    }

    // Get account statistics
    async getAccountStats(req, res, next) {
        try {
            const userId = req.user._id;

            const accounts = await EmailAccount.find({ userId });

            const stats = await Promise.all(accounts.map(async (account) => {
                const emailStats = await Email.aggregate([
                    { $match: { accountId: account._id } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ]);

                return {
                    accountId: account._id,
                    email: account.email,
                    provider: account.provider,
                    isActive: account.isActive,
                    lastSyncedAt: account.lastSyncedAt,
                    emailStats: emailStats.reduce((acc, stat) => {
                        acc[stat._id] = stat.count;
                        return acc;
                    }, {})
                };
            }));

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    async getGoogleOAuthUrl(req, res, next) {
        try {
            if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
                throw new AppError('Google OAuth is not configured on the server', 500);
            }

            const userId = req.user._id.toString();
            const stateToken = jwt.sign(
                {
                    userId,
                    type: 'gmail_account_connect'
                },
                JWT_SECRET,
                { expiresIn: '10m' }
            );

            const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
            oauthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
            oauthUrl.searchParams.set('redirect_uri', GOOGLE_OAUTH_REDIRECT_URI);
            oauthUrl.searchParams.set('response_type', 'code');
            oauthUrl.searchParams.set('scope', [
                'openid',
                'email',
                'profile',
                'https://mail.google.com/'
            ].join(' '));
            oauthUrl.searchParams.set('access_type', 'offline');
            oauthUrl.searchParams.set('prompt', 'consent');
            oauthUrl.searchParams.set('state', stateToken);

            res.json({
                success: true,
                data: {
                    url: oauthUrl.toString()
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async connectGoogleOAuth(req, res) {
        const failRedirect = (reason) =>
            `${CLIENT_BASE_URL}/app/accounts?google_oauth=error&reason=${encodeURIComponent(reason)}`;

        try {
            const { code, state } = req.query;
            if (!code || !state) {
                return res.redirect(failRedirect('missing_code_or_state'));
            }

            const statePayload = jwt.verify(state, JWT_SECRET);
            if (statePayload.type !== 'gmail_account_connect' || !statePayload.userId) {
                return res.redirect(failRedirect('invalid_state'));
            }

            const tokenResponse = await axios.post(
                'https://oauth2.googleapis.com/token',
                new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: GOOGLE_OAUTH_REDIRECT_URI
                }).toString(),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const tokenData = tokenResponse?.data || {};
            if (!tokenData.refresh_token) {
                return res.redirect(failRedirect('missing_refresh_token_reauthorize_with_consent'));
            }

            const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`
                }
            });

            const profile = profileResponse?.data || {};
            const email = String(profile.email || '').toLowerCase();
            if (!email) {
                return res.redirect(failRedirect('unable_to_read_google_profile_email'));
            }

            const userId = statePayload.userId;
            let account = await EmailAccount.findOne({ userId, email });
            if (!account) {
                const accountCount = await EmailAccount.countDocuments({ userId });
                account = new EmailAccount({
                    userId,
                    name: profile.name || email,
                    email,
                    provider: 'gmail',
                    syncFrequency: '30min',
                    isDefault: accountCount === 0,
                    isActive: true
                });
            }

            account.imapConfig = {
                host: 'imap.gmail.com',
                port: 993,
                secure: true,
                auth: {
                    user: email,
                    // Kept for schema compatibility; OAuth refresh token is source of truth in metadata.oauth.
                    pass: tokenData.refresh_token
                }
            };

            account.smtpConfig = {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: email,
                    // Kept for schema compatibility; OAuth refresh token is source of truth in metadata.oauth.
                    pass: tokenData.refresh_token
                }
            };

            account.metadata = account.metadata || {};
            account.metadata.oauth = {
                provider: 'google',
                refreshToken: tokenData.refresh_token,
                accessToken: tokenData.access_token,
                tokenType: tokenData.token_type,
                expiryDate: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
                scope: tokenData.scope
            };

            await account.save();
            return res.redirect(`${CLIENT_BASE_URL}/app/accounts?google_oauth=success`);
        } catch (error) {
            logger.error('Google OAuth account connect failed', error);
            return res.redirect(failRedirect('oauth_exchange_failed'));
        }
    }

    // Background sync method
    async startBackgroundSync(account, limit, userId) {
        try {
            logger.info(`Starting sync for account: ${account.email}`);

            const imapService = new ImapService(buildImapConfigWithOAuth(account));
            await imapService.connect();

            // Fetch emails
            const emails = await imapService.fetchRecentEmails(limit);

            let importedCount = 0;

            for (const email of emails) {
                // Check if email already exists
                const existingEmail = await Email.findOne({
                    messageId: email.messageId,
                    accountId: account._id
                });

                if (!existingEmail) {
                    await Email.create({
                        accountId: account._id,
                        userId,
                        fromAddress: email.from,
                        toAddress: account.email,
                        subject: email.subject,
                        bodyText: email.body,
                        messageId: email.messageId,
                        date: email.date,
                        status: 'NEW'
                    });
                    importedCount++;
                }
            }

            await imapService.disconnect();

            // Update account statistics
            account.statistics.totalEmails += importedCount;
            account.statistics.lastSyncDuration = Date.now() - account.lastSyncedAt;
            await account.save();

            logger.info(`Sync completed for ${account.email}: ${importedCount} new emails`);

        } catch (error) {
            logger.error(`Sync failed for ${account.email}:`, error);
            account.lastError = error.message;
            await account.save();
        }
    }
}

module.exports = new EmailAccountController();
