/**
 * WHM Management Control Panel - Main Application Entry Point
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Set up middleware
app.use(cors());
app.use(express.json());

// Import logger
const logger = require('./utils/logger');

// Basic route for API status
app.get('/', (req, res) => {
  res.json({
    message: 'WHM Management Control Panel API',
    status: 'active',
    version: '1.0.0'
  });
});

// Start server
const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
  logger.info(`WHM API server running at http://localhost:${PORT}/`);
  logger.info(`For MCP functionality, use the mcp-server-compat.js file directly`);
});