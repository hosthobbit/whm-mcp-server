/**
 * MCP server for Cursor integration with proper tool discovery
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');

// Client connections
const clients = new Map();
let clientIdCounter = 0;

// Available tools
const availableTools = [
  {
    name: "example_tool",
    description: "An example tool to demonstrate MCP integration",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "A message to echo back"
        }
      },
      required: ["message"]
    }
  },
  {
    name: "get_server_status",
    description: "Get the current status of the WHM MCP server",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

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
          reject(new Error('Invalid JSON: ' + e.message));
        }
      } else {
        resolve({});
      }
    });
    req.on('error', reject);
  });
};

// Send SSE message to client
const sendSSEMessage = (res, data) => {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch (err) {
    console.error(`Error sending SSE message: ${err.message}`);
    return false;
  }
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Parse URL and query parameters
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  
  // Root endpoint
  if (pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'WHM MCP Server',
      status: 'active',
      version: '1.0.0'
    }));
    return;
  }
  
  // SSE endpoint for MCP connection
  if (pathname === '/sse' && req.method === 'GET') {
    console.log(`${timestamp} - SSE connection request received`);
    console.log(`${timestamp} - Headers: ${JSON.stringify(req.headers)}`);
    
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Important for some proxies
    });
    
    // Generate client ID
    const clientId = (++clientIdCounter).toString();
    
    // Store the client connection
    clients.set(clientId, {
      res: res,
      lastActivity: Date.now(),
      sessionId: clientId,
      initialized: false
    });
    
    // Handle client disconnect
    req.on('close', () => {
      console.log(`${timestamp} - SSE connection closed, client: ${clientId}`);
      clients.delete(clientId);
    });
    
    // Keep connection alive with heartbeats
    const heartbeatInterval = setInterval(() => {
      if (clients.has(clientId)) {
        try {
          res.write(`:heartbeat\n\n`);
        } catch (err) {
          console.log(`${timestamp} - Error sending heartbeat: ${err.message}`);
          clearInterval(heartbeatInterval);
          clients.delete(clientId);
        }
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 15000);
    
    // Send initial connection establishment message
    sendSSEMessage(res, {
      jsonrpc: "2.0", 
      method: "connection/ready",
      params: { 
        session_id: clientId
      }
    });
    
    console.log(`${timestamp} - SSE connection established for client: ${clientId}`);
    return;
  }
  
  // Handle JSON-RPC messages
  if (pathname === '/messages' && req.method === 'POST') {
    // Parse query params to get sessionId
    const queryParams = querystring.parse(parsedUrl.query);
    const sessionId = queryParams.sessionId;
    
    console.log(`${timestamp} - Message received for session: ${sessionId}`);
    
    if (!sessionId || !clients.has(sessionId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32000,
          message: "Invalid session ID or session not found"
        }
      }));
      return;
    }
    
    try {
      // Parse request body
      const body = await parseJsonBody(req);
      console.log(`${timestamp} - Request body: ${JSON.stringify(body)}`);
      
      const { id, method, params } = body;
      
      // Validate required fields
      if (!id || !method) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          id: id || null,
          error: {
            code: -32600,
            message: "Invalid Request",
            data: "Missing required fields (id, method)"
          }
        }));
        return;
      }
      
      const client = clients.get(sessionId);
      
      // Handle different methods
      if (method === "initialize") {
        // Mark client as initialized
        client.initialized = true;
        
        // Respond to initialize request
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: { 
            // Add any initialization data here
          }
        }));
        
        // Also send the tools list through SSE
        sendSSEMessage(client.res, {
          jsonrpc: "2.0",
          id: "tools_list",
          result: {
            tools: availableTools
          }
        });
        
        return;
      }
      
      // Tools/list method - respond with available tools
      if (method === "tools/list") {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: {
            tools: availableTools
          }
        }));
        return;
      }
      
      // Invoke method - handle tool calls
      if (method === "invoke") {
        const { name, parameters } = params;
        
        if (name === "example_tool") {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              content: `Echo: ${parameters.message || "No message provided"}`
            }
          }));
          return;
        }
        
        if (name === "get_server_status") {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              content: JSON.stringify({
                status: "running",
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          }));
          return;
        }
        
        // Unknown tool
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: "Method not found",
            data: `Tool '${name}' is not available`
          }
        }));
        return;
      }
      
      // Unknown method
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: "Method not found",
          data: `Method '${method}' is not supported`
        }
      }));
      
    } catch (error) {
      console.error(`${timestamp} - Error processing message:`, error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: "Internal error",
          data: error.message
        }
      }));
    }
    return;
  }
  
  // 404 for all other requests
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    message: `${req.method} ${pathname} not found`
  }));
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - Received shutdown signal, closing server gracefully...`);
  
  // Notify all clients about the shutdown
  clients.forEach((client, clientId) => {
    try {
      sendSSEMessage(client.res, {
        jsonrpc: "2.0",
        method: "notification",
        params: {
          type: "shutdown",
          message: "Server is shutting down"
        }
      });
    } catch (err) {
      console.log(`${timestamp} - Error notifying client ${clientId} about shutdown: ${err.message}`);
    }
  });
  
  // Close the server - stop accepting new connections
  server.close(() => {
    console.log(`${timestamp} - Server closed successfully, exiting process`);
    process.exit(0);
  });
  
  // Give existing connections time to finish, but force exit after 10 seconds
  setTimeout(() => {
    console.log(`${timestamp} - Forcing exit after timeout`);
    process.exit(1);
  }, 10000);
}

// Start server - explicitly bind to all interfaces (0.0.0.0)
const PORT = process.env.PORT || 4444;
const HOST = '0.0.0.0'; // Listen on all interfaces, not just localhost
server.listen(PORT, HOST, () => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - MCP Server running at http://${HOST}:${PORT}/`);
  console.log(`${timestamp} - SSE endpoint available at http://${HOST}:${PORT}/sse`);
});