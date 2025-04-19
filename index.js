// Main entry point for WHM MCP Server
const whmAdminMCP = require('./whm-admin-mcp');

// Start the server
whmAdminMCP.start();

console.log('WHM MCP Server started! Check logs for details.');