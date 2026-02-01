/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/**
 * MCP Server Tools - Organized in separate module
 *
 * This file contains all the tools available in the MCP server, organized using
 * the official MCP TypeScript SDK. Each tool is registered using the server.tool()
 * method and follows the MCP specification for tool definitions.
 *
 * Tools included:
 * - echo: Simple echo tool for testing connectivity
 * - calculator: Basic mathematical calculations
 * - MyWeather: Mock weather API tool (demonstrates external API patterns)
 */

const { z } = require('zod')
const { createAEMMicrositeClient } = require('./aem-microsite-client')
const { createAEMAssetClient } = require('./aem-asset-client')

/**
 * Helper function to get AEM credentials from parameters or environment variables
 */
function getAEMCredentials(params) {
    // Support both 'authorUrl' and 'server' parameter names
    const finalAuthorUrl = params.authorUrl || params.server || process.env.AEM_AUTHOR_URL || 'https://author-p18253-e46622.adobeaemcloud.com';
    const finalToken = params.token || process.env.AEM_TOKEN;
    const finalUsername = params.username || process.env.AEM_USERNAME;
    const finalPassword = params.password || process.env.AEM_PASSWORD;

    // Debug logging (only in development/debug mode)
    const isDebug = process.env.LOG_LEVEL === 'debug' || process.env.LOG_LEVEL === 'DEBUG';
    if (isDebug) {
        console.log('[DEBUG] AEM Credentials check:', {
            hasTokenParam: !!params.token,
            hasTokenEnv: !!process.env.AEM_TOKEN,
            tokenLength: process.env.AEM_TOKEN ? process.env.AEM_TOKEN.length : 0,
            hasUsername: !!process.env.AEM_USERNAME,
            hasPassword: !!process.env.AEM_PASSWORD,
            authorUrl: finalAuthorUrl
        });
    }

    const credentials = {};
    // For AEM Cloud Service, prefer username/password over token for QueryBuilder API compatibility
    // Check if this is an AEM Cloud Service instance
    const isAEMCloudService = finalAuthorUrl.includes('adobeaemcloud.com');
    
    // Prefer username/password for AEM Cloud Service, or if both are available
    if (finalUsername && finalPassword && (isAEMCloudService || !finalToken)) {
        credentials.username = finalUsername;
        credentials.password = finalPassword;
        if (isDebug) {
            console.log('[DEBUG] Using username/password authentication (preferred for AEM Cloud Service)');
        }
    } else if (finalToken) {
        credentials.token = finalToken;
        if (isDebug) {
            console.log('[DEBUG] Using Bearer token authentication');
        }
    } else {
        const envVars = [];
        if (!process.env.AEM_TOKEN) envVars.push('AEM_TOKEN');
        if (!process.env.AEM_USERNAME) envVars.push('AEM_USERNAME');
        if (!process.env.AEM_PASSWORD) envVars.push('AEM_PASSWORD');
        
        return { 
            error: `Authentication required. Please provide token or username/password as tool parameters, or set environment variables: ${envVars.join(', ')}. Current env vars status: AEM_TOKEN=${!!process.env.AEM_TOKEN}, AEM_USERNAME=${!!process.env.AEM_USERNAME}, AEM_PASSWORD=${!!process.env.AEM_PASSWORD}` 
        };
    }

    return { authorUrl: finalAuthorUrl, credentials };
}

/**
 * Register all tools with the MCP server
 * @param {McpServer} server - The MCP server instance
 */
function registerTools (server) {
    // Basic echo tool for testing connectivity
    server.tool(
        'echo',
        'A simple utility tool that echoes back the input message. Useful for testing connectivity, debugging, or confirming that the MCP server is responding correctly to requests.',
        {
            message: z.string().describe('The message you want to echo back - useful for testing and debugging')
        },
        async ({ message = 'No message provided' }) => {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Echo: ${message}`
                    }
                ]
            }
        }
    )

    // Example calculation tool
    server.tool(
        'calculator',
        'Perform basic mathematical calculations. Supports arithmetic operations and common mathematical functions.',
        {
            expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 3 * 4", "sqrt(16)", "sin(30)")'),
            format: z.enum(['decimal', 'scientific', 'fraction']).optional().describe('Number format for the result (default: decimal)')
        },
        async ({ expression = '', format = 'decimal' }) => {
            try {
                // CUSTOMIZE: Replace with your preferred math library
                // This is a simple example - consider using a proper math parser for production
                const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, '')

                // Basic validation
                if (!sanitizedExpression) {
                    throw new Error('Invalid expression')
                }

                // WARNING: eval() is dangerous - use a proper math parser in production
                // eslint-disable-next-line no-eval
                const result = eval(sanitizedExpression)
                let formattedResult
                switch (format) {
                case 'scientific':
                    formattedResult = result.toExponential(6)
                    break
                case 'fraction':
                    // Simple fraction approximation
                    formattedResult = `≈ ${result.toFixed(6)}`
                    break
                default:
                    formattedResult = result.toString()
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: `🧮 Calculation Result:\n\nExpression: ${expression}\nResult: ${formattedResult}`
                        }
                    ]
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `❌ Calculation Error:\n\nExpression: ${expression}\nError: ${error.message}\n\nPlease check your expression and try again.`
                        }
                    ]
                }
            }
        }
    )

    // Example weather API tool - demonstrates external API calls
    server.tool(
        'weather',
        'Get current weather information for any city. This tool demonstrates how to integrate with external APIs and handle real-time data.',
        {
            city: z.string().describe('Name of the city to get weather for (e.g., "San Francisco", "New York", "London")')
        },
        async ({ city = 'Unknown City' }) => {
            try {
                // CUSTOMIZE: Replace this section with actual API calls
                // Example API integrations:
                // - OpenWeatherMap API
                // - WeatherAPI.com
                // - AccuWeather API
                //
                // For now, we'll return realistic mock data with random variations

                // Generate realistic spring weather with random variations (always in Celsius)
                const baseTemp = 18 // Spring baseline in Celsius
                const tempVariation = (Math.random() - 0.5) * 20 // ±10 degrees variation
                const temperature = Math.round((baseTemp + tempVariation) * 10) / 10

                const conditions = [
                    'Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain',
                    'Scattered Showers', 'Clear', 'Overcast', 'Drizzle'
                ]
                const currentCondition = conditions[Math.floor(Math.random() * conditions.length)]

                const humidity = Math.floor(Math.random() * 40) + 40 // 40-80%
                const windSpeed = Math.floor(Math.random() * 15) + 5 // 5-20 km/h
                const pressure = Math.floor(Math.random() * 30) + 1000 // 1000-1030 hPa

                // Create realistic weather response
                const weatherData = {
                    city,
                    country: 'Sample Country', // In real API, this would come from the response
                    current: {
                        temperature,
                        condition: currentCondition,
                        humidity: `${humidity}%`,
                        wind_speed: `${windSpeed} km/h`,
                        pressure: `${pressure} hPa`,
                        visibility: `${Math.floor(Math.random() * 5) + 10} km`,
                        uv_index: Math.floor(Math.random() * 8) + 1
                    },
                    last_updated: new Date().toISOString(),
                    source: 'Mock Weather Service (replace with real API)'
                }

                // Format response for display
                let responseText = `🌤️ Weather for ${city}\n`
                responseText += '⚠️ **EXAMPLE DATA - NOT REAL WEATHER** ⚠️\n\n'
                responseText += `🌡️ Temperature: ${temperature}°C\n`
                responseText += `☁️ Conditions: ${currentCondition}\n`
                responseText += `💧 Humidity: ${humidity}%\n`
                responseText += `💨 Wind: ${windSpeed} km/h\n`
                responseText += `📊 Pressure: ${pressure} hPa\n`
                responseText += `👁️ Visibility: ${weatherData.current.visibility}\n`
                responseText += `☀️ UV Index: ${weatherData.current.uv_index}\n`
                responseText += `\n⏰ Last Updated: ${new Date().toLocaleString()}`
                responseText += '\n\n💡 Note: This is mock/example data for demonstration purposes only. Replace with real weather API calls in production.'

                return {
                    content: [
                        {
                            type: 'text',
                            text: responseText
                        }
                    ],
                    // Optional: Include structured data
                    metadata: {
                        source: 'mock-weather-service',
                        city,
                        timestamp: new Date().toISOString(),
                        raw_data: weatherData
                    }
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `❌ Weather Error: Unable to fetch weather data for ${city}.\n\nError: ${error.message}\n\nThis could happen due to:\n- Invalid city name\n- API service unavailable\n- Network connectivity issues\n- API rate limiting\n\nPlease try again with a valid city name.`
                        }
                    ]
                }
            }
        }
    )

    // ====================================
    // AEM AUTOMATION TOOLS
    // ====================================

    // AEM: Create Microsite
    server.tool(
        'aem-create-microsite',
        'Create a new microsite in AEM using Quick Site Creation templates. This tool automates the deployment of complete microsites with initial page structure.',
        {
            siteName: z.string().optional().describe('The site name (optional, will be derived from siteTitle if not provided, e.g., "my-awesome-site")'),
            siteTitle: z.string().describe('The display title of the site (e.g., "My Awesome Site")'),
            authorUrl: z.string().optional().describe('AEM Author URL (default: https://author-p18253-e46622.adobeaemcloud.com)'),
            username: z.string().optional().describe('AEM username for authentication'),
            password: z.string().optional().describe('AEM password for authentication'),
            token: z.string().optional().describe('Bearer token for authentication (alternative to username/password)'),
            templateType: z.enum(['standard', 'basic']).optional().describe('Template type: standard or basic (default: standard)'),
            pages: z.array(z.string()).optional().describe('Initial pages to create (default: ["main", "about", "contact"] - creates pages similar to /content/demo/main.html structure)'),
            parentPath: z.string().optional().describe('Parent path for site creation (default: /content)'),
            overwrite: z.boolean().optional().describe('If true, delete existing site and recreate it (default: false)')
        },
        async ({ 
            siteName, 
            siteTitle, 
            authorUrl,
            username,
            password,
            token,
            templateType = 'standard',
            pages = ['main', 'about', 'contact'], // Changed default to 'main' to match /content/demo/main.html structure
            parentPath = '/content',
            overwrite = false
        }) => {
            try {
                // Get credentials from params or environment variables
                const authResult = getAEMCredentials({ authorUrl, username, password, token });
                if (authResult.error) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Authentication Required\n\n${authResult.error}\n\nExample: "Create a microsite called my-site with username admin and password admin"`
                        }]
                    };
                }

                // Determine template path
                const templatePaths = {
                    standard: '/conf/site-templates/settings/wcm/templates/standard-template',
                    basic: '/conf/site-templates/settings/wcm/templates/basic-template'
                };
                const templatePath = templatePaths[templateType] || templatePaths.standard;

                // Create AEM microsite client
                const aemClient = createAEMMicrositeClient(authResult.authorUrl, authResult.credentials);

                // Derive siteName from siteTitle if not provided
                let finalSiteName = siteName;
                if (!finalSiteName && siteTitle) {
                    finalSiteName = siteTitle.toLowerCase().replace(/\s+/g, '-');
                }
                const sanitizedSiteName = finalSiteName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-');
                const sitePath = `${parentPath}/${sanitizedSiteName}`;

                // If overwrite is true, try to delete whatever exists at the path first
                if (overwrite) {
                    let deleted = false;
                    try {
                        // First, try to delete via the deleteSite method (handles proper sites)
                        await aemClient.deleteSite(sitePath);
                        deleted = true;
                        console.log(`Deleted existing site at ${sitePath}`);
                    } catch (deleteError) {
                        // If deleteSite fails, try direct DELETE request (handles any node type)
                        try {
                            const deleteResponse = await aemClient.axiosInstance.delete(sitePath, {
                                validateStatus: (status) => status < 500 // Accept 404, 403, etc.
                            });
                            if (deleteResponse.status === 200 || deleteResponse.status === 204) {
                                deleted = true;
                                console.log(`Deleted conflicting node at ${sitePath} via direct DELETE`);
                            } else if (deleteResponse.status === 404) {
                                // Node doesn't exist, that's fine
                                console.log(`No node found at ${sitePath}, proceeding with creation`);
                                deleted = true; // Treat as success
                            } else {
                                console.warn(`DELETE returned status ${deleteResponse.status} for ${sitePath}`);
                            }
                        } catch (directDeleteError) {
                            // Log the error but continue - the creation might still work
                            // or will provide a clearer error message
                            const isNotFound = deleteError.message.includes('404') || 
                                             deleteError.message.includes('not found') ||
                                             (directDeleteError.response && directDeleteError.response.status === 404);
                            if (!isNotFound) {
                                console.warn(`Warning: Could not delete existing node at ${sitePath}`);
                                console.warn(`  deleteSite error: ${deleteError.message}`);
                                console.warn(`  direct DELETE error: ${directDeleteError.message}`);
                            } else {
                                deleted = true; // Treat 404 as success
                            }
                        }
                    }
                    
                    // Small delay after deletion to ensure repository state is updated
                    if (deleted) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                // Create the microsite
                const result = await aemClient.createMicrosite({
                    siteName,
                    siteTitle,
                    templatePath,
                    parentPath,
                    pages
                });

                let responseText = '🎉 Microsite Created Successfully!\n\n';
                responseText += `📝 Site Name: ${result.siteName}\n`;
                responseText += `📄 Site Title: ${result.siteTitle}\n`;
                responseText += `📂 Site Path: ${result.sitePath}\n`;
                responseText += `🔗 Author URL: ${result.authorUrl}\n\n`;
                
                if (result.pages && result.pages.length > 0) {
                    responseText += `📑 Created Pages (${result.pages.length}):\n`;
                    result.pages.forEach(page => {
                        responseText += `  • ${page.pageTitle} (${page.pageName})\n`;
                    });
                }

                responseText += `\n✅ ${result.message}`;

                return {
                    content: [{
                        type: 'text',
                        text: responseText
                    }],
                    metadata: {
                        success: true,
                        sitePath: result.sitePath,
                        authorUrl: result.authorUrl
                    }
                };
            } catch (error) {
                // Check if this is a site already exists error
                const siteExists = error.message && (
                    error.message.includes('already exists') || 
                    error.message.includes('409') ||
                    error.message.includes('Site already exists')
                );
                
                // Check if this is an authentication error
                const isAuthError = error.message && error.message.includes('401');
                const hasUsernamePassword = process.env.AEM_USERNAME && process.env.AEM_PASSWORD;
                // Check if token is being used (from params or env)
                const isUsingToken = !!(token || process.env.AEM_TOKEN);
                
                let errorText = `❌ Failed to create microsite\n\nError: ${error.message}\n\n`;
                
                if (siteExists) {
                    // Derive site path for the error message
                    const finalSiteName = siteName || (siteTitle ? siteTitle.toLowerCase().replace(/\s+/g, '-') : 'unknown');
                    const sanitizedSiteName = finalSiteName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-');
                    const sitePath = `${parentPath}/${sanitizedSiteName}`;
                    
                    errorText += `💡 **Site Already Exists**\n\n`;
                    errorText += `The site "${sanitizedSiteName}" already exists at ${sitePath}\n\n`;
                    errorText += `**Options:**\n`;
                    errorText += `1. **Delete and recreate**: Use overwrite=true parameter\n`;
                    errorText += `   Example: "Create microsite yuji-5 with overwrite true"\n\n`;
                    errorText += `2. **Delete manually first**: Use the aem-delete-site tool\n`;
                    errorText += `   Example: "Delete site at ${sitePath} with confirmation true"\n\n`;
                    errorText += `3. **Use a different name**: Choose a different site name\n\n`;
                } else if (isAuthError && isUsingToken && hasUsernamePassword) {
                    errorText += `💡 **Authentication Issue Detected**\n\n`;
                    errorText += `You're using Bearer token authentication, but AEM Cloud Service may require username/password.\n\n`;
                    errorText += `**Try using username/password instead:**\n`;
                    errorText += `- Pass username and password as tool parameters, OR\n`;
                    errorText += `- Ensure AEM_USERNAME and AEM_PASSWORD are set in your environment\n\n`;
                    errorText += `Note: Bearer tokens may expire after 24 hours. If your token has expired, use username/password authentication.\n\n`;
                }
                
                errorText += `**Other possible causes:**\n`;
                errorText += `- Invalid credentials\n`;
                errorText += `- Network connectivity issues\n`;
                errorText += `- AEM instance not accessible\n`;
                errorText += `- Insufficient permissions\n`;
                
                return {
                    content: [{
                        type: 'text',
                        text: errorText
                    }]
                };
            }
        }
    )

    // AEM: List Site Templates
    server.tool(
        'aem-list-templates',
        'List available AEM Quick Site Creation templates that can be used to create new sites.',
        {
            authorUrl: z.string().optional().describe('AEM Author URL (default: https://author-p18253-e46622.adobeaemcloud.com)')
        },
        async ({ authorUrl }) => {
            try {
                // Use environment variable for authorUrl if not provided
                const finalAuthorUrl = authorUrl || process.env.AEM_AUTHOR_URL || 'https://author-p18253-e46622.adobeaemcloud.com';
                // For Quick Site Creation, we can provide the standard templates
                // In a real implementation, you might query AEM for available templates
                const aemClient = createAEMMicrositeClient(finalAuthorUrl, {});
                const templates = await aemClient.getQuickSiteTemplates();

                let responseText = '📚 Available AEM Quick Site Creation Templates\n\n';
                templates.forEach((template, index) => {
                    responseText += `${index + 1}. **${template.name}**\n`;
                    responseText += `   ID: ${template.id}\n`;
                    responseText += `   Description: ${template.description}\n`;
                    responseText += `   Path: ${template.path}\n\n`;
                });

                responseText += '💡 Use the template ID or path when creating a new site.';

                return {
                    content: [{
                        type: 'text',
                        text: responseText
                    }],
                    metadata: {
                        templates: templates
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Failed to list templates\n\nError: ${error.message}`
                    }]
                };
            }
        }
    )

    // AEM: List Sites
    server.tool(
        'aem-list-sites',
        'List existing sites in AEM under a specified path.',
        {
            authorUrl: z.string().optional().describe('AEM Author URL'),
            username: z.string().optional().describe('AEM username'),
            password: z.string().optional().describe('AEM password'),
            token: z.string().optional().describe('Bearer token for authentication'),
            parentPath: z.string().optional().describe('Parent path to list sites from (default: /content)')
        },
        async ({ 
            authorUrl,
            username,
            password,
            token,
            parentPath = '/content'
        }) => {
            try {
                // Get credentials from params or environment variables
                const authResult = getAEMCredentials({ authorUrl, username, password, token });
                if (authResult.error) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Authentication Required\n\n${authResult.error}`
                        }]
                    };
                }

                const aemClient = createAEMMicrositeClient(authResult.authorUrl, authResult.credentials);
                const sites = await aemClient.listSites(parentPath);

                let responseText = `📁 Sites in ${parentPath}\n\n`;
                
                if (sites.length === 0) {
                    responseText += 'No sites found.\n';
                } else {
                    responseText += `Found ${sites.length} site(s):\n\n`;
                    sites.forEach((site, index) => {
                        responseText += `${index + 1}. **${site.title}**\n`;
                        responseText += `   Name: ${site.name}\n`;
                        responseText += `   Path: ${site.path}\n\n`;
                    });
                }

                return {
                    content: [{
                        type: 'text',
                        text: responseText
                    }],
                    metadata: {
                        sites: sites
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Failed to list sites\n\nError: ${error.message}`
                    }]
                };
            }
        }
    )

    // AEM: Get Site Info
    server.tool(
        'aem-get-site-info',
        'Get detailed information about a specific AEM site.',
        {
            sitePath: z.string().describe('Full path to the site (e.g., /content/my-site)'),
            authorUrl: z.string().optional().describe('AEM Author URL'),
            username: z.string().optional().describe('AEM username'),
            password: z.string().optional().describe('AEM password'),
            token: z.string().optional().describe('Bearer token for authentication')
        },
        async ({ 
            sitePath,
            authorUrl,
            username,
            password,
            token
        }) => {
            try {
                // Get credentials from params or environment variables
                const authResult = getAEMCredentials({ authorUrl, username, password, token });
                if (authResult.error) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Authentication Required\n\n${authResult.error}`
                        }]
                    };
                }

                const aemClient = createAEMMicrositeClient(authResult.authorUrl, authResult.credentials);
                const siteInfo = await aemClient.getSiteInfo(sitePath);

                let responseText = `📊 Site Information\n\n`;
                responseText += `Path: ${sitePath}\n`;
                responseText += `Title: ${siteInfo['jcr:content']?.['jcr:title'] || 'N/A'}\n`;
                responseText += `Template: ${siteInfo['jcr:content']?.['cq:template'] || 'N/A'}\n`;
                responseText += `Type: ${siteInfo['jcr:primaryType'] || 'N/A'}\n`;

                return {
                    content: [{
                        type: 'text',
                        text: responseText
                    }],
                    metadata: {
                        siteInfo: siteInfo
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Failed to get site info\n\nError: ${error.message}`
                    }]
                };
            }
        }
    )

    // AEM: Delete Site
    server.tool(
        'aem-delete-site',
        'Delete an AEM site. Use with caution - this action cannot be undone!',
        {
            sitePath: z.string().describe('Full path to the site to delete (e.g., /content/my-site)'),
            authorUrl: z.string().optional().describe('AEM Author URL'),
            username: z.string().optional().describe('AEM username'),
            password: z.string().optional().describe('AEM password'),
            token: z.string().optional().describe('Bearer token for authentication'),
            confirm: z.boolean().describe('Must be true to confirm deletion')
        },
        async ({ 
            sitePath,
            authorUrl,
            username,
            password,
            token,
            confirm
        }) => {
            try {
                if (!confirm) {
                    return {
                        content: [{
                            type: 'text',
                            text: '⚠️ Deletion Cancelled\n\nYou must set confirm=true to delete a site.\n\nThis is a safety measure to prevent accidental deletions.'
                        }]
                    };
                }

                // Get credentials from params or environment variables
                const authResult = getAEMCredentials({ authorUrl, username, password, token });
                if (authResult.error) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Authentication Required\n\n${authResult.error}`
                        }]
                    };
                }

                const aemClient = createAEMMicrositeClient(authResult.authorUrl, authResult.credentials);
                const result = await aemClient.deleteSite(sitePath);

                return {
                    content: [{
                        type: 'text',
                        text: `✅ ${result.message}`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Failed to delete site\n\nError: ${error.message}`
                    }]
                };
            }
        }
    )

    // ====================================
    // AEM EXTENDED TOOLS
    // ====================================

    // AEM: Create Component
    server.tool(
        'aem-create-component',
        'Create a new AEM component with dialog configuration and HTL template. This tool helps scaffold custom components for your AEM project.',
        {
            componentName: z.string().describe('Name of the component (e.g., "hero-banner", "product-card")'),
            componentTitle: z.string().describe('Display title of the component (e.g., "Hero Banner", "Product Card")'),
            componentPath: z.string().describe('Path where the component will be created (e.g., "/apps/mysite/components/content")'),
            componentGroup: z.string().optional().describe('Component group for categorization (default: "Custom Components")'),
            properties: z.array(z.object({
                name: z.string(),
                type: z.enum(['textfield', 'textarea', 'pathfield', 'checkbox', 'select', 'multifield']),
                label: z.string(),
                required: z.boolean().optional()
            })).optional().describe('Component properties/fields for the dialog'),
            authorUrl: z.string().optional().describe('AEM Author URL'),
            username: z.string().optional().describe('AEM username'),
            password: z.string().optional().describe('AEM password'),
            token: z.string().optional().describe('Bearer token for authentication')
        },
        async ({ 
            componentName,
            componentTitle,
            componentPath,
            componentGroup = 'Custom Components',
            properties = [],
            authorUrl,
            username,
            password,
            token
        }) => {
            try {
                // Get credentials from params or environment variables
                const authResult = getAEMCredentials({ authorUrl, username, password, token });
                if (authResult.error) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Authentication Required\n\n${authResult.error}`
                        }]
                    };
                }

                const aemClient = createAEMMicrositeClient(authResult.authorUrl, authResult.credentials);
                const result = await aemClient.createComponent({
                    componentName,
                    componentTitle,
                    componentPath,
                    componentGroup,
                    properties
                });

                let responseText = '🎨 Component Created Successfully!\n\n';
                responseText += `📝 Component Name: ${result.componentName}\n`;
                responseText += `📄 Component Title: ${result.componentTitle}\n`;
                responseText += `📂 Component Path: ${result.fullPath}\n`;
                responseText += `🏷️  Component Group: ${componentGroup}\n\n`;
                
                if (properties.length > 0) {
                    responseText += `⚙️  Properties (${properties.length}):\n`;
                    properties.forEach(prop => {
                        responseText += `  • ${prop.label} (${prop.name}) - ${prop.type}\n`;
                    });
                    responseText += '\n';
                }

                responseText += `✅ ${result.message}\n\n`;
                responseText += `📋 Next Steps:\n`;
                responseText += `  1. Edit the HTL template: ${result.fullPath}/${componentName}.html\n`;
                responseText += `  2. Add custom styling if needed\n`;
                responseText += `  3. Test the component on a page\n`;

                return {
                    content: [{
                        type: 'text',
                        text: responseText
                    }],
                    metadata: {
                        success: true,
                        componentPath: result.fullPath,
                        componentName: result.componentName
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Failed to create component\n\nError: ${error.message}\n\nPossible causes:\n- Invalid credentials\n- Component path doesn't exist\n- Insufficient permissions\n- Component already exists`
                    }]
                };
            }
        }
    )

    // AEM: Create Content Fragment
    server.tool(
        'aem-create-content-fragment',
        'Create and manage AEM Content Fragments. Content Fragments are structured content elements that can be reused across channels.',
        {
            fragmentTitle: z.string().describe('Title of the content fragment'),
            fragmentPath: z.string().describe('Path where the fragment will be created (e.g., "/content/dam/mysite/fragments")'),
            modelPath: z.string().describe('Path to the Content Fragment Model (e.g., "/conf/mysite/settings/dam/cfm/models/article")'),
            fields: z.record(z.any()).describe('Field values as key-value pairs (e.g., {"title": "My Article", "description": "Article description"})'),
            authorUrl: z.string().optional().describe('AEM Author URL'),
            username: z.string().optional().describe('AEM username'),
            password: z.string().optional().describe('AEM password'),
            token: z.string().optional().describe('Bearer token for authentication')
        },
        async ({ 
            fragmentTitle,
            fragmentPath,
            modelPath,
            fields = {},
            authorUrl,
            username,
            password,
            token
        }) => {
            try {
                // Get credentials from params or environment variables
                const authResult = getAEMCredentials({ authorUrl, username, password, token });
                if (authResult.error) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Authentication Required\n\n${authResult.error}`
                        }]
                    };
                }

                const aemClient = createAEMMicrositeClient(authResult.authorUrl, authResult.credentials);
                const result = await aemClient.createContentFragment({
                    fragmentTitle,
                    fragmentPath,
                    modelPath,
                    fields
                });

                let responseText = '📝 Content Fragment Created Successfully!\n\n';
                responseText += `📄 Title: ${fragmentTitle}\n`;
                responseText += `📂 Path: ${result.fullPath}\n`;
                responseText += `🎯 Model: ${modelPath}\n\n`;
                
                const fieldCount = Object.keys(fields).length;
                if (fieldCount > 0) {
                    responseText += `⚙️  Fields (${fieldCount}):\n`;
                    Object.entries(fields).forEach(([key, value]) => {
                        const displayValue = typeof value === 'string' && value.length > 50 
                            ? value.substring(0, 47) + '...' 
                            : value;
                        responseText += `  • ${key}: ${displayValue}\n`;
                    });
                    responseText += '\n';
                }

                responseText += `✅ ${result.message}\n\n`;
                responseText += `📋 Next Steps:\n`;
                responseText += `  1. Review the fragment in AEM Assets\n`;
                responseText += `  2. Add variations if needed\n`;
                responseText += `  3. Use the fragment in your pages or headless apps\n`;

                return {
                    content: [{
                        type: 'text',
                        text: responseText
                    }],
                    metadata: {
                        success: true,
                        fragmentPath: result.fullPath,
                        fragmentTitle: fragmentTitle
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Failed to create content fragment\n\nError: ${error.message}\n\nPossible causes:\n- Invalid credentials\n- Content Fragment Model doesn't exist\n- Invalid fragment path\n- Insufficient permissions\n- Invalid field values`
                    }]
                };
            }
        }
    )

    // AEM: Upload Asset
    server.tool(
        'aem-upload-asset',
        'Upload digital assets (images, documents, videos) to AEM DAM (Digital Asset Management). Supports metadata and folder organization.',
        {
            assetName: z.string().describe('Name of the asset file (e.g., "hero-image.jpg", "product-guide.pdf")'),
            damPath: z.string().describe('DAM path where asset will be uploaded (e.g., "/content/dam/mysite/images")'),
            assetUrl: z.string().optional().describe('URL to download the asset from (if uploading from external source)'),
            assetData: z.string().optional().describe('Base64 encoded asset data (if uploading directly)'),
            mimeType: z.string().optional().describe('MIME type of the asset (e.g., "image/jpeg", "application/pdf")'),
            metadata: z.record(z.string()).optional().describe('Asset metadata as key-value pairs (e.g., {"dc:title": "Hero Image", "dc:description": "Main hero banner"})'),
            authorUrl: z.string().optional().describe('AEM Author URL'),
            username: z.string().optional().describe('AEM username'),
            password: z.string().optional().describe('AEM password'),
            token: z.string().optional().describe('Bearer token for authentication')
        },
        async ({ 
            assetName,
            damPath,
            assetUrl,
            assetData,
            mimeType = 'application/octet-stream',
            metadata = {},
            authorUrl,
            username,
            password,
            token
        }) => {
            try {
                if (!assetUrl && !assetData) {
                    return {
                        content: [{
                            type: 'text',
                            text: '❌ Asset Source Required\n\nPlease provide either:\n- assetUrl: URL to download the asset from\n- assetData: Base64 encoded asset data'
                        }]
                    };
                }

                // Get credentials from params or environment variables
                const authResult = getAEMCredentials({ authorUrl, username, password, token });
                if (authResult.error) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Authentication Required\n\n${authResult.error}`
                        }]
                    };
                }

                const aemClient = createAEMAssetClient(authResult.authorUrl, authResult.credentials);
                const result = await aemClient.uploadAsset({
                    assetName,
                    damPath,
                    assetUrl,
                    assetData,
                    mimeType,
                    metadata
                });

                let responseText = '📤 Asset Uploaded Successfully!\n\n';
                responseText += `📄 Asset Name: ${assetName}\n`;
                responseText += `📂 DAM Path: ${result.fullPath}\n`;
                responseText += `🏷️  MIME Type: ${mimeType}\n`;
                
                if (result.fileSize) {
                    responseText += `📊 File Size: ${result.fileSize}\n`;
                }
                
                responseText += '\n';
                
                const metadataCount = Object.keys(metadata).length;
                if (metadataCount > 0) {
                    responseText += `🏷️  Metadata (${metadataCount}):\n`;
                    Object.entries(metadata).forEach(([key, value]) => {
                        responseText += `  • ${key}: ${value}\n`;
                    });
                    responseText += '\n';
                }

                responseText += `✅ ${result.message}\n\n`;
                responseText += `📋 Next Steps:\n`;
                responseText += `  1. View the asset in AEM Assets\n`;
                responseText += `  2. Process the asset (generate renditions)\n`;
                responseText += `  3. Use the asset in your pages or content fragments\n`;

                return {
                    content: [{
                        type: 'text',
                        text: responseText
                    }],
                    metadata: {
                        success: true,
                        assetPath: result.fullPath,
                        assetName: assetName
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Failed to upload asset\n\nError: ${error.message}\n\nPossible causes:\n- Invalid credentials\n- DAM path doesn't exist\n- Asset download failed (if using URL)\n- Invalid asset data\n- Insufficient permissions\n- File size too large`
                    }]
                };
            }
        }
    )

    // AEM: Start Workflow
    server.tool(
        'aem-start-workflow',
        'Start an AEM workflow for content approval, asset processing, or custom automation. Workflows help orchestrate content operations.',
        {
            workflowModel: z.string().describe('Path to the workflow model (e.g., "/var/workflow/models/dam/update_asset")'),
            payloadPath: z.string().describe('Path to the content/asset to process (e.g., "/content/mysite/en/home", "/content/dam/mysite/image.jpg")'),
            workflowTitle: z.string().optional().describe('Title for this workflow instance'),
            workflowData: z.record(z.any()).optional().describe('Additional workflow data as key-value pairs'),
            authorUrl: z.string().optional().describe('AEM Author URL'),
            username: z.string().optional().describe('AEM username'),
            password: z.string().optional().describe('AEM password'),
            token: z.string().optional().describe('Bearer token for authentication')
        },
        async ({ 
            workflowModel,
            payloadPath,
            workflowTitle,
            workflowData = {},
            authorUrl,
            username,
            password,
            token
        }) => {
            try {
                // Get credentials from params or environment variables
                const authResult = getAEMCredentials({ authorUrl, username, password, token });
                if (authResult.error) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Authentication Required\n\n${authResult.error}`
                        }]
                    };
                }

                const aemClient = createAEMMicrositeClient(authResult.authorUrl, authResult.credentials);
                const result = await aemClient.startWorkflow({
                    workflowModel,
                    payloadPath,
                    workflowTitle: workflowTitle || `Workflow for ${payloadPath}`,
                    workflowData
                });

                let responseText = '🔄 Workflow Started Successfully!\n\n';
                responseText += `📝 Workflow ID: ${result.workflowId}\n`;
                responseText += `🎯 Model: ${workflowModel}\n`;
                responseText += `📂 Payload: ${payloadPath}\n`;
                
                if (workflowTitle) {
                    responseText += `📄 Title: ${workflowTitle}\n`;
                }
                
                responseText += `📊 Status: ${result.status || 'RUNNING'}\n\n`;
                
                const dataCount = Object.keys(workflowData).length;
                if (dataCount > 0) {
                    responseText += `⚙️  Workflow Data (${dataCount}):\n`;
                    Object.entries(workflowData).forEach(([key, value]) => {
                        responseText += `  • ${key}: ${value}\n`;
                    });
                    responseText += '\n';
                }

                responseText += `✅ ${result.message}\n\n`;
                responseText += `📋 Monitoring:\n`;
                responseText += `  1. Check workflow status in AEM Workflow Console\n`;
                responseText += `  2. View workflow history for the payload\n`;
                responseText += `  3. Monitor workflow inbox for tasks\n`;

                return {
                    content: [{
                        type: 'text',
                        text: responseText
                    }],
                    metadata: {
                        success: true,
                        workflowId: result.workflowId,
                        payloadPath: payloadPath
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Failed to start workflow\n\nError: ${error.message}\n\nPossible causes:\n- Invalid credentials\n- Workflow model doesn't exist\n- Payload path is invalid\n- Insufficient permissions\n- Workflow model is disabled`
                    }]
                };
            }
        }
    )

    // AEM: Search Assets
    server.tool(
        'aem-search-assets',
        'Search for assets in AEM DAM by filename and metadata properties (dc:title, dc:description, dc:subject, product:brand, product:sku). Returns matching assets with their metadata and paths. Supports search and replace to rename values in results.',
        {
            query: z.string().optional().describe('General search query that searches filename and metadata properties (dc:title, dc:description, dc:subject, product:brand, product:sku)'),
            filename: z.string().optional().describe('Specific filename to search for (partial matches supported)'),
            title: z.string().optional().describe('Specific dc:title metadata value to search for (partial matches supported)'),
            damPath: z.string().optional().default('/content/dam').describe('DAM path to search within (default: /content/dam)'),
            limit: z.number().optional().describe('Maximum number of results to return (default: 50)'),
            offset: z.number().optional().describe('Result offset for pagination (default: 0)'),
            searchValue: z.string().optional().describe('Value to search for in asset metadata values (case-insensitive). If provided, all matching values will be replaced with replaceValue.'),
            replaceValue: z.string().optional().describe('Value to replace searchValue with in asset metadata. Required if searchValue is provided.'),
            authorUrl: z.string().optional().describe('AEM Author URL'),
            server: z.string().optional().describe('AEM Author URL (alias for authorUrl)'),
            username: z.string().optional().describe('AEM username'),
            password: z.string().optional().describe('AEM password'),
            token: z.string().optional().describe('Bearer token for authentication')
        },
        async ({ 
            query,
            filename,
            title,
            damPath,
            limit,
            offset,
            searchValue,
            replaceValue,
            authorUrl,
            server,
            username,
            password,
            token
        }) => {
            try {
                // Validate that at least one search parameter is provided
                if (!query && !filename && !title) {
                    return {
                        content: [{
                            type: 'text',
                            text: '❌ Search Parameter Required\n\nPlease provide at least one of:\n- query: General search (searches filename and metadata: dc:title, dc:description, dc:subject, product:brand, product:sku)\n- filename: Search by filename\n- title: Search by dc:title metadata\n\nExample: "Search for assets with query summer" or "Search assets with filename banner.jpg"'
                        }]
                    };
                }

                // Get credentials from params or environment variables (support both authorUrl and server)
                const authResult = getAEMCredentials({ authorUrl: authorUrl || server, username, password, token });
                if (authResult.error) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Authentication Required\n\n${authResult.error}\n\nDebug info:\n- AEM_AUTHOR_URL env: ${process.env.AEM_AUTHOR_URL ? 'set' : 'not set'}\n- AEM_TOKEN env: ${process.env.AEM_TOKEN ? 'set (length: ' + process.env.AEM_TOKEN.length + ')' : 'not set'}\n- AEM_USERNAME env: ${process.env.AEM_USERNAME ? 'set' : 'not set'}`
                        }]
                    };
                }

                // Validate search and replace parameters
                if (searchValue !== undefined && searchValue !== null && searchValue !== '' && replaceValue === undefined) {
                    return {
                        content: [{
                            type: 'text',
                            text: '❌ Replace Value Required\n\nWhen using searchValue, you must also provide replaceValue.\n\nExample: "Search for assets with query summer and replace old-brand with new-brand"'
                        }]
                    };
                }

                const aemClient = createAEMAssetClient(authResult.authorUrl, authResult.credentials);
                const result = await aemClient.searchAssets({
                    query,
                    filename,
                    title,
                    damPath: damPath || '/content/dam', // Default to /content/dam if not provided
                    limit,
                    offset,
                    searchValue,
                    replaceValue
                });

                let responseText = '🔍 Asset Search Results\n\n';
                responseText += `📊 Found: ${result.count} asset(s) (Total: ${result.total})\n`;
                responseText += `📂 Search Path: ${result.damPath}\n`;
                
                if (query) {
                    responseText += `🔎 Query: "${query}"\n`;
                } else {
                    const searchTerms = [];
                    if (filename) searchTerms.push(`filename: "${filename}"`);
                    if (title) searchTerms.push(`title: "${title}"`);
                    responseText += `🔎 Search Terms: ${searchTerms.join(', ')}\n`;
                }
                
                if (searchValue !== undefined && searchValue !== null && searchValue !== '') {
                    responseText += `🔄 Value Replacement: "${searchValue}" → "${replaceValue || ''}"\n`;
                }
                
                responseText += '\n';

                if (result.results.length === 0) {
                    responseText += 'No assets found matching your search criteria.\n\n';
                    responseText += '💡 Tips:\n';
                    responseText += '  • Try a broader search query\n';
                    responseText += '  • Check if the DAM path is correct\n';
                    responseText += '  • Verify asset metadata exists\n';
                } else {
                    responseText += `📑 Results:\n\n`;
                    result.results.forEach((asset, index) => {
                        responseText += `${index + 1}. **${asset.name}**\n`;
                        responseText += `   📄 Title: ${asset.title}\n`;
                        responseText += `   📂 Path: ${asset.path}\n`;
                        responseText += `   🔗 URL: ${asset.url}\n`;
                        
                        // Show some metadata if available
                        if (asset.metadata && Object.keys(asset.metadata).length > 0) {
                            const metadataKeys = Object.keys(asset.metadata).slice(0, 3);
                            if (metadataKeys.length > 0) {
                                responseText += `   🏷️  Metadata: `;
                                const metadataPairs = metadataKeys.map(key => {
                                    const value = asset.metadata[key];
                                    return `${key}: ${typeof value === 'string' && value.length > 30 ? value.substring(0, 27) + '...' : value}`;
                                });
                                responseText += metadataPairs.join(', ');
                                responseText += '\n';
                            }
                        }
                        responseText += '\n';
                    });

                    if (result.total > result.count) {
                        responseText += `\n💡 Showing ${result.count} of ${result.total} results. Use limit and offset parameters for pagination.\n`;
                    }
                }

                responseText += `\n✅ ${result.message}`;

                return {
                    content: [{
                        type: 'text',
                        text: responseText
                    }],
                    metadata: {
                        success: true,
                        total: result.total,
                        count: result.count,
                        results: result.results
                    }
                };
            } catch (error) {
                // Check if this is an authentication error
                const isAuthError = error.message && error.message.includes('401');
                const hasUsernamePassword = process.env.AEM_USERNAME && process.env.AEM_PASSWORD;
                // Check if token is being used (from params or env)
                const isUsingToken = !!(token || process.env.AEM_TOKEN);
                
                let errorText = `❌ Failed to search assets\n\nError: ${error.message}\n\n`;
                
                if (isAuthError && isUsingToken && hasUsernamePassword) {
                    errorText += `💡 **Authentication Issue Detected**\n\n`;
                    errorText += `You're using Bearer token authentication, but AEM Cloud Service may require username/password for QueryBuilder API.\n\n`;
                    errorText += `**Try using username/password instead:**\n`;
                    errorText += `- Pass username and password as tool parameters, OR\n`;
                    errorText += `- Ensure AEM_USERNAME and AEM_PASSWORD are set in your environment\n\n`;
                    errorText += `Note: Bearer tokens may expire after 24 hours. If your token has expired, use username/password authentication.\n\n`;
                }
                
                errorText += `**Other possible causes:**\n`;
                errorText += `- Invalid credentials\n`;
                errorText += `- AEM QueryBuilder API not accessible\n`;
                errorText += `- Invalid DAM path\n`;
                errorText += `- Insufficient permissions\n`;
                errorText += `- Network connectivity issues\n`;
                
                return {
                    content: [{
                        type: 'text',
                        text: errorText
                    }]
                };
            }
        }
    )

    // AEM: Rename Asset
    server.tool(
        'aem-rename-asset',
        'Rename an asset in AEM DAM by changing its filename. The asset will be moved to a new path with the new name.',
        {
            assetPath: z.string().describe('Current path of the asset (e.g., /content/dam/Ford/old-name.png)'),
            newName: z.string().describe('New name for the asset (e.g., new-name.png). Can include file extension.'),
            authorUrl: z.string().optional().describe('AEM Author URL'),
            username: z.string().optional().describe('AEM username'),
            password: z.string().optional().describe('AEM password'),
            token: z.string().optional().describe('Bearer token for authentication')
        },
        async ({
            assetPath,
            newName,
            authorUrl,
            username,
            password,
            token
        }) => {
            try {
                // Get credentials from params or environment variables
                const authResult = getAEMCredentials({ authorUrl, username, password, token });
                if (authResult.error) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Authentication Required\n\n${authResult.error}`
                        }]
                    };
                }

                const aemClient = createAEMAssetClient(authResult.authorUrl, authResult.credentials);
                const result = await aemClient.renameAsset(assetPath, newName);

                let responseText = '✅ Asset Renamed Successfully!\n\n';
                responseText += `📄 Old Name: ${assetPath.split('/').pop()}\n`;
                responseText += `📄 New Name: ${result.newName}\n`;
                responseText += `📂 Old Path: ${result.oldPath}\n`;
                responseText += `📂 New Path: ${result.newPath}\n`;
                responseText += `🔗 New URL: ${authResult.authorUrl}${result.newPath}\n`;

                return {
                    content: [{
                        type: 'text',
                        text: responseText
                    }],
                    metadata: {
                        success: true,
                        oldPath: result.oldPath,
                        newPath: result.newPath,
                        newName: result.newName
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Failed to rename asset\n\nError: ${error.message}\n\nPossible causes:\n- Asset not found at the specified path\n- Target name already exists\n- Invalid asset path format\n- Insufficient permissions\n- Network connectivity issues`
                    }]
                };
            }
        }
    )


}

/**
 * Register resources with the MCP server
 * Resources provide static content that AI assistants can access
 * @param {McpServer} server - The MCP server instance
 */
function registerResources (server) {
    // Example static resource
    server.resource(
        'example-resource-1',
        'example://resource1',
        {
            name: 'Example Resource 1',
            description: 'A sample text resource for demonstration purposes',
            mimeType: 'text/plain'
        },
        async () => {
            return {
                contents: [
                    {
                        uri: 'example://resource1',
                        text: 'This is the content of example resource 1. It demonstrates how resources work in the MCP protocol. Resources can contain documentation, reference data, configuration files, or any static content your AI assistant might need.',
                        mimeType: 'text/plain'
                    }
                ]
            }
        }
    )

    // API Documentation resource
    server.resource(
        'api-docs',
        'docs://api',
        {
            name: 'API Documentation',
            description: 'Example API documentation resource',
            mimeType: 'text/markdown'
        },
        async () => {
            const content = `# API Documentation

## Overview
This is example API documentation that demonstrates how to provide structured information through MCP resources.

## Endpoints

### GET /api/users
Returns a list of users.

**Response:**
\`\`\`json
{
  "users": [
    {"id": 1, "name": "John Doe", "email": "john@example.com"}
  ]
}
\`\`\`

### POST /api/users
Creates a new user.

**Request Body:**
\`\`\`json
{
  "name": "string",
  "email": "string"
}
\`\`\`

CUSTOMIZE: Replace this with your actual API documentation, database schemas, or any reference material.`

            return {
                contents: [
                    {
                        uri: 'docs://api',
                        text: content,
                        mimeType: 'text/markdown'
                    }
                ]
            }
        }
    )

    // Configuration resource
    server.resource(
        'config-settings',
        'config://settings',
        {
            name: 'Configuration Settings',
            description: 'Example configuration and settings reference',
            mimeType: 'application/json'
        },
        async () => {
            const config = {
                server: {
                    name: 'my-mcp-server',
                    version: '1.0.0',
                    environment: 'production'
                },
                features: {
                    tools_enabled: true,
                    resources_enabled: true,
                    prompts_enabled: true
                },
                limits: {
                    max_response_size: '1MB',
                    timeout: '30s'
                },
                note: 'CUSTOMIZE: Replace with your actual configuration schema'
            }

            return {
                contents: [
                    {
                        uri: 'config://settings',
                        text: JSON.stringify(config, null, 2),
                        mimeType: 'application/json'
                    }
                ]
            }
        }
    )


}

/**
 * Register prompts with the MCP server
 * Prompts are reusable templates that AI assistants can use
 * @param {McpServer} server - The MCP server instance
 */
function registerPrompts (server) {
    // Weather information prompt
    server.prompt(
        'weather-info',
        'Simple prompt to explain the weather tool functionality',
        {
            city: z.string().optional().describe('City name to use in the example')
        },
        async ({ city = 'San Francisco' }) => {
            const template = `Explain how the weather tool works in this MCP server.

Example city: ${city}

The weather tool:
- Takes a city name as input
- Returns current weather information
- Shows temperature, conditions, humidity, wind, and other details
- Currently uses mock/example data for demonstration
- Can be replaced with real weather API calls for production use

Note: This is a demonstration tool that shows how to build weather functionality in an MCP server.`

            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: template
                        }
                    }
                ]
            }
        }
    )


}

// Export all functions for CommonJS
module.exports = {
    registerTools,
    registerResources,
    registerPrompts
}
