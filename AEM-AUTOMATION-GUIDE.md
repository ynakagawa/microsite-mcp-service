# AEM Microsite Automation Guide

This guide explains how to use the AEM automation tools in your MCP server to automatically create and manage microsites in AEM Cloud Service.

## Overview

The MCP server now includes powerful tools for automating AEM site creation using the Quick Site Creation feature. You can create complete microsites with initial page structures directly through your AI assistant (Cursor or Claude).

## Prerequisites

- AEM Cloud Service Author instance running
- Valid AEM credentials (username/password or bearer token)
- MCP server deployed to Adobe I/O Runtime
- Cursor or Claude Desktop configured with your MCP server

## Available Tools

### 1. aem-create-microsite

Creates a complete microsite with initial page structure.

**Parameters:**
- `siteName` (required): URL-friendly site name (e.g., "summer-campaign")
- `siteTitle` (required): Display title (e.g., "Summer Campaign 2024")
- `username` (optional): AEM username for authentication
- `password` (optional): AEM password for authentication
- `token` (optional): Bearer token (alternative to username/password)
- `authorUrl` (optional): AEM Author URL (default: your configured instance)
- `templateType` (optional): "standard" or "basic" (default: "standard")
- `pages` (optional): Array of page names (default: ["home", "about", "contact"])
- `parentPath` (optional): Parent path (default: "/content")

**Example Usage in Cursor:**
```
Create a microsite called "summer-campaign" with title "Summer Campaign 2024" using username admin and password admin
```

```
Create a microsite named "product-launch" with pages home, features, pricing, contact
```

### 2. aem-list-templates

Lists available Quick Site Creation templates.

**Example Usage:**
```
Show me available AEM templates
What AEM templates can I use?
```

### 3. aem-list-sites

Lists existing sites under a path.

**Parameters:**
- `parentPath` (optional): Path to list sites from (default: "/content")
- Authentication parameters (username/password or token)

**Example Usage:**
```
List all sites in AEM
Show me sites under /content/campaigns
```

### 4. aem-get-site-info

Gets detailed information about a specific site.

**Parameters:**
- `sitePath` (required): Full path to the site (e.g., "/content/my-site")
- Authentication parameters

**Example Usage:**
```
Get information about the site at /content/summer-campaign
Show me details for /content/my-site
```

### 5. aem-delete-site

Deletes a site (requires confirmation).

**Parameters:**
- `sitePath` (required): Full path to the site
- `confirm` (required): Must be `true` to confirm deletion
- Authentication parameters

**Example Usage:**
```
Delete the site at /content/old-campaign with confirmation true
```

## Extended AEM Tools

### 6. aem-create-component

Creates a new AEM component with dialog configuration and HTL template. Automatically generates component structure with authoring dialog fields.

**Parameters:**
- `componentName` (required): Name of the component (e.g., "hero-banner", "product-card")
- `componentTitle` (required): Display title (e.g., "Hero Banner")
- `componentPath` (required): Path where component will be created (e.g., "/apps/mysite/components/content")
- `componentGroup` (optional): Component group (default: "Custom Components")
- `properties` (optional): Array of component properties for dialog fields
  - Each property has: `name`, `type`, `label`, `required`
  - Supported types: textfield, textarea, pathfield, checkbox, select, multifield
- Authentication parameters

**Example Usage:**
```
Create a component named hero-banner with title Hero Banner at /apps/mysite/components/content with properties: [{name: "title", type: "textfield", label: "Title", required: true}, {name: "description", type: "textarea", label: "Description"}]
```

```
Create a product-card component at /apps/mysite/components/content with title Product Card
```

### 7. aem-create-content-fragment

Creates and manages AEM Content Fragments. Content Fragments are structured, reusable content elements perfect for headless content delivery.

**Parameters:**
- `fragmentTitle` (required): Title of the content fragment
- `fragmentPath` (required): DAM path (e.g., "/content/dam/mysite/fragments")
- `modelPath` (required): Path to Content Fragment Model (e.g., "/conf/mysite/settings/dam/cfm/models/article")
- `fields` (required): Object with field values (e.g., {"title": "My Article", "body": "Content here"})
- Authentication parameters

**Example Usage:**
```
Create a content fragment titled "Summer Sale Article" at /content/dam/mysite/fragments using model /conf/mysite/settings/dam/cfm/models/article with fields: {title: "Summer Sale 2024", body: "Amazing deals this summer", author: "John Doe"}
```

```
Create a content fragment for product description at /content/dam/products/fragments
```

### 8. aem-upload-asset

Upload digital assets (images, documents, videos) to AEM DAM. Supports asset metadata and automatic organization.

**Parameters:**
- `assetName` (required): Name of the asset file (e.g., "hero-image.jpg")
- `damPath` (required): DAM path (e.g., "/content/dam/mysite/images")
- `assetUrl` (optional): URL to download asset from
- `assetData` (optional): Base64 encoded asset data
- `mimeType` (optional): MIME type (e.g., "image/jpeg", "application/pdf")
- `metadata` (optional): Asset metadata object (e.g., {"dc:title": "Hero Image", "dc:description": "Main banner"})
- Authentication parameters

**Example Usage:**
```
Upload asset hero-banner.jpg from URL https://example.com/images/hero.jpg to /content/dam/mysite/images with metadata: {dc:title: "Hero Banner", dc:description: "Homepage hero image"}
```

```
Upload a PDF document to /content/dam/mysite/documents with name product-guide.pdf
```

### 9. aem-start-workflow

Start an AEM workflow for content approval, asset processing, or custom automation. Workflows orchestrate complex content operations.

**Parameters:**
- `workflowModel` (required): Path to workflow model (e.g., "/var/workflow/models/dam/update_asset")
- `payloadPath` (required): Path to content/asset to process (e.g., "/content/mysite/en/home")
- `workflowTitle` (optional): Title for this workflow instance
- `workflowData` (optional): Additional workflow data as key-value pairs
- Authentication parameters

**Example Usage:**
```
Start workflow /var/workflow/models/request_for_activation for payload /content/mysite/en/home with title "Approve Homepage"
```

```
Start asset processing workflow for /content/dam/mysite/images/new-photo.jpg
```

## Authentication

### Option 1: Username/Password (Basic Auth)

```
Create a microsite called my-site with username admin and password mypassword
```

### Option 2: Bearer Token

```
Create a microsite called my-site with token abc123xyz
```

### Environment Variables

You can also set up environment variables in `.env`:

```bash
AEM_AUTHOR_URL=https://author-p18253-e46622.adobeaemcloud.com
AEM_USERNAME=admin
AEM_PASSWORD=admin
```

Or for token-based auth:

```bash
AEM_AUTHOR_URL=https://author-p18253-e46622.adobeaemcloud.com
AEM_TOKEN=your-bearer-token
```

## Quick Site Creation Templates

The system supports two template types out of the box:

1. **Standard Template** (`standard`)
   - Full-featured template with modern styling
   - Includes responsive design
   - Best for most use cases

2. **Basic Template** (`basic`)
   - Lightweight template
   - Minimal styling
   - Good for custom styling projects

## Workflows

### Creating a Marketing Campaign Site

```
1. "List available AEM templates"
   → Review available templates

2. "Create a microsite called summer-sale with title Summer Sale 2024 with pages home, products, deals, contact"
   → Creates the site with custom pages

3. "Get information about /content/summer-sale"
   → Verify the site was created successfully
```

### Managing Multiple Microsites

```
1. "List all sites in AEM"
   → See all existing sites

2. "Create a microsite called event-2024 with title Tech Conference 2024 with pages home, schedule, speakers, registration, venue"
   → Create event site

3. "Create a microsite called product-launch with title New Product Launch with pages home, features, pricing, demo, contact"
   → Create product site
```

### Cleaning Up Old Sites

```
1. "List sites under /content/campaigns"
   → Find sites to remove

2. "Delete the site at /content/campaigns/old-campaign with confirm true"
   → Remove old campaign site
```

### Creating Custom Components

```
1. "Create a component named hero-section with title Hero Section at /apps/mysite/components/content with properties: [{name: 'heading', type: 'textfield', label: 'Heading', required: true}, {name: 'subheading', type: 'textfield', label: 'Subheading'}, {name: 'image', type: 'pathfield', label: 'Background Image'}]"
   → Creates component with dialog fields

2. "Create a testimonial-card component at /apps/mysite/components/content with title Testimonial Card"
   → Creates simple component structure
```

### Managing Content Fragments

```
1. "Create a content fragment titled 'Spring Campaign Content' at /content/dam/mysite/campaigns using model /conf/mysite/settings/dam/cfm/models/campaign with fields: {title: 'Spring Sale 2024', tagline: 'Fresh deals for spring', startDate: '2024-03-01', endDate: '2024-03-31'}"
   → Creates campaign content fragment

2. "Create a content fragment for product specifications at /content/dam/products"
   → Creates structured product data
```

### Uploading and Processing Assets

```
1. "Upload asset campaign-banner.jpg from URL https://cdn.example.com/images/banner.jpg to /content/dam/mysite/marketing with metadata: {dc:title: 'Campaign Banner', dc:subject: 'Marketing', dc:creator: 'Design Team'}"
   → Uploads asset with metadata

2. "Start workflow /var/workflow/models/dam/update_asset for payload /content/dam/mysite/marketing/campaign-banner.jpg with title 'Process Campaign Banner'"
   → Triggers asset processing workflow
```

### Automated Content Publishing Workflow

```
1. "Create a microsite called spring-promo with title Spring Promotion 2024 with pages home, products, offers"
   → Create the site structure

2. "Create a content fragment for homepage hero at /content/dam/spring-promo/fragments using model /conf/mysite/settings/dam/cfm/models/hero with fields: {headline: 'Spring Sale!', subheadline: 'Save up to 50%', ctaText: 'Shop Now'}"
   → Create content for homepage

3. "Upload asset spring-hero.jpg from URL https://assets.example.com/spring.jpg to /content/dam/spring-promo/images"
   → Upload hero image

4. "Start workflow /var/workflow/models/request_for_activation for payload /content/spring-promo with title 'Publish Spring Promo Site'"
   → Initiate approval and publishing
```

## Troubleshooting

### Authentication Errors

**Problem:** "Authentication Required" or "401 Unauthorized"

**Solutions:**
- Verify your AEM credentials are correct
- Check if your account has permissions to create sites
- For cloud instances, ensure your token hasn't expired

### Site Creation Fails

**Problem:** "Failed to create site" or "Site already exists"

**Solutions:**
- Check if a site with that name already exists
- Verify the parent path exists and is writable
- Ensure you have sufficient permissions

### Network Errors

**Problem:** "Network connectivity issues" or "AEM instance not accessible"

**Solutions:**
- Verify the AEM Author URL is correct
- Check if the AEM instance is running
- Ensure network connectivity from your deployment environment

## Best Practices

1. **Naming Conventions**
   - Use lowercase, hyphen-separated names (e.g., "summer-campaign")
   - Avoid special characters and spaces
   - Keep names descriptive but concise

2. **Page Structure**
   - Plan your page structure before creating the site
   - Use consistent page naming across microsites
   - Consider your content hierarchy

3. **Template Selection**
   - Use "standard" template for most projects
   - Use "basic" template when you need full styling control
   - Stick to one template type for consistency

4. **Security**
   - Use bearer tokens instead of username/password in production
   - Store credentials in environment variables or secrets manager
   - Rotate credentials regularly
   - Use least-privilege access principles

5. **Testing**
   - Test site creation in a development environment first
   - Verify the site structure matches your requirements
   - Check all pages are created correctly

6. **Component Development**
   - Follow AEM component naming conventions (lowercase with hyphens)
   - Group related components together
   - Create reusable components with configurable properties
   - Test components in the component console before page use
   - Document component properties for authors

7. **Content Fragment Management**
   - Define Content Fragment Models before creating fragments
   - Use consistent naming conventions for fragment fields
   - Validate fragment data before creation
   - Plan fragment structure for reusability across channels
   - Consider fragment variations for personalization

8. **Asset Management**
   - Organize assets in a logical folder structure
   - Add meaningful metadata for better searchability
   - Use appropriate file formats (WebP for images, etc.)
   - Compress assets before upload for better performance
   - Tag assets consistently for easy discovery

9. **Workflow Management**
   - Use built-in workflows when possible
   - Test custom workflows in development first
   - Monitor workflow instances for failures
   - Clean up completed workflows regularly
   - Document custom workflow requirements

## API Integration

The AEM automation tools use the following AEM APIs:

- **Site Creation API**: Creates new site structures
- **JCR API**: Manages content nodes and properties
- **Page API**: Creates and manages pages

All API calls use proper authentication and error handling.

## Advanced Usage

### Custom Template Paths

You can specify custom template paths:

```javascript
{
  templatePath: '/conf/my-custom-templates/settings/wcm/templates/custom-template'
}
```

### Custom Parent Paths

Organize sites under different parent paths:

```
Create a microsite called campaign-2024 under /content/campaigns with title Campaign 2024
```

### Bulk Site Creation

You can create multiple sites in sequence by making multiple requests to the AI assistant.

## Support

For issues or questions:
- Check the MCP server logs: `aio app logs`
- Review AEM error logs in the Author instance
- Verify API endpoints are accessible
- Test authentication separately

## Next Steps

1. Deploy your MCP server: `npm run deploy`
2. Configure Cursor with your MCP server URL
3. Start creating microsites through natural language commands
4. Customize templates and configurations as needed

## Examples Library

### Basic Microsite
```
Create a microsite called my-site with title My Site
```

### Marketing Campaign
```
Create a microsite called spring-promo with title Spring Promotion 2024 with pages home, products, offers, stores
```

### Event Site
```
Create a microsite called tech-summit with title Tech Summit 2024 with pages home, agenda, speakers, registration, venue, sponsors
```

### Product Launch
```
Create a microsite called new-product with title Product Launch with pages home, overview, features, specifications, pricing, buy-now
```

### Component Creation Examples

#### Hero Component
```
Create a component named hero-banner with title Hero Banner at /apps/mysite/components/content with properties: [{name: "title", type: "textfield", label: "Title", required: true}, {name: "subtitle", type: "textfield", label: "Subtitle"}, {name: "backgroundImage", type: "pathfield", label: "Background Image"}, {name: "ctaText", type: "textfield", label: "CTA Text"}, {name: "ctaLink", type: "pathfield", label: "CTA Link"}]
```

#### Card Component
```
Create a component named info-card with title Information Card at /apps/mysite/components/content with properties: [{name: "heading", type: "textfield", label: "Heading", required: true}, {name: "description", type: "textarea", label: "Description"}, {name: "icon", type: "pathfield", label: "Icon"}]
```

### Content Fragment Examples

#### Article Fragment
```
Create a content fragment titled "Getting Started Guide" at /content/dam/mysite/articles using model /conf/mysite/settings/dam/cfm/models/article with fields: {title: "Getting Started with AEM", author: "Jane Smith", category: "Tutorial", body: "This guide will help you get started...", publishDate: "2024-03-15"}
```

#### Product Fragment
```
Create a content fragment titled "Premium Widget" at /content/dam/mysite/products using model /conf/mysite/settings/dam/cfm/models/product with fields: {productName: "Premium Widget", sku: "PW-001", price: "99.99", description: "Our best widget yet", features: "Durable, Fast, Reliable"}
```

### Asset Upload Examples

#### Image Upload
```
Upload asset homepage-hero.jpg from URL https://images.example.com/hero.jpg to /content/dam/mysite/marketing/2024 with metadata: {dc:title: "Homepage Hero Image", dc:subject: "Marketing", dc:rights: "© 2024 Company"}
```

#### Document Upload
```
Upload asset product-catalog.pdf to /content/dam/mysite/documents with metadata: {dc:title: "2024 Product Catalog", dc:description: "Complete product listing", dc:format: "application/pdf"}
```

### Workflow Examples

#### Content Approval
```
Start workflow /var/workflow/models/request_for_activation for payload /content/mysite/en/news/latest-announcement with title "Approve News Article"
```

#### Asset Processing
```
Start workflow /var/workflow/models/dam/update_asset for payload /content/dam/mysite/images/product-photo.jpg with title "Process Product Photo"
```

#### Bulk Publishing
```
Start workflow /var/workflow/models/request_for_activation for payload /content/mysite/en/products with title "Publish All Products" with workflowData: {publishDate: "2024-03-20", notifyUsers: "true"}
```

### Complete Site Setup Example

```
# Step 1: Create the site
Create a microsite called tech-blog with title Tech Blog 2024 with pages home, articles, about, contact

# Step 2: Create components
Create a component named blog-post-card with title Blog Post Card at /apps/techblog/components/content with properties: [{name: "title", type: "textfield", label: "Post Title", required: true}, {name: "excerpt", type: "textarea", label: "Excerpt"}, {name: "thumbnail", type: "pathfield", label: "Thumbnail"}, {name: "readTime", type: "textfield", label: "Read Time"}]

# Step 3: Upload assets
Upload asset blog-header.jpg from URL https://assets.example.com/blog-header.jpg to /content/dam/tech-blog/images with metadata: {dc:title: "Blog Header", dc:creator: "Design Team"}

# Step 4: Create content fragments
Create a content fragment titled "First Blog Post" at /content/dam/tech-blog/articles using model /conf/techblog/settings/dam/cfm/models/blog-post with fields: {title: "Welcome to Our Tech Blog", author: "John Doe", date: "2024-03-01", content: "Welcome to our new tech blog where we share...", tags: "announcement, welcome"}

# Step 5: Publish the site
Start workflow /var/workflow/models/request_for_activation for payload /content/tech-blog with title "Publish Tech Blog Site"
```

---

**Happy Automating!** 🚀

