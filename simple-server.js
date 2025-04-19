/**
 * Ultra-simple SSE server for Cursor integration
 * Run with: node simple-server.js
 */

const http = require('http');

// Create a basic HTTP server
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Handle SSE endpoint
  if (req.url === '/events') {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    console.log('SSE connection established');
    
    // Send initial message
    res.write(`data: ${JSON.stringify({ message: 'Connected to SSE' })}\n\n`);
    
    // Send ping every 5 seconds
    const interval = setInterval(() => {
      console.log('Sending ping');
      res.write(`data: ${JSON.stringify({ type: 'ping', time: new Date().toISOString() })}\n\n`);
    }, 5000);
    
    // Handle connection close
    req.on('close', () => {
      clearInterval(interval);
      console.log('Connection closed');
    });
    
    return;
  }
  
  // Handle root endpoint
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Simple SSE Server', 
      endpoints: { sse: '/events' } 
    }));
    return;
  }
  
  // 404 for everything else
  res.writeHead(404);
  res.end('Not found');
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`SSE endpoint available at http://localhost:${PORT}/events`);
});