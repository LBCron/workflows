#!/usr/bin/env node

/**
 * Analyze code for optimization opportunities
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ANALYSE D\'OPTIMISATION DU PROJET\n');

const issues = [];
const recommendations = [];

// 1. Check if optimization system exists
console.log('1️⃣ Vérification système d\'optimisation...');

// Check for agent-optimizer.js
if (fs.existsSync('scripts/core/agent-optimizer.js')) {
  console.log('   ✅ Agent Optimizer trouvé (Mega Cache + Budget Guardian automatique)');
  recommendations.push('✅ Système d\'optimisation automatique actif!');
} else {
  // Fallback: check individual agents
  const agentFiles = [
    'scripts/agents/research-agent-pro.js',
    'scripts/agents/content-creator-pro.js',
    'scripts/agents/code-assistant-pro.js',
    'scripts/agents/email-agent-pro.js',
    'scripts/agents/calendar-agent-pro.js',
    'scripts/agents/meta-agent.js'
  ];

  let cacheMissing = 0;
  agentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('mega-cache') && !content.includes('megaCache')) {
      issues.push(`❌ ${file}: N'utilise pas Mega Cache`);
      cacheMissing++;
    }
  });

  if (cacheMissing > 0) {
    console.log(`   ⚠️  ${cacheMissing} agents sans Mega Cache`);
  } else {
    console.log('   ✅ Tous les agents utilisent Mega Cache');
  }
}

// 2. Check logging system
console.log('\n2️⃣ Vérification système de logging...');
if (fs.existsSync('scripts/core/logger.js')) {
  console.log('   ✅ Logger professionnel trouvé');
  recommendations.push('✅ Système de logging professionnel actif!');
} else {
  issues.push('❌ Pas de système de logging professionnel');
  console.log('   ❌ Pas de logger professionnel');
}

// 3. Check error handling
console.log('\n3️⃣ Vérification gestion des erreurs...');
let noTryCatch = 0;
agentFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const asyncFunctions = content.match(/async\s+\w+\s*\(/g) || [];
  const tryCatchBlocks = content.match(/try\s*{/g) || [];
  
  if (asyncFunctions.length > tryCatchBlocks.length) {
    issues.push(`⚠️  ${file}: ${asyncFunctions.length} async functions, ${tryCatchBlocks.length} try/catch`);
    noTryCatch++;
  }
});

if (noTryCatch > 0) {
  console.log(`   ⚠️  ${noTryCatch} agents avec gestion erreurs insuffisante`);
} else {
  console.log('   ✅ Gestion des erreurs OK');
}

// 4. Check for duplicate code
console.log('\n4️⃣ Recherche de code dupliqué...');
const codePatterns = {};
agentFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Check for common patterns
  if (content.includes('new OpenAI(')) {
    codePatterns['OpenAI initialization'] = (codePatterns['OpenAI initialization'] || 0) + 1;
  }
  if (content.includes('new Anthropic(')) {
    codePatterns['Anthropic initialization'] = (codePatterns['Anthropic initialization'] || 0) + 1;
  }
});

Object.entries(codePatterns).forEach(([pattern, count]) => {
  if (count > 1) {
    recommendations.push(`💡 ${pattern} dupliqué ${count} fois - Factoriser?`);
  }
});

// 5. Check telegram-bot.js structure
console.log('\n5️⃣ Vérification telegram-bot.js...');
const botContent = fs.readFileSync('scripts/telegram-bot.js', 'utf8');

if (!botContent.includes('try') || !botContent.includes('catch')) {
  issues.push('❌ telegram-bot.js: Gestion erreurs insuffisante');
}

if (botContent.split('\n').length > 500) {
  recommendations.push('💡 telegram-bot.js trop long (>500 lignes) - Refactoriser?');
  console.log(`   ⚠️  telegram-bot.js: ${botContent.split('\n').length} lignes`);
} else {
  console.log('   ✅ Taille OK');
}

// 6. Check for console.log in production code
console.log('\n6️⃣ Vérification logs de debug...');
let debugLogs = 0;
agentFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const logs = content.match(/console\.log/g) || [];
  debugLogs += logs.length;
});

if (debugLogs > 10) {
  recommendations.push(`💡 ${debugLogs} console.log trouvés - Utiliser un logger?`);
  console.log(`   ⚠️  ${debugLogs} console.log trouvés`);
} else {
  console.log('   ✅ Logging OK');
}

// 7. Check for environment variables validation
console.log('\n7️⃣ Vérification validation .env...');
const envContent = fs.readFileSync('.env.example', 'utf8');
const envVars = envContent.match(/^[A-Z_]+=/gm) || [];

console.log(`   ℹ️  ${envVars.length} variables d'environnement`);

// 8. Check for TypeScript
console.log('\n8️⃣ Vérification TypeScript...');
if (!fs.existsSync('tsconfig.json')) {
  recommendations.push('💡 Pas de TypeScript - Ajouter pour meilleure sécurité type?');
  console.log('   ⚠️  Pas de TypeScript');
} else {
  console.log('   ✅ TypeScript configuré');
}

// 9. Check for tests
console.log('\n9️⃣ Vérification couverture tests...');
const testFiles = [
  'scripts/test-core-agents.js',
  'scripts/bug-detector.js'
];

let totalTests = 0;
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    totalTests++;
  }
});

console.log(`   ℹ️  ${totalTests} fichiers de test`);
if (totalTests < 3) {
  recommendations.push('💡 Ajouter plus de tests unitaires et d\'intégration');
}

// 10. Check package.json scripts
console.log('\n🔟 Vérification scripts npm...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const scripts = Object.keys(packageJson.scripts || {});

console.log(`   ℹ️  ${scripts.length} scripts npm`);

if (!scripts.includes('test')) {
  recommendations.push('💡 Ajouter script "test" dans package.json');
}
if (!scripts.includes('lint')) {
  recommendations.push('💡 Ajouter script "lint" (ESLint)');
}

// RAPPORT FINAL
console.log('\n' + '═'.repeat(70));
console.log('📊 RAPPORT D\'OPTIMISATION\n');

console.log(`🐛 PROBLÈMES CRITIQUES: ${issues.filter(i => i.startsWith('❌')).length}`);
issues.filter(i => i.startsWith('❌')).forEach(i => console.log(i));

console.log(`\n⚠️  AVERTISSEMENTS: ${issues.filter(i => i.startsWith('⚠️')).length}`);
issues.filter(i => i.startsWith('⚠️')).forEach(i => console.log(i));

console.log(`\n💡 RECOMMANDATIONS: ${recommendations.length}`);
recommendations.forEach(r => console.log(r));

console.log('\n' + '═'.repeat(70));

// Score
const critical = issues.filter(i => i.startsWith('❌')).length;
const warnings = issues.filter(i => i.startsWith('⚠️')).length;
const score = Math.max(0, 100 - (critical * 10) - (warnings * 5));

console.log(`\n📈 SCORE D'OPTIMISATION: ${score}/100`);

if (score >= 90) {
  console.log('🎉 Excellent! Projet très bien optimisé\n');
} else if (score >= 70) {
  console.log('👍 Bon! Quelques optimisations possibles\n');
} else if (score >= 50) {
  console.log('⚠️  Moyen. Plusieurs optimisations recommandées\n');
} else {
  console.log('❌ Attention! Optimisations critiques nécessaires\n');
}

process.exit(0);
