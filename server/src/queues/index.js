const { Queue, Worker } = require('bullmq');
const redisConfig = require('../config/redis');
const { QUEUES } = require('../utils/constants');
const Email = require('../models/email.model');
const AuditLog = require('../modules/audit/audit.model');
const aiService = require('../services/ai.service');
const logger = require('../utils/logger');
const { EMAIL_STATUS } = require('../utils/constants');

class QueueService {
    constructor() {
        this.queues = {};
        this.workers = {};
        this.initializeQueues();
        this.startWorkers();
    }

    initializeQueues() {
        this.queues[QUEUES.CLASSIFICATION] = new Queue(QUEUES.CLASSIFICATION, {
            connection: redisConfig.connection,
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 1000,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                }
            }
        });

        this.queues[QUEUES.DRAFTING] = new Queue(QUEUES.DRAFTING, {
            connection: redisConfig.connection,
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 1000,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                }
            }
        });

        this.queues[QUEUES.SENDING] = new Queue(QUEUES.SENDING, {
            connection: redisConfig.connection,
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 1000,
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                }
            }
        });
    }

    startWorkers() {
        this.workers[QUEUES.CLASSIFICATION] = new Worker(
            QUEUES.CLASSIFICATION,
            this.classificationJob.bind(this),
            { connection: redisConfig.connection }
        );

        this.workers[QUEUES.DRAFTING] = new Worker(
            QUEUES.DRAFTING,
            this.draftingJob.bind(this),
            { connection: redisConfig.connection }
        );

        this.workers[QUEUES.SENDING] = new Worker(
            QUEUES.SENDING,
            this.sendingJob.bind(this),
            { connection: redisConfig.connection }
        );

        Object.values(this.workers).forEach(worker => {
            worker.on('completed', (job) => {
                logger.info(`Job ${job.id} completed successfully`);
            });

            worker.on('failed', (job, err) => {
                logger.error(`Job ${job.id} failed:`, err);

                if (job.attemptsMade >= job.opts.attempts) {
                    logger.error(`Moving job ${job.id} to dead letter queue`);
                }
            });
        });

        logger.info('✅ Queue workers started');
    }

    async classificationJob(job) {
        const { emailId } = job.data;

        try {
            logger.info(`Processing classification for email ${emailId}`);

            const email = await Email.findById(emailId);
            if (!email) {
                throw new Error(`Email ${emailId} not found`);
            }

            // AI Classification
            const classification = await aiService.classifyEmail(
                email.subject,
                email.bodyText
            );

            // Update email
            email.category = classification.category;
            email.confidence = classification.confidence;
            email.sentiment = classification.sentiment;
            email.sentimentScore = classification.sentimentScore;
            email.status = EMAIL_STATUS.CLASSIFIED;
            email.processedAt = new Date();
            await email.save();

            // Log audit
            await AuditLog.create({
                emailId,
                action: 'CLASSIFIED',
                details: {
                    category: classification.category,
                    confidence: classification.confidence,
                    sentiment: classification.sentiment,
                    sentimentScore: classification.sentimentScore
                }
            });

            // Enqueue for drafting
            await this.queues[QUEUES.DRAFTING].add('draft_email', {
                emailId,
                category: classification.category
            }, {
                delay: 100 // Small delay before drafting
            });

            logger.info(`Email ${emailId} classified as ${classification.category}`);
        } catch (error) {
            logger.error(`Classification job failed for email ${emailId}:`, error);
            throw error;
        }
    }

    async draftingJob(job) {
        const { emailId, category } = job.data;

        try {
            logger.info(`Generating draft for email ${emailId}`);

            const email = await Email.findById(emailId);
            if (!email) {
                throw new Error(`Email ${emailId} not found`);
            }

            // Generate AI draft
            const draft = await aiService.generateSmartReply({
                category: category || email.category,
                originalText: email.bodyText,
                sentiment: email.sentiment,
                tone: 'professional'
            });

            // Update email
            email.draftText = draft;
            email.status = EMAIL_STATUS.DRAFTED;
            await email.save();

            // Log audit
            await AuditLog.create({
                emailId,
                action: 'DRAFTED',
                details: { draftPreview: draft.substring(0, 100) + '...' }
            });

            logger.info(`Draft generated for email ${emailId}`);
        } catch (error) {
            logger.error(`Drafting job failed for email ${emailId}:`, error);
            throw error;
        }
    }

    async sendingJob(job) {
        const { emailId, replyData } = job.data;

        try {
            logger.info(`Sending email ${emailId}`);

            const email = await Email.findById(emailId);
            if (!email) {
                throw new Error(`Email ${emailId} not found`);
            }

            // Simulate email sending (replace with actual SMTP)
            // In production, use nodemailer or similar
            const sendSuccess = await this.simulateEmailSend(email, replyData);

            if (sendSuccess) {
                email.status = EMAIL_STATUS.SENT;
                email.sentAt = new Date();
                await email.save();

                await AuditLog.create({
                    emailId,
                    action: 'SENT',
                    details: { sentAt: new Date() }
                });

                logger.info(`Email ${emailId} sent successfully`);
            } else {
                throw new Error('Email sending simulation failed');
            }
        } catch (error) {
            logger.error(`Sending job failed for email ${emailId}:`, error);

            // Update status to FAILED
            await Email.findByIdAndUpdate(emailId, {
                status: EMAIL_STATUS.FAILED
            });

            await AuditLog.create({
                emailId,
                action: 'FAILED',
                details: { error: error.message }
            });

            throw error;
        }
    }

    async simulateEmailSend(email, replyData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 90% success rate for simulation
        return Math.random() < 0.9;
    }

    async addEmailToProcessing(emailId) {
        await this.queues[QUEUES.CLASSIFICATION].add('classify_email', {
            emailId
        });
    }

    async getQueueStats() {
        const stats = {};

        for (const [queueName, queue] of Object.entries(this.queues)) {
            const [waiting, active, completed, failed, delayed] = await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
                queue.getDelayedCount()
            ]);

            stats[queueName] = {
                waiting,
                active,
                completed,
                failed,
                delayed
            };
        }

        return stats;
    }
    async sendEmail(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            const email = await Email.findById(id);
            if (!email) {
                throw new AppError('Email not found', 404);
            }

            // Check if email can be sent
            if (email.status !== EMAIL_STATUS.APPROVED) {
                throw new AppError('Email must be approved before sending', 400);
            }

            // Get default email account for the user
            const defaultAccount = await EmailAccount.findOne({
                userId,
                isDefault: true,
                isActive: true
            });

            if (!defaultAccount) {
                throw new AppError('No default email account configured', 400);
            }

            // Update status to SENDING immediately
            email.status = 'SENDING';
            await email.save();

            // Log audit
            await AuditLog.create({
                emailId: id,
                userId,
                action: 'SENDING',
                details: {
                    accountId: defaultAccount._id,
                    queuedAt: new Date()
                }
            });

            // Enqueue for sending with account info
            await queueService.queues[QUEUES.SENDING].add('send_email', {
                emailId: id,
                accountId: defaultAccount._id,
                emailData: {
                    to: email.toAddress,
                    subject: email.subject,
                    bodyText: email.draftText
                }
            });

            // Notify via socket
            socketService.emitEmailUpdate(id, {
                type: 'sending',
                data: { status: 'SENDING', accountId: defaultAccount._id }
            });

            res.json({
                success: true,
                message: 'Email queued for sending',
                data: {
                    emailId: id,
                    accountId: defaultAccount._id,
                    accountEmail: defaultAccount.email,
                    queuedAt: new Date()
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new QueueService();