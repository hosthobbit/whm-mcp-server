/**
 * Example client for testing the WHM MCP server
 * 
 * This script demonstrates how to connect to the MCP server 
 * and call WHM tools through the Model Context Protocol
 */

const EventSource = require('eventsource');
const fetch = require('node-fetch');

// MCP Server URL - update this to your server's address
const MCP_SERVER_URL = 'http://localhost:3000';

// Client ID for tracking requests
let clientId = null;
let messageCounter = 1;

// Connect to the MCP server via SSE
console.log('Connecting to MCP server...');
const eventSource = new EventSource(`${MCP_SERVER_URL}/sse`);

// Handle connection open
eventSource.onopen = () => {
  console.log('SSE connection established');
};

// Handle messages from the server
eventSource.onmessage = async (event) => {
  const data = JSON.parse(event.data);
  console.log(`Received message: ${JSON.stringify(data, null, 2)}`);
  
  // Store client ID from connection/ready message
  if (data.method === 'connection/ready') {
    clientId = data.id;
    console.log(`Assigned client ID: ${clientId}`);
  }
  
  // When tools are ready, request the list of available tools
  if (data.method === 'tools/ready') {
    await listTools();
  }
};

// Handle errors
eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
};

/**
 * Request list of available tools
 */
async function listTools() {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: (messageCounter++).toString(),
        method: 'tools/list'
      })
    });
    
    const data = await response.json();
    console.log('Available WHM tools:');
    
    if (data.result && data.result.tools) {
      data.result.tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });
      
      // After getting tools, make a sample call
      await getServerStatus();
    }
  } catch (error) {
    console.error('Error requesting tools:', error);
  }
}

/**
 * Call a sample WHM tool to get server status
 */
async function getServerStatus() {
  try {
    console.log('\nTesting server status tool...');
    const response = await fetch(`${MCP_SERVER_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: (messageCounter++).toString(),
        method: 'tools/call',
        params: {
          name: 'whm_server_status',
          arguments: {}
        }
      })
    });
    
    const data = await response.json();
    console.log('Server status response:');
    console.log(JSON.stringify(data.result, null, 2));
    
    // Close the connection after testing
    setTimeout(() => {
      eventSource.close();
      console.log('Test completed and connection closed');
    }, 1000);
  } catch (error) {
    console.error('Error getting server status:', error);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Closing connection...');
  eventSource.close();
  process.exit(0);
});