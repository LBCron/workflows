#!/usr/bin/env node

/**
 * Learning System - Continuous Improvement Engine
 *
 * This script analyzes interaction logs, identifies patterns, and suggests
 * optimizations for the n8n-agent-swarm system.
 *
 * Usage: node scripts/learning-system.js [options]
 *
 * Options:
 *   --period <days>    Analysis period (default: 7)
 *   --agent <name>     Focus on specific agent
 *   --report           Generate report only
 *   --optimize         Suggest optimizations
 *   --deploy           Auto-deploy validated improvements
 */

const fs = require('fs');
const path = require('path');

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
  LOG_FILE: path.join(__dirname, '../logs/interactions.json'),
  AGENTS_DIR: path.join(__dirname, '../agent-configs'),
  REPORTS_DIR: path.join(__dirname, '../reports/learning'),
  MIN_SAMPLES: 50, // Minimum interactions for valid analysis
  SUCCESS_THRESHOLD: 0.95, // Target 95% success rate
  RESPONSE_TIME_TARGET: 3000, // 3 seconds
  TOKEN_BUDGET: 2000, // Average tokens per interaction
};

// Ensure directories exist
[CONFIG.REPORTS_DIR, path.dirname(CONFIG.LOG_FILE)].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Load interaction logs
 */
function loadLogs(periodDays = 7) {
  const logs = [];

  // For now, return mock data structure
  // In production, this would read from Google Sheets or local logs
  if (fs.existsSync(CONFIG.LOG_FILE)) {
    const data = JSON.parse(fs.readFileSync(CONFIG.LOG_FILE, 'utf8'));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    return data.filter(log => new Date(log.timestamp) >= cutoffDate);
  }

  log('⚠️  No log file found. Using sample data for demonstration.', 'yellow');

  // Sample data structure
  return [
    {
      timestamp: new Date().toISOString(),
      user_input: 'Send an email to john@example.com',
      agent_used: 'email',
      response: 'Email sent successfully',
      success: true,
      response_time_ms: 2500,
      tokens_used: 1200,
      error: null,
      user_reaction: '👍'
    },
    // Add more samples...
  ];
}

/**
 * Calculate success rate by agent
 */
function calculateSuccessRate(logs, agentName = null) {
  const filtered = agentName ?
    logs.filter(l => l.agent_used === agentName) :
    logs;

  if (filtered.length === 0) return { rate: 0, total: 0, successful: 0 };

  const successful = filtered.filter(l => l.success === true).length;
  const rate = successful / filtered.length;

  return {
    rate,
    total: filtered.length,
    successful,
    failed: filtered.length - successful
  };
}

/**
 * Calculate average response time
 */
function calculateAvgResponseTime(logs, agentName = null) {
  const filtered = agentName ?
    logs.filter(l => l.agent_used === agentName) :
    logs;

  if (filtered.length === 0) return 0;

  const total = filtered.reduce((sum, l) => sum + (l.response_time_ms || 0), 0);
  return Math.round(total / filtered.length);
}

/**
 * Calculate token usage
 */
function calculateTokenUsage(logs, agentName = null) {
  const filtered = agentName ?
    logs.filter(l => l.agent_used === agentName) :
    logs;

  if (filtered.length === 0) return { avg: 0, total: 0 };

  const total = filtered.reduce((sum, l) => sum + (l.tokens_used || 0), 0);
  const avg = Math.round(total / filtered.length);

  // Rough cost estimation ($0.01 per 1k tokens for GPT-4)
  const estimatedCost = (total / 1000) * 0.01;

  return { avg, total, estimatedCost };
}

/**
 * Identify error patterns
 */
function identifyErrors(logs) {
  const errors = logs.filter(l => !l.success && l.error);

  // Group by error type
  const errorGroups = {};
  errors.forEach(log => {
    const errorType = log.error.type || 'unknown';
    if (!errorGroups[errorType]) {
      errorGroups[errorType] = [];
    }
    errorGroups[errorType].push(log);
  });

  // Sort by frequency
  return Object.entries(errorGroups)
    .map(([type, occurrences]) => ({
      type,
      count: occurrences.length,
      percentage: (occurrences.length / logs.length * 100).toFixed(1),
      examples: occurrences.slice(0, 3).map(o => o.user_input),
      affectedAgents: [...new Set(occurrences.map(o => o.agent_used))]
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Analyze user satisfaction
 */
function analyzeUserSatisfaction(logs) {
  const withReactions = logs.filter(l => l.user_reaction);

  if (withReactions.length === 0) {
    return { satisfaction: 0, positive: 0, negative: 0, neutral: 0 };
  }

  const positive = withReactions.filter(l => l.user_reaction === '👍').length;
  const negative = withReactions.filter(l => l.user_reaction === '👎').length;
  const neutral = withReactions.length - positive - negative;

  const satisfaction = positive / withReactions.length;

  return {
    satisfaction,
    positive,
    negative,
    neutral,
    total: withReactions.length,
    responseRate: (withReactions.length / logs.length * 100).toFixed(1)
  };
}

/**
 * Generate insights and recommendations
 */
function generateInsights(logs, agents) {
  const insights = [];
  const recommendations = [];

  // Check each agent's performance
  agents.forEach(agentName => {
    const agentLogs = logs.filter(l => l.agent_used === agentName);
    if (agentLogs.length < 10) return; // Skip if too few samples

    const successRate = calculateSuccessRate(logs, agentName);
    const avgTime = calculateAvgResponseTime(logs, agentName);
    const tokens = calculateTokenUsage(logs, agentName);

    // Low success rate
    if (successRate.rate < CONFIG.SUCCESS_THRESHOLD) {
      insights.push({
        type: 'warning',
        agent: agentName,
        metric: 'success_rate',
        value: (successRate.rate * 100).toFixed(1) + '%',
        message: `${agentName} Agent success rate below target (${(successRate.rate * 100).toFixed(1)}% < 95%)`
      });

      recommendations.push({
        priority: 'high',
        agent: agentName,
        action: 'optimize_prompt',
        reason: 'Low success rate',
        details: `Analyze failed interactions and update prompt to handle common failure cases`
      });
    }

    // Slow response time
    if (avgTime > CONFIG.RESPONSE_TIME_TARGET) {
      insights.push({
        type: 'warning',
        agent: agentName,
        metric: 'response_time',
        value: avgTime + 'ms',
        message: `${agentName} Agent response time above target (${avgTime}ms > ${CONFIG.RESPONSE_TIME_TARGET}ms)`
      });

      recommendations.push({
        priority: 'medium',
        agent: agentName,
        action: 'optimize_performance',
        reason: 'Slow response time',
        details: `Consider caching, reducing prompt size, or optimizing API calls`
      });
    }

    // High token usage
    if (tokens.avg > CONFIG.TOKEN_BUDGET) {
      insights.push({
        type: 'info',
        agent: agentName,
        metric: 'token_usage',
        value: tokens.avg + ' tokens',
        message: `${agentName} Agent using more tokens than budget (${tokens.avg} > ${CONFIG.TOKEN_BUDGET})`
      });

      recommendations.push({
        priority: 'low',
        agent: agentName,
        action: 'reduce_tokens',
        reason: 'High token usage',
        details: `Simplify prompt, remove unnecessary examples, or use shorter system messages`
      });
    }
  });

  return { insights, recommendations };
}

/**
 * Generate learning report
 */
function generateReport(logs, period, outputFormat = 'console') {
  log('\n📊 Learning System Analysis Report\n', 'bright');
  log('═'.repeat(60), 'blue');

  // Overall metrics
  const totalInteractions = logs.length;
  const overallSuccess = calculateSuccessRate(logs);
  const avgResponseTime = calculateAvgResponseTime(logs);
  const tokenUsage = calculateTokenUsage(logs);
  const satisfaction = analyzeUserSatisfaction(logs);

  log(`\n📋 Period: Last ${period} days`, 'blue');
  log(`   Total Interactions: ${totalInteractions}`, 'reset');

  if (totalInteractions < CONFIG.MIN_SAMPLES) {
    log(`\n⚠️  Warning: Only ${totalInteractions} interactions. Need ${CONFIG.MIN_SAMPLES}+ for reliable analysis.`, 'yellow');
  }

  log(`\n🎯 Overall Performance:`, 'blue');
  log(`   Success Rate: ${(overallSuccess.rate * 100).toFixed(1)}% (${overallSuccess.successful}/${overallSuccess.total})`,
      overallSuccess.rate >= CONFIG.SUCCESS_THRESHOLD ? 'green' : 'yellow');
  log(`   Avg Response Time: ${avgResponseTime}ms`,
      avgResponseTime <= CONFIG.RESPONSE_TIME_TARGET ? 'green' : 'yellow');
  log(`   Avg Token Usage: ${tokenUsage.avg} tokens/interaction`, 'reset');
  log(`   Estimated Cost: $${tokenUsage.estimatedCost.toFixed(2)}`, 'reset');

  if (satisfaction.total > 0) {
    log(`\n😊 User Satisfaction:`, 'blue');
    log(`   Positive: ${satisfaction.positive} (${(satisfaction.satisfaction * 100).toFixed(1)}%)`, 'green');
    log(`   Negative: ${satisfaction.negative}`, satisfaction.negative > 0 ? 'red' : 'reset');
    log(`   Response Rate: ${satisfaction.responseRate}%`, 'reset');
  }

  // Per-agent breakdown
  const agents = [...new Set(logs.map(l => l.agent_used))];

  if (agents.length > 0) {
    log(`\n🤖 Agent Performance:`, 'blue');
    log('─'.repeat(60), 'blue');

    agents.forEach(agentName => {
      const agentSuccess = calculateSuccessRate(logs, agentName);
      const agentTime = calculateAvgResponseTime(logs, agentName);

      log(`\n   ${agentName.toUpperCase()} Agent:`, 'bright');
      log(`   ├─ Interactions: ${agentSuccess.total}`, 'reset');
      log(`   ├─ Success Rate: ${(agentSuccess.rate * 100).toFixed(1)}%`,
          agentSuccess.rate >= 0.90 ? 'green' : 'yellow');
      log(`   └─ Avg Time: ${agentTime}ms`, 'reset');
    });
  }

  // Error analysis
  const errors = identifyErrors(logs);
  if (errors.length > 0) {
    log(`\n🚨 Error Analysis:`, 'red');
    log('─'.repeat(60), 'blue');

    errors.slice(0, 5).forEach(error => {
      log(`\n   ${error.type}:`, 'yellow');
      log(`   ├─ Occurrences: ${error.count} (${error.percentage}%)`, 'reset');
      log(`   ├─ Affected Agents: ${error.affectedAgents.join(', ')}`, 'reset');
      log(`   └─ Examples:`, 'reset');
      error.examples.forEach(ex => log(`      • "${ex}"`, 'reset'));
    });
  }

  // Generate insights
  const { insights, recommendations } = generateInsights(logs, agents);

  if (insights.length > 0) {
    log(`\n🔍 Key Insights:`, 'blue');
    log('─'.repeat(60), 'blue');

    insights.forEach((insight, idx) => {
      const icon = insight.type === 'warning' ? '⚠️' : insight.type === 'error' ? '❌' : 'ℹ️';
      log(`\n   ${idx + 1}. ${icon} ${insight.message}`, 'yellow');
      log(`      Metric: ${insight.metric} = ${insight.value}`, 'reset');
    });
  }

  if (recommendations.length > 0) {
    log(`\n📋 Recommendations:`, 'green');
    log('─'.repeat(60), 'blue');

    const priorityOrder = { high: 1, medium: 2, low: 3 };
    recommendations
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .forEach((rec, idx) => {
        const priorityColor = rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'reset';
        log(`\n   ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.agent} Agent`, priorityColor);
        log(`      Action: ${rec.action}`, 'reset');
        log(`      Reason: ${rec.reason}`, 'reset');
        log(`      Details: ${rec.details}`, 'reset');
      });
  }

  log('\n' + '═'.repeat(60), 'blue');
  log(`\n✅ Analysis complete. ${insights.length} insights, ${recommendations.length} recommendations.\n`, 'green');

  // Save report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    period: period + ' days',
    total_interactions: totalInteractions,
    overall_metrics: {
      success_rate: overallSuccess.rate,
      avg_response_time: avgResponseTime,
      token_usage: tokenUsage,
      user_satisfaction: satisfaction
    },
    agent_performance: agents.map(name => ({
      name,
      success_rate: calculateSuccessRate(logs, name),
      avg_response_time: calculateAvgResponseTime(logs, name),
      token_usage: calculateTokenUsage(logs, name)
    })),
    errors,
    insights,
    recommendations
  };

  const reportFile = path.join(
    CONFIG.REPORTS_DIR,
    `learning-report-${new Date().toISOString().split('T')[0]}.json`
  );

  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
  log(`📄 Report saved: ${reportFile}`, 'blue');

  return reportData;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const period = parseInt(args.find(a => a.startsWith('--period='))?.split('=')[1]) || 7;
  const agent = args.find(a => a.startsWith('--agent='))?.split('=')[1];

  log('\n🧠 n8n-agent-swarm Learning System\n', 'magenta');
  log('═'.repeat(60), 'blue');

  // Load logs
  log('\n📊 Loading interaction logs...', 'blue');
  const logs = loadLogs(period);
  log(`   Loaded ${logs.length} interactions from last ${period} days`, 'green');

  if (logs.length === 0) {
    log('\n❌ No logs found. Make sure interactions are being logged.', 'red');
    log('\n💡 To enable logging:', 'yellow');
    log('   1. Configure Google Sheets logging in n8n workflow', 'reset');
    log('   2. Or save logs to: ' + CONFIG.LOG_FILE, 'reset');
    process.exit(1);
  }

  // Generate report
  const report = generateReport(logs, period);

  // Next steps
  log('\n🚀 Next Steps:', 'blue');
  log('   1. Review recommendations above', 'reset');
  log('   2. Run: npm run optimize -- --agent=<name> (to optimize specific agent)', 'reset');
  log('   3. Run: npm run test (to validate changes)', 'reset');
  log('   4. Check report file for detailed analysis', 'reset');
  log('');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (error.stack) {
      log(error.stack, 'red');
    }
    process.exit(1);
  });
}

module.exports = {
  loadLogs,
  calculateSuccessRate,
  calculateAvgResponseTime,
  calculateTokenUsage,
  identifyErrors,
  analyzeUserSatisfaction,
  generateInsights,
  generateReport
};
