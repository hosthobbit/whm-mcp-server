/**
 * WHM Administration MCP Server
 * 
 * This MCP server provides tools for administering a WebHost Manager (WHM) server
 * including account management, domain setup, server information, and system monitoring.
 */

const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');

// Configuration - adjust as needed
const config = {
  whmApiUrl: 'https://yourserver.com:2087/json-api/',  // Change to your WHM server address
  whmApiToken: 'your_api_token_here',                 // Change to your WHM API token
  mcpPort: 4444,                                       // Port for the MCP server to listen on
  mcpHost: '0.0.0.0'                                   // Interface for the MCP server to bind to
};

// Client connections
const clients = new Map();
let clientIdCounter = 0;

// Available tools with proper schema definitions
const availableTools = [
  {
    name: "list_accounts",
    description: "List cPanel accounts on the server",
    parameters: {
      type: "object",
      properties: {
        search: { 
          type: "string", 
          description: "Optional search term to filter accounts" 
        }
      }
    }
  },
  {
    name: "create_account",
    description: "Create a new cPanel account",
    parameters: {
      type: "object",
      properties: {
        username: { 
          type: "string", 
          description: "Username for the new account (must be 8 characters or less)" 
        },
        domain: { 
          type: "string", 
          description: "Primary domain for the account" 
        },
        plan: { 
          type: "string", 
          description: "Package/plan name for the account" 
        },
        password: { 
          type: "string", 
          description: "Password for the new account" 
        },
        email: { 
          type: "string", 
          description: "Email address for the account owner" 
        }
      },
      required: ["username", "domain", "plan", "password", "email"]
    }
  },
  {
    name: "get_account_info",
    description: "Get detailed information about a cPanel account",
    parameters: {
      type: "object",
      properties: {
        username: { 
          type: "string", 
          description: "Username of the account to get information for" 
        }
      },
      required: ["username"]
    }
  },
  {
    name: "suspend_account",
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
      required: ["username", "reason"]
    }
  },
  {
    name: "unsuspend_account",
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
    }
  },
  {
    name: "terminate_account",
    description: "Permanently delete a cPanel account",
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
    }
  },
  {
    name: "list_packages",
    description: "List available hosting packages/plans",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "server_status",
    description: "Get server status information (CPU, memory, disk usage)",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "list_domains",
    description: "List all domains on the server",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_domain_info",
    description: "Get information about a specific domain",
    parameters: {
      type: "object",
      properties: {
        domain: { 
          type: "string", 
          description: "Domain name to get information for" 
        }
      },
      required: ["domain"]
    }
  },
  {
    name: "add_domain",
    description: "Add a domain to an existing account",
    parameters: {
      type: "object",
      properties: {
        username: { 
          type: "string", 
          description: "Username of the account to add the domain to" 
        },
        domain: { 
          type: "string", 
          description: "Domain name to add" 
        },
        subdomain: { 
          type: "string", 
          description: "Optional subdomain to create" 
        }
      },
      required: ["username", "domain"]
    }
  },
  {
    name: "change_password",
    description: "Change password for a cPanel account",
    parameters: {
      type: "object",
      properties: {
        username: { 
          type: "string", 
          description: "Username of the account" 
        },
        password: { 
          type: "string", 
          description: "New password" 
        }
      },
      required: ["username", "password"]
    }
  },
  {
    name: "backup_account",
    description: "Create a backup of a cPanel account",
    parameters: {
      type: "object",
      properties: {
        username: { 
          type: "string", 
          description: "Username of the account to backup" 
        }
      },
      required: ["username"]
    }
  }
];

// Make a request to the WHM API
const makeWhmApiRequest = (endpoint, params = {}) => {
  return new Promise((resolve, reject) => {
    const apiUrl = config.whmApiUrl + endpoint;
    const requestUrl = apiUrl + '?' + querystring.stringify(params);
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `WHM ${config.whmApiToken}`
      },
      rejectUnauthorized: false // Only use in development, remove in production
    };
    
    const req = https.request(requestUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Invalid JSON response from WHM API: ' + error.message));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error('WHM API request failed: ' + error.message));
    });
    
    req.end();
  });
};

// Handle tool invocation
const handleToolInvocation = async (toolName, parameters) => {
  try {
    switch (toolName) {
      case 'list_accounts':
        return await makeWhmApiRequest('listaccts', {
          search: parameters.search || '',
          searchtype: 'user'
        });
        
      case 'create_account':
        return await makeWhmApiRequest('createacct', {
          username: parameters.username,
          domain: parameters.domain,
          plan: parameters.plan,
          password: parameters.password,
          contactemail: parameters.email
        });
        
      case 'get_account_info':
        return await makeWhmApiRequest('accountsummary', {
          user: parameters.username
        });
        
      case 'suspend_account':
        return await makeWhmApiRequest('suspendacct', {
          user: parameters.username,
          reason: parameters.reason
        });
        
      case 'unsuspend_account':
        return await makeWhmApiRequest('unsuspendacct', {
          user: parameters.username
        });
        
      case 'terminate_account':
        return await makeWhmApiRequest('removeacct', {
          username: parameters.username,
          keepdns: parameters.keepdns ? 1 : 0
        });
        
      case 'list_packages':
        return await makeWhmApiRequest('listpkgs');
        
      case 'server_status':
        const loadavg = await makeWhmApiRequest('loadavg');
        const diskusage = await makeWhmApiRequest('getdiskusage');
        const meminfo = await makeWhmApiRequest('systemloadavg');
        
        return {
          loadavg,
          diskusage,
          meminfo
        };
        
      case 'list_domains':
        return await makeWhmApiRequest('listdomains');
        
      case 'get_domain_info':
        return await makeWhmApiRequest('domainuserdata', {
          domain: parameters.domain
        });
        
      case 'add_domain':
        return await makeWhmApiRequest('addaddondomain', {
          user: parameters.username,
          domain: parameters.domain,
          subdomain: parameters.subdomain || ''
        });
        
      case 'change_password':
        return await makeWhmApiRequest('passwd', {
          user: parameters.username,
          password: parameters.password
        });
        
      case 'backup_account':
        return await makeWhmApiRequest('backupmgr', {
          action: 'backup',
          user: parameters.username
        });
        
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    return {
      status: "error",
      message: error.message
    };
  }
};

// Parse JSON request body
const parseJsonBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (body) {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      } else {
        resolve({});
      }
    });
  });
};

// Send SSE message
const sendSSEMessage = (res, data) => {
  const message = JSON.stringify(data);
  console.log(`Sending SSE message: ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}`);
  res.write(`data: ${message}\n\n`);
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  // SSE endpoint
  if (pathname === '/sse' && req.method === 'GET') {
    console.log(`${timestamp} - SSE connection request received`);
    console.log(`${timestamp} - Headers: ${JSON.stringify(req.headers)}`);

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const clientId = (++clientIdCounter).toString();
    
    // Store client connection
    clients.set(clientId, {
      res,
      lastActivity: Date.now(),
      initialized: false
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log(`${timestamp} - Client disconnected: ${clientId}`);
      clients.delete(clientId);
    });

    // Send initial connection message
    sendSSEMessage(res, {
      jsonrpc: "2.0",
      method: "connection/ready",
      params: {
        session_id: clientId,
        protocol_version: "2025-03-26",
        server_info: {
          name: "WHM Administration MCP Server",
          version: "1.0.0",
          capabilities: ["tools"]
        }
      }
    });

    // Send capabilities immediately
    sendSSEMessage(res, {
      jsonrpc: "2.0",
      method: "server/capabilities",
      params: {
        capabilities: {
          tools: true
        },
        tools: availableTools
      }
    });

    console.log(`${timestamp} - SSE connection established for client: ${clientId}`);
    return;
  }

  // Handle JSON-RPC messages
  if (pathname === '/messages' && req.method === 'POST') {
    const queryParams = querystring.parse(parsedUrl.query);
    const sessionId = queryParams.sessionId;

    if (!sessionId || !clients.has(sessionId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid session"
        }
      }));
      return;
    }

    try {
      const body = await parseJsonBody(req);
      console.log(`${timestamp} - Received message: ${JSON.stringify(body)}`);

      const { id, method, params } = body;

      if (!id || !method) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32600,
            message: "Invalid Request"
          }
        }));
        return;
      }

      const client = clients.get(sessionId);

      // Handle initialize request
      if (method === "initialize") {
        client.initialized = true;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: {
            capabilities: {
              tools: true
            }
          }
        }));
        return;
      }

      // Handle tool invocation
      if (method === "invoke") {
        const { name, parameters } = params;
        const tool = availableTools.find(t => t.name === name);

        if (!tool) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Tool '${name}' not found`
            }
          }));
          return;
        }

        try {
          // Execute the tool
          console.log(`${timestamp} - Executing tool: ${name} with parameters: ${JSON.stringify(parameters)}`);
          const result = await handleToolInvocation(name, parameters);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              status: "success",
              data: result
            }
          }));
        } catch (error) {
          console.error(`${timestamp} - Tool execution error:`, error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32603,
              message: `Tool execution error: ${error.message}`
            }
          }));
        }
        return;
      }

      // Handle unknown method
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method '${method}' not found`
        }
      }));

    } catch (error) {
      console.error(`${timestamp} - Error:`, error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error"
        }
      }));
    }
    return;
  }

  // 404 for unknown endpoints
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Start server
server.listen(config.mcpPort, config.mcpHost, () => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - WHM Administration MCP Server running at http://${config.mcpHost}:${config.mcpPort}/`);
  console.log(`${timestamp} - IMPORTANT: Update the config object with your WHM server URL and API token before using.`);
});