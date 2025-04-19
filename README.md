# WHM Administration MCP Server

A specialized MCP (Machine Conversion Protocol) server for WebHost Manager (WHM) administration through Cursor IDE.

## Features

- **Admin Tools**: Manage cPanel accounts, monitor server status, and perform administrative tasks
- **MCP Protocol Support**: Full implementation of the MCP protocol for Cursor and Claude integration
- **Secure Authentication**: API key authentication for all protected routes

## Setup Instructions

1. Clone this repository:
   ```
   git clone https://github.com/hosthobbit/whm-mcp-server.git
   cd whm-mcp-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your configuration:
   ```
   PORT=3001
   WHM_API_URL=https://yourdomain.com:2087/json-api/
   WHM_API_TOKEN=your_whm_api_token
   ```

4. Start the server:
   ```
   node index.js
   ```

## WHM API Integration

This server requires a WHM API token for authentication with your WHM server. To generate a token:

1. Log in to your WHM as root
2. Navigate to Development → Manage API Tokens
3. Create a new token and set appropriate permissions
4. Copy the token to your `.env` file

## Available MCP Tools

| Tool Name | Description |
|-----------|-------------|
| whm_list_accounts | List all cPanel accounts on the server |
| whm_create_account | Create a new cPanel account |
| whm_suspend_account | Suspend a cPanel account |
| whm_unsuspend_account | Unsuspend a cPanel account |
| whm_terminate_account | Permanently terminate a cPanel account |
| whm_server_status | Get server status information |
| whm_list_domains | List all domains on the server |
| whm_backup_account | Create a backup of a cPanel account |

## Using with Cursor & Claude

1. Configure your Cursor IDE to connect to your MCP server
2. Add the following to your `mcp.json` file:
   ```json
   {
     "mcpEndpoint": "ws://your-server-ip:3001"
   }
   ```
3. Once connected, Claude will have access to all WHM administration tools

## Production Deployment

For production use, we recommend:

1. Running behind a reverse proxy (Nginx/Apache) with SSL
2. Using PM2 for process management:
   ```
   npm install -g pm2
   pm2 start index.js --name "whm-mcp-server"
   ```

## Troubleshooting

If Cursor cannot discover tools:
1. Check that the server is running and accessible
2. Verify the WebSocket connection is properly configured
3. Examine server logs for any protocol errors

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.