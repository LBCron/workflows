/**
 * Message Formatters v2.0
 *
 * Beautiful message formatting for Telegram
 */

/**
 * Format welcome message
 */
function formatWelcomeMessage(userName) {
  return `🎉 *Welcome ${userName}!*

I'm your AI assistant with ultimate capabilities:

🧠 *Smart Features:*
• Intelligent conversation
• Learning from your behavior
• Proactive suggestions
• Multi-language support

🔐 *Credential Vault:*
• 40+ services supported
• Military-grade encryption
• Auto-login capabilities

🛍️ *Commerce Integration:*
• Xianyu, Vinted, Taobao, eBay
• Auto-scan & notifications
• Price tracking

📧 *Email Management:*
• Gmail, Outlook, Yahoo, iCloud
• Smart summaries
• Auto-categorization

📱 *iPhone Sync:*
• Automatic backups
• Offline access
• Easy restore

Use /menu to get started or just chat naturally!`;
}

/**
 * Format help message
 */
function formatHelpMessage() {
  return `📚 *Help & Commands*

*Basic Commands:*
/start - Start the bot
/menu - Show main menu
/help - Show this help

*Quick Commands:*
/email - Check emails
/calendar - View calendar
/search <query> - Web search
/commerce - Commerce platforms
/settings - Bot settings

*Advanced:*
/vault - Manage credentials
/learning - Learning engine
/iphone - iPhone sync
/monitoring - System status

*Features:*
• Just chat naturally - I'll understand!
• Ask questions in any language
• Request actions (email, search, etc.)
• Configure services via /settings

Need specific help? Just ask me!`;
}

/**
 * Format error message
 */
function formatErrorMessage(error, context = '') {
  return `❌ *Error*

${context ? `Context: ${context}\n` : ''}Message: ${error}

Please try again or use /help for assistance.`;
}

/**
 * Format success message
 */
function formatSuccessMessage(message, details = '') {
  return `✅ *Success!*

${message}

${details ? `\n${details}` : ''}`;
}

/**
 * Format vault statistics
 */
function formatVaultStats(stats) {
  let message = `🔐 *Credential Vault Statistics*\n\n`;

  message += `📊 *Overview:*\n`;
  message += `• Total Services: ${stats.totalServices}\n`;
  message += `• OAuth Services: ${stats.withOAuth}\n`;
  message += `• Need Rotation: ${stats.needsRotation}\n\n`;

  message += `📁 *By Category:*\n`;
  for (const [category, count] of Object.entries(stats.byCategory)) {
    const icon = {
      email: '📧',
      commerce: '🛍️',
      productivity: '📊',
      social: '💬',
      payment: '💳',
      custom: '⚙️'
    }[category] || '📦';

    message += `• ${icon} ${category}: ${count}\n`;
  }

  if (Object.keys(stats.byCountry).length > 0) {
    message += `\n🌍 *By Country:*\n`;
    for (const [country, count] of Object.entries(stats.byCountry)) {
      message += `• ${country}: ${count}\n`;
    }
  }

  return message;
}

/**
 * Format service list
 */
function formatServiceList(services) {
  if (services.length === 0) {
    return `📋 *Your Services*\n\nNo services configured yet.\n\nUse /vault to add your first service!`;
  }

  let message = `📋 *Your Services* (${services.length})\n\n`;

  services.forEach((service, index) => {
    message += `${index + 1}. ${service.icon} *${service.name}*\n`;
    message += `   Category: ${service.category}\n`;
    message += `   Updated: ${new Date(service.updatedAt).toLocaleDateString()}\n\n`;
  });

  return message;
}

/**
 * Format learning profile
 */
function formatLearningProfile(profile) {
  if (!profile) {
    return `🧠 *Learning Profile*\n\nNo profile data yet. Chat more to build your profile!`;
  }

  let message = `🧠 *Your Learning Profile*\n\n`;

  message += `📊 *Analysis:*\n`;
  message += `• Conversations Analyzed: ${profile.conversationsAnalyzed}\n`;
  message += `• Confidence: ${(profile.confidence * 100).toFixed(0)}%\n`;
  message += `• Last Updated: ${new Date(profile.analyzedAt).toLocaleDateString()}\n\n`;

  if (profile.communicationStyle) {
    message += `💬 *Communication Style:*\n`;
    message += `• Tone: ${profile.communicationStyle.tone || 'N/A'}\n`;
    message += `• Verbosity: ${profile.communicationStyle.verbosity || 'N/A'}\n\n`;
  }

  if (profile.expertise) {
    message += `🎓 *Expertise:*\n`;
    message += `• Level: ${profile.expertise.overall || 'N/A'}\n`;
    message += `• Technical: ${profile.expertise.technical || 'N/A'}/100\n\n`;
  }

  if (profile.temporal) {
    message += `⏰ *Activity Pattern:*\n`;
    message += `• Daily: ${profile.temporal.dailyPattern || 'N/A'}\n`;
    message += `• Weekly: ${profile.temporal.weeklyPattern || 'N/A'}\n`;
    message += `• Consistency: ${profile.temporal.consistency || 'N/A'}\n\n`;
  }

  if (profile.topics && profile.topics.main_topics && profile.topics.main_topics.length > 0) {
    message += `📚 *Main Topics:*\n`;
    profile.topics.main_topics.slice(0, 5).forEach(topic => {
      message += `• ${topic.topic} (${topic.relevance || 'N/A'}%)\n`;
    });
  }

  return message;
}

/**
 * Format learning metrics
 */
function formatLearningMetrics(metrics) {
  let message = `📊 *Learning Engine Metrics*\n\n`;

  message += `🎯 *Predictions:*\n`;
  message += `• Total: ${metrics.predictionsTotal}\n`;
  message += `• Correct: ${metrics.predictionsCorrect}\n`;
  message += `• Accuracy: ${metrics.accuracy}\n\n`;

  message += `⚡ *Performance:*\n`;
  message += `• Adaptations Applied: ${metrics.adaptationsApplied}\n`;
  message += `• Cached Profiles: ${metrics.cachedProfiles}\n`;
  message += `• Cached Predictions: ${metrics.cachedPredictions}\n\n`;

  message += `💡 *Suggestions:*\n`;
  message += `• Sent: ${metrics.proactiveSuggestionsSent}\n`;
  message += `• Accepted: ${metrics.proactiveSuggestionsAccepted}\n`;

  if (metrics.proactiveAcceptanceRate) {
    message += `• Acceptance Rate: ${metrics.proactiveAcceptanceRate}\n`;
  }

  return message;
}

/**
 * Format iPhone sync stats
 */
function formatiPhoneSyncStats(stats) {
  let message = `📱 *iPhone Sync Statistics*\n\n`;

  message += `📊 *Overview:*\n`;
  message += `• Total Exports: ${stats.totalExports}\n`;
  message += `• Total Backups: ${stats.totalBackups}\n`;
  message += `• Last Export: ${stats.lastExportDate ? new Date(stats.lastExportDate).toLocaleString() : 'Never'}\n`;
  message += `• Last Backup: ${stats.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleString() : 'Never'}\n\n`;

  message += `⚙️ *Configuration:*\n`;
  message += `• Auto Backup: ${stats.config.autoBackupEnabled ? '✅ Enabled' : '❌ Disabled'}\n`;
  message += `• Retention: ${stats.config.retentionDays} days\n`;
  message += `• Encryption: ${stats.config.encryptionEnabled ? '✅ Enabled' : '❌ Disabled'}\n`;
  message += `• Compression: ${stats.config.compressionEnabled ? '✅ Enabled' : '❌ Disabled'}\n`;

  return message;
}

/**
 * Format monitoring health status
 */
function formatHealthStatus(health) {
  const statusEmoji = {
    healthy: '✅',
    degraded: '⚠️',
    unhealthy: '❌',
    unknown: '❓'
  };

  let message = `❤️ *System Health Status*\n\n`;

  message += `Overall: ${statusEmoji[health.overall]} *${health.overall.toUpperCase()}*\n\n`;

  message += `🔍 *Component Checks:*\n`;
  for (const [component, status] of Object.entries(health.checks)) {
    message += `• ${component}: ${statusEmoji[status]} ${status}\n`;
  }

  message += `\n📊 *Key Metrics:*\n`;
  message += `• Uptime: ${health.metrics.uptime}s\n`;
  message += `• Total Requests: ${health.metrics.totalRequests}\n`;
  message += `• Success Rate: ${health.metrics.successRate}\n`;
  message += `• Avg Response Time: ${health.metrics.averageResponseTime}\n`;
  message += `• Cache Hit Rate: ${health.metrics.cacheHitRate}\n`;
  message += `• CPU Usage: ${health.metrics.cpuUsage}\n`;
  message += `• Memory Usage: ${health.metrics.memoryUsage}\n`;
  message += `• Active Users: ${health.metrics.activeUsers}\n`;
  message += `• Total Cost: ${health.metrics.totalCost}\n`;

  message += `\n🕐 Last Check: ${new Date(health.timestamp).toLocaleString()}`;

  return message;
}

/**
 * Format monitoring metrics
 */
function formatMonitoringMetrics(metrics) {
  let message = `📊 *Monitoring Metrics*\n\n`;

  message += `📈 *Summary:*\n`;
  message += `• Total Requests: ${metrics.summary.totalRequests}\n`;
  message += `• Successful: ${metrics.summary.successfulRequests}\n`;
  message += `• Failed: ${metrics.summary.failedRequests}\n`;
  message += `• Error Rate: ${metrics.summary.errorRate}\n`;
  message += `• Avg Response: ${metrics.summary.averageResponseTime}\n`;
  message += `• Uptime: ${metrics.summary.uptime}\n`;
  message += `• Total Cost: ${metrics.summary.totalCost}\n\n`;

  message += `💾 *Resources:*\n`;
  message += `• CPU: ${metrics.resources.cpuUsage}\n`;
  message += `• Memory: ${metrics.resources.memoryUsage}\n\n`;

  message += `🗄️ *Cache:*\n`;
  message += `• Hits: ${metrics.cache.hits}\n`;
  message += `• Misses: ${metrics.cache.misses}\n`;
  message += `• Hit Rate: ${metrics.cache.hitRate}\n\n`;

  message += `👥 *Users:*\n`;
  message += `• Active: ${metrics.users.active}\n`;
  message += `• Total: ${metrics.users.total}\n\n`;

  if (metrics.agents && metrics.agents.length > 0) {
    message += `🤖 *Top Agents:*\n`;
    metrics.agents.slice(0, 5).forEach(agent => {
      message += `• ${agent.agent}: ${agent.calls} calls (${agent.errorRate})\n`;
    });
  }

  return message;
}

/**
 * Format cache statistics
 */
function formatCacheStats(stats) {
  let message = `🗄️ *Cache Statistics*\n\n`;

  message += `📊 *Performance:*\n`;
  message += `• Hit Rate: ${stats.hitRate}\n`;
  message += `• Total Hits: ${stats.hits}\n`;
  message += `• Total Misses: ${stats.misses}\n`;
  message += `• Evictions: ${stats.evictions}\n\n`;

  message += `💾 *Storage:*\n`;
  message += `• Entries (Memory): ${stats.entriesInMemory}\n`;
  message += `• Entries (Disk): ${stats.entriesOnDisk}\n`;
  message += `• Memory Usage: ${stats.memoryUsageMB} MB\n\n`;

  message += `📈 *Operations:*\n`;
  message += `• Sets: ${stats.sets}\n`;
  message += `• Deletes: ${stats.deletes}\n\n`;

  message += `⚙️ *Config:*\n`;
  message += `• Strategy: ${stats.config.evictionStrategy}\n`;
  message += `• Compression: ${stats.config.compressionEnabled ? '✅' : '❌'}\n`;
  message += `• Persistent: ${stats.config.persistentEnabled ? '✅' : '❌'}\n`;

  return message;
}

/**
 * Format progress bar
 */
function formatProgressBar(percentage, length = 20) {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;

  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
}

/**
 * Format loading message
 */
function formatLoadingMessage(action = 'Processing') {
  return `⏳ ${action}...\n\nPlease wait...`;
}

module.exports = {
  formatWelcomeMessage,
  formatHelpMessage,
  formatErrorMessage,
  formatSuccessMessage,
  formatVaultStats,
  formatServiceList,
  formatLearningProfile,
  formatLearningMetrics,
  formatiPhoneSyncStats,
  formatHealthStatus,
  formatMonitoringMetrics,
  formatCacheStats,
  formatProgressBar,
  formatLoadingMessage
};
