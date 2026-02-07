// src/server.js
const http = require('http');
const { PORT, NODE_ENV } = require('./config/env');
const App = require('./app');
const SocketService = require('./sockets');
const logger = require('./utils/logger');
const syncService = require('./services/sync.service');
syncService.startAutoSync().catch(console.error);

async function startServer() {
    try {
        const appInstance = new App();
        const app = appInstance.getApp();

        await appInstance.initialize();

        const server = http.createServer(app);

        const socketService = new SocketService(server);
        global.socketService = socketService;

        server.listen(PORT, () => {
            logger.info(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
            logger.info(`📧 ProcessMail Backend Ready`);
            logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
        });

        process.on('SIGTERM', () => gracefulShutdown(server));
        process.on('SIGINT', () => gracefulShutdown(server));

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

function gracefulShutdown(server) {
    logger.info('Received shutdown signal, closing server...');

    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });

    setTimeout(() => {
        logger.error('Force shutdown after timeout');
        process.exit(1);
    }, 10000);
}

startServer();