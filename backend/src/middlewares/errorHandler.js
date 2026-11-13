const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.url} - Error: ${err.message}`, err.stack);

  // Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errorMessages = err.errors.map((e) => ({
      field: e.path,
      message: e.message
    }));
    return ApiResponse.badRequest(res, 'Validation error', errorMessages);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token has expired');
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return ApiResponse.error(res, message, statusCode);
};

const notFoundHandler = (req, res) => {
  return ApiResponse.notFound(res, `Route not found: ${req.method} ${req.originalUrl}`);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
