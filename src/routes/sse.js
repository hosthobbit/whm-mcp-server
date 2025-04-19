/**
 * SSE (Server-Sent Events) route for real-time communication
 */

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const logger = require('../utils/logger');

// SSE endpoint
router.get('/events', (req, res) => {
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
  
  // Keep the connection alive with a ping every 30 seconds
  const pingInterval = setInterval(() => {
    sendEvent({ type: 'ping', timestamp: new Date().toISOString() });
  }, 30000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(pingInterval);
    logger.info(`SSE connection closed from ${req.ip}`);
  });
});

// Protected SSE endpoint - requires authentication
router.get('/secure-events', authenticate, (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connection', message: 'Connected to secure SSE stream' })}\n\n`);
  
  logger.info(`Secure SSE connection established from ${req.ip}`);
  
  // Function to send events
  const sendEvent = (eventData) => {
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  };
  
  // Keep the connection alive with a ping every 30 seconds
  const pingInterval = setInterval(() => {
    sendEvent({ type: 'ping', timestamp: new Date().toISOString() });
  }, 30000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(pingInterval);
    logger.info(`Secure SSE connection closed from ${req.ip}`);
  });
});

module.exports = router;