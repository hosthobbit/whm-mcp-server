const whmService = require('../services/whm.service');
const logger = require('../utils/logger');

/**
 * Get server status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getServerStatus = async (req, res, next) => {
  try {
    const status = await whmService.getServerStatus();
    res.json(status);
  } catch (error) {
    logger.error(`Error getting server status: ${error.message}`);
    next(error);
  }
};

/**
 * Get server load
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getServerLoad = async (req, res, next) => {
  try {
    const load = await whmService.getServerLoad();
    res.json(load);
  } catch (error) {
    logger.error(`Error getting server load: ${error.message}`);
    next(error);
  }
};

/**
 * Get service status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getServiceStatus = async (req, res, next) => {
  try {
    const services = await whmService.getServiceStatus();
    res.json(services);
  } catch (error) {
    logger.error(`Error getting service status: ${error.message}`);
    next(error);
  }
};

/**
 * Restart a service
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.restartService = async (req, res, next) => {
  try {
    const { service } = req.params;
    
    if (!service) {
      return res.status(400).json({ error: 'Service name is required' });
    }
    
    const result = await whmService.restartService(service);
    res.json(result);
  } catch (error) {
    logger.error(`Error restarting service ${req.params.service}: ${error.message}`);
    next(error);
  }
};

/**
 * Check for updates
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.checkForUpdates = async (req, res, next) => {
  try {
    const updates = await whmService.checkForUpdates();
    res.json(updates);
  } catch (error) {
    logger.error(`Error checking for updates: ${error.message}`);
    next(error);
  }
};

/**
 * Start server update
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.startUpdate = async (req, res, next) => {
  try {
    const result = await whmService.startUpdate();
    res.json(result);
  } catch (error) {
    logger.error(`Error starting update: ${error.message}`);
    next(error);
  }
};