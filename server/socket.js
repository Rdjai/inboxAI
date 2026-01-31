const socketIo = require('socket.io');

let io;

const init = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('🔌 New client connected:', socket.id);

        // Join user to their room for private updates
        socket.on('join', (userId) => {
            socket.join(`user:${userId}`);
            console.log(`User ${userId} joined their room`);
        });

        // Join email room for specific email updates
        socket.on('join-email', (emailId) => {
            socket.join(`email:${emailId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

// Helper functions to emit events
const emitEmailUpdate = (emailId, data) => {
    if (io) {
        io.to(`email:${emailId}`).emit('email-updated', data);
    }
};

const emitUserNotification = (userId, notification) => {
    if (io) {
        io.to(`user:${userId}`).emit('notification', notification);
    }
};

const emitDashboardUpdate = (data) => {
    if (io) {
        io.emit('dashboard-update', data);
    }
};

module.exports = {
    init,
    emitEmailUpdate,
    emitUserNotification,
    emitDashboardUpdate
};