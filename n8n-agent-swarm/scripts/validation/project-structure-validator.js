#!/usr/bin/env node

/**
 * Project Structure Validator
 *
 * Validates that all required files exist and are properly structured
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = {
  // Core configuration
  'package.json': 'npm configuration',
  '.env.example': 'Environment variables template',
  'docker-compose.yml': 'Docker configuration',
  'fly.toml': 'Fly.io configuration',
  'README.md': 'Main documentation',

  // Agent configurations
  'agent-configs/memory-agent.md': 'Memory agent config',

  // Templates
  'templates/phone-storage/my-profile.json': 'Profile template',
  'templates/phone-storage/my-memory.json': 'Memory template',
  'templates/phone-storage/my-contacts.json': 'Contacts template',
  'templates/phone-storage/my-habits.json': 'Habits template',

  // Core scripts
  'scripts/phone-storage/init-storage.js': 'Storage initialization',
  'scripts/phone-storage/sync-manager.js': 'Sync manager',
  'scripts/phone-storage/telegram-file-handler.js': 'Telegram file handler',
  'scripts/phone-storage/test-system.js': 'Phone storage tests',

  // Advanced systems
  'scripts/ai-router/intelligent-model-router.js': 'Multi-model router',
  'scripts/context/advanced-context-engine.js': 'Context engine',
  'scripts/predictive/anticipation-engine.js': 'Predictive engine',

  // Documentation
  'docs/PHONE-STORAGE.md': 'Phone storage guide',
  'ANALYSE-COMPLETE.md': 'Complete analysis'
};

const REQUIRED_DIRECTORIES = [
  'agent-configs',
  'scripts/phone-storage',
  'scripts/ai-router',
  'scripts/context',
  'scripts/predictive',
  'templates/phone-storage',
  'docs',
  '.cache/phone-storage',
  '.cache/phone-storage/backups'
];

function validateStructure() {
  const results = {
    passed: [],
    failed: [],
    warnings: [],
    stats: {
      totalFiles: Object.keys(REQUIRED_FILES).length,
      totalDirs: REQUIRED_DIRECTORIES.length,
      filesChecked: 0,
      dirsChecked: 0
    }
  };

  console.log('📁 Validating project structure...\n');

  // Check files
  for (const [filepath, description] of Object.entries(REQUIRED_FILES)) {
    const fullPath = path.join(__dirname, '../..', filepath);
    results.stats.filesChecked++;

    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);

      if (stats.size === 0) {
        results.warnings.push({
          type: 'file',
          path: filepath,
          issue: 'File is empty',
          severity: 'medium'
        });
      } else if (stats.size < 100) {
        results.warnings.push({
          type: 'file',
          path: filepath,
          issue: `File very small (${stats.size} bytes)`,
          severity: 'low'
        });
      } else {
        results.passed.push({
          type: 'file',
          path: filepath,
          size: stats.size,
          description
        });
      }
    } else {
      results.failed.push({
        type: 'file',
        path: filepath,
        description,
        severity: 'critical'
      });
    }
  }

  // Check directories
  for (const dirpath of REQUIRED_DIRECTORIES) {
    const fullPath = path.join(__dirname, '../..', dirpath);
    results.stats.dirsChecked++;

    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        results.passed.push({
          type: 'directory',
          path: dirpath
        });
      } else {
        results.failed.push({
          type: 'directory',
          path: dirpath,
          issue: 'Not a directory',
          severity: 'critical'
        });
      }
    } else {
      // Try to create it
      try {
        fs.mkdirSync(fullPath, { recursive: true });
        results.warnings.push({
          type: 'directory',
          path: dirpath,
          issue: 'Created missing directory',
          severity: 'low'
        });
      } catch (error) {
        results.failed.push({
          type: 'directory',
          path: dirpath,
          issue: `Cannot create: ${error.message}`,
          severity: 'critical'
        });
      }
    }
  }

  return results;
}

function printResults(results) {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║         PROJECT STRUCTURE VALIDATION           ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  console.log(`📊 Statistics:`);
  console.log(`   Files checked: ${results.stats.filesChecked}`);
  console.log(`   Directories checked: ${results.stats.dirsChecked}`);
  console.log(`   Passed: ${results.passed.length}`);
  console.log(`   Failed: ${results.failed.length}`);
  console.log(`   Warnings: ${results.warnings.length}\n`);

  if (results.failed.length > 0) {
    console.log('❌ FAILED CHECKS:\n');
    for (const item of results.failed) {
      console.log(`   [${item.severity.toUpperCase()}] ${item.type}: ${item.path}`);
      if (item.description) console.log(`      → ${item.description}`);
      if (item.issue) console.log(`      → ${item.issue}`);
    }
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    for (const item of results.warnings) {
      console.log(`   [${item.severity.toUpperCase()}] ${item.type}: ${item.path}`);
      console.log(`      → ${item.issue}`);
    }
    console.log('');
  }

  const successRate = ((results.passed.length / (results.stats.filesChecked + results.stats.dirsChecked)) * 100).toFixed(1);

  if (results.failed.length === 0) {
    console.log(`✅ Structure validation PASSED (${successRate}% complete)\n`);
    return true;
  } else {
    console.log(`❌ Structure validation FAILED (${results.failed.length} critical issues)\n`);
    return false;
  }
}

module.exports = { validateStructure, printResults };

// CLI usage
if (require.main === module) {
  const results = validateStructure();
  const success = printResults(results);
  process.exit(success ? 0 : 1);
}
