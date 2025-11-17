/**
 * Reusable UI Components v2.0
 */

const keyboards = require('./keyboards');
const formatters = require('./formatters');

class UIComponents {
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Send menu
   */
  async sendMenu(chatId, menuType = 'main') {
    const menus = {
      main: {
        text: '📱 *Main Menu*\n\nChoose an option:',
        keyboard: keyboards.getMainMenuKeyboard()
      },
      commerce: {
        text: '🛍️ *Commerce Platforms*\n\nSelect a platform:',
        keyboard: keyboards.getCommerceKeyboard()
      },
      email: {
        text: '📧 *Email Providers*\n\nSelect a provider:',
        keyboard: keyboards.getEmailProvidersKeyboard()
      },
      settings: {
        text: '⚙️ *Settings*\n\nConfigure your bot:',
        keyboard: keyboards.getSettingsKeyboard()
      },
      vault: {
        text: '🔐 *Credential Vault*\n\nManage your services:',
        keyboard: keyboards.getVaultKeyboard()
      },
      learning: {
        text: '🧠 *Learning Engine*\n\nAnalyze and improve:',
        keyboard: keyboards.getLearningEngineKeyboard()
      },
      iphone: {
        text: '📱 *iPhone Sync*\n\nBackup and sync:',
        keyboard: keyboards.getiPhoneSyncKeyboard()
      },
      monitoring: {
        text: '📊 *Monitoring Dashboard*\n\nSystem status:',
        keyboard: keyboards.getMonitoringKeyboard()
      },
      cache: {
        text: '⚡ *Cache Manager*\n\nManage cache:',
        keyboard: keyboards.getCacheKeyboard()
      }
    };

    const menu = menus[menuType] || menus.main;

    return await this.bot.sendMessage(chatId, menu.text, {
      parse_mode: 'Markdown',
      ...menu.keyboard
    });
  }

  /**
   * Send loading message
   */
  async sendLoading(chatId, action = 'Processing') {
    return await this.bot.sendMessage(
      chatId,
      formatters.formatLoadingMessage(action),
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * Update loading message
   */
  async updateMessage(chatId, messageId, text, options = {}) {
    return await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...options
    });
  }

  /**
   * Send success message
   */
  async sendSuccess(chatId, message, details = '') {
    return await this.bot.sendMessage(
      chatId,
      formatters.formatSuccessMessage(message, details),
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * Send error message
   */
  async sendError(chatId, error, context = '') {
    return await this.bot.sendMessage(
      chatId,
      formatters.formatErrorMessage(error, context),
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * Send confirmation dialog
   */
  async sendConfirmation(chatId, message, action, data = '') {
    return await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      ...keyboards.getConfirmationKeyboard(action, data)
    });
  }

  /**
   * Send paginated list
   */
  async sendPaginatedList(chatId, items, page = 1, itemsPerPage = 10, formatItem) {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = items.slice(start, end);

    let message = '';
    pageItems.forEach((item, index) => {
      message += formatItem(item, start + index + 1) + '\n';
    });

    return await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      ...keyboards.getPaginationKeyboard(page, totalPages)
    });
  }

  /**
   * Answer callback query
   */
  async answerCallback(callbackQuery, text = null, showAlert = false) {
    return await this.bot.answerCallbackQuery(callbackQuery.id, {
      text,
      show_alert: showAlert
    });
  }

  /**
   * Send document
   */
  async sendDocument(chatId, filePath, caption = '') {
    return await this.bot.sendDocument(chatId, filePath, {
      caption,
      parse_mode: 'Markdown'
    });
  }

  /**
   * Send with typing action
   */
  async sendWithTyping(chatId, text, delay = 1000, options = {}) {
    await this.bot.sendChatAction(chatId, 'typing');
    await new Promise(resolve => setTimeout(resolve, delay));

    return await this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      ...options
    });
  }
}

module.exports = UIComponents;
