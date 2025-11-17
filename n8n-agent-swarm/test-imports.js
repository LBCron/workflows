#!/usr/bin/env node
/**
 * Test script to verify all imports work correctly
 */

console.log('🧪 Testing imports...\n');

// Test Paul Bot imports
console.log('1️⃣ Testing Paul Bot imports:');

try {
  const path = require('path');
  console.log('  ✅ path');

  const ResearchAgent = require('./src/agents/research/research.agent');
  console.log('  ✅ ResearchAgent');

  const ContentCreator = require('./src/agents/content/content.agent');
  console.log('  ✅ ContentCreator');

  const CodeAssistant = require('./src/agents/code/code.agent');
  console.log('  ✅ CodeAssistant');

  const EmailAgent = require('./src/agents/email/email.agent');
  console.log('  ✅ EmailAgent');

  const CalendarAgent = require('./src/agents/calendar/calendar.agent');
  console.log('  ✅ CalendarAgent');

  const DriveAgent = require('./src/agents/drive-agent');
  console.log('  ✅ DriveAgent');

  const WebSearchAgent = require('./src/agents/web-search-agent');
  console.log('  ✅ WebSearchAgent');

  const SetupWizard = require('./src/bots/telegram/setup-wizard');
  console.log('  ✅ SetupWizard');

  const BudgetGuardian = require('./src/core/budget/budget.guardian');
  console.log('  ✅ BudgetGuardian');

  const UniversalMemory = require('./src/core/memory/universal-memory-system');
  console.log('  ✅ UniversalMemory');

  const logger = require('./src/core/logger');
  console.log('  ✅ logger');

  console.log('\n✅ Paul Bot: All imports successful!\n');

} catch (error) {
  console.error('\n❌ Paul Bot import error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Test Manager Bot imports
console.log('2️⃣ Testing Manager Bot imports:');

try {
  const XianyuAutoScraper = require('./src/integrations/xianyu-scraper');
  console.log('  ✅ XianyuAutoScraper');

  const VintedAPI = require('./src/integrations/vinted-api');
  console.log('  ✅ VintedAPI');

  const WeChatScraper = require('./src/scrapers/wechat/wechat-scraper');
  console.log('  ✅ WeChatScraper');

  const WeigouScraper = require('./src/scrapers/weigou/weigou-scraper');
  console.log('  ✅ WeigouScraper');

  console.log('\n✅ Manager Bot: All imports successful!\n');

} catch (error) {
  console.error('\n❌ Manager Bot import error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('━'.repeat(60));
console.log('✅ ALL TESTS PASSED!');
console.log('━'.repeat(60));
console.log('\n🎯 Next step: Test bot startup (dry-run)');
console.log('   npm run paul (Ctrl+C après démarrage)');
console.log('   npm run manager (Ctrl+C après démarrage)\n');
