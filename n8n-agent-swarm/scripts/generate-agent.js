#!/usr/bin/env node

/**
 * Agent Generator - Create New AI Agents Automatically
 *
 * This script generates a complete agent configuration
 * based on a template and user specifications
 */

const fs = require('fs');
const path = require('path');

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Agent Template
 */
const agentTemplate = (config) => `# ${config.name} Agent Configuration

## Role
**${config.role}**

${config.description}

## System Prompt

\`\`\`
You are the ${config.name} Agent, specialized in ${config.domain}.

Capabilities:
${config.capabilities.map(c => `- ${c}`).join('\n')}

When handling requests:
1. Parse ${config.domain} operations from user input
2. Use appropriate ${config.serviceName} API tools
3. Validate all inputs before API calls
4. Handle errors gracefully
5. Provide clear confirmation of actions

Tools available:
${config.tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Always confirm successful operations and provide relevant details.
\`\`\`

## Model Configuration

| Parameter | Value |
|-----------|-------|
| Provider | OpenRouter |
| Model | \`openai/gpt-4-turbo\` |
| Temperature | ${config.temperature || 0.5} |
| Max Tokens | ${config.maxTokens || 3000} |

## Available Tools

${config.tools.map((tool, index) => `
### ${index + 1}. ${tool.name}
**Purpose**: ${tool.description}

**Parameters**:
\`\`\`json
${JSON.stringify(tool.parameters, null, 2)}
\`\`\`

**Example**:
\`\`\`json
${JSON.stringify(tool.example, null, 2)}
\`\`\`
`).join('\n')}

## Example Interactions

### Example 1: ${config.examples[0].title}
**Input**: "${config.examples[0].input}"
**Action**:
\`\`\`javascript
${config.examples[0].action}
\`\`\`
**Response**: "${config.examples[0].response}"

${config.examples.slice(1).map((ex, i) => `
### Example ${i + 2}: ${ex.title}
**Input**: "${ex.input}"
**Response**: "${ex.response}"
`).join('\n')}

## Error Handling

${config.errorHandling.map(err => `- **${err.type}**: ${err.message}`).join('\n')}

## Best Practices

${config.bestPractices.map(bp => `${bp}`).join('\n')}

---

**Agent Created:** ${new Date().toISOString()}
**Generator Version:** 1.0.0
`;

/**
 * Predefined agent templates for common services
 */
const serviceTemplates = {
  snapchat: {
    name: 'Snapchat',
    role: 'Snapchat Account Management Specialist',
    domain: 'Snapchat operations',
    serviceName: 'Snapchat',
    description: 'The Snapchat Agent manages all Snapchat account operations including posting stories, sending snaps, and managing friends.',
    capabilities: [
      'Post stories to Snapchat',
      'Send snaps to friends',
      'View received snaps',
      'Manage friend list',
      'View and reply to messages',
      'Update profile information'
    ],
    tools: [
      {
        name: 'snapchat_post_story',
        description: 'Post a story to Snapchat',
        parameters: {
          media: 'URL or path to image/video',
          duration: 'Story duration (default: 24h)',
          caption: 'Optional caption text'
        },
        example: {
          media: 'https://example.com/image.jpg',
          caption: 'Hello from n8n! 👻'
        }
      },
      {
        name: 'snapchat_send_snap',
        description: 'Send a snap to friends',
        parameters: {
          recipients: 'Array of usernames',
          media: 'Image or video',
          message: 'Optional text message'
        },
        example: {
          recipients: ['friend1', 'friend2'],
          media: 'snap.jpg',
          message: 'Check this out!'
        }
      }
    ],
    examples: [
      {
        title: 'Post Story',
        input: 'Post a story saying "Hello World"',
        action: 'snapchat_post_story({\n  text: "Hello World",\n  duration: "24h"\n})',
        response: '✅ Story posted successfully! Visible for 24 hours.'
      },
      {
        title: 'Send Snap',
        input: 'Send a snap to john123',
        response: '✅ Snap sent to john123'
      }
    ],
    errorHandling: [
      { type: 'Authentication Failed', message: 'Please re-authenticate your Snapchat account' },
      { type: 'Invalid Media', message: 'Media format not supported. Use JPG, PNG, or MP4' },
      { type: 'User Not Found', message: 'Recipient username not found' }
    ],
    bestPractices: [
      '1. Always validate media format before posting',
      '2. Respect Snapchat rate limits',
      '3. Handle authentication expiry gracefully',
      '4. Confirm recipient usernames exist'
    ],
    temperature: 0.5,
    maxTokens: 3000
  },

  twitter: {
    name: 'Twitter',
    role: 'Twitter Account Management Specialist',
    domain: 'Twitter/X operations',
    serviceName: 'Twitter',
    description: 'The Twitter Agent manages Twitter/X account operations including posting tweets, reading timeline, and engaging with content.',
    capabilities: [
      'Post tweets with text, images, and videos',
      'Read home timeline',
      'Reply to mentions',
      'Retweet and like tweets',
      'Send direct messages',
      'Search tweets',
      'Manage followers'
    ],
    tools: [
      {
        name: 'twitter_post_tweet',
        description: 'Post a tweet',
        parameters: {
          text: 'Tweet text (max 280 characters)',
          media: 'Optional media URLs',
          reply_to: 'Optional tweet ID to reply to'
        },
        example: {
          text: 'Just added a Twitter agent to my n8n swarm! 🤖 #automation',
          media: ['image.jpg']
        }
      },
      {
        name: 'twitter_get_timeline',
        description: 'Get home timeline',
        parameters: {
          count: 'Number of tweets (default: 20)',
          since_id: 'Get tweets after this ID'
        },
        example: { count: 10 }
      }
    ],
    examples: [
      {
        title: 'Post Tweet',
        input: 'Tweet: Building AI agents with n8n is amazing!',
        action: 'twitter_post_tweet({\n  text: "Building AI agents with n8n is amazing!"\n})',
        response: '✅ Tweet posted! View: https://twitter.com/you/status/123'
      }
    ],
    errorHandling: [
      { type: 'Duplicate Tweet', message: 'This tweet was already posted recently' },
      { type: 'Rate Limited', message: 'Too many requests. Please wait.' },
      { type: 'Invalid Media', message: 'Media file too large or wrong format' }
    ],
    bestPractices: [
      '1. Keep tweets under 280 characters',
      '2. Use hashtags strategically',
      '3. Respect rate limits (300 tweets per 3 hours)',
      '4. Validate media before posting'
    ]
  },

  notion: {
    name: 'Notion',
    role: 'Notion Workspace Management Specialist',
    domain: 'Notion operations',
    serviceName: 'Notion',
    description: 'The Notion Agent manages Notion workspace operations including creating pages, updating databases, and searching content.',
    capabilities: [
      'Create and update pages',
      'Query and update databases',
      'Search across workspace',
      'Add database entries',
      'Update page properties',
      'Archive pages'
    ],
    tools: [
      {
        name: 'notion_create_page',
        description: 'Create a new page',
        parameters: {
          parent: 'Parent page or database ID',
          title: 'Page title',
          content: 'Page content (markdown)',
          properties: 'Optional properties'
        },
        example: {
          parent: 'database_id',
          title: 'Meeting Notes',
          content: '# Meeting with Team...'
        }
      }
    ],
    examples: [
      {
        title: 'Create Page',
        input: 'Create a Notion page called "Project Ideas"',
        action: 'notion_create_page({ title: "Project Ideas" })',
        response: '✅ Page "Project Ideas" created in your workspace'
      }
    ],
    errorHandling: [
      { type: 'Invalid Parent', message: 'Parent page or database not found' },
      { type: 'Permission Denied', message: 'No access to this workspace' }
    ],
    bestPractices: [
      '1. Organize pages in databases for better structure',
      '2. Use properties for filtering and sorting',
      '3. Validate parent IDs before creating pages'
    ]
  }
};

/**
 * Generate agent from template
 */
function generateAgent(serviceName, customConfig = {}) {
  log(`\n🤖 Generating ${serviceName} Agent...`, 'blue');

  const template = serviceTemplates[serviceName.toLowerCase()];

  if (!template) {
    log(`❌ No template found for ${serviceName}`, 'red');
    log(`Available templates: ${Object.keys(serviceTemplates).join(', ')}`, 'yellow');
    return false;
  }

  // Merge custom config
  const config = { ...template, ...customConfig };

  // Generate markdown
  const markdown = agentTemplate(config);

  // Save to file
  const outputPath = path.join(
    __dirname,
    '../agent-configs',
    `${serviceName.toLowerCase()}-agent.md`
  );

  fs.writeFileSync(outputPath, markdown);

  log(`✅ Agent configuration created: ${outputPath}`, 'green');
  log(`\nNext steps:`, 'blue');
  log(`1. Review the generated configuration`);
  log(`2. Add API integration code if needed`);
  log(`3. Update n8n workflow to include this agent`);
  log(`4. Configure API credentials`);
  log(`5. Test the agent`);

  return outputPath;
}

/**
 * CLI Interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    log('\n📚 Agent Generator Usage:', 'blue');
    log('\nGenerate from template:');
    log('  node generate-agent.js <service-name>');
    log('\nAvailable templates:', 'yellow');
    Object.keys(serviceTemplates).forEach(name => {
      log(`  - ${name}`);
    });
    log('\nExamples:');
    log('  node generate-agent.js snapchat');
    log('  node generate-agent.js twitter');
    log('  node generate-agent.js notion\n');
    process.exit(0);
  }

  const serviceName = args[0];
  generateAgent(serviceName);
}

module.exports = { generateAgent, serviceTemplates, agentTemplate };
