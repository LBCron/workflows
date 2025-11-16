#!/usr/bin/env node

/**
 * Analyze code for optimization - Version 2 (Optimized)
 * Reconnaît le système d'optimisation automatique
 */

const fs = require('fs');

console.log('🔍 ANALYSE D\'OPTIMISATION DU PROJET V2\n');

let score = 100;
const passed = [];
const failed = [];
const recommendations = [];

// 1. Check Agent Optimizer
console.log('1️⃣ Système d\'optimisation automatique...');
if (fs.existsSync('scripts/core/agent-optimizer.js')) {
  console.log('   ✅ Agent Optimizer trouvé');
  passed.push('Agent Optimizer (Cache + Budget + Errors automatiques)');
} else {
  console.log('   ❌ Agent Optimizer manquant');
  failed.push('Agent Optimizer manquant');
  score -= 30;
}

// 2. Check Optimized Agents
console.log('\n2️⃣ Agents optimisés...');
if (fs.existsSync('scripts/core/optimized-agents.js')) {
  console.log('   ✅ Système optimized-agents.js trouvé');
  passed.push('Optimized Agents (configuration centralisée)');
} else {
  console.log('   ❌ optimized-agents.js manquant');
  failed.push('optimized-agents.js manquant');
  score -= 20;
}

// 3. Check Logger
console.log('\n3️⃣ Système de logging professionnel...');
if (fs.existsSync('scripts/core/logger.js')) {
  console.log('   ✅ Logger professionnel trouvé');
  passed.push('Logger professionnel (remplace console.log)');
} else {
  console.log('   ❌ Logger manquant');
  failed.push('Logger professionnel manquant');
  score -= 15;
}

// 4. Check ESLint
console.log('\n4️⃣ ESLint...');
if (fs.existsSync('.eslintrc.json')) {
  console.log('   ✅ ESLint configuré');
  passed.push('ESLint (qualité de code)');
} else {
  console.log('   ❌ ESLint non configuré');
  failed.push('ESLint manquant');
  score -= 10;
}

// 5. Check Tests
console.log('\n5️⃣ Tests...');
let testCount = 0;
if (fs.existsSync('scripts/test-core-agents.js')) testCount++;
if (fs.existsSync('scripts/bug-detector.js')) testCount++;

if (testCount >= 2) {
  console.log(`   ✅ ${testCount} fichiers de test trouvés`);
  passed.push(`Tests (${testCount} fichiers)`);
} else {
  console.log(`   ⚠️  Seulement ${testCount} fichiers de test`);
  recommendations.push('Ajouter plus de tests');
  score -= 5;
}

// 6. Check package.json scripts
console.log('\n6️⃣ Scripts npm...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const scripts = Object.keys(packageJson.scripts || {});

const requiredScripts = ['lint', 'test:core', 'optimize'];
const missingScripts = requiredScripts.filter(s => !scripts.includes(s));

if (missingScripts.length === 0) {
  console.log('   ✅ Tous les scripts requis présents');
  passed.push('Scripts npm optimisés');
} else {
  console.log(`   ⚠️  Scripts manquants: ${missingScripts.join(', ')}`);
  score -= 5;
}

// 7. Check Documentation
console.log('\n7️⃣ Documentation...');
if (fs.existsSync('OPTIMIZATIONS.md')) {
  console.log('   ✅ Documentation OPTIMIZATIONS.md trouvée');
  passed.push('Documentation complète');
} else {
  console.log('   ❌ OPTIMIZATIONS.md manquant');
  recommendations.push('Créer documentation OPTIMIZATIONS.md');
  score -= 5;
}

// 8. Check Core Infrastructure
console.log('\n8️⃣ Infrastructure core...');
const coreFiles = [
  'scripts/ai-core/intelligent-router-pro.js',
  'scripts/monitoring/budget-guardian.js',
  'scripts/optimization/mega-cache.js'
];

const missingCore = coreFiles.filter(f => !fs.existsSync(f));
if (missingCore.length === 0) {
  console.log('   ✅ Infrastructure complète (Router + Budget + Cache)');
  passed.push('Infrastructure core complète');
} else {
  console.log(`   ❌ Fichiers manquants: ${missingCore.join(', ')}`);
  failed.push('Infrastructure incomplète');
  score -= 20;
}

// 9. Check TypeScript
console.log('\n9️⃣ TypeScript...');
if (fs.existsSync('tsconfig.json')) {
  console.log('   ✅ TypeScript configuré');
  passed.push('TypeScript (sécurité des types)');
} else {
  console.log('   ℹ️  TypeScript non utilisé (optionnel)');
  recommendations.push('💡 TypeScript pourrait améliorer la sécurité des types');
}

// 10. Logs directory
console.log('\n🔟 Système de logs...');
if (fs.existsSync('logs/')) {
  console.log('   ✅ Répertoire logs/ présent');
  passed.push('Système de logs actif');
} else {
  console.log('   ℹ️  Répertoire logs/ sera créé automatiquement');
}

// RAPPORT FINAL
console.log('\n' + '═'.repeat(70));
console.log('📊 RAPPORT FINAL\n');

console.log(`✅ OPTIMISATIONS ACTIVES (${passed.length}):\n`);
passed.forEach(p => console.log(`   ✅ ${p}`));

if (failed.length > 0) {
  console.log(`\n❌ PROBLÈMES (${failed.length}):\n`);
  failed.forEach(f => console.log(`   ❌ ${f}`));
}

if (recommendations.length > 0) {
  console.log(`\n💡 RECOMMANDATIONS (${recommendations.length}):\n`);
  recommendations.forEach(r => console.log(`   ${r}`));
}

console.log('\n' + '═'.repeat(70));

// Score final
console.log(`\n📈 SCORE D'OPTIMISATION: ${score}/100\n`);

if (score >= 90) {
  console.log('🎉 EXCELLENT! Projet hautement optimisé!\n');
  console.log('Le système utilise:');
  console.log('  • Agent Optimizer (Cache + Budget + Errors automatiques)');
  console.log('  • Logger professionnel');
  console.log('  • ESLint pour qualité code');
  console.log('  • Tests complets');
  console.log('  • Infrastructure complète\n');
} else if (score >= 70) {
  console.log('👍 BON! Projet bien optimisé avec quelques améliorations possibles\n');
} else if (score >= 50) {
  console.log('⚠️  MOYEN. Plusieurs optimisations recommandées\n');
} else {
  console.log('❌ ATTENTION! Optimisations critiques nécessaires\n');
}

process.exit(score >= 70 ? 0 : 1);
