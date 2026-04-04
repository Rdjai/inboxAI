const cron = require('node-cron');
const Email = require('../models/email.model');
const EmailAccount = require('../models/emailAccount.model');
const ImapService = require('./imap.service');
const logger = require('../utils/logger');
const queueService = require('../queues');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require('../config/env');

const MAX_SYNC_LIMIT = 250;

class SyncService {
    constructor() {
        this.syncIntervals = new Map();
    }

    normalizeLimit(limit = 50) {
        const numericLimit = Number.parseInt(limit, 10);
        if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
            return 50;
        }

        return Math.min(numericLimit, MAX_SYNC_LIMIT);
    }

    buildImapConfig(account) {
        if (
            account?.metadata?.oauth?.provider === 'google'
            && account?.metadata?.oauth?.refreshToken
        ) {
            return {
                ...account.imapConfig,
                oauth: {
                    provider: 'google',
                    refreshToken: account.metadata.oauth.refreshToken,
                    clientId: GOOGLE_CLIENT_ID,
                    clientSecret: GOOGLE_CLIENT_SECRET
                }
            };
        }

        return account.imapConfig;
    }

    normalizeFetchedEmail(emailData, account, userId) {
        if (!emailData?.messageId) {
            return null;
        }

        return {
            accountId: account._id,
            userId,
            fromAddress: emailData.from || '',
            toAddress: account.email,
            subject: emailData.subject || '(No Subject)',
            bodyText: emailData.body || '',
            bodyHtml: emailData.html || '',
            messageId: emailData.messageId,
            date: emailData.date,
            status: 'NEW',
            metadata: {
                fetchedAt: new Date(),
                hasAttachments: Array.isArray(emailData.attachments) && emailData.attachments.length > 0
            }
        };
    }

    async enqueueProcessing(emailIds = []) {
        if (!emailIds.length) {
            return;
        }

        await Promise.allSettled(
            emailIds.map((emailId) => queueService.addEmailToProcessing(emailId))
        );
    }

    async importFetchedEmails({ account, userId, emails = [] }) {
        const normalizedEmails = emails
            .map((emailData) => this.normalizeFetchedEmail(emailData, account, userId))
            .filter(Boolean);

        if (!normalizedEmails.length) {
            return {
                fetched: emails.length,
                imported: 0,
                skipped: emails.length,
                queuedExisting: 0
            };
        }

        const uniqueEmails = [];
        const seenMessageIds = new Set();

        for (const email of normalizedEmails) {
            if (seenMessageIds.has(email.messageId)) {
                continue;
            }

            seenMessageIds.add(email.messageId);
            uniqueEmails.push(email);
        }

        const messageIds = uniqueEmails.map((email) => email.messageId);
        const existingEmails = await Email.find({
            accountId: account._id,
            messageId: { $in: messageIds }
        })
            .select('_id messageId category status')
            .lean();

        const existingByMessageId = new Map(
            existingEmails.map((email) => [email.messageId, email])
        );

        const existingNeedingQueue = existingEmails
            .filter((email) => !email.category && email.status === 'NEW')
            .map((email) => email._id);

        const emailsToInsert = uniqueEmails.filter((email) => !existingByMessageId.has(email.messageId));

        let insertedEmails = [];
        if (emailsToInsert.length > 0) {
            insertedEmails = await Email.insertMany(emailsToInsert, { ordered: false });
        }

        await this.enqueueProcessing([
            ...existingNeedingQueue,
            ...insertedEmails.map((email) => email._id)
        ]);

        return {
            fetched: emails.length,
            imported: insertedEmails.length,
            skipped: emails.length - insertedEmails.length,
            queuedExisting: existingNeedingQueue.length
        };
    }

    async runAccountSync(account, options = {}) {
        const { limit = 50, userId = account.userId } = options;
        const normalizedLimit = this.normalizeLimit(limit);
        const syncStartedAt = Date.now();
        const imapService = new ImapService(this.buildImapConfig(account));

        try {
            await imapService.connect();
            const boxInfo = await imapService.getMailboxInfo();
            const emails = await imapService.fetchRecentEmails(normalizedLimit);
            const result = await this.importFetchedEmails({ account, userId, emails });

            account.lastSyncedAt = new Date();
            account.lastError = null;
            account.statistics = account.statistics || {};
            account.statistics.totalEmails = (account.statistics.totalEmails || 0) + result.imported;
            account.statistics.lastSyncDuration = Date.now() - syncStartedAt;
            await account.save();

            return {
                ...result,
                totalInMailbox: boxInfo?.messages?.total ?? boxInfo?.messages ?? 0,
                accountEmail: account.email,
                lastSyncedAt: account.lastSyncedAt
            };
        } catch (error) {
            account.lastError = error.message;
            account.statistics = account.statistics || {};
            account.statistics.lastSyncDuration = Date.now() - syncStartedAt;
            await account.save();
            throw error;
        } finally {
            await imapService.disconnect();
        }
    }

    async startAutoSync() {
        logger.info('Starting auto-sync service...');

        cron.schedule('*/30 * * * *', async () => {
            await this.syncAllAccounts();
        });

        setTimeout(() => {
            this.syncAllAccounts().catch((error) => logger.error('Initial auto-sync failed:', error));
        }, 10000);
    }

    async syncAllAccounts() {
        try {
            logger.info('Running auto-sync for all accounts...');

            const accounts = await EmailAccount.find({
                isActive: true,
                syncFrequency: { $ne: 'manual' }
            });

            logger.info(`Found ${accounts.length} accounts to sync`);

            for (const account of accounts) {
                await this.syncAccount(account);
            }
        } catch (error) {
            logger.error('Auto-sync failed:', error);
        }
    }

    async syncAccount(account) {
        try {
            logger.info(`Syncing account: ${account.email}`);
            const result = await this.runAccountSync(account, { limit: 100, userId: account.userId });
            logger.info(`Sync completed for ${account.email}: ${result.imported} new emails`);
            return result;
        } catch (error) {
            logger.error(`Failed to sync ${account.email}: ${error.message}`);
            return null;
        }
    }
}

module.exports = new SyncService();
