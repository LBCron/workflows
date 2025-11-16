/**
 * 🔔 NOTIFICATION AGENT PRO v1.0
 *
 * Agent de notifications et rappels intelligents
 *
 * Fonctionnalités:
 * - ✅ Rappels one-time programmés
 * - ✅ Rappels récurrents (cron)
 * - ✅ Parsing langage naturel avec AI
 * - ✅ Gestion des timezones
 * - ✅ Notifications par priorité
 * - ✅ Historique des notifications
 */

const cron = require('node-cron');
const logger = require('../../core/logger/logger');

class NotificationAgent {
  constructor(config = {}) {
    this.config = {
      timezone: config.timezone || 'Europe/Paris',
      defaultPriority: config.defaultPriority || 'medium',
      ...config
    };

    this.aiRouter = null;

    // Stockage des rappels
    this.reminders = new Map();
    this.scheduledTasks = new Map();
    this.history = [];

    this.initialized = true;

    logger.info('🔔 Notification Agent initialisé', { timezone: this.config.timezone });
  }

  /**
   * Inject AI router
   */
  setAIRouter(router) {
    this.aiRouter = router;
  }

  /**
   * 🎯 CRÉER UN RAPPEL ONE-TIME
   *
   * @param {Object} options - Options du rappel
   * @returns {Object} Rappel créé
   */
  createReminder(options) {
    try {
      const {
        id = this._generateId(),
        message,
        datetime,
        priority = this.config.defaultPriority,
        metadata = {}
      } = options;

      const targetDate = new Date(datetime);
      const now = new Date();

      if (isNaN(targetDate.getTime())) {
        throw new Error('Date invalide');
      }

      if (targetDate <= now) {
        throw new Error('La date doit être dans le futur');
      }

      const delay = targetDate - now;

      // Créer le timeout
      const timeout = setTimeout(() => {
        this.triggerReminder(id);
      }, delay);

      const reminder = {
        id,
        type: 'oneTime',
        message,
        datetime: targetDate.toISOString(),
        priority,
        metadata,
        timeout,
        status: 'pending',
        createdAt: now.toISOString()
      };

      this.reminders.set(id, reminder);

      logger.info('🔔 Rappel créé', {
        id,
        message,
        datetime: targetDate.toISOString()
      });

      return {
        id,
        message,
        scheduled: targetDate.toISOString(),
        priority,
        timeUntil: this._formatTimeUntil(delay)
      };
    } catch (error) {
      logger.error('❌ Erreur création rappel', { error: error.message });
      throw error;
    }
  }

  /**
   * 🔄 CRÉER UN RAPPEL RÉCURRENT
   *
   * @param {Object} options - Options du rappel récurrent
   * @returns {Object} Rappel créé
   */
  createRecurringReminder(options) {
    try {
      const {
        id = this._generateId(),
        message,
        cronExpression,
        priority = this.config.defaultPriority,
        metadata = {}
      } = options;

      // Valider l'expression cron
      if (!cron.validate(cronExpression)) {
        throw new Error('Expression cron invalide');
      }

      // Créer la tâche cron
      const task = cron.schedule(
        cronExpression,
        () => {
          this.triggerReminder(id);
        },
        {
          scheduled: true,
          timezone: this.config.timezone
        }
      );

      const reminder = {
        id,
        type: 'recurring',
        message,
        cron: cronExpression,
        priority,
        metadata,
        task,
        status: 'active',
        createdAt: new Date().toISOString(),
        triggerCount: 0
      };

      this.scheduledTasks.set(id, reminder);

      logger.info('🔄 Rappel récurrent créé', {
        id,
        message,
        cron: cronExpression
      });

      return {
        id,
        message,
        schedule: cronExpression,
        nextRun: this._getNextCronRun(cronExpression),
        priority
      };
    } catch (error) {
      logger.error('❌ Erreur création rappel récurrent', { error: error.message });
      throw error;
    }
  }

  /**
   * ⚡ DÉCLENCHER UN RAPPEL
   *
   * @param {string} id - ID du rappel
   * @returns {Object} Notification déclenchée
   */
  triggerReminder(id) {
    try {
      let reminder = this.reminders.get(id) || this.scheduledTasks.get(id);

      if (!reminder) {
        throw new Error(`Rappel ${id} introuvable`);
      }

      const notification = {
        id,
        message: reminder.message,
        priority: reminder.priority,
        triggeredAt: new Date().toISOString(),
        type: reminder.type,
        metadata: reminder.metadata
      };

      // Mettre à jour le statut
      if (reminder.type === 'oneTime') {
        reminder.status = 'triggered';
        // Nettoyer le timeout
        if (reminder.timeout) {
          clearTimeout(reminder.timeout);
        }
      } else if (reminder.type === 'recurring') {
        reminder.triggerCount++;
        reminder.lastTriggered = notification.triggeredAt;
      }

      // Ajouter à l'historique
      this.history.push(notification);

      // Limiter l'historique à 1000 entrées
      if (this.history.length > 1000) {
        this.history.shift();
      }

      logger.info('⚡ Rappel déclenché', {
        id,
        message: reminder.message,
        type: reminder.type
      });

      return notification;
    } catch (error) {
      logger.error('❌ Erreur déclenchement rappel', { id, error: error.message });
      throw error;
    }
  }

  /**
   * ❌ ANNULER UN RAPPEL
   *
   * @param {string} id - ID du rappel
   * @returns {Object} Confirmation
   */
  cancelReminder(id) {
    try {
      // Chercher dans les rappels one-time
      if (this.reminders.has(id)) {
        const reminder = this.reminders.get(id);

        if (reminder.timeout) {
          clearTimeout(reminder.timeout);
        }

        reminder.status = 'cancelled';
        this.reminders.delete(id);

        logger.info('❌ Rappel annulé', { id });

        return {
          success: true,
          id,
          type: 'oneTime',
          message: 'Rappel annulé'
        };
      }

      // Chercher dans les rappels récurrents
      if (this.scheduledTasks.has(id)) {
        const reminder = this.scheduledTasks.get(id);

        if (reminder.task) {
          reminder.task.stop();
        }

        reminder.status = 'cancelled';
        this.scheduledTasks.delete(id);

        logger.info('❌ Rappel récurrent annulé', { id });

        return {
          success: true,
          id,
          type: 'recurring',
          message: 'Rappel récurrent annulé'
        };
      }

      throw new Error(`Rappel ${id} introuvable`);
    } catch (error) {
      logger.error('❌ Erreur annulation rappel', { id, error: error.message });
      throw error;
    }
  }

  /**
   * 📋 LISTER LES RAPPELS
   *
   * @param {Object} filters - Filtres
   * @returns {Object} Liste des rappels
   */
  listReminders(filters = {}) {
    try {
      const { status, type, priority } = filters;

      // Rappels one-time
      let oneTime = Array.from(this.reminders.values()).map(r => ({
        id: r.id,
        type: r.type,
        message: r.message,
        datetime: r.datetime,
        priority: r.priority,
        status: r.status,
        createdAt: r.createdAt,
        timeUntil: this._formatTimeUntil(new Date(r.datetime) - new Date())
      }));

      // Rappels récurrents
      let recurring = Array.from(this.scheduledTasks.values()).map(r => ({
        id: r.id,
        type: r.type,
        message: r.message,
        schedule: r.cron,
        priority: r.priority,
        status: r.status,
        createdAt: r.createdAt,
        triggerCount: r.triggerCount,
        lastTriggered: r.lastTriggered,
        nextRun: this._getNextCronRun(r.cron)
      }));

      // Appliquer les filtres
      if (status) {
        oneTime = oneTime.filter(r => r.status === status);
        recurring = recurring.filter(r => r.status === status);
      }

      if (priority) {
        oneTime = oneTime.filter(r => r.priority === priority);
        recurring = recurring.filter(r => r.priority === priority);
      }

      return {
        oneTime,
        recurring,
        total: oneTime.length + recurring.length,
        counts: {
          oneTime: oneTime.length,
          recurring: recurring.length,
          pending: oneTime.filter(r => r.status === 'pending').length,
          active: recurring.filter(r => r.status === 'active').length
        }
      };
    } catch (error) {
      logger.error('❌ Erreur liste rappels', { error: error.message });
      throw error;
    }
  }

  /**
   * 🤖 PARSER LANGAGE NATUREL
   *
   * @param {string} text - Texte en langage naturel
   * @returns {Object} Rappel parsé
   */
  async parseNaturalLanguage(text) {
    try {
      if (!this.aiRouter) {
        throw new Error('AI Router non disponible');
      }

      const now = new Date();
      const prompt = `Parse cette demande de rappel et retourne UNIQUEMENT un JSON valide sans texte additionnel:

"${text}"

Date/heure actuelle: ${now.toISOString()}

Format attendu:
{
  "type": "oneTime" ou "recurring",
  "datetime": "ISO date" (si oneTime),
  "cron": "expression cron" (si recurring),
  "message": "le message du rappel",
  "priority": "low", "medium" ou "high"
}

Exemples:
"Rappelle-moi demain à 14h d'appeler Jean"
→ {"type": "oneTime", "datetime": "2024-11-17T14:00:00.000Z", "message": "Appeler Jean", "priority": "medium"}

"Tous les lundis à 9h, résume mes emails"
→ {"type": "recurring", "cron": "0 9 * * 1", "message": "Résumer emails", "priority": "medium"}

"Rappel urgent demain matin à 8h: réunion importante"
→ {"type": "oneTime", "datetime": "2024-11-17T08:00:00.000Z", "message": "Réunion importante", "priority": "high"}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

      const response = await this.aiRouter.route({
        prompt,
        type: 'analysis',
        temperature: 0.2
      });

      // Extraire le JSON de la réponse
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Impossible de parser la demande');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      logger.info('🤖 Langage naturel parsé', { text, parsed });

      return parsed;
    } catch (error) {
      logger.error('❌ Erreur parsing langage naturel', { text, error: error.message });
      throw error;
    }
  }

  /**
   * 📊 CRÉER DEPUIS LANGAGE NATUREL
   *
   * @param {string} text - Demande en langage naturel
   * @returns {Object} Rappel créé
   */
  async createFromNaturalLanguage(text) {
    try {
      const parsed = await this.parseNaturalLanguage(text);

      if (parsed.type === 'oneTime') {
        return this.createReminder({
          message: parsed.message,
          datetime: parsed.datetime,
          priority: parsed.priority || 'medium'
        });
      } else if (parsed.type === 'recurring') {
        return this.createRecurringReminder({
          message: parsed.message,
          cronExpression: parsed.cron,
          priority: parsed.priority || 'medium'
        });
      } else {
        throw new Error('Type de rappel invalide');
      }
    } catch (error) {
      logger.error('❌ Erreur création depuis langage naturel', { error: error.message });
      throw error;
    }
  }

  /**
   * 📜 HISTORIQUE DES NOTIFICATIONS
   *
   * @param {Object} filters - Filtres
   * @returns {Array} Historique
   */
  getHistory(filters = {}) {
    try {
      const { limit = 50, priority, since } = filters;

      let history = [...this.history];

      // Filtrer par priorité
      if (priority) {
        history = history.filter(n => n.priority === priority);
      }

      // Filtrer par date
      if (since) {
        const sinceDate = new Date(since);
        history = history.filter(n => new Date(n.triggeredAt) >= sinceDate);
      }

      // Trier par date décroissante
      history.sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));

      // Limiter
      history = history.slice(0, limit);

      return {
        history,
        total: this.history.length,
        filtered: history.length
      };
    } catch (error) {
      logger.error('❌ Erreur récupération historique', { error: error.message });
      throw error;
    }
  }

  /**
   * 🧹 NETTOYER LES RAPPELS EXPIRÉS
   *
   * @returns {Object} Résultat du nettoyage
   */
  cleanupExpiredReminders() {
    try {
      let cleaned = 0;

      // Nettoyer les rappels one-time déjà déclenchés ou annulés
      for (const [id, reminder] of this.reminders.entries()) {
        if (reminder.status === 'triggered' || reminder.status === 'cancelled') {
          this.reminders.delete(id);
          cleaned++;
        }
      }

      logger.info('🧹 Nettoyage effectué', { cleaned });

      return {
        cleaned,
        remaining: this.reminders.size + this.scheduledTasks.size
      };
    } catch (error) {
      logger.error('❌ Erreur nettoyage', { error: error.message });
      throw error;
    }
  }

  /**
   * Helpers
   */
  _generateId() {
    return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _formatTimeUntil(ms) {
    if (ms <= 0) return 'Expiré';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  _getNextCronRun(cronExpression) {
    // Calcul simplifié du prochain run
    // Dans une vraie implémentation, utiliser une lib comme cron-parser
    return 'Prochainement'; // TODO: Implémenter calcul précis
  }
}

module.exports = NotificationAgent;
