const http = require('http');
const app = require('./app');
const { connectWithRetry, sequelize } = require('./config/database');
const { initSocketServer } = require('./sockets/socketServer');
const logger = require('./utils/logger');
const seedDatabase = require('../database/seed');
require('dotenv').config();

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(httpServer);

const startServer = async () => {
  try {
    logger.info('Initializing College Real-Time Socket Server...');

    // 1. Database Connection
    await connectWithRetry();

    // 2. Database Sync & Seeding (if enabled)
    if (process.env.AUTO_SEED === 'true' || process.env.NODE_ENV === 'development') {
      try {
        await seedDatabase();
      } catch (seedErr) {
        logger.warn('Seed operation encountered an issue (tables may already be seeded):', seedErr.message);
      }
    }

    // 3. Start Listening
    httpServer.listen(PORT, HOST, () => {
      logger.info(`=======================================================`);
      logger.info(`  College Real-Time Socket System is RUNNING!`);
      logger.info(`  Backend Server:   http://${HOST}:${PORT}`);
      logger.info(`  Swagger API Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`  Socket.IO:        ws://localhost:${PORT}`);
      logger.info(`=======================================================`);
    });
  } catch (error) {
    logger.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  httpServer.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await sequelize.close();
      logger.info('Database connection closed.');
    } catch (err) {
      logger.error('Error closing database:', err);
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

module.exports = { app, httpServer, io, startServer };
