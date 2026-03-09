const Email = require('../models/email.model');
const EmailAccount = require('../models/emailAccount.model');
const User = require('../models/user.model');
const logger = require('./logger');

/**
 * Keep database indexes aligned with the Mongoose schemas so query behavior
 * and index definitions do not drift apart over time.
 */
class IndexManager {
    constructor() {
        this.models = {
            emails: Email,
            emailAccounts: EmailAccount,
            users: User
        };
    }

    async createAllIndexes() {
        try {
            logger.info('Creating database indexes from schema definitions...');

            for (const [collectionName, model] of Object.entries(this.models)) {
                await this.syncModelIndexes(collectionName, model);
            }

            logger.info('All indexes created successfully');
        } catch (error) {
            logger.error('Error creating indexes:', error);
            throw error;
        }
    }

    async syncModelIndexes(collectionName, model) {
        try {
            const result = await model.syncIndexes();
            const created = Array.isArray(result?.created) ? result.created.length : 0;
            const dropped = Array.isArray(result?.dropped) ? result.dropped.length : 0;
            logger.info(`Synced indexes for ${collectionName} (created: ${created}, dropped: ${dropped})`);
            return result;
        } catch (error) {
            logger.error(`Error syncing indexes for ${collectionName}:`, error);
            throw error;
        }
    }

    async getIndexes(collectionName) {
        try {
            const model = this.models[collectionName];
            if (!model) {
                throw new Error(`Unsupported collection: ${collectionName}`);
            }

            return await model.collection.getIndexes();
        } catch (error) {
            logger.error(`Error getting indexes for ${collectionName}:`, error);
            throw error;
        }
    }

    async dropIndex(collectionName, indexName) {
        try {
            const model = this.models[collectionName];
            if (!model) {
                throw new Error(`Unsupported collection: ${collectionName}`);
            }

            await model.collection.dropIndex(indexName);
            logger.info(`Dropped index '${indexName}' from ${collectionName}`);
        } catch (error) {
            logger.error(`Error dropping index ${indexName} from ${collectionName}:`, error);
            throw error;
        }
    }

    async rebuildIndexes() {
        try {
            logger.info('Rebuilding all indexes from schema definitions...');
            return await this.createAllIndexes();
        } catch (error) {
            logger.error('Error rebuilding indexes:', error);
            throw error;
        }
    }

    async getIndexStats(collectionName) {
        try {
            const model = this.models[collectionName];
            if (!model) {
                throw new Error(`Unsupported collection: ${collectionName}`);
            }

            const stats = await model.collection.aggregate([{ $indexStats: {} }]).toArray();
            return stats.map((stat) => ({
                name: stat.name,
                accesses: stat.accesses?.ops || 0,
                since: stat.accesses?.since || null
            }));
        } catch (error) {
            logger.error(`Error getting index stats for ${collectionName}:`, error);
            return [];
        }
    }
}

module.exports = new IndexManager();
