const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'mysql';

let sequelize;

if (dialect === 'sqlite') {
  const storage = process.env.DB_STORAGE || './database/college_socket.sqlite';
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: process.env.DB_LOGGING === 'true' ? (msg) => logger.debug(msg) : false
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'college_socket_db',
    process.env.DB_USER || 'college_user',
    process.env.DB_PASSWORD || 'college_pass123',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      dialect: 'mysql',
      logging: process.env.DB_LOGGING === 'true' ? (msg) => logger.debug(msg) : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        underscored: true,
        timestamps: true,
        freezeTableName: true
      }
    }
  );
}

const connectWithRetry = async (maxRetries = 10, delayMs = 3000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      attempt++;
      await sequelize.authenticate();
      logger.info(`Database connected successfully (${dialect.toUpperCase()}).`);
      return sequelize;
    } catch (error) {
      logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt >= maxRetries) {
        logger.error(`Could not connect to database after ${maxRetries} attempts.`);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

module.exports = {
  sequelize,
  connectWithRetry
};
