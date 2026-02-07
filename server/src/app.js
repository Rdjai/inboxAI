// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { NODE_ENV, UPLOAD_DIR } = require('./config/env');
const { connectDB } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler.middleware');
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
        // Security headers
        this.app.use(helmet());

        // CORS
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
                // Allow non-browser requests (e.g. curl, Postman)
                if (!origin) return callback(null, true);
                if (allowedOrigins.includes(origin)) return callback(null, true);
                return callback(new Error(`CORS blocked for origin: ${origin}`));
            },
            credentials: true
        }));

        // Logging
        if (NODE_ENV === 'production') {
            this.app.use(morgan('combined', {
                stream: fs.createWriteStream(
                    path.join(__dirname, '../logs/access.log'),
                    { flags: 'a' }
                )
            }));
        } else {
            this.app.use(morgan('dev'));
        }

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Static files
        this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    }

    setupRoutes() {
        // API Routes
        this.app.use('/api', routes);

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint not found'
            });
        });
    }

    setupErrorHandling() {
        this.app.use(errorHandler);
    }

    ensureUploadsDirectory() {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            logger.info(`Created uploads directory: ${uploadPath}`);
        }
    }

    async initialize() {
        try {
            // Connect to database
            await connectDB();

            // Initialize queues (they auto-start)
            require('./queues');

            logger.info('✅ Application initialized successfully');
        } catch (error) {
            logger.error('❌ Application initialization failed:', error);
            process.exit(1);
        }
    }

    getApp() {
        return this.app;
    }
}

module.exports = App;
