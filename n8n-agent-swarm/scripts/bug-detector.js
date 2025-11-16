#!/usr/bin/env node

/**
 * Bug Detector - Trouve et identifie tous les bugs du système
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DÉTECTION DE BUGS - SYSTÈME AI AGENT SWARM\n');

const bugs = [];
const warnings = [];

// Test 1: Vérifier que tous les fichiers requis existent
console.log('1️⃣ Vérification fichiers requis...');

const requiredFiles = [
  'scripts/telegram-bot.js',
  'scripts/agents/research-agent-pro.js',
  'scripts/agents/content-creator-pro.js',
  'scripts/agents/code-assistant-pro.js',
  'scripts/agents/email-agent-pro.js',
  'scripts/agents/calendar-agent-pro.js',
  'scripts/agents/meta-agent.js',
  'scripts/ai-core/intelligent-router-pro.js',
  'scripts/ai-core/llm-clients.js',
  'scripts/monitoring/budget-guardian.js',
  'scripts/optimization/mega-cache.js',
  'scripts/config/agents-registry.json',
  'scripts/templates/agent-template.js'
];

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) {
    bugs.push(`❌ Fichier manquant: ${file}`);
  } else {
    console.log(`   ✅ ${file}`);
  }
});

// Test 2: Vérifier les imports
console.log('\n2️⃣ Vérification imports...');

try {
  require('./telegram-bot.js');
  bugs.push('❌ telegram-bot.js ne devrait pas s\'exécuter lors du require (polling démarré)');
} catch (error) {
  if (error.message.includes('TELEGRAM_BOT_TOKEN')) {
    console.log('   ✅ telegram-bot.js requiert TELEGRAM_BOT_TOKEN (normal)');
  } else {
    bugs.push(`❌ Erreur import telegram-bot.js: ${error.message}`);
  }
}

// Test 3: Vérifier les agents un par un
console.log('\n3️⃣ Vérification agents...');

const agentsToTest = [
  { file: './agents/research-agent-pro.js', name: 'Research Agent' },
  { file: './agents/content-creator-pro.js', name: 'Content Creator' },
  { file: './agents/code-assistant-pro.js', name: 'Code Assistant' },
  { file: './agents/meta-agent.js', name: 'Meta Agent' }
];

agentsToTest.forEach(({ file, name }) => {
  try {
    const agent = require(file);
    if (!agent || typeof agent !== 'object') {
      bugs.push(`❌ ${name}: N'exporte pas un objet`);
    } else {
      console.log(`   ✅ ${name} chargé`);
    }
  } catch (error) {
    bugs.push(`❌ ${name}: ${error.message}`);
  }
});

// Test 4: Vérifier Email Agent (peut échouer sans credentials)
console.log('\n4️⃣ Vérification Email Agent...');
try {
  const EmailAgent = require('./agents/email-agent-pro');
  if (EmailAgent && typeof EmailAgent === 'object') {
    console.log('   ✅ Email Agent chargé');

    // Vérifier méthodes
    const methods = ['summarizeUnread', 'generateReply', 'composeEmail', 'readGmail', 'sendGmail'];
    methods.forEach(method => {
      if (typeof EmailAgent[method] !== 'function') {
        bugs.push(`❌ Email Agent: Méthode ${method} manquante`);
      }
    });
  }
} catch (error) {
  bugs.push(`❌ Email Agent: ${error.message}`);
}

// Test 5: Vérifier Calendar Agent
console.log('\n5️⃣ Vérification Calendar Agent...');
try {
  const CalendarAgent = require('./agents/calendar-agent-pro');
  if (CalendarAgent && typeof CalendarAgent === 'object') {
    console.log('   ✅ Calendar Agent chargé');

    const methods = ['todayAgenda', 'weekAgenda', 'smartSchedule', 'listEvents', 'createEvent'];
    methods.forEach(method => {
      if (typeof CalendarAgent[method] !== 'function') {
        bugs.push(`❌ Calendar Agent: Méthode ${method} manquante`);
      }
    });
  }
} catch (error) {
  bugs.push(`❌ Calendar Agent: ${error.message}`);
}

// Test 6: Vérifier Router
console.log('\n6️⃣ Vérification Intelligent Router...');
try {
  const router = require('./ai-core/intelligent-router-pro');
  if (!router || typeof router.route !== 'function') {
    bugs.push('❌ Router: Pas de méthode route()');
  } else {
    console.log('   ✅ Intelligent Router OK');
  }
} catch (error) {
  bugs.push(`❌ Router: ${error.message}`);
}

// Test 7: Vérifier Budget Guardian
console.log('\n7️⃣ Vérification Budget Guardian...');
try {
  const BudgetGuardian = require('./monitoring/budget-guardian');
  if (!BudgetGuardian) {
    bugs.push('❌ Budget Guardian: Export invalide');
  } else {
    console.log('   ✅ Budget Guardian OK');
  }
} catch (error) {
  bugs.push(`❌ Budget Guardian: ${error.message}`);
}

// Test 8: Vérifier Mega Cache
console.log('\n8️⃣ Vérification Mega Cache...');
try {
  const megaCache = require('./optimization/mega-cache');
  if (!megaCache || typeof megaCache.get !== 'function') {
    bugs.push('❌ Mega Cache: Pas de méthode get()');
  } else {
    console.log('   ✅ Mega Cache OK');
  }
} catch (error) {
  bugs.push(`❌ Mega Cache: ${error.message}`);
}

// Test 9: Vérifier registre agents
console.log('\n9️⃣ Vérification registre agents...');
try {
  const registryPath = path.join(__dirname, './config/agents-registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

  const expectedAgents = [
    'research-agent-pro',
    'content-creator-pro',
    'code-assistant-pro',
    'email-agent-pro',
    'calendar-agent-pro',
    'meta-agent'
  ];

  expectedAgents.forEach(agent => {
    if (!registry[agent]) {
      warnings.push(`⚠️  Agent ${agent} pas dans le registre`);
    }
  });

  console.log(`   ✅ Registre OK (${Object.keys(registry).length} agents)`);
} catch (error) {
  bugs.push(`❌ Registre: ${error.message}`);
}

// Test 10: Vérifier .env.example
console.log('\n🔟 Vérification .env.example...');
try {
  const envExample = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf8');

  const requiredVars = [
    'TELEGRAM_BOT_TOKEN',
    'OPENAI_API_KEY',
    'GMAIL_CLIENT_ID',
    'GOOGLE_CLIENT_ID',
    'MONTHLY_BUDGET_LIMIT'
  ];

  requiredVars.forEach(varName => {
    if (!envExample.includes(varName)) {
      warnings.push(`⚠️  Variable ${varName} manquante dans .env.example`);
    }
  });

  console.log('   ✅ .env.example OK');
} catch (error) {
  bugs.push(`❌ .env.example: ${error.message}`);
}

// RAPPORT FINAL
console.log('\n' + '═'.repeat(60));
console.log('📊 RAPPORT FINAL\n');

if (bugs.length === 0 && warnings.length === 0) {
  console.log('🎉 AUCUN BUG DÉTECTÉ!');
  console.log('✅ Le système est en parfait état!\n');
  process.exit(0);
}

if (bugs.length > 0) {
  console.log(`🐛 BUGS TROUVÉS (${bugs.length}):\n`);
  bugs.forEach(bug => console.log(bug));
  console.log('');
}

if (warnings.length > 0) {
  console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
  warnings.forEach(warning => console.log(warning));
  console.log('');
}

console.log('═'.repeat(60));
console.log(`\n📊 Score: ${bugs.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Bugs: ${bugs.length}`);
console.log(`Warnings: ${warnings.length}\n`);

process.exit(bugs.length > 0 ? 1 : 0);
