/**
 * Example route showing how to use authentication middleware
 */

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const logger = require('../utils/logger');

// Public route - no authentication required
router.get('/public', (req, res) => {
  logger.info('Public endpoint accessed');
  res.json({ message: 'This is a public endpoint' });
});

// Protected route - requires authentication
router.get('/protected', authenticate, (req, res) => {
  logger.info('Protected endpoint accessed successfully');
  res.json({ message: 'You have access to this protected endpoint' });
});

// Another protected route with route-specific logic
router.post('/data', authenticate, (req, res) => {
  const { data } = req.body;
  
  if (!data) {
    logger.warn('Missing data in request');
    return res.status(400).json({ error: 'Data is required' });
  }
  
  // Process the data (example)
  logger.info('Processing data from authenticated request');
  
  // Return success response
  res.status(201).json({ 
    message: 'Data received successfully',
    status: 'processed'
  });
});

module.exports = router;