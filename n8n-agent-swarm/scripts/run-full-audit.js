#!/usr/bin/env node

/**
 * Complete Project Audit Script
 *
 * Runs comprehensive validation of the entire n8n-agent-swarm project
 */

const fs = require('fs');
const path = require('path');

// Import validators
const { validateStructure } = require('./validation/project-structure-validator');
const { validateAllJSON } = require('./validation/json-validator');
const { checkAllJS } = require('./validation/js-syntax-checker');

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

function printHeader() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                        ║', 'cyan');
  log('║          🔍 COMPLETE PROJECT AUDIT                    ║', 'cyan');
  log('║                                                        ║', 'cyan');
  log('║          n8n-agent-swarm Validation Suite             ║', 'cyan');
  log('║                                                        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  log('');
}

function printPhaseHeader(phase, title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`  Phase ${phase}: ${title}`, 'blue');
  log(`${'='.repeat(60)}`, 'blue');
  log('');
}

async function runAudit() {
  printHeader();

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      successRate: 0
    },
    phases: []
  };

  // Phase 1: Project Structure
  printPhaseHeader('1/3', 'Project Structure Validation');
  const structureResults = validateStructure();
  report.phases.push({
    phase: 'Project Structure',
    passed: structureResults.passed.length,
    failed: structureResults.failed.length,
    warnings: structureResults.warnings.length,
    details: structureResults
  });

  // Phase 2: JSON Validation
  printPhaseHeader('2/3', 'JSON Files Validation');
  const jsonResults = validateAllJSON();
  report.phases.push({
    phase: 'JSON Validation',
    passed: jsonResults.valid.length,
    failed: jsonResults.invalid.length,
    warnings: jsonResults.warnings.length,
    details: jsonResults
  });

  // Phase 3: JavaScript Syntax
  printPhaseHeader('3/3', 'JavaScript Syntax Check');
  const jsResults = checkAllJS();
  report.phases.push({
    phase: 'JavaScript Syntax',
    passed: jsResults.valid.length,
    failed: jsResults.invalid.length,
    warnings: jsResults.warnings.length,
    details: jsResults
  });

  // Calculate summary
  for (const phase of report.phases) {
    report.summary.totalTests += (phase.passed + phase.failed);
    report.summary.passed += phase.passed;
    report.summary.failed += phase.failed;
    report.summary.warnings += phase.warnings;
  }

  report.summary.successRate = report.summary.totalTests > 0
    ? ((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)
    : 0;

  // Print final report
  printFinalReport(report);

  // Save report
  await saveReport(report);

  // Return exit code
  return report.summary.failed === 0;
}

function printFinalReport(report) {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                  FINAL AUDIT REPORT                     ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  log('📊 OVERALL STATISTICS:', 'blue');
  log(`   Total tests: ${report.summary.totalTests}`);
  log(`   Passed: ${report.summary.passed}`, 'green');
  log(`   Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'green');
  log(`   Warnings: ${report.summary.warnings}`, report.summary.warnings > 0 ? 'yellow' : 'green');
  log(`   Success rate: ${report.summary.successRate}%`, parseFloat(report.summary.successRate) >= 95 ? 'green' : 'yellow');
  log('');

  log('📋 PHASE BREAKDOWN:', 'blue');
  for (const phase of report.phases) {
    const status = phase.failed === 0 ? '✅' : '❌';
    log(`   ${status} ${phase.phase}: ${phase.passed}/${phase.passed + phase.failed} passed`);
  }
  log('');

  // Deployment decision
  const successRate = parseFloat(report.summary.successRate);
  const failed = report.summary.failed;

  log('🚀 DEPLOYMENT STATUS:', 'magenta');

  if (successRate >= 95 && failed === 0) {
    log('   ✅ READY FOR DEPLOYMENT', 'green');
    log('   All critical tests passed!');
    log('   System is production-ready 🎉');
  } else if (successRate >= 90 && failed <= 3) {
    log('   ⚠️  CAUTION ADVISED', 'yellow');
    log(`   ${failed} test(s) failed`);
    log('   Review issues before deploying');
  } else {
    log('   ❌ NOT READY FOR DEPLOYMENT', 'red');
    log(`   ${failed} test(s) failed`);
    log('   Fix issues before deploying!');
  }

  log('');
}

async function saveReport(report) {
  const reportPath = path.join(__dirname, '..', 'AUDIT-REPORT.json');

  try {
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    log(`💾 Full report saved to: ${reportPath}`, 'blue');

    // Also generate markdown
    const markdown = generateMarkdownReport(report);
    const mdPath = path.join(__dirname, '..', 'AUDIT-REPORT.md');
    await fs.promises.writeFile(mdPath, markdown);
    log(`📄 Markdown report saved to: ${mdPath}`, 'blue');

  } catch (error) {
    log(`⚠️  Could not save report: ${error.message}`, 'yellow');
  }
}

function generateMarkdownReport(report) {
  let md = '# 🔍 n8n-agent-swarm Audit Report\n\n';
  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;

  md += '## 📊 Summary\n\n';
  md += `- **Total Tests:** ${report.summary.totalTests}\n`;
  md += `- **Passed:** ${report.summary.passed} ✅\n`;
  md += `- **Failed:** ${report.summary.failed} ${report.summary.failed > 0 ? '❌' : '✅'}\n`;
  md += `- **Warnings:** ${report.summary.warnings} ${report.summary.warnings > 0 ? '⚠️' : '✅'}\n`;
  md += `- **Success Rate:** ${report.summary.successRate}%\n\n`;

  md += '## 📋 Phases\n\n';

  for (const phase of report.phases) {
    const status = phase.failed === 0 ? '✅' : '❌';
    md += `### ${status} ${phase.phase}\n\n`;
    md += `- Passed: ${phase.passed}\n`;
    md += `- Failed: ${phase.failed}\n`;
    md += `- Warnings: ${phase.warnings}\n\n`;

    if (phase.failed > 0 && phase.details.invalid) {
      md += '**Failed Checks:**\n\n';
      for (const item of phase.details.invalid) {
        md += `- \`${item.path}\`: ${item.error || item.issue}\n`;
      }
      md += '\n';
    }

    if (phase.failed > 0 && phase.details.failed) {
      md += '**Failed Checks:**\n\n';
      for (const item of phase.details.failed) {
        md += `- \`${item.path}\`: ${item.description || item.issue}\n`;
      }
      md += '\n';
    }
  }

  md += '## 🚀 Deployment Recommendation\n\n';

  const successRate = parseFloat(report.summary.successRate);
  const failed = report.summary.failed;

  if (successRate >= 95 && failed === 0) {
    md += '✅ **READY FOR DEPLOYMENT**\n\n';
    md += 'All critical tests passed. System is production-ready!\n';
  } else if (successRate >= 90) {
    md += '⚠️ **CAUTION ADVISED**\n\n';
    md += `${failed} test(s) failed. Review issues before deploying.\n`;
  } else {
    md += '❌ **NOT READY FOR DEPLOYMENT**\n\n';
    md += `${failed} test(s) failed. Fix issues before deploying!\n`;
  }

  return md;
}

// Run audit
if (require.main === module) {
  runAudit().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log('\n💥 FATAL ERROR DURING AUDIT:', 'red');
    console.error(error);
    process.exit(2);
  });
}

module.exports = { runAudit };
