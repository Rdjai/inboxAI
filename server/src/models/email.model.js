const mongoose = require('mongoose');
const { EMAIL_STATUS, EMAIL_CATEGORIES, PRIORITY, SENTIMENT } = require('../utils/constants');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SEARCHABLE_BODY_LENGTH = 4000;
const MAX_KEYWORDS = 20;
const MAX_ENTITY_VALUES = 10;
const MAX_ENTITY_DATES = 5;

const SEARCH_STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
]);

function sliceUnique(values = [], limit = MAX_ENTITY_VALUES) {
    return [...new Set(values.filter(Boolean))].slice(0, limit);
}

function normalizeSearchText(value, maxLength = MAX_SEARCHABLE_BODY_LENGTH) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function extractKeywordsFromText(text) {
    return sliceUnique(
        normalizeSearchText(text, MAX_SEARCHABLE_BODY_LENGTH)
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !SEARCH_STOP_WORDS.has(word)),
        MAX_KEYWORDS
    );
}

function extractEntitiesFromText(text, fromAddress, toAddress) {
    const source = String(text || '');
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g;
    const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const orgRegex = /\b[A-Z][A-Za-z\s]+(Inc|LLC|Corp|Corporation|Company|Co|Ltd|Limited)\b/g;

    const emails = sliceUnique(
        (source.match(emailRegex) || [])
            .map(email => email.toLowerCase())
            .filter(email => email !== fromAddress && email !== toAddress)
    );

    return {
        people: sliceUnique(source.match(nameRegex) || []),
        organizations: sliceUnique(source.match(orgRegex) || []),
        locations: [],
        dates: sliceUnique(source.match(dateRegex) || [], MAX_ENTITY_DATES),
        emails,
        phoneNumbers: sliceUnique(source.match(phoneRegex) || [], MAX_ENTITY_DATES)
    };
}

function buildSearchableContent({ subject, bodyText, draftText, fromAddress, toAddress, extractedEntities }) {
    const entityTerms = [
        ...(extractedEntities?.people || []),
        ...(extractedEntities?.organizations || []),
        ...(extractedEntities?.emails || [])
    ];

    return [
        normalizeSearchText(subject, 300),
        normalizeSearchText(bodyText, MAX_SEARCHABLE_BODY_LENGTH),
        normalizeSearchText(draftText, 1000),
        normalizeSearchText(fromAddress, 320),
        normalizeSearchText(toAddress, 320),
        ...entityTerms
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

function computeSearchArtifacts(emailLike = {}) {
    const subject = emailLike.subject || '';
    const bodyText = emailLike.bodyText || '';
    const draftText = emailLike.draftText || '';
    const fromAddress = String(emailLike.fromAddress || '').toLowerCase();
    const toAddress = String(emailLike.toAddress || '').toLowerCase();
    const entitySourceText = `${subject} ${bodyText}`;
    const extractedEntities = extractEntitiesFromText(entitySourceText, fromAddress, toAddress);
    const keywords = extractKeywordsFromText(`${subject} ${bodyText}`);
    const searchableContent = buildSearchableContent({
        subject,
        bodyText,
        draftText,
        fromAddress,
        toAddress,
        extractedEntities
    });

    return {
        searchableContent,
        keywords,
        extractedEntities
    };
}

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
        type: String
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
    searchableContent: 'text',
    keywords: 'text'
}, {
    name: 'email_fulltext_search',
    weights: {
        subject: 10,
        searchableContent: 8,
        keywords: 4
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
        const artifacts = computeSearchArtifacts(this);
        this.searchableContent = artifacts.searchableContent;
        this.keywords = artifacts.keywords;
        this.extractedEntities = artifacts.extractedEntities;
    }
    next();
});

// Method to extract keywords from email content
emailSchema.methods.extractKeywords = function () {
    return computeSearchArtifacts(this).keywords;
};

// Method to extract entities from email content
emailSchema.methods.extractEntities = function () {
    return computeSearchArtifacts(this).extractedEntities;
};

emailSchema.statics.computeSearchArtifacts = computeSearchArtifacts;

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
