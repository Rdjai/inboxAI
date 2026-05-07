// src/services/sync.service.js
const cron = require('node-cron');
const EmailAccount = require('../models/emailAccount.model');
const logger = require('../utils/logger');
const queueService = require('../queues');

class SyncService {
    constructor() {
        this.syncIntervals = new Map();
    }

    async startAutoSync() {
        console.log('🔄 Starting auto-sync service...');

        // Schedule sync every 30 minutes
        cron.schedule('*/30 * * * *', async () => {
            await this.syncAllAccounts();
        });

        // Also sync immediately on startup
        setTimeout(() => {
            this.syncAllAccounts();
        }, 10000); // Wait 10 seconds for app to fully start
    }

    async syncAllAccounts() {
        try {
            console.log('🔄 Running auto-sync for all accounts...');

            const accounts = await EmailAccount.find({
                isActive: true,
                syncFrequency: { $ne: 'manual' }
            });

            console.log(`Found ${accounts.length} accounts to sync`);

            for (const account of accounts) {
                await this.syncAccount(account);
            }

        } catch (error) {
            logger.error('Auto-sync failed:', error);
        }
    }

    async syncAccount(account) {
        try {
            console.log(`🔄 Syncing account: ${account.email}`);

            // Import Imap and mailparser here to avoid circular dependencies
            const Imap = require('imap');
            const { simpleParser } = require('mailparser');

            const imap = new Imap({
                user: account.imapConfig.auth.user,
                password: account.imapConfig.auth.pass,
                host: account.imapConfig.host,
                port: account.imapConfig.port,
                tls: account.imapConfig.secure,
                tlsOptions: { rejectUnauthorized: false }
            });

            const Email = require('../models/email.model');

            await new Promise((resolve, reject) => {
                imap.once('ready', () => {
                    imap.openBox('INBOX', false, async (err, box) => {
                        if (err) return reject(err);

                        if (box.messages.total === 0) {
                            imap.end();
                            resolve();
                            return;
                        }

                        // Fetch only recent emails (last 100)
                        const limit = 100;
                        const start = Math.max(1, box.messages.total - limit + 1);
                        const end = box.messages.total;

                        const fetch = imap.seq.fetch(`${start}:${end}`, {
                            bodies: '',
                            struct: true
                        });

                        const emails = [];

                        fetch.on('message', (msg, seqno) => {
                            const email = { seqno };

                            msg.on('body', (stream) => {
                                simpleParser(stream, (err, parsed) => {
                                    if (!err && parsed.messageId) {
                                        email.messageId = parsed.messageId;
                                        email.from = parsed.from?.text || '';
                                        email.subject = parsed.subject || '(No Subject)';
                                        email.date = parsed.date || new Date();
                                        email.body = parsed.text || parsed.html || '(No content)';
                                        emails.push(email);
                                    }
                                });
                            });
                        });

                        fetch.once('error', reject);

                        fetch.once('end', async () => {
                            try {
                                imap.end();

                                let savedCount = 0;
                                for (const emailData of emails) {
                                    const existing = await Email.findOne({
                                        messageId: emailData.messageId
                                    });

                                    if (existing) {
                                        if (!existing.category && existing.status === 'NEW') {
                                            await queueService.addEmailToProcessing(existing._id);
                                        }
                                        continue;
                                    }

                                    const bodyText = (emailData.body || '').trim() || '(No content)';

                                    const createdEmail = await Email.create({
                                        accountId: account._id,
                                        userId: account.userId,
                                        fromAddress: emailData.from,
                                        toAddress: account.email,
                                        subject: emailData.subject,
                                        bodyText,
                                        messageId: emailData.messageId,
                                        date: emailData.date,
                                        status: 'NEW'
                                    });

                                    await queueService.addEmailToProcessing(createdEmail._id);
                                    savedCount++;
                                }

                                console.log(`Synced ${savedCount} new emails from ${account.email}`);
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        });
                    });
                });

                imap.once('error', reject);
                imap.connect();
            });

            // Update last sync time
            account.lastSyncedAt = new Date();
            await account.save();

        } catch (error) {
            console.error(`❌ Failed to sync ${account.email}:`, error.message);
        }
    }
}

module.exports = new SyncService();
