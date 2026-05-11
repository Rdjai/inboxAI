const Joi = require('joi');

const emailAccountSchemas = {
    createAccount: Joi.object({
        name: Joi.string().required().trim().max(100).messages({
            'string.empty': 'Account name is required',
            'any.required': 'Account name is required'
        }),
        email: Joi.string().email().required().trim().lowercase().messages({
            'string.email': 'Please enter a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        }),
        provider: Joi.string().valid('gmail', 'outlook', 'yahoo', 'office365', 'imap', 'pop3', 'smtp', 'other')
            .required()
            .messages({
                'any.only': 'Provider must be one of: gmail, outlook, yahoo, office365, imap, pop3, smtp, other',
                'any.required': 'Provider is required'
            }),
        imapConfig: Joi.object({
            host: Joi.string().required().hostname().messages({
                'string.hostname': 'Please enter a valid IMAP hostname',
                'any.required': 'IMAP host is required'
            }),
            port: Joi.number().integer().min(1).max(65535).default(993),
            secure: Joi.boolean().default(true),
            auth: Joi.object({
                user: Joi.string().required().messages({
                    'string.empty': 'IMAP username is required',
                    'any.required': 'IMAP username is required'
                }),
                pass: Joi.string().required().messages({
                    'string.empty': 'IMAP password is required',
                    'any.required': 'IMAP password is required'
                })
            }).required()
        }).required(),
        smtpConfig: Joi.object({
            host: Joi.string().required().hostname().messages({
                'string.hostname': 'Please enter a valid SMTP hostname',
                'any.required': 'SMTP host is required'
            }),
            port: Joi.number().integer().min(1).max(65535).default(587),
            secure: Joi.boolean().default(true),
            auth: Joi.object({
                user: Joi.string().required().messages({
                    'string.empty': 'SMTP username is required',
                    'any.required': 'SMTP username is required'
                }),
                pass: Joi.string().required().messages({
                    'string.empty': 'SMTP password is required',
                    'any.required': 'SMTP password is required'
                })
            }).required()
        }).required(),
        syncFrequency: Joi.string()
            .valid('15min', '30min', '1hour', '3hour', '6hour', '12hour', 'daily', 'manual')
            .default('30min'),
        isDefault: Joi.boolean().default(false),
        isActive: Joi.boolean().default(true),
        labels: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
                type: Joi.string().valid('system', 'user').default('user')
            })
        ).default([]),
        metadata: Joi.object().pattern(Joi.string(), Joi.any())
    }).options({ abortEarly: false }),

    updateAccount: Joi.object({
        name: Joi.string().trim().max(100),
        email: Joi.string().email().trim().lowercase(),
        provider: Joi.string().valid('gmail', 'outlook', 'yahoo', 'office365', 'imap', 'pop3', 'smtp', 'other'),
        imapConfig: Joi.object({
            host: Joi.string().hostname(),
            port: Joi.number().integer().min(1).max(65535),
            secure: Joi.boolean(),
            auth: Joi.object({
                user: Joi.string(),
                pass: Joi.string()
            })
        }),
        smtpConfig: Joi.object({
            host: Joi.string().hostname(),
            port: Joi.number().integer().min(1).max(65535),
            secure: Joi.boolean(),
            auth: Joi.object({
                user: Joi.string(),
                pass: Joi.string()
            })
        }),
        syncFrequency: Joi.string().valid('15min', '30min', '1hour', '3hour', '6hour', '12hour', 'daily', 'manual'),
        isDefault: Joi.boolean(),
        isActive: Joi.boolean(),
        labels: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
                type: Joi.string().valid('system', 'user')
            })
        )
    }).options({ abortEarly: false }),

    syncAccount: Joi.object({
        limit: Joi.number().integer().min(1).max(500).default(50),
        fullSync: Joi.boolean().default(false),
        folders: Joi.array().items(Joi.string()).default(['INBOX'])
    }).options({ abortEarly: false }),

    shareAccount: Joi.object({
        userId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/).messages({
            'string.pattern.base': 'Invalid user ID format',
            'any.required': 'User ID is required'
        }),
        permissions: Joi.array().items(
            Joi.string().valid('read', 'write', 'delete', 'admin')
        ).min(1).default(['read'])
    }).options({ abortEarly: false }),

    testConnection: Joi.object({})
};

module.exports = emailAccountSchemas;
