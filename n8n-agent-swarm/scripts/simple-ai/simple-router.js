#!/usr/bin/env node

/**
 * Simple Router - GPT-4 Mini + Cache + Budget
 *
 * Philosophie: Simple et efficace
 * - Cache first (70-80% hit rate = gratuit)
 * - Budget protection
 * - Un seul modèle (GPT-4 Mini)
 */

const gpt4Mini = require('./gpt4-mini-client');
const cache = require('../optimization/mega-cache');
const budgetGuard = require('../monitoring/budget-guardian');
const crypto = require('crypto');

class SimpleRouter {
  constructor() {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalCost: 0,
      totalDuration: 0
    };
  }

  async route(prompt, options = {}) {
    this.stats.totalRequests++;
    const startTime = Date.now();

    try {
      // 1. CACHE CHECK (priorité absolue)
      const cacheKey = this.generateCacheKey(prompt, options);
      const cached = await cache.get(cacheKey, options);

      if (cached) {
        console.log('💚 CACHE HIT - €0.00 - Instant');
        this.stats.cacheHits++;

        return {
          ...cached,
          cached: true,
          cost: 0,
          duration: Date.now() - startTime
        };
      }

      this.stats.cacheMisses++;

      // 2. ESTIMATION COÛT
      const estimatedCost = this.estimateCost(prompt, options);
      console.log(`💰 Coût estimé: €${estimatedCost.toFixed(6)}`);

      // 3. VÉRIFICATION BUDGET
      await budgetGuard.checkAndRecord(estimatedCost, {
        model: 'gpt-4o-mini',
        type: options.type || 'simple-router',
        prompt: prompt.substring(0, 100)
      });

      // 4. APPEL GPT-4 MINI
      console.log('🤖 GPT-4 Mini...');
      const result = await gpt4Mini.complete(prompt, options);

      const duration = Date.now() - startTime;
      this.stats.totalCost += result.cost;
      this.stats.totalDuration += duration;

      console.log(`✅ Complété en ${duration}ms - Coût réel: €${result.cost.toFixed(6)}`);

      // 5. MISE EN CACHE
      const ttl = this.calculateTTL(options);
      await cache.set(cacheKey, {
        content: result.content,
        model: result.model,
        tokens: result.tokens
      }, { ...options, ttl });

      return {
        content: result.content,
        cached: false,
        cost: result.cost,
        tokens: result.tokens,
        model: result.model,
        duration
      };

    } catch (error) {
      console.error('❌ Erreur router:', error.message);
      throw error;
    }
  }

  generateCacheKey(prompt, options) {
    // Normalise pour meilleur cache hit
    const normalized = prompt
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    const keyData = {
      prompt: normalized.substring(0, 200),
      temperature: options.temperature || 0.7,
      type: options.type || 'general'
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .substring(0, 16);
  }

  estimateCost(prompt, options) {
    // Estimation basée sur la taille
    const inputTokens = this.estimateTokens(prompt);
    const maxOutputTokens = options.maxTokens || 4000;

    // Pessimiste: on assume qu'on utilise tous les tokens de sortie
    const outputTokens = maxOutputTokens * 0.5; // En moyenne 50% utilisés

    return gpt4Mini.calculateCost(inputTokens, outputTokens);
  }

  estimateTokens(text) {
    // Approximation: 1 token ≈ 4 caractères (ou 1.3 token par mot)
    return Math.ceil(text.length / 4);
  }

  calculateTTL(options) {
    // TTL personnalisable
    if (options.ttl) return options.ttl;
    if (options.cacheTTL) return options.cacheTTL;

    // TTL adaptatif selon le type
    const ttlByType = {
      'research': 24 * 60 * 60 * 1000,   // 24h - facts don't change often
      'code': 24 * 60 * 60 * 1000,       // 24h - code patterns are stable
      'content': 6 * 60 * 60 * 1000,     // 6h - content generation
      'chat': 1 * 60 * 60 * 1000,        // 1h - conversational
      'news': 30 * 60 * 1000,            // 30min - time-sensitive
      'general': 12 * 60 * 60 * 1000     // 12h - default
    };

    return ttlByType[options.type] || ttlByType.general;
  }

  getStats() {
    const cacheRate = this.stats.totalRequests > 0
      ? ((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(1)
      : 0;

    const avgDuration = this.stats.totalRequests > 0
      ? Math.round(this.stats.totalDuration / this.stats.totalRequests)
      : 0;

    return {
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      cacheRate: parseFloat(cacheRate),
      cacheRateFormatted: cacheRate + '%',
      totalCost: this.stats.totalCost,
      totalCostFormatted: '€' + this.stats.totalCost.toFixed(6),
      avgDuration: avgDuration,
      avgCost: this.stats.cacheMisses > 0
        ? this.stats.totalCost / this.stats.cacheMisses
        : 0,
      avgCostFormatted: this.stats.cacheMisses > 0
        ? '€' + (this.stats.totalCost / this.stats.cacheMisses).toFixed(6)
        : '€0.000000'
    };
  }

  resetStats() {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalCost: 0,
      totalDuration: 0
    };
  }
}

// Singleton
const simpleRouter = new SimpleRouter();

module.exports = simpleRouter;

// CLI test
if (require.main === module) {
  (async () => {
    console.log('🧪 Testing Simple Router...\n');

    try {
      // Test 1: First call (cache miss)
      console.log('1️⃣ First call (should be cache miss)...');
      const result1 = await simpleRouter.route('Explain quantum computing in one sentence', {
        temperature: 0.7,
        maxTokens: 100,
        type: 'general'
      });
      console.log(`Response: ${result1.content.substring(0, 100)}...`);
      console.log(`Cached: ${result1.cached}, Cost: €${result1.cost.toFixed(6)}\n`);

      // Test 2: Same call (should be cache hit)
      console.log('2️⃣ Same call (should be cache hit)...');
      const result2 = await simpleRouter.route('Explain quantum computing in one sentence', {
        temperature: 0.7,
        maxTokens: 100,
        type: 'general'
      });
      console.log(`Cached: ${result2.cached}, Cost: €${result2.cost.toFixed(6)}\n`);

      // Stats
      console.log('📊 Router Stats:');
      console.log(JSON.stringify(simpleRouter.getStats(), null, 2));

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  })();
}
