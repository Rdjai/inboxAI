const Joi = require('joi');

const validate = (schema, property = 'body', options = {}) => {
    return (req, res, next) => {
        const validationOptions = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true,
            ...options
        };

        const { error, value } = schema.validate(req[property], validationOptions);

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/"/g, ''),
                type: detail.type
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        // Replace request body/data with validated value
        req[property] = value;
        next();
    };
};

// Validation schemas for different modules
const authSchemas = {
    login: Joi.object({
        email: Joi.string().email().required().trim().lowercase(),
        password: Joi.string().min(6).required()
    }),

    register: Joi.object({
        name: Joi.string().min(2).max(50).required().trim(),
        email: Joi.string().email().required().trim().lowercase(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('admin', 'reviewer', 'agent').default('agent')
    })
};

const emailSchemas = {
    createEmail: Joi.object({
        fromAddress: Joi.string().email().required().trim().lowercase(),
        toAddress: Joi.string().email().required().trim().lowercase(),
        subject: Joi.string().required().max(200),
        bodyText: Joi.string().required(),
        bodyHtml: Joi.string().optional(),
        category: Joi.string().valid('Complaint', 'Issue', 'Refund', 'Billing', 'Feedback', 'Sales', 'Other'),
        priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').default('MEDIUM')
    }),

    updateDraft: Joi.object({
        draftText: Joi.string().required(),
        category: Joi.string().valid('Complaint', 'Issue', 'Refund', 'Billing', 'Feedback', 'Sales', 'Other')
    }),

    reply: Joi.object({
        content: Joi.string().required(),
        sendImmediately: Joi.boolean().default(false),
        attachments: Joi.array().items(Joi.string()).default([])
    }),

    forward: Joi.object({
        toAddress: Joi.string().email().required(),
        message: Joi.string().optional().allow(''),
        attachments: Joi.array().items(Joi.string()).default([])
    }),

    bulkAction: Joi.object({
        emailIds: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).min(1).required(),
        action: Joi.string().valid('approve', 'assign', 'delete', 'change-status').required(),
        data: Joi.object().optional()
    }),

    filter: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        status: Joi.string().valid('NEW', 'CLASSIFIED', 'DRAFTED', 'REVIEWED', 'APPROVED', 'SENT', 'FAILED'),
        category: Joi.string().valid('Complaint', 'Issue', 'Refund', 'Billing', 'Feedback', 'Sales', 'Other'),
        priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        assignedTo: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
        search: Joi.string().max(100),
        sortBy: Joi.string().valid('createdAt', 'priority', 'status', 'category', 'updatedAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
        fromDate: Joi.date().iso(),
        toDate: Joi.date().iso().greater(Joi.ref('fromDate'))
    })
};

// Import email account schemas
const emailAccountSchemas = require('../validators/emailAccount.schemas');

module.exports = {
    validate,
    authSchemas,
    emailSchemas,
    emailAccountSchemas
};
