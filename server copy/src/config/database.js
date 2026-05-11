const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info(' MongoDB connected successfully');
    } catch (error) {
        logger.error(' MongoDB connection error:', error);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    logger.info(' MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    logger.info(' MongoDB reconnected');
});

module.exports = { connectDB, mongoose };
