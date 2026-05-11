const socketIO = require('socket.io');
const logger = require('../utils/logger');

class SocketService {
    constructor(server) {
        this.io = socketIO(server, {
            cors: {
                origin: process.env.NODE_ENV === 'production'
                    ? process.env.CLIENT_URL
                    : 'http://localhost:3000',
                methods: ['GET', 'POST']
            }
        });

        this.setupConnectionHandlers();
        logger.info(' Socket.IO server initialized');
    }

    setupConnectionHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`New socket connection: ${socket.id}`);

            // Join room based on user role/email
            socket.on('join:email', (emailId) => {
                socket.join(`email:${emailId}`);
                logger.info(`Socket ${socket.id} joined email:${emailId}`);
            });

            socket.on('leave:email', (emailId) => {
                socket.leave(`email:${emailId}`);
                logger.info(`Socket ${socket.id} left email:${emailId}`);
            });

            socket.on('join:dashboard', () => {
                socket.join('dashboard');
                logger.info(`Socket ${socket.id} joined dashboard`);
            });

            socket.on('leave:dashboard', () => {
                socket.leave('dashboard');
                logger.info(`Socket ${socket.id} left dashboard`);
            });

            socket.on('disconnect', () => {
                logger.info(`Socket disconnected: ${socket.id}`);
            });
        });
    }

    emitEmailUpdate(emailId, data) {
        this.io.to(`email:${emailId}`).emit('email:updated', data);
        logger.debug(`Emitted email:updated to email:${emailId}`);
    }

    emitDashboardMetrics(metrics) {
        this.io.to('dashboard').emit('dashboard:metrics', metrics);
        logger.debug('Emitted dashboard:metrics');
    }

    emitQueueStatus(status) {
        this.io.to('dashboard').emit('queue:status', status);
        logger.debug('Emitted queue:status');
    }

    getIO() {
        return this.io;
    }
}

module.exports = SocketService;
