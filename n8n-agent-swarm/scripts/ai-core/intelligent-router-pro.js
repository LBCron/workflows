#!/usr/bin/env node

/**
 * Intelligent Router PRO - Production Ready
 *
 * Router intelligent qui:
 * - Utilise Budget Guardian pour contrôle coûts
 * - Utilise Mega Cache pour économies
 * - Choisit le meilleur modèle automatiquement
 * - Fallback automatique si erreur
 * - Stats en temps réel
 */

const budgetGuardian = require('../monitoring/budget-guardian');
const megaCache = require('../optimization/mega-cache');
const { LLMClientFactory } = require('./llm-clients');

class IntelligentRouterPro {
  constructor() {
    this.models = {
      // GRATUIT ⭐
      'llama-3-70b': {
        provider: 'groq',
        model: 'llama-3-70b',
        cost: 0,
        speed: 10,
        quality: 7,
        context: 8192,
        bestFor: ['simple', 'chat', 'quick']
      },

      // TRÈS PAS CHER 💰
      'gpt-4o-mini': {
        provider: 'openai',
        model: 'gpt-4o-mini',
        cost: 0.0003,
        speed: 9,
        quality: 8,
        context: 128000,
        bestFor: ['medium', 'code', 'analysis', 'content']
      },

      'claude-3-haiku': {
        provider: 'anthropic',
        model: 'claude-3-haiku',
        cost: 0.0003,
        speed: 9,
        quality: 8,
        context: 200000,
        bestFor: ['writing', 'summarize', 'extract']
      },

      'gemini-flash': {
        provider: 'google',
        model: 'gemini-flash',
        cost: 0.0001,
        speed: 10,
        quality: 7.5,
        context: 1000000,
        bestFor: ['ultra-fast', 'long-context']
      },

      // PERFORMANCE 🚀
      'gpt-4-turbo': {
        provider: 'openai',
        model: 'gpt-4-turbo',
        cost: 0.01,
        speed: 7,
        quality: 9.5,
        context: 128000,
        bestFor: ['complex', 'reasoning', 'creative', 'multimodal']
      },

      'claude-3-sonnet': {
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        cost: 0.003,
        speed: 8,
        quality: 9.8,
        context: 200000,
        bestFor: ['analysis', 'code-complex', 'research', 'nuance']
      },

      // ULTRA PERFORMANCE (rare) 💎
      'claude-3-opus': {
        provider: 'anthropic',
        model: 'claude-3-opus',
        cost: 0.075,
        speed: 6,
        quality: 10,
        context: 200000,
        bestFor: ['critical', 'expert', 'strategic', 'high-stakes']
      }
    };

    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      byModel: {},
      totalCost: 0,
      totalSaved: 0
    };
  }

  /**
   * Main routing function
   */
  async route(prompt, options = {}) {
    this.stats.totalRequests++;

    // STEP 1: CHECK CACHE (priorité absolue - GRATUIT)
    const cached = await megaCache.get(prompt, options);
    if (cached) {
      this.stats.cacheHits++;
      this.stats.totalSaved += 0.001; // Économie estimée
      console.log(`💚 CACHE HIT (${this.getCacheRate()}% rate) - €0.00`);
      return {
        content: cached.content || cached,
        cached: true,
        cost: 0,
        model: 'cache'
      };
    }

    this.stats.cacheMisses++;

    // STEP 2: ANALYZE COMPLEXITY
    const complexity = this.analyzeComplexity(prompt, options);

    // STEP 3: GET BUDGET RECOMMENDATION
    const budgetRec = budgetGuardian.getRecommendation();

    // STEP 4: SELECT BEST MODEL
    const selected = this.selectModel(complexity, budgetRec, options);

    if (!selected) {
      throw new Error('No suitable model available within budget');
    }

    console.log(`🤖 ${selected.name} | Complexity: ${complexity.level} | Est. cost: €${selected.cost.toFixed(6)}`);

    // STEP 5: CHECK BUDGET
    try {
      await budgetGuardian.checkAndRecord(selected.cost, {
        model: selected.name,
        complexity: complexity.level,
        prompt: prompt.substring(0, 100)
      });
    } catch (error) {
      console.log('⚠️ Budget limit reached, forcing free model...');
      const freeModel = this.models['llama-3-70b'];
      if (freeModel.cost === 0) {
        selected.name = 'llama-3-70b';
        selected.provider = freeModel.provider;
        selected.model = freeModel.model;
        selected.cost = 0;
      } else {
        throw error;
      }
    }

    // STEP 6: EXECUTE
    const startTime = Date.now();

    try {
      const client = LLMClientFactory.create(selected.provider, selected.model);
      const result = await client.complete(prompt, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 4000
      });

      const duration = Date.now() - startTime;

      // STEP 7: UPDATE STATS
      this.recordStats(selected.name, selected.cost, duration);

      // STEP 8: CACHE RESULT
      await megaCache.set(prompt, result.content, {
        factual: options.factual,
        type: options.type,
        timeSensitive: options.timeSensitive
      });

      console.log(`✅ ${duration}ms - €${selected.cost.toFixed(6)}`);

      return {
        content: result.content,
        cached: false,
        cost: selected.cost,
        model: selected.name,
        duration
      };

    } catch (error) {
      console.error(`❌ ${selected.name} failed:`, error.message);

      // FALLBACK
      console.log('🔄 Trying fallback...');
      const fallback = this.getFallback(selected.name);

      if (fallback) {
        return await this.executeWithModel(fallback, prompt, options);
      }

      throw error;
    }
  }

  /**
   * Analyze prompt complexity
   */
  analyzeComplexity(prompt, options) {
    let score = 0;
    const factors = [];

    // Length
    const length = prompt.length;
    if (length < 100) {
      score += 1;
    } else if (length < 500) {
      score += 3;
    } else if (length < 2000) {
      score += 5;
    } else {
      score += 7;
    }

    // Keywords
    const promptLower = prompt.toLowerCase();

    const complexKeywords = [
      'analyse approfondie', 'expert', 'stratégie', 'critique',
      'professionnel', 'détaillé', 'complet', 'comprehensive'
    ];

    const simpleKeywords = [
      'résume', 'liste', 'simple', 'rapide', 'court', 'brief'
    ];

    complexKeywords.forEach(kw => {
      if (promptLower.includes(kw)) {
        score += 2;
        factors.push(`complex:${kw}`);
      }
    });

    simpleKeywords.forEach(kw => {
      if (promptLower.includes(kw)) {
        score -= 1;
        factors.push(`simple:${kw}`);
      }
    });

    // Task type
    if (options.type) {
      const typeScores = {
        chat: -2,
        simple: -1,
        medium: 2,
        code: 3,
        creative: 3,
        analysis: 4,
        research: 4,
        strategic: 5,
        critical: 5
      };
      score += typeScores[options.type] || 0;
    }

    // Priority
    if (options.priority === 'critical') score += 3;
    if (options.priority === 'high') score += 2;
    if (options.priority === 'low') score -= 1;

    // Classify
    let level, minQuality;
    if (score <= 2) {
      level = 'simple';
      minQuality = 7;
    } else if (score <= 5) {
      level = 'medium';
      minQuality = 8;
    } else if (score <= 8) {
      level = 'complex';
      minQuality = 9;
    } else {
      level = 'expert';
      minQuality = 9.5;
    }

    return {
      score,
      level,
      minQuality,
      factors
    };
  }

  /**
   * Select best model based on complexity and budget
   */
  selectModel(complexity, budgetRec, options) {
    let candidates = Object.entries(this.models)
      .filter(([name, model]) => {
        // Quality filter
        if (model.quality < complexity.minQuality) return false;

        // Budget filter
        if (budgetRec.level === 'EMERGENCY' && model.cost > 0) return false;
        if (budgetRec.level === 'CRITICAL' && model.cost > 0.001) return false;
        if (budgetRec.level === 'WARNING' && !budgetRec.allowPremium && model.cost > 0.01) return false;

        // User override
        if (options.forceModel && options.forceModel !== name) return false;

        return true;
      })
      .map(([name, model]) => ({
        name,
        ...model,
        score: this.scoreModel(model, complexity, budgetRec)
      }))
      .sort((a, b) => b.score - a.score);

    return candidates[0] || null;
  }

  /**
   * Score model
   */
  scoreModel(model, complexity, budgetRec) {
    let score = 0;

    // Quality (important)
    score += model.quality * 10;

    // Cost (inverse - cheaper = better)
    score += (1 / (model.cost + 0.0001)) * 3;

    // Speed
    score += model.speed * 2;

    // Match with complexity
    if (model.bestFor.includes(complexity.level)) score += 10;

    // Budget pressure
    if (budgetRec.preferCheap && model.cost === 0) score += 20;
    if (budgetRec.preferCheap && model.cost < 0.001) score += 10;

    return score;
  }

  /**
   * Execute with specific model
   */
  async executeWithModel(modelConfig, prompt, options) {
    const client = LLMClientFactory.create(modelConfig.provider, modelConfig.model);
    const result = await client.complete(prompt, options);

    this.recordStats(modelConfig.name, modelConfig.cost, 0);

    return {
      content: result.content,
      cached: false,
      cost: modelConfig.cost,
      model: modelConfig.name
    };
  }

  /**
   * Get fallback model
   */
  getFallback(failedModel) {
    const fallbackChain = {
      'claude-3-opus': this.models['claude-3-sonnet'],
      'claude-3-sonnet': this.models['gpt-4-turbo'],
      'gpt-4-turbo': this.models['claude-3-haiku'],
      'claude-3-haiku': this.models['gpt-4o-mini'],
      'gpt-4o-mini': this.models['gemini-flash'],
      'gemini-flash': this.models['llama-3-70b'],
      'llama-3-70b': null // No fallback for free model
    };

    return fallbackChain[failedModel];
  }

  /**
   * Record statistics
   */
  recordStats(modelName, cost, duration) {
    if (!this.stats.byModel[modelName]) {
      this.stats.byModel[modelName] = {
        count: 0,
        totalCost: 0,
        avgDuration: 0
      };
    }

    const stats = this.stats.byModel[modelName];
    stats.count++;
    stats.totalCost += cost;
    if (duration > 0) {
      stats.avgDuration = ((stats.avgDuration * (stats.count - 1)) + duration) / stats.count;
    }

    this.stats.totalCost += cost;
  }

  /**
   * Get cache hit rate
   */
  getCacheRate() {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    if (total === 0) return 0;
    return ((this.stats.cacheHits / total) * 100).toFixed(1);
  }

  /**
   * Get statistics
   */
  getStats() {
    const cacheStats = megaCache.getStats();

    return {
      router: {
        totalRequests: this.stats.totalRequests,
        cacheHitRate: this.getCacheRate() + '%',
        totalCost: `€${this.stats.totalCost.toFixed(4)}`,
        totalSaved: `€${this.stats.totalSaved.toFixed(4)}`,
        byModel: this.stats.byModel
      },
      cache: cacheStats,
      budget: budgetGuardian.getStatus ? budgetGuardian.getStatus() : null
    };
  }
}

// Singleton
const router = new IntelligentRouterPro();

module.exports = router;

// CLI test
if (require.main === module) {
  (async () => {
    console.log('🧪 Testing Intelligent Router PRO...\n');

    try {
      // Test simple
      console.log('Test 1: Simple query');
      const result1 = await router.route('Say hello in French', {
        type: 'simple'
      });
      console.log('→', result1.content.substring(0, 50));
      console.log('→ Model:', result1.model, '| Cost:', result1.cost);

      // Test cache hit
      console.log('\nTest 2: Same query (should hit cache)');
      const result2 = await router.route('Say hello in French', {
        type: 'simple'
      });
      console.log('→ Cached:', result2.cached);

      // Stats
      console.log('\n📊 Stats:');
      const stats = await router.getStats();
      console.log(JSON.stringify(stats.router, null, 2));

      console.log('\n✅ Router test passed!');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  })();
}
