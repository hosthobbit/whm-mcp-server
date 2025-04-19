# WebHost Manager (WHM) MCP Server

A specialized MCP (Model, Channel, Protocol) server designed for WebHost Manager (WHM) administration through Cursor AI. This implementation allows you to manage cPanel accounts, domains, and server resources directly through Cursor's AI assistant.

## Features

- **Complete cPanel Account Management:**
  - List, create, suspend, unsuspend, and terminate accounts
  - View detailed account information
  - Change account passwords
  - Create account backups

- **Domain Management:**
  - Add domains to existing accounts
  - List all domains on the server
  - Get detailed domain information

- **Server Information:**
  - View server status (CPU, memory, disk usage)
  - List available hosting packages/plans

- **Cursor AI Integration:**
  - Chat with Cursor AI to perform WHM administrative tasks
  - No need to remember complex WHM API endpoints or parameters
  - Use natural language to manage your hosting server

## Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/hosthobbit/whm-mcp-server.git
   cd whm-mcp-server
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure the Server:**
   
   Edit the `whm-admin-mcp.js` file and update the configuration:
   ```javascript
   const config = {
     whmApiUrl: 'https://yourserver.com:2087/json-api/',  // Change to your WHM server address
     whmApiToken: 'your_api_token_here',                  // Change to your WHM API token
     mcpPort: 4444,                                       // Port for the MCP server to listen on
     mcpHost: '0.0.0.0'                                   // Interface for the MCP server to bind to
   };
   ```
   
   To generate a WHM API token, log in to your WHM interface and navigate to:
   Development > API Tokens > Generate Token

4. **Start the Server:**
   ```bash
   node whm-admin-mcp.js
   ```

5. **Configure Cursor:**
   
   Add the following to your `mcp.json` in your Cursor configuration:
   ```json
   {
     "servers": [
       {
         "name": "WHM Administration",
         "url": "http://your-server-ip:4444/sse",
         "protocol_version": "2025-03-26",
         "retryIntervalMs": 1000,
         "connectionTimeoutMs": 10000
       }
     ]
   }
   ```

## Available MCP Tools

The server provides the following tools for WHM administration:

| Tool Name | Description |
|-----------|-------------|
| `list_accounts` | List cPanel accounts on the server |
| `create_account` | Create a new cPanel account |
| `get_account_info` | Get detailed information about a cPanel account |
| `suspend_account` | Suspend a cPanel account |
| `unsuspend_account` | Unsuspend a cPanel account |
| `terminate_account` | Permanently delete a cPanel account |
| `list_packages` | List available hosting packages/plans |
| `server_status` | Get server status information (CPU, memory, disk usage) |
| `list_domains` | List all domains on the server |
| `get_domain_info` | Get information about a specific domain |
| `add_domain` | Add a domain to an existing account |
| `change_password` | Change password for a cPanel account |
| `backup_account` | Create a backup of a cPanel account |

## Usage Examples

With Cursor AI, you can perform tasks like:

- "List all cPanel accounts on my server"
- "Create a new cPanel account for domain example.com"
- "Suspend the user john_doe due to payment issues"
- "What's the current server status?"
- "Add the domain newdomain.com to the account user123"
- "Change the password for account client456"

Cursor AI will use the appropriate WHM API tools to execute these tasks.

## Security Considerations

- Store your WHM API token securely
- Consider running the MCP server behind a reverse proxy with SSL
- Only allow access to the MCP server from trusted IP addresses
- Use a strong, unique API token with minimal necessary permissions

## Troubleshooting

If you encounter issues:

1. Check server logs for any error messages
2. Verify your WHM API token has the necessary permissions
3. Ensure your WHM server is accessible from the MCP server
4. Confirm that CORS headers are properly set if accessing from different domains

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Cursor AI](https://cursor.sh/) for providing the AI assistant integration
- cPanel/WHM for their comprehensive API