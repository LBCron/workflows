/**
 * Tests d'intégration pour les systèmes premium
 */

require('dotenv').config();

const CredentialVault = require('../../src/core/credential-vault-ultimate');
const LearningEngine = require('../../src/core/learning-engine-v2');
const PerformanceMonitoring = require('../../src/core/performance-monitoring');
const SecurityManager = require('../../src/core/security-manager');

async function testCredentialVault() {
  console.log('\n🔐 Testing Credential Vault...');

  const vault = new CredentialVault();

  try {
    await vault.initialize();
    console.log('✅ Vault initialized');

    const stats = vault.getStats();
    console.log('✅ Stats:', stats);

    console.log('✅ Credential Vault: OK');
    return true;
  } catch (error) {
    console.error('❌ Credential Vault failed:', error.message);
    return false;
  }
}

async function testLearningEngine() {
  console.log('\n🧠 Testing Learning Engine...');

  const learning = new LearningEngine();

  try {
    await learning.initialize();
    console.log('✅ Learning Engine initialized');

    // Test tracking
    await learning.trackInteraction('test_user', {
      intent: 'test',
      userMessage: 'Test message',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Interaction tracked');

    const globalStats = learning.getGlobalStats();
    console.log('✅ Global stats:', globalStats);

    console.log('✅ Learning Engine: OK');
    return true;
  } catch (error) {
    console.error('❌ Learning Engine failed:', error.message);
    return false;
  }
}

async function testPerformanceMonitoring() {
  console.log('\n⚡ Testing Performance Monitoring...');

  const perf = new PerformanceMonitoring();

  try {
    // Test cache
    await perf.cacheSet('test_key', 'test_value');
    const value = await perf.cacheGet('test_key');

    if (value !== 'test_value') {
      throw new Error('Cache failed');
    }

    console.log('✅ Cache working');

    // Test rate limiting
    const rateLimit = await perf.checkRateLimit('test_user');
    if (!rateLimit.allowed) {
      throw new Error('Rate limit failed');
    }

    console.log('✅ Rate limiting working');

    // Test metrics
    perf.trackRequest('test_user', 'test', 100, true);
    console.log('✅ Metrics tracking working');

    const analytics = perf.getAnalytics();
    console.log('✅ Analytics:', analytics.overview);

    console.log('✅ Performance Monitoring: OK');
    return true;
  } catch (error) {
    console.error('❌ Performance Monitoring failed:', error.message);
    return false;
  }
}

async function testSecurityManager() {
  console.log('\n🔒 Testing Security Manager...');

  const security = new SecurityManager();

  try {
    await security.initialize();
    console.log('✅ Security Manager initialized');

    // Test access validation
    const access = await security.validateAccess('test_user', '127.0.0.1', 'test');
    if (!access.allowed) {
      throw new Error('Access validation failed');
    }

    console.log('✅ Access validation working');

    // Test metrics
    const metrics = security.getSecurityMetrics();
    console.log('✅ Security metrics:', metrics);

    console.log('✅ Security Manager: OK');
    return true;
  } catch (error) {
    console.error('❌ Security Manager failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🧪 PREMIUM SYSTEMS INTEGRATION TESTS                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  const results = {
    credentialVault: await testCredentialVault(),
    learningEngine: await testLearningEngine(),
    performanceMonitoring: await testPerformanceMonitoring(),
    securityManager: await testSecurityManager()
  };

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST RESULTS:\n');

  let passed = 0;
  let failed = 0;

  Object.entries(results).forEach(([name, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${name}`);

    if (result) {
      passed++;
    } else {
      failed++;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}\n`);

  if (failed > 0) {
    console.log('❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
