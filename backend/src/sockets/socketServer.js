const { Server } = require('socket.io');
const socketAuth = require('./socketAuth');
const { registerSocketEvents } = require('./socketEvents');
const logger = require('../utils/logger');

let io = null;

const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow connections from frontend
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  // Apply JWT authentication middleware
  io.use(socketAuth);

  // Connection handler
  io.on('connection', (socket) => {
    registerSocketEvents(io, socket);
  });

  logger.info('Socket.IO Server initialized with JWT authentication.');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Please call initSocketServer first.');
  }
  return io;
};

const emitToUser = (userId, event, payload) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, payload);
  }
};

const broadcastToRoom = (roomName, event, payload) => {
  if (io) {
    io.to(roomName).emit(event, payload);
  }
};

module.exports = {
  initSocketServer,
  getIO,
  emitToUser,
  broadcastToRoom
};
