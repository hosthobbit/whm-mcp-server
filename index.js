// Main MCP Server implementation
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { createLogger, format, transports } = require('winston');
const { v4: uuidv4 } = require('uuid');
const { whmTools } = require('./whm-admin-mcp');

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
    new transports.File({ filename: 'mcp-server.log' })
  ]
});

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4444;

// WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections
const connections = new Map();

// API key for authentication
const API_KEY = process.env.API_KEY || 'YOUR_DEFAULT_API_KEY'; // Replace in production

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', version: '1.0.0' });
});

// Prepare MCP tool definitions for sending to clients
const toolDefinitions = whmTools.map(tool => ({
  name: tool.name,
  description: tool.description,
  parameters: tool.parameters
}));

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const connectionId = uuidv4();
  
  logger.info(`New WebSocket connection established: ${connectionId}`);
  
  connections.set(connectionId, {
    ws,
    authenticated: false,
    pendingRequests: new Map()
  });
  
  // Set up ping interval for connection health
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);
  
  // Send connection/ready message
  sendMessage(ws, {
    type: 'connection/ready',
    connectionId: connectionId
  });
  
  // Send available tools message
  sendMessage(ws, {
    type: 'tools/update',
    tools: toolDefinitions
  });
  
  // Handle incoming messages
  ws.on('message', async (messageData) => {
    try {
      const message = JSON.parse(messageData);
      
      // Log incoming message (excluding sensitive data)
      const logSafeMessage = { ...message };
      if (logSafeMessage.authentication) {
        logSafeMessage.authentication = '[REDACTED]';
      }
      logger.debug(`Received message: ${JSON.stringify(logSafeMessage)}`);
      
      // Handle different message types
      switch (message.type) {
        case 'authentication/token':
          handleAuthentication(connectionId, message);
          break;
          
        case 'tools/invoke':
          if (!connections.get(connectionId).authenticated) {
            sendError(ws, message.id, 'Not authenticated', 401);
            break;
          }
          await handleToolInvocation(connectionId, message);
          break;
          
        case 'tools/list':
          if (!connections.get(connectionId).authenticated) {
            sendError(ws, message.id, 'Not authenticated', 401);
            break;
          }
          sendMessage(ws, {
            type: 'tools/list',
            id: message.id,
            tools: toolDefinitions
          });
          break;
          
        default:
          logger.warn(`Unknown message type: ${message.type}`);
          sendError(ws, message.id, `Unknown message type: ${message.type}`, 400);
      }
    } catch (error) {
      logger.error(`Error processing message: ${error.message}`);
      sendError(ws, null, 'Invalid message format', 400);
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    logger.info(`WebSocket connection closed: ${connectionId}`);
    clearInterval(pingInterval);
    connections.delete(connectionId);
  });
  
  // Handle connection errors
  ws.on('error', (error) => {
    logger.error(`WebSocket error for ${connectionId}: ${error.message}`);
  });
});

// Authentication handler
function handleAuthentication(connectionId, message) {
  const connection = connections.get(connectionId);
  const ws = connection.ws;
  
  if (!message.authentication || !message.authentication.token) {
    sendError(ws, message.id, 'Authentication token required', 401);
    return;
  }
  
  // Compare with configured API key
  if (message.authentication.token === API_KEY) {
    connection.authenticated = true;
    logger.info(`Client authenticated: ${connectionId}`);
    
    // Send success response
    sendMessage(ws, {
      type: 'authentication/success',
      id: message.id
    });
    
    // Send tools update after successful authentication
    sendMessage(ws, {
      type: 'tools/update',
      tools: toolDefinitions
    });
  } else {
    logger.warn(`Failed authentication attempt: ${connectionId}`);
    sendError(ws, message.id, 'Invalid authentication token', 401);
  }
}

// Tool invocation handler
async function handleToolInvocation(connectionId, message) {
  const connection = connections.get(connectionId);
  const ws = connection.ws;
  
  if (!message.name || !whmTools.find(t => t.name === message.name)) {
    sendError(ws, message.id, `Unknown tool: ${message.name}`, 400);
    return;
  }
  
  const tool = whmTools.find(t => t.name === message.name);
  
  try {
    logger.info(`Invoking tool ${message.name} with request ID ${message.id}`);
    
    // Track pending request
    connection.pendingRequests.set(message.id, {
      tool: message.name,
      startTime: Date.now()
    });
    
    // Execute tool function
    const result = await tool.function(message.parameters || {});
    
    // Request completed
    connection.pendingRequests.delete(message.id);
    
    // Send success response
    sendMessage(ws, {
      type: 'tools/invoke/response',
      id: message.id,
      result: result
    });
    
    logger.info(`Tool ${message.name} execution completed for request ${message.id}`);
  } catch (error) {
    logger.error(`Tool ${message.name} execution failed: ${error.message}`);
    connection.pendingRequests.delete(message.id);
    sendError(ws, message.id, `Tool execution failed: ${error.message}`, 500);
  }
}

// Helper to send messages
function sendMessage(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    
    // Log outgoing message (for debugging)
    logger.debug(`Sent message: ${JSON.stringify(message)}`);
  }
}

// Helper to send error responses
function sendError(ws, requestId, errorMessage, statusCode = 500) {
  sendMessage(ws, {
    type: 'error',
    id: requestId,
    error: {
      message: errorMessage,
      status: statusCode
    }
  });
}

// Start the server
server.listen(PORT, () => {
  logger.info(`MCP Server listening on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  logger.info('Server shutting down...');
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.terminate();
  });
  
  server.close(() => {
    logger.info('Server shutdown complete');
    process.exit(0);
  });
});

module.exports = server; // Export for testing