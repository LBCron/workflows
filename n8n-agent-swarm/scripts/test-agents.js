#!/usr/bin/env node

/**
 * n8n Agent Swarm - Integration Tests
 *
 * Tests the workflow and agents to ensure everything is working correctly
 */

const http = require('http');

// Configuration
const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || '5678';

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test results
const tests = {
  passed: 0,
  failed: 0,
  skipped: 0
};

/**
 * Test runner
 */
async function runTest(name, testFn) {
  process.stdout.write(`Testing ${name}... `);

  try {
    await testFn();
    log('✅ PASSED', 'green');
    tests.passed++;
    return true;
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    tests.failed++;
    return false;
  }
}

/**
 * Make HTTP request
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: body ? JSON.parse(body) : null
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

/**
 * Test: n8n is accessible
 */
async function testN8nAccessible() {
  const options = {
    hostname: N8N_HOST,
    port: N8N_PORT,
    path: '/healthz',
    method: 'GET'
  };

  const response = await makeRequest(options);

  if (response.statusCode !== 200) {
    throw new Error(`n8n returned status ${response.statusCode}`);
  }
}

/**
 * Test: Workflow file exists
 */
async function testWorkflowExists() {
  const fs = require('fs');
  const path = require('path');

  const workflowPath = path.join(__dirname, '../n8n-workflows/main-workflow.json');

  if (!fs.existsSync(workflowPath)) {
    throw new Error('Workflow file not found');
  }

  const content = fs.readFileSync(workflowPath, 'utf8');
  const workflow = JSON.parse(content);

  if (!workflow.nodes || workflow.nodes.length === 0) {
    throw new Error('Workflow has no nodes');
  }
}

/**
 * Test: All agent configs exist
 */
async function testAgentConfigsExist() {
  const fs = require('fs');
  const path = require('path');

  const agents = [
    'main-agent',
    'email-agent',
    'calendar-agent',
    'contact-agent',
    'youtube-agent',
    'web-agent'
  ];

  for (const agent of agents) {
    const configPath = path.join(__dirname, `../agent-configs/${agent}.md`);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Missing config for ${agent}`);
    }
  }
}

/**
 * Test: Environment variables
 */
async function testEnvironmentVariables() {
  const fs = require('fs');
  const path = require('path');

  const envExamplePath = path.join(__dirname, '../.env.example');

  if (!fs.existsSync(envExamplePath)) {
    throw new Error('.env.example not found');
  }

  const content = fs.readFileSync(envExamplePath, 'utf8');

  const requiredVars = [
    'TELEGRAM_BOT_TOKEN',
    'OPENROUTER_API_KEY',
    'OPENAI_API_KEY',
    'GOOGLE_CLIENT_ID'
  ];

  for (const varName of requiredVars) {
    if (!content.includes(varName)) {
      throw new Error(`Missing ${varName} in .env.example`);
    }
  }
}

/**
 * Test: Docker Compose file
 */
async function testDockerCompose() {
  const fs = require('fs');
  const path = require('path');

  const composePath = path.join(__dirname, '../docker-compose.yml');

  if (!fs.existsSync(composePath)) {
    throw new Error('docker-compose.yml not found');
  }

  const content = fs.readFileSync(composePath, 'utf8');

  if (!content.includes('n8n:')) {
    throw new Error('n8n service not found in docker-compose.yml');
  }

  if (!content.includes('postgres:')) {
    throw new Error('postgres service not found in docker-compose.yml');
  }
}

/**
 * Test: Scripts are executable
 */
async function testScriptsExecutable() {
  const fs = require('fs');
  const path = require('path');

  const scripts = [
    'setup.sh',
    'import-workflow.js',
    'configure-credentials.js',
    'validate-workflow.js'
  ];

  for (const script of scripts) {
    const scriptPath = path.join(__dirname, script);
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script not found: ${script}`);
    }
  }
}

/**
 * Test: Documentation exists
 */
async function testDocumentationExists() {
  const fs = require('fs');
  const path = require('path');

  const docs = [
    '../README.md',
    '../DEMO.md',
    '../docs/INSTALLATION.md',
    '../docs/ARCHITECTURE.md'
  ];

  for (const doc of docs) {
    const docPath = path.join(__dirname, doc);
    if (!fs.existsSync(docPath)) {
      throw new Error(`Documentation missing: ${doc}`);
    }
  }
}

/**
 * Main test suite
 */
async function main() {
  console.log('');
  log('═══════════════════════════════════════════════════', 'blue');
  log('   🧪 n8n Agent Swarm - Integration Tests', 'blue');
  log('═══════════════════════════════════════════════════', 'blue');
  console.log('');

  // Run tests
  await runTest('n8n accessibility', testN8nAccessible);
  await runTest('workflow file', testWorkflowExists);
  await runTest('agent configurations', testAgentConfigsExist);
  await runTest('environment variables', testEnvironmentVariables);
  await runTest('docker compose', testDockerCompose);
  await runTest('automation scripts', testScriptsExecutable);
  await runTest('documentation', testDocumentationExists);

  // Summary
  console.log('');
  log('═══════════════════════════════════════════════════', 'blue');
  log('   📊 Test Summary', 'blue');
  log('═══════════════════════════════════════════════════', 'blue');
  console.log('');

  log(`✅ Passed: ${tests.passed}`, 'green');
  log(`❌ Failed: ${tests.failed}`, tests.failed > 0 ? 'red' : 'reset');
  log(`⏭️  Skipped: ${tests.skipped}`, 'yellow');

  console.log('');

  if (tests.failed > 0) {
    log('❌ Some tests failed!', 'red');
    process.exit(1);
  } else {
    log('✅ All tests passed!', 'green');
    process.exit(0);
  }
}

// Run tests
if (require.main === module) {
  main().catch((error) => {
    log(`❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runTest, testN8nAccessible };
