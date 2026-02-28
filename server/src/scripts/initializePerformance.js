// src/scripts/initializePerformance.js
const mongoose = require('mongoose');
const indexManager = require('../utils/indexManager');
const logger = require('../utils/logger');

/**
 * Initialize performance optimizations
 * - Create database indexes
 * - Set up caching
 * - Configure query optimization
 */
async function initializePerformance() {
    try {
        logger.info('🚀 Starting performance initialization...');

        // Connect to MongoDB
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inboxflow');
            logger.info('✅ Connected to MongoDB');
        }

        // Create indexes
        logger.info('📊 Creating database indexes...');
        await indexManager.createAllIndexes();
        logger.info('✅ Indexes created successfully');

        // Get index statistics
        logger.info('📈 Index Statistics:');
        const emailIndexes = await indexManager.getIndexes('emails');
        const userIndexes = await indexManager.getIndexes('users');

        logger.info(`   Email indexes: ${Object.keys(emailIndexes).length}`);
        logger.info(`   User indexes: ${Object.keys(userIndexes).length}`);

        logger.info('✅ Performance initialization completed successfully');
        process.exit(0);

    } catch (error) {
        logger.error('❌ Performance initialization failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initializePerformance();
}

module.exports = initializePerformance;
