const mongoose = require('mongoose');
const Email = require('../models/email.model');
const logger = require('./logger');

class SearchMonitor {
    constructor() {
        this.metrics = {
            queryCount: 0,
            totalResponseTime: 0,
            slowQueries: [],
            popularQueries: new Map(),
            errorCount: 0
        };

        this.slowQueryThreshold = 1000; // 1 second
        this.maxSlowQueries = 100;
        this.maxPopularQueries = 50;
    }

    /**
     * Record search query metrics
     */
    recordQuery(query, responseTime, resultCount, error = null) {
        this.metrics.queryCount++;
        this.metrics.totalResponseTime += responseTime;

        if (error) {
            this.metrics.errorCount++;
            logger.error('Search query error:', { query, error: error.message });
        }

        // Track slow queries
        if (responseTime > this.slowQueryThreshold) {
            this.metrics.slowQueries.push({
                query,
                responseTime,
                resultCount,
                timestamp: new Date(),
                error: error?.message
            });

            // Keep only recent slow queries
            if (this.metrics.slowQueries.length > this.maxSlowQueries) {
                this.metrics.slowQueries = this.metrics.slowQueries.slice(-this.maxSlowQueries);
            }

            logger.warn('Slow search query detected:', {
                query,
                responseTime: `${responseTime}ms`,
                resultCount
            });
        }

        // Track popular queries
        const queryKey = query.toLowerCase().trim();
        const currentCount = this.metrics.popularQueries.get(queryKey) || 0;
        this.metrics.popularQueries.set(queryKey, currentCount + 1);

        // Keep only top queries
        if (this.metrics.popularQueries.size > this.maxPopularQueries) {
            const sortedQueries = Array.from(this.metrics.popularQueries.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, this.maxPopularQueries);

            this.metrics.popularQueries = new Map(sortedQueries);
        }
    }

    /**
     * Get current performance metrics
     */
    getMetrics() {
        const avgResponseTime = this.metrics.queryCount > 0
            ? Math.round(this.metrics.totalResponseTime / this.metrics.queryCount)
            : 0;

        const errorRate = this.metrics.queryCount > 0
            ? Math.round((this.metrics.errorCount / this.metrics.queryCount) * 100)
            : 0;

        return {
            totalQueries: this.metrics.queryCount,
            averageResponseTime: avgResponseTime,
            errorRate: `${errorRate}%`,
            slowQueriesCount: this.metrics.slowQueries.length,
            recentSlowQueries: this.metrics.slowQueries.slice(-10),
            topQueries: Array.from(this.metrics.popularQueries.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([query, count]) => ({ query, count }))
        };
    }

    /**
     * Analyze database performance
     */
    async analyzeDatabasePerformance() {
        try {
            const db = mongoose.connection.db;
            const emailCollection = db.collection('emails');

            // Get collection statistics
            const stats = await emailCollection.stats();

            // Get index information
            const indexes = await emailCollection.indexes();

            // Get index usage statistics (if available)
            let indexStats = [];
            try {
                indexStats = await emailCollection.aggregate([
                    { $indexStats: {} }
                ]).toArray();
            } catch (error) {
                // Index stats not available in all MongoDB versions
                logger.warn('Index statistics not available:', error.message);
            }

            // Analyze slow operations from profiler (if enabled)
            let slowOperations = [];
            try {
                const profileCollection = db.collection('system.profile');
                slowOperations = await profileCollection
                    .find({
                        ns: 'inboxflow.emails',
                        'command.find': { $exists: true }
                    })
                    .sort({ ts: -1 })
                    .limit(10)
                    .toArray();
            } catch (error) {
                // Profiler might not be enabled
                logger.info('Database profiler not enabled or accessible');
            }

            return {
                collection: {
                    documentCount: stats.count,
                    dataSize: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                    indexSize: `${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`,
                    avgDocumentSize: `${stats.avgObjSize} bytes`,
                    indexRatio: `${((stats.totalIndexSize / stats.size) * 100).toFixed(2)}%`
                },
                indexes: {
                    count: indexes.length,
                    details: indexes.map(idx => ({
                        name: idx.name,
                        keys: idx.key,
                        size: idx.textIndexVersion ? 'Text Index' : 'Standard'
                    }))
                },
                indexUsage: indexStats.map(stat => ({
                    name: stat.name,
                    usageCount: stat.accesses?.ops || 0,
                    lastUsed: stat.accesses?.since || 'Never'
                })),
                recentSlowOperations: slowOperations.map(op => ({
                    duration: op.millis,
                    command: op.command,
                    timestamp: op.ts
                }))
            };

        } catch (error) {
            logger.error('Error analyzing database performance:', error);
            throw error;
        }
    }

    /**
     * Generate performance recommendations
     */
    async generateRecommendations() {
        const metrics = this.getMetrics();
        const dbAnalysis = await this.analyzeDatabasePerformance();
        const recommendations = [];

        // Check average response time
        if (metrics.averageResponseTime > 500) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                issue: 'High average response time',
                recommendation: 'Consider optimizing indexes or query patterns',
                details: `Average response time: ${metrics.averageResponseTime}ms`
            });
        }

        // Check error rate
        if (parseFloat(metrics.errorRate) > 5) {
            recommendations.push({
                type: 'reliability',
                priority: 'high',
                issue: 'High error rate',
                recommendation: 'Investigate query errors and improve error handling',
                details: `Error rate: ${metrics.errorRate}`
            });
        }

        // Check index usage
        const unusedIndexes = dbAnalysis.indexUsage.filter(idx =>
            idx.usageCount === 0 && idx.name !== '_id_'
        );

        if (unusedIndexes.length > 0) {
            recommendations.push({
                type: 'optimization',
                priority: 'medium',
                issue: 'Unused indexes detected',
                recommendation: 'Consider removing unused indexes to improve write performance',
                details: `Unused indexes: ${unusedIndexes.map(idx => idx.name).join(', ')}`
            });
        }

        // Check collection size vs index size ratio
        const indexRatio = parseFloat(dbAnalysis.collection.indexRatio);
        if (indexRatio > 50) {
            recommendations.push({
                type: 'storage',
                priority: 'medium',
                issue: 'High index to data ratio',
                recommendation: 'Review index strategy to optimize storage usage',
                details: `Index ratio: ${dbAnalysis.collection.indexRatio}`
            });
        }

        // Check for frequent slow queries
        if (metrics.slowQueriesCount > 10) {
            const commonSlowPatterns = this.analyzeSlowQueryPatterns();
            recommendations.push({
                type: 'performance',
                priority: 'high',
                issue: 'Frequent slow queries',
                recommendation: 'Optimize common slow query patterns',
                details: `Common patterns: ${commonSlowPatterns.join(', ')}`
            });
        }

        return {
            summary: {
                totalRecommendations: recommendations.length,
                highPriority: recommendations.filter(r => r.priority === 'high').length,
                mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
                lowPriority: recommendations.filter(r => r.priority === 'low').length
            },
            recommendations,
            generatedAt: new Date()
        };
    }

    /**
     * Analyze patterns in slow queries
     */
    analyzeSlowQueryPatterns() {
        const patterns = new Map();

        this.metrics.slowQueries.forEach(slowQuery => {
            // Extract query patterns (simplified)
            const query = slowQuery.query.toLowerCase();

            // Check for common patterns
            if (query.includes('*') || query.includes('%')) {
                patterns.set('wildcard_queries', (patterns.get('wildcard_queries') || 0) + 1);
            }

            if (query.length > 50) {
                patterns.set('long_queries', (patterns.get('long_queries') || 0) + 1);
            }

            if (query.split(' ').length > 10) {
                patterns.set('complex_queries', (patterns.get('complex_queries') || 0) + 1);
            }

            // Check for regex patterns
            if (query.includes('/') || query.includes('\\')) {
                patterns.set('regex_queries', (patterns.get('regex_queries') || 0) + 1);
            }
        });

        return Array.from(patterns.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([pattern, count]) => `${pattern} (${count})`);
    }

    /**
     * Reset metrics (useful for periodic reporting)
     */
    resetMetrics() {
        this.metrics = {
            queryCount: 0,
            totalResponseTime: 0,
            slowQueries: [],
            popularQueries: new Map(),
            errorCount: 0
        };
    }

    /**
     * Export metrics for external monitoring systems
     */
    exportMetrics() {
        const metrics = this.getMetrics();

        return {
            timestamp: new Date().toISOString(),
            search_queries_total: metrics.totalQueries,
            search_response_time_avg: metrics.averageResponseTime,
            search_error_rate: parseFloat(metrics.errorRate),
            search_slow_queries_count: metrics.slowQueriesCount,
            search_popular_queries: metrics.topQueries
        };
    }

    /**
     * Health check for search functionality
     */
    async healthCheck() {
        try {
            const startTime = Date.now();

            // Test basic search functionality
            const testResult = await Email.find({
                $text: { $search: 'test' }
            }).limit(1).lean();

            const responseTime = Date.now() - startTime;

            // Check index existence
            const indexes = await Email.collection.indexes();
            const hasTextIndex = indexes.some(idx =>
                idx.name && idx.name.includes('text')
            );

            return {
                status: 'healthy',
                searchFunctional: true,
                textIndexExists: hasTextIndex,
                responseTime: `${responseTime}ms`,
                indexCount: indexes.length,
                checkedAt: new Date()
            };

        } catch (error) {
            logger.error('Search health check failed:', error);

            return {
                status: 'unhealthy',
                searchFunctional: false,
                error: error.message,
                checkedAt: new Date()
            };
        }
    }
}

// Create singleton instance
const searchMonitor = new SearchMonitor();

module.exports = searchMonitor;