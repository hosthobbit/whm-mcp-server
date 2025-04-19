# WHM Administration MCP Server

This is a WebHost Manager (WHM) administration server implementing the [Model-Client-Proxy (MCP) protocol](https://github.com/cursor-ai/model-client-proxy-protocol), allowing you to administer your WHM server directly through Cursor AI.

## Features

- Use Cursor AI to manage your WHM/cPanel server
- List, create, suspend, and terminate cPanel accounts
- View server status information
- List domains and manage domain settings
- Create account backups
- Supports both live WHM API connection and mock data for testing

## Setup

1. Clone this repository:
   ```
   git clone https://github.com/hosthobbit/whm-mcp-server.git
   cd whm-mcp-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your WHM API credentials:
   ```
   WHM_API_URL=https://yourserver.com:2087
   WHM_API_USERNAME=root
   WHM_API_TOKEN=your_api_token
   ```

4. Start the server:
   ```
   npm start
   ```

The server will run on port 3001 by default. You can change this by setting the `PORT` environment variable.

## Integration with Cursor

1. Point Cursor to your MCP server by adding this to your `~/.cursor/mcp.json` file:
   ```json
   {
     "mcpServers": [
       {
         "url": "ws://your-server-address:3001",
         "authentication": {
           "type": "none"
         }
       }
     ]
   }
   ```

2. Once connected, Cursor AI will have access to all WHM administration tools.

## Available Tools

The WHM MCP server provides the following tools:

### whm_list_accounts
List all cPanel accounts on the server. Optionally filter by search string.

Parameters:
- `search` (optional): Search string to filter accounts

### whm_create_account
Create a new cPanel account.

Parameters:
- `username`: Username for the new account
- `domain`: Primary domain for the account
- `plan` (optional): Hosting plan for the account
- `email`: Email address for the account owner

### whm_suspend_account
Suspend a cPanel account.

Parameters:
- `username`: Username of the account to suspend
- `reason` (optional): Reason for suspension

### whm_unsuspend_account
Unsuspend a cPanel account.

Parameters:
- `username`: Username of the account to unsuspend

### whm_terminate_account
Permanently terminate a cPanel account.

Parameters:
- `username`: Username of the account to terminate
- `keepdns` (optional): Whether to keep DNS entries after termination

### whm_server_status
Get server status information (load, memory, disk usage).

### whm_list_domains
List all domains on the server.

Parameters:
- `account` (optional): Account username to filter domains

### whm_backup_account
Create a backup of a cPanel account.

Parameters:
- `username`: Username of the account to backup
- `email` (optional): Email to send notification when backup is complete

## Mock Mode

If WHM API credentials are not configured, the server will run in mock mode, using sample data. This is useful for development and testing.

## Deployment

For production deployment, it's recommended to:

1. Use a process manager like PM2:
   ```
   npm install -g pm2
   pm2 start index.js --name whm-mcp
   ```

2. Set up SSL for secure WebSocket connections (wss://):
   - Configure a reverse proxy like Nginx
   - Update your `mcp.json` to use `wss://` instead of `ws://`

3. Add proper authentication (coming soon)

## License

MIT