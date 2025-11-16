/**
 * 🧠 CONVERSATION MEMORY MANAGER v1.0
 *
 * Système de mémoire contextuelle pour conversations multi-tours
 *
 * Fonctionnalités:
 * - ✅ Historique de conversation par utilisateur
 * - ✅ Contexte intelligent avec limite de tokens
 * - ✅ Résumés de conversation avec AI
 * - ✅ Extraction d'entités (noms, dates, préférences)
 * - ✅ Persistance en fichiers JSON
 * - ✅ Nettoyage automatique des anciennes conversations
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger/logger');

class ConversationMemory {
  constructor(config = {}) {
    this.config = {
      maxHistoryLength: config.maxHistoryLength || 50,
      maxContextMessages: config.maxContextMessages || 10,
      storageDir: config.storageDir || path.join(process.cwd(), 'data', 'conversations'),
      autoSave: config.autoSave !== false,
      summaryThreshold: config.summaryThreshold || 20, // Résumer après X messages
      ...config
    };

    // Stockage en mémoire
    this.conversations = new Map();
    this.userEntities = new Map(); // Entités extraites par utilisateur
    this.aiRouter = null;

    this.initialized = false;

    logger.info('🧠 Conversation Memory initialisé', {
      maxHistory: this.config.maxHistoryLength,
      maxContext: this.config.maxContextMessages
    });
  }

  /**
   * Inject AI router for smart features
   */
  setAIRouter(router) {
    this.aiRouter = router;
  }

  /**
   * Initialize - Load persisted data
   */
  async initialize() {
    try {
      // Créer le dossier de stockage
      await fs.mkdir(this.config.storageDir, { recursive: true });

      // Charger les conversations existantes
      const files = await fs.readdir(this.config.storageDir);

      let loaded = 0;
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const userId = file.replace('.json', '');
            const data = await this._loadConversation(userId);
            if (data) {
              this.conversations.set(userId, data.messages || []);
              this.userEntities.set(userId, data.entities || {});
              loaded++;
            }
          } catch (error) {
            logger.warn(`⚠️ Erreur chargement conversation ${file}`, { error: error.message });
          }
        }
      }

      this.initialized = true;

      logger.info('✅ Conversations chargées', { count: loaded });

      return { success: true, loaded };
    } catch (error) {
      logger.error('❌ Erreur initialisation memory', { error: error.message });
      throw error;
    }
  }

  /**
   * 💬 AJOUTER UN MESSAGE
   *
   * @param {string} userId - ID utilisateur
   * @param {string} role - 'user' ou 'assistant'
   * @param {string} content - Contenu du message
   * @param {Object} metadata - Métadonnées additionnelles
   */
  async addMessage(userId, role, content, metadata = {}) {
    try {
      if (!this.conversations.has(userId)) {
        this.conversations.set(userId, []);
      }

      const history = this.conversations.get(userId);

      const message = {
        role, // 'user' or 'assistant'
        content,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          model: metadata.model || null,
          tokens: metadata.tokens || null,
          cost: metadata.cost || null
        }
      };

      history.push(message);

      // Limiter la taille de l'historique
      if (history.length > this.config.maxHistoryLength) {
        // Supprimer les messages les plus anciens (sauf le premier pour contexte)
        const toRemove = history.length - this.config.maxHistoryLength;
        history.splice(1, toRemove); // Garde le premier message
      }

      // Extraire les entités si c'est un message utilisateur
      if (role === 'user' && this.aiRouter) {
        await this._extractEntities(userId, content);
      }

      // Auto-save
      if (this.config.autoSave) {
        await this._saveConversation(userId);
      }

      // Vérifier si besoin d'un résumé
      if (history.length >= this.config.summaryThreshold && this.aiRouter) {
        await this._createSummaryIfNeeded(userId);
      }

      logger.debug('💬 Message ajouté', {
        userId,
        role,
        historySize: history.length
      });

      return message;
    } catch (error) {
      logger.error('❌ Erreur ajout message', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 📜 OBTENIR L'HISTORIQUE
   *
   * @param {string} userId - ID utilisateur
   * @param {number} lastN - Nombre de derniers messages
   * @returns {Array} Historique
   */
  getHistory(userId, lastN = null) {
    const history = this.conversations.get(userId) || [];

    if (lastN) {
      return history.slice(-lastN);
    }

    return [...history];
  }

  /**
   * 🎯 OBTENIR LE CONTEXTE POUR AI
   *
   * @param {string} userId - ID utilisateur
   * @param {Object} options - Options
   * @returns {Array} Messages de contexte formatés
   */
  getContext(userId, options = {}) {
    const {
      maxMessages = this.config.maxContextMessages,
      includeSummary = true,
      includeEntities = true
    } = options;

    const history = this.conversations.get(userId) || [];

    // Prendre les derniers messages
    let context = history.slice(-maxMessages);

    // Ajouter le résumé si disponible et demandé
    if (includeSummary && this.userEntities.has(userId)) {
      const entities = this.userEntities.get(userId);
      if (entities.summary) {
        // Insérer le résumé au début du contexte
        context = [
          {
            role: 'system',
            content: `Résumé de la conversation précédente: ${entities.summary}`,
            timestamp: entities.summaryCreatedAt
          },
          ...context
        ];
      }
    }

    // Ajouter les entités extraites si demandé
    if (includeEntities && this.userEntities.has(userId)) {
      const entities = this.userEntities.get(userId);
      if (Object.keys(entities).length > 0) {
        const entitiesText = this._formatEntities(entities);
        if (entitiesText) {
          context = [
            {
              role: 'system',
              content: `Informations connues sur l'utilisateur:\n${entitiesText}`,
              timestamp: new Date().toISOString()
            },
            ...context
          ];
        }
      }
    }

    return context;
  }

  /**
   * 🔍 EXTRAIRE LES ENTITÉS
   *
   * @param {string} userId - ID utilisateur
   * @param {string} content - Contenu à analyser
   */
  async _extractEntities(userId, content) {
    try {
      if (!this.aiRouter) return;

      const prompt = `Analyse ce message et extrait les informations importantes:

"${content}"

Cherche et retourne UNIQUEMENT un JSON avec:
{
  "name": "prénom si mentionné",
  "location": "lieu si mentionné",
  "interests": ["centres d'intérêt"],
  "preferences": ["préférences mentionnées"],
  "dates": ["dates importantes"],
  "other": {}
}

Si rien à extraire, retourne un JSON vide {}. Ne retourne QUE le JSON.`;

      const response = await this.aiRouter.route({
        prompt,
        type: 'analysis',
        temperature: 0.2
      });

      // Parser la réponse
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return;

      const extracted = JSON.parse(jsonMatch[0]);

      // Fusionner avec les entités existantes
      if (!this.userEntities.has(userId)) {
        this.userEntities.set(userId, {});
      }

      const existing = this.userEntities.get(userId);

      // Fusionner intelligemment
      for (const [key, value] of Object.entries(extracted)) {
        if (Array.isArray(value)) {
          existing[key] = [...(existing[key] || []), ...value];
          // Dédupliquer
          existing[key] = [...new Set(existing[key])];
        } else if (value && value !== '') {
          existing[key] = value;
        }
      }

      logger.debug('🔍 Entités extraites', { userId, entities: extracted });
    } catch (error) {
      logger.warn('⚠️ Erreur extraction entités', { error: error.message });
    }
  }

  /**
   * 📝 CRÉER UN RÉSUMÉ DE CONVERSATION
   *
   * @param {string} userId - ID utilisateur
   */
  async _createSummaryIfNeeded(userId) {
    try {
      if (!this.aiRouter) return;

      const entities = this.userEntities.get(userId) || {};

      // Ne créer un résumé que si ça fait un moment
      if (entities.summaryCreatedAt) {
        const lastSummary = new Date(entities.summaryCreatedAt);
        const hoursSince = (Date.now() - lastSummary) / (1000 * 60 * 60);

        if (hoursSince < 6) {
          return; // Pas besoin de nouveau résumé
        }
      }

      const history = this.getHistory(userId);

      // Prendre les messages depuis le dernier résumé
      const messagesToSummarize = history.filter(m => {
        if (!entities.summaryCreatedAt) return true;
        return new Date(m.timestamp) > new Date(entities.summaryCreatedAt);
      });

      if (messagesToSummarize.length < 10) {
        return; // Pas assez de nouveaux messages
      }

      // Créer le résumé
      const conversationText = messagesToSummarize
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = `Résume cette conversation en 3-4 phrases clés, en mettant l'accent sur les sujets importants et les décisions prises:

${conversationText}

Résumé:`;

      const response = await this.aiRouter.route({
        prompt,
        type: 'analysis',
        temperature: 0.3
      });

      entities.summary = response.content;
      entities.summaryCreatedAt = new Date().toISOString();

      logger.info('📝 Résumé créé', { userId });
    } catch (error) {
      logger.warn('⚠️ Erreur création résumé', { error: error.message });
    }
  }

  /**
   * 🗑️ EFFACER L'HISTORIQUE
   *
   * @param {string} userId - ID utilisateur
   */
  async clearHistory(userId) {
    try {
      this.conversations.delete(userId);
      this.userEntities.delete(userId);

      // Supprimer le fichier
      const filePath = path.join(this.config.storageDir, `${userId}.json`);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Fichier n'existe peut-être pas
      }

      logger.info('🗑️ Historique effacé', { userId });

      return { success: true };
    } catch (error) {
      logger.error('❌ Erreur effacement historique', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 📊 STATISTIQUES
   *
   * @param {string} userId - ID utilisateur
   * @returns {Object} Stats
   */
  getStats(userId) {
    const history = this.getHistory(userId);
    const entities = this.userEntities.get(userId) || {};

    const userMessages = history.filter(m => m.role === 'user').length;
    const assistantMessages = history.filter(m => m.role === 'assistant').length;

    const totalTokens = history.reduce((sum, m) => sum + (m.metadata.tokens || 0), 0);
    const totalCost = history.reduce((sum, m) => sum + (m.metadata.cost || 0), 0);

    return {
      totalMessages: history.length,
      userMessages,
      assistantMessages,
      totalTokens,
      totalCost: totalCost.toFixed(4),
      entities: Object.keys(entities).filter(k => k !== 'summary' && k !== 'summaryCreatedAt').length,
      hasSummary: !!entities.summary,
      firstMessage: history[0]?.timestamp || null,
      lastMessage: history[history.length - 1]?.timestamp || null
    };
  }

  /**
   * 🔍 CHERCHER DANS L'HISTORIQUE
   *
   * @param {string} userId - ID utilisateur
   * @param {string} query - Recherche
   * @returns {Array} Messages trouvés
   */
  searchHistory(userId, query) {
    const history = this.getHistory(userId);
    const lowercaseQuery = query.toLowerCase();

    return history.filter(m =>
      m.content.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * 💾 SAUVEGARDER UNE CONVERSATION
   */
  async _saveConversation(userId) {
    try {
      const filePath = path.join(this.config.storageDir, `${userId}.json`);

      const data = {
        userId,
        messages: this.conversations.get(userId) || [],
        entities: this.userEntities.get(userId) || {},
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

      logger.debug('💾 Conversation sauvegardée', { userId });
    } catch (error) {
      logger.error('❌ Erreur sauvegarde conversation', { userId, error: error.message });
    }
  }

  /**
   * 📂 CHARGER UNE CONVERSATION
   */
  async _loadConversation(userId) {
    try {
      const filePath = path.join(this.config.storageDir, `${userId}.json`);

      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('❌ Erreur chargement conversation', { userId, error: error.message });
      }
      return null;
    }
  }

  /**
   * Formatte les entités pour affichage
   */
  _formatEntities(entities) {
    const lines = [];

    if (entities.name) lines.push(`- Nom: ${entities.name}`);
    if (entities.location) lines.push(`- Lieu: ${entities.location}`);
    if (entities.interests && entities.interests.length > 0) {
      lines.push(`- Intérêts: ${entities.interests.join(', ')}`);
    }
    if (entities.preferences && entities.preferences.length > 0) {
      lines.push(`- Préférences: ${entities.preferences.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * 🧹 NETTOYER LES ANCIENNES CONVERSATIONS
   *
   * @param {number} daysOld - Supprimer si plus vieux que X jours
   */
  async cleanupOldConversations(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let cleaned = 0;

      for (const [userId, history] of this.conversations.entries()) {
        if (history.length === 0) continue;

        const lastMessage = history[history.length - 1];
        const lastMessageDate = new Date(lastMessage.timestamp);

        if (lastMessageDate < cutoffDate) {
          await this.clearHistory(userId);
          cleaned++;
        }
      }

      logger.info('🧹 Nettoyage terminé', { cleaned, daysOld });

      return { cleaned };
    } catch (error) {
      logger.error('❌ Erreur nettoyage', { error: error.message });
      throw error;
    }
  }

  /**
   * 📊 STATISTIQUES GLOBALES
   */
  getGlobalStats() {
    const totalUsers = this.conversations.size;
    let totalMessages = 0;
    let totalTokens = 0;
    let totalCost = 0;

    for (const history of this.conversations.values()) {
      totalMessages += history.length;
      totalTokens += history.reduce((sum, m) => sum + (m.metadata.tokens || 0), 0);
      totalCost += history.reduce((sum, m) => sum + (m.metadata.cost || 0), 0);
    }

    return {
      totalUsers,
      totalMessages,
      totalTokens,
      totalCost: totalCost.toFixed(4),
      avgMessagesPerUser: totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0
    };
  }
}

module.exports = ConversationMemory;
