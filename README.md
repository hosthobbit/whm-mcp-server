# WHM MCP Server

A secure MCP server for Cursor integration.

## Features

- Model Context Protocol (MCP) support
- Server-Sent Events (SSE) endpoint
- Detailed logging
- Compatible with older Node.js versions
- Support for custom tools

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/hosthobbit/whm-mcp-server.git
   cd whm-mcp-server
   ```

2. Start the MCP server:
   ```
   node mcp-server-compat.js
   ```
   
   The server runs on port 3001 by default.

3. To run on a different port:
   ```
   PORT=4444 node mcp-server-compat.js
   ```

## Endpoints

The server includes the following endpoints:

- `GET /` - Root endpoint, returns server info
- `GET /sse` - Server-Sent Events endpoint for MCP integration

## Tools

The MCP server provides the following tools:

- `example_tool` - An example tool that echoes back a message
- `get_server_status` - Returns the current server status, uptime, and memory usage

## Integration with Cursor

1. Open Cursor IDE
2. Go to Settings
3. Add the following to your `mcp.json` configuration:

```json
{
  "mcpServers": {
    "whm": {
      "url": "http://localhost:3001/sse"
    }
  }
}
```

4. Replace `localhost` with your server's hostname or IP address if deployed elsewhere

## Production Deployment

For production deployment:

1. Deploy to your VPS or server
2. Ensure the server is accessible via HTTP
3. Update your Cursor configuration to point to the deployed server
4. Consider using a process manager like PM2:
   ```
   npm install -g pm2
   pm2 start mcp-server-compat.js
   ```

## Port Configuration

The server uses port 3001 by default to avoid conflicts with common applications:
- Port 3000 is often used by other web applications
- To change the port, set the PORT environment variable:
  ```
  PORT=5000 node mcp-server-compat.js
  ```

## License

MIT