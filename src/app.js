/**
 * Main application file
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  logger.info('Created logs directory');
}

// Routes
const exampleRoutes = require('./routes/example');
const sseRoutes = require('./routes/sse');

// Register routes
app.use('/api/examples', exampleRoutes);
app.use('/api/sse', sseRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'WHM MCP Server API',
    version: process.env.npm_package_version || '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Not Found',
    message: `The requested resource was not found: ${req.originalUrl}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  logger.error(`Error ${statusCode}: ${err.message}`);
  
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;