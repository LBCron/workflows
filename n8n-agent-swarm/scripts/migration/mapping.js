/**
 * Migration Mapping - Old → New structure
 *
 * This file maps old paths to new paths for gradual migration
 */

module.exports = {
  // Agents
  'scripts/agents/research-agent-pro.js': 'src/agents/research/research.agent.js',
  'scripts/agents/content-creator-pro.js': 'src/agents/content/content.agent.js',
  'scripts/agents/code-assistant-pro.js': 'src/agents/code/code.agent.js',
  'scripts/agents/email-agent-pro.js': 'src/agents/email/email.agent.js',
  'scripts/agents/calendar-agent-pro.js': 'src/agents/calendar/calendar.agent.js',
  'scripts/agents/meta-agent.js': 'src/agents/meta/meta.agent.js',

  // Core
  'scripts/ai-core/intelligent-router-pro.js': 'src/core/router/router.js',
  'scripts/ai-core/llm-clients.js': 'src/services/llm/llm.factory.js',
  'scripts/monitoring/budget-guardian.js': 'src/core/budget/budget.guardian.js',
  'scripts/optimization/mega-cache.js': 'src/core/cache/cache.js',
  'scripts/core/logger.js': 'src/core/logger/logger.js',
  'scripts/core/agent-optimizer.js': 'src/core/optimizer/optimizer.js',
  'scripts/core/optimized-agents.js': 'src/agents/index.js',

  // Config
  'scripts/config/agents-registry.json': 'src/config/agents.config.json',

  // Templates
  'scripts/templates/agent-template.js': 'src/agents/base/agent.base.js',

  // Bot
  'scripts/telegram-bot.js': 'src/bot/index.js'
};
