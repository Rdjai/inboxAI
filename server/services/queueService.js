const Email = require('../models/Email');
const AuditLog = require('../models/AuditLog');
const aiService = require('./aiService');

// Simple in-memory queue system (for development without Redis)
class SimpleQueue {
    constructor() {
        this.queues = {
            classification: [],
            drafting: [],
            sending: []
        };
        this.processing = false;
        this.init();
    }

    init() {
        console.log('👷 Simple queue system initialized (no Redis)');
        this.startProcessing();
    }

    startProcessing() {
        if (this.processing) return;

        this.processing = true;
        this.processQueues();
    }

    async processQueues() {
        // Process classification queue
        if (this.queues.classification.length > 0) {
            const job = this.queues.classification.shift();
            await this.processClassification(job);
        }

        // Process drafting queue
        if (this.queues.drafting.length > 0) {
            const job = this.queues.drafting.shift();
            await this.processDrafting(job);
        }

        // Process sending queue
        if (this.queues.sending.length > 0) {
            const job = this.queues.sending.shift();
            await this.processSending(job);
        }

        // Continue processing
        setTimeout(() => this.processQueues(), 1000);
    }

    async processClassification(job) {
        console.log(`🔍 Processing classification for email: ${job.emailId}`);

        try {
            const email = await Email.findById(job.emailId);
            if (!email) throw new Error('Email not found');

            const classification = await aiService.classifyEmail(email.subject, email.body);

            email.category = classification.category;
            email.confidence = classification.confidence;
            email.status = 'classified';
            email.processedAt = new Date();
            await email.save();

            await AuditLog.create({
                email: email._id,
                action: 'classified',
                details: classification
            });

            // Add to drafting queue
            this.queues.drafting.push({ emailId: email._id });

            console.log(`✅ Email ${email._id} classified as ${classification.category}`);

        } catch (error) {
            console.error('Classification failed:', error.message);
            await Email.findByIdAndUpdate(job.emailId, { status: 'failed' });
        }
    }

    async processDrafting(job) {
        console.log(`✍️  Generating draft for email: ${job.emailId}`);

        try {
            const email = await Email.findById(job.emailId);
            if (!email) throw new Error('Email not found');

            const draft = await aiService.generateDraft(email.category, email.body);

            email.draft = draft;
            email.status = 'drafted';
            await email.save();

            await AuditLog.create({
                email: email._id,
                action: 'drafted',
                details: { length: draft.length }
            });

            console.log(`✅ Draft generated for email ${email._id}`);

        } catch (error) {
            console.error('Drafting failed:', error.message);
        }
    }

    async processSending(job) {
        console.log(`📤 Sending email: ${job.emailId}`);

        try {
            const email = await Email.findById(job.emailId);
            if (!email) throw new Error('Email not found');

            // Simulate sending email
            console.log(`📧 Simulating send to: ${email.to}`);
            await new Promise(resolve => setTimeout(resolve, 1000));

            email.status = 'sent';
            email.sentAt = new Date();
            await email.save();

            await AuditLog.create({
                email: email._id,
                user: job.userId,
                action: 'sent',
                details: { sentAt: new Date() }
            });

            console.log('✅ Email sent');

        } catch (error) {
            console.error('Sending failed:', error.message);
            await Email.findByIdAndUpdate(job.emailId, { status: 'failed' });
        }
    }

    addJob(queueName, job) {
        this.queues[queueName].push(job);
        console.log(`📥 Added job to ${queueName} queue`);
    }

    getQueueStats() {
        return {
            classification: { waiting: this.queues.classification.length, active: 0, completed: 0, failed: 0, delayed: 0 },
            drafting: { waiting: this.queues.drafting.length, active: 0, completed: 0, failed: 0, delayed: 0 },
            sending: { waiting: this.queues.sending.length, active: 0, completed: 0, failed: 0, delayed: 0 }
        };
    }
}

// Create singleton instance
const queue = new SimpleQueue();

// Export queue functions
module.exports = {
    async classifyEmail(emailId) {
        queue.addJob('classification', { emailId });
        console.log(`📥 Queued email ${emailId} for classification`);
    },

    async generateDraft(emailId) {
        queue.addJob('drafting', { emailId });
        console.log(`📝 Queued email ${emailId} for drafting`);
    },

    async sendEmail(emailId, userId) {
        queue.addJob('sending', { emailId, userId });
        console.log(`📤 Queued email ${emailId} for sending`);
    },

    async getQueueStats() {
        return queue.getQueueStats();
    }
};