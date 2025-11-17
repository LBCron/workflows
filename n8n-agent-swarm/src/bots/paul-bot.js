/**
 * Paul Bot - AI Assistant with Premium Features
 *
 * Bot Telegram intégré avec tous les systèmes premium:
 * - Credential Vault
 * - Learning Engine
 * - iPhone Sync
 * - Performance Monitoring
 * - UI Premium
 * - Security Manager
 */

const TelegramBot = require('node-telegram-bot-api');
const CredentialVault = require('../core/credential-vault-ultimate');
const LearningEngine = require('../core/learning-engine-v2');
const iPhoneSync = require('../core/iphone-sync-ultimate');
const PerformanceMonitoring = require('../core/performance-monitoring');
const UXPremiumAdvanced = require('../ui/ux-premium-advanced');
const SecurityManager = require('../core/security-manager');
const logger = require('../utils/logger');

// Import agents
const ResearchAgent = require('../../scripts/agents/research-agent-pro');
const EmailAgent = require('../../scripts/agents/email-agent-pro');
const CalendarAgent = require('../../scripts/agents/calendar-agent-pro');

class PaulBot {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });

    // Initialiser tous les systèmes
    this.vault = new CredentialVault();
    this.learningEngine = new LearningEngine();
    this.performance = new PerformanceMonitoring();
    this.ui = new UXPremiumAdvanced(this.bot);
    this.security = new SecurityManager();
    this.iPhoneSync = null; // Initialisé après

    // Agent instances
    this.agents = {};

    // Stats
    this.stats = {
      messagesProcessed: 0,
      commandsExecuted: 0,
      errors: 0,
      startTime: Date.now()
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    logger.info('🤖 Initializing Paul Bot...');

    // Initialiser tous les systèmes
    await this.vault.initialize();
    await this.learningEngine.initialize();
    await this.security.initialize();

    // iPhone Sync
    this.iPhoneSync = new iPhoneSync(this.bot, this.learningEngine);
    await this.iPhoneSync.initialize();

    // Setup event listeners
    this.setupEventListeners();

    // Setup commands
    this.setupCommands();

    // Setup callbacks
    this.setupCallbacks();

    this.initialized = true;

    logger.info('✅ Paul Bot initialized successfully');

    return this;
  }

  setupEventListeners() {
    // Performance alerts
    this.performance.on('alert', (alert) => {
      logger.warn('Performance alert:', alert);
    });

    // Security events
    this.security.on('security_event', (event) => {
      logger.warn('Security event:', event);
    });

    this.security.on('threat_detected', (threat) => {
      logger.error('Threat detected:', threat);
    });
  }

  setupCommands() {
    // /start
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();

      // Validate access
      const access = await this.security.validateAccess(userId, null, 'start');
      if (!access.allowed) {
        await this.bot.sendMessage(chatId, '❌ Access denied');
        return;
      }

      await this.ui.sendStyledMessage(
        chatId,
        `Bonjour ${msg.from.first_name} ! 🤖\n\nJe suis Paul, votre assistant AI premium avec:\n\n` +
        `🔐 Credential Vault sécurisé\n` +
        `🧠 Learning Engine adaptatif\n` +
        `📱 iPhone Sync automatique\n` +
        `⚡ Performance optimisée\n\n` +
        `Utilisez /menu pour commencer !`,
        'success'
      );

      // Track interaction
      await this.learningEngine.trackInteraction(userId, {
        intent: 'start',
        userMessage: '/start',
        timestamp: new Date().toISOString()
      });
    });

    // /menu
    this.bot.onText(/\/menu/, async (msg) => {
      const chatId = msg.chat.id;
      await this.ui.showContextualMenu(chatId, 'main');
    });

    // /credentials
    this.bot.onText(/\/credentials/, async (msg) => {
      const chatId = msg.chat.id;
      await this.ui.showContextualMenu(chatId, 'credentials');
    });

    // /profile
    this.bot.onText(/\/profile/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();

      const insights = await this.learningEngine.getUserInsights(userId);

      if (!insights || insights.error) {
        await this.ui.sendStyledMessage(chatId, 'Pas encore assez de données pour créer votre profil', 'info');
        return;
      }

      const summary = insights.summary;

      await this.ui.sendRichCard(chatId, {
        title: '🧠 Votre Profil AI',
        subtitle: `Utilisateur depuis ${summary.userSince}`,
        fields: [
          { name: 'Total interactions', value: summary.totalInteractions },
          { name: 'Moyenne/jour', value: summary.avgPerDay },
          { name: 'Heure préférée', value: summary.favoriteTime },
          { name: 'Jours préférés', value: summary.favoriteDays },
          { name: 'Topic principal', value: summary.mainTopic },
          { name: 'Complexité', value: summary.complexity }
        ],
        actions: [
          { text: '📊 Analytics détaillées', data: 'learn_analytics' },
          { text: '💡 Suggestions', data: 'learn_suggestions' }
        ]
      });
    });

    // /export
    this.bot.onText(/\/export/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();

      await this.ui.sendStyledMessage(chatId, 'Préparation de l\'export iPhone...', 'loading');

      try {
        const result = await this.iPhoneSync.exportForIPhone(chatId, userId);

        if (result.success) {
          await this.ui.sendStyledMessage(
            chatId,
            `Export terminé ! ${result.formats.length} formats générés (${(result.totalSize / 1024).toFixed(2)} KB)`,
            'success'
          );
        }
      } catch (error) {
        logger.error('Export failed:', error);
        await this.ui.sendStyledMessage(chatId, `Erreur lors de l'export: ${error.message}`, 'error');
      }
    });

    // /stats
    this.bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;

      const analytics = this.performance.getAnalytics();
      const vaultStats = this.vault.getStats();
      const learningStats = this.learningEngine.getGlobalStats();

      const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000 / 60);

      await this.bot.sendMessage(chatId, `
📊 **Statistiques Système**

**Paul Bot:**
• Messages traités: ${this.stats.messagesProcessed}
• Commandes: ${this.stats.commandsExecuted}
• Uptime: ${uptime} minutes

**Performance:**
• Status: ${analytics.overview.status}
• Cache hit rate: ${analytics.cache.hitRate}
• Requêtes/min: ${analytics.overview.requestsPerMinute}

**Vault:**
• Services configurés: ${vaultStats.totalCredentials}
• Active: ${vaultStats.activeServices}

**Learning:**
• Utilisateurs: ${learningStats.totalUsers}
• Total interactions: ${learningStats.totalInteractions}
• Moyenne/user: ${learningStats.avgInteractionsPerUser}
      `, { parse_mode: 'Markdown' });
    });

    // /help
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;

      await this.bot.sendMessage(chatId, `
🤖 **Paul Bot - Aide**

**Commandes disponibles:**

📋 /menu - Menu principal
🔐 /credentials - Gérer credentials
🧠 /profile - Voir votre profil
📱 /export - Export iPhone
📊 /stats - Statistiques système
🔍 /search <query> - Recherche
📧 /email - Actions email
📅 /calendar - Agenda
🎨 /theme - Changer de thème
⚡ /shortcuts - Gérer raccourcis
❓ /help - Cette aide

**Utilisation:**
Envoyez simplement un message naturel et je comprendrai votre intention !

Exemples:
• "Résume mes emails"
• "Mon agenda aujourd'hui"
• "Recherche les tendances IA 2024"
      `, { parse_mode: 'Markdown' });
    });

    // /theme - UX Premium Advanced
    this.bot.onText(/\/theme/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();

      try {
        await this.ui.showThemeSelector(chatId, userId);
      } catch (error) {
        logger.error('Theme selector error:', error);
        await this.ui.sendStyledMessage(chatId, 'Erreur lors de l\'affichage des thèmes', 'error');
      }
    });

    // /shortcuts - UX Premium Advanced
    this.bot.onText(/\/shortcuts/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();

      try {
        await this.ui.showShortcutsMenu(chatId, userId);
      } catch (error) {
        logger.error('Shortcuts menu error:', error);
        await this.ui.sendStyledMessage(chatId, 'Erreur lors de l\'affichage des raccourcis', 'error');
      }
    });
  }

  setupCallbacks() {
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const userId = query.from.id.toString();
      const data = query.data;

      // Answer callback to remove loading state
      await this.bot.answerCallbackQuery(query.id);

      // Handle different callbacks
      if (data === 'menu_credentials') {
        await this.ui.showContextualMenu(chatId, 'credentials');
      } else if (data === 'menu_learning') {
        await this.ui.showContextualMenu(chatId, 'learning');
      } else if (data === 'learn_profile') {
        // Trigger /profile command
        await this.bot.emit('message', { chat: { id: chatId }, from: query.from, text: '/profile' });
      } else if (data === 'learn_analytics') {
        const insights = await this.learningEngine.getUserInsights(userId);

        if (insights && !insights.error) {
          let message = '📊 **Analytics Détaillées**\n\n';

          if (insights.recommendations && insights.recommendations.length > 0) {
            message += '**Recommandations:**\n';
            insights.recommendations.forEach((rec, i) => {
              message += `${i + 1}. ${rec.suggestion}\n   ${rec.action}\n\n`;
            });
          }

          await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }
      } else if (data === 'cred_list') {
        const services = await this.vault.listConfiguredServices();

        if (services.length === 0) {
          await this.ui.sendStyledMessage(chatId, 'Aucun service configuré', 'info');
        } else {
          await this.ui.sendPaginatedList(
            chatId,
            services.map(s => ({
              text: `${s.name} (${s.type}) - Ajouté ${new Date(s.addedAt).toLocaleDateString()}`
            }))
          );
        }
      } else if (data === 'back_main') {
        await this.ui.showContextualMenu(chatId, 'main');
      } else if (data.startsWith('theme_')) {
        // UX Premium Advanced - Theme selection
        const themeId = data.replace('theme_', '');
        try {
          await this.ui.setUserTheme(userId, themeId);
          const theme = this.ui.getUserTheme(userId);
          await this.bot.sendMessage(chatId, `✅ Thème "${theme.name}" activé !`, { parse_mode: 'Markdown' });
        } catch (error) {
          logger.error('Theme change error:', error);
          await this.ui.sendStyledMessage(chatId, 'Erreur lors du changement de thème', 'error');
        }
      }
    });
  }

  /**
   * Handle regular messages
   */
  async handleMessage(msg) {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const text = msg.text;

    const startTime = Date.now();

    try {
      // Rate limiting
      const rateLimit = await this.performance.checkRateLimit(userId);
      if (!rateLimit.allowed) {
        await this.ui.sendStyledMessage(chatId, 'Trop de requêtes, veuillez patienter', 'warning');
        return;
      }

      // Security check
      const access = await this.security.validateAccess(userId, null, 'message');
      if (!access.allowed) {
        await this.ui.sendStyledMessage(chatId, 'Accès refusé', 'error');
        return;
      }

      // Show typing
      await this.ui.showTyping(chatId);

      // Detect intent
      const intent = this.detectIntent(text);

      // Track interaction
      await this.learningEngine.trackInteraction(userId, {
        intent,
        userMessage: text,
        messageLength: text.length,
        timestamp: new Date().toISOString()
      });

      // Handle based on intent
      let response;

      if (intent === 'email') {
        response = await this.handleEmailIntent(text, userId);
      } else if (intent === 'calendar') {
        response = await this.handleCalendarIntent(text, userId);
      } else if (intent === 'research') {
        response = await this.handleResearchIntent(text, userId);
      } else {
        response = "Je n'ai pas compris. Utilisez /help pour voir ce que je peux faire !";
      }

      await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });

      // Track performance
      const duration = Date.now() - startTime;
      this.performance.trackRequest(userId, intent, duration, true);

      this.stats.messagesProcessed++;

    } catch (error) {
      logger.error('Error handling message:', error);

      this.performance.trackError(error, { userId, intent: 'unknown' });
      this.stats.errors++;

      await this.ui.sendStyledMessage(chatId, `Erreur: ${error.message}`, 'error');

      const duration = Date.now() - startTime;
      this.performance.trackRequest(userId, 'error', duration, false);
    }
  }

  detectIntent(text) {
    const lower = text.toLowerCase();

    if (lower.match(/email|mail|gmail|outlook/i)) {
      return 'email';
    }

    if (lower.match(/agenda|calendrier|rendez-vous|meeting/i)) {
      return 'calendar';
    }

    if (lower.match(/recherch|analyse|trouve|explique/i) || lower.includes('?')) {
      return 'research';
    }

    return 'unknown';
  }

  async handleEmailIntent(text, userId) {
    // Implement email handling
    return 'Email feature en cours de traitement...';
  }

  async handleCalendarIntent(text, userId) {
    // Implement calendar handling
    return 'Calendar feature en cours de traitement...';
  }

  async handleResearchIntent(text, userId) {
    try {
      const agent = new ResearchAgent();
      const result = await agent.research(text, 'auto');

      return result.synthesis || result.content || 'Aucun résultat';
    } catch (error) {
      logger.error('Research failed:', error);
      return `Erreur de recherche: ${error.message}`;
    }
  }

  /**
   * Start the bot
   */
  async start() {
    await this.initialize();

    // Setup message handler
    this.bot.on('message', async (msg) => {
      await this.handleMessage(msg);
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      logger.error('Polling error:', error);
    });

    logger.info('🚀 Paul Bot started and listening...');

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🤖 PAUL BOT - AI Assistant Premium                          ║
║                                                               ║
║  Status: ✅ RUNNING                                           ║
║  Time: ${new Date().toISOString()}                ║
║                                                               ║
║  🔥 PREMIUM FEATURES:                                         ║
║  ✅ Credential Vault Ultimate                                ║
║  ✅ Learning Engine V2                                       ║
║  ✅ iPhone Sync                                              ║
║  ✅ Performance Monitoring                                   ║
║  ✅ UI Premium                                               ║
║  ✅ Security Manager                                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Stop the bot
   */
  async stop() {
    logger.info('🛑 Stopping Paul Bot...');
    await this.bot.stopPolling();
    logger.info('✅ Paul Bot stopped');
  }
}

module.exports = PaulBot;
