/**
 * Monitoring System v2.0
 *
 * Features:
 * - Monitoring temps réel
 * - Métriques performance
 * - Alertes automatiques
 * - Dashboard analytics
 * - Health checks
 */

const logger = require('./logger/logger');
const os = require('os');

class MonitoringSystem {
  constructor() {
    this.metrics = {
      // Performance
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseT imes: [],

      // Resources
      cpuUsage: 0,
      memoryUsage: 0,
      uptime: 0,

      // Agents
      agentCalls: {},
      agentErrors: {},
      agentResponseTimes: {},

      // Cache
      cacheHits: 0,
      cacheMisses: 0,

      // Cost
      totalCost: 0,
      costByModel: {},

      // Errors
      errors: [],
      errorCount: 0,

      // Users
      activeUsers: new Set(),
      totalUsers: 0
    };

    this.alerts = [];
    this.thresholds = {
      responseTime: 5000, // 5s
      errorRate: 0.05, // 5%
      cpuUsage: 80, // 80%
      memoryUsage: 80, // 80%
      costPerHour: 10 // $10/h
    };

    this.startTime = Date.now();
    this.isMonitoring = false;

    logger.info('📊 Monitoring System initialized');
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Collect system metrics every 10s
    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 10000);

    // Check thresholds every 30s
    this.alertsInterval = setInterval(() => {
      this.checkThresholds();
    }, 30000);

    logger.info('✅ Monitoring started');
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
    }

    if (this.alertsInterval) {
      clearInterval(this.alertsInterval);
    }

    logger.info('⏹️ Monitoring stopped');
  }

  /**
   * Record request
   */
  recordRequest(success = true, responseTime = 0, agentType = null, cost = 0, model = null) {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Response time
    this.metrics.responseTimes.push(responseTime);
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift(); // Keep last 1000
    }

    this.metrics.averageResponseTime =
      this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;

    // Agent metrics
    if (agentType) {
      this.metrics.agentCalls[agentType] = (this.metrics.agentCalls[agentType] || 0) + 1;

      if (!success) {
        this.metrics.agentErrors[agentType] = (this.metrics.agentErrors[agentType] || 0) + 1;
      }

      // Agent response times
      if (!this.metrics.agentResponseTimes[agentType]) {
        this.metrics.agentResponseTimes[agentType] = [];
      }
      this.metrics.agentResponseTimes[agentType].push(responseTime);
      if (this.metrics.agentResponseTimes[agentType].length > 100) {
        this.metrics.agentResponseTimes[agentType].shift();
      }
    }

    // Cost
    if (cost > 0) {
      this.metrics.totalCost += cost;

      if (model) {
        this.metrics.costByModel[model] = (this.metrics.costByModel[model] || 0) + cost;
      }
    }
  }

  /**
   * Record error
   */
  recordError(error, context = {}) {
    this.metrics.errorCount++;

    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      context
    };

    this.metrics.errors.push(errorEntry);

    // Keep last 1000 errors
    if (this.metrics.errors.length > 1000) {
      this.metrics.errors.shift();
    }

    logger.error('❌ Error recorded:', errorEntry);
  }

  /**
   * Record cache hit/miss
   */
  recordCacheAccess(hit = true) {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Record user activity
   */
  recordUserActivity(userId) {
    this.metrics.activeUsers.add(userId);
    this.metrics.totalUsers = Math.max(this.metrics.totalUsers, this.metrics.activeUsers.size);
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    try {
      // CPU usage
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });

      this.metrics.cpuUsage = ((1 - totalIdle / totalTick) * 100).toFixed(2);

      // Memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      this.metrics.memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(2);

      // Uptime
      this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    } catch (error) {
      logger.error('❌ Failed to collect system metrics:', error);
    }
  }

  /**
   * Check thresholds and generate alerts
   */
  checkThresholds() {
    const newAlerts = [];

    // Response time
    if (this.metrics.averageResponseTime > this.thresholds.responseTime) {
      newAlerts.push({
        type: 'performance',
        severity: 'warning',
        message: `Average response time is ${this.metrics.averageResponseTime.toFixed(0)}ms (threshold: ${this.thresholds.responseTime}ms)`,
        timestamp: new Date().toISOString()
      });
    }

    // Error rate
    const errorRate = this.metrics.totalRequests > 0
      ? this.metrics.failedRequests / this.metrics.totalRequests
      : 0;

    if (errorRate > this.thresholds.errorRate) {
      newAlerts.push({
        type: 'errors',
        severity: 'critical',
        message: `Error rate is ${(errorRate * 100).toFixed(2)}% (threshold: ${this.thresholds.errorRate * 100}%)`,
        timestamp: new Date().toISOString()
      });
    }

    // CPU usage
    if (this.metrics.cpuUsage > this.thresholds.cpuUsage) {
      newAlerts.push({
        type: 'resources',
        severity: 'warning',
        message: `CPU usage is ${this.metrics.cpuUsage}% (threshold: ${this.thresholds.cpuUsage}%)`,
        timestamp: new Date().toISOString()
      });
    }

    // Memory usage
    if (this.metrics.memoryUsage > this.thresholds.memoryUsage) {
      newAlerts.push({
        type: 'resources',
        severity: 'warning',
        message: `Memory usage is ${this.metrics.memoryUsage}% (threshold: ${this.thresholds.memoryUsage}%)`,
        timestamp: new Date().toISOString()
      });
    }

    // Cost per hour
    const uptimeHours = this.metrics.uptime / 3600;
    const costPerHour = uptimeHours > 0 ? this.metrics.totalCost / uptimeHours : 0;

    if (costPerHour > this.thresholds.costPerHour) {
      newAlerts.push({
        type: 'cost',
        severity: 'warning',
        message: `Cost per hour is $${costPerHour.toFixed(2)} (threshold: $${this.thresholds.costPerHour})`,
        timestamp: new Date().toISOString()
      });
    }

    // Log new alerts
    for (const alert of newAlerts) {
      logger.warn(`🚨 ALERT [${alert.severity}]: ${alert.message}`);
      this.alerts.push(alert);

      // Keep last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts.shift();
      }
    }
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const errorRate = this.metrics.totalRequests > 0
      ? this.metrics.failedRequests / this.metrics.totalRequests
      : 0;

    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
      ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
      : 0;

    const status = {
      overall: 'healthy',
      checks: {
        api: this.metrics.totalRequests > 0 ? 'healthy' : 'unknown',
        errorRate: errorRate < this.thresholds.errorRate ? 'healthy' : 'degraded',
        responseTime: this.metrics.averageResponseTime < this.thresholds.responseTime ? 'healthy' : 'degraded',
        resources: this.metrics.cpuUsage < this.thresholds.cpuUsage &&
                  this.metrics.memoryUsage < this.thresholds.memoryUsage ? 'healthy' : 'degraded'
      },
      metrics: {
        uptime: this.metrics.uptime,
        totalRequests: this.metrics.totalRequests,
        successRate: this.metrics.totalRequests > 0
          ? ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
          : 'N/A',
        averageResponseTime: this.metrics.averageResponseTime.toFixed(0) + 'ms',
        cacheHitRate: (cacheHitRate * 100).toFixed(2) + '%',
        cpuUsage: this.metrics.cpuUsage + '%',
        memoryUsage: this.metrics.memoryUsage + '%',
        activeUsers: this.metrics.activeUsers.size,
        totalCost: '$' + this.metrics.totalCost.toFixed(4)
      },
      timestamp: new Date().toISOString()
    };

    // Determine overall status
    const checks = Object.values(status.checks);
    if (checks.includes('degraded')) {
      status.overall = 'degraded';
    }
    if (checks.filter(c => c === 'degraded').length >= 2) {
      status.overall = 'unhealthy';
    }

    return status;
  }

  /**
   * Get full metrics
   */
  getMetrics() {
    const errorRate = this.metrics.totalRequests > 0
      ? ((this.metrics.failedRequests / this.metrics.totalRequests) * 100).toFixed(2)
      : '0.00';

    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
      ? ((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100).toFixed(2)
      : '0.00';

    // Agent stats
    const agentStats = Object.entries(this.metrics.agentCalls).map(([agent, calls]) => {
      const errors = this.metrics.agentErrors[agent] || 0;
      const responseTimes = this.metrics.agentResponseTimes[agent] || [];
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      return {
        agent,
        calls,
        errors,
        errorRate: calls > 0 ? ((errors / calls) * 100).toFixed(2) + '%' : '0%',
        avgResponseTime: avgResponseTime.toFixed(0) + 'ms'
      };
    }).sort((a, b) => b.calls - a.calls);

    return {
      summary: {
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        errorRate: errorRate + '%',
        averageResponseTime: this.metrics.averageResponseTime.toFixed(0) + 'ms',
        uptime: this.formatUptime(this.metrics.uptime),
        totalCost: '$' + this.metrics.totalCost.toFixed(4)
      },
      resources: {
        cpuUsage: this.metrics.cpuUsage + '%',
        memoryUsage: this.metrics.memoryUsage + '%'
      },
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: cacheHitRate + '%'
      },
      users: {
        active: this.metrics.activeUsers.size,
        total: this.metrics.totalUsers
      },
      agents: agentStats,
      cost: {
        total: '$' + this.metrics.totalCost.toFixed(4),
        byModel: Object.entries(this.metrics.costByModel).map(([model, cost]) => ({
          model,
          cost: '$' + cost.toFixed(4)
        }))
      },
      recentErrors: this.metrics.errors.slice(-10),
      alerts: this.alerts.slice(-10)
    };
  }

  /**
   * Format uptime
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: [],
      cpuUsage: 0,
      memoryUsage: 0,
      uptime: 0,
      agentCalls: {},
      agentErrors: {},
      agentResponseTimes: {},
      cacheHits: 0,
      cacheMisses: 0,
      totalCost: 0,
      costByModel: {},
      errors: [],
      errorCount: 0,
      activeUsers: new Set(),
      totalUsers: 0
    };

    this.alerts = [];
    this.startTime = Date.now();

    logger.info('🔄 Monitoring metrics reset');
  }

  /**
   * Configure thresholds
   */
  configure(newThresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds
    };

    logger.info('⚙️ Monitoring thresholds updated');
  }
}

// Export singleton instance
let monitoringInstance = null;

function getMonitoringInstance() {
  if (!monitoringInstance) {
    monitoringInstance = new MonitoringSystem();
    monitoringInstance.start(); // Auto-start
  }
  return monitoringInstance;
}

module.exports = {
  MonitoringSystem,
  getMonitoringInstance
};
