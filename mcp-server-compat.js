/**
 * MCP server implementation following 2025-03-26 specification
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');

// Client connections
const clients = new Map();
let clientIdCounter = 0;

// Available tools with proper schema definitions
const availableTools = [
  {
    name: "codebase_search",
    description: "Find snippets of code from the codebase most relevant to the search query",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant code"
        },
        target_directories: {
          type: "array",
          items: { type: "string" },
          description: "Glob patterns for directories to search over"
        },
        explanation: {
          type: "string",
          description: "One sentence explanation as to why this tool is being used"
        }
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
        target_file: {
          type: "string",
          description: "Path to the file"
        },
        should_read_entire_file: {
          type: "boolean",
          description: "Whether to read entire file"
        },
        start_line_one_indexed: {
          type: "integer",
          description: "Start line (1-indexed)"
        },
        end_line_one_indexed_inclusive: {
          type: "integer",
          description: "End line (1-indexed, inclusive)"
        },
        explanation: {
          type: "string",
          description: "One sentence explanation as to why this tool is being used"
        }
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
        target_file: {
          type: "string",
          description: "Path to the file to edit"
        },
        instructions: {
          type: "string",
          description: "Instructions for the edit"
        },
        code_edit: {
          type: "string",
          description: "The code edit to apply"
        }
      },
      required: ["target_file", "instructions", "code_edit"]
    }
  },
  {
    name: "list_dir",
    description: "List contents of a directory",
    parameters: {
      type: "object",
      properties: {
        relative_workspace_path: {
          type: "string",
          description: "Path to list contents of"
        },
        explanation: {
          type: "string",
          description: "One sentence explanation as to why this tool is being used"
        }
      },
      required: ["relative_workspace_path"]
    }
  },
  {
    name: "grep_search",
    description: "Fast text-based regex search",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The regex pattern to search for"
        },
        include_pattern: {
          type: "string",
          description: "Glob pattern for files to include"
        },
        exclude_pattern: {
          type: "string",
          description: "Glob pattern for files to exclude"
        },
        case_sensitive: {
          type: "boolean",
          description: "Whether the search should be case sensitive"
        },
        explanation: {
          type: "string",
          description: "One sentence explanation as to why this tool is being used"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "run_terminal_cmd",
    description: "Run a terminal command",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The terminal command to execute"
        },
        is_background: {
          type: "boolean",
          description: "Whether to run in background"
        },
        explanation: {
          type: "string",
          description: "One sentence explanation as to why this command needs to be run"
        }
      },
      required: ["command", "is_background"]
    }
  }
];

// Parse JSON request body
const parseJsonBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (body) {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      } else {
        resolve({});
      }
    });
  });
};

// Send SSE message
const sendSSEMessage = (res, data) => {
  const message = JSON.stringify(data);
  console.log(`Sending SSE message: ${message}`);
  res.write(`data: ${message}\n\n`);
};

// Send capabilities message
const sendCapabilities = (res) => {
  sendSSEMessage(res, {
    jsonrpc: "2.0",
    method: "server/capabilities",
    params: {
      capabilities: {
        tools: true,
        resources: true
      },
      tools: availableTools
    }
  });
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  // SSE endpoint
  if (pathname === '/sse' && req.method === 'GET') {
    console.log(`${timestamp} - SSE connection request received`);
    console.log(`${timestamp} - Headers: ${JSON.stringify(req.headers)}`);

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const clientId = (++clientIdCounter).toString();
    
    // Store client connection
    clients.set(clientId, {
      res,
      lastActivity: Date.now(),
      initialized: false
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log(`${timestamp} - Client disconnected: ${clientId}`);
      clients.delete(clientId);
    });

    // Send initial connection message
    sendSSEMessage(res, {
      jsonrpc: "2.0",
      method: "connection/ready",
      params: {
        session_id: clientId,
        protocol_version: "2025-03-26",
        server_info: {
          name: "WHM MCP Server",
          version: "1.0.0",
          capabilities: ["tools", "resources"]
        }
      }
    });

    // Send capabilities after a short delay
    setTimeout(() => {
      sendCapabilities(res);
      
      // Send a second capabilities message after another delay
      setTimeout(() => {
        sendCapabilities(res);
      }, 1000);
    }, 500);

    console.log(`${timestamp} - SSE connection established for client: ${clientId}`);
    return;
  }

  // Handle JSON-RPC messages
  if (pathname === '/messages' && req.method === 'POST') {
    const queryParams = querystring.parse(parsedUrl.query);
    const sessionId = queryParams.sessionId;

    if (!sessionId || !clients.has(sessionId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid session"
        }
      }));
      return;
    }

    try {
      const body = await parseJsonBody(req);
      console.log(`${timestamp} - Received message: ${JSON.stringify(body)}`);

      const { id, method, params } = body;

      if (!id || !method) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32600,
            message: "Invalid Request"
          }
        }));
        return;
      }

      const client = clients.get(sessionId);

      // Handle initialize request
      if (method === "initialize") {
        client.initialized = true;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: {
            capabilities: {
              tools: true,
              resources: true
            }
          }
        }));

        // Send capabilities again after initialization
        sendCapabilities(client.res);
        return;
      }

      // Handle tool invocation
      if (method === "invoke") {
        const { name, parameters } = params;
        const tool = availableTools.find(t => t.name === name);

        if (!tool) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Tool '${name}' not found`
            }
          }));
          return;
        }

        // Mock tool execution
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: {
            status: "success",
            data: `Executed ${name} with parameters: ${JSON.stringify(parameters)}`
          }
        }));
        return;
      }

      // Handle unknown method
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method '${method}' not found`
        }
      }));

    } catch (error) {
      console.error(`${timestamp} - Error:`, error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error"
        }
      }));
    }
    return;
  }

  // 404 for unknown endpoints
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Start server
const PORT = process.env.PORT || 4444;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - MCP Server running at http://${HOST}:${PORT}/`);
});