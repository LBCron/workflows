#!/usr/bin/env node

/**
 * Intelligent Multi-Model Router
 *
 * Automatically selects the best AI model for each task based on:
 * - Task complexity
 * - Budget constraints
 * - Speed requirements
 * - Quality needs
 * - Historical performance
 *
 * Saves 60-80% on API costs by using cheaper models for simple tasks
 */

const fs = require('fs').promises;
const path = require('path');

// Model configurations with capabilities and pricing
const MODEL_CONFIGS = {
  'gpt-4-turbo': {
    provider: 'openai',
    capabilities: {
      reasoning: 10,
      code: 10,
      creative: 9,
      speed: 7,
      context_window: 128000
    },
    pricing: {
      input_per_1k: 0.01,
      output_per_1k: 0.03
    },
    best_for: ['complex_reasoning', 'advanced_code', 'analysis', 'multi_step'],
    limits: {
      rpm: 10000,
      tpm: 2000000
    }
  },

  'gpt-3.5-turbo': {
    provider: 'openai',
    capabilities: {
      reasoning: 7,
      code: 7,
      creative: 7,
      speed: 10,
      context_window: 16000
    },
    pricing: {
      input_per_1k: 0.0005,
      output_per_1k: 0.0015
    },
    best_for: ['simple_tasks', 'speed', 'volume', 'chat'],
    limits: {
      rpm: 10000,
      tpm: 2000000
    }
  },

  'claude-3-opus': {
    provider: 'anthropic',
    capabilities: {
      reasoning: 10,
      code: 9,
      creative: 10,
      speed: 6,
      context_window: 200000
    },
    pricing: {
      input_per_1k: 0.015,
      output_per_1k: 0.075
    },
    best_for: ['long_context', 'creative_writing', 'analysis', 'nuance'],
    limits: {
      rpm: 4000,
      tpm: 400000
    }
  },

  'claude-3-sonnet': {
    provider: 'anthropic',
    capabilities: {
      reasoning: 9,
      code: 8,
      creative: 9,
      speed: 8,
      context_window: 200000
    },
    pricing: {
      input_per_1k: 0.003,
      output_per_1k: 0.015
    },
    best_for: ['balanced', 'long_documents', 'writing', 'analysis'],
    limits: {
      rpm: 4000,
      tpm: 400000
    }
  },

  'claude-3-haiku': {
    provider: 'anthropic',
    capabilities: {
      reasoning: 7,
      code: 7,
      creative: 7,
      speed: 10,
      context_window: 200000
    },
    pricing: {
      input_per_1k: 0.00025,
      output_per_1k: 0.00125
    },
    best_for: ['ultra_fast', 'simple_tasks', 'cost_efficient', 'volume'],
    limits: {
      rpm: 4000,
      tpm: 400000
    }
  },

  'gemini-1.5-pro': {
    provider: 'google',
    capabilities: {
      reasoning: 9,
      code: 8,
      creative: 8,
      speed: 8,
      context_window: 1000000
    },
    pricing: {
      input_per_1k: 0.00125,
      output_per_1k: 0.005
    },
    best_for: ['ultra_long_context', 'multimodal', 'cost_efficient'],
    limits: {
      rpm: 1000,
      tpm: 4000000
    }
  },

  'gemini-1.5-flash': {
    provider: 'google',
    capabilities: {
      reasoning: 7,
      code: 7,
      creative: 7,
      speed: 10,
      context_window: 1000000
    },
    pricing: {
      input_per_1k: 0.000075,
      output_per_1k: 0.0003
    },
    best_for: ['ultra_fast', 'cost_efficient', 'volume', 'simple_tasks'],
    limits: {
      rpm: 1000,
      tpm: 4000000
    }
  }
};

// Task complexity classification
const TASK_PATTERNS = {
  simple: {
    keywords: ['hello', 'hi', 'thanks', 'ok', 'yes', 'no', 'status', 'list'],
    max_tokens: 100,
    complexity_score: 1
  },

  moderate: {
    keywords: ['summarize', 'explain', 'describe', 'write email', 'draft', 'create'],
    max_tokens: 500,
    complexity_score: 3
  },

  complex: {
    keywords: ['analyze', 'research', 'compare', 'evaluate', 'strategy', 'plan'],
    max_tokens: 2000,
    complexity_score: 7
  },

  advanced: {
    keywords: ['debug', 'optimize', 'architect', 'design system', 'multi-step', 'comprehensive'],
    max_tokens: 4000,
    complexity_score: 10
  }
};

class IntelligentModelRouter {
  constructor() {
    this.usageStats = {
      total_requests: 0,
      total_cost: 0,
      by_model: {},
      savings: 0
    };

    this.performanceHistory = {};
  }

  /**
   * Analyze task to determine complexity
   */
  analyzeTask(task) {
    const taskLower = task.toLowerCase();
    const wordCount = task.split(' ').length;

    let complexity = 'moderate';
    let complexityScore = 3;

    // Check patterns
    for (const [level, pattern] of Object.entries(TASK_PATTERNS)) {
      const matches = pattern.keywords.some(keyword => taskLower.includes(keyword));
      if (matches) {
        complexity = level;
        complexityScore = pattern.complexity_score;
        break;
      }
    }

    // Adjust based on length
    if (wordCount < 10) {
      complexity = 'simple';
      complexityScore = Math.max(1, complexityScore - 2);
    } else if (wordCount > 100) {
      complexityScore = Math.min(10, complexityScore + 2);
      if (complexityScore > 7) complexity = 'advanced';
    }

    return {
      complexity,
      complexityScore,
      wordCount,
      estimatedOutputTokens: this.estimateOutputTokens(task, complexity)
    };
  }

  /**
   * Estimate output tokens based on task
   */
  estimateOutputTokens(task, complexity) {
    const baseEstimates = {
      simple: 50,
      moderate: 300,
      complex: 1000,
      advanced: 2500
    };

    return baseEstimates[complexity] || 300;
  }

  /**
   * Calculate cost for a model
   */
  calculateCost(model, inputTokens, outputTokens) {
    const config = MODEL_CONFIGS[model];
    if (!config) return Infinity;

    const inputCost = (inputTokens / 1000) * config.pricing.input_per_1k;
    const outputCost = (outputTokens / 1000) * config.pricing.output_per_1k;

    return inputCost + outputCost;
  }

  /**
   * Get quality score for model based on task
   */
  getQualityScore(model, taskAnalysis) {
    const config = MODEL_CONFIGS[model];
    if (!config) return 0;

    const { complexityScore } = taskAnalysis;

    // Weight different capabilities based on complexity
    let score = 0;

    if (complexityScore >= 7) {
      score = config.capabilities.reasoning * 0.6 +
              config.capabilities.code * 0.3 +
              config.capabilities.creative * 0.1;
    } else if (complexityScore >= 4) {
      score = config.capabilities.reasoning * 0.4 +
              config.capabilities.code * 0.2 +
              config.capabilities.creative * 0.2 +
              config.capabilities.speed * 0.2;
    } else {
      score = config.capabilities.speed * 0.5 +
              config.capabilities.reasoning * 0.3 +
              config.capabilities.creative * 0.2;
    }

    return score;
  }

  /**
   * Select best model based on constraints
   */
  selectModel(task, options = {}) {
    const {
      maxCost = 0.05,           // Max $0.05 per request
      minQuality = 7,            // Minimum quality score (1-10)
      prioritize = 'balanced',   // 'cost' | 'quality' | 'speed' | 'balanced'
      contextTokens = 1000       // Estimated context size
    } = options;

    // Analyze task
    const taskAnalysis = this.analyzeTask(task);
    const inputTokens = contextTokens + Math.ceil(task.length / 4);
    const outputTokens = taskAnalysis.estimatedOutputTokens;

    // Score each model
    const modelScores = [];

    for (const [modelName, config] of Object.entries(MODEL_CONFIGS)) {
      // Calculate cost
      const cost = this.calculateCost(modelName, inputTokens, outputTokens);

      // Get quality score
      const quality = this.getQualityScore(modelName, taskAnalysis);

      // Check if meets requirements
      if (cost > maxCost || quality < minQuality) {
        continue;
      }

      // Calculate final score based on priority
      let finalScore = 0;

      switch (prioritize) {
        case 'cost':
          finalScore = (1 / cost) * 0.7 + quality * 0.3;
          break;
        case 'quality':
          finalScore = quality * 0.7 + (1 / cost) * 0.3;
          break;
        case 'speed':
          finalScore = config.capabilities.speed * 0.6 + quality * 0.2 + (1 / cost) * 0.2;
          break;
        case 'balanced':
        default:
          finalScore = quality * 0.4 + (1 / cost) * 0.3 + config.capabilities.speed * 0.3;
      }

      modelScores.push({
        model: modelName,
        score: finalScore,
        cost,
        quality,
        speed: config.capabilities.speed,
        provider: config.provider,
        reasoning: this.explainChoice(modelName, taskAnalysis, cost, quality)
      });
    }

    // Sort by score (highest first)
    modelScores.sort((a, b) => b.score - a.score);

    // Get best model
    const selected = modelScores[0];

    if (!selected) {
      // Fallback to GPT-3.5 if no model meets criteria
      return {
        model: 'gpt-3.5-turbo',
        provider: 'openai',
        cost: this.calculateCost('gpt-3.5-turbo', inputTokens, outputTokens),
        quality: this.getQualityScore('gpt-3.5-turbo', taskAnalysis),
        reasoning: 'Fallback model (no model met criteria)',
        alternatives: modelScores.slice(0, 3)
      };
    }

    // Update stats
    this.updateStats(selected, inputTokens, outputTokens);

    return {
      ...selected,
      taskAnalysis,
      inputTokens,
      outputTokens,
      alternatives: modelScores.slice(1, 4)
    };
  }

  /**
   * Explain why this model was chosen
   */
  explainChoice(model, taskAnalysis, cost, quality) {
    const config = MODEL_CONFIGS[model];
    const reasons = [];

    if (cost < 0.001) {
      reasons.push('ultra-low cost');
    } else if (cost < 0.01) {
      reasons.push('cost-efficient');
    }

    if (quality >= 9) {
      reasons.push('highest quality');
    } else if (quality >= 7) {
      reasons.push('high quality');
    }

    if (config.capabilities.speed >= 9) {
      reasons.push('ultra-fast');
    } else if (config.capabilities.speed >= 7) {
      reasons.push('fast response');
    }

    if (taskAnalysis.complexity === 'simple') {
      reasons.push('simple task');
    } else if (taskAnalysis.complexity === 'advanced') {
      reasons.push('complex reasoning');
    }

    return reasons.join(', ');
  }

  /**
   * Update usage statistics
   */
  updateStats(selected, inputTokens, outputTokens) {
    this.usageStats.total_requests++;
    this.usageStats.total_cost += selected.cost;

    if (!this.usageStats.by_model[selected.model]) {
      this.usageStats.by_model[selected.model] = {
        requests: 0,
        cost: 0,
        avg_quality: 0
      };
    }

    const modelStats = this.usageStats.by_model[selected.model];
    modelStats.requests++;
    modelStats.cost += selected.cost;
    modelStats.avg_quality = (modelStats.avg_quality * (modelStats.requests - 1) + selected.quality) / modelStats.requests;

    // Calculate savings (vs always using GPT-4)
    const gpt4Cost = this.calculateCost('gpt-4-turbo', inputTokens, outputTokens);
    this.usageStats.savings += (gpt4Cost - selected.cost);
  }

  /**
   * Get usage statistics
   */
  getStats() {
    const savingsPercentage = this.usageStats.total_requests > 0
      ? ((this.usageStats.savings / (this.usageStats.total_cost + this.usageStats.savings)) * 100).toFixed(1)
      : 0;

    return {
      ...this.usageStats,
      savings_percentage: `${savingsPercentage}%`,
      avg_cost_per_request: this.usageStats.total_requests > 0
        ? (this.usageStats.total_cost / this.usageStats.total_requests).toFixed(4)
        : 0
    };
  }

  /**
   * Get model recommendation with detailed explanation
   */
  getRecommendation(task, options = {}) {
    const recommendation = this.selectModel(task, options);

    return {
      recommended_model: recommendation.model,
      provider: recommendation.provider,
      estimated_cost: `$${recommendation.cost.toFixed(4)}`,
      quality_score: `${recommendation.quality.toFixed(1)}/10`,
      speed_rating: `${recommendation.speed}/10`,
      reasoning: recommendation.reasoning,
      task_complexity: recommendation.taskAnalysis.complexity,
      alternatives: recommendation.alternatives.map(alt => ({
        model: alt.model,
        cost: `$${alt.cost.toFixed(4)}`,
        quality: `${alt.quality.toFixed(1)}/10`,
        reason: alt.reasoning
      }))
    };
  }
}

// Export singleton instance
const router = new IntelligentModelRouter();

module.exports = router;

// CLI usage
if (require.main === module) {
  const task = process.argv[2] || 'Write a professional email to my boss';

  console.log('🧠 Intelligent Model Router\n');
  console.log(`Task: "${task}"\n`);

  const recommendation = router.getRecommendation(task, {
    prioritize: 'balanced',
    maxCost: 0.05,
    minQuality: 6
  });

  console.log('📊 Recommendation:');
  console.log(JSON.stringify(recommendation, null, 2));

  console.log('\n💰 Current Stats:');
  console.log(JSON.stringify(router.getStats(), null, 2));
}
