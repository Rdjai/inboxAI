const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { NODE_ENV, UPLOAD_DIR } = require('./config/env');
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
            ? (process.env.CLIENT_URL || '').split(',').map(v => v.trim()).filter(Boolean)
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
            const logDir = path.join(__dirname, '../logs');
            if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
            this.app.use(morgan('combined', {
                stream: fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' })
            }));
        } else {
            this.app.use(morgan('dev'));
        }

        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
        const uploadPath = UPLOAD_DIR || path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
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
