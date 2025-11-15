#!/usr/bin/env node

/**
 * Phone Storage Synchronization Manager
 *
 * Manages bidirectional sync between user's phone (Telegram) and server RAM cache:
 * - Load files from Telegram into RAM
 * - Track changes (dirty flag)
 * - Delta sync (only changes)
 * - Auto-expiry (6h cache timeout)
 * - Conflict resolution
 * - Backup management
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// In-memory cache (cleared on restart or after 6h)
const MEMORY_CACHE = {
  profile: null,
  memory: null,
  contacts: null,
  habits: null,
  metadata: {
    loaded_at: null,
    expires_at: null,
    dirty: {},
    checksums: {},
    last_sync: null
  }
};

const CONFIG = {
  CACHE_EXPIRY_HOURS: 6,
  CACHE_DIR: path.join(__dirname, '../../.cache/phone-storage'),
  BACKUP_DIR: path.join(__dirname, '../../.cache/phone-storage/backups'),
  AUTO_SYNC_INTERVAL_HOURS: 1,
  FILES: {
    profile: 'my-profile.json',
    memory: 'my-memory.json',
    contacts: 'my-contacts.json',
    habits: 'my-habits.json'
  }
};

/**
 * Calculate file checksum
 */
function calculateChecksum(data) {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(json).digest('hex');
}

/**
 * Check if cache is expired
 */
function isCacheExpired() {
  if (!MEMORY_CACHE.metadata.expires_at) {
    return true;
  }
  return new Date() > new Date(MEMORY_CACHE.metadata.expires_at);
}

/**
 * Check if cache is loaded
 */
function isCacheLoaded() {
  return MEMORY_CACHE.metadata.loaded_at !== null && !isCacheExpired();
}

/**
 * Clear RAM cache
 */
function clearCache() {
  MEMORY_CACHE.profile = null;
  MEMORY_CACHE.memory = null;
  MEMORY_CACHE.contacts = null;
  MEMORY_CACHE.habits = null;
  MEMORY_CACHE.metadata = {
    loaded_at: null,
    expires_at: null,
    dirty: {},
    checksums: {},
    last_sync: null
  };
  console.log('🗑️  RAM cache cleared');
}

/**
 * Load file into RAM cache
 */
async function loadFile(fileType, filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);

    // Validate structure
    const { validateJSONFile } = require('./init-storage');
    const filename = CONFIG.FILES[fileType];
    validateJSONFile(filename, data);

    // Calculate checksum
    const checksum = calculateChecksum(data);

    // Store in RAM
    MEMORY_CACHE[fileType] = data;
    MEMORY_CACHE.metadata.checksums[fileType] = checksum;
    MEMORY_CACHE.metadata.dirty[fileType] = false;

    console.log(`✅ Loaded ${fileType}: ${filename}`);

    return { success: true, data, checksum };
  } catch (error) {
    console.error(`❌ Failed to load ${fileType}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Load all files from cache directory into RAM
 */
async function loadAllFiles() {
  console.log('📥 Loading files into RAM cache...');

  const results = {};

  for (const [fileType, filename] of Object.entries(CONFIG.FILES)) {
    const filePath = path.join(CONFIG.CACHE_DIR, filename);

    try {
      await fs.access(filePath);
      results[fileType] = await loadFile(fileType, filePath);
    } catch (error) {
      console.log(`⚠️  ${filename} not found in cache (use init-storage.js first)`);
      results[fileType] = { success: false, error: 'File not found' };
    }
  }

  // Set cache metadata
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CONFIG.CACHE_EXPIRY_HOURS * 60 * 60 * 1000);

  MEMORY_CACHE.metadata.loaded_at = now.toISOString();
  MEMORY_CACHE.metadata.expires_at = expiresAt.toISOString();
  MEMORY_CACHE.metadata.last_sync = now.toISOString();

  console.log(`✅ Cache loaded. Expires at: ${expiresAt.toLocaleString()}`);

  return results;
}

/**
 * Get data from cache
 */
function getData(fileType) {
  if (!isCacheLoaded()) {
    throw new Error('Cache not loaded or expired. Load files first.');
  }

  if (!MEMORY_CACHE[fileType]) {
    throw new Error(`${fileType} not loaded in cache`);
  }

  return MEMORY_CACHE[fileType];
}

/**
 * Update data in cache (marks as dirty)
 */
function updateData(fileType, updates, merge = true) {
  if (!isCacheLoaded()) {
    throw new Error('Cache not loaded or expired. Load files first.');
  }

  if (!MEMORY_CACHE[fileType]) {
    throw new Error(`${fileType} not loaded in cache`);
  }

  // Update data
  if (merge) {
    MEMORY_CACHE[fileType] = {
      ...MEMORY_CACHE[fileType],
      ...updates,
      last_updated: new Date().toISOString()
    };
  } else {
    MEMORY_CACHE[fileType] = {
      ...updates,
      last_updated: new Date().toISOString()
    };
  }

  // Mark as dirty
  MEMORY_CACHE.metadata.dirty[fileType] = true;

  console.log(`📝 Updated ${fileType} (marked dirty for sync)`);

  return MEMORY_CACHE[fileType];
}

/**
 * Deep merge objects (for nested updates)
 */
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

/**
 * Update nested field in cache
 */
function updateNestedField(fileType, path, value) {
  const data = getData(fileType);

  const keys = path.split('.');
  let current = data;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;

  updateData(fileType, data, false);

  return data;
}

/**
 * Get list of dirty files
 */
function getDirtyFiles() {
  return Object.entries(MEMORY_CACHE.metadata.dirty)
    .filter(([_, isDirty]) => isDirty)
    .map(([fileType, _]) => fileType);
}

/**
 * Save file to cache directory
 */
async function saveFile(fileType) {
  const data = getData(fileType);
  const filename = CONFIG.FILES[fileType];
  const filePath = path.join(CONFIG.CACHE_DIR, filename);

  await fs.writeFile(filePath, JSON.stringify(data, null, 2));

  // Update checksum
  const checksum = calculateChecksum(data);
  MEMORY_CACHE.metadata.checksums[fileType] = checksum;
  MEMORY_CACHE.metadata.dirty[fileType] = false;

  console.log(`💾 Saved ${fileType} to cache: ${filename}`);

  return { filePath, checksum };
}

/**
 * Save all dirty files
 */
async function saveDirtyFiles() {
  const dirty = getDirtyFiles();

  if (dirty.length === 0) {
    console.log('✅ No changes to save');
    return [];
  }

  console.log(`💾 Saving ${dirty.length} file(s)...`);

  const results = [];
  for (const fileType of dirty) {
    try {
      const result = await saveFile(fileType);
      results.push({ fileType, success: true, ...result });
    } catch (error) {
      console.error(`❌ Failed to save ${fileType}:`, error.message);
      results.push({ fileType, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Create backup of current cache
 */
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupSubDir = path.join(CONFIG.BACKUP_DIR, timestamp);

  await fs.mkdir(backupSubDir, { recursive: true });

  console.log(`📦 Creating backup: ${timestamp}`);

  const results = [];

  for (const [fileType, filename] of Object.entries(CONFIG.FILES)) {
    if (MEMORY_CACHE[fileType]) {
      const backupPath = path.join(backupSubDir, filename);
      await fs.writeFile(backupPath, JSON.stringify(MEMORY_CACHE[fileType], null, 2));
      results.push({ fileType, path: backupPath });
      console.log(`   ✅ ${filename}`);
    }
  }

  return { timestamp, path: backupSubDir, files: results };
}

/**
 * Get sync status
 */
function getSyncStatus() {
  return {
    loaded: isCacheLoaded(),
    loaded_at: MEMORY_CACHE.metadata.loaded_at,
    expires_at: MEMORY_CACHE.metadata.expires_at,
    last_sync: MEMORY_CACHE.metadata.last_sync,
    dirty_files: getDirtyFiles(),
    files_loaded: Object.keys(CONFIG.FILES).filter(type => MEMORY_CACHE[type] !== null),
    cache_expired: isCacheExpired()
  };
}

/**
 * Generate delta (changes only)
 */
function generateDelta(fileType, previousChecksum) {
  const currentData = getData(fileType);
  const currentChecksum = calculateChecksum(currentData);

  if (currentChecksum === previousChecksum) {
    return { hasChanges: false, delta: null };
  }

  // For now, return full data (delta compression can be added later)
  return {
    hasChanges: true,
    delta: currentData,
    checksum: currentChecksum,
    previous_checksum: previousChecksum
  };
}

/**
 * Sync cycle: save dirty files and prepare for sending to Telegram
 */
async function syncCycle() {
  console.log('\n🔄 Starting sync cycle...');

  if (!isCacheLoaded()) {
    console.log('⚠️  Cache not loaded. Skipping sync.');
    return { success: false, reason: 'cache_not_loaded' };
  }

  const dirty = getDirtyFiles();

  if (dirty.length === 0) {
    console.log('✅ No changes to sync');
    return { success: true, changed: false, files: [] };
  }

  // Create backup before sync
  const backup = await createBackup();

  // Save dirty files to cache
  const saved = await saveDirtyFiles();

  // Update last sync time
  MEMORY_CACHE.metadata.last_sync = new Date().toISOString();

  console.log('✅ Sync cycle complete');

  return {
    success: true,
    changed: true,
    files: saved,
    backup: backup
  };
}

/**
 * Auto-expiry check (call this periodically)
 */
function checkExpiry() {
  if (isCacheLoaded() && isCacheExpired()) {
    console.log('⏰ Cache expired. Clearing RAM...');
    clearCache();
    return { expired: true, cleared: true };
  }
  return { expired: false, cleared: false };
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  const stats = {
    loaded: isCacheLoaded(),
    expired: isCacheExpired(),
    files: {}
  };

  for (const fileType of Object.keys(CONFIG.FILES)) {
    if (MEMORY_CACHE[fileType]) {
      const json = JSON.stringify(MEMORY_CACHE[fileType]);
      stats.files[fileType] = {
        loaded: true,
        size_bytes: Buffer.byteLength(json, 'utf8'),
        size_kb: (Buffer.byteLength(json, 'utf8') / 1024).toFixed(2),
        checksum: MEMORY_CACHE.metadata.checksums[fileType],
        dirty: MEMORY_CACHE.metadata.dirty[fileType]
      };
    } else {
      stats.files[fileType] = { loaded: false };
    }
  }

  return stats;
}

/**
 * Initialize sync manager
 */
async function initialize() {
  console.log('🚀 Initializing Sync Manager...');

  // Ensure directories exist
  await fs.mkdir(CONFIG.CACHE_DIR, { recursive: true });
  await fs.mkdir(CONFIG.BACKUP_DIR, { recursive: true });

  console.log('✅ Sync Manager ready');

  return { success: true };
}

// Export functions
module.exports = {
  // Core functions
  loadAllFiles,
  getData,
  updateData,
  updateNestedField,
  saveFile,
  saveDirtyFiles,

  // Sync functions
  syncCycle,
  createBackup,
  generateDelta,

  // Status functions
  getSyncStatus,
  getCacheStats,
  getDirtyFiles,
  isCacheLoaded,
  isCacheExpired,

  // Utility functions
  clearCache,
  checkExpiry,
  initialize,
  deepMerge,

  // Direct cache access (use with caution)
  MEMORY_CACHE,
  CONFIG
};

// Auto-expiry check every 10 minutes
setInterval(() => {
  checkExpiry();
}, 10 * 60 * 1000);

// CLI usage
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    await initialize();

    switch (command) {
      case 'load':
        await loadAllFiles();
        console.log('\n📊 Status:', getSyncStatus());
        break;

      case 'status':
        console.log('📊 Sync Status:', JSON.stringify(getSyncStatus(), null, 2));
        console.log('\n💾 Cache Stats:', JSON.stringify(getCacheStats(), null, 2));
        break;

      case 'sync':
        await loadAllFiles();
        const result = await syncCycle();
        console.log('\n🔄 Sync Result:', JSON.stringify(result, null, 2));
        break;

      case 'clear':
        clearCache();
        console.log('✅ Cache cleared');
        break;

      case 'backup':
        await loadAllFiles();
        const backup = await createBackup();
        console.log('\n📦 Backup created:', backup.path);
        break;

      default:
        console.log(`
Usage: node sync-manager.js <command>

Commands:
  load      Load files from cache into RAM
  status    Show sync status and cache stats
  sync      Run sync cycle (save dirty files)
  clear     Clear RAM cache
  backup    Create backup of current cache

Examples:
  node sync-manager.js load
  node sync-manager.js status
  node sync-manager.js sync
        `);
    }
  })().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}
