/**
 * Debug-focused MCP server for Cursor integration
 * Run with: node debug-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('Created logs directory');
}

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${message}`);
  
  // Also write to file
  fs.appendFileSync(
    path.join(logsDir, 'debug.log'),
    `${timestamp} - ${message}\n`
  );
}

// Create a basic HTTP server
const server = http.createServer((req, res) => {
  log(`Request: ${req.method} ${req.url}`);
  
  // Log headers
  log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  
  // Handle SSE endpoint
  if (req.url === '/events') {
    log('SSE connection request received');
    
    // Set SSE headers with detailed logging
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    };
    
    log(`Setting SSE headers: ${JSON.stringify(headers, null, 2)}`);
    res.writeHead(200, headers);
    
    log('SSE connection established');
    
    // Send initial message
    const initialMessage = JSON.stringify({ message: 'Connected to SSE' });
    log(`Sending initial message: data: ${initialMessage}\n\n`);
    res.write(`data: ${initialMessage}\n\n`);
    
    // MCP-specific connection message
    const mcpMessage = JSON.stringify({ type: 'connection', status: 'ready' });
    log(`Sending MCP connection message: data: ${mcpMessage}\n\n`);
    res.write(`data: ${mcpMessage}\n\n`);
    
    // Send ping every 5 seconds
    const interval = setInterval(() => {
      const pingData = JSON.stringify({ type: 'ping', time: new Date().toISOString() });
      log(`Sending ping: data: ${pingData}\n\n`);
      res.write(`data: ${pingData}\n\n`);
    }, 5000);
    
    // Handle connection close
    req.on('close', () => {
      clearInterval(interval);
      log('SSE connection closed');
    });
    
    return;
  }
  
  // Handle root endpoint
  if (req.url === '/') {
    log('Root endpoint accessed');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Debug MCP Server', 
      endpoints: { sse: '/events' } 
    }));
    return;
  }
  
  // 404 for everything else
  log(`404 - Not found: ${req.url}`);
  res.writeHead(404);
  res.end('Not found');
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  log(`Server running at http://localhost:${PORT}/`);
  log(`SSE endpoint available at http://localhost:${PORT}/events`);
});