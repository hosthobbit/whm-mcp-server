// WHM Administration MCP Server
const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configuration
const PORT = process.env.PORT || 3001;
const WHM_API_URL = process.env.WHM_API_URL || 'https://yourdomain.com:2087/json-api/';
const WHM_API_TOKEN = process.env.WHM_API_TOKEN;

// Initialize Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Available MCP tools
const MCPTools = [
  {
    name: "whm_list_accounts",
    description: "List all cPanel accounts on the server",
    parameters: {
      $schema: "http://json-schema.org/draft-07/schema#",
      additionalProperties: false,
      properties: {
        search: { type: "string", description: "Optional search term to filter accounts" },
        limit: { type: "number", description: "Maximum number of accounts to return" }
      },
      type: "object"
    }
  },
  {
    name: "whm_create_account",
    description: "Create a new cPanel account",
    parameters: {
      $schema: "http://json-schema.org/draft-07/schema#",
      additionalProperties: false,
      properties: {
        username: { type: "string", description: "Username for the new account" },
        domain: { type: "string", description: "Domain name for the new account" },
        password: { type: "string", description: "Password for the new account" },
        plan: { type: "string", description: "Hosting plan to assign" },
        email: { type: "string", description: "Email address for the account owner" }
      },
      required: ["username", "domain", "password", "email"],
      type: "object"
    }
  },
  {
    name: "whm_suspend_account",
    description: "Suspend a cPanel account",
    parameters: {
      $schema: "http://json-schema.org/draft-07/schema#",
      additionalProperties: false,
      properties: {
        username: { type: "string", description: "Username of the account to suspend" },
        reason: { type: "string", description: "Reason for suspension" }
      },
      required: ["username"],
      type: "object"
    }
  },
  {
    name: "whm_unsuspend_account",
    description: "Unsuspend a cPanel account",
    parameters: {
      $schema: "http://json-schema.org/draft-07/schema#",
      additionalProperties: false,
      properties: {
        username: { type: "string", description: "Username of the account to unsuspend" }
      },
      required: ["username"],
      type: "object"
    }
  },
  {
    name: "whm_terminate_account",
    description: "Permanently terminate a cPanel account",
    parameters: {
      $schema: "http://json-schema.org/draft-07/schema#",
      additionalProperties: false,
      properties: {
        username: { type: "string", description: "Username of the account to terminate" },
        keep_dns: { type: "boolean", description: "Whether to keep DNS entries" }
      },
      required: ["username"],
      type: "object"
    }
  },
  {
    name: "whm_server_status",
    description: "Get server status information",
    parameters: {
      $schema: "http://json-schema.org/draft-07/schema#",
      additionalProperties: false,
      properties: {
        type: { 
          type: "string", 
          description: "Type of status information",
          enum: ["load", "memory", "disk", "all"]
        }
      },
      type: "object"
    }
  },
  {
    name: "whm_list_domains",
    description: "List all domains on the server",
    parameters: {
      $schema: "http://json-schema.org/draft-07/schema#",
      additionalProperties: false,
      properties: {
        username: { type: "string", description: "Optional: Filter domains by account username" }
      },
      type: "object"
    }
  },
  {
    name: "whm_backup_account",
    description: "Create a backup of a cPanel account",
    parameters: {
      $schema: "http://json-schema.org/draft-07/schema#",
      additionalProperties: false,
      properties: {
        username: { type: "string", description: "Username of the account to backup" },
        email: { type: "string", description: "Email to notify when backup is complete" }
      },
      required: ["username"],
      type: "object"
    }
  }
];

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send connection ready message
  ws.send(JSON.stringify({ type: "connection/ready" }));
  
  // Send available tools
  ws.send(JSON.stringify({
    type: "tools/declare",
    tools: MCPTools
  }));
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);
      
      if (data.type === 'tool/call') {
        const { toolName, callId, parameters } = data;
        
        // Process tool calls
        let result;
        switch (toolName) {
          case 'whm_list_accounts':
            result = await listAccounts(parameters);
            break;
          case 'whm_create_account':
            result = await createAccount(parameters);
            break;
          case 'whm_suspend_account':
            result = await suspendAccount(parameters);
            break;
          case 'whm_unsuspend_account':
            result = await unsuspendAccount(parameters);
            break;
          case 'whm_terminate_account':
            result = await terminateAccount(parameters);
            break;
          case 'whm_server_status':
            result = await getServerStatus(parameters);
            break;
          case 'whm_list_domains':
            result = await listDomains(parameters);
            break;
          case 'whm_backup_account':
            result = await backupAccount(parameters);
            break;
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
        
        // Send response
        ws.send(JSON.stringify({
          type: 'tool/response',
          callId,
          response: result
        }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// WHM API helper function
async function callWHMAPI(endpoint, params = {}) {
  if (!WHM_API_TOKEN) {
    throw new Error('WHM API token not configured');
  }
  
  try {
    const response = await axios({
      method: 'POST',
      url: `${WHM_API_URL}${endpoint}`,
      headers: {
        'Authorization': `WHM ${WHM_API_TOKEN}`
      },
      data: params
    });
    
    return response.data;
  } catch (error) {
    console.error(`WHM API error (${endpoint}):`, error.response?.data || error.message);
    throw new Error(`WHM API error: ${error.response?.data?.message || error.message}`);
  }
}

// Tool implementation functions
async function listAccounts({ search, limit }) {
  const params = {};
  if (search) params.search = search;
  if (limit) params.limit = limit;
  
  // This is a mock response - replace with actual API call
  // return await callWHMAPI('listaccts', params);
  
  // Mock data for demonstration
  return {
    accounts: [
      { username: 'user1', domain: 'example1.com', plan: 'basic', status: 'active' },
      { username: 'user2', domain: 'example2.com', plan: 'premium', status: 'active' },
      { username: 'user3', domain: 'example3.com', plan: 'business', status: 'suspended' }
    ],
    totalAccounts: 3
  };
}

async function createAccount({ username, domain, password, plan, email }) {
  // This is a mock response - replace with actual API call
  // return await callWHMAPI('createacct', { username, domain, password, plan, email });
  
  // Mock data for demonstration
  return {
    status: 'success',
    message: `Account ${username} created successfully`,
    details: {
      username,
      domain,
      plan: plan || 'default',
      email,
      creation_time: new Date().toISOString()
    }
  };
}

async function suspendAccount({ username, reason }) {
  // This is a mock response - replace with actual API call
  // return await callWHMAPI('suspendacct', { user: username, reason });
  
  // Mock data for demonstration
  return {
    status: 'success',
    message: `Account ${username} suspended successfully`,
    reason: reason || 'Administrative action'
  };
}

async function unsuspendAccount({ username }) {
  // This is a mock response - replace with actual API call
  // return await callWHMAPI('unsuspendacct', { user: username });
  
  // Mock data for demonstration
  return {
    status: 'success',
    message: `Account ${username} unsuspended successfully`
  };
}

async function terminateAccount({ username, keep_dns }) {
  // This is a mock response - replace with actual API call
  // return await callWHMAPI('removeacct', { username, keepdns: keep_dns ? 1 : 0 });
  
  // Mock data for demonstration
  return {
    status: 'success',
    message: `Account ${username} terminated successfully`,
    keep_dns: keep_dns || false
  };
}

async function getServerStatus({ type = 'all' }) {
  // This is a mock response - replace with actual API call
  // const endpoint = type === 'all' ? 'systeminfo' : type + 'usage';
  // return await callWHMAPI(endpoint);
  
  // Mock data for demonstration
  return {
    status: 'success',
    data: {
      load: [0.78, 0.82, 0.75],
      memory: {
        total: 16384,
        used: 8192,
        free: 8192,
        percent_used: 50
      },
      disk: {
        total: 500,
        used: 250,
        free: 250,
        percent_used: 50
      },
      uptime: '15 days, 7 hours, 23 minutes'
    }
  };
}

async function listDomains({ username }) {
  const params = {};
  if (username) params.user = username;
  
  // This is a mock response - replace with actual API call
  // return await callWHMAPI('listdomains', params);
  
  // Mock data for demonstration
  return {
    status: 'success',
    domains: [
      { domain: 'example1.com', account: 'user1', addon: false },
      { domain: 'example2.com', account: 'user2', addon: false },
      { domain: 'blog.example1.com', account: 'user1', addon: true }
    ]
  };
}

async function backupAccount({ username, email }) {
  // This is a mock response - replace with actual API call
  // return await callWHMAPI('backupaccount', { user: username, email });
  
  // Mock data for demonstration
  return {
    status: 'success',
    message: `Backup for account ${username} initiated`,
    details: {
      username,
      backup_id: `backup_${Date.now()}`,
      notification_email: email || 'admin@example.com',
      estimated_completion: new Date(Date.now() + 3600000).toISOString()
    }
  };
}

// HTTP routes
app.get('/', (req, res) => {
  res.send('WHM MCP Server is running');
});

// Server start function
function start() {
  server.listen(PORT, () => {
    console.log(`WHM MCP Server running on port ${PORT}`);
    console.log(`Connect to: ws://localhost:${PORT}`);
  });
}

// Export for use in index.js
module.exports = { start };