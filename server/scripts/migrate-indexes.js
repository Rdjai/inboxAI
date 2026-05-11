/**
 * Ensures MongoDB indexes are in sync with the current schema definitions.
 * Safe to run multiple times — createIndex is idempotent.
 *
 * Usage: node scripts/migrate-indexes.js
 */
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/database');
const logger = require('../src/utils/logger');

const Email = require('../src/models/email.model');
const User = require('../src/models/user.model');
const EmailAccount = require('../src/models/emailAccount.model');

async function run() {
    await connectDB();

    logger.info('Syncing indexes...');

    await Email.syncIndexes();
    await User.syncIndexes();
    await EmailAccount.syncIndexes();

    logger.info('Index sync complete');
    await mongoose.disconnect();
}

run().catch((err) => {
    logger.error('Migration failed:', err);
    process.exit(1);
});
