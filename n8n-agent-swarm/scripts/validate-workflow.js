#!/usr/bin/env node

/**
 * n8n Workflow Validator
 *
 * Validates the workflow JSON structure before deployment
 */

const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(__dirname, '../n8n-workflows/main-workflow.json');

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

let errors = [];
let warnings = [];

function addError(message) {
  errors.push(message);
  log(`❌ ERROR: ${message}`, 'red');
}

function addWarning(message) {
  warnings.push(message);
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function addSuccess(message) {
  log(`✅ ${message}`, 'green');
}

/**
 * Load and parse workflow JSON
 */
function loadWorkflow() {
  log('📂 Loading workflow file...', 'blue');

  if (!fs.existsSync(WORKFLOW_PATH)) {
    addError(`Workflow file not found: ${WORKFLOW_PATH}`);
    return null;
  }

  try {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf8');
    const workflow = JSON.parse(content);
    addSuccess('Workflow JSON is valid');
    return workflow;
  } catch (error) {
    addError(`Failed to parse JSON: ${error.message}`);
    return null;
  }
}

/**
 * Validate basic workflow structure
 */
function validateStructure(workflow) {
  log('\n🔍 Validating workflow structure...', 'blue');

  // Check required fields
  if (!workflow.name) {
    addError('Workflow is missing "name" field');
  } else {
    addSuccess(`Workflow name: ${workflow.name}`);
  }

  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    addError('Workflow is missing "nodes" array');
    return false;
  } else {
    addSuccess(`Found ${workflow.nodes.length} nodes`);
  }

  if (!workflow.connections || typeof workflow.connections !== 'object') {
    addError('Workflow is missing "connections" object');
    return false;
  } else {
    addSuccess('Connections object present');
  }

  return true;
}

/**
 * Validate nodes
 */
function validateNodes(workflow) {
  log('\n🔍 Validating nodes...', 'blue');

  const requiredNodes = [
    { id: 'telegram-trigger', type: 'n8n-nodes-base.telegramTrigger', name: 'Telegram Trigger' },
    { id: 'main-agent', type: '@n8n/n8n-nodes-langchain.agent', name: 'Main Agent' },
    { id: 'email-agent', type: '@n8n/n8n-nodes-langchain.toolAgent', name: 'Email Agent' },
    { id: 'calendar-agent', type: '@n8n/n8n-nodes-langchain.toolAgent', name: 'Calendar Agent' },
    { id: 'contact-agent', type: '@n8n/n8n-nodes-langchain.toolAgent', name: 'Contact Agent' },
    { id: 'youtube-agent', type: '@n8n/n8n-nodes-langchain.toolAgent', name: 'YouTube Agent' },
    { id: 'web-agent', type: '@n8n/n8n-nodes-langchain.toolAgent', name: 'Web Agent' },
  ];

  for (const required of requiredNodes) {
    const node = workflow.nodes.find(n => n.id === required.id);

    if (!node) {
      addError(`Missing required node: ${required.name} (${required.id})`);
    } else if (node.type !== required.type) {
      addError(`Node ${required.name} has wrong type: ${node.type} (expected ${required.type})`);
    } else {
      addSuccess(`Found ${required.name}`);
    }
  }

  // Validate each node has required fields
  for (const node of workflow.nodes) {
    if (!node.id) {
      addError(`Node is missing "id" field`);
    }

    if (!node.name) {
      addError(`Node ${node.id} is missing "name" field`);
    }

    if (!node.type) {
      addError(`Node ${node.id} is missing "type" field`);
    }

    if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
      addWarning(`Node ${node.name} has invalid position coordinates`);
    }
  }
}

/**
 * Validate connections
 */
function validateConnections(workflow) {
  log('\n🔍 Validating connections...', 'blue');

  const nodeIds = workflow.nodes.map(n => n.id || n.name);

  for (const [sourceNode, connections] of Object.entries(workflow.connections)) {
    if (!nodeIds.includes(sourceNode)) {
      addError(`Connection from non-existent node: ${sourceNode}`);
      continue;
    }

    for (const [outputType, outputs] of Object.entries(connections)) {
      if (!Array.isArray(outputs)) continue;

      for (const connectionSet of outputs) {
        if (!Array.isArray(connectionSet)) continue;

        for (const conn of connectionSet) {
          if (!conn.node) {
            addError(`Connection from ${sourceNode} is missing target node`);
          } else if (!nodeIds.includes(conn.node)) {
            addError(`Connection to non-existent node: ${conn.node}`);
          }
        }
      }
    }
  }

  addSuccess('All connections reference valid nodes');
}

/**
 * Validate agent configurations
 */
function validateAgents(workflow) {
  log('\n🔍 Validating agent configurations...', 'blue');

  const agentNodes = workflow.nodes.filter(n =>
    n.type === '@n8n/n8n-nodes-langchain.agent' ||
    n.type === '@n8n/n8n-nodes-langchain.toolAgent'
  );

  for (const agent of agentNodes) {
    if (!agent.parameters) {
      addError(`Agent ${agent.name} is missing parameters`);
      continue;
    }

    const params = agent.parameters;

    // Check for system message
    if (params.options && params.options.systemMessage) {
      addSuccess(`Agent ${agent.name} has system prompt`);
    } else {
      addWarning(`Agent ${agent.name} is missing system message`);
    }

    // Check tool agents have name and description
    if (agent.type === '@n8n/n8n-nodes-langchain.toolAgent') {
      if (!params.name) {
        addError(`Tool agent ${agent.name} is missing "name" parameter`);
      }
      if (!params.description) {
        addWarning(`Tool agent ${agent.name} is missing "description" parameter`);
      }
    }
  }
}

/**
 * Validate credentials
 */
function validateCredentials(workflow) {
  log('\n🔍 Checking credentials...', 'blue');

  const requiredCredentials = [
    'telegramApi',
    'openRouterApi',
    'openAiApi',
    'googleSheetsOAuth2Api',
  ];

  const foundCredentials = new Set();

  for (const node of workflow.nodes) {
    if (node.credentials) {
      for (const credType of Object.keys(node.credentials)) {
        foundCredentials.add(credType);
      }
    }
  }

  for (const required of requiredCredentials) {
    if (foundCredentials.has(required)) {
      addSuccess(`Found ${required} credential reference`);
    } else {
      addWarning(`Missing ${required} credential reference`);
    }
  }

  log('\n⚠️  Note: You still need to configure these credentials in n8n UI', 'yellow');
}

/**
 * Check for common issues
 */
function checkCommonIssues(workflow) {
  log('\n🔍 Checking for common issues...', 'blue');

  // Check for duplicate node IDs
  const nodeIds = workflow.nodes.map(n => n.id).filter(Boolean);
  const duplicates = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);

  if (duplicates.length > 0) {
    addError(`Duplicate node IDs found: ${duplicates.join(', ')}`);
  } else {
    addSuccess('No duplicate node IDs');
  }

  // Check for orphaned nodes (no connections)
  const connectedNodes = new Set();
  for (const connections of Object.values(workflow.connections)) {
    for (const outputs of Object.values(connections)) {
      if (Array.isArray(outputs)) {
        for (const connectionSet of outputs) {
          if (Array.isArray(connectionSet)) {
            for (const conn of connectionSet) {
              if (conn.node) connectedNodes.add(conn.node);
            }
          }
        }
      }
    }
  }

  const orphanedNodes = workflow.nodes
    .filter(n => !connectedNodes.has(n.id || n.name))
    .filter(n => n.type !== 'n8n-nodes-base.telegramTrigger'); // Triggers don't need incoming connections

  if (orphanedNodes.length > 0) {
    addWarning(`Found ${orphanedNodes.length} potentially orphaned nodes`);
  } else {
    addSuccess('All nodes are properly connected');
  }
}

/**
 * Main validation function
 */
function main() {
  console.log('');
  log('═══════════════════════════════════════════════════', 'blue');
  log('   🔍 n8n Workflow Validator', 'blue');
  log('═══════════════════════════════════════════════════', 'blue');
  console.log('');

  // Load workflow
  const workflow = loadWorkflow();
  if (!workflow) {
    process.exit(1);
  }

  // Run validations
  const hasValidStructure = validateStructure(workflow);
  if (!hasValidStructure) {
    log('\n❌ Workflow structure is invalid. Cannot continue.', 'red');
    process.exit(1);
  }

  validateNodes(workflow);
  validateConnections(workflow);
  validateAgents(workflow);
  validateCredentials(workflow);
  checkCommonIssues(workflow);

  // Summary
  console.log('');
  log('═══════════════════════════════════════════════════', 'blue');
  log('   📊 Validation Summary', 'blue');
  log('═══════════════════════════════════════════════════', 'blue');
  console.log('');

  log(`Errors: ${errors.length}`, errors.length > 0 ? 'red' : 'green');
  log(`Warnings: ${warnings.length}`, warnings.length > 0 ? 'yellow' : 'green');

  console.log('');

  if (errors.length > 0) {
    log('❌ Validation FAILED - Please fix the errors above', 'red');
    process.exit(1);
  } else if (warnings.length > 0) {
    log('⚠️  Validation PASSED with warnings', 'yellow');
    log('The workflow should work, but review the warnings above', 'yellow');
    process.exit(0);
  } else {
    log('✅ Validation PASSED - Workflow looks good!', 'green');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { loadWorkflow, validateStructure, validateNodes };
