/**
 * Telegram UI Premium v2.0
 *
 * Système d'interface utilisateur avancé avec:
 * - Boutons interactifs intelligents
 * - Menus contextuels dynamiques
 * - Progress bars temps réel
 * - Rich media responses
 * - Formatage markdown avancé
 */

const logger = require('../utils/logger');

class TelegramUIPremium {
  constructor(bot) {
    this.bot = bot;

    // Templates de keyboards
    this.keyboardTemplates = this.initializeKeyboardTemplates();

    // Progress trackers
    this.progressTrackers = new Map();
    this.progressTrackerMaxAge = 60 * 60 * 1000; // 1 hour

    // Conversation flows actifs
    this.activeFlows = new Map();

    // Auto-cleanup pour éviter memory leaks
    this.startAutoCleanup();

    logger.info('🎨 UI Premium initialized');
  }

  initializeKeyboardTemplates() {
    return {
      mainMenu: {
        inline_keyboard: [
          [
            { text: '📧 Email', callback_data: 'menu_email' },
            { text: '📅 Calendar', callback_data: 'menu_calendar' }
          ],
          [
            { text: '🔐 Credentials', callback_data: 'menu_credentials' },
            { text: '🧠 Learning', callback_data: 'menu_learning' }
          ],
          [
            { text: '⚙️ Settings', callback_data: 'menu_settings' },
            { text: '📊 Stats', callback_data: 'menu_stats' }
          ]
        ]
      },

      emailActions: {
        inline_keyboard: [
          [
            { text: '📥 Lire', callback_data: 'email_read' },
            { text: '✉️ Envoyer', callback_data: 'email_send' }
          ],
          [
            { text: '◀️ Retour', callback_data: 'back_main' }
          ]
        ]
      },

      credentialsMenu: {
        inline_keyboard: [
          [
            { text: '➕ Ajouter service', callback_data: 'cred_add' },
            { text: '📋 Lister', callback_data: 'cred_list' }
          ],
          [
            { text: '🗑️ Supprimer', callback_data: 'cred_remove' },
            { text: '🧪 Tester', callback_data: 'cred_test' }
          ],
          [
            { text: '◀️ Retour', callback_data: 'back_main' }
          ]
        ]
      },

      learningMenu: {
        inline_keyboard: [
          [
            { text: '🧠 Voir profil', callback_data: 'learn_profile' },
            { text: '📊 Analytics', callback_data: 'learn_analytics' }
          ],
          [
            { text: '💡 Suggestions', callback_data: 'learn_suggestions' },
            { text: '◀️ Retour', callback_data: 'back_main' }
          ]
        ]
      },

      confirm: {
        inline_keyboard: [
          [
            { text: '✅ Oui', callback_data: 'confirm_yes' },
            { text: '❌ Non', callback_data: 'confirm_no' }
          ]
        ]
      }
    };
  }

  /**
   * Envoyer message stylé
   */
  async sendStyledMessage(chatId, text, style = 'info', options = {}) {
    const styles = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      loading: '⏳'
    };

    const emoji = styles[style] || styles.info;
    const styledText = `${emoji} ${text}`;

    return await this.bot.sendMessage(chatId, styledText, {
      parse_mode: 'Markdown',
      ...options
    });
  }

  /**
   * Menu contextuel dynamique
   */
  async showContextualMenu(chatId, context, customOptions = {}) {
    let keyboard;
    let message;

    switch (context) {
      case 'main':
        keyboard = this.keyboardTemplates.mainMenu;
        message = `🤖 **Menu Principal**\n\nQue voulez-vous faire ?`;
        break;

      case 'email':
        keyboard = this.keyboardTemplates.emailActions;
        message = `📧 **Email Management**\n\nChoisissez une action :`;
        break;

      case 'credentials':
        keyboard = this.keyboardTemplates.credentialsMenu;
        message = `🔐 **Credential Vault**\n\nGérez vos identifiants :`;
        break;

      case 'learning':
        keyboard = this.keyboardTemplates.learningMenu;
        message = `🧠 **Learning & Insights**\n\nDécouvrez vos patterns :`;
        break;

      default:
        keyboard = this.keyboardTemplates.mainMenu;
        message = 'Menu principal';
    }

    return await this.bot.sendMessage(chatId, message.trim(), {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      ...customOptions
    });
  }

  /**
   * Progress bar temps réel
   */
  async createProgressBar(chatId, title, total) {
    const message = await this.bot.sendMessage(chatId, this.formatProgressBar(title, 0, total));

    const tracker = {
      messageId: message.message_id,
      chatId,
      title,
      current: 0,
      total,
      startTime: Date.now()
    };

    this.progressTrackers.set(message.message_id, tracker);

    return message.message_id;
  }

  async updateProgressBar(messageId, current) {
    const tracker = this.progressTrackers.get(messageId);

    if (!tracker) return;

    tracker.current = current;

    const text = this.formatProgressBar(tracker.title, current, tracker.total);

    try {
      await this.bot.editMessageText(text, {
        chat_id: tracker.chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      // Ignore si message identique
    }
  }

  async completeProgressBar(messageId, finalMessage = null) {
    const tracker = this.progressTrackers.get(messageId);

    if (!tracker) return;

    const duration = ((Date.now() - tracker.startTime) / 1000).toFixed(1);

    const text = finalMessage || `✅ **${tracker.title}**\n\nTerminé en ${duration}s`;

    try {
      await this.bot.editMessageText(text.trim(), {
        chat_id: tracker.chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });
    } catch {}

    this.progressTrackers.delete(messageId);
  }

  formatProgressBar(title, current, total) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round(percentage / 5);
    const empty = 20 - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    return `⏳ **${title}**\n\n${bar} ${percentage}%\n\n${current}/${total}`;
  }

  /**
   * Rich media card
   */
  async sendRichCard(chatId, data) {
    const {
      title,
      subtitle,
      description,
      fields = [],
      actions = []
    } = data;

    let message = '';

    if (title) {
      message += `**${title}**\n`;
    }

    if (subtitle) {
      message += `_${subtitle}_\n`;
    }

    if (description) {
      message += `\n${description}\n`;
    }

    if (fields.length > 0) {
      message += `\n`;
      fields.forEach(field => {
        message += `**${field.name}:** ${field.value}\n`;
      });
    }

    const keyboard = actions.length > 0 ? {
      inline_keyboard: actions.map(action => [{
        text: action.text,
        callback_data: action.data || action.url,
        url: action.url
      }])
    } : undefined;

    await this.bot.sendMessage(chatId, message.trim(), {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  /**
   * Liste paginée
   */
  async sendPaginatedList(chatId, items, page = 0, itemsPerPage = 5) {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIdx = page * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageItems = items.slice(startIdx, endIdx);

    let message = `📋 **Liste (${items.length} items)**\n\n`;

    pageItems.forEach((item, idx) => {
      const globalIdx = startIdx + idx + 1;
      message += `${globalIdx}. ${item.text || item}\n`;
    });

    message += `\n📄 Page ${page + 1}/${totalPages}`;

    const keyboard = {
      inline_keyboard: []
    };

    const navRow = [];

    if (page > 0) {
      navRow.push({ text: '◀️ Précédent', callback_data: `page_${page - 1}` });
    }

    if (page < totalPages - 1) {
      navRow.push({ text: 'Suivant ▶️', callback_data: `page_${page + 1}` });
    }

    if (navRow.length > 0) {
      keyboard.inline_keyboard.push(navRow);
    }

    return await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  /**
   * Typing indicator
   */
  async showTyping(chatId, duration = 5000) {
    await this.bot.sendChatAction(chatId, 'typing');

    if (duration > 5000) {
      const interval = setInterval(() => {
        this.bot.sendChatAction(chatId, 'typing');
      }, 4000);

      setTimeout(() => clearInterval(interval), duration);
    }
  }

  /**
   * Auto-cleanup pour éviter memory leaks
   */
  startAutoCleanup() {
    // Nettoyage des progress trackers toutes les 15 minutes
    setInterval(() => {
      this.cleanupStaleTrackers();
    }, 15 * 60 * 1000);

    logger.info('✅ Auto-cleanup started for UI Premium');
  }

  cleanupStaleTrackers() {
    try {
      const now = Date.now();
      let cleaned = 0;

      for (const [messageId, tracker] of this.progressTrackers.entries()) {
        if (now - tracker.startTime > this.progressTrackerMaxAge) {
          this.progressTrackers.delete(messageId);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.info(`🧹 Cleaned ${cleaned} stale progress trackers`);
      }

    } catch (error) {
      logger.error('Progress tracker cleanup error:', error);
    }
  }

  escapeMarkdown(text) {
    if (!text) return '';
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}

module.exports = TelegramUIPremium;
