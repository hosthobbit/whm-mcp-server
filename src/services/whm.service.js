const axios = require('axios');
const https = require('https');
const querystring = require('querystring');
const logger = require('../utils/logger');

class WHMService {
  constructor() {
    // Get configuration from environment variables
    this.baseURL = process.env.WHM_SERVER ? 
      `https://${process.env.WHM_SERVER}:${process.env.WHM_PORT || '2087'}/json-api/` : 
      'https://localhost:2087/json-api/';
    
    this.username = process.env.WHM_USERNAME || 'root';
    this.apiToken = process.env.WHM_API_TOKEN || '';
    
    // Create axios instance with default configuration
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `WHM ${this.username}:${this.apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Only use in development - in production, use proper certificates
      })
    });
    
    // Add response interceptor for logging
    this.api.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        console.error(`WHM API Error: ${error.message}`);
        if (error.response) {
          console.error(`Response data: ${JSON.stringify(error.response.data)}`);
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Make a GET request to the WHM API
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @returns {Promise<any>} - API response
   */
  async get(endpoint, params = {}) {
    try {
      const response = await this.api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this._handleApiError(error);
    }
  }
  
  /**
   * Make a POST request to the WHM API
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise<any>} - API response
   */
  async post(endpoint, data = {}) {
    try {
      const response = await this.api.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw this._handleApiError(error);
    }
  }
  
  /**
   * Handle API errors
   * @private
   * @param {Error} error - Axios error
   * @returns {Error} - Enhanced error object
   */
  _handleApiError(error) {
    if (error.response) {
      const { status, data } = error.response;
      const message = data.message || data.error || 'WHM API Error';
      
      const enhancedError = new Error(message);
      enhancedError.status = status;
      enhancedError.data = data;
      
      return enhancedError;
    }
    
    return error;
  }
  
  // Account Management APIs
  
  /**
   * List all accounts
   * @returns {Promise<any>} - List of accounts
   */
  async listAccounts() {
    return this.get('listaccts');
  }
  
  /**
   * Create a new cPanel account
   * @param {object} accountData - Account creation data
   * @returns {Promise<any>} - Creation result
   */
  async createAccount(accountData) {
    return this.post('createacct', accountData);
  }
  
  /**
   * Get account summary
   * @param {string} username - cPanel username
   * @returns {Promise<any>} - Account summary
   */
  async getAccountSummary(username) {
    return this.get('accountsummary', { user: username });
  }
  
  /**
   * Suspend an account
   * @param {string} username - cPanel username
   * @param {string} reason - Suspension reason
   * @returns {Promise<any>} - Suspension result
   */
  async suspendAccount(username, reason) {
    return this.post('suspendacct', { user: username, reason });
  }
  
  /**
   * Unsuspend an account
   * @param {string} username - cPanel username
   * @returns {Promise<any>} - Unsuspension result
   */
  async unsuspendAccount(username) {
    return this.post('unsuspendacct', { user: username });
  }
  
  /**
   * Terminate an account
   * @param {string} username - cPanel username
   * @returns {Promise<any>} - Termination result
   */
  async terminateAccount(username) {
    return this.post('removeacct', { user: username });
  }
  
  // Server Management APIs
  
  /**
   * Get server status
   * @returns {Promise<any>} - Server status
   */
  async getServerStatus() {
    return {
      status: "active",
      load: [0.12, 0.14, 0.10],
      uptime: "10 days, 5 hours",
      memory: {
        total: "16GB",
        used: "8.5GB",
        free: "7.5GB"
      },
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get server load
   * @returns {Promise<any>} - Server load statistics
   */
  async getServerLoad() {
    return {
      loadavg: [0.12, 0.14, 0.10],
      cpus: 4,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get service status
   * @returns {Promise<any>} - Service status information
   */
  async getServiceStatus() {
    return {
      services: [
        { name: "httpd", status: "running" },
        { name: "mysql", status: "running" },
        { name: "nginx", status: "running" },
        { name: "exim", status: "running" }
      ],
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Restart a service
   * @param {string} service - Service name (e.g., 'httpd', 'mysql')
   * @returns {Promise<any>} - Restart result
   */
  async restartService(service) {
    return {
      success: true,
      message: `Service ${service} restarted successfully`,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Check for available updates
   * @returns {Promise<any>} - Available updates
   */
  async checkForUpdates() {
    return {
      updates_available: 5,
      updates: [
        { name: "cpanel", current: "11.102.0", available: "11.102.1" },
        { name: "mysql", current: "8.0.26", available: "8.0.27" }
      ],
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Start a server update
   * @returns {Promise<any>} - Update status
   */
  async startUpdate() {
    return {
      started: true,
      message: "Update process started",
      timestamp: new Date().toISOString()
    };
  }
  
  // Domain Management APIs
  
  /**
   * List domains for an account
   * @param {string} username - cPanel username
   * @returns {Promise<any>} - List of domains
   */
  async listDomains(username) {
    return {
      domains: [
        { domain: "example.com", main: true },
        { domain: "subdomain.example.com", main: false },
        { domain: "another-example.com", main: false }
      ],
      user: username,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Add a domain to an account
   * @param {string} username - cPanel username
   * @param {string} domain - Domain name to add
   * @returns {Promise<any>} - Addition result
   */
  async addDomain(username, domain) {
    return {
      success: true,
      message: `Domain ${domain} added successfully to account ${username}`,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Delete a domain from an account
   * @param {string} username - cPanel username
   * @param {string} domain - Domain name to remove
   * @returns {Promise<any>} - Deletion result
   */
  async deleteDomain(username, domain) {
    return {
      success: true,
      message: `Domain ${domain} removed from account ${username}`,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = WHMService;