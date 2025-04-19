# WHM Management Control Panel (MCP)

A Node.js server application that connects to a WHM (Web Host Manager) server for account administration and server management. This application implements the Model Context Protocol (MCP) to allow AI assistants like Claude to interact with WHM APIs.

## Features

- Account Management (create, modify, suspend, terminate)
- Server Information and Statistics
- Server Updates and Maintenance
- SSL Certificate Management
- Backup Management
- Email Account Management
- Domain Management
- Security Features
- MCP Protocol Implementation for AI Assistant integration

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure the `.env` file with your WHM server details:
   ```
   # WHM Server Configuration
   WHM_SERVER=your-server-domain.com
   WHM_PORT=2087
   WHM_USERNAME=root
   WHM_API_TOKEN=your-api-token-here

   # MCP Server Configuration
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info

   # API Authentication
   API_KEY=your-secret-api-key-here
   ```
4. Start the server:
   ```
   npm start
   ```

For development:
```
npm run dev
```

## MCP Server Configuration

To use this MCP server with AI assistants like Claude in Cursor, you need to add the following configuration to your `mcp.json` file:

```json
{
  "mcpServers": {
    "whm": {
      "url": "http://your-server-address:3000/sse"
    }
  }
}
```

## MCP Implementation Details

This server implements the Model Context Protocol using HTTP Server-Sent Events (SSE) as the transport mechanism. The implementation follows the standard JSON-RPC 2.0 format for all messages and includes:

- A `/sse` endpoint for establishing persistent connections
- A `/messages` endpoint for receiving and responding to client requests
- Proactive `connection/ready` and `tools/ready` notifications
- Standardized error handling with appropriate error codes

The MCP architecture allows AI assistants to safely interact with WHM functionality through clearly defined tools with specific parameter schemas, creating a secure bridge between language models and server management functions.

## Available MCP Tools

The MCP server exposes the following WHM functionality via tools:

### Account Management
- `whm_list_accounts` - List all WHM accounts
- `whm_create_account` - Create a new cPanel account
- `whm_account_summary` - Get account details
- `whm_suspend_account` - Suspend a cPanel account
- `whm_unsuspend_account` - Unsuspend a cPanel account
- `whm_terminate_account` - Permanently delete an account

### Server Management
- `whm_server_status` - Get server status and system stats
- `whm_server_load` - Get server load statistics 
- `whm_service_status` - Get status of server services
- `whm_restart_service` - Restart a specific server service
- `whm_check_updates` - Check for available updates
- `whm_start_update` - Start server update process

### Domain Management
- `whm_list_domains` - List domains for an account
- `whm_add_domain` - Add a domain to an account
- `whm_delete_domain` - Remove a domain from an account

## API Documentation

The API endpoints are organized by resource type:

- `/api/accounts` - Account management operations
- `/api/server` - Server information and operations
- `/api/domains` - Domain management
- `/api/ssl` - SSL certificate management
- `/api/backups` - Backup management operations
- `/api/email` - Email account management

For detailed API documentation, see the `/docs` endpoint after starting the server.

## Security

This application requires WHM API credentials. Never share your `.env` file or expose your API tokens.

### Security Best Practices

When using this MCP server for WHM administration, follow these security recommendations:

1. **API Token Protection**: Keep your WHM API tokens secure and rotate them regularly.
2. **Use TLS/SSL**: Always deploy this server with HTTPS in production environments.
3. **Firewall Rules**: Restrict access to the MCP server by IP address where possible.
4. **Regular Updates**: Keep the WHM server updated with the latest security patches.
5. **Monitoring**: Implement monitoring to detect unusual activity or unauthorized access attempts.
6. **Backup Strategy**: Maintain regular backups of all server configurations and data.

### Root vs. Site Compromises

Be aware of the distinction between site and root compromises:
- A site compromise affects only specific websites, while a root compromise exposes the entire server.
- In case of any compromise, restore from backups and identify the entry point of the attack.
- For WHM security details, refer to the [cPanel Security Best Practices](https://docs.cpanel.net/knowledge-base/security/security-best-practices/).

## Testing

You can test the MCP server using the included example client:

```
npm run example
```

This will run a simple test client that connects to the MCP server, requests the available tools, and executes a sample command.

## License

ISC