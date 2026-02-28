// src/services/cacheService.js
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

/**
 * Cache service for aggregation results
 * Uses in-memory caching with TTL
 */
class CacheService {
    constructor() {
        // Standard TTL: 5 minutes for most queries, 1 minute for real-time data
        this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    /**
     * Generate cache key from parameters
     */
    generateKey(prefix, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                if (params[key] !== null && params[key] !== undefined) {
                    acc[key] = params[key];
                }
                return acc;
            }, {});

        return `${prefix}:${JSON.stringify(sortedParams)}`;
    }

    /**
     * Get value from cache
     */
    get(key) {
        const value = this.cache.get(key);
        if (value) {
            this.stats.hits++;
            logger.debug(`Cache hit: ${key}`);
        } else {
            this.stats.misses++;
            logger.debug(`Cache miss: ${key}`);
        }
        return value;
    }

    /**
     * Set value in cache
     */
    set(key, value, ttl = 300) {
        this.cache.set(key, value, ttl);
        this.stats.sets++;
        logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    }

    /**
     * Get or set value
     */
    async getOrSet(key, fetchFn, ttl = 300) {
        const cached = this.get(key);
        if (cached) {
            return cached;
        }

        const value = await fetchFn();
        this.set(key, value, ttl);
        return value;
    }

    /**
     * Delete specific key
     */
    delete(key) {
        this.cache.del(key);
        this.stats.deletes++;
        logger.debug(`Cache deleted: ${key}`);
    }

    /**
     * Delete keys matching pattern
     */
    deletePattern(pattern) {
        const keys = this.cache.keys();
        const matchingKeys = keys.filter(key => key.includes(pattern));
        matchingKeys.forEach(key => this.delete(key));
        return matchingKeys.length;
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.flushAll();
        logger.info('Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const keys = this.cache.keys();
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
            : 0;

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            keyCount: keys.length,
            keys: keys.slice(0, 20) // Show first 20 keys
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }
}

module.exports = new CacheService();
