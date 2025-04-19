const whmService = require('../services/whm.service');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Get all accounts
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getAccounts = async (req, res, next) => {
  try {
    const accounts = await whmService.listAccounts();
    res.json(accounts);
  } catch (error) {
    logger.error(`Error getting accounts: ${error.message}`);
    next(error);
  }
};

/**
 * Get account by username
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getAccount = async (req, res, next) => {
  try {
    const { username } = req.params;
    const account = await whmService.getAccountSummary(username);
    res.json(account);
  } catch (error) {
    logger.error(`Error getting account ${req.params.username}: ${error.message}`);
    next(error);
  }
};

/**
 * Create a new account
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.createAccount = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const accountData = req.body;
    const result = await whmService.createAccount(accountData);
    
    if (result.metadata && result.metadata.result === 0) {
      return res.status(400).json({ 
        error: result.metadata.reason || 'Account creation failed'
      });
    }
    
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Error creating account: ${error.message}`);
    next(error);
  }
};

/**
 * Suspend an account
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.suspendAccount = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { reason } = req.body;
    
    const result = await whmService.suspendAccount(username, reason);
    res.json(result);
  } catch (error) {
    logger.error(`Error suspending account ${req.params.username}: ${error.message}`);
    next(error);
  }
};

/**
 * Unsuspend an account
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.unsuspendAccount = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    const result = await whmService.unsuspendAccount(username);
    res.json(result);
  } catch (error) {
    logger.error(`Error unsuspending account ${req.params.username}: ${error.message}`);
    next(error);
  }
};

/**
 * Terminate an account
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.terminateAccount = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    const result = await whmService.terminateAccount(username);
    res.json(result);
  } catch (error) {
    logger.error(`Error terminating account ${req.params.username}: ${error.message}`);
    next(error);
  }
};

/**
 * Change account package
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.changePackage = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { package: pkg } = req.body;
    
    if (!pkg) {
      return res.status(400).json({ error: 'Package name is required' });
    }
    
    const result = await whmService.changeAccountPackage(username, pkg);
    res.json(result);
  } catch (error) {
    logger.error(`Error changing package for account ${req.params.username}: ${error.message}`);
    next(error);
  }
};