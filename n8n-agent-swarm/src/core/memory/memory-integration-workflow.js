/**
 * 📱 MEMORY INTEGRATION - BOT WORKFLOW v1.0
 *
 * Intègre Universal Memory System dans le bot Workflow
 * avec support iPhone optimisé
 *
 * Features:
 * - ✅ Middleware Telegram automatique
 * - ✅ Sauvegarde toutes conversations
 * - ✅ Export/Import pour iPhone
 * - ✅ Auto-backup quotidien vers Telegram
 * - ✅ AI avec contexte enrichi
 * - ✅ Long-term memory (AI apprend)
 * - ✅ Commandes Telegram complètes
 * - ✅ Sync iCloud via Files app
 */

const UniversalMemory = require('./universal-memory-system');
const logger = require('../logger/logger');
const schedule = require('node-cron');
const fs = require('fs');

class MemoryIntegrationWorkflow {
  constructor(bot) {
    this.bot = bot;
    this.memory = new UniversalMemory('Workflow', {
      encryption: true,
      compression: true,
      autoSync: true,
      syncInterval: 3600000 // 1h
    });

    // Middleware activé
    this.middlewareEnabled = true;

    // User preferences pour contexte
    this.userPreferences = new Map();

    logger.info('📱 Memory Integration Workflow initialisé');
  }

  /**
   * 🎯 MIDDLEWARE TELEGRAM - Intercepte tous les messages
   */
  setupMiddleware() {
    logger.info('🧠 Activation middleware mémoire...');

    // Store original handler
    const originalOnMessage = this.bot.on.bind(this.bot);

    // Override avec notre middleware
    this.bot.on = (event, handler) => {
      if (event === 'message') {
        const wrappedHandler = async (msg) => {
          if (!this.middlewareEnabled || !msg.text) {
            return handler(msg);
          }

          const userId = msg.from.id.toString();

          try {
            // Créer/Update profil utilisateur
            await this.ensureUserProfile(msg.from);

            // Charger contexte
            const context = this.memory.getConversationContext(userId, 5);

            // Injecter dans message
            msg._memoryContext = context;
            msg._memory = this.memory;
            msg._memoryIntegration = this;

            // Appeler handler original
            const response = await handler(msg);

            return response;

          } catch (error) {
            logger.error('❌ Erreur middleware mémoire:', error);
            return handler(msg);
          }
        };

        return originalOnMessage(event, wrappedHandler);
      }

      return originalOnMessage(event, handler);
    };

    logger.info('✅ Middleware mémoire actif');
  }

  /**
   * 💾 SAUVEGARDER CONVERSATION
   */
  async saveConversation(userId, userMessage, botResponse, metadata = {}) {
    try {
      const conversationId = this.memory.addConversation(
        userId,
        userMessage,
        botResponse,
        {
          intent: metadata.intent,
          agent: metadata.agent,
          model: metadata.model,
          cost: metadata.cost,
          cached: metadata.cached,
          tokens_used: metadata.tokens_used,
          context: metadata.context
        }
      );

      logger.debug(`💾 Conversation sauvegardée (ID: ${conversationId})`);

      // Auto-apprentissage (extraire facts)
      if (this.memory.aiRouter) {
        await this.autoLearn(userId, userMessage, botResponse);
      }

      return conversationId;

    } catch (error) {
      logger.error('❌ Erreur sauvegarde conversation:', error);
      throw error;
    }
  }

  /**
   * 🧠 AUTO-APPRENTISSAGE (AI apprend de la conversation)
   */
  async autoLearn(userId, userMessage, botResponse) {
    try {
      // Patterns à détecter
      const patterns = {
        name: /(?:je m'appelle|je suis|mon nom est)\s+(\w+)/i,
        location: /(?:j'habite|je vis|je suis à)\s+([^,.!?]+)/i,
        job: /(?:je travaille|mon métier|je suis)\s+([^,.!?]+)/i,
        interest: /(?:j'aime|j'adore|je préfère|intéressé par)\s+([^,.!?]+)/i
      };

      // Extraire facts simples
      for (const [category, pattern] of Object.entries(patterns)) {
        const match = userMessage.match(pattern);
        if (match) {
          const value = match[1].trim();
          await this.memory.rememberFact(
            userId,
            'profile',
            category,
            value,
            0.7, // Confidence moyenne
            'auto_extraction'
          );

          logger.info(`🧠 Fact appris: profile.${category} = ${value}`);
        }
      }

    } catch (error) {
      logger.warn('⚠️ Erreur auto-learn:', error.message);
    }
  }

  /**
   * 📚 OBTENIR CONTEXTE ENRICHI POUR AI
   */
  getEnrichedContext(userId) {
    try {
      // Vérifier si l'utilisateur veut le contexte
      const useContext = this.getUserPreference(userId, 'use_context', true);

      if (!useContext) {
        return {
          conversationContext: [],
          knowledge: {},
          profile: null,
          systemPrompt: null
        };
      }

      // Contexte conversation
      const conversationContext = this.memory.getConversationContext(userId, 5);

      // Knowledge utilisateur
      const knowledge = this.getUserKnowledge(userId);

      // Profil utilisateur
      const profile = this.memory.getUserProfile(userId);

      // System prompt enrichi
      const systemPrompt = this.buildEnrichedSystemPrompt(knowledge, profile);

      return {
        conversationContext,
        knowledge,
        profile,
        systemPrompt
      };

    } catch (error) {
      logger.error('❌ Erreur contexte enrichi:', error);
      return {
        conversationContext: [],
        knowledge: {},
        profile: null,
        systemPrompt: null
      };
    }
  }

  /**
   * 🏗️ CONSTRUIRE SYSTEM PROMPT ENRICHI
   */
  buildEnrichedSystemPrompt(knowledge, profile) {
    let prompt = 'Tu es un assistant IA sophistiqué avec mémoire contextuelle.';

    // Ajouter ce qu'on sait de l'utilisateur
    if (Object.keys(knowledge).length > 0) {
      prompt += '\n\n📝 Ce que je sais sur l\'utilisateur:\n';

      Object.entries(knowledge).forEach(([category, facts]) => {
        if (Object.keys(facts).length > 0) {
          prompt += `\n**${category.toUpperCase()}:**\n`;
          Object.entries(facts).forEach(([key, data]) => {
            prompt += `- ${key}: ${data.value} (confiance: ${Math.round(data.confidence * 100)}%)\n`;
          });
        }
      });
    }

    // Ajouter préférences
    if (profile?.preferences) {
      try {
        const prefs = typeof profile.preferences === 'string'
          ? JSON.parse(profile.preferences)
          : profile.preferences;

        if (Object.keys(prefs).length > 0) {
          prompt += '\n\n⚙️ Préférences:\n';
          Object.entries(prefs).forEach(([key, value]) => {
            prompt += `- ${key}: ${value}\n`;
          });
        }
      } catch {}
    }

    // Langue
    if (profile?.language) {
      prompt += `\n🌐 Langue préférée: ${profile.language}`;
    }

    prompt += '\n\n💡 Utilise ces informations pour personnaliser tes réponses et être plus pertinent.';

    return prompt;
  }

  /**
   * 🧠 OBTENIR KNOWLEDGE UTILISATEUR
   */
  getUserKnowledge(userId) {
    try {
      const facts = this.memory.getAllFacts(userId);

      // Organiser par catégorie
      const knowledge = {};

      facts.forEach(fact => {
        if (!knowledge[fact.category]) {
          knowledge[fact.category] = {};
        }
        knowledge[fact.category][fact.key] = {
          value: fact.value,
          confidence: fact.confidence,
          updated: fact.updated_at,
          accessCount: fact.access_count
        };
      });

      return knowledge;

    } catch (error) {
      logger.error('❌ Erreur récupération knowledge:', error);
      return {};
    }
  }

  /**
   * 👤 PROFIL UTILISATEUR
   */
  async ensureUserProfile(telegramUser) {
    try {
      const userId = telegramUser.id.toString();

      let profile = this.memory.getUserProfile(userId);

      if (!profile) {
        // Créer profil
        this.memory.createOrUpdateUserProfile(userId, {
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          language: telegramUser.language_code || 'fr'
        });

        logger.info(`✅ Profil créé pour ${userId} (@${telegramUser.username})`);
      } else {
        // Update last_active
        this.memory.updateUserActivity(userId);
      }

      return this.memory.getUserProfile(userId);

    } catch (error) {
      logger.error('❌ Erreur profil utilisateur:', error);
      return null;
    }
  }

  /**
   * ⚙️ PRÉFÉRENCES UTILISATEUR
   */
  getUserPreference(userId, key, defaultValue = null) {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, {});
    }

    const prefs = this.userPreferences.get(userId);
    return prefs[key] !== undefined ? prefs[key] : defaultValue;
  }

  setUserPreference(userId, key, value) {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, {});
    }

    this.userPreferences.get(userId)[key] = value;
  }

  /**
   * 📱 COMMANDES TELEGRAM MÉMOIRE
   */
  setupMemoryCommands() {
    logger.info('📱 Configuration commandes mémoire...');

    // /memory_stats - Statistiques
    this.bot.onText(/\/memory_stats/, async (msg) => {
      const userId = msg.from.id.toString();
      const stats = this.memory.getStats();
      const userConvs = this.memory.getConversationHistory(userId, 1000).length;
      const userFacts = this.memory.getAllFacts(userId).length;

      await this.bot.sendMessage(msg.chat.id, `
🧠 **Statistiques Mémoire**

📁 **Base de données**
• Localisation: \`${stats.dbPath.split('/').slice(-3).join('/')}\`
• Taille: **${stats.dbSizeFormatted}**

💬 **Conversations**
• Total système: ${stats.tables.conversations}
• Tes conversations: **${userConvs}**

🧠 **Long-term Memory**
• Total facts: ${stats.tables.longTermMemory}
• Ce que je sais de toi: **${userFacts} facts**

👥 **Utilisateurs**
• Total: ${stats.tables.users}

⚡ **Performance**
• Lectures: ${stats.performance.totalReads}
• Écritures: ${stats.performance.totalWrites}

🔄 **Sync**
• Dernier sync: ${stats.sync.lastSync ? new Date(stats.sync.lastSync).toLocaleString('fr-FR') : 'Jamais'}
• Total syncs: ${stats.sync.totalSyncs}
• Auto-sync: ${stats.sync.autoSyncEnabled ? '✅ Actif' : '❌ Inactif'}

💾 **Exports**
• Total: ${stats.exports.total}
      `, { parse_mode: 'Markdown' });
    });

    // /memory_export - Export pour iPhone
    this.bot.onText(/\/memory_export/, async (msg) => {
      const userId = msg.from.id.toString();

      await this.bot.sendMessage(msg.chat.id, '📤 Export en cours...');

      try {
        const exportData = await this.memory.exportForTelegram(userId);

        await this.bot.sendDocument(msg.chat.id, exportData.path, {
          caption: `
✅ **Export terminé !**

📊 ${exportData.recordsCount} conversations
💾 ${(exportData.size / 1024).toFixed(2)} KB

📱 **Pour iPhone:**
1. Télécharge ce fichier
2. Sauvegarde dans Files app → iCloud Drive
3. Pour restaurer: \`/memory_import\`
          `.trim(),
          parse_mode: 'Markdown'
        });

        logger.info(`✅ Export envoyé à ${userId}`);

      } catch (error) {
        logger.error('❌ Erreur export:', error);
        await this.bot.sendMessage(msg.chat.id, `❌ Erreur: ${error.message}`);
      }
    });

    // /memory_import - Instructions import
    this.bot.onText(/\/memory_import/, async (msg) => {
      await this.bot.sendMessage(msg.chat.id, `
📥 **Import Mémoire**

📱 **iPhone - Étapes:**
1. Ouvre **Files app**
2. Trouve ton export (\`.json.gz\`)
3. **Partage** le fichier avec Telegram
4. **Envoie-le** moi ici
5. Je vais restaurer ta mémoire automatiquement !

💡 Le fichier doit être un export précédent créé avec \`/memory_export\`.
      `, { parse_mode: 'Markdown' });
    });

    // /memory_search - Recherche
    this.bot.onText(/\/memory_search (.+)/, async (msg, match) => {
      const userId = msg.from.id.toString();
      const keyword = match[1];

      const results = this.memory.searchConversations(userId, keyword, 10);

      if (results.length === 0) {
        return this.bot.sendMessage(msg.chat.id, `🔍 Aucun résultat pour "${keyword}"`);
      }

      let message = `🔍 **Résultats pour "${keyword}"** (${results.length})\n\n`;

      results.slice(0, 5).forEach((conv, i) => {
        const date = new Date(conv.timestamp).toLocaleDateString('fr-FR');
        message += `**${i + 1}. ${date}**\n`;
        message += `   Toi: _${conv.user_message.substring(0, 60)}${conv.user_message.length > 60 ? '...' : ''}_\n`;
        message += `   Moi: _${conv.bot_response.substring(0, 60)}${conv.bot_response.length > 60 ? '...' : ''}_\n\n`;
      });

      if (results.length > 5) {
        message += `_... et ${results.length - 5} autres résultats_`;
      }

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /memory_knowledge - Ce que je sais de toi
    this.bot.onText(/\/memory_knowledge/, async (msg) => {
      const userId = msg.from.id.toString();
      const knowledge = this.getUserKnowledge(userId);

      if (Object.keys(knowledge).length === 0) {
        return this.bot.sendMessage(msg.chat.id, '🧠 Je ne sais encore rien de spécifique sur toi.\n\nDiscutons pour que j\'apprenne à te connaître !');
      }

      let message = '🧠 **Ce que je sais de toi:**\n\n';

      Object.entries(knowledge).forEach(([category, facts]) => {
        message += `**${category.toUpperCase()}:**\n`;
        Object.entries(facts).forEach(([key, data]) => {
          const confidence = Math.round(data.confidence * 100);
          message += `• ${key}: **${data.value}** _(${confidence}% confiance)_\n`;
        });
        message += '\n';
      });

      message += '💡 _Ces informations m\'aident à personnaliser mes réponses._';

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /memory_forget - Effacer contexte (temporaire)
    this.bot.onText(/\/memory_forget/, async (msg) => {
      const userId = msg.from.id.toString();

      this.setUserPreference(userId, 'use_context', false);

      await this.bot.sendMessage(msg.chat.id, `
✅ **Contexte conversation désactivé**

🧠 Je vais commencer une nouvelle conversation sans utiliser le contexte des messages précédents.

💡 **Tes données sont toujours sauvegardées**, mais je ne les utiliserai pas temporairement.

Pour réactiver: \`/memory_remember\`
      `, { parse_mode: 'Markdown' });
    });

    // /memory_remember - Réactiver contexte
    this.bot.onText(/\/memory_remember/, async (msg) => {
      const userId = msg.from.id.toString();

      this.setUserPreference(userId, 'use_context', true);

      await this.bot.sendMessage(msg.chat.id, '✅ Contexte conversation réactivé ! Je me souviens maintenant de nos discussions.');
    });

    // /memory_backup - Backup manuel
    this.bot.onText(/\/memory_backup/, async (msg) => {
      await this.bot.sendMessage(msg.chat.id, '💾 Création backup...');

      try {
        const backup = await this.memory.createBackup(true, true);

        await this.bot.sendMessage(msg.chat.id, `
✅ **Backup créé !**

📁 \`${backup.path.split('/').pop()}\`
💾 ${(backup.size / 1024).toFixed(2)} KB
🔒 Encrypted: ${backup.encrypted ? 'Oui' : 'Non'}
📦 Compressed: ${backup.compressed ? 'Oui' : 'Non'}

Le backup est automatiquement synchronisé avec le serveur.
        `, { parse_mode: 'Markdown' });

      } catch (error) {
        await this.bot.sendMessage(msg.chat.id, `❌ Erreur: ${error.message}`);
      }
    });

    // /memory_clear - DANGER: Effacer tout (avec confirmation)
    this.bot.onText(/\/memory_clear/, async (msg) => {
      await this.bot.sendMessage(msg.chat.id, `
⚠️ **ATTENTION: Action dangereuse**

Cette commande va **effacer TOUTES tes données** :
• Historique conversations
• Long-term memory
• Préférences

**C'est irréversible !**

Pour confirmer, envoie: \`/memory_clear_confirm\`
      `, { parse_mode: 'Markdown' });
    });

    // Confirmation clear
    this.bot.onText(/\/memory_clear_confirm/, async (msg) => {
      const userId = msg.from.id.toString();

      try {
        await this.memory.clearHistory(userId);

        // Clear preferences
        this.userPreferences.delete(userId);

        await this.bot.sendMessage(msg.chat.id, '✅ Toutes tes données ont été effacées.\n\nNouveau départ ! 🎯');

      } catch (error) {
        await this.bot.sendMessage(msg.chat.id, `❌ Erreur: ${error.message}`);
      }
    });

    // /memory_help - Aide
    this.bot.onText(/\/memory_help/, async (msg) => {
      await this.bot.sendMessage(msg.chat.id, `
📚 **Commandes Mémoire**

📊 **Informations:**
\`/memory_stats\` - Statistiques
\`/memory_knowledge\` - Ce que je sais de toi
\`/memory_search [mot]\` - Rechercher

📱 **Export/Import:**
\`/memory_export\` - Export pour iPhone
\`/memory_import\` - Instructions import

💾 **Backup:**
\`/memory_backup\` - Backup manuel

⚙️ **Contrôle:**
\`/memory_forget\` - Désactiver contexte (temporaire)
\`/memory_remember\` - Réactiver contexte
\`/memory_clear\` - ⚠️ Tout effacer

❓ **Aide:**
\`/memory_help\` - Cette aide
      `, { parse_mode: 'Markdown' });
    });

    logger.info('✅ Commandes mémoire configurées (11 commandes)');
  }

  /**
   * 📄 HANDLER DOCUMENTS (pour import)
   */
  setupDocumentHandler() {
    this.bot.on('document', async (msg) => {
      const userId = msg.from.id.toString();
      const doc = msg.document;

      // Vérifier si c'est un export mémoire
      if (doc.file_name && doc.file_name.includes('export') && doc.file_name.endsWith('.json.gz')) {
        await this.bot.sendMessage(msg.chat.id, '📥 Import en cours...');

        try {
          // Download file
          const file = await this.bot.getFile(doc.file_id);
          const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

          // Download to temp
          const response = await fetch(fileUrl);
          const buffer = await response.arrayBuffer();
          const tempPath = `/tmp/${doc.file_name}`;
          fs.writeFileSync(tempPath, Buffer.from(buffer));

          // Import
          await this.memory.importFromTelegram(tempPath, userId);

          await this.bot.sendMessage(msg.chat.id, '✅ Mémoire restaurée avec succès !');

          // Cleanup
          fs.unlinkSync(tempPath);

        } catch (error) {
          logger.error('❌ Erreur import:', error);
          await this.bot.sendMessage(msg.chat.id, `❌ Erreur import: ${error.message}`);
        }
      }
    });

    logger.info('✅ Document handler configuré');
  }

  /**
   * 📱 AUTO-BACKUP QUOTIDIEN pour iPhone
   */
  setupiPhoneSync() {
    logger.info('📱 Configuration sync iPhone...');

    // Auto-export quotidien à 3h du matin
    schedule.schedule('0 3 * * *', async () => {
      try {
        logger.info('📤 Auto-export quotidien...');

        // Pour chaque utilisateur actif (derniers 7 jours)
        const users = this.memory.db.prepare(`
          SELECT DISTINCT user_id FROM user_profiles
          WHERE last_active > datetime('now', '-7 days')
        `).all();

        for (const user of users) {
          try {
            const exportData = await this.memory.exportForTelegram(user.user_id);

            // Envoyer silencieusement
            await this.bot.sendDocument(user.user_id, exportData.path, {
              caption: '💾 Backup automatique quotidien\n\nSauvegarde dans Files app → iCloud Drive',
              disable_notification: true
            });

            logger.debug(`✅ Auto-export envoyé à ${user.user_id}`);

          } catch (userError) {
            logger.warn(`⚠️ Erreur export user ${user.user_id}:`, userError.message);
          }
        }

        logger.info(`✅ Auto-export terminé (${users.length} users)`);

      } catch (error) {
        logger.error('❌ Erreur auto-export:', error);
      }
    }, {
      timezone: 'Europe/Paris'
    });

    logger.info('✅ Auto-export quotidien configuré (3h00)');
  }

  /**
   * 🚀 INITIALISATION COMPLÈTE
   */
  async init() {
    logger.info('\n📱 Memory Integration Workflow - Initialisation');
    logger.info('═'.repeat(60));

    // Setup middleware
    this.setupMiddleware();

    // Setup commandes
    this.setupMemoryCommands();

    // Setup document handler
    this.setupDocumentHandler();

    // Setup iPhone sync
    this.setupiPhoneSync();

    logger.info('✅ Memory Integration Workflow - Prêt !');
    logger.info('   • Middleware actif');
    logger.info('   • 11 commandes configurées');
    logger.info('   • Auto-backup quotidien à 3h00');
    logger.info('   • Export iPhone automatique');
    logger.info('═'.repeat(60) + '\n');

    return this;
  }

  /**
   * 🛑 SHUTDOWN PROPRE
   */
  async shutdown() {
    logger.info('🛑 Shutdown Memory Integration...');

    // Dernier sync
    try {
      await this.memory.syncToServer();
    } catch (error) {
      logger.warn('⚠️ Erreur sync final:', error.message);
    }

    // Fermer DB
    this.memory.close();

    logger.info('✅ Memory Integration fermée proprement');
  }
}

module.exports = MemoryIntegrationWorkflow;
