// WHM Administration Tools for MCP Integration
const axios = require('axios');
const { createLogger, format, transports } = require('winston');

// Configure logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'whm-admin.log' })
  ]
});

// WHM API Configuration
const WHM_API_CONFIG = {
  baseUrl: process.env.WHM_API_URL || 'https://server.example.com:2087/json-api/',
  username: process.env.WHM_API_USERNAME,
  token: process.env.WHM_API_TOKEN,
  mockMode: process.env.MOCK_MODE === 'true' || false
};

// Mock data for testing without a real WHM server
const mockData = {
  accounts: [
    { domain: 'example1.com', username: 'example1', diskused: '1024MB', disklimit: '5000MB', plan: 'basic' },
    { domain: 'example2.com', username: 'example2', diskused: '2048MB', disklimit: '10000MB', plan: 'premium' }
  ],
  domains: [
    { domain: 'example1.com', docroot: '/home/example1/public_html', ip: '192.168.1.1', status: 'active' },
    { domain: 'example2.com', docroot: '/home/example2/public_html', ip: '192.168.1.2', status: 'active' }
  ],
  backups: [
    { id: 'backup1', account: 'example1', date: '2023-04-01', size: '950MB', status: 'completed' },
    { id: 'backup2', account: 'example2', date: '2023-04-02', size: '1.8GB', status: 'completed' }
  ]
};

// Helper function for WHM API requests
async function whmApiRequest(endpoint, params = {}) {
  // Return mock data if mock mode is enabled
  if (WHM_API_CONFIG.mockMode) {
    logger.info(`MOCK MODE: Simulating request to ${endpoint}`);
    
    switch (endpoint) {
      case 'listaccts':
        return { data: { acct: mockData.accounts } };
      case 'domainuserdata':
        return { data: { userdata: mockData.domains.find(d => d.domain === params.domain) || {} } };
      case 'listbackups':
        return { data: { backups: mockData.backups } };
      default:
        return { data: { status: 'success', message: 'Mock operation completed' } };
    }
  }
  
  // Check for API credentials
  if (!WHM_API_CONFIG.username || !WHM_API_CONFIG.token) {
    throw new Error('WHM API credentials not configured');
  }
  
  try {
    const response = await axios({
      method: 'GET',
      url: `${WHM_API_CONFIG.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `WHM ${WHM_API_CONFIG.username}:${WHM_API_CONFIG.token}`
      },
      params: params
    });
    
    return response;
  } catch (error) {
    logger.error(`WHM API request failed: ${error.message}`);
    throw new Error(`WHM API request failed: ${error.message}`);
  }
}

// Define MCP tools for WHM administration
const whmTools = [
  {
    name: "whm_list_accounts",
    description: "List all cPanel accounts on the server",
    parameters: {
      type: "object",
      properties: {
        searchType: {
          type: "string",
          description: "Type of search to perform (domain, owner, user, ip)"
        },
        search: {
          type: "string",
          description: "Search term"
        }
      }
    },
    function: async (params) => {
      logger.info('Executing whm_list_accounts');
      try {
        const response = await whmApiRequest('listaccts', params);
        return {
          accounts: response.data.acct || []
        };
      } catch (error) {
        logger.error(`Error listing accounts: ${error.message}`);
        throw error;
      }
    }
  },
  
  {
    name: "whm_account_info",
    description: "Get detailed information about a specific cPanel account",
    parameters: {
      type: "object",
      properties: {
        user: {
          type: "string",
          description: "The cPanel username"
        }
      },
      required: ["user"]
    },
    function: async (params) => {
      logger.info(`Executing whm_account_info for user: ${params.user}`);
      try {
        const response = await whmApiRequest('accountsummary', { user: params.user });
        return {
          accountInfo: response.data.acct[0] || {}
        };
      } catch (error) {
        logger.error(`Error fetching account info: ${error.message}`);
        throw error;
      }
    }
  },
  
  {
    name: "whm_domain_info",
    description: "Get information about a specific domain",
    parameters: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "The domain name"
        }
      },
      required: ["domain"]
    },
    function: async (params) => {
      logger.info(`Executing whm_domain_info for domain: ${params.domain}`);
      try {
        const response = await whmApiRequest('domainuserdata', { domain: params.domain });
        return {
          domainInfo: response.data.userdata || {}
        };
      } catch (error) {
        logger.error(`Error fetching domain info: ${error.message}`);
        throw error;
      }
    }
  },
  
  {
    name: "whm_create_account",
    description: "Create a new cPanel account",
    parameters: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "The new account username"
        },
        domain: {
          type: "string",
          description: "The primary domain for the account"
        },
        password: {
          type: "string",
          description: "The account password"
        },
        plan: {
          type: "string",
          description: "The hosting plan to use"
        },
        contactemail: {
          type: "string",
          description: "Contact email for the account"
        }
      },
      required: ["username", "domain", "password"]
    },
    function: async (params) => {
      logger.info(`Executing whm_create_account for domain: ${params.domain}`);
      try {
        const response = await whmApiRequest('createacct', params);
        return {
          status: response.data.status,
          message: response.data.statusmsg,
          account: response.data.options || {}
        };
      } catch (error) {
        logger.error(`Error creating account: ${error.message}`);
        throw error;
      }
    }
  },
  
  {
    name: "whm_suspend_account",
    description: "Suspend a cPanel account",
    parameters: {
      type: "object",
      properties: {
        user: {
          type: "string",
          description: "The cPanel username to suspend"
        },
        reason: {
          type: "string",
          description: "Reason for suspension"
        }
      },
      required: ["user"]
    },
    function: async (params) => {
      logger.info(`Executing whm_suspend_account for user: ${params.user}`);
      try {
        const response = await whmApiRequest('suspendacct', params);
        return {
          status: response.data.status,
          message: response.data.statusmsg
        };
      } catch (error) {
        logger.error(`Error suspending account: ${error.message}`);
        throw error;
      }
    }
  },
  
  {
    name: "whm_unsuspend_account",
    description: "Unsuspend a cPanel account",
    parameters: {
      type: "object",
      properties: {
        user: {
          type: "string",
          description: "The cPanel username to unsuspend"
        }
      },
      required: ["user"]
    },
    function: async (params) => {
      logger.info(`Executing whm_unsuspend_account for user: ${params.user}`);
      try {
        const response = await whmApiRequest('unsuspendacct', params);
        return {
          status: response.data.status,
          message: response.data.statusmsg
        };
      } catch (error) {
        logger.error(`Error unsuspending account: ${error.message}`);
        throw error;
      }
    }
  },
  
  {
    name: "whm_terminate_account",
    description: "Terminate a cPanel account",
    parameters: {
      type: "object",
      properties: {
        user: {
          type: "string",
          description: "The cPanel username to terminate"
        },
        keepdns: {
          type: "boolean",
          description: "Whether to keep DNS entries"
        }
      },
      required: ["user"]
    },
    function: async (params) => {
      logger.info(`Executing whm_terminate_account for user: ${params.user}`);
      try {
        const response = await whmApiRequest('removeacct', params);
        return {
          status: response.data.status,
          message: response.data.statusmsg
        };
      } catch (error) {
        logger.error(`Error terminating account: ${error.message}`);
        throw error;
      }
    }
  },
  
  {
    name: "whm_list_backups",
    description: "List available backups on the server",
    parameters: {
      type: "object",
      properties: {}
    },
    function: async (params) => {
      logger.info('Executing whm_list_backups');
      try {
        const response = await whmApiRequest('listbackups');
        return {
          backups: response.data.backups || []
        };
      } catch (error) {
        logger.error(`Error listing backups: ${error.message}`);
        throw error;
      }
    }
  },
  
  {
    name: "whm_server_status",
    description: "Get server status information",
    parameters: {
      type: "object",
      properties: {}
    },
    function: async (params) => {
      logger.info('Executing whm_server_status');
      try {
        const loadAvgResponse = await whmApiRequest('loadavg');
        const serviceStatusResponse = await whmApiRequest('servicestatus');
        
        return {
          loadAverage: loadAvgResponse.data || {},
          services: serviceStatusResponse.data.services || {},
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        logger.error(`Error getting server status: ${error.message}`);
        throw error;
      }
    }
  }
];

module.exports = {
  whmTools,
  whmApiRequest
};