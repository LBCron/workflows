/**
 * Unit Test: Email Agent
 *
 * This test verifies the Email Agent configuration, prompts, and tools.
 */

const fs = require('fs');
const path = require('path');

// Test framework (simple assertion-based)
class TestRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.results = { passed: 0, failed: 0 };
  }

  test(description, fn) {
    this.tests.push({ description, fn });
  }

  async run() {
    console.log(`\n🧪 Running: ${this.name}`);
    console.log('─'.repeat(60));

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`  ✅ ${test.description}`);
        this.results.passed++;
      } catch (error) {
        console.log(`  ❌ ${test.description}`);
        console.log(`     Error: ${error.message}`);
        this.results.failed++;
      }
    }

    console.log(`\n  Results: ${this.results.passed} passed, ${this.results.failed} failed`);

    if (this.results.failed > 0) {
      throw new Error(`${this.results.failed} test(s) failed`);
    }
  }
}

// Helper: assert function
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertContains(text, substring, message) {
  if (!text.includes(substring)) {
    throw new Error(message || `Expected text to contain "${substring}"`);
  }
}

// Load agent configuration
function loadAgentConfig() {
  const configPath = path.join(__dirname, '../../agent-configs/email-agent.md');
  if (!fs.existsSync(configPath)) {
    throw new Error('Email agent config not found');
  }
  return fs.readFileSync(configPath, 'utf8');
}

// Tests
const runner = new TestRunner('Email Agent Unit Tests');

runner.test('Agent config file exists', () => {
  const configPath = path.join(__dirname, '../../agent-configs/email-agent.md');
  assert(fs.existsSync(configPath), 'Email agent config file should exist');
});

runner.test('Config contains system prompt', () => {
  const config = loadAgentConfig();
  assertContains(config, '## System Prompt', 'Config should have system prompt section');
  assertContains(config, '```', 'System prompt should be in code block');
});

runner.test('System prompt mentions email capabilities', () => {
  const config = loadAgentConfig();
  assertContains(config, 'email', 'Prompt should mention email');
  assertContains(config, 'send', 'Prompt should mention send capability');
  assertContains(config, 'read', 'Prompt should mention read capability');
});

runner.test('Config defines tools', () => {
  const config = loadAgentConfig();
  assertContains(config, '## Tools', 'Config should have tools section');
});

runner.test('Config has examples', () => {
  const config = loadAgentConfig();
  const hasExamples = config.includes('Example') || config.includes('example');
  assert(hasExamples, 'Config should contain usage examples');
});

runner.test('System prompt is not too long', () => {
  const config = loadAgentConfig();
  const promptMatch = config.match(/## System Prompt\s*\n\s*```([\s\S]*?)```/);

  if (promptMatch) {
    const prompt = promptMatch[1];
    const tokenEstimate = Math.ceil(prompt.length / 4);

    assert(tokenEstimate < 3000, `Prompt too long: ${tokenEstimate} tokens (should be < 3000)`);
  }
});

runner.test('Config has error handling guidance', () => {
  const config = loadAgentConfig();
  const hasErrorHandling = config.toLowerCase().includes('error') ||
                          config.toLowerCase().includes('fail');

  assert(hasErrorHandling, 'Config should mention error handling');
});

runner.test('Prompt includes Gmail API guidance', () => {
  const config = loadAgentConfig();
  assertContains(config.toLowerCase(), 'gmail', 'Prompt should mention Gmail');
});

// Run all tests
if (require.main === module) {
  runner.run().catch(error => {
    console.error(`\n❌ Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = runner;
