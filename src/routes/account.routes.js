const express = require('express');
const { body } = require('express-validator');
const accountController = require('../controllers/account.controller');
const router = express.Router();

/**
 * @route GET /api/accounts
 * @desc Get all accounts
 * @access Private
 */
router.get('/', accountController.getAccounts);

/**
 * @route GET /api/accounts/:username
 * @desc Get account by username
 * @access Private
 */
router.get('/:username', accountController.getAccount);

/**
 * @route POST /api/accounts
 * @desc Create a new account
 * @access Private
 */
router.post(
  '/',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('domain').notEmpty().withMessage('Domain is required'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('pkgname').notEmpty().withMessage('Package name is required')
  ],
  accountController.createAccount
);

/**
 * @route POST /api/accounts/:username/suspend
 * @desc Suspend an account
 * @access Private
 */
router.post(
  '/:username/suspend',
  [
    body('reason').notEmpty().withMessage('Suspension reason is required')
  ],
  accountController.suspendAccount
);

/**
 * @route POST /api/accounts/:username/unsuspend
 * @desc Unsuspend an account
 * @access Private
 */
router.post('/:username/unsuspend', accountController.unsuspendAccount);

/**
 * @route DELETE /api/accounts/:username
 * @desc Terminate an account
 * @access Private
 */
router.delete('/:username', accountController.terminateAccount);

/**
 * @route PUT /api/accounts/:username/package
 * @desc Change account package
 * @access Private
 */
router.put(
  '/:username/package',
  [
    body('package').notEmpty().withMessage('Package name is required')
  ],
  accountController.changePackage
);

module.exports = router;