const axios = require('axios');
const https = require('https');
const querystring = require('querystring');
const logger = require('../utils/logger');

class WHMService {
  constructor() {
    this.baseURL = `https://${process.env.WHM_SERVER}:${process.env.WHM_PORT}/json-api/`;
    this.username = process.env.WHM_USERNAME;
    this.apiToken = process.env.WHM_API_TOKEN;
    
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
    
    // Response interceptor for logging
    this.api.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        logger.error(`WHM API Error: ${error.message}`);
        if (error.response) {
          logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
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
   * Make a PUT request to the WHM API
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise<any>} - API response
   */
  async put(endpoint, data = {}) {
    try {
      const response = await this.api.put(endpoint, data);
      return response.data;
    } catch (error) {
      throw this._handleApiError(error);
    }
  }
  
  /**
   * Make a DELETE request to the WHM API
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @returns {Promise<any>} - API response
   */
  async delete(endpoint, params = {}) {
    try {
      const response = await this.api.delete(endpoint, { params });
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
  
  /**
   * Change account package
   * @param {string} username - cPanel username
   * @param {string} pkg - New package name
   * @returns {Promise<any>} - Change result
   */
  async changeAccountPackage(username, pkg) {
    return this.post('changepackage', { user: username, pkg });
  }
  
  // Server Management APIs
  
  /**
   * Get server status
   * @returns {Promise<any>} - Server status
   */
  async getServerStatus() {
    return this.get('systemstats');
  }
  
  /**
   * Get server load
   * @returns {Promise<any>} - Server load statistics
   */
  async getServerLoad() {
    return this.get('loadavg');
  }
  
  /**
   * Get service status
   * @returns {Promise<any>} - Service status information
   */
  async getServiceStatus() {
    return this.get('servicestatus');
  }
  
  /**
   * Restart a service
   * @param {string} service - Service name (e.g., 'httpd', 'mysql')
   * @returns {Promise<any>} - Restart result
   */
  async restartService(service) {
    return this.post('restartservice', { service });
  }
  
  /**
   * Check for available updates
   * @returns {Promise<any>} - Available updates
   */
  async checkForUpdates() {
    return this.get('checkupdate');
  }
  
  /**
   * Start a server update
   * @returns {Promise<any>} - Update status
   */
  async startUpdate() {
    return this.post('doupdate');
  }
  
  // SSL Management APIs
  
  /**
   * List SSL certificates
   * @returns {Promise<any>} - List of SSL certificates
   */
  async listSSLCertificates() {
    return this.get('listcrts');
  }
  
  /**
   * Install an SSL certificate
   * @param {object} sslData - SSL installation data
   * @returns {Promise<any>} - Installation result
   */
  async installSSLCertificate(sslData) {
    return this.post('installssl', sslData);
  }
  
  // Backup Management APIs
  
  /**
   * List backups
   * @returns {Promise<any>} - List of backups
   */
  async listBackups() {
    return this.get('listbackups');
  }
  
  /**
   * Start a backup
   * @param {object} backupConfig - Backup configuration
   * @returns {Promise<any>} - Backup result
   */
  async startBackup(backupConfig) {
    return this.post('runbackup', backupConfig);
  }
  
  /**
   * Restore from backup
   * @param {object} restoreConfig - Restore configuration
   * @returns {Promise<any>} - Restore result
   */
  async restoreBackup(restoreConfig) {
    return this.post('restorebackup', restoreConfig);
  }
  
  // Domain Management APIs
  
  /**
   * Add a domain
   * @param {string} username - cPanel username
   * @param {string} domain - Domain name
   * @returns {Promise<any>} - Add domain result
   */
  async addDomain(username, domain) {
    return this.post('adddomain', { user: username, domain });
  }
  
  /**
   * Delete a domain
   * @param {string} username - cPanel username
   * @param {string} domain - Domain name
   * @returns {Promise<any>} - Delete domain result
   */
  async deleteDomain(username, domain) {
    return this.post('deldomain', { user: username, domain });
  }
  
  /**
   * List domains for an account
   * @param {string} username - cPanel username
   * @returns {Promise<any>} - List of domains
   */
  async listDomains(username) {
    return this.get('domainuserdata', { user: username });
  }
  
  // Email Management APIs
  
  /**
   * List email accounts
   * @param {string} username - cPanel username
   * @param {string} domain - Domain name
   * @returns {Promise<any>} - List of email accounts
   */
  async listEmailAccounts(username, domain) {
    return this.get('listpopswithdisk', { user: username, domain });
  }
  
  /**
   * Create an email account
   * @param {object} emailData - Email account data
   * @returns {Promise<any>} - Creation result
   */
  async createEmailAccount(emailData) {
    return this.post('addpop', emailData);
  }
  
  /**
   * Delete an email account
   * @param {object} emailData - Email account data
   * @returns {Promise<any>} - Deletion result
   */
  async deleteEmailAccount(emailData) {
    return this.post('delpop', emailData);
  }
}

module.exports = new WHMService();