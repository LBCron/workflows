#!/usr/bin/env node

/**
 * n8n Credentials Configuration Helper
 *
 * Interactive CLI to help configure all required API credentials
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Credential definitions
const credentials = [
  {
    name: 'Telegram Bot Token',
    key: 'TELEGRAM_BOT_TOKEN',
    description: 'Bot token from @BotFather on Telegram',
    link: 'https://core.telegram.org/bots#6-botfather',
    required: true,
    validate: (value) => value && value.includes(':'),
  },
  {
    name: 'OpenRouter API Key',
    key: 'OPENROUTER_API_KEY',
    description: 'API key for OpenRouter (GPT-4 access)',
    link: 'https://openrouter.ai/keys',
    required: true,
    validate: (value) => value && value.startsWith('sk-'),
  },
  {
    name: 'OpenAI API Key',
    key: 'OPENAI_API_KEY',
    description: 'API key for OpenAI (Whisper transcription)',
    link: 'https://platform.openai.com/api-keys',
    required: true,
    validate: (value) => value && value.startsWith('sk-'),
  },
  {
    name: 'Google OAuth Client ID',
    key: 'GOOGLE_CLIENT_ID',
    description: 'OAuth Client ID for Google services',
    link: 'https://console.cloud.google.com/apis/credentials',
    required: true,
  },
  {
    name: 'Google OAuth Client Secret',
    key: 'GOOGLE_CLIENT_SECRET',
    description: 'OAuth Client Secret for Google services',
    link: 'https://console.cloud.google.com/apis/credentials',
    required: true,
  },
  {
    name: 'Google Sheet ID',
    key: 'GOOGLE_SHEET_ID',
    description: 'ID of Google Sheet for logging (from URL)',
    required: true,
  },
  {
    name: 'YouTube API Key',
    key: 'YOUTUBE_API_KEY',
    description: 'API key for YouTube Data API v3',
    link: 'https://console.cloud.google.com/apis/credentials',
    required: false,
  },
  {
    name: 'Tavily API Key',
    key: 'TAVILY_API_KEY',
    description: 'API key for Tavily Search',
    link: 'https://tavily.com/#api',
    required: false,
  },
  {
    name: 'Perplexity API Key',
    key: 'PERPLEXITY_API_KEY',
    description: 'API key for Perplexity AI',
    link: 'https://www.perplexity.ai/settings/api',
    required: false,
  },
  {
    name: 'OpenWeatherMap API Key',
    key: 'OPENWEATHERMAP_API_KEY',
    description: 'API key for OpenWeatherMap',
    link: 'https://home.openweathermap.org/api_keys',
    required: false,
  },
];

async function displayWelcome() {
  console.clear();
  console.log('');
  log('═══════════════════════════════════════════════════', 'cyan');
  log('   🔐 n8n Agent Swarm Credentials Setup', 'bright');
  log('═══════════════════════════════════════════════════', 'cyan');
  console.log('');
  log('This tool will help you configure all required API keys.', 'blue');
  log('You can skip optional credentials by pressing Enter.', 'blue');
  console.log('');
}

async function configureCredential(cred) {
  console.log('');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`📝 ${cred.name}`, 'bright');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`Description: ${cred.description}`, 'blue');

  if (cred.link) {
    log(`Get it here: ${cred.link}`, 'yellow');
  }

  if (cred.required) {
    log('Status: REQUIRED', 'red');
  } else {
    log('Status: Optional (can skip)', 'yellow');
  }

  console.log('');

  let value = await question(`Enter ${cred.name}: `);

  // Validate if validator provided
  if (value && cred.validate) {
    while (!cred.validate(value)) {
      log('❌ Invalid format. Please try again.', 'red');
      value = await question(`Enter ${cred.name}: `);
    }
  }

  // Check if required but empty
  if (cred.required && !value) {
    log('❌ This credential is required!', 'red');
    return await configureCredential(cred); // Ask again
  }

  if (value) {
    log(`✅ ${cred.name} configured`, 'green');
  } else {
    log(`⏭️  Skipped ${cred.name}`, 'yellow');
  }

  return value;
}

async function saveToEnvFile(config) {
  const envPath = path.join(__dirname, '../.env');

  log('\n💾 Saving configuration...', 'blue');

  let envContent = '';

  // Add header
  envContent += '# n8n Agent Swarm Configuration\n';
  envContent += `# Generated on ${new Date().toISOString()}\n\n`;

  // n8n Configuration
  envContent += '# n8n Configuration\n';
  envContent += 'N8N_HOST=localhost\n';
  envContent += 'N8N_PORT=5678\n';
  envContent += 'N8N_PROTOCOL=http\n';
  envContent += 'N8N_USER=admin\n';
  envContent += 'N8N_PASSWORD=changeme\n';
  envContent += 'POSTGRES_PASSWORD=n8n_postgres_password\n\n';

  // API Keys
  envContent += '# API Keys\n';
  for (const [key, value] of Object.entries(config)) {
    if (value) {
      envContent += `${key}=${value}\n`;
    } else {
      envContent += `# ${key}=\n`;
    }
  }

  try {
    fs.writeFileSync(envPath, envContent);
    log('✅ Configuration saved to .env', 'green');
    return true;
  } catch (error) {
    log(`❌ Error saving .env file: ${error.message}`, 'red');
    return false;
  }
}

async function validateCredentials(config) {
  console.log('');
  log('🔍 Validating credentials...', 'blue');
  console.log('');

  let allValid = true;

  // Check Telegram Bot Token
  if (config.TELEGRAM_BOT_TOKEN) {
    log('✅ Telegram Bot Token: Present', 'green');
  } else {
    log('❌ Telegram Bot Token: Missing (REQUIRED)', 'red');
    allValid = false;
  }

  // Check OpenRouter
  if (config.OPENROUTER_API_KEY) {
    log('✅ OpenRouter API Key: Present', 'green');
  } else {
    log('❌ OpenRouter API Key: Missing (REQUIRED)', 'red');
    allValid = false;
  }

  // Check OpenAI
  if (config.OPENAI_API_KEY) {
    log('✅ OpenAI API Key: Present', 'green');
  } else {
    log('❌ OpenAI API Key: Missing (REQUIRED)', 'red');
    allValid = false;
  }

  // Check Google OAuth
  if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
    log('✅ Google OAuth: Configured', 'green');
  } else {
    log('❌ Google OAuth: Incomplete (REQUIRED)', 'red');
    allValid = false;
  }

  // Check Google Sheet
  if (config.GOOGLE_SHEET_ID) {
    log('✅ Google Sheet ID: Present', 'green');
  } else {
    log('❌ Google Sheet ID: Missing (REQUIRED)', 'red');
    allValid = false;
  }

  // Optional credentials
  const optionalCreds = [
    'YOUTUBE_API_KEY',
    'TAVILY_API_KEY',
    'PERPLEXITY_API_KEY',
    'OPENWEATHERMAP_API_KEY'
  ];

  console.log('');
  log('Optional Credentials:', 'yellow');
  for (const key of optionalCreds) {
    if (config[key]) {
      log(`✅ ${key}: Present`, 'green');
    } else {
      log(`⏭️  ${key}: Skipped`, 'yellow');
    }
  }

  console.log('');
  return allValid;
}

async function displaySummary(allValid) {
  console.log('');
  log('═══════════════════════════════════════════════════', 'cyan');
  log('   📋 Configuration Summary', 'bright');
  log('═══════════════════════════════════════════════════', 'cyan');
  console.log('');

  if (allValid) {
    log('✅ All required credentials configured!', 'green');
    console.log('');
    log('Next steps:', 'blue');
    console.log('1. Run: ./scripts/setup.sh (or docker-compose up)');
    console.log('2. Open n8n: http://localhost:5678');
    console.log('3. Import credentials in n8n UI');
    console.log('4. Activate the workflow');
    console.log('5. Test with your Telegram bot');
  } else {
    log('❌ Some required credentials are missing!', 'red');
    console.log('');
    log('Please run this script again or edit .env file manually.', 'yellow');
  }

  console.log('');
  log('📚 For detailed instructions, see: docs/INSTALLATION.md', 'blue');
  console.log('');
}

async function main() {
  await displayWelcome();

  const config = {};

  // Configure each credential
  for (const cred of credentials) {
    const value = await configureCredential(cred);
    config[cred.key] = value;
  }

  // Save to .env file
  const saved = await saveToEnvFile(config);

  if (!saved) {
    log('❌ Failed to save configuration', 'red');
    rl.close();
    process.exit(1);
  }

  // Validate
  const allValid = await validateCredentials(config);

  // Display summary
  await displaySummary(allValid);

  rl.close();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { configureCredential, saveToEnvFile };
