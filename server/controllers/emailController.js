const Email = require('../models/Email');
const AuditLog = require('../models/AuditLog');
const Attachment = require('../models/Attachment');
const queueService = require('../services/queueService');
const aiService = require('../services/aiService');
const fs = require('fs');

const getEmails = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            category,
            assignedTo,
            priority,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};

        // Apply filters
        if (status) query.status = status;
        if (category) query.category = category;
        if (assignedTo) query.assignedTo = assignedTo;
        if (priority) query.priority = priority;

        // Search
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { body: { $regex: search, $options: 'i' } },
                { from: { $regex: search, $options: 'i' } },
                { to: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Get emails
        const [emails, total] = await Promise.all([
            Email.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('assignedTo', 'name email avatar')
                .lean(),
            Email.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: emails,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getEmail = async (req, res) => {
    try {
        const { id } = req.params;

        const [email, auditLogs, attachments] = await Promise.all([
            Email.findById(id)
                .populate('assignedTo', 'name email avatar')
                .lean(),
            AuditLog.find({ email: id })
                .populate('user', 'name email avatar')
                .sort({ createdAt: -1 })
                .lean(),
            Attachment.find({ email: id }).lean()
        ]);

        if (!email) {
            return res.status(404).json({
                success: false,
                error: 'Email not found'
            });
        }

        // Extract key info from email
        const keyInfo = await aiService.extractKeyInfo(email.body);

        res.json({
            success: true,
            data: {
                ...email,
                auditLogs,
                attachments,
                keyInfo
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const createEmail = async (req, res) => {
    try {
        const { from, to, subject, body, html, threadId } = req.body;

        const email = await Email.create({
            from,
            to,
            subject,
            body,
            html,
            threadId,
            status: 'new'
        });

        // Create audit log
        await AuditLog.create({
            email: email._id,
            user: req.user._id,
            action: 'created',
            details: { source: 'manual' }
        });

        // Queue for AI processing
        await queueService.classifyEmail(email._id);

        res.status(201).json({
            success: true,
            data: email
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const updateEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const email = await Email.findById(id);
        if (!email) {
            return res.status(404).json({
                success: false,
                error: 'Email not found'
            });
        }

        // Save previous values for audit
        const previousValues = {
            draft: email.draft,
            category: email.category,
            assignedTo: email.assignedTo,
            priority: email.priority
        };

        // Apply updates
        Object.keys(updates).forEach(key => {
            if (['draft', 'category', 'assignedTo', 'priority'].includes(key)) {
                email[key] = updates[key];
            }
        });

        // Update status if draft is edited
        if (updates.draft && email.status === 'drafted') {
            email.status = 'reviewed';
        }

        await email.save();

        // Create audit log for changes
        const changes = {};
        Object.keys(updates).forEach(key => {
            if (previousValues[key] !== updates[key]) {
                changes[key] = {
                    from: previousValues[key],
                    to: updates[key]
                };
            }
        });

        if (Object.keys(changes).length > 0) {
            await AuditLog.create({
                email: email._id,
                user: req.user._id,
                action: 'edited',
                details: changes
            });
        }

        res.json({
            success: true,
            data: email
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const approveEmail = async (req, res) => {
    try {
        const { id } = req.params;

        const email = await Email.findByIdAndUpdate(
            id,
            { status: 'approved' },
            { new: true }
        );

        if (!email) {
            return res.status(404).json({
                success: false,
                error: 'Email not found'
            });
        }

        await AuditLog.create({
            email: email._id,
            user: req.user._id,
            action: 'approved',
            details: {}
        });

        res.json({
            success: true,
            data: email
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const sendEmail = async (req, res) => {
    try {
        const { id } = req.params;

        const email = await Email.findById(id);
        if (!email) {
            return res.status(404).json({
                success: false,
                error: 'Email not found'
            });
        }

        // Queue for sending
        await queueService.sendEmail(email._id, req.user._id);

        res.json({
            success: true,
            message: 'Email queued for sending'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const replyToEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply, sendNow = false } = req.body;

        const originalEmail = await Email.findById(id);
        if (!originalEmail) {
            return res.status(404).json({
                success: false,
                error: 'Email not found'
            });
        }

        // Create reply email
        const replyEmail = await Email.create({
            from: originalEmail.to,
            to: originalEmail.from,
            subject: `Re: ${originalEmail.subject}`,
            body: reply,
            draft: reply,
            category: originalEmail.category,
            status: sendNow ? 'approved' : 'drafted',
            threadId: originalEmail.threadId || originalEmail._id,
            inReplyTo: originalEmail.messageId,
            references: [...(originalEmail.references || []), originalEmail.messageId],
            assignedTo: req.user._id
        });

        await AuditLog.create({
            email: replyEmail._id,
            user: req.user._id,
            action: 'replied',
            details: {
                originalEmail: originalEmail._id,
                sendNow
            }
        });

        // Send immediately if requested
        if (sendNow) {
            await queueService.sendEmail(replyEmail._id, req.user._id);
        }

        res.status(201).json({
            success: true,
            data: replyEmail
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const bulkUpdate = async (req, res) => {
    try {
        const { action, emailIds, data } = req.body;

        if (!Array.isArray(emailIds) || emailIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No emails selected'
            });
        }

        let update;
        let auditAction;

        switch (action) {
            case 'assign':
                update = { assignedTo: data.userId };
                auditAction = 'assigned';
                break;
            case 'approve':
                update = { status: 'approved' };
                auditAction = 'approved';
                break;
            case 'change-category':
                update = { category: data.category };
                auditAction = 'edited';
                break;
            case 'change-priority':
                update = { priority: data.priority };
                auditAction = 'edited';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action'
                });
        }

        // Update emails
        const result = await Email.updateMany(
            { _id: { $in: emailIds } },
            update
        );

        // Create audit log for first email
        if (emailIds[0]) {
            await AuditLog.create({
                email: emailIds[0],
                user: req.user._id,
                action: auditAction,
                details: {
                    action,
                    data,
                    totalEmails: emailIds.length
                }
            });
        }

        res.json({
            success: true,
            data: {
                matched: result.matchedCount,
                modified: result.modifiedCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const uploadAttachments = async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        // Save attachments
        const attachments = await Promise.all(
            files.map(async (file) => {
                return await Attachment.create({
                    email: id,
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: file.path
                });
            })
        );

        await Email.findByIdAndUpdate(id, {
            hasAttachments: true
        });

        await AuditLog.create({
            email: id,
            user: req.user._id,
            action: 'edited',
            details: {
                attachments: files.map(f => ({
                    filename: f.originalname,
                    size: f.size
                }))
            }
        });

        res.json({
            success: true,
            data: attachments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const downloadAttachment = async (req, res) => {
    try {
        const { emailId, attachmentId } = req.params;

        const attachment = await Attachment.findOne({
            _id: attachmentId,
            email: emailId
        });

        if (!attachment) {
            return res.status(404).json({
                success: false,
                error: 'Attachment not found'
            });
        }

        if (!fs.existsSync(attachment.path)) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        res.download(attachment.path, attachment.filename);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getEmails,
    getEmail,
    createEmail,
    updateEmail,
    approveEmail,
    sendEmail,
    replyToEmail,
    bulkUpdate,
    uploadAttachments,
    downloadAttachment
};
