/**
 * UX Premium Advanced v2.0
 *
 * Fonctionnalités avancées:
 * - Animations & transitions élégantes
 * - Templates de messages contextuels
 * - Notifications intelligentes adaptatives
 * - Gestures & shortcuts clavier
 * - Thèmes personnalisables
 * - Voice responses
 * - Emoji intelligence
 */

const TelegramUIPremium = require('./telegram-ui-premium');
const logger = require('../utils/logger');

class UXPremiumAdvanced extends TelegramUIPremium {
  constructor(bot) {
    super(bot);

    // Thèmes disponibles
    this.themes = {
      default: {
        name: 'Default',
        colors: {
          primary: '#667eea',
          success: '#48bb78',
          error: '#f56565',
          warning: '#ed8936',
          info: '#4299e1'
        },
        emojis: {
          success: '✅',
          error: '❌',
          warning: '⚠️',
          info: 'ℹ️',
          loading: '⏳',
          thinking: '🤔'
        }
      },
      dark: {
        name: 'Dark Mode',
        colors: {
          primary: '#9f7aea',
          success: '#68d391',
          error: '#fc8181',
          warning: '#f6ad55',
          info: '#63b3ed'
        },
        emojis: {
          success: '✨',
          error: '🔴',
          warning: '🟡',
          info: '💡',
          loading: '⌛',
          thinking: '💭'
        }
      },
      minimal: {
        name: 'Minimal',
        colors: {
          primary: '#000000',
          success: '#22c55e',
          error: '#ef4444',
          warning: '#f59e0b',
          info: '#3b82f6'
        },
        emojis: {
          success: '✓',
          error: '✗',
          warning: '!',
          info: 'i',
          loading: '...',
          thinking: '?'
        }
      },
      fun: {
        name: 'Fun Mode',
        colors: {
          primary: '#ec4899',
          success: '#10b981',
          error: '#f43f5e',
          warning: '#f59e0b',
          info: '#06b6d4'
        },
        emojis: {
          success: '🎉',
          error: '😢',
          warning: '😰',
          info: '🤓',
          loading: '🔄',
          thinking: '🧐'
        }
      }
    };

    // Thème actuel par user
    this.userThemes = new Map(); // userId → themeId

    // Templates de messages contextuels
    this.messageTemplates = this.initializeAdvancedTemplates();

    // Animation states
    this.animations = new Map(); // messageId → animation data

    // Shortcuts configurés par user
    this.userShortcuts = new Map(); // userId → shortcuts

    // Voice response preferences
    this.voicePreferences = new Map(); // userId → voice settings

    logger.info('🎨 UX Premium Advanced initialized');
  }

  initializeAdvancedTemplates() {
    return {
      // Templates de bienvenue
      welcome: {
        firstTime: (userName) => `
👋 **Bienvenue ${userName} !**

🤖 Je suis votre assistant IA personnel avec des capacités avancées.

**🚀 Quick Start:**
- Essayez de me parler naturellement
- Utilisez /help pour voir toutes les commandes
- Configurez vos services avec /credentials

**💡 Astuce:** Je m'améliore en apprenant de nos conversations !

Que puis-je faire pour vous ?
        `.trim(),

        returning: (userName, lastSeen) => `
👋 Ravi de vous revoir ${userName} !

Dernière visite: ${lastSeen}

**📊 Pendant votre absence:**
[STATS_PLACEHOLDER]

Prêt à continuer ?
        `.trim()
      },

      // Templates de succès
      success: {
        generic: '✅ **Opération réussie !**',
        withDetails: (action, details) => `
✅ **${action} réussi !**

${details}
        `.trim(),
        withStats: (action, stats) => `
✅ **${action} terminé !**

📊 **Résultats:**
${Object.entries(stats).map(([key, val]) => `• ${key}: ${val}`).join('\n')}
        `.trim()
      },

      // Templates d'erreur améliorés
      error: {
        generic: '❌ Une erreur est survenue',
        withSolution: (error, solution) => `
❌ **Erreur**

${error}

**💡 Solution suggérée:**
${solution}
        `.trim(),
        withSupport: (error) => `
❌ **Erreur technique**

${error}

**🆘 Besoin d'aide ?**
- Réessayez dans quelques instants
- Vérifiez votre configuration
- Contactez le support si le problème persiste
        `.trim()
      },

      // Templates de progression élégants
      progress: {
        detailed: (step, total, currentAction) => `
⚡ **Progression**

${this.createProgressBar(step, total)}

**Étape ${step}/${total}:** ${currentAction}

_Veuillez patienter..._
        `.trim()
      },

      // Templates de suggestions intelligentes
      suggestions: {
        proactive: (suggestions) => `
💡 **Suggestions pour vous**

Basé sur votre utilisation, je vous propose:

${suggestions.map((s, i) => `${i + 1}. ${s.text}`).join('\n')}

Intéressé par l'une d'elles ?
        `.trim(),

        automation: (opportunity) => `
🤖 **Opportunité d'automatisation détectée !**

**Action:** ${opportunity.action}
**Fréquence:** ${opportunity.frequency}x
**Temps économisé:** ${opportunity.timeSaved}

Voulez-vous créer une automatisation ?
        `.trim()
      },

      // Templates analytics
      analytics: {
        daily: (stats) => `
📊 **Résumé quotidien**

**Aujourd'hui:**
- ${stats.conversations} conversations
- ${stats.actions} actions effectuées
- ${stats.timeSaved} temps économisé

**Top actions:**
${stats.topActions.map((a, i) => `${i + 1}. ${a.name} (${a.count}x)`).join('\n')}

Bonne journée ! 🌟
        `.trim(),

        weekly: (stats) => `
📈 **Rapport hebdomadaire**

**Cette semaine:**
- ${stats.conversations} conversations
- ${stats.successRate}% taux de réussite
- ${stats.responseTime}s temps de réponse moyen

**Insights:**
${stats.insights.map(i => `• ${i}`).join('\n')}

**Objectifs:**
${stats.goals.map(g => `${g.completed ? '✅' : '⏳'} ${g.name}`).join('\n')}
        `.trim()
      }
    };
  }

  /**
   * Système de thèmes personnalisables
   */
  async setUserTheme(userId, themeId) {
    if (!this.themes[themeId]) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    this.userThemes.set(userId, themeId);

    // Sauvegarder préférence
    await this.saveUserPreference(userId, 'theme', themeId);

    return this.themes[themeId];
  }

  getUserTheme(userId) {
    const themeId = this.userThemes.get(userId) || 'default';
    return this.themes[themeId];
  }

  async showThemeSelector(chatId, userId) {
    const currentTheme = this.getUserTheme(userId);

    const keyboard = {
      inline_keyboard: Object.entries(this.themes).map(([id, theme]) => [{
        text: `${id === this.userThemes.get(userId) ? '✅ ' : ''}${theme.name}`,
        callback_data: `theme_${id}`
      }])
    };

    await this.bot.sendMessage(chatId, `
🎨 **Choisir un thème**

Thème actuel: **${currentTheme.name}**

Sélectionnez un thème ci-dessous:
    `.trim(), {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  /**
   * Animations élégantes
   */
  async animateTyping(chatId, text, speed = 50) {
    // Simuler typing progressif (pour effet dramatique)
    let currentText = '';
    const message = await this.bot.sendMessage(chatId, '_Typing..._', {
      parse_mode: 'Markdown'
    });

    const words = text.split(' ');

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];

      await new Promise(resolve => setTimeout(resolve, speed));

      try {
        await this.bot.editMessageText(currentText, {
          chat_id: chatId,
          message_id: message.message_id
        });
      } catch {}
    }

    return message;
  }

  async animateProgressiveReveal(chatId, sections, delay = 1000) {
    // Révéler contenu section par section
    let fullText = '';
    let message = null;

    for (const section of sections) {
      fullText += section + '\n\n';

      if (!message) {
        message = await this.bot.sendMessage(chatId, fullText.trim(), {
          parse_mode: 'Markdown'
        });
      } else {
        await this.bot.editMessageText(fullText.trim(), {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return message;
  }

  /**
   * Smart notifications adaptatives
   */
  async sendSmartNotification(chatId, userId, notification) {
    const theme = this.getUserTheme(userId);
    const { type, title, body, priority, actions, context } = notification;

    // Adapter selon l'heure
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour <= 7;

    // Adapter selon priorité et contexte
    let emoji = theme.emojis.info;
    let silent = false;

    if (priority === 'urgent') {
      emoji = '🚨';
      silent = false;
    } else if (priority === 'high') {
      emoji = theme.emojis.warning;
      silent = isNight;
    } else if (priority === 'low') {
      emoji = theme.emojis.info;
      silent = true;
    } else {
      silent = isNight;
    }

    // Formater message selon thème
    let message = `${emoji} **${title}**\n\n${body}`;

    if (context) {
      message += `\n\n_Contexte: ${context}_`;
    }

    const keyboard = actions && actions.length > 0 ? {
      inline_keyboard: actions.map(action => [{
        text: action.text,
        callback_data: action.callback
      }])
    } : undefined;

    return await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      disable_notification: silent
    });
  }

  /**
   * Shortcuts & Quick Actions
   */
  async configureShortcut(userId, keyword, action) {
    if (!this.userShortcuts.has(userId)) {
      this.userShortcuts.set(userId, new Map());
    }

    const shortcuts = this.userShortcuts.get(userId);
    shortcuts.set(keyword, action);

    await this.saveUserPreference(userId, 'shortcuts', Object.fromEntries(shortcuts));

    logger.info(`✅ Shortcut configured: ${keyword} → ${action.command}`);
  }

  async executeShortcut(userId, keyword) {
    const shortcuts = this.userShortcuts.get(userId);

    if (!shortcuts || !shortcuts.has(keyword)) {
      return null;
    }

    return shortcuts.get(keyword);
  }

  async showShortcutsMenu(chatId, userId) {
    const shortcuts = this.userShortcuts.get(userId);

    let message = '⚡ **Vos Raccourcis**\n\n';

    if (!shortcuts || shortcuts.size === 0) {
      message += 'Aucun raccourci configuré.\n\n';
      message += 'Créez-en avec /add_shortcut';
    } else {
      message += 'Tapez ces mots-clés pour des actions rapides:\n\n';

      for (const [keyword, action] of shortcuts.entries()) {
        message += `• **${keyword}** → ${action.description}\n`;
      }

      message += '\n💡 Ajoutez-en avec /add_shortcut';
    }

    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  /**
   * Voice Response (TTS)
   */
  async enableVoiceResponses(userId, settings = {}) {
    this.voicePreferences.set(userId, {
      enabled: true,
      voice: settings.voice || 'default',
      speed: settings.speed || 1.0,
      language: settings.language || 'fr-FR'
    });

    await this.saveUserPreference(userId, 'voice', this.voicePreferences.get(userId));
  }

  async sendVoiceResponse(chatId, userId, text) {
    const prefs = this.voicePreferences.get(userId);

    if (!prefs || !prefs.enabled) {
      return null;
    }

    // Utiliser TTS API (Google TTS, Amazon Polly, etc.)
    // Pour l'instant, placeholder

    logger.info('🔊 Voice response requested (not implemented yet)');

    return null;
  }

  /**
   * Emoji Intelligence
   */
  suggestEmoji(text, sentiment = 'neutral') {
    const emojiMap = {
      positive: ['😊', '🎉', '✨', '👍', '💯', '🔥', '⭐'],
      negative: ['😔', '😢', '❌', '⚠️', '💔'],
      neutral: ['💬', '📝', '🤔', 'ℹ️', '📊'],
      question: ['🤔', '❓', '💭', '🧐'],
      action: ['⚡', '🚀', '▶️', '✅', '🔨'],
      celebration: ['🎉', '🥳', '🎊', '🏆', '🎁']
    };

    // Analyse simple du texte
    const lowerText = text.toLowerCase();

    if (lowerText.includes('?')) return this.randomItem(emojiMap.question);
    if (lowerText.includes('bravo') || lowerText.includes('félicitation')) return this.randomItem(emojiMap.celebration);
    if (sentiment === 'positive') return this.randomItem(emojiMap.positive);
    if (sentiment === 'negative') return this.randomItem(emojiMap.negative);

    return this.randomItem(emojiMap.neutral);
  }

  randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Templates avec contexte
   */
  async sendContextualMessage(chatId, userId, templateType, data) {
    const theme = this.getUserTheme(userId);

    // Récupérer template
    const template = this.getTemplate(templateType, data);

    // Appliquer thème
    let message = template;

    // Remplacer emojis selon thème
    Object.entries(theme.emojis).forEach(([key, emoji]) => {
      message = message.replace(new RegExp(`\\[${key.toUpperCase()}\\]`, 'g'), emoji);
    });

    return await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
  }

  getTemplate(type, data) {
    const parts = type.split('.');
    let template = this.messageTemplates;

    for (const part of parts) {
      template = template[part];
      if (!template) return null;
    }

    if (typeof template === 'function') {
      return template(data);
    }

    return template;
  }

  /**
   * Helpers
   */
  createProgressBar(current, total, length = 20) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * length);
    const empty = length - filled;

    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage}%`;
  }

  async saveUserPreference(userId, key, value) {
    // Sauvegarder dans DB
    logger.info(`💾 Saving preference for user ${userId}: ${key}`);
  }
}

module.exports = UXPremiumAdvanced;
