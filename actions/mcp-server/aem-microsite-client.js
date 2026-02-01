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
 * AEM Microsite Client - Client for AEM microsite, component, and content fragment operations
 * 
 * This module provides utilities for:
 * - Site creation using Quick Site Creation
 * - Template management
 * - Component creation and management
 * - Content Fragment creation
 * - Workflow operations
 */

const { AEMClientBase } = require('./aem-client-base');

/**
 * AEM Microsite Client - Extends base client with microsite-specific operations
 */
class AEMMicrositeClient extends AEMClientBase {
    /**
     * List available site templates
     */
    async listSiteTemplates() {
        try {
            // AEM Quick Site Creation template endpoint
            const response = await this.axiosInstance.get('/libs/wcm/core/content/sites/templates.json');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to list site templates: ${error.message}`);
        }
    }

    /**
     * Get available Quick Site Creation templates
     */
    async getQuickSiteTemplates() {
        try {
            // Default Quick Site Creation templates in AEM CS
            const templates = [
                {
                    id: 'aem-site-template-standard',
                    name: 'Standard Site Template',
                    description: 'The standard AEM Quick Site Creation template with modern styling',
                    path: '/conf/site-templates/settings/wcm/templates/standard-template'
                },
                {
                    id: 'aem-site-template-basic',
                    name: 'Basic Site Template',
                    description: 'A basic template for simple sites',
                    path: '/conf/site-templates/settings/wcm/templates/basic-template'
                }
            ];
            
            return templates;
        } catch (error) {
            throw new Error(`Failed to get Quick Site templates: ${error.message}`);
        }
    }

    /**
     * Create a new site using AEM's Sling POST servlet
     * @param {Object} siteConfig - Site configuration
     * @param {string} siteConfig.siteName - The site name (optional, derived from siteTitle if not provided)
     * @param {string} siteConfig.siteTitle - The site title (required)
     * @param {string} siteConfig.templatePath - Path to the site template
     * @param {string} siteConfig.parentPath - Parent path (default: /content)
     * @param {string} siteConfig.language - Language code (default: en)
     * @param {string} siteConfig.country - Country code (default: US)
     */
    async createSite(siteConfig) {
        try {
            let {
                siteName,
                siteTitle,
                templatePath = '/conf/site-templates/settings/wcm/templates/standard-template',
                parentPath = '/content',
                language = 'en',
                country = 'US'
            } = siteConfig;

            // Validate required fields
            if (!siteTitle) {
                throw new Error('siteTitle is required');
            }

            // Derive siteName from siteTitle if not provided
            if (!siteName) {
                siteName = siteTitle.toLowerCase().replace(/\s+/g, '-');
            }

            // Sanitize site name (remove spaces, special chars, replace with hyphens)
            const sanitizedSiteName = siteName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-');
            const sitePath = `${parentPath}/${sanitizedSiteName}`;

            // Create site using AEM's Sling POST servlet
            // Use form-encoded data for proper cq:Page creation
            const formData = new URLSearchParams();
            formData.append('jcr:primaryType', 'cq:Page');
            formData.append('jcr:content/jcr:primaryType', 'cq:PageContent');
            formData.append('jcr:content/jcr:title', siteTitle);
            formData.append('jcr:content/cq:template', templatePath);
            formData.append('jcr:content/sling:resourceType', 'core/wcm/components/page/v3/page');
            formData.append('jcr:content/language', language);
            formData.append('jcr:content/country', country);

            // POST to create the site
            await this.axiosInstance.post(
                sitePath,
                formData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            return {
                success: true,
                sitePath: sitePath,
                siteName: sanitizedSiteName,
                siteTitle: siteTitle,
                authorUrl: `${this.authorUrl}/editor.html${sitePath}.html`,
                message: 'Site created successfully'
            };
        } catch (error) {
            throw new Error(`Failed to create site: ${error.message}`);
        }
    }

    /**
     * Create a microsite with home page and initial structure
     * siteName is optional and will be derived from siteTitle if not provided
     */
    async createMicrosite(micrositeConfig) {
        try {
            let {
                siteName,
                siteTitle,
                templatePath,
                parentPath = '/content',
                pages = ['main', 'about', 'contact'] // Changed default from 'home' to 'main' to match /content/demo/main.html structure
            } = micrositeConfig;

            // Derive siteName from siteTitle if not provided
            if (!siteName && siteTitle) {
                siteName = siteTitle.toLowerCase().replace(/\s+/g, '-');
            }

            // First, create the site root (similar to /content/demo structure)
            const siteResult = await this.createSite({
                siteName,
                siteTitle,
                templatePath,
                parentPath
            });

            // Then create initial page structure (pages like /content/demo/main.html)
            const createdPages = [];
            for (const pageName of pages) {
                try {
                    // Capitalize first letter for page title
                    const pageTitle = pageName.charAt(0).toUpperCase() + pageName.slice(1);
                    
                    const pageResult = await this.createPage({
                        sitePath: siteResult.sitePath,
                        pageName,
                        pageTitle: pageTitle
                    });
                    createdPages.push({
                        pageName: pageResult.pageName,
                        pageTitle: pageResult.pageTitle,
                        pagePath: pageResult.pagePath,
                        url: pageResult.url
                    });
                } catch (pageError) {
                    console.warn(`Could not create page ${pageName}: ${pageError.message}`);
                }
            }

            return {
                ...siteResult,
                pages: createdPages,
                message: `Microsite created with ${createdPages.length} pages (structure similar to /content/demo/main.html)`
            };
        } catch (error) {
            throw new Error(`Failed to create microsite: ${error.message}`);
        }
    }

    /**
     * Check if a page exists at the given path
     */
    async pageExists(pagePath) {
        try {
            const response = await this.axiosInstance.get(`${pagePath}.json`, {
                validateStatus: (status) => status === 200 || status === 404
            });
            return response.status === 200 && response.data && response.data['jcr:primaryType'] === 'cq:Page';
        } catch (error) {
            return false;
        }
    }

    /**
     * Verify page was created and jcr:content exists
     */
    async verifyPageCreated(pagePath, maxRetries = 5, delayMs = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await this.axiosInstance.get(`${pagePath}.json`, {
                    validateStatus: (status) => status === 200 || status === 404
                });
                
                if (response.status === 200 && response.data) {
                    // Check if page node exists
                    if (response.data['jcr:primaryType'] === 'cq:Page') {
                        // Check if jcr:content exists
                        if (response.data['jcr:content']) {
                            return true;
                        }
                    }
                }
            } catch (error) {
                // Continue to retry
            }
            
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        return false;
    }

    /**
     * Check if error is a conflict error (OakState0001 or similar)
     */
    isConflictError(error) {
        if (!error.response) return false;
        
        const status = error.response.status;
        const errorText = JSON.stringify(error.response.data || {}).toLowerCase();
        const errorMessage = (error.message || '').toLowerCase();
        
        // Check for conflict indicators
        return (
            status === 500 || 
            status === 409 ||
            errorText.includes('oakstate0001') ||
            errorText.includes('unresolved conflicts') ||
            errorText.includes('conflict') ||
            errorMessage.includes('oakstate0001') ||
            errorMessage.includes('unresolved conflicts') ||
            errorMessage.includes('invaliditemstateexception')
        );
    }

    /**
     * Create a page under a site
     */
    async createPage(pageConfig) {
        try {
            const {
                sitePath,
                pageName,
                pageTitle,
                templatePath = '/conf/site-templates/settings/wcm/templates/page-template'
            } = pageConfig;

            const pagePath = `${sitePath}/${pageName}`;

            // Use form-encoded data for proper cq:Page creation
            const formData = new URLSearchParams();
            formData.append('jcr:primaryType', 'cq:Page');
            formData.append('jcr:content/jcr:primaryType', 'cq:PageContent');
            formData.append('jcr:content/jcr:title', pageTitle);
            formData.append('jcr:content/cq:template', templatePath);
            formData.append('jcr:content/sling:resourceType', 'core/wcm/components/page/v3/page');
            
            // Add root container node
            formData.append('jcr:content/root/jcr:primaryType', 'nt:unstructured');
            formData.append('jcr:content/root/layout', 'responsiveGrid');
            formData.append('jcr:content/root/sling:resourceType', 'core/wcm/components/container/v1/container');
            
            // Add container node under root
            formData.append('jcr:content/root/container/jcr:primaryType', 'nt:unstructured');
            formData.append('jcr:content/root/container/sling:resourceType', 'core/wcm/components/container/v1/container');

            // Add title node under root
            formData.append('jcr:content/root/container/title/jcr:primaryType', 'nt:unstructured');
            formData.append('jcr:content/root/container/title/sling:resourceType', 'core/wcm/components/title/v3/title');

            
            // Add teaser component under container_1
            formData.append('jcr:content/root/container/teaser/jcr:primaryType', 'nt:unstructured');
            formData.append('jcr:content/root/container/teaser/sling:resourceType', 'core/wcm/components/teaser/v2/teaser');
            formData.append('jcr:content/root/container/teaser/actionsEnabled', 'true');
            formData.append('jcr:content/root/container/teaser/altValueFromDAM', 'false');
            formData.append('jcr:content/root/container/teaser/descriptionFromPage', 'false');
            formData.append('jcr:content/root/container/teaser/disableLazyLoading', 'true');
            formData.append('jcr:content/root/container/teaser/fileReference', '/content/dam/site-templates/Image@2x.png');
            formData.append('jcr:content/root/container/teaser/imageFromPageImage', 'false');
            formData.append('jcr:content/root/container/teaser/isDecorative', 'false');
            formData.append('jcr:content/root/container/teaser/jcr:description', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>');
            formData.append('jcr:content/root/container/teaser/jcr:title', 'This is a Teaser');
            formData.append('jcr:content/root/container/teaser/pretitle', 'Teaser');
            formData.append('jcr:content/root/container/teaser/textIsRich', 'true');
            
            // Add container_2 node under container
            //formData.append('jcr:content/root/container/container_2/jcr:primaryType', 'nt:unstructured');
            //formData.append('jcr:content/root/container/container_2/sling:resourceType', 'core/wcm/components/container/v1/container');

            await this.axiosInstance.post(
                pagePath,
                formData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            return {
                pagePath,
                pageName,
                pageTitle,
                url: `${this.authorUrl}/editor.html${pagePath}.html`
            };
        } catch (error) {
            throw new Error(`Failed to create page: ${error.message}`);
        }
    }

    /**
     * Delete a site
     */
    async deleteSite(sitePath) {
        try {
            await this.axiosInstance.delete(sitePath);
            return {
                success: true,
                message: `Site deleted: ${sitePath}`
            };
        } catch (error) {
            throw new Error(`Failed to delete site: ${error.message}`);
        }
    }

    /**
     * Get site information
     */
    async getSiteInfo(sitePath) {
        try {
            const response = await this.axiosInstance.get(`${sitePath}.json`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get site info: ${error.message}`);
        }
    }

    /**
     * List sites under a path
     */
    async listSites(parentPath = '/content') {
        try {
            const response = await this.axiosInstance.get(`${parentPath}.1.json`);
            const sites = [];
            
            if (response.data) {
                for (const [key, value] of Object.entries(response.data)) {
                    if (key !== 'jcr:primaryType' && value['jcr:primaryType'] === 'cq:Page') {
                        sites.push({
                            name: key,
                            path: `${parentPath}/${key}`,
                            title: value['jcr:content']?.['jcr:title'] || key
                        });
                    }
                }
            }
            
            return sites;
        } catch (error) {
            throw new Error(`Failed to list sites: ${error.message}`);
        }
    }

    /**
     * Create an AEM component with dialog and HTL template
     */
    async createComponent(componentConfig) {
        try {
            const {
                componentName,
                componentTitle,
                componentPath,
                componentGroup = 'Custom Components',
                properties = []
            } = componentConfig;

            if (!componentName || !componentTitle || !componentPath) {
                throw new Error('componentName, componentTitle, and componentPath are required');
            }

            // Sanitize component name
            const sanitizedName = componentName.toLowerCase().replace(/\s+/g, '-');
            const fullPath = `${componentPath}/${sanitizedName}`;

            // Create component node structure
            const formData = new URLSearchParams();
            formData.append('jcr:primaryType', 'cq:Component');
            formData.append('jcr:title', componentTitle);
            formData.append('componentGroup', componentGroup);
            formData.append('jcr:description', `${componentTitle} component`);
            
            // Create the component node
            await this.axiosInstance.post(
                fullPath,
                formData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            // Create dialog if properties are specified
            if (properties && properties.length > 0) {
                await this.createComponentDialog(fullPath, properties);
            }

            // Create a basic HTL template
            const htlTemplate = this.generateHTLTemplate(componentName, properties);
            await this.createFile(`${fullPath}/${sanitizedName}.html`, htlTemplate);

            return {
                success: true,
                componentName: sanitizedName,
                componentTitle,
                fullPath,
                message: 'Component created successfully with dialog and HTL template'
            };
        } catch (error) {
            throw new Error(`Failed to create component: ${error.message}`);
        }
    }

    /**
     * Create component dialog configuration
     */
    async createComponentDialog(componentPath, properties) {
        try {
            const dialogPath = `${componentPath}/cq:dialog`;
            
            // Create dialog node
            const dialogData = new URLSearchParams();
            dialogData.append('jcr:primaryType', 'nt:unstructured');
            dialogData.append('sling:resourceType', 'cq/gui/components/authoring/dialog');
            
            await this.axiosInstance.post(
                dialogPath,
                dialogData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            // Create content/items structure for dialog fields
            const itemsPath = `${dialogPath}/content/items`;
            const itemsData = new URLSearchParams();
            itemsData.append('jcr:primaryType', 'nt:unstructured');
            
            await this.axiosInstance.post(
                itemsPath,
                itemsData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            // Create fields for each property
            for (let i = 0; i < properties.length; i++) {
                const prop = properties[i];
                await this.createDialogField(itemsPath, prop, i);
            }

            return { success: true };
        } catch (error) {
            throw new Error(`Failed to create dialog: ${error.message}`);
        }
    }

    /**
     * Create a dialog field for component property
     */
    async createDialogField(itemsPath, property, index) {
        try {
            const fieldPath = `${itemsPath}/field${index}`;
            const fieldData = new URLSearchParams();
            
            fieldData.append('jcr:primaryType', 'nt:unstructured');
            fieldData.append('sling:resourceType', `granite/ui/components/coral/foundation/form/${property.type}`);
            fieldData.append('fieldLabel', property.label);
            fieldData.append('name', `./${property.name}`);
            
            if (property.required) {
                fieldData.append('required', 'true');
            }

            await this.axiosInstance.post(
                fieldPath,
                fieldData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
        } catch (error) {
            throw new Error(`Failed to create dialog field: ${error.message}`);
        }
    }

    /**
     * Generate HTL template for component
     */
    generateHTLTemplate(componentName, properties) {
        let template = `<div class="${componentName}" data-sly-use.model="${componentName}.js">\n`;
        template += `    <h2>\${properties.jcr:title}</h2>\n`;
        
        if (properties && properties.length > 0) {
            template += `    <!-- Component Properties -->\n`;
            properties.forEach(prop => {
                template += `    <div class="${prop.name}">\${properties.${prop.name}}</div>\n`;
            });
        }
        
        template += `</div>`;
        return template;
    }

    /**
     * Create a file in JCR
     */
    async createFile(filePath, content) {
        try {
            const formData = new URLSearchParams();
            formData.append('jcr:primaryType', 'nt:file');
            formData.append('jcr:content/jcr:primaryType', 'nt:resource');
            formData.append('jcr:content/jcr:data', content);
            formData.append('jcr:content/jcr:mimeType', 'text/html');

            await this.axiosInstance.post(
                filePath,
                formData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
        } catch (error) {
            throw new Error(`Failed to create file: ${error.message}`);
        }
    }

    /**
     * Create a Content Fragment
     */
    async createContentFragment(fragmentConfig) {
        try {
            const {
                fragmentTitle,
                fragmentPath,
                modelPath,
                fields = {}
            } = fragmentConfig;

            if (!fragmentTitle || !fragmentPath || !modelPath) {
                throw new Error('fragmentTitle, fragmentPath, and modelPath are required');
            }

            // Sanitize fragment name from title
            const fragmentName = fragmentTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const fullPath = `${fragmentPath}/${fragmentName}`;

            // Create content fragment using Sling POST
            const formData = new URLSearchParams();
            formData.append('jcr:primaryType', 'dam:Asset');
            formData.append('jcr:content/contentFragment', 'true');
            formData.append('jcr:content/jcr:title', fragmentTitle);
            formData.append('jcr:content/cq:model', modelPath);
            formData.append('jcr:content/data/cq:model', modelPath);

            // Add fragment fields
            Object.entries(fields).forEach(([key, value]) => {
                formData.append(`jcr:content/data/master/${key}`, String(value));
            });

            await this.axiosInstance.post(
                fullPath,
                formData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            return {
                success: true,
                fragmentTitle,
                fullPath,
                message: 'Content Fragment created successfully'
            };
        } catch (error) {
            throw new Error(`Failed to create content fragment: ${error.message}`);
        }
    }

    /**
     * Start an AEM workflow
     */
    async startWorkflow(workflowConfig) {
        try {
            const {
                workflowModel,
                payloadPath,
                workflowTitle,
                workflowData = {}
            } = workflowConfig;

            if (!workflowModel || !payloadPath) {
                throw new Error('workflowModel and payloadPath are required');
            }

            // Create workflow instance using AEM Workflow API
            const formData = new URLSearchParams();
            formData.append('model', workflowModel);
            formData.append('payloadType', 'JCR_PATH');
            formData.append('payload', payloadPath);
            
            if (workflowTitle) {
                formData.append('workflowTitle', workflowTitle);
            }

            // Add workflow data
            Object.entries(workflowData).forEach(([key, value]) => {
                formData.append(`workflowData[${key}]`, String(value));
            });

            const response = await this.axiosInstance.post(
                '/etc/workflow/instances',
                formData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            // Extract workflow ID from response
            const workflowId = response.headers?.location?.split('/').pop() || 'unknown';

            return {
                success: true,
                workflowId,
                status: 'RUNNING',
                message: 'Workflow started successfully'
            };
        } catch (error) {
            throw new Error(`Failed to start workflow: ${error.message}`);
        }
    }
}

/**
 * Create AEM Microsite Client instance
 */
function createAEMMicrositeClient(authorUrl, credentials) {
    return new AEMMicrositeClient(authorUrl, credentials);
}

module.exports = {
    AEMMicrositeClient,
    createAEMMicrositeClient
};
