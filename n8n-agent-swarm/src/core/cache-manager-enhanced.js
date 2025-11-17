/**
 * Cache Manager Enhanced v2.0
 *
 * Features:
 * - Cache intelligent multi-niveaux (Memory + Disk)
 * - TTL configurable par type
 * - Stratégies d'éviction (LRU, LFU)
 * - Stats en temps réel
 * - Compression automatique
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger/logger');

class CacheManagerEnhanced {
  constructor() {
    this.cachePath = path.join(__dirname, '../../.cache');

    // Cache L1: Mémoire (rapide)
    this.memoryCache = new Map();

    // Cache L2: Disk (persistent)
    this.diskCache = new Map();

    // Metadata
    this.metadata = new Map(); // key → { hits, lastAccess, size, ttl, created }

    // Configuration
    this.config = {
      maxMemorySize: 100 * 1024 * 1024, // 100MB
      maxDiskSize: 1024 * 1024 * 1024, // 1GB
      defaultTTL: 3600 * 1000, // 1h
      evictionStrategy: 'LRU', // LRU, LFU, FIFO
      compressionEnabled: true,
      persistentEnabled: true
    };

    // Stats
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryUsage: 0,
      diskUsage: 0
    };

    // TTL par type de données
    this.ttlByType = {
      'conversation': 7 * 24 * 3600 * 1000, // 7 jours
      'user_profile': 24 * 3600 * 1000, // 24h
      'api_response': 3600 * 1000, // 1h
      'search_result': 30 * 60 * 1000, // 30min
      'session': 3600 * 1000, // 1h
      'default': 3600 * 1000 // 1h
    };

    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.cachePath, { recursive: true });

      // Charger cache depuis disque
      if (this.config.persistentEnabled) {
        await this.loadFromDisk();
      }

      // Scheduler pour nettoyage
      this.startCleanupScheduler();

      logger.info('🚀 Cache Manager Enhanced initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Cache Manager:', error);
    }
  }

  /**
   * Get from cache (L1 → L2)
   */
  async get(key, type = 'default') {
    try {
      // Check L1 (Memory)
      if (this.memoryCache.has(key)) {
        const entry = this.memoryCache.get(key);

        // Check TTL
        if (this.isExpired(key)) {
          await this.delete(key);
          this.stats.misses++;
          return null;
        }

        // Update metadata
        this.updateMetadata(key, 'hit');

        this.stats.hits++;
        return this.decompress(entry.value);
      }

      // Check L2 (Disk)
      if (this.config.persistentEnabled && await this.existsOnDisk(key)) {
        const value = await this.loadFromDiskKey(key);

        if (value !== null) {
          // Promote to L1
          await this.set(key, value, type);

          this.stats.hits++;
          return value;
        }
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      logger.error(`❌ Cache get error for key ${key}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set in cache (L1 + L2)
   */
  async set(key, value, type = 'default', customTTL = null) {
    try {
      const ttl = customTTL || this.ttlByType[type] || this.config.defaultTTL;

      const entry = {
        value: this.compress(value),
        type,
        created: Date.now(),
        expires: Date.now() + ttl
      };

      // Set in L1 (Memory)
      this.memoryCache.set(key, entry);

      // Init metadata
      this.metadata.set(key, {
        hits: 0,
        lastAccess: Date.now(),
        size: this.getSize(entry.value),
        ttl,
        created: Date.now(),
        type
      });

      // Update memory usage
      this.updateMemoryUsage();

      // Evict if necessary
      if (this.stats.memoryUsage > this.config.maxMemorySize) {
        await this.evict('memory');
      }

      // Set in L2 (Disk) si persistent
      if (this.config.persistentEnabled) {
        await this.saveToDisk(key, entry);
      }

      this.stats.sets++;

      return true;
    } catch (error) {
      logger.error(`❌ Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete from cache
   */
  async delete(key) {
    try {
      // Delete from L1
      this.memoryCache.delete(key);
      this.metadata.delete(key);

      // Delete from L2
      if (this.config.persistentEnabled) {
        await this.deleteFromDisk(key);
      }

      this.stats.deletes++;
      this.updateMemoryUsage();

      return true;
    } catch (error) {
      logger.error(`❌ Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  has(key) {
    return this.memoryCache.has(key);
  }

  /**
   * Clear cache
   */
  async clear(type = null) {
    try {
      if (type) {
        // Clear specific type
        const keys = Array.from(this.memoryCache.keys()).filter(key => {
          const meta = this.metadata.get(key);
          return meta && meta.type === type;
        });

        for (const key of keys) {
          await this.delete(key);
        }

        logger.info(`🧹 Cache cleared for type: ${type}`);
      } else {
        // Clear all
        this.memoryCache.clear();
        this.metadata.clear();

        if (this.config.persistentEnabled) {
          await this.clearDisk();
        }

        this.stats.memoryUsage = 0;
        this.stats.diskUsage = 0;

        logger.info('🧹 Cache completely cleared');
      }

      return true;
    } catch (error) {
      logger.error('❌ Cache clear error:', error);
      return false;
    }
  }

  /**
   * Evict entries based on strategy
   */
  async evict(level = 'memory') {
    try {
      let keysToEvict = [];

      if (this.config.evictionStrategy === 'LRU') {
        // Least Recently Used
        keysToEvict = Array.from(this.metadata.entries())
          .sort((a, b) => a[1].lastAccess - b[1].lastAccess)
          .slice(0, 10)
          .map(([key]) => key);
      } else if (this.config.evictionStrategy === 'LFU') {
        // Least Frequently Used
        keysToEvict = Array.from(this.metadata.entries())
          .sort((a, b) => a[1].hits - b[1].hits)
          .slice(0, 10)
          .map(([key]) => key);
      } else {
        // FIFO
        keysToEvict = Array.from(this.metadata.entries())
          .sort((a, b) => a[1].created - b[1].created)
          .slice(0, 10)
          .map(([key]) => key);
      }

      for (const key of keysToEvict) {
        if (level === 'memory') {
          // Move to L2 instead of deleting
          if (this.config.persistentEnabled) {
            const entry = this.memoryCache.get(key);
            if (entry) {
              await this.saveToDisk(key, entry);
            }
          }

          this.memoryCache.delete(key);
        } else {
          await this.delete(key);
        }

        this.stats.evictions++;
      }

      this.updateMemoryUsage();

      logger.info(`🗑️ Evicted ${keysToEvict.length} entries (${this.config.evictionStrategy})`);
    } catch (error) {
      logger.error('❌ Eviction error:', error);
    }
  }

  /**
   * Check if entry is expired
   */
  isExpired(key) {
    const entry = this.memoryCache.get(key);
    if (!entry) return true;

    return Date.now() > entry.expires;
  }

  /**
   * Update metadata on access
   */
  updateMetadata(key, action = 'hit') {
    const meta = this.metadata.get(key);

    if (meta) {
      meta.hits++;
      meta.lastAccess = Date.now();
      this.metadata.set(key, meta);
    }
  }

  /**
   * Compress value
   */
  compress(value) {
    if (!this.config.compressionEnabled) {
      return value;
    }

    // Simple compression: JSON stringify
    return JSON.stringify(value);
  }

  /**
   * Decompress value
   */
  decompress(value) {
    if (!this.config.compressionEnabled) {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * Get size of value
   */
  getSize(value) {
    return Buffer.byteLength(typeof value === 'string' ? value : JSON.stringify(value));
  }

  /**
   * Update memory usage stats
   */
  updateMemoryUsage() {
    let total = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      const meta = this.metadata.get(key);
      if (meta) {
        total += meta.size;
      }
    }

    this.stats.memoryUsage = total;
  }

  /**
   * Save to disk (L2)
   */
  async saveToDisk(key, entry) {
    try {
      const filename = this.getKeyFilename(key);
      const filepath = path.join(this.cachePath, filename);

      await fs.writeFile(filepath, JSON.stringify(entry), 'utf8');

      this.diskCache.set(key, filename);
    } catch (error) {
      logger.error(`❌ Failed to save to disk: ${key}`, error);
    }
  }

  /**
   * Load from disk (L2)
   */
  async loadFromDiskKey(key) {
    try {
      const filename = this.getKeyFilename(key);
      const filepath = path.join(this.cachePath, filename);

      const content = await fs.readFile(filepath, 'utf8');
      const entry = JSON.parse(content);

      // Check TTL
      if (Date.now() > entry.expires) {
        await this.deleteFromDisk(key);
        return null;
      }

      return this.decompress(entry.value);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if key exists on disk
   */
  async existsOnDisk(key) {
    try {
      const filename = this.getKeyFilename(key);
      const filepath = path.join(this.cachePath, filename);

      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete from disk
   */
  async deleteFromDisk(key) {
    try {
      const filename = this.getKeyFilename(key);
      const filepath = path.join(this.cachePath, filename);

      await fs.unlink(filepath);
      this.diskCache.delete(key);
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Load all from disk on startup
   */
  async loadFromDisk() {
    try {
      const files = await fs.readdir(this.cachePath);

      logger.info(`📦 Loading ${files.length} cache files from disk...`);

      let loaded = 0;

      for (const file of files) {
        if (file.endsWith('.cache')) {
          const key = file.replace('.cache', '');
          this.diskCache.set(key, file);
          loaded++;
        }
      }

      logger.info(`✅ Loaded ${loaded} cache entries from disk`);
    } catch (error) {
      logger.error('❌ Failed to load from disk:', error);
    }
  }

  /**
   * Clear disk cache
   */
  async clearDisk() {
    try {
      const files = await fs.readdir(this.cachePath);

      for (const file of files) {
        await fs.unlink(path.join(this.cachePath, file));
      }

      this.diskCache.clear();
    } catch (error) {
      logger.error('❌ Failed to clear disk:', error);
    }
  }

  /**
   * Get filename for key
   */
  getKeyFilename(key) {
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return `${hash}.cache`;
  }

  /**
   * Start cleanup scheduler
   */
  startCleanupScheduler() {
    // Cleanup every 10 minutes
    setInterval(async () => {
      await this.cleanupExpired();
    }, 10 * 60 * 1000);
  }

  /**
   * Cleanup expired entries
   */
  async cleanupExpired() {
    try {
      const keys = Array.from(this.memoryCache.keys());
      let cleaned = 0;

      for (const key of keys) {
        if (this.isExpired(key)) {
          await this.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.info(`🧹 Cleaned ${cleaned} expired cache entries`);
      }
    } catch (error) {
      logger.error('❌ Cleanup error:', error);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%'
      : 'N/A';

    return {
      ...this.stats,
      hitRate,
      entriesInMemory: this.memoryCache.size,
      entriesOnDisk: this.diskCache.size,
      memoryUsageMB: (this.stats.memoryUsage / 1024 / 1024).toFixed(2),
      config: this.config
    };
  }

  /**
   * Configure
   */
  configure(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };

    logger.info('⚙️ Cache Manager configuration updated');
  }
}

// Export singleton instance
let cacheInstance = null;

function getCacheManagerInstance() {
  if (!cacheInstance) {
    cacheInstance = new CacheManagerEnhanced();
  }
  return cacheInstance;
}

module.exports = {
  CacheManagerEnhanced,
  getCacheManagerInstance
};
