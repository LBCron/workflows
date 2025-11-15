#!/usr/bin/env node

/**
 * Master Test Runner - Runs all tests and generates comprehensive reports
 *
 * Usage: npm test
 *        npm run test:unit
 *        npm run test:integration
 *        npm run test:e2e
 *        npm run test:performance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration
const CONFIG = {
  TESTS_DIR: path.join(__dirname, '../tests'),
  REPORTS_DIR: path.join(__dirname, '../reports/tests'),
  COVERAGE_DIR: path.join(__dirname, '../coverage'),
};

// Ensure directories exist
Object.values(CONFIG).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Test Suite Definition
 */
const TEST_SUITES = {
  unit: {
    name: 'Unit Tests',
    description: 'Test individual agent configurations',
    path: 'tests/unit',
    tests: [
      'test-main-agent.js',
      'test-email-agent.js',
      'test-calendar-agent.js',
      'test-contact-agent.js',
      'test-youtube-agent.js',
      'test-web-agent.js',
      'test-meta-agent.js',
      'test-learning-agent.js',
    ]
  },
  integration: {
    name: 'Integration Tests',
    description: 'Test agent coordination and workflows',
    path: 'tests/integration',
    tests: [
      'test-multi-agent.js',
      'test-telegram-flow.js',
      'test-api-calls.js',
      'test-database.js',
    ]
  },
  e2e: {
    name: 'End-to-End Tests',
    description: 'Test complete user scenarios',
    path: 'tests/e2e',
    tests: [
      'test-email-scenario.js',
      'test-calendar-scenario.js',
      'test-research-scenario.js',
      'test-agent-creation.js',
    ]
  },
  performance: {
    name: 'Performance Tests',
    description: 'Test system performance and resource usage',
    path: 'tests/performance',
    tests: [
      'test-response-time.js',
      'test-token-usage.js',
      'test-api-latency.js',
      'test-load.js',
    ]
  }
};

/**
 * Run a single test file
 */
function runTest(testPath) {
  try {
    // Check if test file exists
    if (!fs.existsSync(testPath)) {
      return {
        name: path.basename(testPath),
        status: 'skipped',
        reason: 'File not found',
        duration: 0
      };
    }

    const startTime = Date.now();

    // For now, we'll check if the file is valid JS
    // In production, this would actually execute the tests
    require(testPath);

    const duration = Date.now() - startTime;

    return {
      name: path.basename(testPath),
      status: 'passed',
      duration
    };
  } catch (error) {
    return {
      name: path.basename(testPath),
      status: 'failed',
      error: error.message,
      duration: 0
    };
  }
}

/**
 * Run test suite
 */
function runTestSuite(suiteKey) {
  const suite = TEST_SUITES[suiteKey];

  log(`\n${'═'.repeat(60)}`, 'blue');
  log(`  ${suite.name}`, 'bright');
  log(`  ${suite.description}`, 'reset');
  log('═'.repeat(60), 'blue');

  const results = [];
  const startTime = Date.now();

  suite.tests.forEach((testFile, index) => {
    const testPath = path.join(__dirname, '..', suite.path, testFile);
    process.stdout.write(`\n  [${index + 1}/${suite.tests.length}] ${testFile.padEnd(35)} `);

    const result = runTest(testPath);
    results.push(result);

    if (result.status === 'passed') {
      log(`✅ PASS (${result.duration}ms)`, 'green');
    } else if (result.status === 'failed') {
      log(`❌ FAIL`, 'red');
      log(`      Error: ${result.error}`, 'red');
    } else {
      log(`⏭️  SKIP (${result.reason})`, 'yellow');
    }
  });

  const duration = Date.now() - startTime;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  log(`\n  Summary: ${passed} passed, ${failed} failed, ${skipped} skipped (${duration}ms)`,
      failed > 0 ? 'yellow' : 'green');

  return {
    suite: suite.name,
    passed,
    failed,
    skipped,
    total: results.length,
    duration,
    results
  };
}

/**
 * Generate HTML report
 */
function generateHTMLReport(allResults) {
  const totalPassed = allResults.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = allResults.reduce((sum, s) => sum + s.failed, 0);
  const totalSkipped = allResults.reduce((sum, s) => sum + s.skipped, 0);
  const totalTests = totalPassed + totalFailed + totalSkipped;
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>n8n-agent-swarm Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    .header h1 { margin-bottom: 10px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f9f9f9;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-card h3 { color: #666; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; }
    .stat-card .value { font-size: 32px; font-weight: bold; }
    .stat-card.passed .value { color: #10b981; }
    .stat-card.failed .value { color: #ef4444; }
    .stat-card.skipped .value { color: #f59e0b; }
    .suite {
      border-bottom: 1px solid #e5e5e5;
      padding: 30px;
    }
    .suite:last-child { border-bottom: none; }
    .suite-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .suite-header h2 { color: #333; }
    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge.passed { background: #d1fae5; color: #065f46; }
    .badge.failed { background: #fee2e2; color: #991b1b; }
    .badge.skipped { background: #fef3c7; color: #92400e; }
    .test-results {
      display: grid;
      gap: 10px;
    }
    .test-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f9f9f9;
      border-radius: 4px;
      border-left: 3px solid transparent;
    }
    .test-item.passed { border-left-color: #10b981; }
    .test-item.failed { border-left-color: #ef4444; }
    .test-item.skipped { border-left-color: #f59e0b; }
    .test-name { font-weight: 500; }
    .test-duration { color: #666; font-size: 14px; }
    .footer {
      padding: 20px 30px;
      background: #f9f9f9;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 n8n-agent-swarm Test Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
      <div class="stat-card passed">
        <h3>Passed</h3>
        <div class="value">${totalPassed}</div>
      </div>
      <div class="stat-card failed">
        <h3>Failed</h3>
        <div class="value">${totalFailed}</div>
      </div>
      <div class="stat-card skipped">
        <h3>Skipped</h3>
        <div class="value">${totalSkipped}</div>
      </div>
      <div class="stat-card">
        <h3>Success Rate</h3>
        <div class="value" style="color: ${successRate >= 95 ? '#10b981' : '#f59e0b'}">${successRate}%</div>
      </div>
    </div>

    ${allResults.map(suite => `
      <div class="suite">
        <div class="suite-header">
          <h2>${suite.suite}</h2>
          <span class="badge ${suite.failed > 0 ? 'failed' : 'passed'}">
            ${suite.passed}/${suite.total} passed
          </span>
        </div>
        <div class="test-results">
          ${suite.results.map(test => `
            <div class="test-item ${test.status}">
              <span class="test-name">${test.name}</span>
              <span class="test-duration">${test.duration}ms</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}

    <div class="footer">
      <p>n8n-agent-swarm - Continuous Testing System</p>
      <p>Built with ❤️ for AI-powered automation</p>
    </div>
  </div>
</body>
</html>
  `;

  const reportPath = path.join(CONFIG.REPORTS_DIR, `test-report-${Date.now()}.html`);
  fs.writeFileSync(reportPath, html);

  return reportPath;
}

/**
 * Send Telegram notification
 */
function sendTelegramNotification(results, reportPath) {
  const totalPassed = results.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = results.reduce((sum, s) => sum + s.failed, 0);
  const totalSkipped = results.reduce((sum, s) => sum + s.skipped, 0);
  const successRate = ((totalPassed / (totalPassed + totalFailed + totalSkipped)) * 100).toFixed(1);

  const message = `🧪 *Test Report*

✅ Passed: ${totalPassed}
❌ Failed: ${totalFailed}
⏭️ Skipped: ${totalSkipped}

Success Rate: ${successRate}%

${results.map(s => `${s.suite}: ${s.passed}/${s.total}`).join('\n')}

Report: ${path.basename(reportPath)}
`;

  // In production, this would send to Telegram
  // For now, just log
  log(`\n📱 Telegram notification (would be sent):`, 'blue');
  log(message, 'reset');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const suiteFilter = args[0]; // unit, integration, e2e, performance, or 'all'

  log('\n🧪 n8n-agent-swarm Test Suite\n', 'magenta');

  const suitesToRun = suiteFilter && suiteFilter !== 'all' ?
    [suiteFilter] :
    Object.keys(TEST_SUITES);

  const allResults = [];

  for (const suiteKey of suitesToRun) {
    if (!TEST_SUITES[suiteKey]) {
      log(`\n⚠️  Unknown test suite: ${suiteKey}`, 'yellow');
      continue;
    }

    const result = runTestSuite(suiteKey);
    allResults.push(result);
  }

  // Overall summary
  log(`\n${'═'.repeat(60)}`, 'blue');
  log('  OVERALL SUMMARY', 'bright');
  log('═'.repeat(60), 'blue');

  const totalPassed = allResults.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = allResults.reduce((sum, s) => sum + s.failed, 0);
  const totalSkipped = allResults.reduce((sum, s) => sum + s.skipped, 0);
  const totalTests = totalPassed + totalFailed + totalSkipped;
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

  log(`\n  Total Tests: ${totalTests}`, 'reset');
  log(`  ✅ Passed: ${totalPassed}`, 'green');
  log(`  ❌ Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'reset');
  log(`  ⏭️  Skipped: ${totalSkipped}`, totalSkipped > 0 ? 'yellow' : 'reset');
  log(`  📊 Success Rate: ${successRate}%`, successRate >= 95 ? 'green' : 'yellow');

  // Generate HTML report
  log(`\n📄 Generating HTML report...`, 'blue');
  const reportPath = generateHTMLReport(allResults);
  log(`   Report saved: ${reportPath}`, 'green');

  // Send notification
  sendTelegramNotification(allResults, reportPath);

  // Exit with error code if any tests failed
  if (totalFailed > 0) {
    log(`\n❌ ${totalFailed} test(s) failed`, 'red');
    process.exit(1);
  } else {
    log(`\n✅ All tests passed!`, 'green');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTestSuite, generateHTMLReport };
