const Email = require('../models/email.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const searchMonitor = require('../utils/searchMonitor');
const { normalizePaginationParams, buildPaginationMeta } = require('../utils/pagination');

class SearchService {
    /**
     * Perform advanced email search with multiple criteria
     * @param {Object} searchParams - Search parameters
     * @returns {Promise<Object>} Search results with metadata
     */
    async searchEmails(searchParams) {
        const startTime = Date.now();
        let error = null;
        let resultCount = 0;

        try {
            const {
                query,
                filters = {},
                sort = { createdAt: -1 },
                page = 1,
                limit = 20,
                includeScore = false,
                includeAnalytics = false,
                searchType = 'fulltext' // 'fulltext', 'regex', 'exact'
            } = searchParams;
            const { page: parsedPage, limit: parsedLimit } = normalizePaginationParams({ page, limit });

            let searchResults;
            let totalCount = 0;

            switch (searchType) {
                case 'fulltext':
                    searchResults = await this.performFullTextSearch({
                        query, filters, sort, page: parsedPage, limit: parsedLimit, includeScore
                    });
                    break;

                case 'regex':
                    searchResults = await this.performRegexSearch({
                        query, filters, sort, page: parsedPage, limit: parsedLimit
                    });
                    break;

                case 'exact':
                    searchResults = await this.performExactSearch({
                        query, filters, sort, page: parsedPage, limit: parsedLimit
                    });
                    break;

                default:
                    searchResults = await this.performFullTextSearch({
                        query, filters, sort, page: parsedPage, limit: parsedLimit, includeScore
                    });
            }

            // Get total count for pagination
            if (query) {
                totalCount = await this.getSearchResultCount(query, filters, searchType);
            } else {
                totalCount = await Email.countDocuments(filters);
            }

            resultCount = searchResults.length;

            const result = {
                success: true,
                data: searchResults,
                pagination: buildPaginationMeta({ page: parsedPage, limit: parsedLimit, total: totalCount }),
                searchMeta: {
                    query,
                    searchType,
                    executionTime: Date.now() - startTime,
                    resultCount
                }
            };

            // Add analytics if requested
            if (includeAnalytics && query) {
                result.analytics = await this.getSearchAnalytics(query, filters);
            }

            return result;

        } catch (err) {
            error = err;
            logger.error('Search service error:', err);
            throw err;
        } finally {
            // Record metrics for monitoring
            const responseTime = Date.now() - startTime;
            searchMonitor.recordQuery(
                searchParams.query || 'no-query',
                responseTime,
                resultCount,
                error
            );
        }
    }

    /**
     * Perform MongoDB full-text search
     */
    async performFullTextSearch({ query, filters, sort, page, limit, includeScore }) {
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

    // Apply additional filters
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

    // Populate assigned user
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

    // Project only necessary fields for list view
    pipeline.push({
        $project: {
            fromAddress: 1,
            toAddress: 1,
            subject: 1,
            bodyText: { $substr: ['$bodyText', 0, 200] }, // Truncate for list view
            category: 1,
            confidence: 1,
            sentiment: 1,
            status: 1,
            isRead: 1,
            readAt: 1,
            assignedUser: 1,
            priority: 1,
            createdAt: 1,
            sentAt: 1,
            searchScore: 1,
            keywords: 1,
            extractedEntities: 1
        }
    });

    return await Email.aggregate(pipeline);
}

    /**
     * Perform regex-based search
     */
    async performRegexSearch({ query, filters, sort, page, limit }) {
    const searchQuery = {
        ...filters,
        $or: [
            { subject: { $regex: query, $options: 'i' } },
            { bodyText: { $regex: query, $options: 'i' } },
            { searchableContent: { $regex: query, $options: 'i' } },
            { fromAddress: { $regex: query, $options: 'i' } },
            { toAddress: { $regex: query, $options: 'i' } },
            { keywords: { $regex: query, $options: 'i' } }
        ]
    };

    const skip = (page - 1) * limit;

    return await Email.find(searchQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('assignedUserId', 'name email')
        .select({
            fromAddress: 1,
            toAddress: 1,
            subject: 1,
            bodyText: 1,
            category: 1,
            confidence: 1,
            sentiment: 1,
            status: 1,
            isRead: 1,
            readAt: 1,
            priority: 1,
            createdAt: 1,
            sentAt: 1,
            keywords: 1,
            extractedEntities: 1
        })
        .lean();
}

    /**
     * Perform exact phrase search
     */
    async performExactSearch({ query, filters, sort, page, limit }) {
    const searchQuery = {
        ...filters,
        $or: [
            { subject: { $regex: `\\b${this.escapeRegex(query)}\\b`, $options: 'i' } },
            { bodyText: { $regex: `\\b${this.escapeRegex(query)}\\b`, $options: 'i' } },
            { searchableContent: { $regex: `\\b${this.escapeRegex(query)}\\b`, $options: 'i' } }
        ]
    };

    const skip = (page - 1) * limit;

    return await Email.find(searchQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('assignedUserId', 'name email')
        .lean();
}

    /**
     * Get search result count
     */
    async getSearchResultCount(query, filters, searchType) {
    try {
        let countQuery;

        switch (searchType) {
            case 'fulltext':
                countQuery = {
                    $text: { $search: query },
                    ...filters
                };
                break;

            case 'regex':
                countQuery = {
                    ...filters,
                    $or: [
                        { subject: { $regex: query, $options: 'i' } },
                        { bodyText: { $regex: query, $options: 'i' } },
                        { searchableContent: { $regex: query, $options: 'i' } },
                        { fromAddress: { $regex: query, $options: 'i' } },
                        { toAddress: { $regex: query, $options: 'i' } }
                    ]
                };
                break;

            case 'exact':
                countQuery = {
                    ...filters,
                    $or: [
                        { subject: { $regex: `\\b${this.escapeRegex(query)}\\b`, $options: 'i' } },
                        { bodyText: { $regex: `\\b${this.escapeRegex(query)}\\b`, $options: 'i' } },
                        { searchableContent: { $regex: `\\b${this.escapeRegex(query)}\\b`, $options: 'i' } }
                    ]
                };
                break;

            default:
                countQuery = { $text: { $search: query }, ...filters };
        }

        return await Email.countDocuments(countQuery);
    } catch (error) {
        logger.error('Error getting search result count:', error);
        return 0;
    }
}

    /**
     * Get search suggestions based on partial query
     */
    async getSearchSuggestions(partialQuery, limit = 10) {
    try {
        const pipeline = [
            {
                $match: {
                    $or: [
                        { subject: { $regex: partialQuery, $options: 'i' } },
                        { keywords: { $elemMatch: { $regex: partialQuery, $options: 'i' } } },
                        { 'extractedEntities.people': { $elemMatch: { $regex: partialQuery, $options: 'i' } } },
                        { 'extractedEntities.organizations': { $elemMatch: { $regex: partialQuery, $options: 'i' } } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    subjects: { $addToSet: '$subject' },
                    keywords: { $push: '$keywords' },
                    people: { $push: '$extractedEntities.people' },
                    organizations: { $push: '$extractedEntities.organizations' }
                }
            },
            {
                $project: {
                    suggestions: {
                        $slice: [
                            {
                                $filter: {
                                    input: {
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
                                    cond: {
                                        $regexMatch: {
                                            input: '$$this',
                                            regex: partialQuery,
                                            options: 'i'
                                        }
                                    }
                                }
                            },
                            limit
                        ]
                    }
                }
            }
        ];

        const result = await Email.aggregate(pipeline);
        return result[0]?.suggestions || [];
    } catch (error) {
        logger.error('Error getting search suggestions:', error);
        return [];
    }
}

    /**
     * Get search analytics
     */
    async getSearchAnalytics(query, filters = {}) {
    try {
        const matchStage = {
            $text: { $search: query },
            ...filters
        };

        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalResults: { $sum: 1 },
                    avgConfidence: { $avg: '$confidence' },
                    avgSentimentScore: { $avg: '$sentimentScore' },
                    statusDistribution: { $push: '$status' },
                    categoryDistribution: { $push: '$category' },
                    priorityDistribution: { $push: '$priority' },
                    sentimentDistribution: { $push: '$sentiment' },
                    topSenders: { $push: '$fromAddress' },
                    dateRange: {
                        $push: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    totalResults: 1,
                    avgConfidence: { $round: ['$avgConfidence', 2] },
                    avgSentimentScore: { $round: ['$avgSentimentScore', 2] },
                    statusCounts: this.getDistributionCounts('$statusDistribution'),
                    categoryCounts: this.getDistributionCounts('$categoryDistribution'),
                    priorityCounts: this.getDistributionCounts('$priorityDistribution'),
                    sentimentCounts: this.getDistributionCounts('$sentimentDistribution'),
                    topSenders: {
                        $slice: [
                            {
                                $map: {
                                    input: {
                                        $sortByCount: '$topSenders'
                                    },
                                    as: 'sender',
                                    in: {
                                        email: '$$sender._id',
                                        count: '$$sender.count'
                                    }
                                }
                            },
                            5
                        ]
                    },
                    dateDistribution: {
                        $slice: [
                            {
                                $sortByCount: '$dateRange'
                            },
                            7
                        ]
                    }
                }
            }
        ];

        const result = await Email.aggregate(pipeline);
        return result[0] || {};
    } catch (error) {
        logger.error('Error getting search analytics:', error);
        return {};
    }
}

    /**
     * Search emails by entity type
     */
    async searchByEntity(entityType, entityValue, filters = {}, options = {}) {
    try {
        const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
        const { page: parsedPage, limit: parsedLimit, skip } = normalizePaginationParams({ page, limit });

        const searchQuery = {
            ...filters,
            [`extractedEntities.${entityType}`]: {
                $elemMatch: { $regex: entityValue, $options: 'i' }
            }
        };

        const [results, total] = await Promise.all([
            Email.find(searchQuery)
                .sort(sort)
                .skip(skip)
                .limit(parsedLimit)
                .populate('assignedUserId', 'name email')
                .lean(),
            Email.countDocuments(searchQuery)
        ]);

        return {
            success: true,
            data: results,
            pagination: buildPaginationMeta({ page: parsedPage, limit: parsedLimit, total })
        };
    } catch (error) {
        logger.error('Error searching by entity:', error);
        throw error;
    }
}

    /**
     * Get popular search terms
     */
    async getPopularSearchTerms(limit = 10) {
    try {
        const pipeline = [
            { $unwind: '$keywords' },
            {
                $group: {
                    _id: '$keywords',
                    count: { $sum: 1 },
                    lastUsed: { $max: '$createdAt' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $project: {
                    term: '$_id',
                    count: 1,
                    lastUsed: 1,
                    _id: 0
                }
            }
        ];

        return await Email.aggregate(pipeline);
    } catch (error) {
        logger.error('Error getting popular search terms:', error);
        return [];
    }
}

/**
 * Helper method to get distribution counts
 */
getDistributionCounts(field) {
    return {
        $arrayToObject: {
            $map: {
                input: { $setUnion: [field] },
                as: 'item',
                in: {
                    k: '$$item',
                    v: {
                        $size: {
                            $filter: {
                                input: field,
                                cond: { $eq: ['$$this', '$$item'] }
                            }
                        }
                    }
                }
            }
        }
    };
}

/**
 * Escape regex special characters
 */
escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build search filters from query parameters
 */
buildSearchFilters(queryParams) {
    const filters = {};

    // Standard filters
    if (queryParams.status) filters.status = queryParams.status;
    if (queryParams.category) filters.category = queryParams.category;
    if (queryParams.priority) filters.priority = queryParams.priority;
    if (queryParams.sentiment) filters.sentiment = queryParams.sentiment;
    if (queryParams.assignedTo) filters.assignedUserId = queryParams.assignedTo;

    // Boolean filters
    if (typeof queryParams.isRead !== 'undefined') {
        filters.isRead = queryParams.isRead === true || queryParams.isRead === 'true';
    }

    // Date range filters
    if (queryParams.fromDate || queryParams.toDate) {
        filters.createdAt = {};
        if (queryParams.fromDate) filters.createdAt.$gte = new Date(queryParams.fromDate);
        if (queryParams.toDate) filters.createdAt.$lte = new Date(queryParams.toDate);
    }

    // Confidence range
    if (queryParams.minConfidence) {
        filters.confidence = { $gte: parseFloat(queryParams.minConfidence) };
    }
    if (queryParams.maxConfidence) {
        filters.confidence = {
            ...filters.confidence,
            $lte: parseFloat(queryParams.maxConfidence)
        };
    }

    return filters;
}

    /**
     * Optimize search performance by creating necessary indexes
     */
    async optimizeSearchIndexes() {
    try {
        const Email = require('../models/email.model');

        // Ensure text indexes exist
        await Email.collection.createIndex({
            subject: 'text',
            bodyText: 'text',
            searchableContent: 'text',
            'extractedEntities.people': 'text',
            'extractedEntities.organizations': 'text'
        }, {
            name: 'email_fulltext_search_optimized',
            weights: {
                subject: 10,
                searchableContent: 8,
                bodyText: 5,
                'extractedEntities.people': 3,
                'extractedEntities.organizations': 2
            }
        });

        logger.info('Search indexes optimized successfully');
    } catch (error) {
        logger.error('Error optimizing search indexes:', error);
    }
}
}

module.exports = new SearchService();
