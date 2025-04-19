const express = require('express');
const router = express.Router();
const path = require('path');

/**
 * @route GET /docs
 * @desc API Documentation
 * @access Public
 */
router.get('/', (req, res) => {
  res.json({
    title: 'WHM Management Control Panel API Documentation',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      accounts: {
        get: {
          url: '/accounts',
          description: 'Get all accounts',
          auth: 'API Key required in X-API-KEY header'
        },
        getById: {
          url: '/accounts/:username',
          description: 'Get account by username',
          auth: 'API Key required in X-API-KEY header'
        },
        create: {
          url: '/accounts',
          method: 'POST',
          description: 'Create a new account',
          auth: 'API Key required in X-API-KEY header',
          body: {
            username: 'Username for the account',
            domain: 'Domain for the account',
            password: 'Password for the account (min 8 characters)',
            pkgname: 'Package name for the account'
          }
        },
        suspend: {
          url: '/accounts/:username/suspend',
          method: 'POST',
          description: 'Suspend an account',
          auth: 'API Key required in X-API-KEY header',
          body: {
            reason: 'Reason for suspension'
          }
        },
        unsuspend: {
          url: '/accounts/:username/unsuspend',
          method: 'POST',
          description: 'Unsuspend an account',
          auth: 'API Key required in X-API-KEY header'
        },
        terminate: {
          url: '/accounts/:username',
          method: 'DELETE',
          description: 'Terminate an account',
          auth: 'API Key required in X-API-KEY header'
        },
        changePackage: {
          url: '/accounts/:username/package',
          method: 'PUT',
          description: 'Change account package',
          auth: 'API Key required in X-API-KEY header',
          body: {
            package: 'New package name'
          }
        }
      },
      server: {
        status: {
          url: '/server/status',
          description: 'Get server status',
          auth: 'API Key required in X-API-KEY header'
        },
        load: {
          url: '/server/load',
          description: 'Get server load',
          auth: 'API Key required in X-API-KEY header'
        },
        services: {
          url: '/server/services',
          description: 'Get service status',
          auth: 'API Key required in X-API-KEY header'
        },
        restartService: {
          url: '/server/services/:service/restart',
          method: 'POST',
          description: 'Restart a service',
          auth: 'API Key required in X-API-KEY header'
        },
        updates: {
          url: '/server/updates',
          description: 'Check for updates',
          auth: 'API Key required in X-API-KEY header'
        },
        startUpdate: {
          url: '/server/updates',
          method: 'POST',
          description: 'Start server update',
          auth: 'API Key required in X-API-KEY header'
        }
      },
      domains: {
        list: {
          url: '/domains/:username',
          description: 'List domains for an account',
          auth: 'API Key required in X-API-KEY header'
        },
        add: {
          url: '/domains/:username',
          method: 'POST',
          description: 'Add a domain to an account',
          auth: 'API Key required in X-API-KEY header',
          body: {
            domain: 'Domain name to add'
          }
        },
        delete: {
          url: '/domains/:username/:domain',
          method: 'DELETE',
          description: 'Delete a domain from an account',
          auth: 'API Key required in X-API-KEY header'
        }
      }
    }
  });
});

module.exports = router;