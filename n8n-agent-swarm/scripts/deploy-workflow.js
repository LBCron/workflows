#!/usr/bin/env node

/**
 * n8n Workflow Deployment Script
 *
 * Deploys workflow to n8n instance with validation and error handling
 * Used by GitHub Actions for automated deployment
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration from environment
const N8N_INSTANCE_URL = process.env.N8N_INSTANCE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;
const WORKFLOW_PATH = process.env.WORKFLOW_PATH || path.join(__dirname, '../n8n-workflows/main-workflow.json');

// Parse URL
const url = new URL(N8N_INSTANCE_URL);
const protocol = url.protocol === 'https:' ? https : http;
const hostname = url.hostname;
const port = url.port || (url.protocol === 'https:' ? 443 : 80);

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${colors[color]}${message}${colors.reset}`);
}

/**
 * Make HTTP request
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = protocol.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: body ? JSON.parse(body) : null,
            headers: res.headers
          });
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
async function healthCheck() {
  log('🏥 Performing health check...', 'blue');

  try {
    const options = {
      hostname,
      port,
      path: '/healthz',
      method: 'GET',
      timeout: 5000
    };

    const response = await makeRequest(options);

    if (response.statusCode === 200) {
      log('✅ n8n instance is healthy', 'green');
      return true;
    } else {
      log(`⚠️  n8n returned status ${response.statusCode}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Get existing workflow by name
 */
async function getExistingWorkflow(workflowName) {
  log(`🔍 Checking for existing workflow: ${workflowName}`, 'blue');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (N8N_API_KEY) {
    headers['X-N8N-API-KEY'] = N8N_API_KEY;
  }

  const options = {
    hostname,
    port,
    path: '/api/v1/workflows',
    method: 'GET',
    headers,
  };

  try {
    const response = await makeRequest(options);

    if (response.statusCode === 200 && response.body && response.body.data) {
      const existing = response.body.data.find(w => w.name === workflowName);
      if (existing) {
        log(`📋 Found existing workflow: ${existing.id}`, 'blue');
        return existing;
      }
    }

    log('📝 No existing workflow found', 'blue');
    return null;
  } catch (error) {
    log(`⚠️  Could not check existing workflows: ${error.message}`, 'yellow');
    return null;
  }
}

/**
 * Deploy workflow (create or update)
 */
async function deployWorkflow(workflowData, existingId = null) {
  const action = existingId ? 'UPDATE' : 'CREATE';
  log(`🚀 ${action}ING workflow...`, 'blue');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (N8N_API_KEY) {
    headers['X-N8N-API-KEY'] = N8N_API_KEY;
  }

  const options = {
    hostname,
    port,
    path: existingId ? `/api/v1/workflows/${existingId}` : '/api/v1/workflows',
    method: existingId ? 'PATCH' : 'POST',
    headers,
  };

  try {
    const response = await makeRequest(options, workflowData);

    if (response.statusCode === 200 || response.statusCode === 201) {
      log(`✅ Workflow ${action.toLowerCase()}d successfully!`, 'green');
      if (response.body && response.body.id) {
        log(`📋 Workflow ID: ${response.body.id}`, 'blue');
      }
      return response.body;
    } else {
      log(`❌ Failed to ${action.toLowerCase()} workflow. Status: ${response.statusCode}`, 'red');
      if (response.body) {
        console.error(response.body);
      }
      return null;
    }
  } catch (error) {
    log(`❌ Error ${action.toLowerCase()}ing workflow: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Activate workflow
 */
async function activateWorkflow(workflowId) {
  log(`⚡ Activating workflow ${workflowId}...`, 'blue');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (N8N_API_KEY) {
    headers['X-N8N-API-KEY'] = N8N_API_KEY;
  }

  const options = {
    hostname,
    port,
    path: `/api/v1/workflows/${workflowId}`,
    method: 'PATCH',
    headers,
  };

  try {
    const response = await makeRequest(options, { active: true });

    if (response.statusCode === 200) {
      log('✅ Workflow activated!', 'green');
      return true;
    } else {
      log(`⚠️  Could not activate workflow. Status: ${response.statusCode}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`⚠️  Could not activate workflow: ${error.message}`, 'yellow');
    return false;
  }
}

/**
 * Create backup of existing workflow
 */
async function backupWorkflow(workflow) {
  log('💾 Creating backup...', 'blue');

  const backupDir = path.join(__dirname, '../n8n-workflows/backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `workflow-backup-${timestamp}.json`);

  try {
    fs.writeFileSync(backupPath, JSON.stringify(workflow, null, 2));
    log(`✅ Backup created: ${backupPath}`, 'green');
    return true;
  } catch (error) {
    log(`⚠️  Could not create backup: ${error.message}`, 'yellow');
    return false;
  }
}

/**
 * Main deployment function
 */
async function main() {
  console.log('');
  log('═══════════════════════════════════════════════════', 'blue');
  log('   🚀 n8n Workflow Deployment', 'blue');
  log('═══════════════════════════════════════════════════', 'blue');
  console.log('');

  // Validate environment
  if (!N8N_API_KEY) {
    log('❌ N8N_API_KEY environment variable is required!', 'red');
    process.exit(1);
  }

  log(`🎯 Target: ${N8N_INSTANCE_URL}`, 'blue');
  log(`📄 Workflow: ${WORKFLOW_PATH}`, 'blue');
  console.log('');

  // Health check
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    log('❌ n8n instance is not healthy. Aborting deployment.', 'red');
    process.exit(1);
  }

  // Load workflow
  log('📂 Loading workflow file...', 'blue');
  if (!fs.existsSync(WORKFLOW_PATH)) {
    log(`❌ Workflow file not found: ${WORKFLOW_PATH}`, 'red');
    process.exit(1);
  }

  let workflowData;
  try {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf8');
    workflowData = JSON.parse(content);
    log(`✅ Loaded workflow: ${workflowData.name}`, 'green');
  } catch (error) {
    log(`❌ Failed to load workflow: ${error.message}`, 'red');
    process.exit(1);
  }

  // Check for existing workflow
  const existing = await getExistingWorkflow(workflowData.name);

  // Create backup if updating
  if (existing) {
    await backupWorkflow(existing);
  }

  // Deploy workflow
  const deployed = await deployWorkflow(workflowData, existing ? existing.id : null);

  if (!deployed) {
    log('❌ Deployment failed!', 'red');
    process.exit(1);
  }

  // Activate workflow
  const workflowId = deployed.id || existing.id;
  if (workflowId) {
    await activateWorkflow(workflowId);
  }

  // Success!
  console.log('');
  log('═══════════════════════════════════════════════════', 'green');
  log('   ✅ Deployment Successful!', 'green');
  log('═══════════════════════════════════════════════════', 'green');
  console.log('');
  log(`🌐 Workflow URL: ${N8N_INSTANCE_URL}/workflow/${workflowId}`, 'blue');
  console.log('');
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { deployWorkflow, healthCheck };
