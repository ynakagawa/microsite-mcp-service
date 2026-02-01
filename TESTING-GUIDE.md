# Testing Guide for AEM Asset Search

This guide explains how to test the AEM asset search functionality locally.

## Testing Options

### 1. Unit Tests (Mocked)

Run Jest unit tests with mocked AEM API responses:

```bash
npm test
```

Or run only the asset client tests:

```bash
npm test -- aem-asset-client.test.js
```

Watch mode for development:

```bash
npm run test:watch -- aem-asset-client.test.js
```

### 2. Integration Test Script (Real AEM Instance)

Test against a real AEM instance using the test script:

#### Prerequisites

Set up your AEM credentials in `.env` file or pass as arguments:

```bash
# In .env file
AEM_AUTHOR_URL=https://author-p18253-e1827911.adobeaemcloud.com
AEM_USERNAME=admin
AEM_PASSWORD=admin
# OR
AEM_TOKEN=your-bearer-token
```

#### Usage Examples

**General search query:**
```bash
node test-asset-search.js \
  --query "summer" \
  --authorUrl https://author-p18253-e1827911.adobeaemcloud.com \
  --username admin \
  --password admin
```

**Search by filename:**
```bash
node test-asset-search.js \
  --filename "banner.jpg" \
  --authorUrl https://author-p18253-e1827911.adobeaemcloud.com \
  --token your-token
```

**Search by dc:title:**
```bash
node test-asset-search.js \
  --title "Hero Image" \
  --damPath /content/dam/mysite \
  --limit 20
```

**Using environment variables:**
```bash
export AEM_AUTHOR_URL=https://author-p18253-e1827911.adobeaemcloud.com
export AEM_TOKEN=your-token
node test-asset-search.js --query "test"
```

### 3. Test MCP Tool Directly

Test the MCP tool through the server:

#### Start the server locally:

```bash
npm run dev
```

#### Test via HTTP request:

```bash
curl -X POST http://localhost:3000/api/v1/web/my-mcp-server/mcp-server \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "aem-search-assets",
      "arguments": {
        "query": "summer",
        "authorUrl": "https://author-p18253-e1827911.adobeaemcloud.com",
        "username": "admin",
        "password": "admin"
      }
    }
  }'
```

### 4. Test in Node.js REPL

Interactive testing in Node.js:

```bash
node
```

```javascript
const { createAEMAssetClient } = require('./actions/mcp-server/aem-asset-client');

// Create client
const client = createAEMAssetClient(
  'https://author-p18253-e1827911.adobeaemcloud.com',
  { username: 'admin', password: 'admin' }
);

// Test search
client.searchAssets({ query: 'test' })
  .then(result => {
    console.log('Results:', result);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

## Test Scenarios

### Scenario 1: Search by General Query
Tests searching both filename and dc:title metadata.

```bash
node test-asset-search.js --query "campaign"
```

### Scenario 2: Search by Filename Only
Tests filename-specific search.

```bash
node test-asset-search.js --filename "logo.png"
```

### Scenario 3: Search by Title Only
Tests dc:title metadata search.

```bash
node test-asset-search.js --title "Hero Banner"
```

### Scenario 4: Pagination
Tests pagination with limit and offset.

```bash
node test-asset-search.js --query "test" --limit 5 --offset 0
node test-asset-search.js --query "test" --limit 5 --offset 5
```

### Scenario 5: Custom DAM Path
Tests searching in a specific DAM folder.

```bash
node test-asset-search.js --query "test" --damPath "/content/dam/mysite/images"
```

## Expected Results

### Successful Search Response

```json
{
  "success": true,
  "query": "test",
  "damPath": "/content/dam",
  "total": 5,
  "results": [
    {
      "path": "/content/dam/test/asset1.jpg",
      "name": "asset1.jpg",
      "title": "Test Asset 1",
      "metadata": {
        "dc:title": "Test Asset 1",
        "dc:description": "Description here"
      },
      "url": "https://author.../content/dam/test/asset1.jpg"
    }
  ],
  "count": 5,
  "limit": 50,
  "offset": 0,
  "message": "Found 5 asset(s)"
}
```

## Troubleshooting

### Authentication Errors

**Error:** `Authentication Required`

**Solution:** Ensure credentials are provided:
- Set `AEM_USERNAME` and `AEM_PASSWORD` environment variables, OR
- Set `AEM_TOKEN` environment variable, OR
- Pass `--username` and `--password` arguments, OR
- Pass `--token` argument

### QueryBuilder API Errors

**Error:** `Failed to search assets: QueryBuilder API error`

**Possible causes:**
- AEM instance not accessible
- Invalid DAM path
- Insufficient permissions
- QueryBuilder API not enabled

**Solution:**
- Verify AEM URL is correct
- Check network connectivity
- Verify user has read permissions on DAM
- Check AEM logs for detailed error

### No Results Found

**Possible causes:**
- Search query too specific
- Assets don't exist in DAM path
- Assets don't have dc:title metadata
- Wrong DAM path

**Solution:**
- Try broader search terms
- Verify DAM path exists
- Check if assets have metadata
- List assets in DAM to verify paths

## Debugging Tips

1. **Enable verbose logging:**
   ```bash
   DEBUG=* node test-asset-search.js --query "test"
   ```

2. **Check QueryBuilder URL:**
   The script logs the QueryBuilder API call. Verify the URL format is correct.

3. **Test with simple query first:**
   Start with a very simple query like "test" to verify connectivity.

4. **Verify AEM instance:**
   Test basic connectivity first:
   ```bash
   curl https://author-p18253-e1827911.adobeaemcloud.com/bin/querybuilder.json?type=dam:Asset&path=/content/dam&p.limit=1 \
     -u admin:admin
   ```

## Running All Tests

Run the complete test suite:

```bash
npm test
```

This will run:
- Unit tests (mocked)
- Integration tests (if configured)
- All existing tests

## Continuous Testing

Watch mode for development:

```bash
npm run test:watch
```

This will automatically rerun tests when files change.
