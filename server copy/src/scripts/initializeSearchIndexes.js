const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Email = require('../models/email.model');

/**
 * Initialize and optimize MongoDB indexes for search functionality.
 * Index definitions live in the schema; this script syncs them and reports size.
 */
async function initializeSearchIndexes() {
    try {
        logger.info('Initializing MongoDB search indexes...');

        await connectDB();

        const emailCollection = Email.collection;
        const existingIndexes = await emailCollection.indexes();
        logger.info(`Found ${existingIndexes.length} existing indexes`);

        const syncResult = await Email.syncIndexes();
        logger.info(`Synced indexes (created: ${(syncResult?.created || []).length}, dropped: ${(syncResult?.dropped || []).length})`);

        const finalIndexes = await emailCollection.indexes();
        const stats = await emailCollection.stats();

        logger.info('Index analysis complete');
        logger.info(`Total indexes: ${finalIndexes.length}`);
        logger.info(`Collection size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        logger.info(`Total index size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
        logger.info(`Index ratio: ${stats.size > 0 ? ((stats.totalIndexSize / stats.size) * 100).toFixed(2) : '0.00'}%`);
        logger.info('Search index initialization completed successfully');
    } catch (error) {
        logger.error('Error initializing search indexes:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
    }
}

/**
 * Update existing emails with search-optimized fields.
 */
async function updateExistingEmails() {
    try {
        logger.info('Updating existing emails with search optimization...');

        const batchSize = 100;
        let processed = 0;
        let hasMore = true;

        while (hasMore) {
            const emails = await Email.find({
                $or: [
                    { searchableContent: { $exists: false } },
                    { searchableContent: '' },
                    { keywords: { $exists: false } },
                    { extractedEntities: { $exists: false } }
                ]
            })
                .limit(batchSize)
                .lean();

            if (emails.length === 0) {
                hasMore = false;
                break;
            }

            const bulkOps = emails.map((email) => {
                const artifacts = Email.computeSearchArtifacts(email);

                return {
                    updateOne: {
                        filter: { _id: email._id },
                        update: {
                            $set: {
                                searchableContent: artifacts.searchableContent,
                                keywords: artifacts.keywords,
                                extractedEntities: artifacts.extractedEntities
                            }
                        }
                    }
                };
            });

            if (bulkOps.length > 0) {
                await Email.bulkWrite(bulkOps);
                processed += bulkOps.length;
                logger.info(`Updated ${processed} emails with search optimization`);
            }
        }

        logger.info(`Successfully updated ${processed} emails`);
    } catch (error) {
        logger.error('Error updating existing emails:', error);
        throw error;
    }
}

/**
 * Validate search performance with representative text queries.
 */
async function validateSearchPerformance() {
    try {
        logger.info('Validating search performance...');

        const testQueries = [
            'complaint',
            'refund request',
            'billing issue',
            'customer service'
        ];

        for (const query of testQueries) {
            const startTime = Date.now();

            const results = await Email.find({
                $text: { $search: query }
            })
                .limit(10)
                .lean();

            const duration = Date.now() - startTime;
            logger.info(`Query "${query}": ${results.length} results in ${duration}ms`);
        }

        logger.info('Search performance validation completed');
    } catch (error) {
        logger.error('Error validating search performance:', error);
        throw error;
    }
}

async function main() {
    try {
        await initializeSearchIndexes();
        await updateExistingEmails();
        await validateSearchPerformance();

        logger.info('MongoDB text search optimization completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Fatal error during search optimization:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    initializeSearchIndexes,
    updateExistingEmails,
    validateSearchPerformance
};
