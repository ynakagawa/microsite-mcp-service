#!/usr/bin/env node

/**
 * Test script for AEM Asset Search with Value Replacement
 * 
 * This script demonstrates the search and replace functionality
 * for renaming values in asset search results.
 * 
 * Usage:
 *   node test-asset-search-replace.js --query "test" --searchValue "old" --replaceValue "new"
 */

const { createAEMAssetClient } = require('./actions/mcp-server/aem-asset-client');

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        query: null,
        filename: null,
        title: null,
        damPath: '/content/dam',
        limit: 10,
        offset: 0,
        searchValue: null,
        replaceValue: null
    };

    for (let i = 0; i < args.length; i += 2) {
        const key = args[i]?.replace('--', '');
        const value = args[i + 1];
        
        if (key && value) {
            if (key === 'limit' || key === 'offset') {
                config[key] = parseInt(value, 10);
            } else {
                config[key] = value;
            }
        }
    }

    return config;
}

async function runTest() {
    try {
        const config = parseArgs();
        
        // Get credentials from environment or use defaults
        const authorUrl = process.env.AEM_AUTHOR_URL || 'https://author-p18253-e46622.adobeaemcloud.com';
        const username = process.env.AEM_USERNAME;
        const password = process.env.AEM_PASSWORD;
        const token = process.env.AEM_TOKEN;

        if (!username && !password && !token) {
            console.error('❌ Error: AEM credentials required');
            console.error('Set AEM_USERNAME and AEM_PASSWORD, or AEM_TOKEN environment variables');
            process.exit(1);
        }

        const credentials = token ? { token } : { username, password };

        console.log('🔍 AEM Asset Search with Value Replacement Test\n');
        console.log('Configuration:');
        console.log(`  Author URL: ${authorUrl}`);
        console.log(`  DAM Path: ${config.damPath}`);
        if (config.query) console.log(`  Query: "${config.query}"`);
        if (config.filename) console.log(`  Filename: "${config.filename}"`);
        if (config.title) console.log(`  Title: "${config.title}"`);
        if (config.searchValue) console.log(`  Search Value: "${config.searchValue}"`);
        if (config.replaceValue) console.log(`  Replace Value: "${config.replaceValue}"`);
        console.log(`  Limit: ${config.limit}`);
        console.log('');

        const client = createAEMAssetClient(authorUrl, credentials);
        
        const searchConfig = {
            query: config.query,
            filename: config.filename,
            title: config.title,
            damPath: config.damPath,
            limit: config.limit,
            offset: config.offset,
            searchValue: config.searchValue,
            replaceValue: config.replaceValue
        };

        console.log('Searching...\n');
        const result = await client.searchAssets(searchConfig);

        console.log('✅ Search completed!\n');
        console.log(`📊 Results: ${result.count} of ${result.total} total\n`);

        if (result.results.length === 0) {
            console.log('No assets found matching your search criteria.');
        } else {
            console.log('Found Assets:\n');
            result.results.forEach((asset, index) => {
                console.log(`${index + 1}. ${asset.name}`);
                console.log(`   Title: ${asset.title}`);
                console.log(`   Path: ${asset.path}`);
                console.log(`   URL: ${asset.url}`);
                
                if (asset.metadata && Object.keys(asset.metadata).length > 0) {
                    console.log(`   Metadata:`);
                    // Show first 5 metadata fields
                    const metadataKeys = Object.keys(asset.metadata).slice(0, 5);
                    metadataKeys.forEach(key => {
                        const value = asset.metadata[key];
                        const displayValue = typeof value === 'string' && value.length > 50 
                            ? value.substring(0, 47) + '...' 
                            : value;
                        console.log(`      ${key}: ${displayValue}`);
                    });
                    if (Object.keys(asset.metadata).length > 5) {
                        console.log(`      ... and ${Object.keys(asset.metadata).length - 5} more fields`);
                    }
                }
                console.log('');
            });
        }

        if (config.searchValue) {
            console.log(`\n💡 Note: Values containing "${config.searchValue}" have been replaced with "${config.replaceValue || ''}" in the results above.`);
        }

        console.log(`\n✅ ${result.message}`);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

runTest();
