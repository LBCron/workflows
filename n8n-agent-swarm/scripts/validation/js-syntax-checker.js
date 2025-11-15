#!/usr/bin/env node

/**
 * JavaScript Syntax Checker
 *
 * Validates syntax of all JavaScript files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filepath = path.join(dir, file);

    // Skip node_modules, .cache
    if (filepath.includes('node_modules') ||
        filepath.includes('.cache') ||
        filepath.includes('.git')) {
      continue;
    }

    const stat = fs.statSync(filepath);

    if (stat.isDirectory()) {
      findJSFiles(filepath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filepath);
    }
  }

  return fileList;
}

function checkSyntax(filepath) {
  try {
    // Use Node.js --check flag to verify syntax
    execSync(`node --check "${filepath}"`, { stdio: 'pipe' });

    // Get file stats
    const stats = fs.statSync(filepath);
    const content = fs.readFileSync(filepath, 'utf8');

    // Count lines
    const lines = content.split('\n').length;

    // Check for potential issues
    const warnings = [];

    if (content.includes('eval(')) {
      warnings.push('Uses eval() - potential security risk');
    }

    if (content.includes('Function(')) {
      warnings.push('Uses Function constructor - potential security risk');
    }

    if (!content.includes('use strict') && !content.includes('"use strict"')) {
      warnings.push('Missing "use strict" directive');
    }

    if (content.match(/console\.(log|debug|info)/g)) {
      const count = content.match(/console\.(log|debug|info)/g).length;
      if (count > 10) {
        warnings.push(`Many console.log statements (${count}) - consider using logger`);
      }
    }

    return {
      valid: true,
      size: stats.size,
      lines,
      warnings: warnings.length > 0 ? warnings : null
    };

  } catch (error) {
    // Parse error from Node.js output
    const errorOutput = error.stderr ? error.stderr.toString() : error.message;

    const lineMatch = errorOutput.match(/(\d+):(\d+)/);
    const line = lineMatch ? parseInt(lineMatch[1]) : null;
    const column = lineMatch ? parseInt(lineMatch[2]) : null;

    return {
      valid: false,
      error: errorOutput,
      line,
      column
    };
  }
}

function checkAllJS() {
  console.log('🔧 Checking JavaScript syntax...\n');

  const projectRoot = path.join(__dirname, '../..');
  const jsFiles = findJSFiles(projectRoot);

  const results = {
    valid: [],
    invalid: [],
    warnings: [],
    stats: {
      totalFiles: jsFiles.length,
      totalLines: 0,
      totalSize: 0,
      filesChecked: 0
    }
  };

  for (const filepath of jsFiles) {
    const relativePath = path.relative(projectRoot, filepath);
    results.stats.filesChecked++;

    const result = checkSyntax(filepath);

    if (result.valid) {
      results.stats.totalLines += result.lines;
      results.stats.totalSize += result.size;

      results.valid.push({
        path: relativePath,
        size: result.size,
        lines: result.lines
      });

      if (result.warnings) {
        results.warnings.push({
          path: relativePath,
          warnings: result.warnings
        });
      }
    } else {
      results.invalid.push({
        path: relativePath,
        error: result.error,
        line: result.line,
        column: result.column
      });
    }
  }

  return results;
}

function printResults(results) {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║        JAVASCRIPT SYNTAX VALIDATION            ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  console.log(`📊 Statistics:`);
  console.log(`   Total files: ${results.stats.totalFiles}`);
  console.log(`   Valid: ${results.valid.length}`);
  console.log(`   Invalid: ${results.invalid.length}`);
  console.log(`   Warnings: ${results.warnings.length}`);
  console.log(`   Total lines: ${results.stats.totalLines}`);
  console.log(`   Total size: ${(results.stats.totalSize / 1024).toFixed(2)} KB\n`);

  if (results.invalid.length > 0) {
    console.log('❌ SYNTAX ERRORS:\n');
    for (const item of results.invalid) {
      console.log(`   ${item.path}`);
      if (item.line) {
        console.log(`      Line ${item.line}:${item.column}`);
      }
      console.log(`      ${item.error.split('\n')[0]}`);
    }
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  CODE QUALITY WARNINGS:\n');
    for (const item of results.warnings) {
      console.log(`   ${item.path}`);
      for (const warning of item.warnings) {
        console.log(`      → ${warning}`);
      }
    }
    console.log('');
  }

  if (results.invalid.length === 0) {
    console.log(`✅ All ${results.valid.length} JavaScript files are syntactically correct!\n`);
    return true;
  } else {
    console.log(`❌ ${results.invalid.length} file(s) have syntax errors\n`);
    return false;
  }
}

module.exports = { checkAllJS, checkSyntax, printResults };

// CLI usage
if (require.main === module) {
  const results = checkAllJS();
  const success = printResults(results);
  process.exit(success ? 0 : 1);
}
