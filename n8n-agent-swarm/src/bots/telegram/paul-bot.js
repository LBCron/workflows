#!/usr/bin/env node

/**
 * Paul Bot - Personal AI Assistant
 *
 * Complete personal assistant with:
 * - Email Agent (Gmail/Outlook)
 * - Calendar Agent (Google Calendar)
 * - Drive Agent (Google Drive) - NEW
 * - Web Search Agent (DuckDuckGo) - NEW
 * - Research Agent Pro
 * - Content Creator Pro
 * - Code Assistant Pro
 * - Setup Wizard (OAuth Google) - NEW
 * - Budget Guardian
 * - Intelligent routing with AI
 */

require('dotenv').config({ path: '.env.paul' });
const TelegramBot = require('node-telegram-bot-api');
const { OpenAI } = require('openai');

// Core
const UniversalMemory = require('../../core/memory/universal-memory-system');
const logger = require('../../core/logger');

// Agents (Pro)
const ResearchAgent = require('../../agents/research-agent-pro');
const ContentCreator = require('../../agents/content-creator-pro');
const CodeAssistant = require('../../agents/code-assistant-pro');
const EmailAgent = require('../../agents/email-agent-pro');
const CalendarAgent = require('../../agents/calendar-agent-pro');

// NEW: Advanced Agents
const DriveAgent = require('../../agents/drive-agent');
const WebSearchAgent = require('../../agents/web-search-agent');

// Setup Wizard
const SetupWizard = require('./setup-wizard');

// Monitoring
const BudgetGuardian = require('../../monitoring/budget-guardian');

/**
 * Validation
 */
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN manquant dans .env.paul');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY manquant dans .env.paul');
  process.exit(1);
}

if (!process.env.ADMIN_USER_ID) {
  console.error('❌ ADMIN_USER_ID manquant dans .env.paul');
  process.exit(1);
}

/**
 * Paul Bot Class
 */
class PaulBot {
  constructor() {
    // Telegram Bot
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: {
        interval: 300,
        autoStart: true,
        params: { timeout: 10 }
      }
    });

    // OpenAI
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Memory (Paul Bot database)
    this.memory = new UniversalMemory('Paul', {
      encryption: true,
      compression: true,
      autoSync: true,
      syncInterval: 3600000
    });

    // Admin
    this.adminUserId = process.env.ADMIN_USER_ID;

    // Budget Guardian
    this.budgetGuardian = new BudgetGuardian();

    // Agents
    this.emailAgent = new EmailAgent();
    this.calendarAgent = new CalendarAgent();

    // NEW: Advanced Agents
    this.driveAgent = new DriveAgent();
    this.webSearchAgent = new WebSearchAgent(this.openai);

    // Setup Wizard (initialized after bot ready)
    this.setupWizard = null;

    // Rate limiting
    this.rateLimitMap = new Map();
    this.RATE_LIMIT_WINDOW = 60000; // 1 minute
    this.MAX_REQUESTS_PER_WINDOW = 10;

    // State
    this.messageProcessingFlags = new Set();

    // Stats
    this.stats = {
      messagesProcessed: 0,
      errors: 0,
      startTime: Date.now()
    };

    // Setup
    this.setupErrorHandlers();
  }

  setupErrorHandlers() {
    // Polling errors
    this.bot.on('polling_error', (error) => {
      logger.error('❌ Polling error:', error.message);
      this.stats.errors++;
    });

    // Webhook errors
    this.bot.on('webhook_error', (error) => {
      logger.error('❌ Webhook error:', error.message);
      this.stats.errors++;
    });

    // Global error handlers
    process.on('unhandledRejection', (error) => {
      logger.error('❌ Unhandled rejection:', error);
      this.stats.errors++;
    });

    logger.info('✅ Error handlers configured');
  }

  /**
   * Start Paul Bot
   */
  async start() {
    logger.info('\n🤖 Paul Bot - Personal AI Assistant');
    logger.info('═'.repeat(60));

    try {
      // Initialize Setup Wizard
      this.setupWizard = new SetupWizard(
        this.bot,
        this.memory,
        null, // xianyuScraper - N/A for Paul Bot
        this.emailAgent,
        this.calendarAgent,
        this.driveAgent
      );

      // Setup handlers
      this.setupCommands();
      this.setupMessageHandler();
      this.setupCallbackQueryHandler();

      logger.info('✅ Paul Bot actif!');
      logger.info(`📁 Mémoire: ${this.memory.paths.local}`);
      logger.info(`👤 Admin: ${this.adminUserId}`);
      logger.info('═'.repeat(60) + '\n');

      // Welcome message
      await this.safeSendMessage(this.adminUserId,
`🤖 Paul Bot - Personal AI Assistant

✨ Features:
- 📧 Gmail (read + send)
- 📅 Calendar (events + scheduling)
- 📁 Google Drive (search + create + read)
- 🔍 Web Search (DuckDuckGo + AI summary)
- 🔬 Research Agent Pro
- ✍️ Content Creator Pro
- 💻 Code Assistant Pro

Commandes:
/start - Menu principal
/setup - Configuration Google OAuth
/email - Gérer emails
/calendar - Gérer agenda
/drive - Google Drive
/search - Recherche web
/budget - Voir budget
/help - Aide complète

Let's go! 🚀`);

    } catch (error) {
      logger.error('❌ Erreur démarrage:', error);
      throw error;
    }
  }

  /**
   * Setup commands
   */
  setupCommands() {
    // /start
    this.bot.onText(/\/start/, async (msg) => {
      if (!this.isAdmin(msg)) return;
      await this.handleStart(msg);
    });

    // /setup - Setup Wizard
    this.bot.onText(/\/setup/, async (msg) => {
      if (!this.isAdmin(msg)) return;

      try {
        await this.setupWizard.start(msg.chat.id, msg.from.id);
      } catch (error) {
        logger.error('Error /setup:', error);
        await this.safeSendMessage(msg.chat.id, `❌ Erreur: ${error.message}`);
      }
    });

    // /email - Email management
    this.bot.onText(/\/email(?:\s+(.+))?/, async (msg, match) => {
      if (!this.isAdmin(msg)) return;
      const query = match[1];
      await this.handleEmailCommand(msg.chat.id, query);
    });

    // /calendar - Calendar management
    this.bot.onText(/\/calendar(?:\s+(.+))?/, async (msg, match) => {
      if (!this.isAdmin(msg)) return;
      const query = match[1];
      await this.handleCalendarCommand(msg.chat.id, query);
    });

    // /drive - Google Drive operations
    this.bot.onText(/\/drive(?:\s+(.+))?/, async (msg, match) => {
      if (!this.isAdmin(msg)) return;
      const query = match[1];

      if (!query) {
        return await this.safeSendMessage(msg.chat.id,
`📁 Google Drive Agent

Commandes:
/drive cherche [mot-clé] - Chercher fichiers
/drive lis [nom-fichier] - Lire un fichier
/drive crée [titre] - Créer un document
/drive liste - Fichiers récents

Exemples:
/drive cherche contrat
/drive lis rapport.txt
/drive crée "Mon rapport"`
        );
      }

      try {
        await this.handleDriveCommand(msg.chat.id, query);
      } catch (error) {
        logger.error('Error /drive:', error);
        await this.safeSendMessage(msg.chat.id, `❌ Erreur Drive: ${error.message}`);
      }
    });

    // /search - Web search
    this.bot.onText(/\/search(?:\s+(.+))?/, async (msg, match) => {
      if (!this.isAdmin(msg)) return;
      const query = match[1];

      if (!query) {
        return await this.safeSendMessage(msg.chat.id,
`🔍 Web Search Agent

Usage: /search [requête]

Exemples:
/search tendances IA 2024
/search actualités Bitcoin
/search Nike Air Max prix

🎁 Gratuit (DuckDuckGo) + résumé IA!`
        );
      }

      try {
        await this.handleSearchCommand(msg.chat.id, query);
      } catch (error) {
        logger.error('Error /search:', error);
        await this.safeSendMessage(msg.chat.id, `❌ Erreur recherche: ${error.message}`);
      }
    });

    // /budget - Budget status
    this.bot.onText(/\/budget/, async (msg) => {
      if (!this.isAdmin(msg)) return;
      await this.handleBudgetCommand(msg.chat.id);
    });

    // /stats - Statistics
    this.bot.onText(/\/stats/, async (msg) => {
      if (!this.isAdmin(msg)) return;
      await this.handleStatsCommand(msg.chat.id);
    });

    // /help - Help
    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelp(msg.chat.id);
    });
  }

  /**
   * /start handler
   */
  async handleStart(msg) {
    const userName = msg.from.first_name || msg.from.username || 'ami';

    const message =
      `👋 Salut ${userName}!\n\n` +
      `Je suis Paul, ton assistant AI ultra-complet!\n\n` +
      `🤖 **Agents disponibles:**\n` +
      `📧 Email - Gestion emails\n` +
      `📅 Calendar - Gestion agenda\n` +
      `📁 Drive - Google Drive\n` +
      `🔍 Search - Recherche web\n` +
      `🔬 Research - Recherche & analyse\n` +
      `✍️ Content - Création de contenu\n` +
      `💻 Code - Aide au code\n\n` +
      `Que veux-tu faire ?`;

    const buttons = [
      [
        { text: '📧 Emails', callback_data: 'action_email' },
        { text: '📅 Agenda', callback_data: 'action_calendar' }
      ],
      [
        { text: '📁 Drive', callback_data: 'action_drive' },
        { text: '🔍 Search', callback_data: 'action_search' }
      ],
      [
        { text: '🔬 Research', callback_data: 'action_research' },
        { text: '✍️ Créer', callback_data: 'action_content' }
      ],
      [
        { text: '💻 Code', callback_data: 'action_code' },
        { text: '⚙️ Setup', callback_data: 'action_setup' }
      ],
      [
        { text: '📊 Stats', callback_data: 'action_stats' },
        { text: '❓ Aide', callback_data: 'action_help' }
      ]
    ];

    await this.sendMessageWithButtons(msg.chat.id, message, buttons);
  }

  /**
   * /email handler
   */
  async handleEmailCommand(chatId, query) {
    if (!query) {
      return await this.safeSendMessage(chatId,
`📧 Email Agent

Commandes:
• "Résume mes emails"
• "Combien d'emails non lus ?"
• "Mes emails non lus"
• "Envoie un email à..."

Ou parle naturellement!`);
    }

    try {
      // Detect action
      if (query.match(/résume|non lu|combien/i)) {
        const result = await this.emailAgent.summarizeUnread('gmail');

        if (result.cost > 0) {
          await this.budgetGuardian.checkAndRecord(result.cost, { action: 'email-summarize' });
        }

        await this.safeSendMessage(chatId, result.summary);
      } else {
        await this.safeSendMessage(chatId, '📧 Fonctionnalité en cours d\'implémentation...');
      }
    } catch (error) {
      await this.safeSendMessage(chatId, `❌ Erreur: ${error.message}\n\n💡 Configure d'abord Gmail avec /setup`);
    }
  }

  /**
   * /calendar handler
   */
  async handleCalendarCommand(chatId, query) {
    if (!query) {
      return await this.safeSendMessage(chatId,
`📅 Calendar Agent

Commandes:
• "Mon agenda aujourd'hui"
• "Mon agenda de la semaine"
• "Crée un meeting demain à 14h"

Ou parle naturellement!`);
    }

    try {
      // Detect action
      if (query.match(/aujourd'hui|agenda du jour/i)) {
        const result = await this.calendarAgent.todayAgenda();
        await this.safeSendMessage(chatId, result.summary);
      } else if (query.match(/semaine|cette semaine/i)) {
        const result = await this.calendarAgent.weekAgenda();
        await this.safeSendMessage(chatId, result.summary);
      } else if (query.match(/crée|créer|ajoute|meeting/i)) {
        const result = await this.calendarAgent.smartSchedule(query);

        if (result.cost > 0) {
          await this.budgetGuardian.checkAndRecord(result.cost, { action: 'calendar-smart-schedule' });
        }

        if (result.success) {
          await this.safeSendMessage(chatId,
            `✅ Événement créé !\n\n` +
            `📅 ${result.event.summary}\n` +
            `🕐 ${new Date(result.event.start).toLocaleString('fr-FR')}\n` +
            `🔗 ${result.event.link}`
          );
        } else {
          await this.safeSendMessage(chatId, `❌ ${result.error}\n\n💡 ${result.suggestion}`);
        }
      } else {
        await this.safeSendMessage(chatId, '📅 Fonctionnalité en cours d\'implémentation...');
      }
    } catch (error) {
      await this.safeSendMessage(chatId, `❌ Erreur: ${error.message}\n\n💡 Configure d'abord Calendar avec /setup`);
    }
  }

  /**
   * /drive handler
   */
  async handleDriveCommand(chatId, query) {
    const lowerQuery = query.toLowerCase();

    try {
      // Search files
      if (lowerQuery.startsWith('cherche ') || lowerQuery.startsWith('search ')) {
        const searchTerm = query.substring(query.indexOf(' ') + 1);
        await this.safeSendMessage(chatId, `🔍 Recherche "${searchTerm}" dans Drive...`);

        const files = await this.driveAgent.searchFiles(searchTerm, 10);

        if (!files || files.length === 0) {
          return await this.safeSendMessage(chatId, '❌ Aucun fichier trouvé');
        }

        let message = `📁 Trouvé ${files.length} fichier(s):\n\n`;
        files.slice(0, 5).forEach((file, i) => {
          message += `${i + 1}. ${file.name}\n`;
          message += `   Type: ${file.mimeType}\n`;
          message += `   🔗 ${file.webViewLink}\n\n`;
        });

        await this.safeSendMessage(chatId, message);
      }
      // List recent files
      else if (lowerQuery === 'liste' || lowerQuery === 'list') {
        await this.safeSendMessage(chatId, '📄 Fichiers récents...');

        const files = await this.driveAgent.listRecentFiles(10);

        if (!files || files.length === 0) {
          return await this.safeSendMessage(chatId, '❌ Aucun fichier');
        }

        let message = `📁 ${files.length} fichiers récents:\n\n`;
        files.forEach((file, i) => {
          message += `${i + 1}. ${file.name}\n`;
          message += `   Modifié: ${new Date(file.modifiedTime).toLocaleDateString()}\n\n`;
        });

        await this.safeSendMessage(chatId, message);
      }
      // Create document
      else if (lowerQuery.startsWith('crée ') || lowerQuery.startsWith('create ')) {
        const title = query.substring(query.indexOf(' ') + 1).replace(/['"]/g, '');
        await this.safeSendMessage(chatId, `📝 Création "${title}"...`);

        const doc = await this.driveAgent.createDocument(title, '');

        await this.safeSendMessage(chatId,
          `✅ Document créé!\n\n📄 ${doc.title}\n🔗 ${doc.url}`
        );
      }
      // Read file
      else if (lowerQuery.startsWith('lis ') || lowerQuery.startsWith('read ')) {
        const fileName = query.substring(query.indexOf(' ') + 1);
        await this.safeSendMessage(chatId, `📖 Lecture "${fileName}"...`);

        // First search for file
        const files = await this.driveAgent.searchFiles(fileName, 1);

        if (!files || files.length === 0) {
          return await this.safeSendMessage(chatId, `❌ Fichier "${fileName}" non trouvé`);
        }

        const file = files[0];
        const content = await this.driveAgent.readFile(file.id);

        const preview = content.substring(0, 2000);
        await this.safeSendMessage(chatId,
          `📄 ${file.name}\n\n${preview}${content.length > 2000 ? '\n\n...(tronqué)' : ''}`
        );
      }
      else {
        await this.safeSendMessage(chatId,
          '❓ Commande non reconnue.\n\nUtilise: /drive pour voir l\'aide'
        );
      }
    } catch (error) {
      await this.safeSendMessage(chatId, `❌ Erreur Drive: ${error.message}\n\n💡 Configure d'abord Drive avec /setup`);
    }
  }

  /**
   * /search handler
   */
  async handleSearchCommand(chatId, query) {
    await this.safeSendMessage(chatId, `🔍 Recherche: "${query}"...`);

    try {
      const results = await this.webSearchAgent.search(query, 5);

      if (!results.results || results.results.length === 0) {
        return await this.safeSendMessage(chatId, '❌ Aucun résultat trouvé');
      }

      // Send summary
      let message = `🔍 **Résultats pour: "${query}"**\n\n`;
      message += `📝 **Résumé:**\n${results.summary}\n\n`;
      message += `🔗 **Sources:**\n`;

      results.results.slice(0, 3).forEach((r, i) => {
        message += `${i + 1}. ${r.title}\n`;
        message += `   ${r.url}\n\n`;
      });

      message += `\n🎯 Source: ${results.source}`;

      await this.safeSendMessage(chatId, message);
    } catch (error) {
      await this.safeSendMessage(chatId, `❌ Erreur recherche: ${error.message}`);
    }
  }

  /**
   * /budget handler
   */
  async handleBudgetCommand(chatId) {
    try {
      const status = await this.budgetGuardian.getStatus();
      const percentage = ((status.spent / status.limit) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));

      const budgetMessage =
        `💰 Budget Status\n\n` +
        `${bar}\n\n` +
        `• Utilisé: €${status.spent.toFixed(4)}\n` +
        `• Limite: €${status.limit}\n` +
        `• Restant: €${status.remaining.toFixed(4)}\n` +
        `• Pourcentage: ${percentage}%\n` +
        `• Status: ${status.status}\n\n` +
        `_Objectif: Rester sous €20/mois avec cache 70-80%_`;

      await this.safeSendMessage(chatId, budgetMessage);
    } catch (error) {
      await this.safeSendMessage(chatId, '❌ Erreur: ' + error.message);
    }
  }

  /**
   * /stats handler
   */
  async handleStatsCommand(chatId) {
    try {
      const budgetStatus = await this.budgetGuardian.getStatus();
      const uptime = process.uptime();
      const memUsage = process.memoryUsage();

      const statsMessage =
        `📊 Statistiques Paul Bot\n\n` +
        `⏱️ Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m\n\n` +
        `📨 Messages: ${this.stats.messagesProcessed}\n` +
        `❌ Erreurs: ${this.stats.errors}\n\n` +
        `💰 Budget:\n` +
        `• Utilisé: €${budgetStatus.spent.toFixed(2)} / €${budgetStatus.limit}\n` +
        `• Restant: €${budgetStatus.remaining.toFixed(2)}\n\n` +
        `💾 Mémoire:\n` +
        `- RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB\n` +
        `- Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`;

      await this.safeSendMessage(chatId, statsMessage);
    } catch (error) {
      await this.safeSendMessage(chatId, '❌ Erreur: ' + error.message);
    }
  }

  /**
   * /help handler
   */
  async handleHelp(chatId) {
    await this.safeSendMessage(chatId,
`📖 **Guide Paul Bot**

**🎯 Setup Initial:**
/setup - Configuration Google (Gmail/Calendar/Drive)

**📧 Email:**
/email - Derniers emails
/email résume - Résumé IA
/email cherche [mot] - Rechercher

**📅 Calendar:**
/calendar - Événements aujourd'hui
/calendar demain - Demain
/calendar crée meeting [details] - Créer

**📁 Drive:**
/drive liste - Derniers fichiers
/drive cherche [mot] - Rechercher
/drive lis [fichier] - Lire contenu
/drive crée [titre] - Créer document

**🔍 Recherche:**
/search [query] - Recherche web + IA

**🔬 Research:**
Pose une question ou "recherche..."

**✍️ Content:**
"Écris..." ou "Crée..."

**💻 Code:**
Mentionne "code" ou "fonction"

**💰 Système:**
/budget - Voir budget
/stats - Statistiques
/help - Cette aide

💡 **Astuce:** Parle naturellement!`);
  }

  /**
   * Setup callback query handler
   */
  setupCallbackQueryHandler() {
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const data = query.callback_data;

      try {
        // Route setup_ callbacks to Setup Wizard
        if (data.startsWith('setup_')) {
          await this.setupWizard.handleCallback(query);
          return;
        }

        // Answer callback
        await this.bot.answerCallbackQuery(query.id);

        // Delete button message
        await this.bot.deleteMessage(chatId, query.message.message_id).catch(() => {});

        // Handle action
        switch (data) {
          case 'action_email':
            await this.safeSendMessage(chatId, '📧 Email Agent activé!\n\nUtilise: /email résume');
            break;

          case 'action_calendar':
            await this.safeSendMessage(chatId, '📅 Calendar Agent activé!\n\nUtilise: /calendar aujourd\'hui');
            break;

          case 'action_drive':
            await this.safeSendMessage(chatId, '📁 Drive Agent activé!\n\nUtilise: /drive liste');
            break;

          case 'action_search':
            await this.safeSendMessage(chatId, '🔍 Search Agent activé!\n\nUtilise: /search [query]');
            break;

          case 'action_research':
            await this.safeSendMessage(chatId, '🔬 Research activé! Pose ta question...');
            break;

          case 'action_content':
            await this.safeSendMessage(chatId, '✍️ Content Creator activé! Dis-moi quoi créer...');
            break;

          case 'action_code':
            await this.safeSendMessage(chatId, '💻 Code Assistant activé! Décris ce que tu veux coder...');
            break;

          case 'action_setup':
            await this.setupWizard.start(chatId, query.from.id);
            break;

          case 'action_stats':
            await this.handleStatsCommand(chatId);
            break;

          case 'action_help':
            await this.handleHelp(chatId);
            break;
        }

      } catch (error) {
        logger.error('Callback query error:', error);
        await this.bot.answerCallbackQuery(query.id, {
          text: `❌ Erreur: ${error.message}`
        }).catch(() => {});
      }
    });

    logger.info('✅ Callback query handler configured');
  }

  /**
   * Setup message handler
   */
  setupMessageHandler() {
    this.bot.on('message', async (msg) => {
      // Skip commands, voice, documents
      if (msg.text?.startsWith('/') || msg.voice || msg.document) return;
      if (!this.isAdmin(msg)) return;
      if (!msg.text) return;

      // Let Setup Wizard handle OAuth codes first
      if (this.setupWizard) {
        const handled = await this.setupWizard.handleMessage(msg);
        if (handled) return;
      }

      // Prevent duplicate processing
      const msgId = `${msg.chat.id}_${msg.message_id}`;
      if (this.messageProcessingFlags.has(msgId)) return;
      this.messageProcessingFlags.add(msgId);

      const userId = msg.from.id.toString();
      const userMessage = msg.text;

      // Rate limiting
      if (!this.checkRateLimit(userId)) {
        this.messageProcessingFlags.delete(msgId);
        return await this.safeSendMessage(msg.chat.id, '⏸️ Trop de requêtes. Attends 1 minute.');
      }

      this.stats.messagesProcessed++;

      logger.info(`💬 [${userId}] "${userMessage.substring(0, 50)}..."`);

      try {
        await this.bot.sendChatAction(msg.chat.id, 'typing');

        // Detect intent
        const intent = this.detectIntent(userMessage);
        logger.info(`🎯 Intent: ${intent}`);

        let result;

        switch (intent) {
          case 'email':
            await this.handleEmailCommand(msg.chat.id, userMessage);
            break;

          case 'calendar':
            await this.handleCalendarCommand(msg.chat.id, userMessage);
            break;

          case 'drive':
            await this.handleDriveCommand(msg.chat.id, userMessage);
            break;

          case 'search':
            await this.handleSearchCommand(msg.chat.id, userMessage);
            break;

          case 'research':
            {
              const agent = new ResearchAgent();
              result = await agent.research(userMessage, 'auto');

              if (result.cost > 0) {
                await this.budgetGuardian.checkAndRecord(result.cost, { model: result.model });
              }

              const response = this.formatResponse(result, 'research');
              await this.safeSendMessage(msg.chat.id, response);
            }
            break;

          case 'content':
            {
              const agent = new ContentCreator();
              result = await agent.create({
                type: 'blog-post',
                topic: userMessage,
                quality: 'auto'
              });

              if (result.cost > 0) {
                await this.budgetGuardian.checkAndRecord(result.cost, { model: result.model });
              }

              const response = this.formatResponse(result, 'content');
              await this.safeSendMessage(msg.chat.id, response);
            }
            break;

          case 'code':
            {
              const agent = new CodeAssistant();
              result = await agent.assist({
                action: 'generate',
                description: userMessage,
                language: 'auto'
              });

              if (result.cost > 0) {
                await this.budgetGuardian.checkAndRecord(result.cost, { model: result.model });
              }

              let codeResponse = '```';
              if (result.language) {
                codeResponse += result.language;
              }
              codeResponse += '\n' + (result.code || result.content) + '\n```';

              if (result.explanation) {
                codeResponse += '\n\n' + result.explanation;
              }

              const response = this.formatResponse({ ...result, content: codeResponse }, 'code');
              await this.safeSendMessage(msg.chat.id, response);
            }
            break;

          default:
            await this.safeSendMessage(msg.chat.id,
              '🤔 Je ne suis pas sûr de comprendre.\n\nUtilise /help pour voir ce que je peux faire!'
            );
        }

      } catch (error) {
        logger.error('❌ Message handler error:', error);
        this.stats.errors++;

        let errorMessage = '❌ Désolé, une erreur est survenue.';

        if (error.message.includes('budget')) {
          errorMessage += '\n\n💰 Budget mensuel dépassé.';
        } else if (error.message.includes('Rate limit')) {
          errorMessage = error.message;
        } else {
          errorMessage += '\n\n_' + error.message + '_';
        }

        await this.safeSendMessage(msg.chat.id, errorMessage);

      } finally {
        this.messageProcessingFlags.delete(msgId);
      }
    });
  }

  /**
   * Detect intent from message
   */
  detectIntent(text) {
    const lower = text.toLowerCase();

    // Drive keywords
    if (lower.match(/drive|fichier|document|google doc|dossier/i)) {
      return 'drive';
    }

    // Search keywords
    if (lower.match(/recherche web|cherche sur internet|google ça|trouve moi|actualités/i)) {
      return 'search';
    }

    // Email keywords
    if (lower.match(/email|mail|gmail|outlook|envoie (un )?message|mes (mails|emails)|non lu|boîte mail|inbox/i)) {
      return 'email';
    }

    // Calendar keywords
    if (lower.match(/agenda|calendrier|rendez-vous|meeting|réunion|événement|rappel|aujourd'hui|demain|semaine|créneau|disponibilité/i)) {
      return 'calendar';
    }

    // Code keywords
    if (lower.match(/code|fonction|script|programme|debug|optimise|class|def|function/i)) {
      return 'code';
    }

    // Content creation keywords
    if (lower.match(/écris|crée|génère|rédige|compose|article|post|contenu|texte|blog/i)) {
      return 'content';
    }

    // Research keywords (fallback pour questions)
    if (
      lower.match(/recherch|analyse|étudie|compare|trouve|explique|c'est quoi|qu'est-ce que/i) ||
      lower.includes('?')
    ) {
      return 'research';
    }

    // Default to research
    return 'research';
  }

  /**
   * Format response with metadata
   */
  formatResponse(result, agent) {
    let response = result.content || result.synthesis || result.code || 'Aucun résultat';

    const metadata = [];

    if (result.model) {
      metadata.push(`🤖 Modèle: ${result.model}`);
    }

    if (result.cached) {
      metadata.push(`⚡ Cache (gratuit!)`);
    } else if (result.cost) {
      metadata.push(`💰 Coût: €${result.cost.toFixed(4)}`);
    }

    if (result.depth) {
      metadata.push(`🔍 Profondeur: ${result.depth}`);
    }

    if (result.style) {
      metadata.push(`✍️ Style: ${result.style}`);
    }

    if (result.language) {
      metadata.push(`💻 Langage: ${result.language}`);
    }

    if (metadata.length > 0) {
      response += '\n\n─────────────\n' + metadata.join(' | ');
    }

    return response;
  }

  /**
   * Rate limiting
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId) || {
      count: 0,
      resetTime: now + this.RATE_LIMIT_WINDOW
    };

    if (now > userLimit.resetTime) {
      this.rateLimitMap.set(userId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW });
      return true;
    }

    if (userLimit.count >= this.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    userLimit.count++;
    this.rateLimitMap.set(userId, userLimit);

    return true;
  }

  /**
   * Check if user is admin
   */
  isAdmin(msg) {
    return msg.from.id.toString() === this.adminUserId;
  }

  /**
   * Safe send message with markdown escaping
   */
  async safeSendMessage(chatId, text, options = {}) {
    try {
      // Remove parse_mode to avoid markdown errors
      const safeOptions = { ...options };
      delete safeOptions.parse_mode;

      return await this.bot.sendMessage(chatId, text, safeOptions);

    } catch (error) {
      logger.error(`Error sending message: ${error.message}`);

      // Fallback
      try {
        return await this.bot.sendMessage(chatId, text, { disable_web_page_preview: true });
      } catch (fallbackError) {
        logger.error('Fallback also failed:', fallbackError.message);
        throw fallbackError;
      }
    }
  }

  /**
   * Send message with inline keyboard buttons
   */
  async sendMessageWithButtons(chatId, text, buttons) {
    const keyboard = {
      inline_keyboard: buttons
    };

    return await this.safeSendMessage(chatId, text, {
      reply_markup: JSON.stringify(keyboard)
    });
  }

  /**
   * Shutdown
   */
  async shutdown() {
    logger.info('🛑 Shutdown Paul Bot...');

    try {
      // Sync memory
      if (typeof this.memory.syncToServer === 'function') {
        await this.memory.syncToServer();
      }

      // Close memory
      if (typeof this.memory.close === 'function') {
        this.memory.close();
      }

      // Stop bot
      await this.bot.stopPolling();

      logger.info('✅ Paul Bot arrêté proprement');

    } catch (error) {
      logger.error('Error during shutdown:', error.message);
    }
  }
}

// Start bot
const paulBot = new PaulBot();
paulBot.start().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await paulBot.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await paulBot.shutdown();
  process.exit(0);
});
