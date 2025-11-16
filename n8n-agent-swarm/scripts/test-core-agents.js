#!/usr/bin/env node

/**
 * Simple Test Script - Test core agents functionality
 */

console.log('🧪 Testing AI Agent Swarm Core Components\n');

let passed = 0;
let failed = 0;

// Test 1: Meta Agent
console.log('1️⃣ Testing Meta Agent...');
try {
  const MetaAgent = require('./agents/meta-agent.js');
  if (MetaAgent && typeof MetaAgent.createAgent === 'function') {
    console.log('   ✅ Meta Agent loaded successfully');
    console.log('   ✅ createAgent method exists');
    passed++;
  } else {
    console.log('   ❌ Meta Agent missing createAgent method');
    failed++;
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  failed++;
}

// Test 2: Research Agent
console.log('\n2️⃣ Testing Research Agent...');
try {
  const ResearchAgent = require('./agents/research-agent-pro.js');
  if (ResearchAgent && typeof ResearchAgent.research === 'function') {
    console.log('   ✅ Research Agent loaded successfully');
    console.log('   ✅ research method exists');
    passed++;
  } else {
    console.log('   ❌ Research Agent missing research method');
    failed++;
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  failed++;
}

// Test 3: Content Creator
console.log('\n3️⃣ Testing Content Creator...');
try {
  const ContentCreator = require('./agents/content-creator-pro.js');
  if (ContentCreator && typeof ContentCreator.create === 'function') {
    console.log('   ✅ Content Creator loaded successfully');
    console.log('   ✅ create method exists');
    passed++;
  } else {
    console.log('   ❌ Content Creator missing create method');
    failed++;
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  failed++;
}

// Test 4: Code Assistant
console.log('\n4️⃣ Testing Code Assistant...');
try {
  const CodeAssistant = require('./agents/code-assistant-pro.js');
  if (CodeAssistant && typeof CodeAssistant.assist === 'function') {
    console.log('   ✅ Code Assistant loaded successfully');
    console.log('   ✅ assist method exists');
    passed++;
  } else {
    console.log('   ❌ Code Assistant missing assist method');
    failed++;
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  failed++;
}

// Test 5: Email Agent
console.log('\n5️⃣ Testing Email Agent...');
try {
  const EmailAgent = require('./agents/email-agent-pro.js');
  if (EmailAgent && typeof EmailAgent.summarizeUnread === 'function') {
    console.log('   ✅ Email Agent loaded successfully');
    console.log('   ✅ summarizeUnread method exists');
    passed++;
  } else {
    console.log('   ❌ Email Agent missing summarizeUnread method');
    failed++;
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  failed++;
}

// Test 6: Calendar Agent
console.log('\n6️⃣ Testing Calendar Agent...');
try {
  const CalendarAgent = require('./agents/calendar-agent-pro.js');
  if (CalendarAgent && typeof CalendarAgent.todayAgenda === 'function') {
    console.log('   ✅ Calendar Agent loaded successfully');
    console.log('   ✅ todayAgenda method exists');
    passed++;
  } else {
    console.log('   ❌ Calendar Agent missing todayAgenda method');
    failed++;
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  failed++;
}

// Test 7: Intelligent Router
console.log('\n7️⃣ Testing Intelligent Router...');
try {
  const Router = require('./ai-core/intelligent-router-pro.js');
  if (Router && typeof Router.route === 'function') {
    console.log('   ✅ Intelligent Router loaded successfully');
    console.log('   ✅ route method exists');
    passed++;
  } else {
    console.log('   ❌ Router missing route method');
    failed++;
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  failed++;
}

// Test 8: Budget Guardian
console.log('\n8️⃣ Testing Budget Guardian...');
try {
  const BudgetGuardian = require('./monitoring/budget-guardian.js');
  if (BudgetGuardian && typeof BudgetGuardian.checkAndRecord === 'function') {
    console.log('   ✅ Budget Guardian loaded successfully');
    console.log('   ✅ checkAndRecord method exists');
    passed++;
  } else {
    console.log('   ❌ Budget Guardian missing checkAndRecord method');
    failed++;
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  failed++;
}

// Test 9: Mega Cache
console.log('\n9️⃣ Testing Mega Cache...');
try {
  const MegaCache = require('./optimization/mega-cache.js');
  if (MegaCache && typeof MegaCache.get === 'function') {
    console.log('   ✅ Mega Cache loaded successfully');
    console.log('   ✅ get method exists');
    passed++;
  } else {
    console.log('   ❌ Mega Cache missing get method');
    failed++;
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  failed++;
}

// Test 10: Agent Registry
console.log('\n🔟 Testing Agent Registry...');
try {
  const fs = require('fs');
  const path = require('path');
  const registryPath = path.join(__dirname, './config/agents-registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  console.log(`   ✅ Registry loaded (${Object.keys(registry).length} agents)`);
  passed++;
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  failed++;
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log('📊 TEST RESULTS\n');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! System is ready!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please fix the issues above.\n');
  process.exit(1);
}
