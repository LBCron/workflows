#!/usr/bin/env node

/**
 * Test du système simplifié (GPT-4 Mini only)
 *
 * Tests complets:
 * - GPT-4 Mini Client
 * - Simple Router (cache + budget)
 * - Research Agent
 * - Content Creator
 * - Code Assistant
 */

const gpt4Mini = require('./simple-ai/gpt4-mini-client');
const router = require('./simple-ai/simple-router');
const research = require('./simple-ai/agents/research-agent');
const content = require('./simple-ai/agents/content-creator');
const code = require('./simple-ai/agents/code-assistant');
const budgetGuard = require('./monitoring/budget-guardian');
const cache = require('./optimization/mega-cache');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(title) {
  log('\n╔════════════════════════════════════════════════════════╗', 'magenta');
  log(`║  ${title.padEnd(52)}  ║`, 'magenta');
  log('╚════════════════════════════════════════════════════════╝', 'magenta');
}

function printSection(title) {
  log('\n' + '═'.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('═'.repeat(60), 'cyan');
}

async function testGPT4MiniClient() {
  printSection('Test 1/6: GPT-4 Mini Client');

  try {
    const result = await gpt4Mini.complete('Explain AI in one sentence', {
      temperature: 0.5,
      maxTokens: 50
    });

    log('✅ GPT-4 Mini Client OK', 'green');
    log(`   Response: ${result.content.substring(0, 80)}...`);
    log(`   Cost: €${result.cost.toFixed(6)}`);
    log(`   Tokens: ${result.tokens}`);
    log(`   Duration: ${result.duration}ms`);

    return { passed: true, cost: result.cost };
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    return { passed: false, cost: 0 };
  }
}

async function testRouter() {
  printSection('Test 2/6: Simple Router (Cache + Budget)');

  try {
    // Test 1: Cache miss
    log('\n  🔹 Test cache miss...');
    const result1 = await router.route('What is quantum computing?', {
      temperature: 0.7,
      maxTokens: 100,
      type: 'general'
    });

    log(`  ${result1.cached ? '❌ Should be cache miss' : '✅ Cache miss OK'}`,
        result1.cached ? 'red' : 'green');
    log(`     Cost: €${result1.cost.toFixed(6)}`);

    // Test 2: Cache hit
    log('\n  🔹 Test cache hit (same query)...');
    const result2 = await router.route('What is quantum computing?', {
      temperature: 0.7,
      maxTokens: 100,
      type: 'general'
    });

    log(`  ${result2.cached ? '✅ Cache hit OK' : '❌ Should be cache hit'}`,
        result2.cached ? 'green' : 'red');
    log(`     Cost: €${result2.cost.toFixed(6)} (should be 0)`);

    const passed = !result1.cached && result2.cached;
    log(`\n${passed ? '✅' : '❌'} Router ${passed ? 'OK' : 'FAILED'}`,
        passed ? 'green' : 'red');

    return { passed, cost: result1.cost };
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    return { passed: false, cost: 0 };
  }
}

async function testResearchAgent() {
  printSection('Test 3/6: Research Agent');

  try {
    const result = await research.research('GPT-4 Mini', 'quick');

    log('✅ Research Agent OK', 'green');
    log(`   Sources collectées: ${result.sourceCount}`);
    log(`   Synthèse: ${result.synthesis.substring(0, 150)}...`);
    log(`   Cost: €${result.cost.toFixed(6)}`);
    log(`   Cached: ${result.cached}`);
    log(`   Duration: ${result.duration}ms`);

    return { passed: true, cost: result.cost };
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    return { passed: false, cost: 0 };
  }
}

async function testContentCreator() {
  printSection('Test 4/6: Content Creator');

  try {
    const result = await content.create(
      'social-post',
      'Les avantages de GPT-4 Mini',
      {
        platform: 'LinkedIn',
        tone: 'professionnel'
      }
    );

    log('✅ Content Creator OK', 'green');
    log(`   Contenu: ${result.content.substring(0, 100)}...`);
    log(`   Mots: ${result.analysis.wordCount}`);
    log(`   SEO Score: ${result.analysis.seoScore}/100`);
    log(`   Engagement: ${result.analysis.engagementScore}/100`);
    log(`   Cost: €${result.cost.toFixed(6)}`);
    log(`   Cached: ${result.cached}`);

    return { passed: true, cost: result.cost };
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    return { passed: false, cost: 0 };
  }
}

async function testCodeAssistant() {
  printSection('Test 5/6: Code Assistant');

  try {
    const result = await code.assist('generate', {
      language: 'javascript',
      description: 'fonction qui inverse une chaîne de caractères'
    });

    log('✅ Code Assistant OK', 'green');
    log(`   Code généré: ${result.code.length} bloc(s)`);
    if (result.code[0]) {
      log(`   Aperçu: ${result.code[0].substring(0, 80)}...`);
    }
    log(`   Cost: €${result.cost.toFixed(6)}`);
    log(`   Cached: ${result.cached}`);
    log(`   Duration: ${result.duration}ms`);

    return { passed: true, cost: result.cost };
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    return { passed: false, cost: 0 };
  }
}

async function testCacheEfficiency() {
  printSection('Test 6/6: Cache Efficiency (Repeat Calls)');

  try {
    log('\n  Répétant 5 requêtes identiques pour tester le cache...\n');

    let cacheHitsCount = 0;
    const testQuery = 'Test query for cache efficiency';

    for (let i = 1; i <= 5; i++) {
      const result = await router.route(testQuery, {
        temperature: 0.7,
        maxTokens: 50,
        type: 'general'
      });

      if (result.cached) cacheHitsCount++;

      log(`  ${i}. ${result.cached ? '💚 CACHE HIT' : '💔 CACHE MISS'} - €${result.cost.toFixed(6)}`);
    }

    const cacheRate = (cacheHitsCount / 5) * 100;
    log(`\n  Cache efficiency: ${cacheHitsCount}/5 hits (${cacheRate}%)`);
    log(`  Expected: 4/5 hits (80%) - first call is miss, rest are hits`, 'yellow');

    const passed = cacheHitsCount >= 4;
    log(`\n${passed ? '✅' : '❌'} Cache Efficiency ${passed ? 'OK' : 'NEEDS IMPROVEMENT'}`,
        passed ? 'green' : 'yellow');

    return { passed, cacheHits: cacheHitsCount };
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    return { passed: false, cacheHits: 0 };
  }
}

async function printFinalStats() {
  printHeader('STATISTIQUES FINALES');

  // Router Stats
  printSection('Router');
  const routerStats = router.getStats();
  log(`  Requêtes totales: ${routerStats.totalRequests}`);
  log(`  Cache hits: ${routerStats.cacheHits}`);
  log(`  Cache misses: ${routerStats.cacheMisses}`);
  log(`  Taux de cache: ${routerStats.cacheRateFormatted}`, 'cyan');
  log(`  Coût total: ${routerStats.totalCostFormatted}`, 'cyan');
  log(`  Durée moyenne: ${routerStats.avgDuration}ms`);

  // GPT-4 Mini Stats
  printSection('GPT-4 Mini');
  const gptStats = gpt4Mini.getStats();
  log(`  Appels: ${gptStats.calls}`);
  log(`  Coût total: ${gptStats.costFormatted}`, 'cyan');
  log(`  Coût moyen/appel: ${gptStats.avgCostPerCallFormatted}`, 'cyan');
  log(`  Tokens totaux: ${gptStats.tokens}`);
  log(`    - Input: ${gptStats.inputTokens}`);
  log(`    - Output: ${gptStats.outputTokens}`);

  // Research Agent Stats
  printSection('Research Agent');
  const researchStats = research.getStats();
  log(`  Recherches: ${researchStats.queries}`);
  log(`  Coût total: ${researchStats.totalCostFormatted}`);
  log(`  Taux de cache: ${researchStats.cacheRate}`);

  // Content Creator Stats
  printSection('Content Creator');
  const contentStats = content.getStats();
  log(`  Contenus créés: ${contentStats.created}`);
  log(`  Coût total: ${contentStats.totalCostFormatted}`);
  log(`  Taux de cache: ${contentStats.cacheRate}`);
  log(`  Par type:`, 'yellow');
  Object.entries(contentStats.byType).forEach(([type, count]) => {
    log(`    - ${type}: ${count}`);
  });

  // Code Assistant Stats
  printSection('Code Assistant');
  const codeStats = code.getStats();
  log(`  Assistances: ${codeStats.assists}`);
  log(`  Coût total: ${codeStats.totalCostFormatted}`);
  log(`  Taux de cache: ${codeStats.cacheRate}`);
  log(`  Par action:`, 'yellow');
  Object.entries(codeStats.byAction).forEach(([action, count]) => {
    log(`    - ${action}: ${count}`);
  });

  // Budget Status
  printSection('Budget Guardian');
  const budgetStatus = await budgetGuard.getStatus();
  log(`  Limite mensuelle: €${budgetStatus.limit}`);
  log(`  Dépensé: €${budgetStatus.spentFormatted}`, 'cyan');
  log(`  Restant: €${budgetStatus.remainingFormatted}`, 'green');
  log(`  Pourcentage: ${budgetStatus.percentage}%`);
  log(`  Statut: ${budgetStatus.status}`, budgetStatus.status === 'HEALTHY' ? 'green' : 'yellow');

  // Cache Stats
  printSection('Mega Cache');
  const cacheStats = await cache.getStats();
  log(`  Entrées: ${cacheStats.size}/${cacheStats.maxEntries}`);
  log(`  Hit rate global: ${cacheStats.hitRateFormatted}`, 'cyan');
  log(`  Hits: ${cacheStats.hits}`);
  log(`  Misses: ${cacheStats.misses}`);
  log(`  Économies estimées: ${cacheStats.savedCost}`, 'green');
}

async function main() {
  printHeader('🧪 TEST SYSTÈME SIMPLIFIÉ - GPT-4 Mini Only');

  log('\n📋 Configuration:');
  log(`  - Modèle unique: GPT-4 Mini (gpt-4o-mini)`);
  log(`  - Cache intelligent: Mega Cache`);
  log(`  - Protection budget: Budget Guardian`);
  log(`  - Agents: Research, Content, Code\n`);

  const results = {
    tests: 0,
    passed: 0,
    failed: 0,
    totalCost: 0
  };

  try {
    // Test 1: GPT-4 Mini Client
    const test1 = await testGPT4MiniClient();
    results.tests++;
    if (test1.passed) results.passed++; else results.failed++;
    results.totalCost += test1.cost || 0;

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Router
    const test2 = await testRouter();
    results.tests++;
    if (test2.passed) results.passed++; else results.failed++;
    results.totalCost += test2.cost || 0;

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Research Agent
    const test3 = await testResearchAgent();
    results.tests++;
    if (test3.passed) results.passed++; else results.failed++;
    results.totalCost += test3.cost || 0;

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Content Creator
    const test4 = await testContentCreator();
    results.tests++;
    if (test4.passed) results.passed++; else results.failed++;
    results.totalCost += test4.cost || 0;

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 5: Code Assistant
    const test5 = await testCodeAssistant();
    results.tests++;
    if (test5.passed) results.passed++; else results.failed++;
    results.totalCost += test5.cost || 0;

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 6: Cache Efficiency
    const test6 = await testCacheEfficiency();
    results.tests++;
    if (test6.passed) results.passed++; else results.failed++;

    // Final Stats
    await printFinalStats();

    // Summary
    printHeader('RÉSUMÉ DES TESTS');
    log(`\n📊 Résultats:`, 'blue');
    log(`  Tests exécutés: ${results.tests}`);
    log(`  Réussis: ${results.passed}`, 'green');
    log(`  Échecs: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log(`  Taux de réussite: ${((results.passed / results.tests) * 100).toFixed(1)}%`,
        results.failed === 0 ? 'green' : 'yellow');

    log(`\n💰 Coûts:`, 'blue');
    log(`  Coût total des tests: €${results.totalCost.toFixed(6)}`, 'cyan');
    log(`  Coût moyen par test: €${(results.totalCost / results.tests).toFixed(6)}`, 'cyan');

    if (results.failed === 0) {
      log('\n🎉 TOUS LES TESTS RÉUSSIS!', 'green');
      log('✅ Système 100% opérationnel avec GPT-4 Mini uniquement!', 'green');
      log('\n💡 Économies estimées vs ChatGPT Pro (€20/mois):', 'yellow');
      log('   Avec cache 70%: ~€0.08-0.15/mois = 99.5% d\'économie!', 'green');
    } else {
      log(`\n⚠️  ${results.failed} test(s) échoué(s)`, 'yellow');
      log('Vérifiez les erreurs ci-dessus et les clés API configurées', 'yellow');
    }

    log('');

    process.exit(results.failed === 0 ? 0 : 1);

  } catch (error) {
    log(`\n💥 ERREUR FATALE: ${error.message}`, 'red');
    console.error(error);
    process.exit(2);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n⚠️  Tests interrompus par l\'utilisateur', 'yellow');
  process.exit(130);
});

// Run tests
if (require.main === module) {
  main();
}

module.exports = { main };
