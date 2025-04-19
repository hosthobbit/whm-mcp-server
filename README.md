# WHM Management Control Panel (MCP) Server

A Node.js server application that connects to a WHM (Web Host Manager) server for account administration and server management. This MCP server acts as a secure middleware layer between your applications and WHM's API.

![WHM MCP Server](https://raw.githubusercontent.com/hosthobbit/whm-mcp-server/main/docs/images/whm-mcp-logo.png)

## Features

- **Account Management**: Create, modify, suspend, unsuspend, and terminate cPanel accounts
- **Server Information**: Get detailed server status, load, and service information
- **Server Maintenance**: Restart services, check for updates, and perform server updates
- **Domain Management**: Add, list, and remove domains from accounts
- **SSL Certificate Management**: List and install SSL certificates
- **Backup Management**: List backups, start backup jobs, and restore from backups
- **Email Account Management**: Create, list, and delete email accounts
- **API Key Authentication**: Secure API access with API key authentication

## Installation

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- Git (optional, for cloning the repository)
- Access to a WHM server with API token

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hosthobbit/whm-mcp-server.git
   cd whm-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory with the following settings:
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

   > **Note**: Replace the placeholder values with your actual WHM server details and create a secure API key.

4. **How to get your WHM API Token**:

   a. Log in to your WHM server as root.
   
   b. Navigate to **Development** → **Manage API Tokens**.
   
   c. Click **Generate Token** and follow the instructions.
   
   d. Copy the token and paste it in your `.env` file.

5. **Start the server**:

   For production:
   ```bash
   npm start
   ```

   For development (with auto-reload):
   ```bash
   npm run dev
   ```

   On Windows, you can also use the included batch file:
   ```
   start-server.bat
   ```

## API Documentation

Once the server is running, you can access the API documentation at:
```
http://localhost:3000/docs
```

The API endpoints are organized by resource type:

- `/api/accounts` - Account management operations
- `/api/server` - Server information and operations
- `/api/domains` - Domain management
- `/api/ssl` - SSL certificate management
- `/api/backups` - Backup management operations
- `/api/email` - Email account management

## Authentication

All API endpoints (except `/docs`) require authentication. Include your API key in the request header:

```
X-API-KEY: your-secret-api-key-here
```

## Example Usage

### Using cURL

```bash
# Get all accounts
curl -X GET http://localhost:3000/api/accounts \
  -H "X-API-KEY: your-secret-api-key-here"

# Create a new account
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-secret-api-key-here" \
  -d '{"username": "newuser", "domain": "example.com", "password": "securepassword", "pkgname": "default"}'
```

### Using the Client Example

The repository includes a command-line client example in `examples/client.js`:

```bash
# Run the client example
node examples/client.js
```

Follow the interactive menu to perform various WHM operations.

### Using in Your Applications

```javascript
const axios = require('axios');

// Create API client
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': 'your-secret-api-key-here'
  }
});

// Example: Get server status
async function getServerStatus() {
  try {
    const response = await api.get('/api/server/status');
    console.log('Server Status:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

getServerStatus();
```

## Security Considerations

1. **Always use HTTPS in production**: Set up SSL/TLS for your MCP server in production environments.

2. **Secure your API key**: Use a strong, random API key and keep it secret.

3. **Restrict access**: Use firewall rules to restrict access to your MCP server.

4. **Regular updates**: Keep the server and its dependencies updated.

5. **WHM API Token security**: Use a separate API token for this application and limit its permissions to only what's needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This software is not affiliated with or endorsed by cPanel, Inc. or WHM. Use at your own risk and ensure proper security measures are in place before using in production environments.