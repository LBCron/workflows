#!/usr/bin/env node

/**
 * Budget Guardian - Protection Budget Absolue
 *
 * Empêche tout dépassement du budget mensuel
 * Tracking en temps réel, alertes, auto-throttling
 */

const fs = require('fs').promises;
const path = require('path');

class BudgetGuardian {
  constructor() {
    this.dataPath = path.join(__dirname, '../../.cache/budget-data.json');
    this.config = {
      monthlyLimit: parseFloat(process.env.MONTHLY_BUDGET_LIMIT) || 20.0, // €20 par défaut
      warningThreshold: 0.75, // Alerte à 75%
      criticalThreshold: 0.90, // Critique à 90%
      emergencyMode: 0.95 // Mode urgence à 95%
    };

    this.data = {
      month: new Date().toISOString().slice(0, 7), // YYYY-MM
      totalSpent: 0,
      transactions: [],
      alerts: []
    };

    this.loaded = false;
  }

  /**
   * Load budget data
   */
  async load() {
    if (this.loaded) return;

    try {
      const content = await fs.readFile(this.dataPath, 'utf8');
      const loaded = JSON.parse(content);

      // Check if same month
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (loaded.month === currentMonth) {
        this.data = loaded;
      } else {
        // New month - reset
        console.log('🔄 New month detected - resetting budget');
        await this.archive(loaded);
        this.data.month = currentMonth;
      }
    } catch (error) {
      // File doesn't exist yet
      console.log('💰 Initializing new budget tracker');
    }

    this.loaded = true;
  }

  /**
   * Archive previous month data
   */
  async archive(data) {
    const archivePath = path.join(
      __dirname,
      '../../.cache/budget-archive',
      `${data.month}.json`
    );

    try {
      await fs.mkdir(path.dirname(archivePath), { recursive: true });
      await fs.writeFile(archivePath, JSON.stringify(data, null, 2));
      console.log(`📁 Archived ${data.month} budget data`);
    } catch (error) {
      console.error('Failed to archive:', error.message);
    }
  }

  /**
   * Check if request is allowed and record cost
   */
  async checkAndRecord(estimatedCost, metadata = {}) {
    await this.load();

    const { totalSpent } = this.data;
    const newTotal = totalSpent + estimatedCost;
    const percentUsed = (newTotal / this.config.monthlyLimit) * 100;

    // EMERGENCY MODE - Block if 95%+
    if (percentUsed >= this.config.emergencyMode * 100) {
      const remaining = this.config.monthlyLimit - totalSpent;

      if (estimatedCost > remaining) {
        const error = new Error(
          `🚨 BUDGET LIMIT REACHED!\n` +
          `Spent: €${totalSpent.toFixed(4)} / €${this.config.monthlyLimit}\n` +
          `Requested: €${estimatedCost.toFixed(4)}\n` +
          `Remaining: €${remaining.toFixed(4)}\n` +
          `Request BLOCKED to prevent overspend.`
        );
        error.code = 'BUDGET_EXCEEDED';

        await this.addAlert('CRITICAL', 'Request blocked - budget limit reached');

        throw error;
      }
    }

    // Record transaction
    this.data.transactions.push({
      timestamp: new Date().toISOString(),
      cost: estimatedCost,
      metadata,
      runningTotal: newTotal
    });

    this.data.totalSpent = newTotal;

    // Generate alerts
    if (percentUsed >= this.config.emergencyMode * 100) {
      await this.addAlert('EMERGENCY', `${percentUsed.toFixed(1)}% budget used!`);
    } else if (percentUsed >= this.config.criticalThreshold * 100) {
      await this.addAlert('CRITICAL', `${percentUsed.toFixed(1)}% budget used`);
    } else if (percentUsed >= this.config.warningThreshold * 100) {
      await this.addAlert('WARNING', `${percentUsed.toFixed(1)}% budget used`);
    }

    // Save
    await this.save();

    return {
      allowed: true,
      percentUsed: percentUsed.toFixed(1),
      remaining: (this.config.monthlyLimit - newTotal).toFixed(4)
    };
  }

  /**
   * Add alert
   */
  async addAlert(level, message) {
    const alert = {
      level,
      message,
      timestamp: new Date().toISOString()
    };

    this.data.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.data.alerts.length > 50) {
      this.data.alerts = this.data.alerts.slice(-50);
    }

    // Console output
    const emoji = {
      EMERGENCY: '🚨',
      CRITICAL: '⚠️',
      WARNING: '⚡',
      INFO: 'ℹ️'
    }[level] || '📌';

    console.log(`${emoji} ${level}: ${message}`);
  }

  /**
   * Get current status
   */
  async getStatus() {
    await this.load();

    const percentUsed = (this.data.totalSpent / this.config.monthlyLimit) * 100;
    const remaining = this.config.monthlyLimit - this.data.totalSpent;

    return {
      month: this.data.month,
      limit: this.config.monthlyLimit,
      spent: this.data.totalSpent,
      remaining: remaining,
      spentFormatted: this.data.totalSpent.toFixed(4),
      remainingFormatted: remaining.toFixed(4),
      percentage: percentUsed.toFixed(1),
      status: this.getStatusLevel(percentUsed),
      transactionCount: this.data.transactions.length,
      recentAlerts: this.data.alerts.slice(-5)
    };
  }

  /**
   * Get status level
   */
  getStatusLevel(percentUsed) {
    if (percentUsed >= this.config.emergencyMode * 100) return 'EMERGENCY';
    if (percentUsed >= this.config.criticalThreshold * 100) return 'CRITICAL';
    if (percentUsed >= this.config.warningThreshold * 100) return 'WARNING';
    return 'HEALTHY';
  }

  /**
   * Get statistics
   */
  async getStats() {
    await this.load();

    const transactions = this.data.transactions;
    if (transactions.length === 0) {
      return {
        avgCost: 0,
        maxCost: 0,
        minCost: 0,
        totalTransactions: 0
      };
    }

    const costs = transactions.map(t => t.cost);

    return {
      avgCost: (costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(6),
      maxCost: Math.max(...costs).toFixed(6),
      minCost: Math.min(...costs).toFixed(6),
      totalTransactions: costs.length,
      last24h: this.getLast24hCost().toFixed(4),
      projection: this.getMonthlyProjection().toFixed(2)
    };
  }

  /**
   * Get last 24h cost
   */
  getLast24hCost() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return this.data.transactions
      .filter(t => new Date(t.timestamp) > yesterday)
      .reduce((sum, t) => sum + t.cost, 0);
  }

  /**
   * Project monthly cost based on current usage
   */
  getMonthlyProjection() {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    if (dayOfMonth === 0) return 0;

    const avgDailyCost = this.data.totalSpent / dayOfMonth;
    return avgDailyCost * daysInMonth;
  }

  /**
   * Save data
   */
  async save() {
    try {
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
      await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save budget data:', error.message);
    }
  }

  /**
   * Get recommendation for model selection based on budget
   */
  getRecommendation() {
    const percentUsed = (this.data.totalSpent / this.config.monthlyLimit) * 100;

    if (percentUsed >= 95) {
      return {
        status: 'EMERGENCY',
        level: 'EMERGENCY',
        message: 'Use FREE models only (Llama, cache)',
        allowPremium: false,
        allowStandard: false,
        cacheOnly: false,
        allowedModels: ['llama-3-70b']
      };
    } else if (percentUsed >= 90) {
      return {
        status: 'CRITICAL',
        level: 'CRITICAL',
        message: 'Prefer FREE models, Mini for important tasks only',
        allowPremium: false,
        allowStandard: false,
        preferFree: true,
        allowedModels: ['llama-3-70b', 'gpt-4o-mini', 'claude-3-haiku', 'gemini-flash']
      };
    } else if (percentUsed >= 75) {
      return {
        status: 'WARNING',
        level: 'WARNING',
        message: 'Use Mini/Haiku, avoid GPT-4/Opus unless critical',
        allowPremium: false,
        allowStandard: true,
        preferCheap: true,
        allowedModels: ['llama-3-70b', 'gpt-4o-mini', 'claude-3-haiku', 'gemini-flash', 'claude-3-sonnet']
      };
    } else {
      return {
        status: 'HEALTHY',
        level: 'HEALTHY',
        message: 'All models available',
        allowPremium: true,
        allowStandard: true,
        preferCheap: false,
        allowedModels: 'all'
      };
    }
  }
}

// Singleton
const budgetGuardian = new BudgetGuardian();

module.exports = budgetGuardian;

// CLI usage
if (require.main === module) {
  (async () => {
    const command = process.argv[2] || 'status';

    switch (command) {
      case 'status':
        const status = await budgetGuardian.getStatus();
        console.log('\n💰 Budget Status:\n');
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'stats':
        const stats = await budgetGuardian.getStats();
        console.log('\n📊 Budget Statistics:\n');
        console.log(JSON.stringify(stats, null, 2));
        break;

      case 'recommendation':
        await budgetGuardian.load();
        const rec = budgetGuardian.getRecommendation();
        console.log('\n💡 Model Recommendation:\n');
        console.log(JSON.stringify(rec, null, 2));
        break;

      case 'test':
        console.log('\n🧪 Testing budget check...\n');
        try {
          await budgetGuardian.checkAndRecord(0.001, { test: true, model: 'gpt-4-mini' });
          console.log('✅ Test transaction recorded');
          const status = await budgetGuardian.getStatus();
          console.log(`Current: €${status.spent} / €${status.limit}`);
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      default:
        console.log(`
Usage: node budget-guardian.js <command>

Commands:
  status          Show current budget status
  stats           Show statistics
  recommendation  Get model selection recommendation
  test            Test with small transaction

Examples:
  node budget-guardian.js status
  node budget-guardian.js stats
        `);
    }
  })();
}
