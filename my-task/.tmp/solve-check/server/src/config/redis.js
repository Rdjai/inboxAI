// src/config/redis.js
const { REDIS_URL } = require('./env');

module.exports = {
    connection: {
        url: REDIS_URL,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    }
};