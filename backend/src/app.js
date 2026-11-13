const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const { setupSwagger } = require('./swagger/swagger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false // Allows inline scripts & styles for Swagger & frontend demo
  })
);
app.use(cors({ origin: '*', credentials: true }));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('short'));
}

// Rate Limiter
app.use('/api/', apiLimiter);

// Swagger Documentation
setupSwagger(app);

// Serve Static Frontend if desired (also allows opening via backend directly)
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/v1', routes);

// Fallback to frontend index.html for direct navigation if not an API route
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
