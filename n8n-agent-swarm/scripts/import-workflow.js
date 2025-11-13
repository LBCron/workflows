#!/usr/bin/env node

/**
 * n8n Workflow Import Script
 *
 * Automatically imports the main workflow into n8n instance
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || '5678';
const N8N_PROTOCOL = process.env.N8N_PROTOCOL || 'http';
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const N8N_USER = process.env.N8N_USER || 'admin';
const N8N_PASSWORD = process.env.N8N_PASSWORD || '';

const WORKFLOW_PATH = path.join(__dirname, '../n8n-workflows/main-workflow.json');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Make HTTP request to n8n API
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = N8N_PROTOCOL === 'https' ? https : http;

    const req = protocol.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            body: body ? JSON.parse(body) : null,
            headers: res.headers
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            body: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Check if n8n is accessible
 */
async function checkN8nConnection() {
  logInfo('Checking n8n connection...');

  try {
    const options = {
      hostname: N8N_HOST,
      port: N8N_PORT,
      path: '/',
      method: 'GET',
    };

    const response = await makeRequest(options);

    if (response.statusCode === 200 || response.statusCode === 401) {
      logSuccess('n8n is accessible');
      return true;
    } else {
      logError(`n8n returned status code: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`Cannot connect to n8n: ${error.message}`);
    return false;
  }
}

/**
 * Import workflow into n8n
 */
async function importWorkflow() {
  logInfo('Loading workflow file...');

  // Check if workflow file exists
  if (!fs.existsSync(WORKFLOW_PATH)) {
    logError(`Workflow file not found: ${WORKFLOW_PATH}`);
    return false;
  }

  // Read workflow file
  let workflowData;
  try {
    const workflowContent = fs.readFileSync(WORKFLOW_PATH, 'utf8');
    workflowData = JSON.parse(workflowContent);
    logSuccess(`Loaded workflow: ${workflowData.name}`);
  } catch (error) {
    logError(`Error reading workflow file: ${error.message}`);
    return false;
  }

  // Prepare API request
  const headers = {
    'Content-Type': 'application/json',
  };

  if (N8N_API_KEY) {
    headers['X-N8N-API-KEY'] = N8N_API_KEY;
  } else if (N8N_USER && N8N_PASSWORD) {
    const auth = Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  const options = {
    hostname: N8N_HOST,
    port: N8N_PORT,
    path: '/api/v1/workflows',
    method: 'POST',
    headers: headers,
  };

  logInfo('Importing workflow to n8n...');

  try {
    const response = await makeRequest(options, workflowData);

    if (response.statusCode === 200 || response.statusCode === 201) {
      logSuccess('Workflow imported successfully!');
      if (response.body && response.body.id) {
        logInfo(`Workflow ID: ${response.body.id}`);
      }
      return true;
    } else {
      logError(`Failed to import workflow. Status: ${response.statusCode}`);
      if (response.body) {
        console.log(response.body);
      }
      return false;
    }
  } catch (error) {
    logError(`Error importing workflow: ${error.message}`);
    return false;
  }
}

/**
 * Activate workflow
 */
async function activateWorkflow(workflowId) {
  logInfo('Activating workflow...');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (N8N_API_KEY) {
    headers['X-N8N-API-KEY'] = N8N_API_KEY;
  } else if (N8N_USER && N8N_PASSWORD) {
    const auth = Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  const options = {
    hostname: N8N_HOST,
    port: N8N_PORT,
    path: `/api/v1/workflows/${workflowId}`,
    method: 'PATCH',
    headers: headers,
  };

  try {
    const response = await makeRequest(options, { active: true });

    if (response.statusCode === 200) {
      logSuccess('Workflow activated!');
      return true;
    } else {
      logWarning('Could not activate workflow automatically');
      logInfo('You can activate it manually in the n8n UI');
      return false;
    }
  } catch (error) {
    logWarning(`Could not activate workflow: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  log('═══════════════════════════════════════', 'blue');
  log('   n8n Workflow Import Tool', 'bright');
  log('═══════════════════════════════════════', 'blue');
  console.log('');

  // Check connection
  const isConnected = await checkN8nConnection();
  if (!isConnected) {
    logError('Cannot connect to n8n. Make sure it is running.');
    logInfo(`Expected URL: ${N8N_PROTOCOL}://${N8N_HOST}:${N8N_PORT}`);
    process.exit(1);
  }

  // Import workflow
  const imported = await importWorkflow();
  if (!imported) {
    logError('Failed to import workflow');
    process.exit(1);
  }

  console.log('');
  logSuccess('Workflow import completed!');
  console.log('');
  logInfo('Next steps:');
  console.log('1. Open n8n in your browser');
  console.log('2. Configure all credentials');
  console.log('3. Activate the workflow');
  console.log('4. Test with your Telegram bot');
  console.log('');
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { importWorkflow, checkN8nConnection };
