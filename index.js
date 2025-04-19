const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const { createLogger, format, transports } = require('winston');
const { whmTools } = require('./whm-admin-mcp');

// Load environment variables
dotenv.config();

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

// Initialize Express app
const app = express();
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Set up WebSocket server
const wss = new WebSocket.Server({ server });

// Server info
const PORT = process.env.PORT || 3001;
const SERVER_NAME = 'WHM Administration MCP Server';
const SERVER_VERSION = '1.0.0';

// Available tools from WHM admin module
const availableTools = whmTools;

// Store active connections
const connections = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const connectionId = Date.now().toString();
  connections.set(connectionId, { ws, name: 'unknown' });
  
  logger.info(`New connection established: ${connectionId}`);
  
  // Send connection/ready message immediately upon connection
  const readyMessage = {
    type: 'connection/ready',
    data: {
      name: SERVER_NAME,
      version: SERVER_VERSION
    }
  };
  ws.send(JSON.stringify(readyMessage));
  
  // Send available tools right after connection/ready
  const toolsMessage = {
    type: 'tools/update',
    data: {
      tools: availableTools
    }
  };
  ws.send(JSON.stringify(toolsMessage));
  
  ws.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      logger.debug(`Received message: ${JSON.stringify(parsedMessage)}`);
      
      // Handle different message types
      switch (parsedMessage.type) {
        case 'connection/ping':
          ws.send(JSON.stringify({
            type: 'connection/pong',
            data: parsedMessage.data || {}
          }));
          break;
          
        case 'connection/hello':
          const name = parsedMessage.data?.name || 'unknown';
          connections.set(connectionId, { ws, name });
          logger.info(`Client identified as: ${name}`);
          
          // Respond with server info
          ws.send(JSON.stringify({
            type: 'connection/hello',
            data: {
              name: SERVER_NAME,
              version: SERVER_VERSION
            }
          }));
          break;
          
        case 'tools/request':
          // Respond with available tools
          ws.send(JSON.stringify({
            type: 'tools/update',
            data: {
              tools: availableTools
            }
          }));
          break;
          
        case 'tool/invoke':
          const { id, name, parameters } = parsedMessage.data;
          
          // Find the tool implementation
          const toolFunction = availableTools.find(tool => tool.name === name)?.function;
          
          if (!toolFunction) {
            ws.send(JSON.stringify({
              type: 'tool/response',
              data: {
                id,
                status: 'error',
                error: {
                  message: `Tool not found: ${name}`
                }
              }
            }));
            break;
          }
          
          try {
            logger.info(`Invoking tool: ${name}`);
            // Execute the tool function
            const result = await toolFunction(parameters);
            
            // Send successful response
            ws.send(JSON.stringify({
              type: 'tool/response',
              data: {
                id,
                status: 'success',
                result
              }
            }));
          } catch (error) {
            logger.error(`Error executing tool ${name}: ${error.message}`);
            
            // Send error response
            ws.send(JSON.stringify({
              type: 'tool/response',
              data: {
                id,
                status: 'error',
                error: {
                  message: error.message
                }
              }
            }));
          }
          break;
          
        default:
          logger.warn(`Unknown message type: ${parsedMessage.type}`);
      }
    } catch (error) {
      logger.error(`Error processing message: ${error.message}`);
    }
  });
  
  ws.on('close', () => {
    logger.info(`Connection closed: ${connectionId}`);
    connections.delete(connectionId);
  });
  
  ws.on('error', (error) => {
    logger.error(`WebSocket error: ${error.message}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    serverName: SERVER_NAME,
    version: SERVER_VERSION,
    connections: connections.size
  });
});

// Start the server
server.listen(PORT, () => {
  logger.info(`${SERVER_NAME} running on port ${PORT}`);
  logger.info(`WebSocket server available at ws://localhost:${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});