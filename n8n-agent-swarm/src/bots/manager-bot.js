/**
 * Manager Bot - System Monitoring & Administration
 *
 * Bot Telegram pour monitoring et administration:
 * - Dashboard temps réel
 * - Analytics approfondies
 * - Security monitoring
 * - System health checks
 * - Performance metrics
 * - User management
 */

const TelegramBot = require('node-telegram-bot-api');
const { OpenAI } = require('openai');
const PerformanceMonitoring = require('../core/performance-monitoring');
const SecurityManager = require('../core/security-manager');
const SecurityEnterprise = require('../core/security-enterprise');
const LearningEngine = require('../core/learning-engine-v2');
const CredentialVault = require('../core/credential-vault-ultimate');
const AutomationEngine = require('../core/automation-engine');
const AnalyticsDashboard = require('../core/analytics-dashboard');
const MultiUserSystem = require('../core/multi-user-system');
const VoiceMultimodalEngine = require('../ai/voice-multimodal-engine');
const ContextMemoryEngine = require('../ai/context-memory-engine');
const logger = require('../utils/logger');

class ManagerBot {
  constructor(token, adminChatIds = []) {
    this.bot = new TelegramBot(token, { polling: true });
    this.adminChatIds = new Set(adminChatIds);

    // Initialize OpenAI client (if API key available)
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;

    if (!this.openai) {
      logger.warn('⚠️ OpenAI API key not found - AI features will be limited');
    }

    // Systèmes
    this.performance = new PerformanceMonitoring();
    this.security = new SecurityManager();
    this.securityEnterprise = null; // Initialisé après security manager
    this.learningEngine = new LearningEngine();
    this.vault = new CredentialVault();

    // Premium Systems
    this.automation = new AutomationEngine();
    this.analytics = new AnalyticsDashboard();
    this.multiUser = new MultiUserSystem();

    // AI Engines
    this.voiceEngine = new VoiceMultimodalEngine(this.openai, this.bot);
    this.contextEngine = new ContextMemoryEngine(this.openai);

    // Auto-report config
    this.autoReport = {
      enabled: true,
      interval: 60 * 60 * 1000, // 1 heure
      lastReport: null
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    logger.info('⚙️ Initializing Manager Bot...');

    await this.security.initialize();
    await this.learningEngine.initialize();
    await this.vault.initialize();

    // Initialiser Security Enterprise (nécessite security manager)
    this.securityEnterprise = new SecurityEnterprise(this.security);

    this.setupEventListeners();
    this.setupCommands();

    // Start auto-reporting
    if (this.autoReport.enabled) {
      this.startAutoReporting();
    }

    this.initialized = true;

    logger.info('✅ Manager Bot initialized');

    return this;
  }

  setupEventListeners() {
    // Performance alerts
    this.performance.on('alert', async (alert) => {
      await this.notifyAdmins(`
🚨 **Performance Alert**

Type: ${alert.type}
Data: ${JSON.stringify(alert.data, null, 2)}
      `);
    });

    // Security events
    this.security.on('threat_detected', async (threat) => {
      await this.notifyAdmins(`
🚨 **THREAT DETECTED**

Type: ${threat.type}
Severity: ${threat.severity}
User: ${threat.event.userId}
Details: ${JSON.stringify(threat.event.details, null, 2)}
      `);
    });

    this.security.on('critical_event', async (event) => {
      await this.notifyAdmins(`
🔥 **CRITICAL SECURITY EVENT**

Type: ${event.eventType}
User: ${event.userId}
Action: ${event.action}
Severity: ${event.severity}
      `);
    });
  }

  setupCommands() {
    // /dashboard
    this.bot.onText(/\/dashboard/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé - Admin only');
        return;
      }

      const dashboard = await this.generateDashboard();
      await this.bot.sendMessage(msg.chat.id, dashboard, { parse_mode: 'Markdown' });
    });

    // /performance
    this.bot.onText(/\/performance/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const analytics = this.performance.getAnalytics();

      const message = `
📊 **Performance Analytics**

**Overview:**
• Status: ${analytics.overview.status}
• Uptime: ${analytics.overview.uptime}
• Requests/min: ${analytics.overview.requestsPerMinute}

**Requests:**
• Total: ${analytics.requests.total}
• Success: ${analytics.requests.success}
• Errors: ${analytics.requests.errors}
• Error rate: ${analytics.requests.errorRate}
• Avg response: ${Math.round(analytics.requests.avgResponseTime)}ms
• P95: ${Math.round(analytics.requests.p95ResponseTime)}ms
• P99: ${Math.round(analytics.requests.p99ResponseTime)}ms

**Cache:**
• Hit rate: ${analytics.cache.hitRate}
• Hits: ${analytics.cache.hits}
• Misses: ${analytics.cache.misses}
• Evictions: ${analytics.cache.evictions}
• Total entries: ${analytics.cache.sizes.total}
  - L1 (hot): ${analytics.cache.sizes.l1}
  - L2 (warm): ${analytics.cache.sizes.l2}
  - L3 (cold): ${analytics.cache.sizes.l3}

**API:**
• OpenAI calls: ${analytics.api.openaiCalls}
• OpenAI tokens: ${analytics.api.openaiTokens}
• OpenAI cost: €${analytics.api.openaiCost.toFixed(4)}
• Telegram calls: ${analytics.api.telegramCalls}

**System:**
• Memory: ${(analytics.system.memoryUsage * 100).toFixed(1)}%
• Uptime: ${Math.floor(analytics.system.uptime / 60)}min
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /security
    this.bot.onText(/\/security/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const metrics = this.security.getSecurityMetrics();

      const message = `
🔒 **Security Status**

**Metrics:**
• Audit logs: ${metrics.auditLogs}
• Security events: ${metrics.securityEvents}
• Blocked attempts: ${metrics.blockedAttempts}
• Threats detected: ${metrics.threatsDetected}

**Whitelist:**
• Users: ${metrics.whitelist.users}
• IPs: ${metrics.whitelist.ips}

**Blacklist:**
• Users: ${metrics.blacklist.users}
• IPs: ${metrics.blacklist.ips}

**Intrusion Detection:**
• Enabled: ${metrics.intrusionDetection.enabled ? 'Yes' : 'No'}
• Active threats: ${metrics.intrusionDetection.threatsDetected}

**Failed Attempts:**
• Active monitors: ${metrics.failedAttempts}
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /users
    this.bot.onText(/\/users/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const globalStats = this.learningEngine.getGlobalStats();

      const message = `
👥 **User Analytics**

**Global Stats:**
• Total users: ${globalStats.totalUsers}
• Total interactions: ${globalStats.totalInteractions}
• Avg interactions/user: ${globalStats.avgInteractionsPerUser}

**Top Topics:**
${globalStats.topTopics.slice(0, 10).map((t, i) =>
  `${i + 1}. ${t.topic} (${t.count} mentions)`
).join('\n')}
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /vault
    this.bot.onText(/\/vault/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const stats = this.vault.getStats();

      const message = `
🔐 **Credential Vault Status**

**Stats:**
• Total credentials: ${stats.totalCredentials}
• Active services: ${stats.activeServices}
• Supported services: ${stats.supportedServices}
• Cache size: ${stats.cacheSize}
• Encryption: ${stats.encryptionStrength}
• Last rotation: ${stats.lastRotation || 'Never'}
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /health
    this.bot.onText(/\/health/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const health = await this.performance.performHealthCheck();

      const statusEmoji = {
        'healthy': '✅',
        'degraded': '⚠️',
        'unhealthy': '❌'
      };

      const message = `
🏥 **System Health Check**

**Overall Status:** ${statusEmoji[health.status]} ${health.status.toUpperCase()}

**Components:**
${Object.entries(health.components).map(([name, status]) =>
  `• ${name}: ${statusEmoji[status] || 'ℹ️'} ${status}`
).join('\n')}

**Last Check:** ${new Date(health.timestamp).toLocaleString()}
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /ban <userId>
    this.bot.onText(/\/ban (\S+)/, async (msg, match) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const userId = match[1];

      try {
        await this.security.blacklistUser(userId, 'manual_ban_by_admin', null);
        await this.bot.sendMessage(msg.chat.id, `✅ User ${userId} banned`);
      } catch (error) {
        await this.bot.sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
      }
    });

    // /unban <userId>
    this.bot.onText(/\/unban (\S+)/, async (msg, match) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const userId = match[1];

      try {
        await this.security.unblacklistUser(userId);
        await this.bot.sendMessage(msg.chat.id, `✅ User ${userId} unbanned`);
      } catch (error) {
        await this.bot.sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
      }
    });

    // /reset_metrics
    this.bot.onText(/\/reset_metrics/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      this.performance.resetMetrics();
      await this.bot.sendMessage(msg.chat.id, '✅ Metrics reset');
    });

    // /help
    this.bot.onText(/\/help/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const message = `
⚙️ **Manager Bot - Admin Commands**

**Monitoring:**
/dashboard - Vue d'ensemble complète
/performance - Métriques de performance
/security - Status sécurité
/users - Analytics utilisateurs
/vault - Status credential vault
/health - Health check système

**Administration:**
/ban <userId> - Bannir un utilisateur
/unban <userId> - Débannir un utilisateur
/reset_metrics - Reset métriques

**Security Enterprise:**
/audit - Générer rapport d'audit sécurité
/sessions - Liste des sessions actives
/trust <userId> - Afficher trust score
/2fa_stats - Statistiques 2FA
/gdpr_export <userId> - Export GDPR données user

**Premium Systems:**
/workflows - Automation Engine status
/analytics - Analytics Dashboard
/teams - Multi-User System

**Info:**
/help - Cette aide
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /audit - Security Enterprise
    this.bot.onText(/\/audit/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24h

        const report = await this.securityEnterprise.generateSecurityAuditReport(startDate, endDate);

        const message = `
🔒 **Security Audit Report**

**Period:** ${startDate.toLocaleString()} - ${endDate.toLocaleString()}

**Summary:**
• Total events: ${report.summary.totalEvents}
• Critical events: ${report.summary.criticalEvents}
• Security incidents: ${report.summary.securityIncidents}
• Blocked attempts: ${report.summary.blockedAttempts}

**GDPR Compliance:**
• Status: ${report.compliance.gdpr.status}
• Consent tracking: ${report.compliance.gdpr.consentTracking}
• Data retention violations: ${report.compliance.gdpr.dataRetentionViolations}

**Recommendations:** ${report.recommendations.length}
${report.recommendations.slice(0, 3).map((r, i) =>
  `${i + 1}. [${r.severity}] ${r.issue}`
).join('\n')}
        `;

        await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
      } catch (error) {
        logger.error('Audit report error:', error);
        await this.bot.sendMessage(msg.chat.id, `❌ Error generating audit: ${error.message}`);
      }
    });

    // /sessions - Security Enterprise
    this.bot.onText(/\/sessions/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const sessions = Array.from(this.securityEnterprise.sessions.values());

      const message = `
🔐 **Active Sessions**

**Total sessions:** ${sessions.length}

${sessions.slice(0, 10).map((s, i) => `
${i + 1}. User ${s.userId}
   • Session ID: ${s.id.substring(0, 8)}...
   • Created: ${new Date(s.createdAt).toLocaleString()}
   • Last activity: ${new Date(s.lastActivity).toLocaleString()}
   • 2FA verified: ${s.verified2FA ? '✅' : '❌'}
   • Trust score: ${s.trustScore}
`).join('\n')}

${sessions.length > 10 ? `\n... and ${sessions.length - 10} more` : ''}
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /trust - Security Enterprise
    this.bot.onText(/\/trust (\S+)/, async (msg, match) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const userId = match[1];
      const trustScore = this.securityEnterprise.getTrustScore(userId);

      const message = `
🎯 **Trust Score**

**User:** ${userId}
**Score:** ${trustScore}/100

**Status:** ${trustScore >= 70 ? '✅ High Trust' : trustScore >= 40 ? '⚠️ Medium Trust' : '❌ Low Trust'}

**Actions:**
${trustScore < 50 ? '• 2FA required for sensitive operations' : ''}
${trustScore < 30 ? '• Considered high risk user' : ''}
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /2fa_stats - Security Enterprise
    this.bot.onText(/\/2fa_stats/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const message = `
🔐 **2FA Statistics**

**Status:** ${this.securityEnterprise.mfa.enabled ? '✅ Enabled' : '❌ Disabled'}

**Supported methods:**
${this.securityEnterprise.mfa.methods.map(m => `• ${m}`).join('\n')}

**Required for actions:**
${this.securityEnterprise.mfa.requiredForActions.map(a => `• ${a}`).join('\n')}

**Zero-Trust Mode:** ${this.securityEnterprise.zeroTrust.verifyEveryAction ? '🔒 Strict' : '⚡ Balanced'}
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /gdpr_export - Security Enterprise
    this.bot.onText(/\/gdpr_export (\S+)/, async (msg, match) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const userId = match[1];

      try {
        const data = await this.securityEnterprise.exportUserData(userId);

        await this.bot.sendMessage(msg.chat.id, `
✅ **GDPR Data Export**

**User:** ${userId}
**Export Date:** ${data.exportDate}
**Data Retention Policy:** ${data.metadata.dataRetentionPolicy}

_Data exported. In production, this would be sent as a file._
        `, { parse_mode: 'Markdown' });

        // In production, send as file:
        // await this.bot.sendDocument(msg.chat.id, Buffer.from(JSON.stringify(data, null, 2)), {}, {
        //   filename: `gdpr_export_${userId}_${Date.now()}.json`
        // });
      } catch (error) {
        logger.error('GDPR export error:', error);
        await this.bot.sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
      }
    });

    // /workflows - Automation Engine
    this.bot.onText(/\/workflows/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const stats = this.automation.getStats();
      const workflows = this.automation.listWorkflows();

      const message = `
🤖 **Automation Workflows**

**Statistics:**
• Total workflows: ${workflows.length}
• Active workflows: ${stats.activeWorkflows}
• Total executions: ${stats.totalExecutions}
• Success rate: ${stats.totalExecutions > 0 ? ((stats.successfulExecutions / stats.totalExecutions) * 100).toFixed(1) : 0}%
• Avg execution time: ${stats.averageExecutionTime.toFixed(0)}ms

**Active Workflows:**
${workflows.filter(w => w.enabled).slice(0, 5).map(w =>
  `• ${w.name} (${w.executionCount} runs)`
).join('\n') || 'No active workflows'}
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /analytics - Analytics Dashboard
    this.bot.onText(/\/analytics/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const metrics = this.analytics.getStats();

      const message = `
📊 **Analytics Dashboard**

**Users:**
• Total: ${metrics.users.total}
• Active: ${metrics.users.active}
• New: ${metrics.users.new}
• Retention: ${(metrics.users.retention * 100).toFixed(1)}%

**System Performance:**
• Requests/sec: ${metrics.system.requestsPerSecond.toFixed(2)}
• Avg response: ${metrics.system.averageResponseTime.toFixed(0)}ms
• Error rate: ${(metrics.system.errorRate * 100).toFixed(2)}%

**Business Metrics:**
• Total interactions: ${metrics.business.totalInteractions}
• Success rate: ${(metrics.business.successRate * 100).toFixed(1)}%
• User satisfaction: ${(metrics.business.userSatisfaction * 100).toFixed(1)}%
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /teams - Multi-User System
    this.bot.onText(/\/teams/, async (msg) => {
      if (!this.isAdmin(msg.from.id)) {
        await this.bot.sendMessage(msg.chat.id, '❌ Accès refusé');
        return;
      }

      const stats = this.multiUser.getStats();

      const message = `
👥 **Multi-User System**

**Overview:**
• Total users: ${stats.totalUsers}
• Total teams: ${stats.totalTeams}
• Pending invitations: ${stats.pendingInvitations}

**Shared Resources:**
• Shared credentials: ${stats.sharedCredentials}
• Shared workflows: ${stats.sharedWorkflows}

**Activity:**
• Recent activities: ${stats.recentActivities}
      `;

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });
  }

  async generateDashboard() {
    const performance = this.performance.getAnalytics();
    const security = this.security.getSecurityMetrics();
    const users = this.learningEngine.getGlobalStats();
    const vault = this.vault.getStats();

    const statusEmoji = {
      'healthy': '✅',
      'degraded': '⚠️',
      'unhealthy': '❌'
    };

    return `
🎛️ **SYSTEM DASHBOARD**

**Status:** ${statusEmoji[performance.overview.status]} ${performance.overview.status.toUpperCase()}
**Uptime:** ${performance.overview.uptime}

**📊 Performance:**
• Requests: ${performance.requests.total} (${performance.requests.errorRate} errors)
• Cache hit rate: ${performance.cache.hitRate}
• Avg response: ${Math.round(performance.requests.avgResponseTime)}ms

**🔒 Security:**
• Blocked attempts: ${security.blockedAttempts}
• Threats detected: ${security.threatsDetected}
• Active users: ${security.whitelist.users}
• Banned users: ${security.blacklist.users}

**👥 Users:**
• Total users: ${users.totalUsers}
• Total interactions: ${users.totalInteractions}
• Avg interactions/user: ${users.avgInteractionsPerUser}

**🔐 Vault:**
• Services configured: ${vault.totalCredentials}
• Active: ${vault.activeServices}

**💰 API:**
• OpenAI calls: ${performance.api.openaiCalls}
• Total cost: €${performance.api.openaiCost.toFixed(4)}

**Last Updated:** ${new Date().toLocaleString()}
    `;
  }

  async notifyAdmins(message) {
    for (const chatId of this.adminChatIds) {
      try {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        logger.error(`Failed to notify admin ${chatId}:`, error);
      }
    }
  }

  startAutoReporting() {
    setInterval(async () => {
      const dashboard = await this.generateDashboard();

      await this.notifyAdmins(`
📈 **Hourly Report**

${dashboard}
      `);

      this.autoReport.lastReport = new Date();
    }, this.autoReport.interval);

    logger.info(`✅ Auto-reporting enabled (every ${this.autoReport.interval / 1000 / 60}min)`);
  }

  isAdmin(userId) {
    return this.adminChatIds.has(userId.toString());
  }

  async start() {
    await this.initialize();

    // Error handling
    this.bot.on('polling_error', (error) => {
      logger.error('Polling error:', error);
    });

    logger.info('🚀 Manager Bot started');

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  ⚙️  MANAGER BOT - System Monitoring                          ║
║                                                               ║
║  Status: ✅ RUNNING                                           ║
║  Time: ${new Date().toISOString()}                ║
║                                                               ║
║  📊 Monitoring:                                               ║
║  ✅ Performance Metrics                                      ║
║  ✅ Security Events                                          ║
║  ✅ User Analytics                                           ║
║  ✅ System Health                                            ║
║  ✅ Auto Reports (${this.autoReport.interval / 1000 / 60}min intervals)                     ║
║                                                               ║
║  👥 Admins: ${this.adminChatIds.size}                                                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  }

  async stop() {
    logger.info('🛑 Stopping Manager Bot...');
    await this.bot.stopPolling();
    logger.info('✅ Manager Bot stopped');
  }
}

module.exports = ManagerBot;
