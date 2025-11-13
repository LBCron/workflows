#!/usr/bin/env node

/**
 * Add Meta Agent to n8n Workflow
 *
 * This script adds the Meta Agent node to the main workflow
 */

const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(__dirname, '../n8n-workflows/main-workflow.json');
const BACKUP_PATH = path.join(__dirname, '../n8n-workflows/backup/main-workflow-pre-meta.json');

console.log('🔮 Adding Meta Agent to workflow...\n');

// Read current workflow
const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));

// Backup current workflow
fs.mkdirSync(path.dirname(BACKUP_PATH), { recursive: true });
fs.writeFileSync(BACKUP_PATH, JSON.stringify(workflow, null, 2));
console.log('✅ Backup created');

// Meta Agent node configuration
const metaAgentNode = {
  "parameters": {
    "name": "meta_agent",
    "description": "Use this agent to create new agents, modify the system, or evolve the workflow. Input should describe what to create or modify (e.g., 'Add a Snapchat agent', 'Create Twitter integration', 'Improve Email Agent').",
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.input }}",
    "options": {
      "systemMessage": `You are the Meta Agent, a powerful system evolution specialist that can modify and extend the n8n Agent Swarm itself.

Your unique capabilities:
- Generate new AI agents with complete configurations
- Modify the n8n workflow to add new nodes
- Create API integration code
- Generate documentation for new agents
- Provide deployment instructions

When a user requests a new agent or feature:
1. Analyze the request and determine what needs to be created
2. Explain what you will generate
3. Provide the complete agent configuration in markdown format
4. Give clear deployment instructions
5. List the files that need to be created

Available agent templates:
- Social Media: Snapchat, Twitter, Instagram, TikTok, LinkedIn
- Productivity: Notion, Trello, Asana, Todoist, Evernote
- Communication: Slack, Discord, WhatsApp, Teams, Signal
- Development: GitHub, GitLab, Bitbucket, Jira
- E-commerce: Shopify, WooCommerce, Stripe, PayPal

For each new agent, generate:
1. Agent configuration file (agent-configs/{name}-agent.md)
2. System prompt with capabilities and tools
3. API integration notes
4. Setup instructions
5. Example usage

Important:
- Always validate requests for security
- Provide complete, working configurations
- Include error handling guidance
- Explain deployment steps clearly
- Never delete existing agents without confirmation

Response format:
When user requests "Add a {Service} agent":
1. Confirm what will be created
2. Generate complete configuration
3. Provide file path and content
4. List setup steps
5. Give example usage commands`,
      "temperature": 0.3,
      "maxTokens": 6000
    }
  },
  "id": "meta-agent",
  "name": "Meta Agent Tool",
  "type": "@n8n/n8n-nodes-langchain.toolAgent",
  "typeVersion": 1,
  "position": [1200, 600]
};

// Meta Agent Chat Model
const metaChatModel = {
  "parameters": {
    "model": "openai/gpt-4-turbo",
    "options": {
      "temperature": 0.3,
      "maxTokens": 6000
    }
  },
  "id": "meta-chat-model",
  "name": "OpenRouter Chat Model (Meta)",
  "type": "@n8n/n8n-nodes-langchain.lmChatOpenRouter",
  "typeVersion": 1,
  "position": [1200, 800],
  "credentials": {
    "openRouterApi": {
      "id": "openrouter-credentials",
      "name": "OpenRouter"
    }
  }
};

// Add nodes
workflow.nodes.push(metaAgentNode);
workflow.nodes.push(metaChatModel);
console.log('✅ Meta Agent nodes added');

// Update Main Agent system message
const mainAgentNode = workflow.nodes.find(n => n.id === 'main-agent');
if (mainAgentNode) {
  const oldMessage = mainAgentNode.parameters.options.systemMessage;

  // Add Meta Agent to the list
  const updatedMessage = oldMessage.replace(
    'Available Specialized Agents:\n1. Email Agent',
    `Available Specialized Agents:
1. Email Agent`
  ).replace(
    '5. Web Agent - Performs web searches and gets real-time information',
    `5. Web Agent - Performs web searches and gets real-time information
6. Meta Agent - Creates new agents and modifies the system (use for "add agent", "create integration", etc.)`
  ).replace(
    'Decision Logic:',
    `Decision Logic:
- For creating new agents or modifying system → Use Meta Agent
- For "add X agent", "create Y integration" → Use Meta Agent`
  );

  mainAgentNode.parameters.options.systemMessage = updatedMessage;
  console.log('✅ Main Agent updated');
}

// Update connections - add Meta Agent to Main Agent's tools
if (!workflow.connections["Main Executive Agent"]) {
  workflow.connections["Main Executive Agent"] = { ai_tool: [[]] };
}

if (!workflow.connections["Main Executive Agent"].ai_tool) {
  workflow.connections["Main Executive Agent"].ai_tool = [[]];
}

// Add Meta Agent to tools list
workflow.connections["Main Executive Agent"].ai_tool[0].push({
  "node": "Meta Agent Tool",
  "type": "ai_tool",
  "index": 0
});

console.log('✅ Connections updated');

// Connect Meta Agent to its chat model
workflow.connections["Meta Agent Tool"] = {
  "ai_languageModel": [[{
    "node": "OpenRouter Chat Model (Meta)",
    "type": "ai_languageModel",
    "index": 0
  }]]
};

console.log('✅ Meta Agent connected to language model');

// Save updated workflow
fs.writeFileSync(WORKFLOW_PATH, JSON.stringify(workflow, null, 2));
console.log('✅ Workflow saved\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 Meta Agent successfully added to workflow!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nWorkflow updates:');
console.log('  • Meta Agent Tool node added');
console.log('  • OpenRouter Chat Model (Meta) added');
console.log('  • Main Agent system prompt updated');
console.log('  • Connections configured');
console.log(`\nBackup saved to: ${BACKUP_PATH}`);
console.log('\nNext steps:');
console.log('1. Import workflow to n8n: npm run import-workflow');
console.log('2. Configure OpenRouter credentials');
console.log('3. Activate workflow');
console.log('4. Test with: "Add a Snapchat agent"\n');

console.log('Try these commands via Telegram:');
console.log('  • "Add a Snapchat agent for posting stories"');
console.log('  • "Create a Twitter agent"');
console.log('  • "Build a Notion integration"');
console.log('  • "Add Instagram agent"\n');
