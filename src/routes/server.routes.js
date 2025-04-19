const express = require('express');
const serverController = require('../controllers/server.controller');
const router = express.Router();

/**
 * @route GET /api/server/status
 * @desc Get server status
 * @access Private
 */
router.get('/status', serverController.getServerStatus);

/**
 * @route GET /api/server/load
 * @desc Get server load
 * @access Private
 */
router.get('/load', serverController.getServerLoad);

/**
 * @route GET /api/server/services
 * @desc Get service status
 * @access Private
 */
router.get('/services', serverController.getServiceStatus);

/**
 * @route POST /api/server/services/:service/restart
 * @desc Restart a service
 * @access Private
 */
router.post('/services/:service/restart', serverController.restartService);

/**
 * @route GET /api/server/updates
 * @desc Check for updates
 * @access Private
 */
router.get('/updates', serverController.checkForUpdates);

/**
 * @route POST /api/server/updates
 * @desc Start server update
 * @access Private
 */
router.post('/updates', serverController.startUpdate);

module.exports = router;