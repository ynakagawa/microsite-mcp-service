# MCP Server on Adobe I/O Runtime

Create [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers for Adobe I/O Runtime using the **official MCP TypeScript SDK**. Connect AI assistants like Cursor and Claude Desktop to your custom tools, resources, and prompts.

This project is generated using https://github.com/OneAdobe/app-builder-remote-mcp-server-starter template.

---

## 📋 What's Included

This MCP server provides:

### 🛠️ **Tools**
- **echo** - Test connectivity by echoing back messages
- **calculator** - Perform mathematical calculations with multiple output formats
- **weather** - Get weather information (currently mock data, ready for real API integration)

#### 🏗️ **AEM Automation Tools**
- **aem-create-microsite** - Automatically create and deploy microsites using AEM Quick Site Creation templates
- **aem-list-templates** - List available AEM site templates
- **aem-list-sites** - List existing sites in AEM
- **aem-get-site-info** - Get detailed information about a specific site
- **aem-delete-site** - Delete a site (with confirmation required)

### 📚 **Resources**
- Example text resources
- API documentation (Markdown format)
- Configuration schemas (JSON format)

### 💬 **Prompts**
- Weather information prompt with customizable city parameter

---

## 🚀 Quick Start

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Test Locally**
```bash
# Run tests
npm test

# Local development mode
npm run dev
```

### 3. **Deploy to Adobe I/O Runtime**
```bash
# Build and deploy
npm run deploy
```

After deployment, you'll get a URL like:
```
https://[namespace].adobeioruntime.net/api/v1/web/my-mcp-server/mcp-server
```

---

## 🔌 Connect to AI Clients

### **Using with Cursor IDE**

1. Open Cursor Settings
2. Navigate to the MCP settings section
3. Add your server configuration:

```json
{
  "mcpServers": {
    "my-adobe-mcp-server": {
      "url": "https://[your-namespace].adobeioruntime.net/api/v1/web/my-mcp-server/mcp-server",
      "transport": "http"
    }
  }
}
```

### **Using with Claude Desktop**

Add to your Claude Desktop configuration file (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "my-adobe-mcp-server": {
      "url": "https://[your-namespace].adobeioruntime.net/api/v1/web/my-mcp-server/mcp-server",
      "transport": "http"
    }
  }
}
```

---

## 💡 Using the Tools

Once connected, you can use the tools in your AI assistant:

### **Echo Tool**
```
Can you echo the message "Hello MCP Server"?
```

### **Calculator Tool**
```
Calculate 25 * 4 + 10
Calculate sqrt(144) in scientific notation
```

### **Weather Tool**
```
What's the weather in San Francisco?
Get weather information for Tokyo
```

### **AEM Microsite Creation Tool**
```
Create a microsite called "summer-campaign" with title "Summer Campaign 2024"
Create a microsite named product-launch with pages home, features, pricing, contact
List available AEM templates
List all sites in AEM
Get information about the site at /content/my-site
```

---

## 🏗️ AEM Automation

This MCP server includes powerful tools for automating AEM site creation and management.

### **Setup AEM Authentication**

The AEM tools support two authentication methods:

1. **Username/Password** (Basic Auth):
```
Create a microsite called my-site with username admin and password mypassword
```

2. **Bearer Token**:
```
Create a microsite called my-site with token abc123xyz
```

### **Creating Microsites**

The `aem-create-microsite` tool automates the entire process of creating a new site:

**Features:**
- Uses AEM Quick Site Creation templates
- Automatically creates initial page structure (home, about, contact by default)
- Sanitizes site names for URL compatibility
- Returns direct links to edit the site in AEM Author

**Example Usage:**
```
Create a microsite called "product-launch" with title "Product Launch Site" using the standard template
```

**Custom Pages:**
```
Create a microsite called "event-site" with pages home, schedule, speakers, registration
```

**Advanced Options:**
- Choose between `standard` or `basic` templates
- Specify custom parent paths (default: `/content`)
- Customize initial page structure

### **Managing Sites**

**List Templates:**
```
Show me available AEM templates
```

**List Sites:**
```
List all sites in AEM
List sites under /content/campaigns
```

**Get Site Info:**
```
Get information about /content/my-site
```

**Delete Site:**
```
Delete the site at /content/old-site with confirmation
```

### **Configuration**

Your AEM instance URL is pre-configured in the tools:
- Default: `https://author-p18253-e46622.adobeaemcloud.com`
- You can override it by specifying `authorUrl` parameter

---

## 🧪 Testing

### **Health Check**
Test if your server is running:
```bash
curl https://[your-namespace].adobeioruntime.net/api/v1/web/my-mcp-server/mcp-server
```

Should return:
```json
{
  "status": "healthy",
  "server": "my-mcp-server",
  "version": "1.0.0",
  "transport": "StreamableHTTP"
}
```

### **Run Test Suite**
```bash
npm test
```

---

## 🔧 Customization

### **Adding New Tools**

Edit `actions/mcp-server/tools.js` and add your tool:

```javascript
function registerTools(server) {
  server.tool(
    'my-tool',
    'Description of what my tool does',
    {
      param1: z.string().describe('Parameter description'),
    },
    async ({ param1 }) => {
      return {
        content: [
          {
            type: 'text',
            text: `Result: ${param1}`
          }
        ]
      };
    }
  );
}
```

### **Adding New Resources**

```javascript
function registerResources(server) {
  server.resource(
    'my-resource',
    'resource://my-data',
    {
      name: 'My Resource',
      description: 'Static content for AI assistant',
      mimeType: 'text/plain'
    },
    async () => {
      return {
        contents: [{
          uri: 'resource://my-data',
          text: 'Your content here',
          mimeType: 'text/plain'
        }]
      };
    }
  );
}
```

### **Configuration**

Edit `app.config.yaml` to customize:
- Runtime settings (Node.js version)
- Memory limits
- Timeout values
- Log levels

---

## 📁 Project Structure

```
training/
├── actions/
│   └── mcp-server/
│       ├── index.js      # Main MCP server implementation
│       └── tools.js      # Tool, resource, and prompt definitions
├── test/
│   ├── mcp-server.test.js
│   └── utils.test.js
├── app.config.yaml       # Adobe I/O Runtime configuration
├── package.json          # Dependencies and scripts
└── webpack.config.js     # Build configuration
```

---

## 🐛 Troubleshooting

### **Server not responding**
- Check deployment status: `aio app list`
- View logs: `aio app logs`

### **Tools not appearing in AI client**
- Verify the server URL is correct
- Check that the server returns a healthy status
- Restart your AI client after configuration changes

### **Calculator gives errors**
- The calculator uses a simple `eval()` for demo purposes
- Replace with a proper math parser library for production

### **Weather returns mock data**
- This is expected - the weather tool uses mock data
- Replace with real API calls (OpenWeatherMap, WeatherAPI, etc.)

---

## 📚 Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Adobe I/O Runtime Documentation](https://developer.adobe.com/runtime/docs/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

## 🤝 Contributing

Feel free to customize this template for your specific use case!

## 📄 License

MIT 