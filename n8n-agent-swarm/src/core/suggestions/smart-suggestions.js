/**
 * 💡 SMART SUGGESTIONS SYSTEM v1.0
 *
 * Système de suggestions proactives et intelligentes
 *
 * Fonctionnalités:
 * - ✅ Suggestions contextuelles basées sur l'heure
 * - ✅ Suggestions basées sur l'historique utilisateur
 * - ✅ Suggestions basées sur l'activité (emails, calendrier, etc.)
 * - ✅ Suggestions de follow-up intelligentes avec AI
 * - ✅ Patterns d'utilisation et recommandations
 * - ✅ Quick actions personnalisées
 */

const logger = require('../logger/logger');

class SmartSuggestions {
  constructor(config = {}) {
    this.config = {
      maxSuggestions: config.maxSuggestions || 5,
      suggestionCooldown: config.suggestionCooldown || 3600000, // 1h en ms
      ...config
    };

    this.aiRouter = null;
    this.conversationMemory = null;

    // Tracking des dernières suggestions par utilisateur
    this.lastSuggestions = new Map();

    // Patterns d'utilisation par utilisateur
    this.userPatterns = new Map();

    logger.info('💡 Smart Suggestions initialisé');
  }

  /**
   * Inject dependencies
   */
  setAIRouter(router) {
    this.aiRouter = router;
  }

  setConversationMemory(memory) {
    this.conversationMemory = memory;
  }

  /**
   * 💡 GÉNÉRER DES SUGGESTIONS
   *
   * @param {string} userId - ID utilisateur
   * @param {Object} context - Contexte actuel
   * @returns {Array} Suggestions
   */
  async generateSuggestions(userId, context = {}) {
    try {
      const suggestions = [];

      // Vérifier le cooldown
      if (this._isInCooldown(userId)) {
        return [];
      }

      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();

      // 1. Suggestions basées sur l'heure du jour
      const timeSuggestions = this._getTimeSuggestions(hour, day);
      suggestions.push(...timeSuggestions);

      // 2. Suggestions basées sur le contexte
      if (context.unreadEmails > 10) {
        suggestions.push({
          type: 'email_summary',
          icon: '📧',
          title: 'Emails non lus',
          message: `Vous avez ${context.unreadEmails} emails non lus`,
          actions: [
            { label: 'Résumer', command: '/email résume mes emails' },
            { label: 'Voir prioritaires', command: '/email important' }
          ],
          priority: context.unreadEmails > 50 ? 'high' : 'medium'
        });
      }

      if (context.upcomingMeetings > 0) {
        suggestions.push({
          type: 'calendar',
          icon: '📅',
          title: 'Réunions aujourd\'hui',
          message: `${context.upcomingMeetings} réunion${context.upcomingMeetings > 1 ? 's' : ''} prévue${context.upcomingMeetings > 1 ? 's' : ''}`,
          actions: [
            { label: 'Voir agenda', command: '/calendar today' },
            { label: 'Préparer notes', command: '/notion create meeting notes' }
          ],
          priority: 'medium'
        });
      }

      if (context.pendingTasks && context.pendingTasks > 5) {
        suggestions.push({
          type: 'tasks',
          icon: '✅',
          title: 'Tâches en attente',
          message: `${context.pendingTasks} tâches en attente`,
          actions: [
            { label: 'Voir tâches', command: '/notion list tasks' },
            { label: 'Prioriser', command: '/notion prioritize tasks' }
          ],
          priority: 'low'
        });
      }

      // 3. Suggestions basées sur l'historique
      if (this.conversationMemory) {
        const historySuggestions = await this._getHistorySuggestions(userId);
        suggestions.push(...historySuggestions);
      }

      // 4. Suggestions basées sur les patterns
      const patternSuggestions = this._getPatternSuggestions(userId);
      suggestions.push(...patternSuggestions);

      // 5. Limiter et trier par priorité
      const prioritized = this._prioritizeSuggestions(suggestions);

      // Enregistrer les suggestions générées
      this._recordSuggestions(userId, prioritized);

      logger.info('💡 Suggestions générées', {
        userId,
        count: prioritized.length
      });

      return prioritized;
    } catch (error) {
      logger.error('❌ Erreur génération suggestions', { userId, error: error.message });
      return [];
    }
  }

  /**
   * 🤖 GÉNÉRER SUGGESTION DE FOLLOW-UP AVEC AI
   *
   * @param {string} userId - ID utilisateur
   * @param {string} lastUserMessage - Dernier message utilisateur
   * @param {string} lastAssistantMessage - Dernière réponse assistant
   * @returns {Object} Suggestion de follow-up
   */
  async generateSmartFollowUp(userId, lastUserMessage, lastAssistantMessage) {
    try {
      if (!this.aiRouter) {
        return null;
      }

      // Récupérer le contexte de conversation
      let conversationContext = '';
      if (this.conversationMemory) {
        const history = this.conversationMemory.getHistory(userId, 3);
        conversationContext = history
          .map(m => `${m.role}: ${m.content}`)
          .join('\n');
      }

      const prompt = `Basé sur cet échange:

User: "${lastUserMessage}"
Assistant: "${lastAssistantMessage}"

Contexte récent:
${conversationContext || 'Aucun'}

Suggère 3 actions pertinentes que l'utilisateur pourrait vouloir faire ensuite.

Format JSON:
{
  "suggestions": [
    {"action": "description courte", "command": "commande optionnelle"},
    {"action": "description courte", "command": "commande optionnelle"},
    {"action": "description courte", "command": "commande optionnelle"}
  ]
}

Réponds UNIQUEMENT avec le JSON.`;

      const response = await this.aiRouter.route({
        prompt,
        type: 'analysis',
        temperature: 0.7
      });

      // Parser la réponse
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const result = JSON.parse(jsonMatch[0]);

      const followUpSuggestion = {
        type: 'follow_up',
        icon: '🎯',
        title: 'Actions suggérées',
        message: 'Que voulez-vous faire ensuite ?',
        actions: result.suggestions.map(s => ({
          label: s.action,
          command: s.command || null
        })),
        priority: 'low'
      };

      logger.info('🤖 Follow-up AI généré', { userId });

      return followUpSuggestion;
    } catch (error) {
      logger.warn('⚠️ Erreur génération follow-up AI', { error: error.message });
      return null;
    }
  }

  /**
   * 📊 ENREGISTRER UN PATTERN D'UTILISATION
   *
   * @param {string} userId - ID utilisateur
   * @param {string} action - Action effectuée
   * @param {Object} metadata - Métadonnées
   */
  recordPattern(userId, action, metadata = {}) {
    try {
      if (!this.userPatterns.has(userId)) {
        this.userPatterns.set(userId, {
          actions: [],
          frequency: {},
          timeOfDay: {},
          dayOfWeek: {}
        });
      }

      const patterns = this.userPatterns.get(userId);

      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();

      // Enregistrer l'action
      patterns.actions.push({
        action,
        timestamp: now.toISOString(),
        hour,
        day,
        metadata
      });

      // Limiter l'historique des actions
      if (patterns.actions.length > 100) {
        patterns.actions.shift();
      }

      // Mettre à jour les fréquences
      patterns.frequency[action] = (patterns.frequency[action] || 0) + 1;

      // Mettre à jour les patterns temporels
      const timeKey = `${hour}h`;
      patterns.timeOfDay[timeKey] = patterns.timeOfDay[timeKey] || {};
      patterns.timeOfDay[timeKey][action] = (patterns.timeOfDay[timeKey][action] || 0) + 1;

      const dayKey = this._getDayName(day);
      patterns.dayOfWeek[dayKey] = patterns.dayOfWeek[dayKey] || {};
      patterns.dayOfWeek[dayKey][action] = (patterns.dayOfWeek[dayKey][action] || 0) + 1;

      logger.debug('📊 Pattern enregistré', { userId, action });
    } catch (error) {
      logger.error('❌ Erreur enregistrement pattern', { error: error.message });
    }
  }

  /**
   * 📈 OBTENIR LES PATTERNS D'UN UTILISATEUR
   *
   * @param {string} userId - ID utilisateur
   * @returns {Object} Patterns
   */
  getUserPatterns(userId) {
    const patterns = this.userPatterns.get(userId);

    if (!patterns) {
      return {
        totalActions: 0,
        topActions: [],
        preferredTimes: [],
        preferredDays: []
      };
    }

    // Top actions
    const topActions = Object.entries(patterns.frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    // Heures préférées
    const timeScores = {};
    for (const [time, actions] of Object.entries(patterns.timeOfDay)) {
      timeScores[time] = Object.values(actions).reduce((sum, count) => sum + count, 0);
    }

    const preferredTimes = Object.entries(timeScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([time]) => time);

    // Jours préférés
    const dayScores = {};
    for (const [day, actions] of Object.entries(patterns.dayOfWeek)) {
      dayScores[day] = Object.values(actions).reduce((sum, count) => sum + count, 0);
    }

    const preferredDays = Object.entries(dayScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);

    return {
      totalActions: patterns.actions.length,
      topActions,
      preferredTimes,
      preferredDays
    };
  }

  /**
   * Suggestions basées sur l'heure
   */
  _getTimeSuggestions(hour, day) {
    const suggestions = [];

    // Matin (7h-10h)
    if (hour >= 7 && hour <= 10) {
      suggestions.push({
        type: 'morning_routine',
        icon: '☀️',
        title: 'Routine matinale',
        message: 'Bonjour ! Que voulez-vous faire ?',
        actions: [
          { label: 'Agenda du jour', command: '/calendar today' },
          { label: 'Résumé emails', command: '/email summary' },
          { label: 'Tâches prioritaires', command: '/notion tasks priority' }
        ],
        priority: 'medium'
      });
    }

    // Pause déjeuner (12h-14h)
    if (hour >= 12 && hour <= 14) {
      suggestions.push({
        type: 'lunch_break',
        icon: '🍽️',
        title: 'Pause déjeuner',
        message: 'Profitez de votre pause !',
        actions: [
          { label: 'Résumé de la matinée', command: '/summary morning' },
          { label: 'Planifier après-midi', command: '/calendar afternoon' }
        ],
        priority: 'low'
      });
    }

    // Fin de journée (17h-19h)
    if (hour >= 17 && hour <= 19) {
      suggestions.push({
        type: 'end_of_day',
        icon: '🌆',
        title: 'Fin de journée',
        message: 'Bilan de la journée',
        actions: [
          { label: 'Résumé journée', command: '/summary today' },
          { label: 'Préparer demain', command: '/calendar tomorrow' },
          { label: 'Emails restants', command: '/email unread' }
        ],
        priority: 'medium'
      });
    }

    // Lundi matin
    if (day === 1 && hour >= 8 && hour <= 10) {
      suggestions.push({
        type: 'week_start',
        icon: '📅',
        title: 'Début de semaine',
        message: 'Planifiez votre semaine',
        actions: [
          { label: 'Agenda semaine', command: '/calendar week' },
          { label: 'Objectifs semaine', command: '/notion weekly goals' }
        ],
        priority: 'medium'
      });
    }

    // Vendredi après-midi
    if (day === 5 && hour >= 15) {
      suggestions.push({
        type: 'week_end',
        icon: '🎉',
        title: 'Fin de semaine',
        message: 'Préparez le weekend',
        actions: [
          { label: 'Bilan semaine', command: '/summary week' },
          { label: 'Tâches en suspens', command: '/notion pending tasks' }
        ],
        priority: 'low'
      });
    }

    return suggestions;
  }

  /**
   * Suggestions basées sur l'historique
   */
  async _getHistorySuggestions(userId) {
    const suggestions = [];

    try {
      if (!this.conversationMemory) return suggestions;

      const history = this.conversationMemory.getHistory(userId, 5);

      if (history.length === 0) return suggestions;

      // Détecter les sujets récurrents
      const userMessages = history
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join(' ');

      // Mots-clés fréquents
      if (userMessages.includes('email') || userMessages.includes('mail')) {
        suggestions.push({
          type: 'email_followup',
          icon: '📧',
          title: 'Gestion emails',
          message: 'Vous consultez souvent vos emails',
          actions: [
            { label: 'Résumé emails', command: '/email summary' },
            { label: 'Créer filtre', command: '/email filter' }
          ],
          priority: 'low'
        });
      }

      if (userMessages.includes('réunion') || userMessages.includes('meeting')) {
        suggestions.push({
          type: 'meeting_prep',
          icon: '📅',
          title: 'Préparation réunion',
          message: 'Préparez vos réunions',
          actions: [
            { label: 'Notes réunion', command: '/notion meeting notes' },
            { label: 'Voir agenda', command: '/calendar today' }
          ],
          priority: 'medium'
        });
      }
    } catch (error) {
      logger.warn('⚠️ Erreur suggestions historique', { error: error.message });
    }

    return suggestions;
  }

  /**
   * Suggestions basées sur les patterns
   */
  _getPatternSuggestions(userId) {
    const suggestions = [];

    const patterns = this.userPatterns.get(userId);
    if (!patterns) return suggestions;

    const now = new Date();
    const hour = now.getHours();
    const day = this._getDayName(now.getDay());

    // Actions fréquentes à cette heure
    const timeKey = `${hour}h`;
    const timeActions = patterns.timeOfDay[timeKey];

    if (timeActions) {
      const topAction = Object.entries(timeActions)
        .sort((a, b) => b[1] - a[1])[0];

      if (topAction && topAction[1] >= 3) {
        suggestions.push({
          type: 'pattern_based',
          icon: '🔄',
          title: 'Action habituelle',
          message: `Vous faites souvent "${topAction[0]}" à cette heure`,
          actions: [
            { label: topAction[0], command: `/${topAction[0]}` }
          ],
          priority: 'low'
        });
      }
    }

    return suggestions;
  }

  /**
   * Prioriser et limiter les suggestions
   */
  _prioritizeSuggestions(suggestions) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return suggestions
      .sort((a, b) => {
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return 0;
      })
      .slice(0, this.config.maxSuggestions);
  }

  /**
   * Vérifier le cooldown
   */
  _isInCooldown(userId) {
    const last = this.lastSuggestions.get(userId);
    if (!last) return false;

    const elapsed = Date.now() - last.timestamp;
    return elapsed < this.config.suggestionCooldown;
  }

  /**
   * Enregistrer les suggestions générées
   */
  _recordSuggestions(userId, suggestions) {
    this.lastSuggestions.set(userId, {
      timestamp: Date.now(),
      count: suggestions.length
    });
  }

  /**
   * Nom du jour
   */
  _getDayName(day) {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[day];
  }

  /**
   * 🗑️ RÉINITIALISER LES PATTERNS D'UN UTILISATEUR
   */
  resetPatterns(userId) {
    this.userPatterns.delete(userId);
    this.lastSuggestions.delete(userId);

    logger.info('🗑️ Patterns réinitialisés', { userId });

    return { success: true };
  }
}

module.exports = SmartSuggestions;
