// src/services/queryOptimizer.service.js
const logger = require('../utils/logger');

/**
 * Query optimization service
 * Provides utilities for optimizing MongoDB aggregation queries
 */
class QueryOptimizerService {
    /**
     * Optimize aggregation pipeline
     * Reorders stages for better performance
     */
    optimizePipeline(pipeline) {
        const optimized = [...pipeline];

        // Move $match stages to the beginning (reduces documents early)
        const matchStages = optimized.filter(stage => stage.$match);
        const otherStages = optimized.filter(stage => !stage.$match);

        // Combine multiple $match stages
        if (matchStages.length > 1) {
            const combinedMatch = matchStages.reduce((acc, stage) => {
                return { $match: { ...acc.$match, ...stage.$match } };
            });
            return [combinedMatch, ...otherStages];
        }

        return [...matchStages, ...otherStages];
    }

    /**
     * Add projection stage to reduce data transfer
     */
    addProjection(pipeline, fields) {
        const projection = {
            $project: fields.reduce((acc, field) => {
                acc[field] = 1;
                return acc;
            }, {})
        };

        // Add projection after $match but before other stages
        const matchIndex = pipeline.findIndex(stage => stage.$match);
        if (matchIndex !== -1) {
            pipeline.splice(matchIndex + 1, 0, projection);
        } else {
            pipeline.unshift(projection);
        }

        return pipeline;
    }

    /**
     * Add limit stage for pagination
     */
    addLimit(pipeline, limit, skip = 0) {
        if (skip > 0) {
            pipeline.push({ $skip: skip });
        }
        pipeline.push({ $limit: limit });
        return pipeline;
    }

    /**
     * Estimate query cost
     */
    estimateQueryCost(matchStage, collectionSize = 1000000) {
        const match = matchStage.$match || {};
        const conditions = Object.keys(match).length;

        // Simple cost estimation
        let cost = collectionSize;

        // Indexed fields reduce cost significantly
        const indexedFields = ['createdAt', 'status', 'userId', 'accountId'];
        const hasIndexedCondition = Object.keys(match).some(key => indexedFields.includes(key));

        if (hasIndexedCondition) {
            cost = Math.ceil(collectionSize * 0.1); // Assume 10% reduction with index
        }

        if (conditions > 1) {
            cost = Math.ceil(cost * 0.5); // Multiple conditions reduce further
        }

        return {
            estimatedDocuments: cost,
            hasIndexedCondition,
            conditionCount: conditions
        };
    }

    /**
     * Suggest indexes for query
     */
    suggestIndexes(pipeline) {
        const suggestions = [];
        const usedFields = new Set();

        pipeline.forEach(stage => {
            if (stage.$match) {
                Object.keys(stage.$match).forEach(field => {
                    usedFields.add(field);
                });
            }
            if (stage.$sort) {
                Object.keys(stage.$sort).forEach(field => {
                    usedFields.add(field);
                });
            }
            if (stage.$group) {
                if (stage.$group._id) {
                    const groupId = stage.$group._id;
                    if (typeof groupId === 'object') {
                        Object.keys(groupId).forEach(field => {
                            usedFields.add(field);
                        });
                    }
                }
            }
        });

        // Suggest compound indexes for frequently used field combinations
        const frequentCombinations = [
            ['createdAt', 'status'],
            ['userId', 'createdAt'],
            ['accountId', 'status'],
            ['category', 'priority']
        ];

        frequentCombinations.forEach(combo => {
            if (combo.every(field => usedFields.has(field))) {
                suggestions.push({
                    type: 'compound',
                    fields: combo,
                    reason: 'Used together in query'
                });
            }
        });

        // Suggest single field indexes
        usedFields.forEach(field => {
            if (!['_id'].includes(field)) {
                suggestions.push({
                    type: 'single',
                    field,
                    reason: 'Used in query'
                });
            }
        });

        return suggestions;
    }

    /**
     * Analyze query performance
     */
    analyzeQuery(pipeline, executionStats) {
        const analysis = {
            stages: pipeline.length,
            executionTime: executionStats.executionStages?.executionTimeMillis || 0,
            documentsExamined: executionStats.executionStages?.totalDocsExamined || 0,
            documentsReturned: executionStats.executionStages?.nReturned || 0,
            efficiency: 0,
            recommendations: []
        };

        // Calculate efficiency (documents returned / documents examined)
        if (analysis.documentsExamined > 0) {
            analysis.efficiency = (analysis.documentsReturned / analysis.documentsExamined * 100).toFixed(2);
        }

        // Generate recommendations
        if (analysis.efficiency < 10) {
            analysis.recommendations.push('Consider adding indexes to reduce documents examined');
        }

        if (analysis.executionTime > 1000) {
            analysis.recommendations.push('Query takes over 1 second - consider caching or optimization');
        }

        if (pipeline.length > 10) {
            analysis.recommendations.push('Pipeline has many stages - consider simplifying');
        }

        return analysis;
    }

    /**
     * Create optimized aggregation for common patterns
     */
    createOptimizedAggregation(type, filters = {}) {
        const { fromDate, toDate, userId, accountId } = filters;

        const matchStage = {};
        if (fromDate || toDate) {
            matchStage.createdAt = {};
            if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
            if (toDate) matchStage.createdAt.$lte = new Date(toDate);
        }
        if (userId) matchStage.userId = userId;
        if (accountId) matchStage.accountId = accountId;

        const pipelines = {
            volumeByDate: [
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            status: '$status'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.date': 1 } }
            ],

            statusDistribution: [
                { $match: matchStage },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ],

            userActivity: [
                { $match: matchStage },
                {
                    $group: {
                        _id: '$userId',
                        emailsProcessed: { $sum: 1 },
                        emailsSent: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
                        avgResponseTime: { $avg: '$responseTime' }
                    }
                },
                { $sort: { emailsProcessed: -1 } }
            ],

            heatmap: [
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            dayOfWeek: { $dayOfWeek: '$createdAt' },
                            hour: { $hour: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                }
            ]
        };

        return pipelines[type] || [];
    }
}

module.exports = new QueryOptimizerService();
