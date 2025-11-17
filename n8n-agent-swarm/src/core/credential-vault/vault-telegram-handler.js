/**
 * Vault Telegram Handler
 *
 * Gère les commandes Telegram pour le Universal Credential Vault
 * S'intègre au bot Telegram principal
 */

const UniversalCredentialVault = require('./universal-credential-vault');
const logger = require('../logger/logger');

class VaultTelegramHandler {
  constructor(bot) {
    this.bot = bot;
    this.vault = new UniversalCredentialVault();
    this.conversationState = new Map();

    // Charger le vault au démarrage
    this.init();
  }

  async init() {
    try {
      await this.vault.load();
      logger.info('🔐 Vault Telegram Handler initialisé');
    } catch (error) {
      logger.error('❌ Erreur initialisation vault:', error.message);
    }
  }

  /**
   * Enregistrer toutes les commandes du vault
   */
  registerCommands() {
    // /credentials - Menu principal
    this.bot.onText(/\/credentials/, async (msg) => {
      await this.handleCredentialsMenu(msg.chat.id, msg.from.id);
    });

    // /list_services - Lister tous les services supportés
    this.bot.onText(/\/list_services/, async (msg) => {
      await this.handleListAvailableServices(msg.chat.id);
    });

    // /add_service [service_id] - Ajouter un service
    this.bot.onText(/\/add_service(?:\s+(.+))?/, async (msg, match) => {
      const serviceId = match[1]?.trim();
      if (serviceId) {
        await this.handleAddServiceStart(msg.chat.id, serviceId);
      } else {
        await this.showAddServiceHelp(msg.chat.id);
      }
    });

    // /remove_service [service_id] - Supprimer un service
    this.bot.onText(/\/remove_service(?:\s+(.+))?/, async (msg, match) => {
      const serviceId = match[1]?.trim();
      if (serviceId) {
        await this.handleRemoveService(msg.chat.id, serviceId);
      } else {
        await this.showRemoveServiceHelp(msg.chat.id);
      }
    });

    // /export_vault - Exporter le vault
    this.bot.onText(/\/export_vault/, async (msg) => {
      await this.handleExportVault(msg.chat.id);
    });

    // /import_vault - Importer le vault
    this.bot.onText(/\/import_vault/, async (msg) => {
      await this.handleImportVault(msg.chat.id);
    });

    // Callback queries (boutons inline)
    this.bot.on('callback_query', async (query) => {
      await this.handleCallbackQuery(query);
    });

    logger.info('✅ Commandes Vault enregistrées');
  }

  /**
   * Menu principal des credentials
   */
  async handleCredentialsMenu(chatId, userId) {
    try {
      const configured = await this.vault.listConfiguredServices();

      let message = `🔐 **Credential Vault Universel**\n\n`;

      if (configured.length === 0) {
        message += `Aucun service configuré.\n\n`;
        message += `💡 **Commencez par ajouter un service !**\n\n`;
      } else {
        message += `**Services configurés (${configured.length}) :**\n\n`;

        // Grouper par type
        const byType = {};
        configured.forEach(service => {
          if (!byType[service.type]) {
            byType[service.type] = [];
          }
          byType[service.type].push(service);
        });

        const typeEmojis = {
          'email': '📧',
          'commerce': '🛍️',
          'productivity': '📊',
          'social': '💬',
          'payment': '💳',
          'custom': '⚙️'
        };

        Object.entries(byType).forEach(([type, services]) => {
          message += `${typeEmojis[type] || '•'} **${type.toUpperCase()}**\n`;
          services.forEach(s => {
            message += `  ✅ ${s.name}\n`;
          });
          message += `\n`;
        });
      }

      message += `**Commandes disponibles:**\n`;
      message += `/add_service - Ajouter un service\n`;
      message += `/list_services - Services disponibles\n`;
      message += `/remove_service - Supprimer un service\n`;
      message += `/export_vault - Backup chiffré\n`;
      message += `/import_vault - Restaurer backup\n`;

      const keyboard = this.buildServicesKeyboard();

      await this.safeSendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      logger.error('Erreur handleCredentialsMenu:', error);
      await this.safeSendMessage(chatId, `❌ Erreur: ${error.message}`);
    }
  }

  /**
   * Construire le clavier des services
   */
  buildServicesKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '📧 Email', callback_data: 'vault_services_email' },
          { text: '🛍️ Commerce', callback_data: 'vault_services_commerce' }
        ],
        [
          { text: '📊 Productivity', callback_data: 'vault_services_productivity' },
          { text: '💬 Social', callback_data: 'vault_services_social' }
        ],
        [
          { text: '💳 Payment', callback_data: 'vault_services_payment' },
          { text: '⚙️ Custom', callback_data: 'vault_services_custom' }
        ],
        [
          { text: '📋 Voir tous les services', callback_data: 'vault_services_all' }
        ]
      ]
    };
  }

  /**
   * Lister tous les services disponibles
   */
  async handleListAvailableServices(chatId) {
    try {
      const services = this.vault.getSupportedServices();

      // Grouper par type
      const byType = {};
      services.forEach(service => {
        if (!byType[service.type]) {
          byType[service.type] = [];
        }
        byType[service.type].push(service);
      });

      let message = `📋 **Services Supportés (${services.length})**\n\n`;

      const typeEmojis = {
        'email': '📧',
        'commerce': '🛍️',
        'productivity': '📊',
        'social': '💬',
        'payment': '💳',
        'custom': '⚙️'
      };

      Object.entries(byType).forEach(([type, serviceList]) => {
        message += `${typeEmojis[type] || '•'} **${type.toUpperCase()}:**\n`;
        serviceList.forEach(s => {
          message += `  • ${s.name} (\`${s.id}\`)\n`;
        });
        message += `\n`;
      });

      message += `**Pour ajouter un service :**\n`;
      message += `/add_service [id]\n\n`;
      message += `**Exemples:**\n`;
      message += `\`/add_service outlook\`\n`;
      message += `\`/add_service xianyu\`\n`;
      message += `\`/add_service custom\`\n`;

      await this.safeSendMessage(chatId, message, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      logger.error('Erreur handleListAvailableServices:', error);
      await this.safeSendMessage(chatId, `❌ Erreur: ${error.message}`);
    }
  }

  /**
   * Commencer l'ajout d'un service
   */
  async handleAddServiceStart(chatId, serviceId) {
    try {
      const template = this.vault.getServiceTemplate(serviceId);

      if (!template) {
        return await this.safeSendMessage(chatId, `
❌ **Service inconnu: ${serviceId}**

Utilisez \`/list_services\` pour voir les services disponibles.
        `, { parse_mode: 'Markdown' });
      }

      const serviceName = this.vault.getServiceDisplayName(serviceId);

      let message = `🔐 **Configuration ${serviceName}**\n\n`;
      message += template.instructions + `\n\n`;
      message += `**Champs requis:**\n`;
      template.fields.forEach(field => {
        message += `• \`${field}\`\n`;
      });

      if (template.optional && template.optional.length > 0) {
        message += `\n**Champs optionnels:**\n`;
        template.optional.forEach(field => {
          message += `• \`${field}\` (optionnel)\n`;
        });
      }

      message += `\n**Format d'envoi :**\n`;
      message += `\`\`\`\n`;
      message += `/set_${serviceId}\n`;
      template.fields.forEach(field => {
        message += `${field}: votre_valeur\n`;
      });
      message += `\`\`\`\n`;

      message += `\n⚠️ **Le message sera automatiquement supprimé après traitement pour sécurité.**\n`;
      message += `\n**Exemple concret:**\n`;
      message += `\`\`\`\n/set_${serviceId}\n`;
      if (serviceId === 'outlook') {
        message += `email: votre@outlook.com\npassword: VotreMotDePasse123\n`;
      } else if (serviceId === 'xianyu') {
        message += `username: votre_username\npassword: VotreMotDePasse123\n`;
      } else {
        message += template.fields.map(f => `${f}: votre_${f}`).join('\n') + '\n';
      }
      message += `\`\`\``;

      await this.safeSendMessage(chatId, message, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      logger.error('Erreur handleAddServiceStart:', error);
      await this.safeSendMessage(chatId, `❌ Erreur: ${error.message}`);
    }
  }

  /**
   * Aide pour /add_service
   */
  async showAddServiceHelp(chatId) {
    const message = `
📝 **Ajouter un service**

**Usage:**
\`/add_service [service_id]\`

**Exemples:**
\`/add_service gmail\`
\`/add_service outlook\`
\`/add_service xianyu\`
\`/add_service vinted\`

**Pour voir tous les services:**
\`/list_services\`
    `;

    await this.safeSendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
  }

  /**
   * Supprimer un service
   */
  async handleRemoveService(chatId, serviceId) {
    try {
      const hasService = await this.vault.hasCredentials(serviceId);

      if (!hasService) {
        return await this.safeSendMessage(chatId, `
❌ **Service non configuré: ${serviceId}**

Utilisez \`/credentials\` pour voir les services configurés.
        `, { parse_mode: 'Markdown' });
      }

      await this.vault.deleteCredentials(serviceId);

      const serviceName = this.vault.getServiceDisplayName(serviceId);

      await this.safeSendMessage(chatId, `
✅ **Service supprimé: ${serviceName}**

Les credentials ont été supprimés du vault.
      `, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Erreur handleRemoveService:', error);
      await this.safeSendMessage(chatId, `❌ Erreur: ${error.message}`);
    }
  }

  /**
   * Aide pour /remove_service
   */
  async showRemoveServiceHelp(chatId) {
    const configured = await this.vault.listConfiguredServices();

    let message = `🗑️ **Supprimer un service**\n\n`;

    if (configured.length === 0) {
      message += `Aucun service configuré.\n`;
    } else {
      message += `**Services configurés:**\n`;
      configured.forEach(s => {
        message += `• \`${s.id}\` - ${s.name}\n`;
      });
      message += `\n**Usage:**\n`;
      message += `\`/remove_service [service_id]\`\n\n`;
      message += `**Exemple:**\n`;
      message += `\`/remove_service outlook\`\n`;
    }

    await this.safeSendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
  }

  /**
   * Exporter le vault (backup)
   */
  async handleExportVault(chatId) {
    try {
      const configured = await this.vault.listConfiguredServices();

      if (configured.length === 0) {
        return await this.safeSendMessage(chatId, `
❌ **Aucun service configuré**

Rien à exporter. Ajoutez d'abord des services avec \`/add_service\`.
        `, { parse_mode: 'Markdown' });
      }

      // Demander un mot de passe pour l'export
      await this.safeSendMessage(chatId, `
🔐 **Export du Vault**

Le vault contient ${configured.length} service(s).

Pour exporter, envoyez un mot de passe de chiffrement:
\`/export_with_password VotreMotDePasse123\`

⚠️ **Important:** Ce mot de passe sera nécessaire pour restaurer le backup.
Le message sera supprimé automatiquement après traitement.
      `, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Erreur handleExportVault:', error);
      await this.safeSendMessage(chatId, `❌ Erreur: ${error.message}`);
    }
  }

  /**
   * Importer le vault (restaurer backup)
   */
  async handleImportVault(chatId) {
    await this.safeSendMessage(chatId, `
📥 **Import du Vault**

Pour restaurer un backup:

1. Envoyez le fichier JSON d'export
2. Ensuite, envoyez le mot de passe avec:
   \`/import_with_password VotreMotDePasse123\`

⚠️ **Attention:** Les services existants seront fusionnés avec le backup.
    `, { parse_mode: 'Markdown' });
  }

  /**
   * Gérer les callback queries (boutons inline)
   */
  async handleCallbackQuery(query) {
    const chatId = query.message.chat.id;
    const data = query.data;

    try {
      if (data.startsWith('vault_services_')) {
        const type = data.replace('vault_services_', '');
        await this.handleServicesByType(chatId, type, query.message.message_id);
      } else if (data.startsWith('vault_add_')) {
        const serviceId = data.replace('vault_add_', '');
        await this.handleAddServiceStart(chatId, serviceId);
      }

      // Acknowledge callback
      await this.bot.answerCallbackQuery(query.id);

    } catch (error) {
      logger.error('Erreur handleCallbackQuery:', error);
      await this.bot.answerCallbackQuery(query.id, {
        text: `❌ Erreur: ${error.message}`,
        show_alert: true
      });
    }
  }

  /**
   * Afficher services par type
   */
  async handleServicesByType(chatId, type, messageId) {
    try {
      const allServices = this.vault.getSupportedServices();
      const services = type === 'all' ? allServices : allServices.filter(s => s.type === type);

      const configured = await this.vault.listConfiguredServices();
      const configuredIds = configured.map(s => s.id);

      const typeNames = {
        'email': 'Email',
        'commerce': 'Commerce',
        'productivity': 'Productivity',
        'social': 'Social Media',
        'payment': 'Payment',
        'custom': 'Custom'
      };

      let message = `**Services ${typeNames[type] || 'Tous'} (${services.length}):**\n\n`;

      services.forEach(service => {
        const isConfigured = configuredIds.includes(service.id);
        const icon = isConfigured ? '✅' : '➕';
        message += `${icon} ${service.name} (\`${service.id}\`)\n`;
      });

      message += `\n**Pour ajouter:**\n`;
      message += `\`/add_service [id]\`\n`;

      const keyboard = {
        inline_keyboard: [
          ...services.slice(0, 10).map(s => [{
            text: `➕ ${s.name}`,
            callback_data: `vault_add_${s.id}`
          }]),
          [{
            text: '◀️ Retour',
            callback_data: 'vault_back'
          }]
        ]
      };

      await this.bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      logger.error('Erreur handleServicesByType:', error);
    }
  }

  /**
   * Gérer les commandes /set_XXX pour configurer les credentials
   */
  async handleSetCredentials(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Supprimer le message immédiatement (sécurité)
    try {
      await this.bot.deleteMessage(chatId, msg.message_id);
    } catch (error) {
      logger.warn('Could not delete message:', error.message);
    }

    try {
      // Parser
      const lines = text.split('\n');
      const command = lines[0].trim();
      const serviceId = command.replace('/set_', '');

      const template = this.vault.getServiceTemplate(serviceId);

      if (!template) {
        return await this.safeSendMessage(chatId, `
❌ **Service inconnu: ${serviceId}**

Utilisez \`/list_services\` pour voir les services disponibles.
        `, { parse_mode: 'Markdown' });
      }

      const credentials = {};

      // Parser chaque ligne
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        if (key && value) {
          credentials[key] = value;
        }
      }

      // Vérifier champs requis
      for (const field of template.fields) {
        if (!credentials[field]) {
          throw new Error(`Champ requis manquant: ${field}`);
        }
      }

      // Sauvegarder
      await this.vault.setCredentials(serviceId, credentials);

      const serviceName = this.vault.getServiceDisplayName(serviceId);

      // Masquer les données sensibles dans le message de confirmation
      const maskedCreds = Object.keys(credentials).map(k => {
        const isSensitive = k.includes('password') || k.includes('secret') || k.includes('key') || k.includes('token');
        return `${k}: ${isSensitive ? '••••••••' : credentials[k]}`;
      }).join('\n');

      await this.safeSendMessage(chatId, `
✅ **${serviceName} configuré !**

\`\`\`
${maskedCreds}
\`\`\`

Le service est maintenant disponible.
      `, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Set credentials error:', error);
      await this.safeSendMessage(chatId, `
❌ **Erreur configuration**

${error.message}

Vérifiez le format et réessayez.
      `);
    }
  }

  /**
   * Envoyer un message de manière sécurisée
   */
  async safeSendMessage(chatId, text, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      logger.error('Erreur sendMessage:', error);
      // Retry sans markdown si erreur de parsing
      if (error.message.includes('parse')) {
        try {
          return await this.bot.sendMessage(chatId, text, { ...options, parse_mode: undefined });
        } catch (retryError) {
          logger.error('Retry sendMessage failed:', retryError);
        }
      }
    }
  }

  /**
   * Vérifier si un message est une commande /set_XXX
   */
  isSetCommand(text) {
    return text && text.startsWith('/set_');
  }
}

module.exports = VaultTelegramHandler;
