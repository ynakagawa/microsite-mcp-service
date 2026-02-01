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

const { createAEMMicrositeClient, AEMMicrositeClient } = require('../actions/mcp-server/aem-microsite-client');

// Mock axios instance
const mockAxiosInstance = {
    defaults: {
        headers: {
            common: {}
        },
        auth: null
    },
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn()
};

// Mock axios
jest.mock('axios', () => {
    return {
        create: jest.fn(() => mockAxiosInstance)
    };
});

const axios = require('axios');

describe('AEM Utils', () => {
    let aemClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mockAxiosInstance.get.mockClear();
        mockAxiosInstance.post.mockClear();
        mockAxiosInstance.delete.mockClear();
        aemClient = createAEMMicrositeClient('https://author-test.adobeaemcloud.com', {
            username: 'admin',
            password: 'admin'
        });
    });

    describe('AEMClient Creation', () => {
        test('should create AEM microsite client with username/password', () => {
            const client = createAEMMicrositeClient('https://author-test.adobeaemcloud.com', {
                username: 'admin',
                password: 'admin'
            });
            expect(client).toBeInstanceOf(AEMMicrositeClient);
        });

        test('should create AEM microsite client with bearer token', () => {
            const client = createAEMMicrositeClient('https://author-test.adobeaemcloud.com', {
                token: 'abc123'
            });
            expect(client).toBeInstanceOf(AEMMicrositeClient);
        });

        test('should remove trailing slash from author URL', () => {
            const client = createAEMMicrositeClient('https://author-test.adobeaemcloud.com/', {
                username: 'admin',
                password: 'admin'
            });
            expect(client.authorUrl).toBe('https://author-test.adobeaemcloud.com');
        });
    });

    describe('getQuickSiteTemplates', () => {
        test('should return list of Quick Site templates', async () => {
            const templates = await aemClient.getQuickSiteTemplates();
            
            expect(Array.isArray(templates)).toBe(true);
            expect(templates.length).toBeGreaterThan(0);
            expect(templates[0]).toHaveProperty('id');
            expect(templates[0]).toHaveProperty('name');
            expect(templates[0]).toHaveProperty('description');
            expect(templates[0]).toHaveProperty('path');
        });
    });

    describe('createSite', () => {
        test('should create a site with valid configuration', async () => {
            mockAxiosInstance.post.mockResolvedValue({
                data: { success: true }
            });

            const result = await aemClient.createSite({
                siteName: 'test-site',
                siteTitle: 'Test Site'
            });

            expect(result.success).toBe(true);
            expect(result.siteName).toBe('test-site');
            expect(result.siteTitle).toBe('Test Site');
            expect(result.sitePath).toBe('/content/test-site');
            expect(result.authorUrl).toContain('/editor.html');
        });

        test('should sanitize site names', async () => {
            mockAxiosInstance.post.mockResolvedValue({
                data: { success: true }
            });

            const result = await aemClient.createSite({
                siteName: 'My Awesome Site!',
                siteTitle: 'My Awesome Site'
            });

            expect(result.siteName).toBe('my-awesome-site-');
            expect(result.sitePath).toBe('/content/my-awesome-site-');
        });

        test('should derive siteName from siteTitle when siteName is missing', async () => {
            const result = await aemClient.createSite({
                siteTitle: 'Test Site'
            });

            expect(result.siteName).toBe('test-site');
            expect(result.sitePath).toBe('/content/test-site');
            expect(result.siteTitle).toBe('Test Site');
        });

        test('should throw error when siteTitle is missing', async () => {
            await expect(
                aemClient.createSite({
                    siteName: 'test-site'
                })
            ).rejects.toThrow('siteTitle is required');
        });

        test('should handle API errors gracefully', async () => {
            const originalPost = mockAxiosInstance.post;
            mockAxiosInstance.post = jest.fn().mockRejectedValue(
                new Error('Network error')
            );

            await expect(
                aemClient.createSite({
                    siteName: 'test-site',
                    siteTitle: 'Test Site'
                })
            ).rejects.toThrow('Failed to create site');

            mockAxiosInstance.post = originalPost;
        });
    });

    describe('createMicrosite', () => {
        test('should create a microsite with default pages', async () => {
            mockAxiosInstance.post.mockResolvedValue({
                data: { success: true }
            });

            const result = await aemClient.createMicrosite({
                siteName: 'microsite',
                siteTitle: 'Microsite Title'
            });

            expect(result.success).toBe(true);
            expect(result.siteName).toBe('microsite');
            expect(result.message).toContain('Microsite created');
        });

        test('should create microsite with custom pages', async () => {
            mockAxiosInstance.post.mockResolvedValue({
                data: { success: true }
            });

            const result = await aemClient.createMicrosite({
                siteName: 'microsite',
                siteTitle: 'Microsite Title',
                pages: ['home', 'products', 'contact']
            });

            expect(result.success).toBe(true);
        });
    });

    describe('createPage', () => {
        test('should create a page under a site', async () => {
            mockAxiosInstance.post.mockResolvedValue({
                data: { success: true }
            });

            const result = await aemClient.createPage({
                sitePath: '/content/test-site',
                pageName: 'about',
                pageTitle: 'About Us'
            });

            expect(result.pagePath).toBe('/content/test-site/about');
            expect(result.pageName).toBe('about');
            expect(result.pageTitle).toBe('About Us');
            expect(result.url).toContain('/editor.html');
        });
    });

    describe('listSites', () => {
        test('should list sites under parent path', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: {
                    'site1': {
                        'jcr:primaryType': 'cq:Page',
                        'jcr:content': {
                            'jcr:title': 'Site 1'
                        }
                    },
                    'site2': {
                        'jcr:primaryType': 'cq:Page',
                        'jcr:content': {
                            'jcr:title': 'Site 2'
                        }
                    }
                }
            });

            const sites = await aemClient.listSites('/content');

            expect(Array.isArray(sites)).toBe(true);
            expect(sites.length).toBe(2);
            expect(sites[0]).toHaveProperty('name');
            expect(sites[0]).toHaveProperty('path');
            expect(sites[0]).toHaveProperty('title');
        });

        test('should return empty array when no sites found', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: {}
            });

            const sites = await aemClient.listSites('/content');

            expect(Array.isArray(sites)).toBe(true);
            expect(sites.length).toBe(0);
        });
    });

    describe('getSiteInfo', () => {
        test('should get site information', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: {
                    'jcr:primaryType': 'cq:Page',
                    'jcr:content': {
                        'jcr:title': 'Test Site',
                        'cq:template': '/conf/templates/test'
                    }
                }
            });

            const info = await aemClient.getSiteInfo('/content/test-site');

            expect(info).toHaveProperty('jcr:primaryType');
            expect(info).toHaveProperty('jcr:content');
        });

        test('should handle errors when getting site info', async () => {
            mockAxiosInstance.get.mockRejectedValue(
                new Error('Site not found')
            );

            await expect(
                aemClient.getSiteInfo('/content/nonexistent')
            ).rejects.toThrow('Failed to get site info');
        });
    });

    describe('deleteSite', () => {
        test('should delete a site successfully', async () => {
            mockAxiosInstance.delete.mockResolvedValue({
                data: { success: true }
            });

            const result = await aemClient.deleteSite('/content/test-site');

            expect(result.success).toBe(true);
            expect(result.message).toContain('deleted');
        });

        test('should handle errors when deleting site', async () => {
            const originalDelete = mockAxiosInstance.delete;
            mockAxiosInstance.delete = jest.fn().mockRejectedValue(
                new Error('Permission denied')
            );

            await expect(
                aemClient.deleteSite('/content/test-site')
            ).rejects.toThrow('Failed to delete site');

            mockAxiosInstance.delete = originalDelete;
        });
    });
});

