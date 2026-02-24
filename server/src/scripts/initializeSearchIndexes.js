// src/scripts/initializeSearchIndexes.js
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Email = require('../models/email.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Initialize and optimize MongoDB indexes for search functionality
 */
async function initializeSearchIndexes() {
    try {
        console.log('🔍 Initializing MongoDB search indexes...');

        await connectDB();

        // Get the Email collection
        const emailCollection = Email.collection;

        console.log('📊 Analyzing existing indexes...');
        const existingIndexes = await emailCollection.indexes();
        console.log(`Found ${existingIndexes.length} existing indexes`);

        // Drop old text indexes if they exist
        try {
            await emailCollection.dropIndex('email_fulltext_search');
            console.log('🗑️ Dropped old text search index');
        } catch (error) {
            // Index doesn't exist, continue
        }

        console.log('🏗️ Creating optimized search indexes...');

        // 1. Create compound text index for full-text search
        await emailCollection.createIndex({
            subject: 'text',
            bodyText: 'text',
            searchableContent: 'text',
            'extractedEntities.people': 'text',
            'extractedEntities.organizations': 'text',
            keywords: 'text'
        }, {
            name: 'email_fulltext_search_optimized',
            weights: {
                subject: 10,
                searchableContent: 8,
                bodyText: 5,
                keywords: 4,
                'extractedEntities.people': 3,
                'extractedEntities.organizations': 2
            },
            default_language: 'english',
            language_override: 'language'
        });
        console.log('✅ Created full-text search index');

        // 2. Create compound indexes for common query patterns
        const compoundIndexes = [
            // Primary sorting and filtering
            { createdAt: -1 },
            { status: 1, createdAt: -1 },
            { isRead: 1, createdAt: -1 },
            { category: 1, createdAt: -1 },
            { priority: 1, createdAt: -1 },
            { sentiment: 1, createdAt: -1 },
            { assignedUserId: 1, createdAt: -1 },

            // Multi-field compound indexes
            { assignedUserId: 1, status: 1, createdAt: -1 },
            { status: 1, priority: 1, createdAt: -1 },
            { category: 1, priority: 1, createdAt: -1 },
            { fromAddress: 1, createdAt: -1 },
            { toAddress: 1, createdAt: -1 },

            // Search-specific indexes
            { keywords: 1 },
            { 'extractedEntities.people': 1 },
            { 'extractedEntities.organizations': 1 },
            { 'extractedEntities.emails': 1 },
            { 'extractedEntities.phoneNumbers': 1 },

            // Confidence and sentiment analysis
            { confidence: 1, createdAt: -1 },
            { sentimentScore: 1, createdAt: -1 }
        ];

        for (const indexSpec of compoundIndexes) {
            try {
                await emailCollection.createIndex(indexSpec);
                console.log(`✅ Created index: ${JSON.stringify(indexSpec)}`);
            } catch (error) {
                if (error.code === 85) {
                    console.log(`⚠️ Index already exists: ${JSON.stringify(indexSpec)}`);
                } else {
                    console.error(`❌ Failed to create index ${JSON.stringify(indexSpec)}:`, error.message);
                }
            }
        }

        // 3. Create partial indexes for performance optimization
        const partialIndexes = [
            {
                spec: { status: 1, assignedUserId: 1, createdAt: -1 },
                options: {
                    name: 'active_emails_partial',
                    partialFilterExpression: {
                        status: { $in: ['NEW', 'REVIEWED', 'APPROVED'] }
                    }
                }
            },
            {
                spec: { isRead: 1, createdAt: -1 },
                options: {
                    name: 'unread_emails_partial',
                    partialFilterExpression: { isRead: false }
                }
            },
            {
                spec: { priority: 1, createdAt: -1 },
                options: {
                    name: 'high_priority_partial',
                    partialFilterExpression: {
                        priority: { $in: ['HIGH', 'URGENT'] }
                    }
                }
            }
        ];

        for (const { spec, options } of partialIndexes) {
            try {
                await emailCollection.createIndex(spec, options);
                console.log(`✅ Created partial index: ${options.name}`);
            } catch (error) {
                if (error.code === 85) {
                    console.log(`⚠️ Partial index already exists: ${options.name}`);
                } else {
                    console.error(`❌ Failed to create partial index ${options.name}:`, error.message);
                }
            }
        }

        // 4. Create sparse indexes for optional fields
        const sparseIndexes = [
            { threadId: 1 },
            { messageId: 1 },
            { inReplyTo: 1 },
            { processedAt: 1 },
            { sentAt: 1 },
            { readAt: 1 }
        ];

        for (const indexSpec of sparseIndexes) {
            try {
                await emailCollection.createIndex(indexSpec, { sparse: true });
                console.log(`✅ Created sparse index: ${JSON.stringify(indexSpec)}`);
            } catch (error) {
                if (error.code === 85) {
                    console.log(`⚠️ Sparse index already exists: ${JSON.stringify(indexSpec)}`);
                } else {
                    console.error(`❌ Failed to create sparse index ${JSON.stringify(indexSpec)}:`, error.message);
                }
            }
        }

        // 5. Analyze index usage and provide recommendations
        console.log('\n📈 Index Analysis Complete');
        const finalIndexes = await emailCollection.indexes();
        console.log(`Total indexes: ${finalIndexes.length}`);

        // Calculate total index size
        const stats = await emailCollection.stats();
        console.log(`Collection size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Total index size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Index ratio: ${((stats.totalIndexSize / stats.size) * 100).toFixed(2)}%`);

        // Provide optimization recommendations
        console.log('\n💡 Optimization Recommendations:');
        console.log('1. Monitor query performance using db.emails.explain()');
        console.log('2. Consider adding indexes for frequently filtered fields');
        console.log('3. Use projection to limit returned fields in queries');
        console.log('4. Implement query result caching for common searches');
        console.log('5. Regular index maintenance and statistics updates');

        console.log('\n🎉 Search index initialization completed successfully!');

    } catch (error) {
        console.error('❌ Error initializing search indexes:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
    }
}

/**
 * Update existing emails with search-optimized fields
 */
async function updateExistingEmails() {
    try {
        console.log('🔄 Updating existing emails with search optimization...');

        const batchSize = 100;
        let processed = 0;
        let hasMore = true;

        while (hasMore) {
            const emails = await Email.find({
                $or: [
                    { searchableContent: { $exists: false } },
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

            const bulkOps = emails.map(email => {
                // Create searchable content
                const searchParts = [
                    email.subject || '',
                    email.bodyText || '',
                    email.draftText || '',
                    email.fromAddress || '',
                    email.toAddress || ''
                ].filter(Boolean);

                const searchableContent = searchParts.join(' ').toLowerCase();

                // Extract keywords (simplified)
                const text = `${email.subject} ${email.bodyText}`.toLowerCase();
                const stopWords = new Set([
                    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
                    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
                ]);

                const keywords = text
                    .replace(/[^\w\s]/g, ' ')
                    .split(/\s+/)
                    .filter(word => word.length > 2 && !stopWords.has(word))
                    .slice(0, 20);

                // Extract basic entities
                const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
                const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
                const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;

                const extractedEntities = {
                    people: [...new Set((text.match(nameRegex) || []))].slice(0, 10),
                    organizations: [],
                    locations: [],
                    dates: [],
                    emails: [...new Set((text.match(emailRegex) || []).map(e => e.toLowerCase()))].slice(0, 10),
                    phoneNumbers: [...new Set(text.match(phoneRegex) || [])].slice(0, 5)
                };

                return {
                    updateOne: {
                        filter: { _id: email._id },
                        update: {
                            $set: {
                                searchableContent,
                                keywords: [...new Set(keywords)],
                                extractedEntities
                            }
                        }
                    }
                };
            });

            if (bulkOps.length > 0) {
                await Email.bulkWrite(bulkOps);
                processed += bulkOps.length;
                console.log(`✅ Updated ${processed} emails with search optimization`);
            }
        }

        console.log(`🎉 Successfully updated ${processed} emails`);

    } catch (error) {
        console.error('❌ Error updating existing emails:', error);
        throw error;
    }
}

/**
 * Validate search performance
 */
async function validateSearchPerformance() {
    try {
        console.log('🧪 Validating search performance...');

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

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`Query "${query}": ${results.length} results in ${duration}ms`);
        }

        console.log('✅ Search performance validation completed');

    } catch (error) {
        console.error('❌ Error validating search performance:', error);
        throw error;
    }
}

// Main execution
async function main() {
    try {
        await initializeSearchIndexes();
        await updateExistingEmails();
        await validateSearchPerformance();

        console.log('\n🚀 MongoDB text search optimization completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('💥 Fatal error during search optimization:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    initializeSearchIndexes,
    updateExistingEmails,
    validateSearchPerformance
};