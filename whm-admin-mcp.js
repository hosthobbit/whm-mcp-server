const WebSocket = require('ws');
const axios = require('axios');
const crypto = require('crypto');

// WHM API configuration
const WHM_API_URL = process.env.WHM_API_URL || '';
const WHM_API_USERNAME = process.env.WHM_API_USERNAME || '';
const WHM_API_TOKEN = process.env.WHM_API_TOKEN || '';

// Mock data for testing (when WHM credentials are not configured)
const mockAccounts = [
  { username: 'user1', domain: 'user1.example.com', plan: 'Basic', status: 'active', diskused: '1.2GB', disklimit: '5GB' },
  { username: 'user2', domain: 'user2.example.com', plan: 'Premium', status: 'suspended', diskused: '3.5GB', disklimit: '10GB' },
  { username: 'user3', domain: 'user3.example.com', plan: 'Business', status: 'active', diskused: '7.8GB', disklimit: '20GB' },
];

const mockDomains = [
  { domain: 'example1.com', account: 'user1', status: 'active', ssl: true },
  { domain: 'example2.com', account: 'user2', status: 'suspended', ssl: false },
  { domain: 'example3.com', account: 'user1', status: 'active', ssl: true },
  { domain: 'example4.com', account: 'user3', status: 'pending', ssl: false },
];

// Helper function to check if WHM API credentials are configured
function isWhmConfigured() {
  return WHM_API_URL && WHM_API_USERNAME && WHM_API_TOKEN;
}

// Helper function to make authenticated WHM API calls
async function callWhmApi(endpoint, params = {}) {
  if (!isWhmConfigured()) {
    console.log('WHM API not configured, using mock data');
    return null;
  }
  
  try {
    const response = await axios({
      method: 'GET',
      url: `${WHM_API_URL}/json-api/${endpoint}`,
      params,
      headers: {
        'Authorization': `WHM ${WHM_API_USERNAME}:${WHM_API_TOKEN}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`WHM API error: ${error.message}`);
    throw new Error(`WHM API error: ${error.message}`);
  }
}

// Implement MCP tools
const whmMcpTools = [
  {
    name: "whm_list_accounts",
    description: "List all cPanel accounts on the server",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Optional search string to filter accounts"
        }
      }
    },
    async handler(params) {
      try {
        if (isWhmConfigured()) {
          const response = await callWhmApi('listaccts', {
            search: params.search || "",
            searchtype: "user"
          });
          return response.acct;
        } else {
          // Return mock data
          let result = [...mockAccounts];
          if (params.search) {
            result = result.filter(account => 
              account.username.includes(params.search) || 
              account.domain.includes(params.search)
            );
          }
          return result;
        }
      } catch (error) {
        console.error(`Error listing accounts: ${error.message}`);
        throw new Error(`Error listing accounts: ${error.message}`);
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
          description: "Username for the new account"
        },
        domain: {
          type: "string",
          description: "Primary domain for the account"
        },
        plan: {
          type: "string",
          description: "Hosting plan for the account"
        },
        email: {
          type: "string",
          description: "Email address for the account owner"
        }
      },
      required: ["username", "domain", "email"]
    },
    async handler(params) {
      try {
        if (isWhmConfigured()) {
          // Generate random password for the account
          const password = crypto.randomBytes(12).toString('hex');
          
          const response = await callWhmApi('createacct', {
            username: params.username,
            domain: params.domain,
            plan: params.plan || "default",
            email: params.email,
            password
          });
          
          return {
            success: true,
            account: params.username,
            domain: params.domain,
            password
          };
        } else {
          // Mock response
          const newAccount = {
            username: params.username,
            domain: params.domain,
            plan: params.plan || "Basic",
            status: 'active',
            diskused: '0GB',
            disklimit: '5GB'
          };
          
          mockAccounts.push(newAccount);
          mockDomains.push({
            domain: params.domain,
            account: params.username,
            status: 'active',
            ssl: false
          });
          
          return {
            success: true,
            account: params.username,
            domain: params.domain,
            password: 'mock-password-123'
          };
        }
      } catch (error) {
        console.error(`Error creating account: ${error.message}`);
        throw new Error(`Error creating account: ${error.message}`);
      }
    }
  },
  {
    name: "whm_suspend_account",
    description: "Suspend a cPanel account",
    parameters: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "Username of the account to suspend"
        },
        reason: {
          type: "string",
          description: "Reason for suspension"
        }
      },
      required: ["username"]
    },
    async handler(params) {
      try {
        if (isWhmConfigured()) {
          const response = await callWhmApi('suspendacct', {
            user: params.username,
            reason: params.reason || "Account suspended via WHM MCP"
          });
          
          return {
            success: true,
            account: params.username,
            status: 'suspended'
          };
        } else {
          // Mock response
          const account = mockAccounts.find(acc => acc.username === params.username);
          if (!account) {
            throw new Error(`Account ${params.username} not found`);
          }
          
          account.status = 'suspended';
          
          // Also suspend domains associated with this account
          mockDomains.forEach(domain => {
            if (domain.account === params.username) {
              domain.status = 'suspended';
            }
          });
          
          return {
            success: true,
            account: params.username,
            status: 'suspended'
          };
        }
      } catch (error) {
        console.error(`Error suspending account: ${error.message}`);
        throw new Error(`Error suspending account: ${error.message}`);
      }
    }
  },
  {
    name: "whm_unsuspend_account",
    description: "Unsuspend a cPanel account",
    parameters: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "Username of the account to unsuspend"
        }
      },
      required: ["username"]
    },
    async handler(params) {
      try {
        if (isWhmConfigured()) {
          const response = await callWhmApi('unsuspendacct', {
            user: params.username
          });
          
          return {
            success: true,
            account: params.username,
            status: 'active'
          };
        } else {
          // Mock response
          const account = mockAccounts.find(acc => acc.username === params.username);
          if (!account) {
            throw new Error(`Account ${params.username} not found`);
          }
          
          account.status = 'active';
          
          // Also unsuspend domains associated with this account
          mockDomains.forEach(domain => {
            if (domain.account === params.username) {
              domain.status = 'active';
            }
          });
          
          return {
            success: true,
            account: params.username,
            status: 'active'
          };
        }
      } catch (error) {
        console.error(`Error unsuspending account: ${error.message}`);
        throw new Error(`Error unsuspending account: ${error.message}`);
      }
    }
  },
  {
    name: "whm_terminate_account",
    description: "Permanently terminate a cPanel account",
    parameters: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "Username of the account to terminate"
        },
        keepdns: {
          type: "boolean",
          description: "Whether to keep DNS entries after termination"
        }
      },
      required: ["username"]
    },
    async handler(params) {
      try {
        if (isWhmConfigured()) {
          const response = await callWhmApi('removeacct', {
            user: params.username,
            keepdns: params.keepdns ? 1 : 0
          });
          
          return {
            success: true,
            account: params.username,
            status: 'terminated'
          };
        } else {
          // Mock response
          const accountIndex = mockAccounts.findIndex(acc => acc.username === params.username);
          if (accountIndex === -1) {
            throw new Error(`Account ${params.username} not found`);
          }
          
          // Remove account from mock data
          mockAccounts.splice(accountIndex, 1);
          
          // Remove domains associated with this account
          const domainsToRemove = [];
          mockDomains.forEach((domain, index) => {
            if (domain.account === params.username) {
              domainsToRemove.push(index);
            }
          });
          
          // Remove domains in reverse order to avoid index shifting
          domainsToRemove.reverse().forEach(index => {
            mockDomains.splice(index, 1);
          });
          
          return {
            success: true,
            account: params.username,
            status: 'terminated'
          };
        }
      } catch (error) {
        console.error(`Error terminating account: ${error.message}`);
        throw new Error(`Error terminating account: ${error.message}`);
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
    async handler(params) {
      try {
        if (isWhmConfigured()) {
          const loadavg = await callWhmApi('loadavg');
          const sysinfo = await callWhmApi('systeminfo');
          
          return {
            load: loadavg.one,
            loadavg: [loadavg.one, loadavg.five, loadavg.fifteen],
            uptime: sysinfo.uptime,
            memory: {
              total: sysinfo.memory.total,
              used: sysinfo.memory.used,
              free: sysinfo.memory.free
            },
            disk: {
              total: sysinfo.disk.total,
              used: sysinfo.disk.used,
              free: sysinfo.disk.free
            }
          };
        } else {
          // Mock server status
          return {
            load: 0.45,
            loadavg: [0.45, 0.52, 0.60],
            uptime: "15 days, 7 hours, 23 minutes",
            memory: {
              total: "16GB",
              used: "8.2GB",
              free: "7.8GB"
            },
            disk: {
              total: "500GB",
              used: "125GB",
              free: "375GB"
            }
          };
        }
      } catch (error) {
        console.error(`Error getting server status: ${error.message}`);
        throw new Error(`Error getting server status: ${error.message}`);
      }
    }
  },
  {
    name: "whm_list_domains",
    description: "List all domains on the server",
    parameters: {
      type: "object",
      properties: {
        account: {
          type: "string",
          description: "Optional account username to filter domains"
        }
      }
    },
    async handler(params) {
      try {
        if (isWhmConfigured()) {
          let response;
          if (params.account) {
            response = await callWhmApi('domainuserdata', {
              user: params.account
            });
            return response.userdata.domains;
          } else {
            // List all domains from all accounts
            const accounts = await callWhmApi('listaccts');
            const domains = [];
            
            for (const account of accounts.acct) {
              const accountDomains = await callWhmApi('domainuserdata', {
                user: account.user
              });
              domains.push(...accountDomains.userdata.domains);
            }
            
            return domains;
          }
        } else {
          // Mock response
          let result = [...mockDomains];
          if (params.account) {
            result = result.filter(domain => domain.account === params.account);
          }
          return result;
        }
      } catch (error) {
        console.error(`Error listing domains: ${error.message}`);
        throw new Error(`Error listing domains: ${error.message}`);
      }
    }
  },
  {
    name: "whm_backup_account",
    description: "Create a backup of a cPanel account",
    parameters: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "Username of the account to backup"
        },
        email: {
          type: "string",
          description: "Email to send notification when backup is complete"
        }
      },
      required: ["username"]
    },
    async handler(params) {
      try {
        if (isWhmConfigured()) {
          const response = await callWhmApi('backup_user_list', {
            user: params.username
          });
          
          const backupOptions = {
            method: 'POST',
            url: `${WHM_API_URL}/json-api/backup_user_backup`,
            headers: {
              'Authorization': `WHM ${WHM_API_USERNAME}:${WHM_API_TOKEN}`
            },
            data: {
              user: params.username,
              email: params.email || ''
            }
          };
          
          const backupResponse = await axios(backupOptions);
          
          return {
            success: true,
            account: params.username,
            status: 'backup_initiated',
            details: backupResponse.data
          };
        } else {
          // Mock response for backup
          return {
            success: true,
            account: params.username,
            status: 'backup_initiated',
            details: {
              backup_id: Math.floor(Math.random() * 10000),
              start_time: new Date().toISOString(),
              estimated_completion: new Date(Date.now() + 3600000).toISOString()
            }
          };
        }
      } catch (error) {
        console.error(`Error backing up account: ${error.message}`);
        throw new Error(`Error backing up account: ${error.message}`);
      }
    }
  }
];

// Start the WHM Administration MCP server
function startWhmAdminServer(port) {
  const wss = new WebSocket.Server({ port });
  
  // Log when the server starts
  console.log(`WHM Administration MCP server running on port ${port}`);
  console.log(`WHM API ${isWhmConfigured() ? 'configured' : 'not configured - using mock data'}`);

  // Server client connection handling
  wss.on('connection', (ws) => {
    console.log('Client connected to WHM MCP server');
    
    // Send the initial connection/ready message (required by MCP protocol)
    ws.send(JSON.stringify({
      type: "connection/ready",
      defaultTools: whmMcpTools.map(tool => ({ 
        name: tool.name, 
        description: tool.description,
        parameters: tool.parameters
      }))
    }));

    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`Received message: ${data.type}`);
        
        // Process tool calls
        if (data.type === 'tool/call') {
          const { id, name, parameters } = data;
          
          // Find the requested tool
          const tool = whmMcpTools.find(t => t.name === name);
          
          if (!tool) {
            ws.send(JSON.stringify({
              type: 'tool/response',
              id,
              success: false,
              error: `Tool '${name}' not found`
            }));
            return;
          }
          
          try {
            // Execute the tool handler
            const result = await tool.handler(parameters || {});
            
            // Send successful response
            ws.send(JSON.stringify({
              type: 'tool/response',
              id,
              success: true,
              result
            }));
          } catch (error) {
            // Send error response
            ws.send(JSON.stringify({
              type: 'tool/response',
              id,
              success: false,
              error: error.message
            }));
          }
        }
      } catch (error) {
        console.error(`Error processing message: ${error.message}`);
        ws.send(JSON.stringify({
          type: 'connection/error',
          error: `Error processing message: ${error.message}`
        }));
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log('Client disconnected from WHM MCP server');
    });
  });

  return wss;
}

module.exports = {
  startWhmAdminServer
};