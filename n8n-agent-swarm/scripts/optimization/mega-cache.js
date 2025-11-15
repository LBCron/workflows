#!/usr/bin/env node

/**
 * Mega Cache - Système de Cache Ultra-Intelligent
 *
 * Cache sémantique avec:
 * - Hash normalisé (ignore variations mineures)
 * - TTL adaptatif
 * - LRU eviction
 * - Stats détaillées
 * - Objectif: 70-80% hit rate
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class MegaCache {
  constructor() {
    this.cachePath = path.join(__dirname, '../../.cache/mega-cache.json');
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };

    this.config = {
      maxEntries: 10000, // 10k entrées max
      defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 jours
      minTTL: 60 * 60 * 1000, // 1 heure min
      maxTTL: 30 * 24 * 60 * 60 * 1000 // 30 jours max
    };

    this.loaded = false;
  }

  /**
   * Load cache from disk
   */
  async load() {
    if (this.loaded) return;

    try {
      const content = await fs.readFile(this.cachePath, 'utf8');
      const data = JSON.parse(content);

      // Restore cache
      for (const [key, entry] of Object.entries(data.cache || {})) {
        // Check if expired
        if (!this.isExpired(entry)) {
          this.cache.set(key, entry);
        }
      }

      // Restore stats
      if (data.stats) {
        this.stats = { ...this.stats, ...data.stats };
      }

      console.log(`📦 Loaded ${this.cache.size} cache entries`);
    } catch (error) {
      console.log('📦 Initializing new cache');
    }

    this.loaded = true;
  }

  /**
   * Normalize prompt for better cache hits
   */
  normalize(prompt) {
    return prompt
      .toLowerCase()
      .trim()
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove punctuation at end
      .replace(/[.!?]+$/, '')
      // Remove common variations
      .replace(/s'il vous plaît|s'il te plaît|svp/gi, '')
      .replace(/merci|thanks/gi, '');
  }

  /**
   * Generate cache key
   */
  generateKey(prompt, options = {}) {
    const normalized = this.normalize(prompt);

    // Include relevant options in key
    const keyData = {
      prompt: normalized,
      temperature: options.temperature || 0.7,
      type: options.type || 'general'
    };

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');

    return hash.substring(0, 16); // Short hash
  }

  /**
   * Get from cache
   */
  async get(prompt, options = {}) {
    await this.load();

    const key = this.generateKey(prompt, options);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiry
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time and hit count
    entry.lastAccess = Date.now();
    entry.hitCount = (entry.hitCount || 0) + 1;

    this.stats.hits++;

    console.log(`💚 CACHE HIT (${this.getHitRate().toFixed(1)}% rate)`);

    return entry.value;
  }

  /**
   * Set cache entry
   */
  async set(prompt, value, options = {}) {
    await this.load();

    const key = this.generateKey(prompt, options);

    // Calculate TTL based on value quality/size
    const ttl = this.calculateTTL(value, options);

    const entry = {
      value,
      createdAt: Date.now(),
      lastAccess: Date.now(),
      expiresAt: Date.now() + ttl,
      hitCount: 0,
      prompt: prompt.substring(0, 100), // Store preview for debugging
      size: JSON.stringify(value).length
    };

    // Check if cache is full
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.stats.sets++;

    // Auto-save periodically
    if (this.stats.sets % 10 === 0) {
      await this.save();
    }
  }

  /**
   * Calculate TTL based on content
   */
  calculateTTL(value, options) {
    let ttl = this.config.defaultTTL;

    // Longer TTL for factual content
    if (options.factual || options.type === 'research') {
      ttl = this.config.maxTTL;
    }

    // Shorter TTL for time-sensitive content
    if (options.timeSensitive || options.type === 'news') {
      ttl = this.config.minTTL;
    }

    // Adjust based on size (larger = more valuable = longer TTL)
    const size = JSON.stringify(value).length;
    if (size > 10000) {
      ttl = Math.min(ttl * 1.5, this.config.maxTTL);
    }

    return ttl;
  }

  /**
   * Check if entry is expired
   */
  isExpired(entry) {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      console.log(`🗑️  Evicted LRU entry (${this.cache.size}/${this.config.maxEntries})`);
    }
  }

  /**
   * Get hit rate
   */
  getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return (this.stats.hits / total) * 100;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = this.getHitRate();

    // Calculate savings (assuming $0.01 avg per request without cache)
    const avgCostPerRequest = 0.001; // €0.001
    const savedRequests = this.stats.hits;
    const savedCost = savedRequests * avgCostPerRequest;

    // Size stats
    let totalSize = 0;
    let avgHitCount = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
      avgHitCount += entry.hitCount;
    }

    const avgSize = this.cache.size > 0 ? totalSize / this.cache.size : 0;
    avgHitCount = this.cache.size > 0 ? avgHitCount / this.cache.size : 0;

    return {
      size: this.cache.size,
      entries: this.cache.size,
      maxEntries: this.config.maxEntries,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      evictions: this.stats.evictions,
      hitRate: parseFloat(hitRate.toFixed(1)),
      hitRateFormatted: hitRate.toFixed(1) + '%',
      totalRequests: total,
      savedCost: `€${savedCost.toFixed(4)}`,
      avgSize: Math.round(avgSize),
      avgHitCount: avgHitCount.toFixed(1),
      sizeKB: (totalSize / 1024).toFixed(2)
    };
  }

  /**
   * Clear expired entries
   */
  cleanup() {
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} expired entries`);
    }

    return removed;
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️  Cleared ${size} cache entries`);
  }

  /**
   * Save cache to disk
   */
  async save() {
    try {
      // Cleanup first
      this.cleanup();

      const data = {
        version: '1.0.0',
        savedAt: new Date().toISOString(),
        stats: this.stats,
        cache: Object.fromEntries(this.cache)
      };

      await fs.mkdir(path.dirname(this.cachePath), { recursive: true });
      await fs.writeFile(this.cachePath, JSON.stringify(data, null, 2));

      console.log(`💾 Cache saved (${this.cache.size} entries, ${this.getHitRate().toFixed(1)}% hit rate)`);
    } catch (error) {
      console.error('Failed to save cache:', error.message);
    }
  }

  /**
   * Get most hit entries (popular cache entries)
   */
  getTopHits(limit = 10) {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        prompt: entry.prompt,
        hits: entry.hitCount,
        age: Math.round((Date.now() - entry.createdAt) / (1000 * 60 * 60 * 24)) // days
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }
}

// Singleton
const megaCache = new MegaCache();

module.exports = megaCache;

// CLI usage
if (require.main === module) {
  (async () => {
    const command = process.argv[2] || 'stats';

    switch (command) {
      case 'stats': {
        await megaCache.load();
        const stats = megaCache.getStats();
        console.log('\n📊 Cache Statistics:\n');
        console.log(JSON.stringify(stats, null, 2));
        break;
      }

      case 'top': {
        await megaCache.load();
        const top = megaCache.getTopHits();
        console.log('\n🔥 Top Cache Hits:\n');
        top.forEach((entry, i) => {
          console.log(`${i + 1}. "${entry.prompt}" - ${entry.hits} hits (${entry.age} days old)`);
        });
        break;
      }

      case 'cleanup': {
        await megaCache.load();
        const removed = megaCache.cleanup();
        console.log(`✅ Removed ${removed} expired entries`);
        await megaCache.save();
        break;
      }

      case 'clear': {
        await megaCache.load();
        megaCache.clear();
        await megaCache.save();
        console.log('✅ Cache cleared');
        break;
      }

      case 'save': {
        await megaCache.load();
        await megaCache.save();
        break;
      }

      case 'test': {
        console.log('\n🧪 Testing cache...\n');
        await megaCache.load();

        // Test set
        await megaCache.set('test prompt hello world', { result: 'test response' });
        console.log('✅ Set test entry');

        // Test get (should hit)
        const cached = await megaCache.get('test prompt hello world');
        console.log('✅ Get:', cached ? 'HIT' : 'MISS');

        // Test normalization (should also hit)
        const cached2 = await megaCache.get('TEST PROMPT HELLO WORLD!!!');
        console.log('✅ Normalized get:', cached2 ? 'HIT' : 'MISS');

        // Test stats
        const stats = megaCache.getStats();
        console.log('\nStats:', JSON.stringify(stats, null, 2));

        await megaCache.save();
        break;
      }

      default:
        console.log(`
Usage: node mega-cache.js <command>

Commands:
  stats    Show cache statistics
  top      Show most hit cache entries
  cleanup  Remove expired entries
  clear    Clear all cache
  save     Save cache to disk
  test     Run cache tests

Examples:
  node mega-cache.js stats
  node mega-cache.js top
        `);
    }
  })();
}
