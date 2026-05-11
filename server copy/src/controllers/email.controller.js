const Email = require('../models/email.model');
const EmailThread = require('../modules/threads/thread.model');
const AuditLog = require('../modules/audit/audit.model');
const EmailModification = require('../modules/modifications/modification.model');
const searchService = require('../services/search.service');
const queueService = require('../queues/index');
const { EMAIL_STATUS, AUDIT_ACTIONS } = require('../utils/constants');
const { AppError } = require('../middleware/errorHandler.middleware');
const logger = require('../utils/logger');
const { normalizePaginationParams, buildPaginationMeta } = require('../utils/pagination');

const emitEmailUpdate = (emailId, payload) => {
    const socketService = global.socketService;
    if (socketService && typeof socketService.emitEmailUpdate === 'function') {
        socketService.emitEmailUpdate(emailId, payload);
    }
};

class EmailController {
    async getAllEmails(req, res, next) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                category,
                priority,
                isRead,
                assignedTo,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                fromDate,
                toDate,
                includeStats = false,
                searchType = 'fulltext',
                includeScore = false,
                includeAnalytics = false
            } = req.query;

            // Build base query
            let query = {};

            // Apply resource ownership filter if required
            if (req.requireOwnership) {
                query[req.requireOwnership.field] = req.requireOwnership.userId;
            }

            if (status) query.status = status;
            if (category) query.category = category;
            if (priority) query.priority = priority;
            if (typeof isRead !== 'undefined') {
                query.isRead = isRead === true || isRead === 'true';
            }
            if (assignedTo) query.assignedUserId = assignedTo;

            if (fromDate || toDate) {
                query.createdAt = {};
                if (fromDate) query.createdAt.$gte = new Date(fromDate);
                if (toDate) query.createdAt.$lte = new Date(toDate);
            }

            // If search query is provided, use the enhanced search service
            if (search) {
                const filters = {
                    ...searchService.buildSearchFilters({
                        status, category, priority, isRead, assignedTo, fromDate, toDate
                    }), ...query
                };

                const sort = {};
                sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

                const searchResults = await searchService.searchEmails({
                    query: search,
                    filters,
                    sort,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    includeScore: includeScore === 'true',
                    includeAnalytics: includeAnalytics === 'true',
                    searchType
                });

                return res.json(searchResults);
            }

            const { page: parsedPage, limit: parsedLimit, skip } = normalizePaginationParams({ page, limit });
            const shouldIncludeStats = includeStats === true || includeStats === 'true';

            // Sorting
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            // Inbox list does not need heavy fields (e.g. full html body) on initial load.
            const emailListProjection = {
                fromAddress: 1,
                toAddress: 1,
                subject: 1,
                bodyText: 1,
                category: 1,
                confidence: 1,
                sentiment: 1,
                sentimentScore: 1,
                status: 1,
                isRead: 1,
                readAt: 1,
                assignedUserId: 1,
                priority: 1,
                createdAt: 1,
                sentAt: 1,
                keywords: 1,
                extractedEntities: 1
            };

            // Execute primary list + count first for lower first-paint latency.
            const [emails, total] = await Promise.all([
                Email.find(query, emailListProjection)
                    .sort(sort)
                    .skip(skip)
                    .limit(parsedLimit)
                    .populate('assignedUserId', 'name email')
                    .lean(),
                Email.countDocuments(query)
            ]);

            let statusCounts = undefined;
            if (shouldIncludeStats) {
                const stats = await Email.aggregate([
                    { $match: query },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ]);

                statusCounts = {};
                stats.forEach(stat => {
                    statusCounts[stat._id] = stat.count;
                });
            }

            res.json({
                success: true,
                data: emails,
                pagination: buildPaginationMeta({ page: parsedPage, limit: parsedLimit, total }),
                stats: statusCounts
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Advanced search endpoint with enhanced capabilities
     */
    async searchEmails(req, res, next) {
        try {
            const {
                query,
                searchType = 'fulltext',
                page = 1,
                limit = 20,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                includeScore = false,
                includeAnalytics = false,
                ...filterParams
            } = req.query;

            if (!query) {
                throw new AppError('Search query is required', 400);
            }

            const filters = searchService.buildSearchFilters(filterParams);
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const searchResults = await searchService.searchEmails({
                query,
                filters,
                sort,
                page: parseInt(page),
                limit: parseInt(limit),
                includeScore: includeScore === 'true',
                includeAnalytics: includeAnalytics === 'true',
                searchType
            });

            res.json(searchResults);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get search suggestions for autocomplete
     */
    async getSearchSuggestions(req, res, next) {
        try {
            const { query, limit = 10 } = req.query;

            if (!query || query.length < 2) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const suggestions = await searchService.getSearchSuggestions(query, parseInt(limit));

            res.json({
                success: true,
                data: suggestions
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Search emails by entity (people, organizations, etc.)
     */
    async searchByEntity(req, res, next) {
        try {
            const { entityType, entityValue } = req.params;
            const {
                page = 1,
                limit = 20,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                ...filterParams
            } = req.query;

            const validEntityTypes = ['people', 'organizations', 'locations', 'emails', 'phoneNumbers'];
            if (!validEntityTypes.includes(entityType)) {
                throw new AppError('Invalid entity type', 400);
            }

            const filters = searchService.buildSearchFilters(filterParams);
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const results = await searchService.searchByEntity(
                entityType,
                entityValue,
                filters,
                { page: parseInt(page), limit: parseInt(limit), sort }
            );

            res.json(results);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get popular search terms and keywords
     */
    async getPopularSearchTerms(req, res, next) {
        try {
            const { limit = 10 } = req.query;

            const popularTerms = await searchService.getPopularSearchTerms(parseInt(limit));

            res.json({
                success: true,
                data: popularTerms
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get search analytics for a specific query
     */
    async getSearchAnalytics(req, res, next) {
        try {
            const { query } = req.query;

            if (!query) {
                throw new AppError('Search query is required', 400);
            }

            const analytics = await searchService.getSearchAnalytics(query);

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get search performance metrics and monitoring data
     */
    async getSearchMetrics(req, res, next) {
        try {
            const searchMonitor = require('../utils/searchMonitor');

            const [metrics, dbAnalysis, recommendations, healthCheck] = await Promise.all([
                Promise.resolve(searchMonitor.getMetrics()),
                searchMonitor.analyzeDatabasePerformance(),
                searchMonitor.generateRecommendations(),
                searchMonitor.healthCheck()
            ]);

            res.json({
                success: true,
                data: {
                    performance: metrics,
                    database: dbAnalysis,
                    recommendations,
                    health: healthCheck,
                    generatedAt: new Date()
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reset search metrics (admin only)
     */
    async resetSearchMetrics(req, res, next) {
        try {
            const searchMonitor = require('../utils/searchMonitor');
            searchMonitor.resetMetrics();

            res.json({
                success: true,
                message: 'Search metrics reset successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getEmailById(req, res, next) {
        try {
            // Build query with resource ownership check
            let query = { _id: req.params.id };

            // Apply resource ownership filter if required
            if (req.requireOwnership) {
                query[req.requireOwnership.field] = req.requireOwnership.userId;
            }

            let emailQuery = Email.findOne(query)
                .populate('assignedUserId', 'name email');

            if (Email.schema.path('auditLogs')) {
                emailQuery = emailQuery.populate({
                    path: 'auditLogs',
                    model: 'AuditLog',
                    populate: {
                        path: 'userId',
                        select: 'name email'
                    },
                    options: { sort: { createdAt: -1 } }
                });
            }

            if (Email.schema.path('attachments')) {
                emailQuery = emailQuery.populate({
                    path: 'attachments',
                    model: 'Attachment'
                });
            }

            const email = await emailQuery;

            if (!email) {
                throw new AppError('Email not found or access denied', 404);
            }

            // Get thread if exists
            let thread = null;
            if (email.threadId) {
                thread = await EmailThread.findOne({ threadId: email.threadId });
            }

            res.json({
                success: true,
                data: {
                    email,
                    thread
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateDraft(req, res, next) {
        try {
            const { draftText, category } = req.body;
            const { id } = req.params;
            const userId = req.user._id;

            const email = await Email.findById(id);
            if (!email) {
                throw new AppError('Email not found', 404);
            }

            // Save previous content for audit
            const previousContent = {
                draftText: email.draftText,
                category: email.category
            };

            // Update email
            email.draftText = draftText;
            if (category) email.category = category;
            email.status = EMAIL_STATUS.REVIEWED;
            await email.save();

            // Create modification record
            await EmailModification.create({
                emailId: id,
                userId,
                modificationType: 'EDIT',
                previousContent,
                newContent: { draftText, category }
            });

            // Log audit
            await AuditLog.create({
                emailId: id,
                userId,
                action: AUDIT_ACTIONS.EDITED,
                details: {
                    field: 'draft',
                    preview: draftText.substring(0, 100) + '...'
                }
            });

            // Notify via socket
            emitEmailUpdate(id, {
                type: 'draft_updated',
                data: { draftText, category, status: email.status }
            });

            res.json({
                success: true,
                message: 'Draft updated successfully',
                data: email
            });
        } catch (error) {
            next(error);
        }
    }

    async approveEmail(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            const email = await Email.findById(id);
            if (!email) {
                throw new AppError('Email not found', 404);
            }

            // Update status
            email.status = EMAIL_STATUS.APPROVED;
            await email.save();

            // Log audit
            await AuditLog.create({
                emailId: id,
                userId,
                action: AUDIT_ACTIONS.APPROVED
            });

            // Notify via socket
            emitEmailUpdate(id, {
                type: 'approved',
                data: { status: email.status }
            });

            res.json({
                success: true,
                message: 'Email approved successfully',
                data: email
            });
        } catch (error) {
            next(error);
        }
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

            // Enqueue for sending
            await queueService.queues[QUEUES.SENDING].add('send_email', {
                emailId: id,
                replyData: {
                    to: email.fromAddress,
                    subject: `Re: ${email.subject}`,
                    body: email.draftText
                }
            });

            // Update status immediately
            email.status = 'SENDING';
            await email.save();

            // Log audit
            await AuditLog.create({
                emailId: id,
                userId,
                action: AUDIT_ACTIONS.SENT,
                details: { queuedAt: new Date() }
            });

            // Notify via socket
            emitEmailUpdate(id, {
                type: 'sending',
                data: { status: 'SENDING' }
            });

            res.json({
                success: true,
                message: 'Email queued for sending',
                data: email
            });
        } catch (error) {
            next(error);
        }
    }

    async replyToEmail(req, res, next) {
        try {
            const { id } = req.params;
            const { content, sendImmediately = false, attachments = [] } = req.body;
            const userId = req.user._id;

            const originalEmail = await Email.findById(id);
            if (!originalEmail) {
                throw new AppError('Email not found', 404);
            }

            // Create reply email
            const replyEmail = await Email.create({
                fromAddress: originalEmail.toAddress,
                toAddress: originalEmail.fromAddress,
                subject: `Re: ${originalEmail.subject}`,
                bodyText: content,
                status: sendImmediately ? EMAIL_STATUS.APPROVED : EMAIL_STATUS.DRAFTED,
                draftText: content,
                category: originalEmail.category,
                threadId: originalEmail.threadId || originalEmail._id.toString(),
                inReplyTo: originalEmail.messageId,
                references: [...(originalEmail.references || []), originalEmail.messageId],
                assignedUserId: userId,
                priority: originalEmail.priority
            });

            // Update thread
            await this.updateEmailThread(replyEmail);

            // Log audit for original email
            await AuditLog.create({
                emailId: id,
                userId,
                action: AUDIT_ACTIONS.REPLIED,
                details: {
                    replyId: replyEmail._id,
                    preview: content.substring(0, 100) + '...'
                }
            });

            // Log audit for reply
            await AuditLog.create({
                emailId: replyEmail._id,
                userId,
                action: AUDIT_ACTIONS.CREATED
            });

            // Enqueue for processing if not sending immediately
            if (!sendImmediately) {
                await queueService.addEmailToProcessing(replyEmail._id);
            } else {
                // Queue for sending
                await queueService.queues[QUEUES.SENDING].add('send_email', {
                    emailId: replyEmail._id,
                    replyData: {
                        to: replyEmail.toAddress,
                        subject: replyEmail.subject,
                        body: replyEmail.draftText
                    }
                });
            }

            // Notify via socket
            emitEmailUpdate(id, {
                type: 'replied',
                data: { replyId: replyEmail._id }
            });

            res.json({
                success: true,
                message: 'Reply created successfully',
                data: replyEmail
            });
        } catch (error) {
            next(error);
        }
    }

    async forwardEmail(req, res, next) {
        try {
            const { id } = req.params;
            const { toAddress, message, attachments = [] } = req.body;
            const userId = req.user._id;

            const originalEmail = await Email.findById(id);
            if (!originalEmail) {
                throw new AppError('Email not found', 404);
            }

            // Create forward email
            const forwardEmail = await Email.create({
                fromAddress: originalEmail.toAddress,
                toAddress,
                subject: `Fwd: ${originalEmail.subject}`,
                bodyText: `${message}\n\n--- Forwarded message ---\n${originalEmail.bodyText}`,
                status: EMAIL_STATUS.DRAFTED,
                draftText: `${message}\n\n--- Forwarded message ---\n${originalEmail.bodyText}`,
                category: originalEmail.category,
                threadId: originalEmail.threadId,
                assignedUserId: userId,
                priority: originalEmail.priority
            });

            // Log audit for original email
            await AuditLog.create({
                emailId: id,
                userId,
                action: AUDIT_ACTIONS.FORWARDED,
                details: {
                    forwardId: forwardEmail._id,
                    toAddress,
                    preview: message?.substring(0, 100) + '...'
                }
            });

            // Log audit for forward
            await AuditLog.create({
                emailId: forwardEmail._id,
                userId,
                action: AUDIT_ACTIONS.CREATED
            });

            // Enqueue for processing
            await queueService.addEmailToProcessing(forwardEmail._id);

            // Notify via socket
            emitEmailUpdate(id, {
                type: 'forwarded',
                data: { forwardId: forwardEmail._id }
            });

            res.json({
                success: true,
                message: 'Email forwarded successfully',
                data: forwardEmail
            });
        } catch (error) {
            next(error);
        }
    }

    async bulkAction(req, res, next) {
        try {
            const { emailIds, action, data } = req.body;
            const userId = req.user._id;

            let result;

            switch (action) {
                case 'approve':
                    result = await Email.updateMany(
                        { _id: { $in: emailIds } },
                        { $set: { status: EMAIL_STATUS.APPROVED } }
                    );

                    // Log audit for each
                    await Promise.all(emailIds.map(emailId =>
                        AuditLog.create({
                            emailId,
                            userId,
                            action: AUDIT_ACTIONS.APPROVED,
                            details: { bulk: true }
                        })
                    ));
                    break;

                case 'assign':
                    result = await Email.updateMany(
                        { _id: { $in: emailIds } },
                        { $set: { assignedUserId: data.userId } }
                    );

                    await Promise.all(emailIds.map(emailId =>
                        AuditLog.create({
                            emailId,
                            userId,
                            action: AUDIT_ACTIONS.ASSIGNED,
                            details: { assignedTo: data.userId, bulk: true }
                        })
                    ));
                    break;

                case 'delete':
                    result = await Email.updateMany(
                        { _id: { $in: emailIds } },
                        { $set: { status: 'DELETED' } }
                    );
                    break;

                case 'change-status':
                    result = await Email.updateMany(
                        { _id: { $in: emailIds } },
                        { $set: { status: data.status } }
                    );
                    break;

                default:
                    throw new AppError('Invalid bulk action', 400);
            }

            // Notify via socket for each email
            emailIds.forEach(emailId => {
                emitEmailUpdate(emailId, {
                    type: 'bulk_action',
                    data: { action, data }
                });
            });

            res.json({
                success: true,
                message: `Bulk action '${action}' completed successfully`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async createEmail(req, res, next) {
        try {
            const { fromAddress, toAddress, subject, bodyText } = req.body;
            const userId = req.user._id;

            // Create email
            const email = await Email.create({
                fromAddress,
                toAddress,
                subject,
                bodyText,
                status: EMAIL_STATUS.NEW,
                isRead: false,
                assignedUserId: userId
            });

            // Log audit
            await AuditLog.create({
                emailId: email._id,
                userId,
                action: AUDIT_ACTIONS.CREATED
            });

            // Enqueue for processing
            await queueService.addEmailToProcessing(email._id);

            res.status(201).json({
                success: true,
                message: 'Email created and queued for processing',
                data: email
            });
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            const email = await Email.findById(id);

            if (!email) {
                throw new AppError('Email not found', 404);
            }

            email.isRead = true;
            email.readAt = email.readAt || new Date();
            await email.save();

            emitEmailUpdate(id, {
                type: 'read_status_updated',
                data: { isRead: true, readAt: email.readAt }
            });

            res.json({
                success: true,
                message: 'Email marked as read',
                data: {
                    id: email._id,
                    isRead: email.isRead,
                    readAt: email.readAt
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async markAsUnread(req, res, next) {
        try {
            const { id } = req.params;
            const email = await Email.findById(id);

            if (!email) {
                throw new AppError('Email not found', 404);
            }

            email.isRead = false;
            email.readAt = null;
            await email.save();

            emitEmailUpdate(id, {
                type: 'read_status_updated',
                data: { isRead: false, readAt: null }
            });

            res.json({
                success: true,
                message: 'Email marked as unread',
                data: {
                    id: email._id,
                    isRead: email.isRead,
                    readAt: email.readAt
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateEmailThread(email) {
        try {
            const threadId = email.threadId;

            if (!threadId) {
                // Create new thread
                const thread = await EmailThread.create({
                    threadId: email._id.toString(),
                    subject: email.subject,
                    participants: [
                        { email: email.fromAddress },
                        { email: email.toAddress }
                    ],
                    assignedUserId: email.assignedUserId,
                    lastMessageAt: email.createdAt,
                    messageCount: 1
                });

                // Update email with threadId
                await Email.findByIdAndUpdate(email._id, {
                    threadId: thread.threadId
                });

                return thread;
            } else {
                // Update existing thread
                const thread = await EmailThread.findOneAndUpdate(
                    { threadId },
                    {
                        $addToSet: {
                            participants: [
                                { email: email.fromAddress },
                                { email: email.toAddress }
                            ]
                        },
                        $set: { lastMessageAt: email.createdAt },
                        $inc: { messageCount: 1 }
                    },
                    { new: true, upsert: true }
                );

                return thread;
            }
        } catch (error) {
            logger.error('Error updating email thread:', error);
            return null;
        }
    }
}

module.exports = new EmailController();
