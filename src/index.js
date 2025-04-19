const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const winston = require('winston');
const path = require('path');
const { authenticate } = require('./middleware/auth.middleware');

// Load environment variables
dotenv.config();

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Import routes
const accountRoutes = require('./routes/account.routes');
const serverRoutes = require('./routes/server.routes');
const domainRoutes = require('./routes/domain.routes');
const sslRoutes = require('./routes/ssl.routes');
const backupRoutes = require('./routes/backup.routes');
const emailRoutes = require('./routes/email.routes');
const docsRoutes = require('./routes/docs.routes');

// Basic route for API status
app.get('/', (req, res) => {
  res.json({
    message: 'WHM Management Control Panel API',
    status: 'active',
    version: '1.0.0',
    docs: '/docs'
  });
});

// Documentation route (public)
app.use('/docs', docsRoutes);

// API routes with authentication middleware
app.use('/api/accounts', authenticate, accountRoutes);
app.use('/api/server', authenticate, serverRoutes);
app.use('/api/domains', authenticate, domainRoutes);
app.use('/api/ssl', authenticate, sslRoutes);
app.use('/api/backups', authenticate, backupRoutes);
app.use('/api/email', authenticate, emailRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Start server
const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;