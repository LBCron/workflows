/**
 * Performance & Monitoring System v2.0
 *
 * Système de monitoring et optimisation avec:
 * - Cache multi-niveaux intelligent
 * - Rate limiting adaptatif
 * - Monitoring temps réel
 * - Alertes automatiques
 * - Analytics détaillées
 * - Health checks
 */

const logger = require('../utils/logger');
const EventEmitter = require('events');

class PerformanceMonitoring extends EventEmitter {
  constructor() {
    super();

    // Cache multi-niveaux
    this.cache = {
      l1: new Map(), // Hot cache
      l2: new Map(), // Warm cache
      l3: new Map()  // Cold cache
    };

    this.cacheLimits = {
      l1: { maxSize: 100, ttl: 5 * 60 * 1000 },
      l2: { maxSize: 1000, ttl: 60 * 60 * 1000 },
      l3: { maxSize: 10000, ttl: 24 * 60 * 60 * 1000 }
    };

    // Rate limiting
    this.rateLimits = new Map();
    this.rateLimitConfig = {
      perUser: { requests: 100, window: 60 * 1000 },
      perUserHour: { requests: 500, window: 60 * 60 * 1000 },
      global: { requests: 10000, window: 60 * 1000 }
    };

    // Métriques
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        evictions: 0
      },
      api: {
        openaiCalls: 0,
        openaiTokens: 0,
        openaiCost: 0,
        telegramCalls: 0
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0
      },
      errors: {
        total: 0,
        byType: {}
      }
    };

    this.responseTimes = [];
    this.maxResponseTimes = 1000;

    // Alertes
    this.alerts = {
      enabled: true,
      thresholds: {
        errorRate: 0.05,
        responseTime: 5000,
        memoryUsage: 0.9,
        cacheHitRate: 0.5
      },
      cooldown: 5 * 60 * 1000,
      lastAlerts: new Map()
    };

    // Health
    this.health = {
      status: 'healthy',
      components: {
        cache: 'healthy',
        database: 'healthy',
        apis: 'healthy',
        memory: 'healthy'
      },
      lastCheck: new Date()
    };

    this.startMonitoring();

    logger.info('⚡ Performance Monitoring initialized');
  }

  /**
   * Cache intelligent
   */
  async cacheGet(key) {
    const startTime = Date.now();

    // Check L1
    if (this.cache.l1.has(key)) {
      const entry = this.cache.l1.get(key);

      if (Date.now() - entry.timestamp < this.cacheLimits.l1.ttl) {
        this.metrics.cache.hits++;
        this.updateCacheHitRate();
        return entry.value;
      } else {
        this.cache.l1.delete(key);
      }
    }

    // Check L2
    if (this.cache.l2.has(key)) {
      const entry = this.cache.l2.get(key);

      if (Date.now() - entry.timestamp < this.cacheLimits.l2.ttl) {
        this.metrics.cache.hits++;
        this.updateCacheHitRate();

        // Promote to L1
        this.cacheSet(key, entry.value, 'l1');

        return entry.value;
      } else {
        this.cache.l2.delete(key);
      }
    }

    // Check L3
    if (this.cache.l3.has(key)) {
      const entry = this.cache.l3.get(key);

      if (Date.now() - entry.timestamp < this.cacheLimits.l3.ttl) {
        this.metrics.cache.hits++;
        this.updateCacheHitRate();

        // Promote to L2
        this.cacheSet(key, entry.value, 'l2');

        return entry.value;
      } else {
        this.cache.l3.delete(key);
      }
    }

    this.metrics.cache.misses++;
    this.updateCacheHitRate();

    return null;
  }

  async cacheSet(key, value, level = 'l3') {
    const entry = {
      value,
      timestamp: Date.now(),
      hits: 0
    };

    // Vérifier limite
    if (this.cache[level].size >= this.cacheLimits[level].maxSize) {
      const oldestKey = this.findOldestEntry(level);
      if (oldestKey) {
        this.cache[level].delete(oldestKey);
        this.metrics.cache.evictions++;
      }
    }

    this.cache[level].set(key, entry);
  }

  findOldestEntry(level) {
    let oldest = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache[level].entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = key;
      }
    }

    return oldest;
  }

  updateCacheHitRate() {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    // Éviter division par zéro
    this.metrics.cache.hitRate = total > 0 ? this.metrics.cache.hits / total : 0;
  }

  async cacheClear(level = null) {
    if (level) {
      this.cache[level].clear();
    } else {
      this.cache.l1.clear();
      this.cache.l2.clear();
      this.cache.l3.clear();
    }
  }

  /**
   * Rate limiting
   */
  async checkRateLimit(userId) {
    const now = Date.now();

    if (!this.rateLimits.has(userId)) {
      this.rateLimits.set(userId, {
        requests: [],
        violations: 0
      });
    }

    const userLimits = this.rateLimits.get(userId);

    userLimits.requests = userLimits.requests.filter(
      timestamp => now - timestamp < this.rateLimitConfig.perUserHour.window
    );

    const recentRequests = userLimits.requests.filter(
      timestamp => now - timestamp < this.rateLimitConfig.perUser.window
    );

    if (recentRequests.length >= this.rateLimitConfig.perUser.requests) {
      userLimits.violations++;

      if (userLimits.violations > 3) {
        const waitTime = Math.min(30000, userLimits.violations * 5000);

        logger.warn(`⚠️ Rate limit exceeded for user ${userId}`);

        return {
          allowed: false,
          reason: 'rate_limit_exceeded',
          waitTime,
          remaining: 0
        };
      }
    }

    if (userLimits.requests.length >= this.rateLimitConfig.perUserHour.requests) {
      return {
        allowed: false,
        reason: 'hourly_limit_exceeded',
        remaining: 0
      };
    }

    userLimits.requests.push(now);

    return {
      allowed: true,
      remaining: this.rateLimitConfig.perUser.requests - recentRequests.length - 1,
      resetAt: now + this.rateLimitConfig.perUser.window
    };
  }

  /**
   * Tracking
   */
  trackRequest(userId, action, duration, success = true) {
    try {
      this.metrics.requests.total++;

      if (success) {
        this.metrics.requests.success++;
      } else {
        this.metrics.requests.errors++;
      }

      this.responseTimes.push(duration);

      if (this.responseTimes.length > this.maxResponseTimes) {
        this.responseTimes.shift();
      }

      this.updateResponseTimeMetrics();

      // Appel async non-bloquant avec error handling
      this.checkAlerts().catch(error => {
        logger.error('Alert check failed:', error);
      });

    } catch (error) {
      logger.error('Track request error:', error);
    }
  }

  updateResponseTimeMetrics() {
    if (this.responseTimes.length === 0) return;

    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.requests.avgResponseTime = sum / this.responseTimes.length;

    const sorted = [...this.responseTimes].sort((a, b) => a - b);

    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    this.metrics.requests.p95ResponseTime = sorted[p95Index];
    this.metrics.requests.p99ResponseTime = sorted[p99Index];
  }

  trackAPICall(service, tokens = 0, cost = 0) {
    if (service === 'openai') {
      this.metrics.api.openaiCalls++;
      this.metrics.api.openaiTokens += tokens;
      this.metrics.api.openaiCost += cost;
    } else if (service === 'telegram') {
      this.metrics.api.telegramCalls++;
    }
  }

  trackError(error, context = {}) {
    this.metrics.errors.total++;

    const errorType = error.name || 'UnknownError';

    if (!this.metrics.errors.byType[errorType]) {
      this.metrics.errors.byType[errorType] = 0;
    }

    this.metrics.errors.byType[errorType]++;

    logger.error('Error tracked:', {
      type: errorType,
      message: error.message,
      context
    });

    this.checkAlerts();
  }

  /**
   * Health checks
   */
  async performHealthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      components: {}
    };

    // Check memory
    const memUsage = process.memoryUsage();
    const memPercentage = memUsage.heapUsed / memUsage.heapTotal;

    this.metrics.system.memoryUsage = memPercentage;

    if (memPercentage > 0.9) {
      health.components.memory = 'unhealthy';
      health.status = 'degraded';
    } else if (memPercentage > 0.75) {
      health.components.memory = 'degraded';
      if (health.status === 'healthy') health.status = 'degraded';
    } else {
      health.components.memory = 'healthy';
    }

    // Check error rate
    const errorRate = this.metrics.requests.total > 0
      ? this.metrics.requests.errors / this.metrics.requests.total
      : 0;

    if (errorRate > 0.1) {
      health.components.errors = 'unhealthy';
      health.status = 'unhealthy';
    } else if (errorRate > 0.05) {
      health.components.errors = 'degraded';
      if (health.status === 'healthy') health.status = 'degraded';
    } else {
      health.components.errors = 'healthy';
    }

    this.health = health;

    return health;
  }

  async checkAlerts() {
    if (!this.alerts.enabled) return;

    const errorRate = this.metrics.requests.total > 0
      ? this.metrics.requests.errors / this.metrics.requests.total
      : 0;

    if (errorRate > this.alerts.thresholds.errorRate) {
      await this.sendAlert('high_error_rate', {
        errorRate: (errorRate * 100).toFixed(2) + '%',
        threshold: (this.alerts.thresholds.errorRate * 100) + '%'
      });
    }
  }

  async sendAlert(type, data) {
    const now = Date.now();
    const lastAlert = this.alerts.lastAlerts.get(type);

    if (lastAlert && now - lastAlert < this.alerts.cooldown) {
      return;
    }

    this.alerts.lastAlerts.set(type, now);

    logger.warn(`🚨 ALERT: ${type}`, data);

    this.emit('alert', { type, data, timestamp: now });
  }

  startMonitoring() {
    // Update system metrics every 30s
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.system.memoryUsage = memUsage.heapUsed / memUsage.heapTotal;
      this.metrics.system.uptime = process.uptime();
    }, 30000);

    // Health check every 5 minutes
    setInterval(async () => {
      await this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Cache cleanup every hour
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60 * 60 * 1000);

    logger.info('✅ Monitoring started');
  }

  cleanupExpiredCache() {
    try {
      const now = Date.now();
      let cleaned = 0;

      for (const level of ['l1', 'l2', 'l3']) {
        for (const [key, entry] of this.cache[level].entries()) {
          if (now - entry.timestamp > this.cacheLimits[level].ttl) {
            this.cache[level].delete(key);
            cleaned++;
          }
        }
      }

      if (cleaned > 0) {
        logger.info(`🧹 Cleaned ${cleaned} expired cache entries`);
      }

    } catch (error) {
      logger.error('Cache cleanup error:', error);
    }
  }

  getAnalytics() {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    return {
      overview: {
        status: this.health.status,
        uptime: `${hours}h ${minutes}m`,
        requestsPerMinute: (this.metrics.requests.total / (uptime / 60)).toFixed(2)
      },

      requests: {
        ...this.metrics.requests,
        errorRate: ((this.metrics.requests.errors / this.metrics.requests.total) * 100).toFixed(2) + '%'
      },

      cache: {
        ...this.metrics.cache,
        hitRate: (this.metrics.cache.hitRate * 100).toFixed(1) + '%',
        sizes: {
          l1: this.cache.l1.size,
          l2: this.cache.l2.size,
          l3: this.cache.l3.size,
          total: this.cache.l1.size + this.cache.l2.size + this.cache.l3.size
        }
      },

      api: this.metrics.api,
      system: this.metrics.system,
      errors: this.metrics.errors,
      health: this.health
    };
  }

  resetMetrics() {
    this.metrics = {
      requests: { total: 0, success: 0, errors: 0, avgResponseTime: 0, p95ResponseTime: 0, p99ResponseTime: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0, evictions: 0 },
      api: { openaiCalls: 0, openaiTokens: 0, openaiCost: 0, telegramCalls: 0 },
      system: { memoryUsage: 0, cpuUsage: 0, uptime: 0 },
      errors: { total: 0, byType: {} }
    };

    this.responseTimes = [];

    logger.info('📊 Metrics reset');
  }
}

module.exports = PerformanceMonitoring;
