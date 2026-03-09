const mongoose = require('mongoose');
const { EMAIL_STATUS, EMAIL_CATEGORIES, PRIORITY, SENTIMENT } = require('../utils/constants');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailMetadataSchema = new mongoose.Schema(
    {
        source: {
            type: String,
            trim: true,
            maxlength: 64
        },
        fetchedAt: Date,
        hasAttachments: {
            type: Boolean,
            default: false
        },
        sentVia: {
            type: String,
            trim: true,
            maxlength: 64
        }
    },
    {
        _id: false,
        strict: false
    }
);

const emailSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailAccount',
        index: true
    },
    fromAddress: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 320,
        match: EMAIL_PATTERN
    },
    toAddress: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 320,
        match: EMAIL_PATTERN
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300,
        index: true
    },
    bodyText: {
        type: String,
        required: true,
        minlength: 1
    },
    bodyHtml: {
        type: String,
        default: ''
    },

    category: {
        type: String,
        enum: EMAIL_CATEGORIES,
        index: true
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1
    },
    sentiment: {
        type: String,
        enum: Object.values(SENTIMENT),
        default: SENTIMENT.NEUTRAL,
        index: true
    },
    sentimentScore: {
        type: Number,
        min: -1,
        max: 1,
        default: 0
    },
    draftText: {
        type: String
    },
    status: {
        type: String,
        enum: Object.values(EMAIL_STATUS),
        default: EMAIL_STATUS.NEW,
        index: true
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        default: null
    },

    assignedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    priority: {
        type: String,
        enum: Object.values(PRIORITY),
        default: PRIORITY.MEDIUM,
        index: true
    },

    threadId: {
        type: String,
        trim: true,
        maxlength: 255,
        index: true
    },
    messageId: {
        type: String,
        unique: true,
        trim: true,
        maxlength: 500,
        default: () => `<${new mongoose.Types.ObjectId().toString()}@processmail.local>`
    },
    inReplyTo: {
        type: String,
        trim: true,
        maxlength: 500
    },
    references: [{
        type: String,
        trim: true,
        maxlength: 500
    }],

    // Enhanced search fields
    searchableContent: {
        type: String,
        index: 'text'
    },
    keywords: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    extractedEntities: {
        people: [String],
        organizations: [String],
        locations: [String],
        dates: [String],
        emails: [String],
        phoneNumbers: [String]
    },

    metadata: {
        type: emailMetadataSchema,
        default: () => ({})
    },

    processedAt: Date,
    sentAt: Date
}, {
    timestamps: true,
    minimize: false
});

// ===== TEXT SEARCH OPTIMIZATION =====

// 1. Compound Text Index for full-text search
emailSchema.index({
    subject: 'text',
    bodyText: 'text',
    searchableContent: 'text',
    'extractedEntities.people': 'text',
    'extractedEntities.organizations': 'text'
}, {
    name: 'email_fulltext_search',
    weights: {
        subject: 10,
        searchableContent: 8,
        bodyText: 5,
        'extractedEntities.people': 3,
        'extractedEntities.organizations': 2
    },
    default_language: 'english',
    language_override: 'language'
});

// 2. Optimized compound indexes for common query patterns
emailSchema.index({ createdAt: -1 });
emailSchema.index({ status: 1, createdAt: -1 });
emailSchema.index({ isRead: 1, createdAt: -1 });
emailSchema.index({ category: 1, createdAt: -1 });
emailSchema.index({ priority: 1, createdAt: -1 });
emailSchema.index({ sentiment: 1, createdAt: -1 });
emailSchema.index({ assignedUserId: 1, createdAt: -1 });
emailSchema.index({ userId: 1, createdAt: -1 });
emailSchema.index({ accountId: 1, createdAt: -1 });

// 3. Multi-field compound indexes for complex queries
emailSchema.index({ assignedUserId: 1, status: 1, createdAt: -1 });
emailSchema.index({ status: 1, priority: 1, createdAt: -1 });
emailSchema.index({ fromAddress: 1, createdAt: -1 });
emailSchema.index({ toAddress: 1, createdAt: -1 });
emailSchema.index({ userId: 1, status: 1, createdAt: -1 });
emailSchema.index({ accountId: 1, status: 1, createdAt: -1 });
emailSchema.index({ accountId: 1, isRead: 1, createdAt: -1 });
emailSchema.index({ userId: 1, assignedUserId: 1, status: 1, createdAt: -1 });
emailSchema.index({ status: 1, sentAt: -1 }, { partialFilterExpression: { sentAt: { $exists: true } } });

// 4. Search-specific indexes
emailSchema.index({ keywords: 1 });
emailSchema.index({ 'extractedEntities.people': 1 });
emailSchema.index({ 'extractedEntities.organizations': 1 });
emailSchema.index({ 'extractedEntities.emails': 1 });

// 5. Partial indexes for performance
emailSchema.index(
    { status: 1, assignedUserId: 1, createdAt: -1 },
    { partialFilterExpression: { status: { $in: ['NEW', 'REVIEWED', 'APPROVED'] } } }
);

emailSchema.index(
    { isRead: 1, createdAt: -1 },
    { partialFilterExpression: { isRead: false } }
);

// ===== SEARCH ENHANCEMENT METHODS =====

// Pre-save middleware to enhance searchability
emailSchema.pre('save', function (next) {
    if (this.isModified('subject') || this.isModified('bodyText') || this.isModified('draftText')) {
        // Create searchable content combining all text fields
        const searchParts = [
            this.subject || '',
            this.bodyText || '',
            this.draftText || '',
            this.fromAddress || '',
            this.toAddress || ''
        ].filter(Boolean);

        this.searchableContent = searchParts.join(' ').toLowerCase();

        // Extract keywords (simple implementation - can be enhanced with NLP)
        this.keywords = this.extractKeywords();

        // Extract entities (basic implementation)
        this.extractedEntities = this.extractEntities();
    }
    next();
});

// Method to extract keywords from email content
emailSchema.methods.extractKeywords = function () {
    const text = `${this.subject} ${this.bodyText}`.toLowerCase();
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that',
        'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);

    const words = text
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
        .slice(0, 20); // Limit to top 20 keywords

    return [...new Set(words)]; // Remove duplicates
};

// Method to extract entities from email content
emailSchema.methods.extractEntities = function () {
    const text = `${this.subject} ${this.bodyText}`;

    // Email regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = [...new Set((text.match(emailRegex) || []).map(email => email.toLowerCase()))];

    // Phone number regex (basic)
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phoneNumbers = [...new Set(text.match(phoneRegex) || [])];

    // Date regex (basic)
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g;
    const dates = [...new Set(text.match(dateRegex) || [])];

    // People names (basic - capitalized words)
    const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const people = [...new Set(text.match(nameRegex) || [])];

    // Organizations (basic - words ending with Inc, LLC, Corp, etc.)
    const orgRegex = /\b[A-Z][A-Za-z\s]+(Inc|LLC|Corp|Corporation|Company|Co|Ltd|Limited)\b/g;
    const organizations = [...new Set(text.match(orgRegex) || [])];

    return {
        people: people.slice(0, 10),
        organizations: organizations.slice(0, 10),
        locations: [], // Can be enhanced with location detection
        dates: dates.slice(0, 5),
        emails: emails.filter(email => email !== this.fromAddress && email !== this.toAddress).slice(0, 10),
        phoneNumbers: phoneNumbers.slice(0, 5)
    };
};

// Static method for advanced search
emailSchema.statics.advancedSearch = function (searchOptions) {
    const {
        query,
        filters = {},
        sort = { createdAt: -1 },
        page = 1,
        limit = 20,
        includeScore = false
    } = searchOptions;

    const pipeline = [];

    // Text search stage
    if (query) {
        pipeline.push({
            $match: {
                $text: {
                    $search: query,
                    $caseSensitive: false,
                    $diacriticSensitive: false
                }
            }
        });

        if (includeScore) {
            pipeline.push({
                $addFields: {
                    searchScore: { $meta: 'textScore' }
                }
            });
        }
    }

    // Apply filters
    if (Object.keys(filters).length > 0) {
        pipeline.push({ $match: filters });
    }

    // Sort stage
    const sortStage = includeScore && query
        ? { searchScore: { $meta: 'textScore' }, ...sort }
        : sort;

    pipeline.push({ $sort: sortStage });

    // Pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Populate stage
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'assignedUserId',
            foreignField: '_id',
            as: 'assignedUser',
            pipeline: [{ $project: { name: 1, email: 1 } }]
        }
    });

    pipeline.push({
        $addFields: {
            assignedUser: { $arrayElemAt: ['$assignedUser', 0] }
        }
    });

    return this.aggregate(pipeline);
};

// Static method for search suggestions
emailSchema.statics.getSearchSuggestions = function (query, limit = 10) {
    const pipeline = [
        {
            $match: {
                $or: [
                    { subject: { $regex: query, $options: 'i' } },
                    { keywords: { $regex: query, $options: 'i' } },
                    { 'extractedEntities.people': { $regex: query, $options: 'i' } },
                    { 'extractedEntities.organizations': { $regex: query, $options: 'i' } }
                ]
            }
        },
        {
            $group: {
                _id: null,
                subjects: { $addToSet: '$subject' },
                keywords: { $addToSet: '$keywords' },
                people: { $addToSet: '$extractedEntities.people' },
                organizations: { $addToSet: '$extractedEntities.organizations' }
            }
        },
        {
            $project: {
                suggestions: {
                    $slice: [
                        {
                            $setUnion: [
                                '$subjects',
                                {
                                    $reduce: {
                                        input: '$keywords',
                                        initialValue: [],
                                        in: { $concatArrays: ['$$value', '$$this'] }
                                    }
                                },
                                {
                                    $reduce: {
                                        input: '$people',
                                        initialValue: [],
                                        in: { $concatArrays: ['$$value', '$$this'] }
                                    }
                                },
                                {
                                    $reduce: {
                                        input: '$organizations',
                                        initialValue: [],
                                        in: { $concatArrays: ['$$value', '$$this'] }
                                    }
                                }
                            ]
                        },
                        limit
                    ]
                }
            }
        }
    ];

    return this.aggregate(pipeline);
};

// Static method for search analytics
emailSchema.statics.getSearchAnalytics = function (query, filters = {}) {
    const matchStage = query
        ? { $text: { $search: query }, ...filters }
        : filters;

    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalResults: { $sum: 1 },
                avgConfidence: { $avg: '$confidence' },
                statusDistribution: {
                    $push: '$status'
                },
                categoryDistribution: {
                    $push: '$category'
                },
                priorityDistribution: {
                    $push: '$priority'
                },
                sentimentDistribution: {
                    $push: '$sentiment'
                }
            }
        },
        {
            $project: {
                totalResults: 1,
                avgConfidence: { $round: ['$avgConfidence', 2] },
                statusCounts: {
                    $arrayToObject: {
                        $map: {
                            input: { $setUnion: ['$statusDistribution'] },
                            as: 'status',
                            in: {
                                k: '$$status',
                                v: {
                                    $size: {
                                        $filter: {
                                            input: '$statusDistribution',
                                            cond: { $eq: ['$$this', '$$status'] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                categoryCounts: {
                    $arrayToObject: {
                        $map: {
                            input: { $setUnion: ['$categoryDistribution'] },
                            as: 'category',
                            in: {
                                k: '$$category',
                                v: {
                                    $size: {
                                        $filter: {
                                            input: '$categoryDistribution',
                                            cond: { $eq: ['$$this', '$$category'] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ];

    return this.aggregate(pipeline);
};

module.exports = mongoose.model('Email', emailSchema);
