// src/utils/indexManager.js
const Email = require('../models/email.model');
const User = require('../models/user.model');
const logger = require('./logger');

/**
 * Index management for performance optimization
 */
class IndexManager {
    /**
     * Create all recommended indexes
     */
    async createAllIndexes() {
        try {
            logger.info('Creating database indexes...');

            // Email model indexes
            await this.createEmailIndexes();

            // User model indexes
            await this.createUserIndexes();

            logger.info('✅ All indexes created successfully');
        } catch (error) {
            logger.error('Error creating indexes:', error);
            throw error;
        }
    }

    /**
     * Create indexes for Email model
     */
    async createEmailIndexes() {
        try {
            // Single field indexes
            const singleFieldIndexes = [
                { key: { createdAt: -1 }, name: 'createdAt_desc' },
                { key: { status: 1 }, name: 'status' },
                { key: { userId: 1 }, name: 'userId' },
                { key: { accountId: 1 }, name: 'accountId' },
                { key: { category: 1 }, name: 'category' },
                { key: { priority: 1 }, name: 'priority' },
                { key: { sentiment: 1 }, name: 'sentiment' },
                { key: { confidence: 1 }, name: 'confidence' },
                { key: { isRead: 1 }, name: 'isRead' },
                { key: { messageId: 1 }, name: 'messageId', unique: true },
                { key: { fromAddress: 1 }, name: 'fromAddress' },
                { key: { toAddress: 1 }, name: 'toAddress' }
            ];

            // Compound indexes for common query patterns
            const compoundIndexes = [
                { key: { createdAt: -1, status: 1 }, name: 'createdAt_status' },
                { key: { userId: 1, createdAt: -1 }, name: 'userId_createdAt' },
                { key: { accountId: 1, status: 1 }, name: 'accountId_status' },
                { key: { accountId: 1, createdAt: -1 }, name: 'accountId_createdAt' },
                { key: { category: 1, priority: 1 }, name: 'category_priority' },
                { key: { status: 1, createdAt: -1 }, name: 'status_createdAt' },
                { key: { userId: 1, status: 1 }, name: 'userId_status' },
                { key: { createdAt: -1, userId: 1, status: 1 }, name: 'createdAt_userId_status' }
            ];

            // Text search indexes
            const textIndexes = [
                { key: { subject: 'text', bodyText: 'text' }, name: 'text_search' },
                { key: { keywords: 'text' }, name: 'keywords_text' }
            ];

            // Create single field indexes
            for (const index of singleFieldIndexes) {
                try {
                    await Email.collection.createIndex(index.key, {
                        name: index.name,
                        unique: index.unique || false,
                        background: true
                    });
                    logger.debug(`Created index: ${index.name}`);
                } catch (error) {
                    if (error.code !== 85) { // Index already exists
                        logger.warn(`Failed to create index ${index.name}:`, error.message);
                    }
                }
            }

            // Create compound indexes
            for (const index of compoundIndexes) {
                try {
                    await Email.collection.createIndex(index.key, {
                        name: index.name,
                        background: true
                    });
                    logger.debug(`Created compound index: ${index.name}`);
                } catch (error) {
                    if (error.code !== 85) {
                        logger.warn(`Failed to create compound index ${index.name}:`, error.message);
                    }
                }
            }

            // Create text indexes
            for (const index of textIndexes) {
                try {
                    await Email.collection.createIndex(index.key, {
                        name: index.name,
                        background: true
                    });
                    logger.debug(`Created text index: ${index.name}`);
                } catch (error) {
                    if (error.code !== 85) {
                        logger.warn(`Failed to create text index ${index.name}:`, error.message);
                    }
                }
            }

            logger.info('✅ Email indexes created');
        } catch (error) {
            logger.error('Error creating email indexes:', error);
            throw error;
        }
    }

    /**
     * Create indexes for User model
     */
    async createUserIndexes() {
        try {
            const indexes = [
                { key: { email: 1 }, name: 'email', unique: true },
                { key: { role: 1 }, name: 'role' },
                { key: { isActive: 1 }, name: 'isActive' },
                { key: { createdAt: -1 }, name: 'createdAt_desc' },
                { key: { lastLoginAt: -1 }, name: 'lastLoginAt_desc' }
            ];

            for (const index of indexes) {
                try {
                    await User.collection.createIndex(index.key, {
                        name: index.name,
                        unique: index.unique || false,
                        background: true
                    });
                    logger.debug(`Created user index: ${index.name}`);
                } catch (error) {
                    if (error.code !== 85) {
                        logger.warn(`Failed to create user index ${index.name}:`, error.message);
                    }
                }
            }

            logger.info('✅ User indexes created');
        } catch (error) {
            logger.error('Error creating user indexes:', error);
            throw error;
        }
    }

    /**
     * Get all indexes for a collection
     */
    async getIndexes(collectionName) {
        try {
            const collection = collectionName === 'emails' ? Email.collection : User.collection;
            const indexes = await collection.getIndexes();
            return indexes;
        } catch (error) {
            logger.error(`Error getting indexes for ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Drop an index
     */
    async dropIndex(collectionName, indexName) {
        try {
            const collection = collectionName === 'emails' ? Email.collection : User.collection;
            await collection.dropIndex(indexName);
            logger.info(`Dropped index: ${indexName}`);
        } catch (error) {
            logger.error(`Error dropping index ${indexName}:`, error);
            throw error;
        }
    }

    /**
     * Rebuild all indexes
     */
    async rebuildIndexes() {
        try {
            logger.info('Rebuilding all indexes...');
            await Email.collection.dropAllIndexes();
            await User.collection.dropAllIndexes();
            await this.createAllIndexes();
            logger.info('✅ Indexes rebuilt successfully');
        } catch (error) {
            logger.error('Error rebuilding indexes:', error);
            throw error;
        }
    }

    /**
     * Get index statistics
     */
    async getIndexStats(collectionName) {
        try {
            const collection = collectionName === 'emails' ? Email.collection : User.collection;
            const stats = await collection.aggregate([
                { $indexStats: {} }
            ]).toArray();

            return stats.map(stat => ({
                name: stat.name,
                accesses: stat.accesses.ops,
                since: stat.accesses.since
            }));
        } catch (error) {
            logger.error(`Error getting index stats for ${collectionName}:`, error);
            return [];
        }
    }
}

module.exports = new IndexManager();
