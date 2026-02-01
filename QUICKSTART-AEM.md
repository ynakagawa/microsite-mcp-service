# Quick Start: AEM Microsite Automation

Your MCP server now has powerful AEM automation capabilities! Here's how to get started.

## 🚀 Deploy Your Updated Server

```bash
npm run deploy
```

After deployment, restart Cursor to ensure it picks up the new tools.

## 🔐 Authentication

You have two options for authenticating with your AEM instance:

### Option 1: Username/Password (Development)
```
Create a microsite called test-site with title Test Site using username admin and password admin
```

### Option 2: Bearer Token (Production - Recommended)
```
Create a microsite called test-site with title Test Site using token YOUR_BEARER_TOKEN
```

## 📝 Creating Your First Microsite

Simply ask your AI assistant in natural language:

```
Create a microsite called summer-campaign with title "Summer Campaign 2024"
```

This will:
- ✅ Create a new site at `/content/summer-campaign`
- ✅ Set up initial pages (home, about, contact)
- ✅ Use the standard AEM Quick Site Creation template
- ✅ Return a direct link to edit in AEM Author

## 🎯 Common Commands

### List Available Templates
```
Show me available AEM templates
```

### Create with Custom Pages
```
Create a microsite called product-launch with pages home, features, pricing, demo, contact
```

### List All Sites
```
List all sites in AEM
```

### Get Site Information
```
Get information about /content/summer-campaign
```

### Delete a Site
```
Delete the site at /content/old-site with confirm true
```

## 📦 Using Standard AEM Site Template 2.2.2

The Standard AEM Site Template 2.2.2 is Adobe's best-practice reference template with advanced features and modern styling capabilities.

### Step 1: Download the Template

Download the template from GitHub:
```
https://github.com/adobe/aem-site-template-standard/releases/tag/v2.2.2
```

Or use this direct command:
```bash
curl -L -o aem-site-template-standard-2.2.2.zip \
  https://github.com/adobe/aem-site-template-standard/releases/download/v2.2.2/aem-site-template-standard-2.2.2.zip
```

### Step 2: Import the Template into AEM

1. Navigate to your AEM Sites console:
   ```
   https://author-p18253-e46622.adobeaemcloud.com/sites.html/content
   ```

2. Click **"Create"** → **"Site from template"**

3. Click **"Import"** button at the top

4. Upload the `aem-site-template-standard-2.2.2.zip` file

5. Wait for the upload to complete

### Step 3: Create a Site with the Imported Template

1. After import, you'll see the template in the list

2. Select the **"Standard AEM Site Template 2.2.2"**

3. Click **"Next"**

4. Provide your site details:
   - **Site Title:** e.g., "My New Site"
   - **Site Name:** e.g., "my-new-site"
   - **Language:** Select your primary language

5. Click **"Create"**

6. Wait for the site creation to complete

### Alternative: Use Built-in Standard Template (Quick Method)

For rapid prototyping, you can use the built-in standard template:

```
Create a microsite called my-site with title "My Site" using standard template
```

This uses the built-in standard template without requiring manual import.

### Benefits of Template 2.2.2

- ✅ **Modern Design System:** Latest Spectrum components
- ✅ **Responsive Layouts:** Mobile-first approach
- ✅ **Theme Editor Support:** Easy customization via UI
- ✅ **Performance Optimized:** Best practices for Core Web Vitals
- ✅ **Accessibility:** WCAG 2.1 AA compliant
- ✅ **SEO Ready:** Structured data and meta tag support

## 🏗️ Your AEM Instance

**Pre-configured URLs:**
- **Primary:** `https://author-p18253-e46622.adobeaemcloud.com`
- **Alternative:** `https://author-p18253-e1827911.adobeaemcloud.com` (configured in `.env`)

You can override this in any command by specifying `authorUrl` parameter if needed.

**Using .env Configuration:**

Your AEM credentials can be stored in the `.env` file:
```bash
AEM_AUTHOR_URL=https://author-p18253-e1827911.adobeaemcloud.com
AEM_USERNAME=cursor
AEM_PASSWORD=cursor
```

This allows the MCP server to automatically use these credentials when connecting to AEM.

## 📚 Full Documentation

See `AEM-AUTOMATION-GUIDE.md` for comprehensive documentation including:
- All available tools and parameters
- Best practices
- Troubleshooting guide
- Advanced workflows

## 🧪 Testing

Run the test suite to verify everything works:

```bash
npm test
```

All 53 tests should pass, including 18 AEM-specific tests.

## ⚡ Example Workflow

### Quick Start Workflow (Built-in Template)

1. **Check what templates are available:**
   ```
   Show me AEM templates
   ```

2. **Create a marketing campaign site:**
   ```
   Create a microsite called holiday-sale with title "Holiday Sale 2024" 
   with pages home, products, deals, stores, contact
   ```

3. **Verify it was created:**
   ```
   Get information about /content/holiday-sale
   ```

4. **Open in AEM:**
   The response will include a direct link to edit the site in AEM Author.

### Advanced Workflow (Standard Template 2.2.2)

1. **Download the template:**
   ```bash
   curl -L -o aem-site-template-standard-2.2.2.zip \
     https://github.com/adobe/aem-site-template-standard/releases/download/v2.2.2/aem-site-template-standard-2.2.2.zip
   ```

2. **Import via AEM UI:**
   - Go to: `https://author-p18253-e46622.adobeaemcloud.com/sites.html/content`
   - Click "Create" → "Site from template" → "Import"
   - Upload the `.zip` file

3. **Create site with imported template:**
   - Select "Standard AEM Site Template 2.2.2"
   - Enter site details and create

4. **Customize with Theme Editor:**
   - Access the theme editor from the site admin
   - Modify colors, fonts, and styles
   - Deploy changes to your site

## 🎉 You're Ready!

Start creating microsites by simply talking to your AI assistant. It's that easy!

---

**Questions?** Check out:
- `README.md` - Full project documentation
- `AEM-AUTOMATION-GUIDE.md` - Detailed AEM guide
- Test files in `/test` - Code examples

**Happy automating!** 🚀

