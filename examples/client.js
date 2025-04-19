const axios = require('axios');
const readline = require('readline');

// Create readline interface for interactive example
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// API configuration
const API_CONFIG = {
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': 'your-secret-api-key-here' // Replace with your actual API key
  }
};

// Create axios instance
const api = axios.create(API_CONFIG);

/**
 * Display the main menu
 */
function showMenu() {
  console.log('\n---------------------------------------');
  console.log('WHM Management Control Panel Client');
  console.log('---------------------------------------');
  console.log('1. Account Management');
  console.log('2. Server Management');
  console.log('3. Domain Management');
  console.log('4. Exit');
  console.log('---------------------------------------');
  
  rl.question('Enter your choice: ', (choice) => {
    switch(choice) {
      case '1':
        showAccountMenu();
        break;
      case '2':
        showServerMenu();
        break;
      case '3':
        showDomainMenu();
        break;
      case '4':
        console.log('Exiting...');
        rl.close();
        break;
      default:
        console.log('Invalid choice. Please try again.');
        showMenu();
    }
  });
}

/**
 * Display the account management menu
 */
function showAccountMenu() {
  console.log('\n---------------------------------------');
  console.log('Account Management');
  console.log('---------------------------------------');
  console.log('1. List All Accounts');
  console.log('2. Get Account Details');
  console.log('3. Create New Account');
  console.log('4. Suspend Account');
  console.log('5. Unsuspend Account');
  console.log('6. Terminate Account');
  console.log('7. Back to Main Menu');
  console.log('---------------------------------------');
  
  rl.question('Enter your choice: ', (choice) => {
    switch(choice) {
      case '1':
        listAllAccounts();
        break;
      case '2':
        getAccountDetails();
        break;
      case '3':
        createNewAccount();
        break;
      case '4':
        suspendAccount();
        break;
      case '5':
        unsuspendAccount();
        break;
      case '6':
        terminateAccount();
        break;
      case '7':
        showMenu();
        break;
      default:
        console.log('Invalid choice. Please try again.');
        showAccountMenu();
    }
  });
}

/**
 * Display the server management menu
 */
function showServerMenu() {
  console.log('\n---------------------------------------');
  console.log('Server Management');
  console.log('---------------------------------------');
  console.log('1. Get Server Status');
  console.log('2. Get Server Load');
  console.log('3. Get Service Status');
  console.log('4. Restart a Service');
  console.log('5. Check for Updates');
  console.log('6. Start Server Update');
  console.log('7. Back to Main Menu');
  console.log('---------------------------------------');
  
  rl.question('Enter your choice: ', (choice) => {
    switch(choice) {
      case '1':
        getServerStatus();
        break;
      case '2':
        getServerLoad();
        break;
      case '3':
        getServiceStatus();
        break;
      case '4':
        restartService();
        break;
      case '5':
        checkForUpdates();
        break;
      case '6':
        startUpdate();
        break;
      case '7':
        showMenu();
        break;
      default:
        console.log('Invalid choice. Please try again.');
        showServerMenu();
    }
  });
}

/**
 * Display the domain management menu
 */
function showDomainMenu() {
  console.log('\n---------------------------------------');
  console.log('Domain Management');
  console.log('---------------------------------------');
  console.log('1. List Domains for Account');
  console.log('2. Add Domain to Account');
  console.log('3. Delete Domain from Account');
  console.log('4. Back to Main Menu');
  console.log('---------------------------------------');
  
  rl.question('Enter your choice: ', (choice) => {
    switch(choice) {
      case '1':
        listDomains();
        break;
      case '2':
        addDomain();
        break;
      case '3':
        deleteDomain();
        break;
      case '4':
        showMenu();
        break;
      default:
        console.log('Invalid choice. Please try again.');
        showDomainMenu();
    }
  });
}

// Account Management Functions

/**
 * List all accounts
 */
async function listAllAccounts() {
  try {
    const response = await api.get('/api/accounts');
    console.log('\nAccounts:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    handleApiError(error);
  }
  
  promptContinue(showAccountMenu);
}

/**
 * Get account details
 */
async function getAccountDetails() {
  rl.question('\nEnter username: ', async (username) => {
    try {
      const response = await api.get(`/api/accounts/${username}`);
      console.log('\nAccount Details:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      handleApiError(error);
    }
    
    promptContinue(showAccountMenu);
  });
}

/**
 * Create a new account
 */
async function createNewAccount() {
  console.log('\nCreate New Account:');
  
  rl.question('Enter username: ', (username) => {
    rl.question('Enter domain: ', (domain) => {
      rl.question('Enter password: ', (password) => {
        rl.question('Enter package name: ', async (pkgname) => {
          try {
            const response = await api.post('/api/accounts', {
              username,
              domain,
              password,
              pkgname
            });
            
            console.log('\nAccount Created:');
            console.log(JSON.stringify(response.data, null, 2));
          } catch (error) {
            handleApiError(error);
          }
          
          promptContinue(showAccountMenu);
        });
      });
    });
  });
}

/**
 * Suspend an account
 */
async function suspendAccount() {
  rl.question('\nEnter username to suspend: ', (username) => {
    rl.question('Enter reason for suspension: ', async (reason) => {
      try {
        const response = await api.post(`/api/accounts/${username}/suspend`, { reason });
        console.log('\nAccount Suspended:');
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        handleApiError(error);
      }
      
      promptContinue(showAccountMenu);
    });
  });
}

/**
 * Unsuspend an account
 */
async function unsuspendAccount() {
  rl.question('\nEnter username to unsuspend: ', async (username) => {
    try {
      const response = await api.post(`/api/accounts/${username}/unsuspend`);
      console.log('\nAccount Unsuspended:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      handleApiError(error);
    }
    
    promptContinue(showAccountMenu);
  });
}

/**
 * Terminate an account
 */
async function terminateAccount() {
  rl.question('\nEnter username to terminate: ', async (username) => {
    rl.question('Are you sure you want to terminate this account? (y/n): ', async (confirm) => {
      if (confirm.toLowerCase() === 'y') {
        try {
          const response = await api.delete(`/api/accounts/${username}`);
          console.log('\nAccount Terminated:');
          console.log(JSON.stringify(response.data, null, 2));
        } catch (error) {
          handleApiError(error);
        }
      } else {
        console.log('\nTermination cancelled.');
      }
      
      promptContinue(showAccountMenu);
    });
  });
}

// Server Management Functions

/**
 * Get server status
 */
async function getServerStatus() {
  try {
    const response = await api.get('/api/server/status');
    console.log('\nServer Status:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    handleApiError(error);
  }
  
  promptContinue(showServerMenu);
}

/**
 * Get server load
 */
async function getServerLoad() {
  try {
    const response = await api.get('/api/server/load');
    console.log('\nServer Load:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    handleApiError(error);
  }
  
  promptContinue(showServerMenu);
}

/**
 * Get service status
 */
async function getServiceStatus() {
  try {
    const response = await api.get('/api/server/services');
    console.log('\nService Status:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    handleApiError(error);
  }
  
  promptContinue(showServerMenu);
}

/**
 * Restart a service
 */
async function restartService() {
  rl.question('\nEnter service name to restart (e.g., httpd, mysql): ', async (service) => {
    try {
      const response = await api.post(`/api/server/services/${service}/restart`);
      console.log(`\n${service} Service Restarted:`);
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      handleApiError(error);
    }
    
    promptContinue(showServerMenu);
  });
}

/**
 * Check for updates
 */
async function checkForUpdates() {
  try {
    const response = await api.get('/api/server/updates');
    console.log('\nAvailable Updates:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    handleApiError(error);
  }
  
  promptContinue(showServerMenu);
}

/**
 * Start server update
 */
async function startUpdate() {
  rl.question('Are you sure you want to start the server update? (y/n): ', async (confirm) => {
    if (confirm.toLowerCase() === 'y') {
      try {
        const response = await api.post('/api/server/updates');
        console.log('\nServer Update Started:');
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        handleApiError(error);
      }
    } else {
      console.log('\nUpdate cancelled.');
    }
    
    promptContinue(showServerMenu);
  });
}

// Domain Management Functions

/**
 * List domains for an account
 */
async function listDomains() {
  rl.question('\nEnter username: ', async (username) => {
    try {
      const response = await api.get(`/api/domains/${username}`);
      console.log('\nDomains:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      handleApiError(error);
    }
    
    promptContinue(showDomainMenu);
  });
}

/**
 * Add a domain to an account
 */
async function addDomain() {
  rl.question('\nEnter username: ', (username) => {
    rl.question('Enter domain: ', async (domain) => {
      try {
        const response = await api.post(`/api/domains/${username}`, { domain });
        console.log('\nDomain Added:');
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        handleApiError(error);
      }
      
      promptContinue(showDomainMenu);
    });
  });
}

/**
 * Delete a domain from an account
 */
async function deleteDomain() {
  rl.question('\nEnter username: ', (username) => {
    rl.question('Enter domain to delete: ', async (domain) => {
      try {
        const response = await api.delete(`/api/domains/${username}/${domain}`);
        console.log('\nDomain Deleted:');
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        handleApiError(error);
      }
      
      promptContinue(showDomainMenu);
    });
  });
}

// Helper Functions

/**
 * Handle API errors
 * @param {Error} error - Axios error
 */
function handleApiError(error) {
  console.log('\nError:');
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(`Status: ${error.response.status}`);
    console.log('Data:', error.response.data);
  } else if (error.request) {
    // The request was made but no response was received
    console.log('No response received from server');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error:', error.message);
  }
}

/**
 * Prompt to continue
 * @param {Function} callback - Function to call after prompt
 */
function promptContinue(callback) {
  rl.question('\nPress Enter to continue...', () => {
    callback();
  });
}

// Start the application
showMenu();