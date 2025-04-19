# WHM MCP Server

A secure API server with authentication middleware for protected routes.

## Features

- API key authentication for protected routes
- Structured logging with Winston
- Express-based REST API
- Security middleware (Helmet)
- CORS support
- Error handling middleware
- Environment-based configuration

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/hosthobbit/whm-mcp-server.git
   cd whm-mcp-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file and replace the placeholder values with your actual configuration.

4. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

The server includes the following example endpoints:

- `GET /` - Root endpoint, returns API status
- `GET /api/examples/public` - Public endpoint (no authentication required)
- `GET /api/examples/protected` - Protected endpoint (requires API key)
- `POST /api/examples/data` - Protected endpoint for data submission (requires API key)

## Authentication

Protected routes require an API key which can be provided in one of two ways:

1. In the request headers: `x-api-key: your_api_key`
2. As a query parameter: `?apiKey=your_api_key`

The API key must match the one configured in your environment variables.

## Production Deployment

For production deployment:

1. Set the `NODE_ENV` environment variable to `production`
2. Ensure a secure `API_KEY` is configured
3. Start the server with `npm start`

## License

MIT