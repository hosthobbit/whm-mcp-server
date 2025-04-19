/**
 * Simplified test server focused solely on SSE
 * Run with: node test-sse-server.js
 */

const express = require('express');
const cors = require('cors');
const app = express();

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Enable CORS
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));

// Root route
app.get('/', (req, res) => {
  console.log('Root endpoint accessed');
  res.json({ 
    message: 'SSE Test Server',
    status: 'running',
    endpoints: {
      sse: '/events'
    }
  });
});

// SSE endpoint
app.get('/events', (req, res) => {
  console.log('SSE connection request received');
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connection', message: 'Connected to SSE stream' })}\n\n`);
  
  console.log('SSE connection established');
  
  // Function to send events
  const sendEvent = (eventData) => {
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  };
  
  // Keep the connection alive with a ping every 5 seconds
  const pingInterval = setInterval(() => {
    console.log('Sending SSE ping');
    sendEvent({ type: 'ping', timestamp: new Date().toISOString() });
  }, 5000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(pingInterval);
    console.log('SSE connection closed');
  });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`SSE Test Server running on port ${PORT}`);
  console.log(`SSE endpoint available at: http://localhost:${PORT}/events`);
});