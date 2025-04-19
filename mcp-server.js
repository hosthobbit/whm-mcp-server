/**
 * Spec-compliant MCP server for Cursor integration
 * Run with: node mcp-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Enable detailed logging
const DEBUG = true;

// Logger function
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${message}`);
  
  // Also log to file if needed
  try {
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    fs.appendFileSync(path.join(logsDir, 'mcp-server.log'), `${timestamp} - ${message}\n`);
  } catch (error) {
    console.error(`Error writing to log file: ${error.message}`);
  }
}

// Create the server
const server = http.createServer((req, res) => {
  log(`${req.method} ${req.url}`);
  
  // Log headers in debug mode
  if (DEBUG) {
    log(`Headers: ${JSON.stringify(req.headers)}`);
  }
  
  // Handle SSE endpoint for MCP
  if (req.url === '/sse') {
    handleSSE(req, res);
    return;
  }
  
  // Handle other routes
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'WHM MCP Server',
      status: 'running',
      endpoints: {
        sse: '/sse'
      }
    }));
    return;
  }
  
  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Handle SSE connections
function handleSSE(req, res) {
  log('SSE connection request received');
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  log('SSE connection established');
  
  // Wait for initialize message from client
  let initialized = false;
  let clientId = null;
  
  // Function to send events
  const sendEvent = (data) => {
    const event = `data: ${JSON.stringify(data)}\n\n`;
    log(`Sending: ${event.trim()}`);
    res.write(event);
  };
  
  // Define tool schema
  const tools = [
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
  ];
  
  // Handle incoming data (for initialize message)
  let buffer = '';
  req.on('data', (chunk) => {
    buffer += chunk.toString();
    
    try {
      // Try to parse lines from buffer
      const lines = buffer.split('\\n');
      buffer = lines.pop(); // Keep the last incomplete line in buffer
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const message = JSON.parse(line);
        log(`Received message: ${JSON.stringify(message)}`);
        
        // Handle initialize message
        if (message.method === 'initialize') {
          log('Initialize message received');
          initialized = true;
          clientId = message.params?.client_id || 'unknown';
          
          // Send initialize response with available tools
          sendEvent({
            jsonrpc: "2.0",
            id: message.id,
            result: {
              tools: tools
            }
          });
        }
        // Handle tool invocation
        else if (message.method === 'invoke' && initialized) {
          const toolName = message.params?.name;
          const params = message.params?.parameters || {};
          
          log(`Tool invocation: ${toolName} with params: ${JSON.stringify(params)}`);
          
          // Handle example_tool
          if (toolName === 'example_tool') {
            sendEvent({
              jsonrpc: "2.0",
              id: message.id,
              result: {
                content: `Echo: ${params.message}`
              }
            });
          }
          // Handle get_server_status
          else if (toolName === 'get_server_status') {
            sendEvent({
              jsonrpc: "2.0",
              id: message.id,
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
          else {
            sendEvent({
              jsonrpc: "2.0",
              id: message.id,
              error: {
                code: -32601,
                message: `Tool not found: ${toolName}`
              }
            });
          }
        }
        // Uninitialized client trying to invoke tools
        else if (message.method === 'invoke' && !initialized) {
          log('ERROR: Client tried to invoke tool before initialization');
          sendEvent({
            jsonrpc: "2.0",
            id: message.id,
            error: {
              code: -32600,
              message: "Client must send initialize message first"
            }
          });
        }
      }
    } catch (error) {
      log(`Error processing message: ${error.message}`);
    }
  });
  
  // Keep the connection alive with a ping every 30 seconds
  const pingInterval = setInterval(() => {
    log('Sending ping');
    sendEvent({ type: 'ping', timestamp: new Date().toISOString() });
  }, 30000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(pingInterval);
    log(`SSE connection closed, client: ${clientId || 'unknown'}`);
  });
  
  // Handle errors
  req.on('error', (error) => {
    clearInterval(pingInterval);
    log(`SSE connection error: ${error.message}`);
  });
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log(`MCP Server running at http://localhost:${PORT}/`);
  log(`SSE endpoint available at http://localhost:${PORT}/sse`);
});