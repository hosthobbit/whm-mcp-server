/**
 * Authentication middleware
 * Validates API key for all protected routes
 */

const logger = require('../utils/logger');

/**
 * Middleware to authenticate API requests
 * Validates that the API key in the request header matches the configured key
 */
function authenticateRequest(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const configuredApiKey = process.env.API_KEY;
  
  if (!configuredApiKey) {
    logger.error('API_KEY not configured in environment variables');
    return res.status(500).json({ error: 'Server authentication not configured' });
  }
  
  if (!apiKey) {
    logger.warn(`Unauthorized request from ${req.ip} - No API key provided`);
    return res.status(401).json({ error: 'API key is required' });
  }
  
  if (apiKey !== configuredApiKey) {
    logger.warn(`Unauthorized request from ${req.ip} - Invalid API key`);
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  // Authentication successful
  logger.debug(`Authenticated request from ${req.ip}`);
  next();
}

module.exports = authenticateRequest;