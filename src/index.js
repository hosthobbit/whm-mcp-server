/**
 * Server entry point with enhanced logging
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

// Enhanced request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  logger.info(`${req.method} ${req.url}`);
  
  // Log request details
  if (Object.keys(req.query).length) {
    logger.info(`Query params: ${JSON.stringify(req.query)}`);
  }
  
  // Log request headers
  logger.info(`Headers: ${JSON.stringify(req.headers)}`);
  
  // Override end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    logger.info(`Response sent - Status: ${res.statusCode}, Duration: ${duration}ms`);
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['Content-Type', 'Authorization']
})); 
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

// Register routes
app.use('/api/examples', exampleRoutes);

// SSE endpoint
app.get('/api/sse/events', (req, res) => {
  logger.info('SSE connection request received');
  
  try {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connection', message: 'Connected to SSE stream' })}\n\n`);
    
    logger.info(`SSE connection established from ${req.ip}`);
    
    // Function to send events
    const sendEvent = (eventData) => {
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    };
    
    // Keep the connection alive with a ping every 10 seconds
    const pingInterval = setInterval(() => {
      logger.info('Sending SSE ping');
      sendEvent({ type: 'ping', timestamp: new Date().toISOString() });
    }, 10000);
    
    // Handle client disconnect
    req.on('close', () => {
      clearInterval(pingInterval);
      logger.info(`SSE connection closed from ${req.ip}`);
    });
  } catch (error) {
    logger.error(`SSE connection error: ${error.message}`);
    res.status(500).end();
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'WHM MCP Server API',
    version: process.env.npm_package_version || '1.0.0',
    status: 'running',
    endpoints: {
      sse: '/api/sse/events',
      examples: '/api/examples'
    }
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
  logger.error(err.stack);
  
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`SSE endpoint available at: http://localhost:${PORT}/api/sse/events`);
});

module.exports = app;