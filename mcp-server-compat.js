const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const WHMService = require('./src/services/whm.service');
const logger = require('./src/utils/logger');

// Load environment variables
dotenv.config();

// Set up middleware
app.use(cors());
app.use(express.json());

// Create WHM service instance
const whmService = new WHMService();

// Client connections
const clients = new Map();
let clientIdCounter = 0;

// Basic route for API status
app.get('/', (req, res) => {
  res.json({
    message: 'WHM MCP Server',
    status: 'active',
    version: '1.0.0'
  });
});

// SSE endpoint
app.get('/sse', (req, res) => {
  // Log detailed connection info
  console.log(`${new Date().toISOString()} - GET /sse`);
  console.log(`${new Date().toISOString()} - Headers: ${JSON.stringify(req.headers)}`);
  console.log(`${new Date().toISOString()} - SSE connection request received`);
  
  const clientId = clientIdCounter++;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection message
  res.write(`event: connection/ready\ndata: ${JSON.stringify({ protocol_version: "1.0" })}\n\n`);
  console.log(`${new Date().toISOString()} - SSE connection established`);
  
  // Send available tools
  const toolsData = {
    tools: whmTools
  };
  res.write(`event: tools/update\ndata: ${JSON.stringify(toolsData)}\n\n`);
  console.log(`${new Date().toISOString()} - Sent tools/ready notification`);
  
  // Register client
  clients.set(clientId, res);
  
  // Keep connection alive with more frequent pings
  const keepAliveInterval = setInterval(() => {
    res.write(`: keep-alive\n\n`);
  }, 10000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAliveInterval);
    clients.delete(clientId);
    console.log(`${new Date().toISOString()} - SSE connection closed, client: ${clientId}`);
  });
});

// Define the available WHM tools
const whmTools = [
  // Account Management
  {
    name: "whm_list_accounts",
    description: "List all WHM accounts on the server",
    parameters: {}
  },
  {
    name: "whm_create_account",
    description: "Create a new cPanel account",
    parameters: {
      username: {
        type: "string",
        description: "cPanel username (must be 8 characters or less)"
      },
      domain: {
        type: "string",
        description: "Primary domain name for the account"
      },
      password: {
        type: "string",
        description: "Password for the account"
      },
      email: {
        type: "string",
        description: "Contact email for the account owner"
      },
      package: {
        type: "string", 
        description: "Hosting package name"
      }
    }
  },
  {
    name: "whm_account_summary",
    description: "Get account summary information",
    parameters: {
      username: {
        type: "string",
        description: "cPanel username"
      }
    }
  },
  {
    name: "whm_suspend_account",
    description: "Suspend a cPanel account",
    parameters: {
      username: {
        type: "string", 
        description: "cPanel username"
      },
      reason: {
        type: "string",
        description: "Reason for suspension"
      }
    }
  },
  {
    name: "whm_unsuspend_account",
    description: "Unsuspend a cPanel account",
    parameters: {
      username: {
        type: "string",
        description: "cPanel username"
      }
    }
  },
  {
    name: "whm_terminate_account",
    description: "Permanently remove a cPanel account",
    parameters: {
      username: {
        type: "string",
        description: "cPanel username"
      }
    }
  },
  
  // Server Management
  {
    name: "whm_server_status",
    description: "Get the current WHM server status and system statistics",
    parameters: {}
  },
  {
    name: "whm_server_load",
    description: "Get server load statistics",
    parameters: {}
  },
  {
    name: "whm_service_status",
    description: "Get status of server services",
    parameters: {}
  },
  {
    name: "whm_restart_service",
    description: "Restart a specific server service",
    parameters: {
      service: {
        type: "string",
        description: "Service name (e.g., 'httpd', 'mysql', 'nginx')"
      }
    }
  },
  {
    name: "whm_check_updates",
    description: "Check for available server updates",
    parameters: {}
  },
  {
    name: "whm_start_update",
    description: "Start server update process",
    parameters: {}
  },
  
  // Domain Management
  {
    name: "whm_list_domains",
    description: "List all domains for a cPanel account",
    parameters: {
      username: {
        type: "string",
        description: "cPanel username"
      }
    }
  },
  {
    name: "whm_add_domain",
    description: "Add a domain to a cPanel account",
    parameters: {
      username: {
        type: "string",
        description: "cPanel username"
      },
      domain: {
        type: "string",
        description: "Domain name to add"
      }
    }
  },
  {
    name: "whm_delete_domain",
    description: "Remove a domain from a cPanel account",
    parameters: {
      username: {
        type: "string",
        description: "cPanel username"
      },
      domain: {
        type: "string",
        description: "Domain name to remove"
      }
    }
  }
];

// MCP message handling endpoint
app.post('/messages', async (req, res) => {
  try {
    const { id, method, params } = req.body;
    
    console.log(`${new Date().toISOString()} - POST /messages`);
    console.log(`${new Date().toISOString()} - Message: ${JSON.stringify(req.body)}`);
    
    if (!id || !method) {
      return res.status(400).json({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32600,
          message: "Invalid Request",
          data: "Missing required fields (id, method)"
        }
      });
    }

    // Process different method types
    if (method === "tools/list") {
      // Return available tools
      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: whmTools
        }
      });
    }
    
    if (method === "tools/call") {
      const { name, arguments: args } = params;
      
      // Handle WHM-specific tools
      if (name.startsWith("whm_")) {
        try {
          let result;
          
          // Account Management
          if (name === "whm_list_accounts") {
            result = await whmService.listAccounts();
          }
          else if (name === "whm_create_account") {
            result = await whmService.createAccount({
              username: args.username,
              domain: args.domain,
              password: args.password,
              contactemail: args.email,
              plan: args.package
            });
          }
          else if (name === "whm_account_summary") {
            result = await whmService.getAccountSummary(args.username);
          }
          else if (name === "whm_suspend_account") {
            result = await whmService.suspendAccount(args.username, args.reason);
          }
          else if (name === "whm_unsuspend_account") {
            result = await whmService.unsuspendAccount(args.username);
          }
          else if (name === "whm_terminate_account") {
            result = await whmService.terminateAccount(args.username);
          }
          
          // Server Management
          else if (name === "whm_server_status") {
            result = await whmService.getServerStatus();
          }
          else if (name === "whm_server_load") {
            result = await whmService.getServerLoad();
          }
          else if (name === "whm_service_status") {
            result = await whmService.getServiceStatus();
          }
          else if (name === "whm_restart_service") {
            result = await whmService.restartService(args.service);
          }
          else if (name === "whm_check_updates") {
            result = await whmService.checkForUpdates();
          }
          else if (name === "whm_start_update") {
            result = await whmService.startUpdate();
          }
          
          // Domain Management
          else if (name === "whm_list_domains") {
            result = await whmService.listDomains(args.username);
          }
          else if (name === "whm_add_domain") {
            result = await whmService.addDomain(args.username, args.domain);
          }
          else if (name === "whm_delete_domain") {
            result = await whmService.deleteDomain(args.username, args.domain);
          }
          else {
            // Unknown WHM tool
            return res.status(404).json({
              jsonrpc: "2.0",
              id,
              error: {
                code: -32601,
                message: "Method not found",
                data: `Tool '${name}' is not available`
              }
            });
          }
          
          return res.json({
            jsonrpc: "2.0",
            id,
            result
          });
        } catch (error) {
          logger.error(`WHM API Error: ${error.message}`);
          return res.status(500).json({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32603,
              message: "WHM API Error",
              data: error.message
            }
          });
        }
      }
      
      // Unknown tool
      return res.status(404).json({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: "Method not found",
          data: `Tool '${name}' is not available`
        }
      });
    }
    
    // Unknown method
    return res.status(404).json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: "Method not found",
        data: `Method '${method}' is not supported`
      }
    });
  } catch (error) {
    console.error(`${new Date().toISOString()} - Error processing message:`, error);
    return res.status(500).json({
      jsonrpc: "2.0",
      id: req.body.id || null,
      error: {
        code: -32603,
        message: "Internal error",
        data: error.message
      }
    });
  }
});

// Start server
const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
  console.log(`${new Date().toISOString()} - MCP Server running at http://localhost:${PORT}/`);
  console.log(`${new Date().toISOString()} - SSE endpoint available at http://localhost:${PORT}/sse`);
}); 