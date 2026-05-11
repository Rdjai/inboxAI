const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { LOG_DIR, NODE_ENV } = require('../config/env');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const transports = [
    new winston.transports.Console({
        format: NODE_ENV === 'production'
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
    }),
    new winston.transports.File({
        filename: path.join(LOG_DIR, 'error.log'),
        level: 'error'
    }),
    new winston.transports.File({
        filename: path.join(LOG_DIR, 'combined.log')
    }),
];

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports,
});

module.exports = logger;
