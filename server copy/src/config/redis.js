const {
    REDIS_URL,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_USERNAME,
    REDIS_PASSWORD,
    REDIS_DB,
} = require('./env');

function parseRedisConnection() {
    const parsedUrl = new URL(REDIS_URL);
    const connection = {
        host: REDIS_HOST || parsedUrl.hostname || '127.0.0.1',
        port: Number(REDIS_PORT || parsedUrl.port || 6379),
        retryStrategy: (times) => Math.min(times * 50, 2000),
    };

    const username = REDIS_USERNAME || decodeURIComponent(parsedUrl.username || '');
    const password = REDIS_PASSWORD || decodeURIComponent(parsedUrl.password || '');
    const dbSegment = parsedUrl.pathname.replace('/', '');
    const db = REDIS_DB || dbSegment;

    if (username) {
        connection.username = username;
    }

    if (password) {
        connection.password = password;
    }

    if (db !== '') {
        connection.db = Number(db);
    }

    if (parsedUrl.protocol === 'rediss:') {
        connection.tls = {};
    }

    return connection;
}

module.exports = {
    connection: parseRedisConnection(),
};
