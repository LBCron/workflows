#!/usr/bin/env node

/**
 * JSON Validator
 *
 * Validates syntax and structure of all JSON files in the project
 */

const fs = require('fs');
const path = require('path');

function findJSONFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);

    // Skip node_modules, .cache, logs
    if (filepath.includes('node_modules') ||
        filepath.includes('.cache') ||
        filepath.includes('logs') ||
        filepath.includes('.git')) {
      continue;
    }

    if (stat.isDirectory()) {
      findJSONFiles(filepath, fileList);
    } else if (file.endsWith('.json')) {
      fileList.push(filepath);
    }
  }

  return fileList;
}

function validateJSON(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');

    // Check for common JSON errors
    if (content.trim().length === 0) {
      return { valid: false, error: 'File is empty' };
    }

    if (content.includes('undefined')) {
      return { valid: false, error: 'Contains "undefined" (invalid in JSON)' };
    }

    if (content.includes('NaN')) {
      return { valid: false, error: 'Contains "NaN" (invalid in JSON)' };
    }

    // Attempt to parse
    const parsed = JSON.parse(content);

    // Additional checks
    const issues = [];

    // Check for common template fields
    if (filepath.includes('phone-storage')) {
      if (!parsed.version) {
        issues.push('Missing "version" field');
      }
      if (!parsed.last_updated) {
        issues.push('Missing "last_updated" field');
      }
    }

    // Check for suspicious patterns
    if (JSON.stringify(parsed).includes('TODO')) {
      issues.push('Contains TODO markers');
    }

    if (JSON.stringify(parsed).includes('FIXME')) {
      issues.push('Contains FIXME markers');
    }

    return {
      valid: true,
      size: content.length,
      keys: Object.keys(parsed).length,
      issues: issues.length > 0 ? issues : null
    };

  } catch (error) {
    // Parse error details
    const match = error.message.match(/position (\d+)/);
    const position = match ? parseInt(match[1]) : null;

    let line = null;
    let column = null;

    if (position !== null) {
      const content = fs.readFileSync(filepath, 'utf8');
      const beforeError = content.substring(0, position);
      line = (beforeError.match(/\n/g) || []).length + 1;
      column = position - beforeError.lastIndexOf('\n');
    }

    return {
      valid: false,
      error: error.message,
      line,
      column
    };
  }
}

function validateAllJSON() {
  console.log('📋 Validating all JSON files...\n');

  const projectRoot = path.join(__dirname, '../..');
  const jsonFiles = findJSONFiles(projectRoot);

  const results = {
    valid: [],
    invalid: [],
    warnings: [],
    stats: {
      totalFiles: jsonFiles.length,
      totalSize: 0,
      filesChecked: 0
    }
  };

  for (const filepath of jsonFiles) {
    const relativePath = path.relative(projectRoot, filepath);
    results.stats.filesChecked++;

    const result = validateJSON(filepath);

    if (result.valid) {
      results.stats.totalSize += result.size;
      results.valid.push({
        path: relativePath,
        size: result.size,
        keys: result.keys
      });

      if (result.issues) {
        results.warnings.push({
          path: relativePath,
          issues: result.issues
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
  console.log('║            JSON VALIDATION RESULTS             ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  console.log(`📊 Statistics:`);
  console.log(`   Total files: ${results.stats.totalFiles}`);
  console.log(`   Valid: ${results.valid.length}`);
  console.log(`   Invalid: ${results.invalid.length}`);
  console.log(`   Warnings: ${results.warnings.length}`);
  console.log(`   Total size: ${(results.stats.totalSize / 1024).toFixed(2)} KB\n`);

  if (results.invalid.length > 0) {
    console.log('❌ INVALID JSON FILES:\n');
    for (const item of results.invalid) {
      console.log(`   ${item.path}`);
      console.log(`      Error: ${item.error}`);
      if (item.line) {
        console.log(`      Location: Line ${item.line}, Column ${item.column}`);
      }
    }
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    for (const item of results.warnings) {
      console.log(`   ${item.path}`);
      for (const issue of item.issues) {
        console.log(`      → ${issue}`);
      }
    }
    console.log('');
  }

  if (results.valid.length > 0 && results.invalid.length === 0) {
    console.log(`✅ All ${results.valid.length} JSON files are valid!\n`);
    return true;
  } else if (results.invalid.length > 0) {
    console.log(`❌ ${results.invalid.length} JSON file(s) have errors\n`);
    return false;
  }

  return true;
}

module.exports = { validateAllJSON, validateJSON, printResults };

// CLI usage
if (require.main === module) {
  const results = validateAllJSON();
  const success = printResults(results);
  process.exit(success ? 0 : 1);
}
