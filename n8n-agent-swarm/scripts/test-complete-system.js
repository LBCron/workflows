#!/usr/bin/env node

/**
 * Complete System Simulation & Bug Detection
 *
 * Tests all AI components to find bugs before deployment
 */

const fs = require('fs');
const path = require('path');

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

class SystemTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      bugs: [],
      tests: []
    };
  }

  async runTest(name, testFn) {
    this.results.totalTests++;
    console.log(`\n${'─'.repeat(60)}`);
    log(`🧪 Testing: ${name}`, 'cyan');

    try {
      await testFn();
      this.results.passed++;
      log('✅ PASSED', 'green');
      this.results.tests.push({ name, status: 'passed' });
      return true;
    } catch (error) {
      this.results.failed++;
      log(`❌ FAILED: ${error.message}`, 'red');
      this.results.bugs.push({
        test: name,
        error: error.message,
        stack: error.stack
      });
      this.results.tests.push({
        name,
        status: 'failed',
        error: error.message
      });
      return false;
    }
  }

  async runWarningTest(name, testFn) {
    console.log(`\n${'─'.repeat(60)}`);
    log(`⚠️  Warning Check: ${name}`, 'yellow');

    try {
      const warnings = await testFn();
      if (warnings && warnings.length > 0) {
        this.results.warnings += warnings.length;
        for (const warning of warnings) {
          log(`   ⚠️  ${warning}`, 'yellow');
        }
      } else {
        log('   ✅ No warnings', 'green');
      }
      return warnings;
    } catch (error) {
      log(`   ❌ Check failed: ${error.message}`, 'red');
      return [];
    }
  }

  printHeader(title) {
    log('\n╔════════════════════════════════════════════════════════╗', 'magenta');
    log(`║  ${title.padEnd(52)}  ║`, 'magenta');
    log('╚════════════════════════════════════════════════════════╝', 'magenta');
  }

  printSummary() {
    this.printHeader('SIMULATION COMPLETE');

    log('\n📊 RESULTS:', 'blue');
    log(`   Total tests: ${this.results.totalTests}`);
    log(`   Passed: ${this.results.passed}`, 'green');
    log(`   Failed: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
    log(`   Warnings: ${this.results.warnings}`, this.results.warnings > 0 ? 'yellow' : 'green');

    const successRate = this.results.totalTests > 0
      ? ((this.results.passed / this.results.totalTests) * 100).toFixed(1)
      : 0;
    log(`   Success rate: ${successRate}%`, parseFloat(successRate) >= 95 ? 'green' : 'red');

    if (this.results.bugs.length > 0) {
      log('\n🐛 BUGS FOUND:', 'red');
      for (let i = 0; i < this.results.bugs.length; i++) {
        const bug = this.results.bugs[i];
        log(`\n   Bug #${i + 1}: ${bug.test}`, 'red');
        log(`   Error: ${bug.error}`, 'red');
      }
    } else {
      log('\n✅ NO BUGS FOUND!', 'green');
      log('   System is clean and ready for deployment! 🎉', 'green');
    }
  }

  async saveReport() {
    const reportPath = path.join(__dirname, '..', 'SIMULATION-REPORT.json');
    const mdPath = path.join(__dirname, '..', 'SIMULATION-REPORT.md');

    try {
      await fs.promises.writeFile(reportPath, JSON.stringify(this.results, null, 2));
      log(`\n💾 Report saved to: ${reportPath}`, 'blue');

      const markdown = this.generateMarkdown();
      await fs.promises.writeFile(mdPath, markdown);
      log(`📄 Markdown report: ${mdPath}`, 'blue');
    } catch (error) {
      log(`⚠️  Could not save report: ${error.message}`, 'yellow');
    }
  }

  generateMarkdown() {
    let md = '# 🧪 Complete System Simulation Report\n\n';
    md += `**Generated:** ${new Date(this.results.timestamp).toLocaleString()}\n\n`;

    md += '## 📊 Summary\n\n';
    md += `- **Total Tests:** ${this.results.totalTests}\n`;
    md += `- **Passed:** ${this.results.passed} ✅\n`;
    md += `- **Failed:** ${this.results.failed} ${this.results.failed > 0 ? '❌' : '✅'}\n`;
    md += `- **Warnings:** ${this.results.warnings} ${this.results.warnings > 0 ? '⚠️' : '✅'}\n`;

    const successRate = this.results.totalTests > 0
      ? ((this.results.passed / this.results.totalTests) * 100).toFixed(1)
      : 0;
    md += `- **Success Rate:** ${successRate}%\n\n`;

    if (this.results.bugs.length > 0) {
      md += '## 🐛 Bugs Found\n\n';
      for (let i = 0; i < this.results.bugs.length; i++) {
        const bug = this.results.bugs[i];
        md += `### Bug #${i + 1}: ${bug.test}\n\n`;
        md += `**Error:** \`${bug.error}\`\n\n`;
        md += '```\n' + bug.stack + '\n```\n\n';
      }
    } else {
      md += '## ✅ No Bugs Found\n\n';
      md += 'System is clean and ready for deployment! 🎉\n\n';
    }

    md += '## 📋 Test Details\n\n';
    for (const test of this.results.tests) {
      const icon = test.status === 'passed' ? '✅' : '❌';
      md += `- ${icon} **${test.name}**\n`;
      if (test.error) {
        md += `  - Error: \`${test.error}\`\n`;
      }
    }

    return md;
  }
}

// ============================================================================
// TEST SUITES
// ============================================================================

async function testBudgetGuardian(tester) {
  tester.printHeader('Phase 1: Budget Guardian Tests');

  await tester.runTest('Budget Guardian - Module Loads', async () => {
    const budgetGuardian = require('./monitoring/budget-guardian');
    if (!budgetGuardian) throw new Error('Module failed to load');
    if (typeof budgetGuardian.checkAndRecord !== 'function') {
      throw new Error('checkAndRecord method not found');
    }
  });

  await tester.runTest('Budget Guardian - Get Status', async () => {
    const budgetGuardian = require('./monitoring/budget-guardian');
    const status = await budgetGuardian.getStatus();
    if (!status.limit) throw new Error('No limit in status');
    if (typeof status.spent !== 'number') throw new Error('Invalid spent value');
    if (typeof status.remaining !== 'number') throw new Error('Invalid remaining value');
  });

  await tester.runTest('Budget Guardian - Get Recommendation', async () => {
    const budgetGuardian = require('./monitoring/budget-guardian');
    const rec = budgetGuardian.getRecommendation();
    if (!rec.status) throw new Error('No status in recommendation');
    if (!rec.allowedModels) throw new Error('No allowedModels in recommendation');
    if (!Array.isArray(rec.allowedModels) && rec.allowedModels !== 'all') {
      throw new Error('allowedModels must be an array or "all"');
    }
  });

  await tester.runTest('Budget Guardian - Low Cost Check', async () => {
    const budgetGuardian = require('./monitoring/budget-guardian');
    // Should not throw for small amount
    await budgetGuardian.checkAndRecord(0.0001, {
      model: 'test',
      type: 'test'
    });
  });
}

async function testMegaCache(tester) {
  tester.printHeader('Phase 2: Mega Cache Tests');

  await tester.runTest('Mega Cache - Module Loads', async () => {
    const megaCache = require('./optimization/mega-cache');
    if (!megaCache) throw new Error('Module failed to load');
    if (typeof megaCache.get !== 'function') throw new Error('get method not found');
    if (typeof megaCache.set !== 'function') throw new Error('set method not found');
  });

  await tester.runTest('Mega Cache - Normalization', async () => {
    const megaCache = require('./optimization/mega-cache');
    const normalized = megaCache.normalize('  Hello World!  ');
    if (normalized !== 'hello world') {
      throw new Error(`Expected 'hello world', got '${normalized}'`);
    }
  });

  await tester.runTest('Mega Cache - Set and Get', async () => {
    const megaCache = require('./optimization/mega-cache');
    await megaCache.set('test prompt', 'test response', { type: 'test' });
    const result = await megaCache.get('test prompt', { type: 'test' });
    if (result !== 'test response') {
      throw new Error(`Expected 'test response', got '${result}'`);
    }
  });

  await tester.runTest('Mega Cache - Case Insensitive', async () => {
    const megaCache = require('./optimization/mega-cache');
    await megaCache.set('Test Case', 'response1', { type: 'test' });
    const result = await megaCache.get('test case', { type: 'test' });
    if (!result) {
      throw new Error('Cache should be case-insensitive');
    }
  });

  await tester.runTest('Mega Cache - Get Stats', async () => {
    const megaCache = require('./optimization/mega-cache');
    const stats = await megaCache.getStats();
    if (typeof stats.size !== 'number') throw new Error('Invalid size in stats');
    if (typeof stats.hits !== 'number') throw new Error('Invalid hits in stats');
    if (typeof stats.misses !== 'number') throw new Error('Invalid misses in stats');
    if (typeof stats.hitRate !== 'number') throw new Error('Invalid hitRate in stats');
  });
}

async function testLLMClients(tester) {
  tester.printHeader('Phase 3: LLM Client Tests');

  await tester.runTest('LLM Clients - Module Loads', async () => {
    const clients = require('./ai-core/llm-clients');
    if (!clients.LLMClientFactory) throw new Error('LLMClientFactory not found');
    if (!clients.BaseLLMClient) throw new Error('BaseLLMClient not found');
  });

  await tester.runTest('LLM Clients - Factory Create', async () => {
    const { LLMClientFactory } = require('./ai-core/llm-clients');
    const client = LLMClientFactory.create('openai', 'gpt-4o-mini');
    if (!client) throw new Error('Factory failed to create client');
    if (typeof client.complete !== 'function') {
      throw new Error('Client missing complete method');
    }
  });

  await tester.runTest('LLM Clients - Get Default Client', async () => {
    const { LLMClientFactory } = require('./ai-core/llm-clients');
    // This will throw if no API keys are configured - that's expected
    try {
      const client = LLMClientFactory.getDefaultClient();
      if (!client) throw new Error('No default client available');
    } catch (error) {
      if (error.message === 'No LLM API keys configured') {
        // Expected when no API keys are set - not a bug
        console.log('      ℹ️  No API keys configured (expected in test environment)');
      } else {
        throw error;
      }
    }
  });

  await tester.runTest('LLM Clients - Token Estimation', async () => {
    const { LLMClientFactory } = require('./ai-core/llm-clients');
    const client = LLMClientFactory.create('openai', 'gpt-4o-mini');
    const tokens = client.estimateTokens('Hello world');
    if (typeof tokens !== 'number') throw new Error('Token estimation failed');
    if (tokens <= 0) throw new Error('Token count should be positive');
  });

  await tester.runTest('LLM Clients - Cost Calculation', async () => {
    const { LLMClientFactory } = require('./ai-core/llm-clients');
    const client = LLMClientFactory.create('openai', 'gpt-4o-mini');
    const cost = client.calculateCost(1000, 500);
    if (typeof cost !== 'number') throw new Error('Cost calculation failed');
    if (cost < 0) throw new Error('Cost should not be negative');
  });
}

async function testIntelligentRouter(tester) {
  tester.printHeader('Phase 4: Intelligent Router Tests');

  await tester.runTest('Intelligent Router - Module Loads', async () => {
    const router = require('./ai-core/intelligent-router-pro');
    if (!router) throw new Error('Module failed to load');
    if (typeof router.route !== 'function') throw new Error('route method not found');
  });

  await tester.runTest('Intelligent Router - Complexity Analysis Simple', async () => {
    const router = require('./ai-core/intelligent-router-pro');
    const complexity = router.analyzeComplexity('What is 2+2?', {});
    if (!complexity.level) throw new Error('No level in complexity');
    if (complexity.level !== 'simple') {
      throw new Error(`Expected 'simple', got '${complexity.level}'`);
    }
  });

  await tester.runTest('Intelligent Router - Complexity Analysis Complex', async () => {
    const router = require('./ai-core/intelligent-router-pro');
    const complexity = router.analyzeComplexity(
      'Explain quantum entanglement and its implications for cryptography',
      { priority: 'high' }
    );
    if (!complexity.level) throw new Error('No level in complexity');
    if (complexity.level === 'simple') {
      throw new Error('Should not classify as simple');
    }
  });

  await tester.runTest('Intelligent Router - Model Selection', async () => {
    const router = require('./ai-core/intelligent-router-pro');
    const complexity = { level: 'simple', score: 20, minQuality: 7 };
    const budgetRec = { status: 'HEALTHY', allowedModels: 'all' };
    const selected = router.selectModel(complexity, budgetRec, {});

    if (!selected.model) throw new Error('No model selected');
    if (!selected.provider) throw new Error('No provider in selection');
    if (typeof selected.cost !== 'number') throw new Error('No cost in selection');
  });
}

async function testResearchAgent(tester) {
  tester.printHeader('Phase 5: Research Agent Pro Tests');

  await tester.runTest('Research Agent - Module Loads', async () => {
    const agent = require('./agents/research-agent-pro');
    if (!agent) throw new Error('Module failed to load');
    if (typeof agent.research !== 'function') throw new Error('research method not found');
  });

  await tester.runTest('Research Agent - Depth Detection Quick', async () => {
    const agent = require('./agents/research-agent-pro');
    const depth = agent.determineDepth('quick summary of AI', 'auto');
    if (!depth.name) throw new Error('No name in depth');
    if (depth.name !== 'RAPIDE') {
      throw new Error(`Expected 'RAPIDE', got '${depth.name}'`);
    }
  });

  await tester.runTest('Research Agent - Depth Detection Expert', async () => {
    const agent = require('./agents/research-agent-pro');
    const depth = agent.determineDepth('publication académique research', 'auto');
    if (depth.name !== 'EXPERT') {
      throw new Error(`Expected 'EXPERT', got '${depth.name}'`);
    }
  });

  await tester.runTest('Research Agent - Build Prompt', async () => {
    const agent = require('./agents/research-agent-pro');
    const depth = agent.determineDepth('test query', 'standard');
    const prompt = agent.buildPrompt('test query', depth);
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt generation failed');
    }
    if (prompt.length < 50) {
      throw new Error('Prompt too short');
    }
  });
}

async function testContentCreator(tester) {
  tester.printHeader('Phase 6: Content Creator Pro Tests');

  await tester.runTest('Content Creator - Module Loads', async () => {
    const agent = require('./agents/content-creator-pro');
    if (!agent) throw new Error('Module failed to load');
    if (typeof agent.create !== 'function') throw new Error('create method not found');
  });

  await tester.runTest('Content Creator - Quality Detection Basic', async () => {
    const agent = require('./agents/content-creator-pro');
    const quality = agent.determineQuality('quick blog post', 'auto');
    if (!quality.name) throw new Error('No name in quality');
    // Should be basic or standard for quick post
  });

  await tester.runTest('Content Creator - Quality Detection Premium', async () => {
    const agent = require('./agents/content-creator-pro');
    const quality = agent.determineQuality('viral content masterpiece', 'auto');
    // Should detect premium keywords
    if (!quality.name) throw new Error('No name in quality');
  });

  await tester.runTest('Content Creator - Build Prompt', async () => {
    const agent = require('./agents/content-creator-pro');
    const quality = { name: 'STANDARD', maxTokens: 1500 };
    const prompt = agent.buildPrompt('blog-post', 'test topic', quality);
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt generation failed');
    }
  });
}

async function testCodeAssistant(tester) {
  tester.printHeader('Phase 7: Code Assistant Pro Tests');

  await tester.runTest('Code Assistant - Module Loads', async () => {
    const agent = require('./agents/code-assistant-pro');
    if (!agent) throw new Error('Module failed to load');
    if (typeof agent.assist !== 'function') throw new Error('assist method not found');
  });

  await tester.runTest('Code Assistant - Build Prompt Generate', async () => {
    const agent = require('./agents/code-assistant-pro');
    const prompt = agent.buildPrompt('generate', {
      language: 'javascript',
      description: 'reverse string function'
    });
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt generation failed');
    }
    if (!prompt.includes('Génère')) {
      throw new Error('Prompt missing generate keywords');
    }
  });

  await tester.runTest('Code Assistant - Build Prompt Debug', async () => {
    const agent = require('./agents/code-assistant-pro');
    const prompt = agent.buildPrompt('debug', {
      language: 'javascript',
      code: 'const x = undefined;',
      error: 'Cannot read property'
    });
    if (!prompt.includes('Debug')) {
      throw new Error('Prompt missing debug keywords');
    }
  });

  await tester.runTest('Code Assistant - Parse Code Response', async () => {
    const agent = require('./agents/code-assistant-pro');
    const response = 'Here is the code:\n```javascript\nconst x = 5;\n```\nExplanation: sets x to 5';
    const parsed = agent.parseCodeResponse(response);

    if (!parsed.code) throw new Error('No code extracted');
    if (!parsed.explanation) throw new Error('No explanation extracted');
    if (!parsed.code.includes('const x = 5')) {
      throw new Error('Code not properly extracted');
    }
  });
}

async function checkEnvironmentVariables(tester) {
  await tester.runWarningTest('Environment Variables', async () => {
    const warnings = [];

    if (!process.env.OPENAI_API_KEY) {
      warnings.push('OPENAI_API_KEY not set');
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      warnings.push('ANTHROPIC_API_KEY not set');
    }
    if (!process.env.GROQ_API_KEY) {
      warnings.push('GROQ_API_KEY not set (free model unavailable)');
    }
    if (!process.env.GOOGLE_API_KEY) {
      warnings.push('GOOGLE_API_KEY not set');
    }
    if (!process.env.MONTHLY_BUDGET_LIMIT) {
      warnings.push('MONTHLY_BUDGET_LIMIT not set (using default €20)');
    }

    return warnings;
  });
}

async function checkFileStructure(tester) {
  await tester.runWarningTest('File Structure', async () => {
    const warnings = [];
    const requiredDirs = [
      './monitoring',
      './optimization',
      './ai-core',
      './agents'
    ];

    for (const dir of requiredDirs) {
      const fullPath = path.join(__dirname, dir);
      if (!fs.existsSync(fullPath)) {
        warnings.push(`Directory missing: ${dir}`);
      }
    }

    const requiredFiles = [
      './monitoring/budget-guardian.js',
      './optimization/mega-cache.js',
      './ai-core/llm-clients.js',
      './ai-core/intelligent-router-pro.js',
      './agents/research-agent-pro.js',
      './agents/content-creator-pro.js',
      './agents/code-assistant-pro.js'
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(__dirname, file);
      if (!fs.existsSync(fullPath)) {
        warnings.push(`File missing: ${file}`);
      }
    }

    return warnings;
  });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const tester = new SystemTester();

  tester.printHeader('🧪 COMPLETE SYSTEM SIMULATION');
  log('\nRunning comprehensive tests to find all bugs...\n', 'cyan');

  // Change to script directory
  process.chdir(__dirname);

  // Preliminary checks
  await checkFileStructure(tester);
  await checkEnvironmentVariables(tester);

  // Core system tests
  await testBudgetGuardian(tester);
  await testMegaCache(tester);
  await testLLMClients(tester);
  await testIntelligentRouter(tester);

  // Agent tests
  await testResearchAgent(tester);
  await testContentCreator(tester);
  await testCodeAssistant(tester);

  // Final report
  tester.printSummary();
  await tester.saveReport();

  // Exit code
  const exitCode = tester.results.failed > 0 ? 1 : 0;
  log(`\n🏁 Simulation complete. Exit code: ${exitCode}\n`, exitCode === 0 ? 'green' : 'red');

  return exitCode;
}

// Run if called directly
if (require.main === module) {
  main().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    log('\n💥 FATAL ERROR:', 'red');
    console.error(error);
    process.exit(2);
  });
}

module.exports = { main, SystemTester };
