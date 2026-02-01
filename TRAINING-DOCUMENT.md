# Training Document: Building an MCP Server for Adobe I/O Runtime with AEM Integration

This document provides a step-by-step guide for recreating an MCP (Model Context Protocol) server that runs on Adobe I/O Runtime and integrates with Adobe Experience Manager (AEM).

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Setup](#project-setup)
4. [Core Implementation](#core-implementation)
5. [AEM Integration](#aem-integration)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Client Configuration](#client-configuration)

---

## Overview

This application is an MCP server that:
- Runs as a serverless function on Adobe I/O Runtime
- Implements the Model Context Protocol using the official TypeScript SDK
- Provides tools for AEM automation (site creation, component management, etc.)
- Supports HTTP transport for stateless communication
- Includes comprehensive testing and deployment automation

### Key Components

- **MCP Server**: Main server implementation using `@modelcontextprotocol/sdk`
- **AEM Utilities**: Helper functions for AEM API interactions
- **Tools**: 12 MCP tools including echo, calculator, weather, and 9 AEM-specific tools
- **Resources**: Static content resources for AI assistants
- **Prompts**: Reusable prompt templates

---

## Prerequisites

### Required Software

1. **Node.js** (v18.19.0 or higher)
2. **npm** (comes with Node.js)
3. **Adobe I/O CLI** (`npm install -g @adobe/aio-cli`)
4. **Adobe I/O Runtime Account** with namespace access
5. **AEM Instance** (Cloud Service or local) with API access

### Required Accounts

- Adobe I/O Console account with Runtime access
- AEM Author instance credentials (username/password or bearer token)

---

## Project Setup

### 1. Initialize Project Structure

Create a new directory and initialize the project:

```bash
mkdir my-mcp-server
cd my-mcp-server
npm init -y
```

### 2. Install Dependencies

Install core dependencies:

```bash
npm install @adobe/aio-sdk@^5.0.0
npm install @modelcontextprotocol/sdk@^1.17.4
npm install axios@^1.6.0
npm install zod@^3.23.8
```

Install development dependencies:

```bash
npm install --save-dev jest@^29.0.0
npm install --save-dev @babel/core@^7.26.10
npm install --save-dev @babel/preset-env@^7.26.9
npm install --save-dev babel-loader@^9.2.1
npm install --save-dev webpack@^5.89.0
npm install --save-dev webpack-cli@^5.1.4
npm install --save-dev eslint@^8.57.0
npm install --save-dev prettier@^3.0.0
```

### 3. Create Project Structure

Create the following directory structure:

```
my-mcp-server/
├── actions/
│   └── mcp-server/
│       ├── index.js
│       ├── tools.js
│       ├── aem-utils.js
│       └── webpack.config.js
├── test/
│   ├── mcp-server.test.js
│   └── jest.setup.js
├── .env
├── app.config.yaml
├── package.json
├── jest.config.js
└── .gitignore
```

### 4. Configure package.json

Update `package.json` with scripts and metadata:

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "description": "Model Context Protocol server with Adobe I/O Runtime",
  "main": "actions/mcp-server/index.js",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "build": "webpack",
    "deploy": "npm run build && aio app deploy",
    "undeploy": "aio app undeploy",
    "dev": "aio app run",
    "start": "node actions/mcp-server/index.js",
    "lint": "eslint actions/",
    "format": "prettier --write actions/"
  },
  "engines": {
    "node": ">=18.19.0"
  }
}
```

---

## Core Implementation

### 1. Main Server Entry Point (`actions/mcp-server/index.js`)

The main server file implements the MCP protocol using the official SDK:

**Key Features:**
- Stateless pattern: Creates fresh server and transport instances per request
- HTTP transport using `StreamableHTTPServerTransport`
- CORS support for cross-origin requests
- Health check endpoint
- Error handling and logging

**Implementation Pattern:**

```javascript
const { Core } = require('@adobe/aio-sdk')
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js')
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js')
const { registerTools, registerResources, registerPrompts } = require('./tools.js')

// Create MCP server with capabilities
function createMcpServer() {
    const server = new McpServer({
        name: 'my-mcp-server',
        version: '1.0.0'
    }, {
        capabilities: {
            logging: {},
            tools: {},
            resources: {},
            prompts: {}
        }
    })
    
    registerTools(server)
    registerResources(server)
    registerPrompts(server)
    
    return server
}

// Handle MCP requests (stateless pattern)
async function handleMcpRequest(params) {
    const server = createMcpServer()
    const req = createCompatibleRequest(params)
    const res = createCompatibleResponse()
    const transport = new StreamableHTTPServerTransport({
        enableJsonResponse: true
    })
    
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
    
    return res.getResult()
}

// Main function for Adobe I/O Runtime
async function main(params) {
    // Route requests: GET (health), OPTIONS (CORS), POST (MCP protocol)
    // Return appropriate response
}
```

**Key Implementation Details:**
- Request/Response compatibility layer for Adobe I/O Runtime
- Stateless server creation per request
- Proper cleanup after request handling
- JSON-RPC 2.0 error handling

### 2. Tools Registration (`actions/mcp-server/tools.js`)

This file registers all MCP tools, resources, and prompts.

**Tool Registration Pattern:**

```javascript
const { z } = require('zod')

function registerTools(server) {
    // Basic tool example
    server.tool(
        'tool-name',
        'Tool description',
        {
            param1: z.string().describe('Parameter description')
        },
        async ({ param1 }) => {
            return {
                content: [{
                    type: 'text',
                    text: `Result: ${param1}`
                }]
            }
        }
    )
}
```

**Tools Implemented:**

1. **Basic Tools:**
   - `echo`: Echo back messages for testing
   - `calculator`: Mathematical calculations
   - `weather`: Weather information (mock data)

2. **AEM Site Management Tools:**
   - `aem-create-microsite`: Create microsites with page structure
   - `aem-list-templates`: List available site templates
   - `aem-list-sites`: List existing sites
   - `aem-get-site-info`: Get site details
   - `aem-delete-site`: Delete sites (with confirmation)

3. **AEM Extended Tools:**
   - `aem-create-component`: Create components with dialogs
   - `aem-create-content-fragment`: Create content fragments
   - `aem-upload-asset`: Upload assets to DAM
   - `aem-start-workflow`: Start AEM workflows

**Resource Registration:**

```javascript
function registerResources(server) {
    server.resource(
        'resource-id',
        'resource://uri',
        {
            name: 'Resource Name',
            description: 'Description',
            mimeType: 'text/plain'
        },
        async () => {
            return {
                contents: [{
                    uri: 'resource://uri',
                    text: 'Content here',
                    mimeType: 'text/plain'
                }]
            }
        }
    )
}
```

**Prompt Registration:**

```javascript
function registerPrompts(server) {
    server.prompt(
        'prompt-id',
        'Prompt description',
        {
            param: z.string().optional().describe('Parameter')
        },
        async ({ param }) => {
            return {
                messages: [{
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Prompt template with ${param}`
                    }
                }]
            }
        }
    )
}
```

---

## AEM Integration

### 1. AEM Client Utility (`actions/mcp-server/aem-utils.js`)

The AEM utilities module provides a client class for interacting with AEM APIs.

**AEMClient Class:**

```javascript
const axios = require('axios')

class AEMClient {
    constructor(authorUrl, credentials) {
        this.authorUrl = authorUrl.replace(/\/$/, '')
        this.credentials = credentials
        this.axiosInstance = axios.create({
            baseURL: this.authorUrl,
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        })
        
        // Setup authentication
        if (credentials.token) {
            this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${credentials.token}`
        } else if (credentials.username && credentials.password) {
            this.axiosInstance.defaults.auth = {
                username: credentials.username,
                password: credentials.password
            }
        }
    }
}
```

**Key Methods:**

1. **Site Management:**
   - `createSite()`: Create a site using Quick Site Creation
   - `createMicrosite()`: Create microsite with initial pages
   - `listSites()`: List sites under a path
   - `getSiteInfo()`: Get site information
   - `deleteSite()`: Delete a site

2. **Component Management:**
   - `createComponent()`: Create component with dialog and HTL template
   - `createComponentDialog()`: Create dialog configuration
   - `generateHTLTemplate()`: Generate HTL template code

3. **Content Management:**
   - `createContentFragment()`: Create content fragments
   - `uploadAsset()`: Upload assets to DAM
   - `startWorkflow()`: Start AEM workflows

**Site Creation Pattern:**

```javascript
async createSite(siteConfig) {
    const { siteName, siteTitle, templatePath, parentPath } = siteConfig
    
    // Sanitize site name
    const sanitizedSiteName = siteName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '-')
    
    // Create site using Sling POST servlet
    const formData = new URLSearchParams()
    formData.append('jcr:primaryType', 'cq:Page')
    formData.append('jcr:content/jcr:primaryType', 'cq:PageContent')
    formData.append('jcr:content/jcr:title', siteTitle)
    formData.append('jcr:content/cq:template', templatePath)
    // ... additional properties
    
    const response = await this.axiosInstance.post(
        `${parentPath}/${sanitizedSiteName}`,
        formData.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    
    return {
        success: true,
        sitePath: `${parentPath}/${sanitizedSiteName}`,
        authorUrl: `${this.authorUrl}/editor.html${parentPath}/${sanitizedSiteName}.html`
    }
}
```

### 2. Authentication Handling

The tools support two authentication methods:

1. **Bearer Token:**
   ```javascript
   const credentials = { token: 'your-token' }
   ```

2. **Username/Password (Basic Auth):**
   ```javascript
   const credentials = {
       username: 'admin',
       password: 'password'
   }
   ```

Credentials can be provided via:
- Tool parameters
- Environment variables (`AEM_TOKEN`, `AEM_USERNAME`, `AEM_PASSWORD`)
- Default values in code

---

## Testing

### 1. Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.js'],
    collectCoverage: true,
    setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
    transform: {
        '^.+\\.js$': 'babel-jest'
    }
}
```

### 2. Test Structure (`test/mcp-server.test.js`)

Tests cover:
- Health check endpoint
- CORS handling
- MCP protocol (initialize, tools/list, tools/call)
- All tool implementations
- Error handling
- Resource and prompt listing

**Example Test:**

```javascript
describe('MCP Protocol', () => {
    test('should handle initialize request', async () => {
        const initRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'test-client', version: '1.0.0' }
            }
        }
        
        const result = await main({
            __ow_method: 'post',
            __ow_body: JSON.stringify(initRequest)
        })
        
        expect(result.statusCode).toBe(200)
        const body = JSON.parse(result.body)
        expect(body.result.serverInfo.name).toBe('my-mcp-server')
    })
})
```

### 3. Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

---

## Deployment

### 1. Adobe I/O Runtime Configuration (`app.config.yaml`)

```yaml
application:
  actions: actions
  runtimeManifest:
    packages:
      my-mcp-server:
        license: MIT
        actions:
          mcp-server:
            function: actions/mcp-server/index.js
            web: 'yes'
            runtime: 'nodejs:18'
            limits:
              timeout: 300000
              memory: 512
            inputs:
              LOG_LEVEL: debug
              AEM_AUTHOR_URL: https://your-aem-instance.adobeaemcloud.com
            annotations:
              require-adobe-auth: false
              final: true
              web-export: true
              raw-http: true
```

**Key Configuration:**
- `web: 'yes'`: Expose as web action
- `raw-http: true`: Enable raw HTTP mode for MCP protocol
- `require-adobe-auth: false`: No Adobe authentication required
- `timeout: 300000`: 5-minute timeout for complex operations

### 2. Webpack Configuration (`actions/mcp-server/webpack.config.js`)

```javascript
module.exports = {
    entry: './index.js',
    mode: 'production',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        libraryTarget: 'commonjs2'
    }
}
```

### 3. Environment Variables (`.env`)

Create `.env` file (do not commit):

```bash
# Adobe I/O Runtime credentials
AIO_runtime_auth=your-runtime-auth-key
AIO_runtime_namespace=your-namespace-stage
AIO_runtime_apihost=https://adobeioruntime.net

# AEM Configuration
AEM_AUTHOR_URL=https://author-p18253-e1827911.adobeaemcloud.com
AEM_USERNAME=your-username
AEM_PASSWORD=your-password
AEM_TOKEN=your-bearer-token
```

### 4. Build and Deploy

```bash
# Build the project
npm run build

# Deploy to Adobe I/O Runtime
npm run deploy

# Or use Adobe I/O CLI directly
aio app deploy
```

**Deployment Process:**
1. Webpack bundles the code
2. Adobe I/O CLI uploads to Runtime
3. Action is deployed and accessible via URL
4. URL format: `https://[namespace].adobeioruntime.net/api/v1/web/my-mcp-server/mcp-server`

### 5. Verify Deployment

```bash
# Health check
curl https://[namespace].adobeioruntime.net/api/v1/web/my-mcp-server/mcp-server

# Should return:
{
  "status": "healthy",
  "server": "my-mcp-server",
  "version": "1.0.0"
}
```

---

## Client Configuration

### 1. Cursor IDE Configuration

Create or update `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-adobe-mcp-server": {
      "url": "https://[namespace].adobeioruntime.net/api/v1/web/my-mcp-server/mcp-server",
      "transport": "http"
    }
  }
}
```

### 2. Claude Desktop Configuration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-adobe-mcp-server": {
      "url": "https://[namespace].adobeioruntime.net/api/v1/web/my-mcp-server/mcp-server",
      "transport": "http"
    }
  }
}
```

### 3. Testing Client Connection

After configuration:
1. Restart the AI client
2. Verify tools are available
3. Test with simple commands like "echo hello"

---

## Key Implementation Patterns

### 1. Stateless Server Pattern

Each request creates a fresh server instance:
- No shared state between requests
- Suitable for serverless environments
- Proper cleanup after each request

### 2. Request/Response Compatibility

Adobe I/O Runtime uses a different request/response format than Express.js:
- Create compatibility layer (`createCompatibleRequest`, `createCompatibleResponse`)
- Map Runtime parameters to HTTP-like objects
- Extract response from compatibility layer

### 3. Error Handling

Comprehensive error handling:
- JSON-RPC 2.0 error format
- Proper HTTP status codes
- User-friendly error messages
- Logging for debugging

### 4. Authentication Flexibility

Support multiple authentication methods:
- Bearer token (preferred for production)
- Basic auth (username/password)
- Environment variable fallback
- Parameter override capability

---

## Best Practices

1. **Security:**
   - Never commit `.env` file
   - Use bearer tokens in production
   - Validate all inputs
   - Sanitize site names and paths

2. **Error Handling:**
   - Provide clear error messages
   - Log errors for debugging
   - Return appropriate HTTP status codes
   - Handle network timeouts

3. **Testing:**
   - Test all tools individually
   - Test error scenarios
   - Test authentication flows
   - Maintain high test coverage

4. **Performance:**
   - Set appropriate timeouts
   - Use connection pooling for AEM
   - Cache templates when possible
   - Optimize bundle size

5. **Documentation:**
   - Document all tools with descriptions
   - Provide examples in tool descriptions
   - Include parameter descriptions
   - Document authentication requirements

---

## Troubleshooting

### Common Issues

1. **Server not responding:**
   - Check deployment status: `aio app list`
   - View logs: `aio app logs`
   - Verify URL is correct

2. **Tools not appearing:**
   - Verify server health check returns 200
   - Check client configuration JSON syntax
   - Restart AI client after configuration changes

3. **AEM authentication failures:**
   - Verify credentials are correct
   - Check AEM instance is accessible
   - Verify token hasn't expired
   - Check network connectivity

4. **Build failures:**
   - Ensure Node.js version is 18.19.0+
   - Clear node_modules and reinstall
   - Check webpack configuration
   - Verify all dependencies are installed

---

## Next Steps

After completing this setup:

1. **Customize Tools:**
   - Add your own tools to `tools.js`
   - Implement real API integrations
   - Add more AEM automation capabilities

2. **Enhance Resources:**
   - Add documentation resources
   - Include API schemas
   - Provide configuration examples

3. **Expand Prompts:**
   - Create domain-specific prompts
   - Add examples and templates
   - Include best practices

4. **Production Readiness:**
   - Set up CI/CD pipelines
   - Add monitoring and alerting
   - Implement rate limiting
   - Add request validation

---

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Adobe I/O Runtime Documentation](https://developer.adobe.com/runtime/docs/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [AEM API Documentation](https://experienceleague.adobe.com/docs/experience-manager-cloud-service/content/implementing/developing/introduction/aem-as-a-cloud-service.html)

---

## Summary

This training document covers the complete process of building an MCP server for Adobe I/O Runtime with AEM integration. The application follows best practices for serverless architecture, implements the MCP protocol correctly, and provides comprehensive AEM automation capabilities. By following these steps, you can recreate a production-ready MCP server that integrates seamlessly with AI assistants and AEM Cloud Service.
