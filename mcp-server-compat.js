const http = require('http');
const url = require('url');

const clients = new Map();
let clientIdCounter = 0;

const availableTools = [
  {
    name: "codebase_search",
    description: "Find snippets of code from the codebase most relevant to the search query",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query to find relevant code" },
        target_directories: { type: "array", items: { type: "string" }, description: "Glob patterns for directories to search over" }
      },
      required: ["query"]
    }
  },
  {
    name: "read_file",
    description: "Read contents of a file",
    parameters: {
      type: "object",
      properties: {
        target_file: { type: "string", description: "Path to the file" },
        should_read_entire_file: { type: "boolean", description: "Whether to read entire file" },
        start_line_one_indexed: { type: "integer", description: "Start line (1-indexed)" },
        end_line_one_indexed_inclusive: { type: "integer", description: "End line (1-indexed, inclusive)" }
      },
      required: ["target_file", "should_read_entire_file", "start_line_one_indexed", "end_line_one_indexed_inclusive"]
    }
  },
  {
    name: "edit_file",
    description: "Edit an existing file or create a new one",
    parameters: {
      type: "object",
      properties: {
        target_file: { type: "string", description: "Path to the file to edit" },
        instructions: { type: "string", description: "Instructions for the edit" },
        code_edit: { type: "string", description: "The code edit to apply" }
      },
      required: ["target_file", "instructions", "code_edit"]
    }
  }
];

const sendSSE = (res, data) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  
  if (parsedUrl.pathname === '/sse' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const clientId = (++clientIdCounter).toString();
    const client = { res, initialized: false };
    clients.set(clientId, client);

    req.on('close', () => clients.delete(clientId));

    // Send initial connection message
    sendSSE(res, {
      jsonrpc: "2.0",
      method: "connection/ready",
      params: {
        session_id: clientId,
        protocol_version: "2025-03-26",
        server_info: {
          name: "WHM MCP Server",
          version: "1.0.0",
          capabilities: ["tools"]
        }
      }
    });

    // Send capabilities immediately
    sendSSE(res, {
      jsonrpc: "2.0",
      method: "server/capabilities",
      params: {
        capabilities: { tools: true },
        tools: availableTools
      }
    });

    return;
  }

  if (parsedUrl.pathname === '/messages' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const message = JSON.parse(body);
        const { id, method } = message;

        if (method === 'initialize') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              capabilities: { tools: true }
            }
          }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: "2.0", id, result: {} }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          jsonrpc: "2.0", 
          error: { code: -32700, message: "Parse error" }
        }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const PORT = process.env.PORT || 4444;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});