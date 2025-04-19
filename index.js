require('dotenv').config();
const { startWhmAdminServer } = require('./whm-admin-mcp');

// Start the WHM administration MCP server
const PORT = process.env.PORT || 3001;
startWhmAdminServer(PORT);

console.log(`WHM MCP Server running on port ${PORT}`);