const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Email = require('../models/email.model');

/**
 * Initialize and optimize MongoDB indexes for search functionality.
 * Index definitions live in the schema; this script syncs them and reports size.
 */
async function initializeSearchIndexes() {
    try {
        console.log('Initializing MongoDB search indexes...');

        await connectDB();

        const emailCollection = Email.collection;
        const existingIndexes = await emailCollection.indexes();
        console.log(`Found ${existingIndexes.length} existing indexes`);

        const syncResult = await Email.syncIndexes();
        console.log(`Synced indexes (created: ${(syncResult?.created || []).length}, dropped: ${(syncResult?.dropped || []).length})`);

        const finalIndexes = await emailCollection.indexes();
        const stats = await emailCollection.stats();

        console.log('Index analysis complete');
        console.log(`Total indexes: ${finalIndexes.length}`);
        console.log(`Collection size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Total index size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Index ratio: ${stats.size > 0 ? ((stats.totalIndexSize / stats.size) * 100).toFixed(2) : '0.00'}%`);
        console.log('Search index initialization completed successfully');
    } catch (error) {
        console.error('Error initializing search indexes:', error);
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
        console.log('Updating existing emails with search optimization...');

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
                console.log(`Updated ${processed} emails with search optimization`);
            }
        }

        console.log(`Successfully updated ${processed} emails`);
    } catch (error) {
        console.error('Error updating existing emails:', error);
        throw error;
    }
}

/**
 * Validate search performance with representative text queries.
 */
async function validateSearchPerformance() {
    try {
        console.log('Validating search performance...');

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
            console.log(`Query "${query}": ${results.length} results in ${duration}ms`);
        }

        console.log('Search performance validation completed');
    } catch (error) {
        console.error('Error validating search performance:', error);
        throw error;
    }
}

async function main() {
    try {
        await initializeSearchIndexes();
        await updateExistingEmails();
        await validateSearchPerformance();

        console.log('MongoDB text search optimization completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Fatal error during search optimization:', error);
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
