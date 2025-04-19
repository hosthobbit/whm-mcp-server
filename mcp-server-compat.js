const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set up middleware
app.use(cors());
app.use(express.json());

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
  const clientId = (++clientIdCounter).toString();
  
  console.log(`${new Date().toISOString()} - GET /sse`);
  console.log(`${new Date().toISOString()} - Headers: ${JSON.stringify(req.headers)}`);
  console.log(`${new Date().toISOString()} - SSE connection request received`);
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial connection message following JSON-RPC 2.0 format
  const initialMessage = {
    jsonrpc: "2.0",
    id: clientId,
    method: "connection/established",
    params: {
      status: "connected",
      clientId: clientId,
      timestamp: new Date().toISOString()
    }
  };
  
  res.write(`data: ${JSON.stringify(initialMessage)}\n\n`);
  console.log(`${new Date().toISOString()} - SSE connection established`);
  
  // Store client connection
  clients.set(clientId, res);
  
  // Handle client disconnect
  req.on('close', () => {
    console.log(`${new Date().toISOString()} - SSE connection closed, client: ${clientId}`);
    clients.delete(clientId);
  });
});

// MCP message handling endpoint
app.post('/messages', (req, res) => {
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
          tools: [
            {
              name: "example_tool",
              description: "An example tool to show MCP integration",
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
          ]
        }
      });
    }
    
    if (method === "tools/call") {
      const { name, arguments: args } = params;
      
      if (name === "example_tool") {
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: `Echo: ${args.message || "No message provided"}`
          }
        });
      }
      
      if (name === "get_server_status") {
        return res.json({
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
        });
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