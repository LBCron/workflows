#!/usr/bin/env node

/**
 * Analyze project structure and suggest improvements
 */

const fs = require('fs');
const path = require('path');

console.log('🏗️  ANALYSE DE LA STRUCTURE DU PROJET\n');

const issues = [];
const improvements = [];
const stats = {
  totalFiles: 0,
  totalDirs: 0,
  codeFiles: 0,
  scriptFiles: 0,
  configFiles: 0,
  docFiles: 0
};

// Analyze current structure
console.log('1️⃣ Structure actuelle...\n');

function analyzeDirectory(dir, level = 0) {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  const indent = '  '.repeat(level);
  
  items.forEach(item => {
    if (item.startsWith('.') || item === 'node_modules') return;
    
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      stats.totalDirs++;
      console.log(`${indent}📁 ${item}/`);
      if (level < 2) {
        analyzeDirectory(fullPath, level + 1);
      }
    } else {
      stats.totalFiles++;
      const ext = path.extname(item);
      
      if (ext === '.js') {
        const size = stat.size;
        const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
        
        if (item.endsWith('-bot.js') || item.startsWith('telegram')) {
          console.log(`${indent}📱 ${item} (${lines} lignes)`);
          if (lines > 300) {
            issues.push(`⚠️  ${item} trop long (${lines} lignes) - devrait être refactorisé`);
          }
        } else if (item.endsWith('-agent.js') || item.includes('agent')) {
          console.log(`${indent}🤖 ${item}`);
          stats.codeFiles++;
        } else if (item.endsWith('-pro.js') || item.endsWith('router.js')) {
          console.log(`${indent}⚙️  ${item}`);
          stats.codeFiles++;
        } else {
          console.log(`${indent}📄 ${item}`);
          stats.scriptFiles++;
        }
      } else if (ext === '.json') {
        console.log(`${indent}⚙️  ${item}`);
        stats.configFiles++;
      } else if (ext === '.md') {
        console.log(`${indent}📖 ${item}`);
        stats.docFiles++;
      }
    }
  });
}

analyzeDirectory('scripts');

// Check structure issues
console.log('\n2️⃣ Problèmes de structure identifiés...\n');

// Issue 1: Everything in "scripts/"
if (fs.existsSync('scripts/agents')) {
  issues.push('❌ Code source dans scripts/ - devrait être dans src/');
  improvements.push('💡 Déplacer agents/ vers src/agents/');
}

if (fs.existsSync('scripts/ai-core')) {
  improvements.push('💡 Déplacer ai-core/ vers src/core/');
}

// Issue 2: No src/ directory
if (!fs.existsSync('src/')) {
  issues.push('❌ Pas de dossier src/ - structure non standard');
  improvements.push('💡 Créer structure src/ selon Node.js best practices');
}

// Issue 3: Documentation scattered
const docFiles = fs.readdirSync('.').filter(f => f.endsWith('.md'));
if (docFiles.length > 5) {
  issues.push(`⚠️  ${docFiles.length} fichiers MD à la racine - devrait être organisé`);
  improvements.push('💡 Créer docs/ et organiser la documentation');
}

// Issue 4: Tests structure
if (!fs.existsSync('tests/') || !fs.existsSync('test/')) {
  issues.push('❌ Pas de dossier tests/ dédié');
  improvements.push('💡 Créer tests/ avec unit/, integration/, e2e/');
}

// Issue 5: Config files
const configFiles = ['.env', '.env.example', 'config.json'];
let configCount = 0;
configFiles.forEach(f => {
  if (fs.existsSync(f)) configCount++;
});
if (configCount < 2) {
  improvements.push('💡 Créer système de configuration centralisé');
}

// Issue 6: telegram-bot.js size
if (fs.existsSync('scripts/telegram-bot.js')) {
  const content = fs.readFileSync('scripts/telegram-bot.js', 'utf8');
  const lines = content.split('\n').length;
  if (lines > 400) {
    issues.push(`❌ telegram-bot.js trop long (${lines} lignes)`);
    improvements.push('💡 Refactoriser telegram-bot.js en modules (bot/, handlers/, commands/)');
  }
}

// Issue 7: No separation of concerns
improvements.push('💡 Séparer concerns: services/, utils/, middlewares/');
improvements.push('💡 Créer factory pattern pour agents');
improvements.push('💡 Créer dependency injection container');

// Display issues
console.log(`❌ PROBLÈMES (${issues.length}):\n`);
issues.forEach(i => console.log(`  ${i}`));

console.log(`\n💡 AMÉLIORATIONS SUGGÉRÉES (${improvements.length}):\n`);
improvements.forEach(i => console.log(`  ${i}`));

// Proposed structure
console.log('\n3️⃣ STRUCTURE PROPOSÉE (Best Practices)...\n');

const proposedStructure = `
project/
├── src/                          # Source code
│   ├── agents/                   # All agents
│   │   ├── research/
│   │   ├── content/
│   │   ├── code/
│   │   ├── email/
│   │   ├── calendar/
│   │   └── meta/
│   ├── bot/                      # Telegram bot
│   │   ├── index.js             # Main bot
│   │   ├── handlers/            # Message handlers
│   │   ├── commands/            # Slash commands
│   │   └── middlewares/         # Bot middlewares
│   ├── core/                     # Core systems
│   │   ├── router/              # AI Router
│   │   ├── cache/               # Mega Cache
│   │   ├── budget/              # Budget Guardian
│   │   ├── logger/              # Logger
│   │   └── optimizer/           # Agent Optimizer
│   ├── services/                 # External services
│   │   ├── gmail/
│   │   ├── calendar/
│   │   └── llm/                 # LLM clients
│   ├── config/                   # Configuration
│   │   ├── index.js             # Config loader
│   │   ├── agents.js
│   │   └── models.js
│   └── utils/                    # Utilities
│       ├── validation.js
│       └── helpers.js
│
├── tests/                        # Tests
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
│
├── scripts/                      # Actual scripts (not source code!)
│   ├── setup/                    # Setup scripts
│   ├── migration/                # Migration scripts
│   └── analysis/                 # Analysis tools
│
├── docs/                         # Documentation
│   ├── api/                      # API docs
│   ├── architecture/             # Architecture docs
│   └── guides/                   # User guides
│
├── config/                       # Config files
│   ├── development.json
│   ├── production.json
│   └── test.json
│
├── logs/                         # Logs
└── .github/                      # GitHub configs
    └── workflows/                # CI/CD
`;

console.log(proposedStructure);

// Stats
console.log('\n4️⃣ STATISTIQUES...\n');
console.log(`📁 Dossiers: ${stats.totalDirs}`);
console.log(`📄 Fichiers totaux: ${stats.totalFiles}`);
console.log(`💻 Fichiers code: ${stats.codeFiles}`);
console.log(`🔧 Scripts: ${stats.scriptFiles}`);
console.log(`⚙️  Config: ${stats.configFiles}`);
console.log(`📖 Documentation: ${stats.docFiles}`);

console.log('\n═'.repeat(70));
console.log('\n🎯 SCORE DE STRUCTURE: ' + Math.max(0, 100 - issues.length * 10 - improvements.length * 2) + '/100\n');

