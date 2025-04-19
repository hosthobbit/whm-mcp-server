const logger = require('../utils/logger');

/**
 * Authentication middleware for API routes
 * This is a simple API key authentication middleware
 * In a production environment, this should be replaced with a more robust solution
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const authenticate = (req, res, next) => {
  // Get API key from request header
  const apiKey = req.header('X-API-KEY');
  
  // Check if API key is present
  if (!apiKey) {
    logger.warn('Authentication failed: Missing API key');
    return res.status(401).json({ 
      error: 'Authentication failed', 
      message: 'API key is required' 
    });
  }
  
  // In a real implementation, you would validate the API key against a database
  // For now, we'll use a simple environment variable value
  if (apiKey !== process.env.API_KEY) {
    logger.warn('Authentication failed: Invalid API key');
    return res.status(401).json({ 
      error: 'Authentication failed', 
      message: 'Invalid API key' 
    });
  }
  
  // If authentication succeeds, proceed to the next middleware
  next();
};

module.exports = { authenticate };