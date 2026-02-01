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
 * AEM Asset Client - Client for AEM DAM asset operations
 * 
 * This module provides utilities for:
 * - Asset search using QueryBuilder API
 * - Asset metadata retrieval
 * - Value search and replace in search results
 */

const { AEMClientBase } = require('./aem-client-base');

/**
 * AEM Asset Client - Extends base client with asset-specific operations
 */
class AEMAssetClient extends AEMClientBase {
    /**
     * Search assets in AEM DAM using QueryBuilder API
     * @param {Object} searchConfig - Search configuration
     * @param {string} searchConfig.query - General search query (searches filename and dc:title)
     * @param {string} searchConfig.filename - Specific filename to search for
     * @param {string} searchConfig.title - Specific dc:title metadata value to search for
     * @param {string} searchConfig.damPath - DAM path to search within (default: /content/dam)
     * @param {number} searchConfig.limit - Maximum number of results (default: 50)
     * @param {number} searchConfig.offset - Result offset for pagination (default: 0)
     * @param {string} searchConfig.searchValue - Value to search for in results (for replacement)
     * @param {string} searchConfig.replaceValue - Value to replace with (if searchValue provided)
     * @returns {Promise<Object>} Search results with assets and metadata
     */
    async searchAssets(searchConfig = {}) {
        try {
            const {
                query,
                filename,
                title,
                damPath = '/content/dam',
                limit = 50,
                offset = 0,
                searchValue,
                replaceValue
            } = searchConfig;

            // Build QueryBuilder predicates
            const params = new URLSearchParams();
            
            // Asset type predicate
            params.append('type', 'dam:Asset');
            
            // Path predicate
            params.append('path', damPath);
            
            // Build query predicates
            if (query) {
                // General query: search filename and multiple metadata properties
                // Use OR group for multiple predicates
                params.append('1_group.or', 'true');
                // Filename search
                params.append('1_group.1_nodename', `*${this.escapeGlobValue(query)}*`);
                // dc:title search
                params.append('1_group.2_property', 'jcr:content/metadata/dc:title');
                params.append('1_group.2_property.operation', 'like');
                params.append('1_group.2_property.value', `%${this.escapeLikeValue(query)}%`);
                // dc:description search
                params.append('1_group.3_property', 'jcr:content/metadata/dc:description');
                params.append('1_group.3_property.operation', 'like');
                params.append('1_group.3_property.value', `%${this.escapeLikeValue(query)}%`);
                // dc:subject search
                params.append('1_group.4_property', 'jcr:content/metadata/dc:subject');
                params.append('1_group.4_property.operation', 'like');
                params.append('1_group.4_property.value', `%${this.escapeLikeValue(query)}%`);
                // product:brand search
                params.append('1_group.5_property', 'jcr:content/metadata/product:brand');
                params.append('1_group.5_property.operation', 'like');
                params.append('1_group.5_property.value', `%${this.escapeLikeValue(query)}%`);
                // product:sku search
                params.append('1_group.6_property', 'jcr:content/metadata/product:sku');
                params.append('1_group.6_property.operation', 'like');
                params.append('1_group.6_property.value', `%${this.escapeLikeValue(query)}%`);
            }
            
            if (filename) {
                params.append('2_nodename', `*${this.escapeGlobValue(filename)}*`);
            }
            
            if (title) {
                params.append('3_property', 'jcr:content/metadata/dc:title');
                params.append('3_property.operation', 'like');
                params.append('3_property.value', `%${this.escapeLikeValue(title)}%`);
            }
            
            // Pagination
            params.append('p.limit', limit.toString());
            params.append('p.offset', offset.toString());
            
            // Order by
            params.append('orderby', '@jcr:content/jcr:lastModified');
            params.append('orderby.sort', 'desc');
            
            // Execute QueryBuilder query
            const queryBuilderUrl = `/bin/querybuilder.json?${params.toString()}`;
            
            let response;
            try {
                response = await this.axiosInstance.get(queryBuilderUrl);
            } catch (error) {
                // Enhanced error handling for authentication issues
                if (error.response && error.response.status === 401) {
                    const authMethod = this.credentials.token ? 'Bearer token' : 'username/password';
                    const errorDetails = {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        authMethod: authMethod,
                        url: `${this.authorUrl}${queryBuilderUrl}`,
                        message: error.message
                    };
                    
                    let errorMessage = `Failed to search assets: Request failed with status code 401\n\n`;
                    errorMessage += `Authentication Method: ${authMethod}\n`;
                    errorMessage += `Request URL: ${errorDetails.url}\n\n`;
                    
                    if (this.credentials.token) {
                        errorMessage += `Possible causes:\n`;
                        errorMessage += `- Bearer token has expired (tokens typically expire after 24 hours)\n`;
                        errorMessage += `- Token does not have required permissions/scopes\n`;
                        errorMessage += `- AEM Cloud Service may require username/password authentication for QueryBuilder API\n`;
                        errorMessage += `- Invalid or malformed token\n\n`;
                        errorMessage += `💡 Try using username/password authentication instead:\n`;
                        errorMessage += `   Set AEM_USERNAME and AEM_PASSWORD environment variables, or pass them as tool parameters.\n`;
                    } else {
                        errorMessage += `Possible causes:\n`;
                        errorMessage += `- Invalid username or password\n`;
                        errorMessage += `- Account does not have required permissions\n`;
                        errorMessage += `- AEM instance is not accessible\n`;
                    }
                    
                    errorMessage += `\nNetwork connectivity issues\n`;
                    
                    throw new Error(errorMessage);
                }
                throw error;
            }
            
            // Parse results
            const results = [];
            if (response.data && response.data.hits) {
                for (const hit of response.data.hits) {
                    const assetPath = hit.path;
                    const assetName = assetPath.split('/').pop();
                    
                    // Get asset metadata
                    let assetTitle = '';
                    let assetMetadata = {};
                    
                    try {
                        const metadataResponse = await this.axiosInstance.get(
                            `${assetPath}/jcr:content/metadata.json`
                        );
                        assetMetadata = metadataResponse.data || {};
                        assetTitle = assetMetadata['dc:title'] || assetName;
                    } catch (metadataError) {
                        // If metadata fetch fails (e.g., 401 or 404), use asset name as title
                        // Don't throw error here as we still want to return the asset in results
                        if (metadataError.response && metadataError.response.status === 401) {
                            // Log warning but continue - metadata might require different permissions
                            console.warn(`Warning: Could not fetch metadata for ${assetPath} due to authentication error`);
                        }
                        assetTitle = assetName;
                    }

                    // Apply search and replace on values if provided
                    if (searchValue !== undefined && searchValue !== null && searchValue !== '') {
                        assetMetadata = this.replaceValuesInMetadata(assetMetadata, searchValue, replaceValue || '');
                        // Also update title if it was replaced
                        if (assetMetadata['dc:title']) {
                            assetTitle = assetMetadata['dc:title'];
                        }
                    }

                    results.push({
                        path: assetPath,
                        name: assetName,
                        title: assetTitle,
                        metadata: assetMetadata,
                        url: `${this.authorUrl}${assetPath}`
                    });
                }
            }

            return {
                success: true,
                query: query || { filename, title },
                damPath,
                total: response.data?.total || 0,
                results: results,
                count: results.length,
                limit,
                offset,
                message: `Found ${results.length} asset(s)`
            };
        } catch (error) {
            throw new Error(`Failed to search assets: ${error.message}`);
        }
    }

    /**
     * Replace values in metadata object recursively
     * Searches for searchValue in all string values and replaces with replaceValue
     * @param {Object} metadata - Metadata object to process
     * @param {string} searchValue - Value to search for
     * @param {string} replaceValue - Value to replace with
     * @returns {Object} Metadata object with replaced values
     */
    replaceValuesInMetadata(metadata, searchValue, replaceValue) {
        if (!metadata || typeof metadata !== 'object') {
            return metadata;
        }

        const replaced = {};
        
        for (const [key, value] of Object.entries(metadata)) {
            if (typeof value === 'string') {
                // Replace searchValue with replaceValue in string values
                replaced[key] = value.replace(new RegExp(this.escapeRegex(searchValue), 'gi'), replaceValue);
            } else if (Array.isArray(value)) {
                // Process array elements
                replaced[key] = value.map(item => {
                    if (typeof item === 'string') {
                        return item.replace(new RegExp(this.escapeRegex(searchValue), 'gi'), replaceValue);
                    }
                    return item;
                });
            } else if (value !== null && typeof value === 'object') {
                // Recursively process nested objects
                replaced[key] = this.replaceValuesInMetadata(value, searchValue, replaceValue);
            } else {
                // Keep other types as-is
                replaced[key] = value;
            }
        }
        
        return replaced;
    }

    /**
     * Escape special characters for glob patterns in QueryBuilder
     * @param {string} value - Value to escape
     * @returns {string} Escaped value
     */
    escapeGlobValue(value) {
        if (!value) return '';
        // Escape glob special characters: \, *, ?, [, ], {, }
        return value.replace(/[\\*?\[\]{}]/g, '\\$&');
    }

    /**
     * Escape special characters for SQL LIKE patterns in QueryBuilder
     * @param {string} value - Value to escape
     * @returns {string} Escaped value
     */
    escapeLikeValue(value) {
        if (!value) return '';
        // Escape SQL LIKE special characters: \, %, _
        return value.replace(/[\\%_]/g, '\\$&');
    }

    /**
     * Escape special characters for regular expressions
     * @param {string} value - Value to escape
     * @returns {string} Escaped value
     */
    escapeRegex(value) {
        if (!value) return '';
        // Escape regex special characters
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Rename an asset in AEM DAM
     * @param {string} assetPath - Current path of the asset (e.g., /content/dam/Ford/old-name.png)
     * @param {string} newName - New name for the asset (e.g., new-name.png)
     * @returns {Promise<Object>} Result with new path and success status
     */
    async renameAsset(assetPath, newName) {
        try {
            if (!assetPath || !newName) {
                throw new Error('Asset path and new name are required');
            }

            // Validate asset path format
            if (!assetPath.startsWith('/content/dam/')) {
                throw new Error('Asset path must start with /content/dam/');
            }

            // Sanitize new name (remove path separators if present)
            const sanitizedName = newName.split('/').pop();
            
            // Get parent path and construct new path
            const pathParts = assetPath.split('/');
            const parentPath = pathParts.slice(0, -1).join('/');
            const newPath = `${parentPath}/${sanitizedName}`;

            // Check if asset exists
            try {
                await this.axiosInstance.head(assetPath);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    throw new Error(`Asset not found at path: ${assetPath}`);
                }
                throw error;
            }

            // Check if target already exists
            try {
                await this.axiosInstance.head(newPath);
                throw new Error(`Asset already exists at target path: ${newPath}`);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    // Good, target doesn't exist
                } else if (error.message && error.message.includes('already exists')) {
                    throw error;
                } else {
                    // Some other error, continue
                }
            }

            // Use AEM's move operation to rename
            // AEM supports moving nodes via POST to the source with :operation=move and :dest parameter
            const moveParams = new URLSearchParams();
            moveParams.append(':operation', 'move');
            moveParams.append(':dest', newPath);

            const moveUrl = `${assetPath}?${moveParams.toString()}`;
            
            const response = await this.axiosInstance.post(moveUrl, {}, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                oldPath: assetPath,
                newPath: newPath,
                newName: sanitizedName,
                message: `Asset renamed from "${assetPath.split('/').pop()}" to "${sanitizedName}"`
            };
        } catch (error) {
            throw new Error(`Failed to rename asset: ${error.message}`);
        }
    }

    /**
     * Update asset metadata in AEM DAM
     * @param {string} assetPath - Path of the asset (e.g., /content/dam/Ford/asset.png)
     * @param {Object} metadata - Metadata properties to update (e.g., {'dc:description': 'Ford'})
     * @param {boolean} merge - If true, merge with existing metadata; if false, replace (default: true)
     * @returns {Promise<Object>} Result with success status
     */
    async updateAssetMetadata(assetPath, metadata, merge = true) {
        try {
            if (!assetPath || !metadata || Object.keys(metadata).length === 0) {
                throw new Error('Asset path and metadata are required');
            }

            // Validate asset path format
            if (!assetPath.startsWith('/content/dam/')) {
                throw new Error('Asset path must start with /content/dam/');
            }

            // Check if asset exists
            try {
                await this.axiosInstance.head(assetPath);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    throw new Error(`Asset not found at path: ${assetPath}`);
                }
                throw error;
            }

            // If merging, get existing metadata first
            let existingMetadata = {};
            if (merge) {
                try {
                    const metadataResponse = await this.axiosInstance.get(
                        `${assetPath}/jcr:content/metadata.json`
                    );
                    existingMetadata = metadataResponse.data || {};
                } catch (error) {
                    // If metadata doesn't exist yet, start with empty object
                    if (error.response && error.response.status !== 404) {
                        throw error;
                    }
                }
            }

            // Merge or replace metadata
            const updatedMetadata = merge 
                ? { ...existingMetadata, ...metadata }
                : metadata;

            // Update metadata using POST to the metadata node
            // AEM uses Sling POST servlet - we need to post properties individually
            const metadataPath = `${assetPath}/jcr:content/metadata`;
            
            // Build form data with properties
            const formData = new URLSearchParams();
            
            // Add each metadata property
            Object.keys(updatedMetadata).forEach(key => {
                const value = updatedMetadata[key];
                if (value !== null && value !== undefined) {
                    // Handle array values
                    if (Array.isArray(value)) {
                        value.forEach((item, index) => {
                            formData.append(`${key}`, item);
                        });
                    } else {
                        formData.append(key, value.toString());
                    }
                }
            });

            // Use POST with proper content type
            const response = await this.axiosInstance.post(metadataPath, formData.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                maxRedirects: 0,
                validateStatus: (status) => status < 400 || status === 412
            });

            return {
                success: true,
                assetPath: assetPath,
                metadata: updatedMetadata,
                message: `Metadata updated for asset: ${assetPath.split('/').pop()}`
            };
        } catch (error) {
            throw new Error(`Failed to update asset metadata: ${error.message}`);
        }
    }

    // Future asset methods can be added here:
    // - listAssets()
    // - getAssetInfo()
    // - deleteAsset()
    // - getAssetRenditions()
    // - etc.
}

/**
 * Create AEM Asset Client instance
 */
function createAEMAssetClient(authorUrl, credentials) {
    return new AEMAssetClient(authorUrl, credentials);
}

module.exports = {
    AEMAssetClient,
    createAEMAssetClient
};
