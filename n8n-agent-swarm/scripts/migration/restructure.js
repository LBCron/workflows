#!/usr/bin/env node

/**
 * Migration Script - Restructure project to best practices
 *
 * Creates new src/ structure while keeping old structure working
 * Provides compatibility layer during transition
 */

const fs = require('fs');
const path = require('path');

console.log('🏗️  RESTRUCTURATION DU PROJET\n');

// New structure to create
const newStructure = {
  'src': {
    'agents': {
      'base': {},
      'research': {},
      'content': {},
      'code': {},
      'email': {},
      'calendar': {},
      'meta': {}
    },
    'bot': {
      'handlers': {},
      'commands': {},
      'middlewares': {},
      'utils': {}
    },
    'core': {
      'router': {},
      'cache': {},
      'budget': {},
      'logger': {},
      'optimizer': {}
    },
    'services': {
      'llm': {},
      'gmail': {},
      'calendar': {},
      'storage': {}
    },
    'config': {},
    'utils': {},
    'types': {}
  },
  'tests': {
    'unit': {
      'agents': {},
      'core': {},
      'services': {}
    },
    'integration': {},
    'e2e': {},
    'fixtures': {},
    'helpers': {}
  },
  'docs': {
    'api': {},
    'architecture': {},
    'guides': {}
  },
  'config': {}
};

// Create directory structure
function createStructure(structure, basePath = '.') {
  Object.entries(structure).forEach(([dir, children]) => {
    const dirPath = path.join(basePath, dir);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Créé: ${dirPath}`);
    } else {
      console.log(`ℹ️  Existe déjà: ${dirPath}`);
    }

    if (Object.keys(children).length > 0) {
      createStructure(children, dirPath);
    } else {
      // Create .gitkeep for empty directories
      const gitkeepPath = path.join(dirPath, '.gitkeep');
      if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, '');
      }
    }
  });
}

// Step 1: Create new structure
console.log('1️⃣ Création de la nouvelle structure...\n');
createStructure(newStructure);

console.log('\n2️⃣ Création des fichiers d\'index...\n');

// Create index files
const indexFiles = {
  'src/index.js': `/**
 * Main Entry Point
 */

require('dotenv').config();
const logger = require('./core/logger/logger');
const bot = require('./bot');

async function main() {
  try {
    logger.info('🚀 Démarrage du système AI Agent Swarm...');
    await bot.start();
    logger.info('✅ Système démarré avec succès');
  } catch (error) {
    logger.error('Erreur fatale au démarrage', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
`,

  'src/agents/index.js': `/**
 * Agent Factory
 */

const logger = require('../core/logger/logger');

class AgentFactory {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.agents = new Map();
  }

  create(type, options = {}) {
    if (this.agents.has(type)) {
      return this.agents.get(type);
    }

    const agentModules = {
      research: './research/research.agent',
      content: './content/content.agent',
      code: './code/code.agent',
      email: './email/email.agent',
      calendar: './calendar/calendar.agent',
      meta: './meta/meta.agent'
    };

    const modulePath = agentModules[type];
    if (!modulePath) {
      throw new Error(\`Agent type '\${type}' inconnu\`);
    }

    try {
      const AgentClass = require(modulePath);
      const agent = new AgentClass({ ...this.dependencies, ...options });
      this.agents.set(type, agent);
      logger.info(\`Agent '\${type}' créé et mis en cache\`);
      return agent;
    } catch (error) {
      logger.error(\`Erreur création agent '\${type}'\`, error);
      throw error;
    }
  }

  get(type) {
    return this.agents.get(type);
  }

  getAll() {
    return Array.from(this.agents.values());
  }
}

module.exports = AgentFactory;
`,

  'src/core/index.js': `/**
 * Core Systems Export
 */

module.exports = {
  router: require('./router/router'),
  cache: require('./cache/cache'),
  budget: require('./budget/budget.guardian'),
  logger: require('./logger/logger'),
  optimizer: require('./optimizer/optimizer')
};
`,

  'src/services/index.js': `/**
 * Services Export
 */

module.exports = {
  llm: require('./llm/llm.factory'),
  gmail: require('./gmail/gmail.service'),
  calendar: require('./calendar/calendar.service'),
  storage: require('./storage/storage.service')
};
`,

  'src/config/index.js': `/**
 * Configuration Loader
 */

const path = require('path');
const fs = require('fs');

const env = process.env.NODE_ENV || 'development';

// Load environment config
let envConfig = {};
const configPath = path.join(__dirname, '../../config', \`\${env}.json\`);
if (fs.existsSync(configPath)) {
  envConfig = require(configPath);
}

// Merge with environment variables
const config = {
  env,
  port: process.env.PORT || 3000,
  logLevel: process.env.LOG_LEVEL || 'info',

  // Telegram
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    webhook: process.env.TELEGRAM_WEBHOOK_URL
  },

  // LLM APIs
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY
  },

  // Budget
  budget: {
    monthlyLimit: parseFloat(process.env.MONTHLY_BUDGET_LIMIT || '10'),
    alertThresholds: [0.75, 0.90, 0.95]
  },

  // Cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000')
  },

  // Override with env config
  ...envConfig
};

// Validate required config
function validate() {
  const required = ['telegram.token'];

  required.forEach(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    if (!value) {
      throw new Error(\`Configuration manquante: \${key}\`);
    }
  });
}

module.exports = { config, validate };
`
};

// Write index files
Object.entries(indexFiles).forEach(([filePath, content]) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Créé: ${filePath}`);
  }
});

// Create migration mapping file
console.log('\n3️⃣ Création du fichier de mapping...\n');

const mappingContent = `/**
 * Migration Mapping - Old → New structure
 *
 * This file maps old paths to new paths for gradual migration
 */

module.exports = {
  // Agents
  'scripts/agents/research-agent-pro.js': 'src/agents/research/research.agent.js',
  'scripts/agents/content-creator-pro.js': 'src/agents/content/content.agent.js',
  'scripts/agents/code-assistant-pro.js': 'src/agents/code/code.agent.js',
  'scripts/agents/email-agent-pro.js': 'src/agents/email/email.agent.js',
  'scripts/agents/calendar-agent-pro.js': 'src/agents/calendar/calendar.agent.js',
  'scripts/agents/meta-agent.js': 'src/agents/meta/meta.agent.js',

  // Core
  'scripts/ai-core/intelligent-router-pro.js': 'src/core/router/router.js',
  'scripts/ai-core/llm-clients.js': 'src/services/llm/llm.factory.js',
  'scripts/monitoring/budget-guardian.js': 'src/core/budget/budget.guardian.js',
  'scripts/optimization/mega-cache.js': 'src/core/cache/cache.js',
  'scripts/core/logger.js': 'src/core/logger/logger.js',
  'scripts/core/agent-optimizer.js': 'src/core/optimizer/optimizer.js',
  'scripts/core/optimized-agents.js': 'src/agents/index.js',

  // Config
  'scripts/config/agents-registry.json': 'src/config/agents.config.json',

  // Templates
  'scripts/templates/agent-template.js': 'src/agents/base/agent.base.js',

  // Bot
  'scripts/telegram-bot.js': 'src/bot/index.js'
};
`;

fs.writeFileSync('scripts/migration/mapping.js', mappingContent);
console.log('✅ Créé: scripts/migration/mapping.js');

console.log('\n✅ Structure de base créée!\n');
console.log('📝 Prochaines étapes:');
console.log('  1. Copier/adapter les fichiers depuis scripts/ vers src/');
console.log('  2. Refactoriser telegram-bot.js en modules');
console.log('  3. Créer tests/');
console.log('  4. Organiser docs/');
console.log('  5. Tester la nouvelle structure');
console.log('  6. Supprimer ancienne structure');
