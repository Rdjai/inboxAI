const logger = require('../utils/logger');

/**
 * Performance monitoring service for aggregation queries
 */
class PerformanceMonitorService {
    constructor() {
        this.metrics = {
            queries: [],
            slowQueries: [],
            averageExecutionTime: 0,
            totalQueries: 0
        };
        this.slowQueryThreshold = 1000; // 1 second
    }

    /**
     * Record query execution
     */
    recordQuery(queryName, executionTime, resultCount = 0, filters = {}) {
        const query = {
            name: queryName,
            executionTime,
            resultCount,
            filters,
            timestamp: new Date().toISOString(),
            isSlow: executionTime > this.slowQueryThreshold
        };

        this.metrics.queries.push(query);
        this.metrics.totalQueries++;

        // Keep only last 1000 queries
        if (this.metrics.queries.length > 1000) {
            this.metrics.queries.shift();
        }

        // Track slow queries
        if (query.isSlow) {
            this.metrics.slowQueries.push(query);
            if (this.metrics.slowQueries.length > 100) {
                this.metrics.slowQueries.shift();
            }
            logger.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);
        }

        // Update average execution time
        this.updateAverageExecutionTime();
    }

    /**
     * Update average execution time
     */
    updateAverageExecutionTime() {
        if (this.metrics.queries.length === 0) {
            this.metrics.averageExecutionTime = 0;
            return;
        }

        const sum = this.metrics.queries.reduce((acc, q) => acc + q.executionTime, 0);
        this.metrics.averageExecutionTime = Math.round(sum / this.metrics.queries.length);
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        const slowQueryPercentage = this.metrics.totalQueries > 0
            ? ((this.metrics.slowQueries.length / this.metrics.totalQueries) * 100).toFixed(2)
            : 0;

        return {
            totalQueries: this.metrics.totalQueries,
            averageExecutionTime: this.metrics.averageExecutionTime,
            slowQueryCount: this.metrics.slowQueries.length,
            slowQueryPercentage: `${slowQueryPercentage}%`,
            slowQueryThreshold: this.slowQueryThreshold,
            recentQueries: this.metrics.queries.slice(-10),
            slowestQueries: this.metrics.slowQueries
                .sort((a, b) => b.executionTime - a.executionTime)
                .slice(0, 10)
        };
    }

    /**
     * Get query statistics by name
     */
    getQueryStats(queryName) {
        const queries = this.metrics.queries.filter(q => q.name === queryName);
        if (queries.length === 0) {
            return null;
        }

        const executionTimes = queries.map(q => q.executionTime);
        const sum = executionTimes.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / executionTimes.length);
        const min = Math.min(...executionTimes);
        const max = Math.max(...executionTimes);

        return {
            queryName,
            count: queries.length,
            averageExecutionTime: avg,
            minExecutionTime: min,
            maxExecutionTime: max,
            slowCount: queries.filter(q => q.isSlow).length,
            recentExecutions: queries.slice(-5)
        };
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            queries: [],
            slowQueries: [],
            averageExecutionTime: 0,
            totalQueries: 0
        };
        logger.info('Performance metrics reset');
    }

    /**
     * Set slow query threshold
     */
    setSlowQueryThreshold(threshold) {
        this.slowQueryThreshold = threshold;
        logger.info(`Slow query threshold set to ${threshold}ms`);
    }

    /**
     * Get performance report
     */
    getPerformanceReport() {
        const metrics = this.getMetrics();
        const queryNames = [...new Set(this.metrics.queries.map(q => q.name))];
        const queryStats = queryNames.map(name => this.getQueryStats(name));

        return {
            summary: metrics,
            queryStatistics: queryStats,
            generatedAt: new Date().toISOString()
        };
    }
}

module.exports = new PerformanceMonitorService();
