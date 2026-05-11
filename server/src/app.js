const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { NODE_ENV, UPLOAD_DIR, LOG_DIR, CLIENT_ORIGINS } = require('./config/env');
const { connectDB } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler.middleware');
const { apiRateLimiter, heavyOperationRateLimiter } = require('./middleware/rateLimit.middleware');
const routes = require('./routes');
const logger = require('./utils/logger');

class App {
    constructor() {
        this.app = express();
        this.setupMiddlewares();
        this.setupRoutes();
        this.setupErrorHandling();
        this.ensureUploadsDirectory();
    }

    setupMiddlewares() {
        this.app.set('trust proxy', 1);

        this.app.use(helmet());

        const devOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3001'
        ];

        const allowedOrigins = NODE_ENV === 'production'
            ? CLIENT_ORIGINS
            : devOrigins;

        this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (allowedOrigins.includes(origin)) return callback(null, true);
                return callback(new Error(`CORS blocked for origin: ${origin}`));
            },
            credentials: true
        }));

        if (NODE_ENV === 'production') {
            if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
            this.app.use(morgan('combined', {
                stream: fs.createWriteStream(path.join(LOG_DIR, 'access.log'), { flags: 'a' })
            }));
        } else {
            this.app.use(morgan('dev'));
        }

        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use('/uploads', express.static(UPLOAD_DIR));

        this.app.use('/api', apiRateLimiter);
        this.app.use('/api/email/sync', heavyOperationRateLimiter);
        this.app.use('/api/email/accounts', heavyOperationRateLimiter);
    }

    setupRoutes() {
        this.app.use('/api', routes);

        this.app.use('*', (req, res) => {
            res.status(404).json({ success: false, message: 'Endpoint not found' });
        });
    }

    setupErrorHandling() {
        this.app.use(errorHandler);
    }

    ensureUploadsDirectory() {
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }
    }

    async initialize() {
        await connectDB();
        require('./queues');
        logger.info('Application initialized');
    }

    getApp() {
        return this.app;
    }
}

module.exports = App;
