/**
 * WHM/cPanel Management API Server
 * Main server file
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const logger = require('./utils/logger');
const authenticateRequest = require('./middleware/auth');
const responseTime = require('./middleware/responseTime');
const { setupRoutes } = require('./routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply security middleware
app.use(helmet());
app.use(express.json());

// Configure CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Add request logging and timing
app.use(responseTime);

// Configure rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW 
    ? parseDuration(process.env.RATE_LIMIT_WINDOW) 
    : 15 * 60 * 1000, // Default: 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Auth middleware for all API routes
app.use('/api', authenticateRequest);

// Set up API routes
setupRoutes(app);

// Error handling
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`WHM Management API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Helper function to parse duration strings (1h, 15m, etc.)
function parseDuration(durationStr) {
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  
  const match = durationStr.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // Default to 15 minutes
  
  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

module.exports = app;