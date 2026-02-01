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
 * AEM Client Base - Base class for AEM API interactions
 * 
 * This module provides the base AEMClient class with authentication setup.
 * Extended by specialized clients for microsite and asset operations.
 */

const axios = require('axios');

/**
 * Base AEM API Client
 * Provides authentication and basic HTTP client setup
 */
class AEMClientBase {
    constructor(authorUrl, credentials) {
        this.authorUrl = authorUrl.replace(/\/$/, ''); // Remove trailing slash
        this.credentials = credentials;
        this.axiosInstance = axios.create({
            baseURL: this.authorUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Setup authentication
        if (credentials) {
            if (credentials.token) {
                // Bearer token authentication
                this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${credentials.token}`;
            } else if (credentials.username && credentials.password) {
                // Basic authentication
                this.axiosInstance.defaults.auth = {
                    username: credentials.username,
                    password: credentials.password
                };
            }
        }
    }
}

module.exports = {
    AEMClientBase
};
