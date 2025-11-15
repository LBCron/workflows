#!/usr/bin/env node

/**
 * Add Agent to n8n Workflow
 *
 * This script automatically adds a new agent to the n8n workflow JSON.
 * It creates the agent node, language model connection, and links it to the Main Agent.
 *
 * Usage: node scripts/add-agent-to-workflow.js <agent-name>
 * Example: node scripts/add-agent-to-workflow.js twitter
 */

const fs = require('fs');
const path = require('path');

// Configuration
const WORKFLOW_PATH = path.join(__dirname, '../n8n-workflows/main-workflow.json');
const AGENT_CONFIGS_PATH = path.join(__dirname, '../agent-configs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Read and parse agent configuration from markdown
 */
function readAgentConfig(agentName) {
  const configPath = path.join(AGENT_CONFIGS_PATH, `${agentName}-agent.md`);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Agent configuration not found: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf8');

  // Extract description from markdown
  const descriptionMatch = content.match(/## Description\s*\n\s*(.+?)(?=\n\n|\n##)/s);
  const description = descriptionMatch
    ? descriptionMatch[1].trim()
    : `AI agent specialized in ${agentName} operations`;

  // Extract capabilities
  const capabilitiesMatch = content.match(/## Capabilities\s*\n([\s\S]*?)(?=\n##)/);
  const capabilities = capabilitiesMatch
    ? capabilitiesMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.trim().substring(2))
    : [];

  return {
    description,
    capabilities,
  };
}

/**
 * Create agent tool node
 */
function createAgentNode(agentName, index) {
  const agentTitle = capitalizeFirst(agentName);
  const config = readAgentConfig(agentName);

  // Calculate position (arrange in a circle around main agent)
  const baseX = 1200;
  const baseY = 400;
  const radius = 300;
  const angle = (index * (Math.PI * 2)) / 10; // Distribute around circle

  const x = Math.round(baseX + radius * Math.cos(angle));
  const y = Math.round(baseY + radius * Math.sin(angle));

  return {
    parameters: {
      name: `${agentName}_agent`,
      description: `Use this agent for ${agentName}-related tasks. ${config.description}`,
      agent: "conversationalAgent",
      promptType: "define",
      text: `You are the ${agentTitle} Agent, specialized in ${agentName} operations.\n\nCapabilities:\n${config.capabilities.map(c => `- ${c}`).join('\n')}\n\nAlways provide clear, actionable responses.`,
      hasOutputParser: false,
      options: {}
    },
    id: `${agentName}-agent-tool`,
    name: `${agentTitle} Agent Tool`,
    type: "@n8n/n8n-nodes-langchain.toolAgent",
    typeVersion: 1.1,
    position: [x, y]
  };
}

/**
 * Create language model node for agent
 */
function createLanguageModelNode(agentName, index) {
  const baseX = 1200;
  const baseY = 400;
  const radius = 300;
  const angle = (index * (Math.PI * 2)) / 10;

  const x = Math.round(baseX + radius * Math.cos(angle) + 200);
  const y = Math.round(baseY + radius * Math.sin(angle));

  return {
    parameters: {
      model: "openai/gpt-4-turbo",
      options: {
        temperature: 0.7,
        maxTokens: 2000
      }
    },
    id: `${agentName}-language-model`,
    name: `${capitalizeFirst(agentName)} LLM`,
    type: "@n8n/n8n-nodes-langchain.lmChatOpenRouter",
    typeVersion: 1,
    position: [x, y],
    credentials: {
      openRouterApi: {
        id: "openrouter-credentials",
        name: "OpenRouter API"
      }
    }
  };
}

/**
 * Add agent to workflow
 */
function addAgentToWorkflow(agentName) {
  log(`\n🔧 Adding ${capitalizeFirst(agentName)} Agent to workflow...`, 'blue');

  // Read workflow
  if (!fs.existsSync(WORKFLOW_PATH)) {
    throw new Error(`Workflow not found: ${WORKFLOW_PATH}`);
  }

  const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));

  // Check if agent already exists
  const existingAgent = workflow.nodes.find(node =>
    node.id === `${agentName}-agent-tool`
  );

  if (existingAgent) {
    log(`⚠️  ${capitalizeFirst(agentName)} Agent already exists in workflow`, 'yellow');
    return false;
  }

  // Get current number of agent tools (to calculate position)
  const agentTools = workflow.nodes.filter(node =>
    node.type === "@n8n/n8n-nodes-langchain.toolAgent"
  );
  const agentIndex = agentTools.length;

  // Create new nodes
  const agentNode = createAgentNode(agentName, agentIndex);
  const llmNode = createLanguageModelNode(agentName, agentIndex);

  // Add nodes to workflow
  workflow.nodes.push(agentNode);
  workflow.nodes.push(llmNode);

  // Create connections
  // 1. Connect LLM to Agent Tool
  workflow.connections[`${agentName}-language-model`] = {
    ai_languageModel: [
      [
        {
          node: `${agentName}-agent-tool`,
          type: "ai_languageModel",
          index: 0
        }
      ]
    ]
  };

  // 2. Connect Agent Tool to Main Agent (as a tool)
  const mainAgentId = "main-agent";
  if (!workflow.connections[`${agentName}-agent-tool`]) {
    workflow.connections[`${agentName}-agent-tool`] = {};
  }

  workflow.connections[`${agentName}-agent-tool`].ai_tool = [
    [
      {
        node: mainAgentId,
        type: "ai_tool",
        index: 0
      }
    ]
  ];

  // Backup original workflow
  const backupPath = WORKFLOW_PATH.replace('.json', `.backup.${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(workflow, null, 2));
  log(`📦 Backup created: ${path.basename(backupPath)}`, 'yellow');

  // Save updated workflow
  fs.writeFileSync(WORKFLOW_PATH, JSON.stringify(workflow, null, 2));
  log(`✅ ${capitalizeFirst(agentName)} Agent added to workflow successfully!`, 'green');

  // Print summary
  log(`\n📊 Summary:`, 'blue');
  log(`   • Agent Node: ${agentNode.name}`, 'reset');
  log(`   • LLM Node: ${llmNode.name}`, 'reset');
  log(`   • Position: [${agentNode.position[0]}, ${agentNode.position[1]}]`, 'reset');
  log(`   • Total Agents: ${agentTools.length + 1}`, 'reset');
  log(`   • Workflow Nodes: ${workflow.nodes.length}`, 'reset');

  return true;
}

/**
 * Main execution
 */
function main() {
  const agentName = process.argv[2];

  if (!agentName) {
    log('❌ Error: Agent name is required', 'red');
    log('\nUsage: node scripts/add-agent-to-workflow.js <agent-name>', 'yellow');
    log('Example: node scripts/add-agent-to-workflow.js twitter\n', 'yellow');
    process.exit(1);
  }

  try {
    const success = addAgentToWorkflow(agentName.toLowerCase());

    if (success) {
      log(`\n🎉 Done! The ${capitalizeFirst(agentName)} Agent is now part of your workflow.`, 'green');
      log(`\n📋 Next steps:`, 'blue');
      log(`   1. Review the workflow: n8n-workflows/main-workflow.json`, 'reset');
      log(`   2. Import or redeploy to your n8n instance`, 'reset');
      log(`   3. Configure any required credentials`, 'reset');
      log(`   4. Test via Telegram: "Use ${agentName} to..."`, 'reset');
      log('');
    }

    process.exit(0);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (error.stack) {
      log(`\n${error.stack}`, 'red');
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { addAgentToWorkflow };
