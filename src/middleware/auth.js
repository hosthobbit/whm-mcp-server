/**
 * Authentication middleware for API endpoints
 * Validates the API key for all protected routes
 */

const logger = require('../utils/logger');

/**
 * Middleware to authenticate requests using API key
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
function authenticateRequest(req, res, next) {
  // Get API key from environment variables
  const configuredApiKey = process.env.API_KEY;
  
  // Check if API key is configured
  if (!configuredApiKey) {
    logger.error('API key not configured in environment variables');
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'API key not configured' 
    });
  }

  // Get API key from request (header or query parameter)
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  // Check if API key was provided in the request
  if (!apiKey) {
    logger.warn(`Unauthorized access attempt - missing API key from ${req.ip}`);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'API key is required' 
    });
  }

  // Validate API key
  if (apiKey !== configuredApiKey) {
    logger.warn(`Unauthorized access attempt - invalid API key from ${req.ip}`);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid API key' 
    });
  }

  // Authentication successful
  logger.info(`Authenticated request from ${req.ip}`);
  next();
}

module.exports = authenticateRequest;