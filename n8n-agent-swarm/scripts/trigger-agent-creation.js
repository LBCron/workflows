#!/usr/bin/env node

/**
 * Trigger Agent Creation via GitHub API
 *
 * This script triggers the GitHub Actions workflow to create and deploy a new agent.
 * It uses the GitHub API's repository_dispatch event to start the automation.
 *
 * Usage: node scripts/trigger-agent-creation.js <agent-name> [agent-type]
 * Example: node scripts/trigger-agent-creation.js twitter social
 *
 * Environment variables required:
 * - GITHUB_TOKEN: GitHub Personal Access Token with repo scope
 * - GITHUB_REPOSITORY: Repository in format "owner/repo"
 */

const https = require('https');

// Configuration
const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'LBCron/workflows';

// Colors
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

/**
 * Make HTTPS request to GitHub API
 */
function githubApiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${GITHUB_API_URL}${path}`);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'User-Agent': 'n8n-agent-swarm-automation',
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData || '{}'));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${responseData}`));
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
 * Trigger repository dispatch event
 */
async function triggerAgentCreation(agentName, agentType = 'social') {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  log(`\n🚀 Triggering agent creation for: ${agentName}`, 'blue');
  log(`   Repository: ${GITHUB_REPOSITORY}`, 'reset');
  log(`   Type: ${agentType}`, 'reset');

  const payload = {
    event_type: 'create-agent',
    client_payload: {
      agent_name: agentName.toLowerCase(),
      agent_type: agentType,
      triggered_at: new Date().toISOString(),
      triggered_by: 'meta-agent',
    },
  };

  try {
    const response = await githubApiRequest(
      'POST',
      `/repos/${GITHUB_REPOSITORY}/dispatches`,
      payload
    );

    log(`\n✅ Agent creation triggered successfully!`, 'green');
    log(`\n📋 What happens next:`, 'blue');
    log(`   1. GitHub Actions workflow starts automatically`, 'reset');
    log(`   2. Agent configuration is generated`, 'reset');
    log(`   3. Workflow JSON is updated`, 'reset');
    log(`   4. Changes are committed and pushed`, 'reset');
    log(`   5. Application is deployed to Fly.io`, 'reset');
    log(`   6. Telegram notification is sent`, 'reset');
    log(`\n⏰ Expected completion: 3-5 minutes`, 'yellow');
    log(`\n🔗 Check progress: https://github.com/${GITHUB_REPOSITORY}/actions`, 'blue');
    log('');

    return {
      success: true,
      agent_name: agentName,
      agent_type: agentType,
      repository: GITHUB_REPOSITORY,
    };
  } catch (error) {
    log(`\n❌ Failed to trigger agent creation: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Validate GitHub token
 */
async function validateGitHubToken() {
  try {
    const user = await githubApiRequest('GET', '/user');
    log(`✅ GitHub token valid (authenticated as: ${user.login})`, 'green');
    return true;
  } catch (error) {
    log(`❌ GitHub token validation failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const agentName = process.argv[2];
  const agentType = process.argv[3] || 'social';

  if (!agentName) {
    log('❌ Error: Agent name is required', 'red');
    log('\nUsage: node scripts/trigger-agent-creation.js <agent-name> [agent-type]', 'yellow');
    log('Example: node scripts/trigger-agent-creation.js twitter social', 'yellow');
    log('\nAvailable types: social, productivity, communication, development', 'blue');
    log('\nEnvironment variables required:', 'blue');
    log('  GITHUB_TOKEN - Personal access token with repo scope', 'reset');
    log('  GITHUB_REPOSITORY - Repository name (default: LBCron/workflows)\n', 'reset');
    process.exit(1);
  }

  // Validate inputs
  const validTypes = ['social', 'productivity', 'communication', 'development'];
  if (!validTypes.includes(agentType)) {
    log(`⚠️  Warning: Unknown agent type "${agentType}". Using anyway...`, 'yellow');
  }

  try {
    // Validate GitHub token
    log('\n🔐 Validating GitHub token...', 'blue');
    const isValid = await validateGitHubToken();

    if (!isValid) {
      throw new Error('Invalid GitHub token. Please check your GITHUB_TOKEN environment variable.');
    }

    // Trigger creation
    const result = await triggerAgentCreation(agentName, agentType);

    process.exit(0);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    log('\n💡 Troubleshooting:', 'yellow');
    log('  1. Make sure GITHUB_TOKEN is set and valid', 'reset');
    log('  2. Token needs "repo" scope permissions', 'reset');
    log('  3. Check repository name format: owner/repo', 'reset');
    log('  4. Ensure GitHub Actions are enabled in the repository\n', 'reset');
    process.exit(1);
  }
}

// Export for use in n8n or other scripts
module.exports = {
  triggerAgentCreation,
  validateGitHubToken,
};

// Run if called directly
if (require.main === module) {
  main();
}
