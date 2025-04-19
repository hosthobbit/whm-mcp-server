# WHM Management Control Panel Server

A Node.js API server that provides a management interface for WHM/cPanel servers. This project allows system administrators to manage their WHM server through a RESTful API.

## Features

- **Account Management**: Create, suspend, unsuspend, and terminate user accounts
- **Server Management**: Monitor server status, load, and manage services and updates
- **Domain Management**: Add and remove domains from accounts
- **Email Management**: Create and manage email accounts
- **SSL Management**: Install and manage SSL certificates
- **Backup Management**: Configure and manage server backups
- **API Documentation**: Comprehensive API documentation

## Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- WHM/cPanel server with API access
- WHM API Token

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hosthobbit/whm-mcp-server.git
   cd whm-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure the environment variables in the `.env` file:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=production
   API_KEY=your_secure_api_key

   # WHM API Configuration
   WHM_API_URL=https://your-server.com:2087
   WHM_API_USERNAME=root
   WHM_API_TOKEN=your_whm_api_token
   ```

## Usage

### Starting the Server

Start the server using:

```bash
npm start
```

For development with automatic reloading:

```bash
npm run dev
```

On Windows, you can also use the provided batch file:

```bash
start-server.bat
```

### API Authentication

All API endpoints require authentication using an API key. Include your API key in the request header:

```
X-API-KEY: your_secure_api_key
```

### API Endpoints

#### Account Management

- `GET /api/accounts` - List all accounts
- `GET /api/accounts/:username` - Get account details
- `POST /api/accounts` - Create a new account
- `POST /api/accounts/:username/suspend` - Suspend an account
- `POST /api/accounts/:username/unsuspend` - Unsuspend an account
- `DELETE /api/accounts/:username` - Terminate an account
- `PUT /api/accounts/:username/package` - Change account package

#### Server Management

- `GET /api/server/status` - Get server status
- `GET /api/server/load` - Get server load
- `GET /api/server/services` - Get service status
- `POST /api/server/services/:service/restart` - Restart a service
- `GET /api/server/updates` - Check for updates
- `POST /api/server/updates` - Start server update

#### Domain Management

- `GET /api/domains/:username` - List domains for account
- `POST /api/domains/:username` - Add domain to account
- `DELETE /api/domains/:username/:domain` - Delete domain from account

#### API Documentation

- `GET /docs` - View API documentation

## Example Client

An example client application is included in the `examples` directory. This Node.js script demonstrates how to interact with the API:

```bash
cd examples
node client.js
```

Be sure to configure the API key in the client script before running.

## Security Considerations

- Always use HTTPS in production
- Keep your API keys secure and rotate them regularly
- Implement rate limiting to prevent abuse
- Use strong passwords for WHM accounts
- Regularly update the server and dependencies

## Development

### Project Structure

```
whm-mcp-server/
├── src/
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Custom middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── index.js           # Application entry point
├── examples/              # Example client applications
├── .env.example           # Example environment variables
├── .gitignore             # Git ignore file
├── package.json           # Dependency management
└── README.md              # Documentation
```

### Adding New Features

To add a new feature:

1. Create a controller in `src/controllers/`
2. Create a route file in `src/routes/`
3. Add the route to `src/index.js`
4. Update the documentation in `src/routes/docs.routes.js`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This software is provided "as is", without warranty of any kind. Use at your own risk.

## Support

For issues and support, please [open an issue](https://github.com/hosthobbit/whm-mcp-server/issues) on GitHub.