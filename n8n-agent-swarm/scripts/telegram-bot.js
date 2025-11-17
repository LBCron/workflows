#!/usr/bin/env node

/**
 * Bot Telegram - AI Agent Swarm COMPLET
 *
 * Bot Telegram avec 5 agents sophistiqués:
 * - Research, Content, Code, Email, Calendar
 * Intelligent router, cache, et budget guardian.
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const ResearchAgent = require('./agents/research-agent-pro');
const ContentCreator = require('./agents/content-creator-pro');
const CodeAssistant = require('./agents/code-assistant-pro');
const EmailAgent = require('./agents/email-agent-pro');
const CalendarAgent = require('./agents/calendar-agent-pro');
const MetaAgent = require('./agents/meta-agent');
const BudgetGuardian = require('./monitoring/budget-guardian');

// Validation
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN manquant dans .env');
  process.exit(1);
}

// Initialisation
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const budgetGuardian = new BudgetGuardian();

/**
 * Rate limiting storage
 */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

/**
 * Check rate limiting
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  if (now > userLimit.resetTime) {
    // Reset window
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    const waitTime = Math.ceil((userLimit.resetTime - now) / 1000);
    throw new Error(`🚫 Rate limit atteint. Attends ${waitTime}s avant de réessayer.`);
  }

  userLimit.count++;
  rateLimitMap.set(userId, userLimit);
  return true;
}

/**
 * Safe send message with markdown escaping
 */
async function safeSendMessage(chatId, text, options = {}) {
  try {
    // Escape markdown special characters
    const escaped = text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');

    return await bot.sendMessage(chatId, escaped, {
      parse_mode: 'MarkdownV2',
      ...options
    });
  } catch (error) {
    // Fallback without markdown
    console.error('Markdown send failed, trying plain text:', error.message);
    try {
      return await bot.sendMessage(chatId, text, { ...options, parse_mode: undefined });
    } catch (fallbackError) {
      console.error('Plain text send also failed:', fallbackError.message);
      throw fallbackError;
    }
  }
}

/**
 * Send message with inline keyboard buttons
 */
async function sendMessageWithButtons(chatId, text, buttons) {
  const keyboard = {
    inline_keyboard: buttons
  };

  return await safeSendMessage(chatId, text, {
    reply_markup: JSON.stringify(keyboard)
  });
}

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🤖 Bot Telegram - AI Agent Swarm COMPLET                    ║
║                                                               ║
║  Status: ✅ DÉMARRÉ                                           ║
║  Time: ${new Date().toISOString()}                ║
║                                                               ║
║  🎯 5 AGENTS SOPHISTIQUÉS:                                    ║
║  🔬 Research Agent Pro                                        ║
║  ✍️  Content Creator Pro                                      ║
║  💻 Code Assistant Pro                                        ║
║  📧 Email Agent Pro (Gmail/Outlook)                           ║
║  📅 Calendar Agent Pro (Google Calendar)                      ║
║                                                               ║
║  ⚡ Features:                                                  ║
║  ✅ Intelligent Router (7 AI models)                          ║
║  ✅ Mega Cache (70-80% hit rate)                              ║
║  ✅ Budget Guardian (auto-protection)                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

/**
 * Détecter l'intent du message
 */
function detectIntent(text) {
  const lower = text.toLowerCase();

  // Email keywords (priorité haute)
  if (lower.match(/email|mail|gmail|outlook|envoie (un )?message|mes (mails|emails)|non lu|boîte mail|inbox/i)) {
    return 'email';
  }

  // Calendar keywords (priorité haute)
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

  // Default to research for questions
  return 'research';
}

/**
 * Formater la réponse avec metadata
 */
function formatResponse(result, agent) {
  let response = result.content || result.synthesis || result.code || 'Aucun résultat';

  // Ajouter les metadata en bas
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
    metadata.push(`✍️  Style: ${result.style}`);
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
 * Commande /start
 */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || msg.from.username || 'ami';

  const message =
    `👋 Salut ${userName}!\n\n` +
    `Je suis ton assistant AI ultra-complet avec 5 agents sophistiqués:\n\n` +
    `🔬 Research Agent - Recherche et analyse\n` +
    `✍️ Content Creator - Création de contenu\n` +
    `💻 Code Assistant - Aide au code\n` +
    `📧 Email Agent - Gestion emails\n` +
    `📅 Calendar Agent - Gestion agenda\n\n` +
    `Que veux-tu faire ?`;

  const buttons = [
    [
      { text: '🔍 Recherche', callback_data: 'action_research' },
      { text: '✍️ Créer', callback_data: 'action_content' }
    ],
    [
      { text: '💻 Code', callback_data: 'action_code' },
      { text: '📧 Emails', callback_data: 'action_email' }
    ],
    [
      { text: '📅 Agenda', callback_data: 'action_calendar' },
      { text: '📊 Stats', callback_data: 'action_stats' }
    ],
    [
      { text: '❓ Aide', callback_data: 'action_help' }
    ]
  ];

  await sendMessageWithButtons(chatId, message, buttons);
});

/**
 * Commande /help
 */
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    `**🤖 Guide d'utilisation**\n\n` +
      `**🔬 Research Agent:**\n` +
      `Envoie une question ou "recherche..."\n` +
      `_Exemple: "Recherche l'histoire de l'IA"_\n\n` +
      `**✍️  Content Creator:**\n` +
      `Demande "écris..." ou "crée..."\n` +
      `_Exemple: "Écris un post Instagram sur le café"_\n\n` +
      `**💻 Code Assistant:**\n` +
      `Mentionne "code" ou "fonction"\n` +
      `_Exemple: "Code une fonction de tri en JS"_\n\n` +
      `**📧 Email Agent:**\n` +
      `"Résume mes emails", "Mes emails non lus"\n` +
      `_Exemple: "Combien d'emails non lus ?"_\n\n` +
      `**📅 Calendar Agent:**\n` +
      `"Mon agenda", "Crée un meeting..."\n` +
      `_Exemple: "Quel est mon agenda aujourd'hui ?"_\n\n` +
      `**🤖 Meta-Agent (Auto-développement):**\n` +
      `Le système peut créer de nouveaux agents automatiquement!\n` +
      `_Exemple: "/create agent Instagram pour publier photos"_\n\n` +
      `**Commandes:**\n` +
      `/start - Démarrage\n` +
      `/stats - Statistiques système\n` +
      `/budget - État du budget\n` +
      `/agents - Liste tous les agents\n` +
      `/create <description> - Créer nouvel agent\n` +
      `/help - Ce message`,
    { parse_mode: 'Markdown' }
  );
});

/**
 * Commande /stats
 */
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const budgetStatus = await budgetGuardian.getStatus();

    const statsMessage =
      `**📊 Statistiques Système**\n\n` +
      `**Budget:**\n` +
      `• Utilisé: €${budgetStatus.spent.toFixed(2)} / €${budgetStatus.limit}\n` +
      `• Restant: €${budgetStatus.remaining.toFixed(2)}\n` +
      `• Status: ${budgetStatus.status}\n\n` +
      `**Performance:**\n` +
      `• Uptime: ${Math.floor(process.uptime() / 60)}min\n` +
      `• Mémoire: ${Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)}MB`;

    await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Erreur: ' + error.message);
  }
});

/**
 * Commande /budget
 */
bot.onText(/\/budget/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const status = await budgetGuardian.getStatus();

    const percentage = ((status.spent / status.limit) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));

    const budgetMessage =
      `**💰 Budget Status**\n\n` +
      `${bar}\n\n` +
      `• Utilisé: €${status.spent.toFixed(4)}\n` +
      `• Limite: €${status.limit}\n` +
      `• Restant: €${status.remaining.toFixed(4)}\n` +
      `• Pourcentage: ${percentage}%\n` +
      `• Status: ${status.status}\n\n` +
      `_Objectif: Rester sous €20/mois avec cache 70-80%_`;

    await bot.sendMessage(chatId, budgetMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Erreur: ' + error.message);
  }
});

/**
 * Commande /create - Créer un nouvel agent
 */
bot.onText(/\/create (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const description = match[1];

  const processing = await bot.sendMessage(
    chatId,
    '🤖 **Meta-Agent activé!**\n\nCréation de l\'agent en cours...\n_Cela peut prendre 1-2 minutes_',
    { parse_mode: 'Markdown' }
  );

  try {
    const result = await MetaAgent.createAgent(description);

    await bot.deleteMessage(chatId, processing.message_id);

    if (result.success) {
      const message =
        `✅ **Agent créé avec succès !**\n\n` +
        `📛 **Nom:** ${result.name}\n` +
        `📄 **Fichier:** \`${result.file}\`\n` +
        `📝 **Description:** ${result.description}\n\n` +
        `🎯 **Capacités:**\n${result.capabilities.map(c => `• ${c}`).join('\n')}\n\n` +
        `🔧 **Méthodes:**\n${result.methods.map(m => `• ${m}()`).join('\n')}\n\n` +
        `📦 **APIs requises:** ${result.apis.join(', ')}\n` +
        `✅ **Testé:** ${result.tested ? 'Oui' : 'Non'}\n\n` +
        `_L'agent est maintenant disponible! Tu peux l'utiliser via le bot._`;

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(
        chatId,
        `❌ **Échec de création**\n\nErreur: ${result.error}`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    await bot.deleteMessage(chatId, processing.message_id);
    await bot.sendMessage(chatId, `❌ **Erreur:** ${error.message}`, {
      parse_mode: 'Markdown'
    });
  }
});

/**
 * Commande /agents - Lister tous les agents
 */
bot.onText(/\/agents/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const agents = await MetaAgent.listAgents();
    const agentList = Object.entries(agents);

    if (agentList.length === 0) {
      await bot.sendMessage(chatId, 'Aucun agent enregistré.');
      return;
    }

    // Séparer auto-générés vs manuels
    const autoGenerated = agentList.filter(([, info]) => info.auto_generated);
    const manual = agentList.filter(([, info]) => !info.auto_generated);

    let message = `📋 **Agents disponibles** (${agentList.length} total)\n\n`;

    if (manual.length > 0) {
      message += `**✍️ Agents manuels** (${manual.length}):\n`;
      manual.forEach(([name, info]) => {
        const date = new Date(info.created).toLocaleDateString('fr-FR');
        message += `• **${name}**\n  ${info.description}\n  _Créé le ${date}_\n\n`;
      });
    }

    if (autoGenerated.length > 0) {
      message += `**🤖 Agents auto-générés** (${autoGenerated.length}):\n`;
      autoGenerated.forEach(([name, info]) => {
        const date = new Date(info.created).toLocaleDateString('fr-FR');
        message += `• **${name}**\n  ${info.description}\n  _Créé le ${date}_\n\n`;
      });
    }

    message += `\n💡 **Créer un agent:** \`/create description de l'agent\``;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Erreur: ' + error.message);
  }
});

/**
 * Callback query handler (boutons interactifs)
 */
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.callback_data;
  const messageId = query.message.message_id;

  try {
    // Acknowledge the callback
    await bot.answerCallbackQuery(query.id);

    // Delete the button message
    await bot.deleteMessage(chatId, messageId);

    // Handle action
    switch (data) {
      case 'action_research':
        await safeSendMessage(chatId, '🔍 Recherche activée! Pose ta question...');
        break;

      case 'action_content':
        await safeSendMessage(chatId, '✍️ Création de contenu! Dis-moi quoi créer...');
        break;

      case 'action_code':
        await safeSendMessage(chatId, '💻 Code Assistant! Décris ce que tu veux coder...');
        break;

      case 'action_email':
        await sendMessageWithButtons(chatId, '📧 Email Agent - Que veux-tu faire?', [
          [
            { text: '📥 Lire emails', callback_data: 'email_read' },
            { text: '📤 Envoyer email', callback_data: 'email_send' }
          ],
          [
            { text: '📊 Résumé', callback_data: 'email_summary' }
          ]
        ]);
        break;

      case 'action_calendar':
        await sendMessageWithButtons(chatId, '📅 Calendar Agent - Que veux-tu faire?', [
          [
            { text: '📆 Aujourd\'hui', callback_data: 'cal_today' },
            { text: '📅 Semaine', callback_data: 'cal_week' }
          ],
          [
            { text: '➕ Créer event', callback_data: 'cal_create' }
          ]
        ]);
        break;

      case 'action_stats':
        // Execute /stats command
        const status = await budgetGuardian.getStatus();
        const statsMessage =
          `📊 Statistiques Système\n\n` +
          `Budget:\n` +
          `• Utilisé: €${status.spent.toFixed(2)} / €${status.limit}\n` +
          `• Restant: €${status.remaining.toFixed(2)}\n` +
          `• Status: ${status.status}\n\n` +
          `Performance:\n` +
          `• Uptime: ${Math.floor(process.uptime() / 60)}min\n` +
          `• Mémoire: ${Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)}MB`;
        await safeSendMessage(chatId, statsMessage);
        break;

      case 'action_help':
        await safeSendMessage(
          chatId,
          `❓ Guide d'utilisation\n\n` +
            `Agents disponibles:\n` +
            `• 🔬 Research - Questions et analyses\n` +
            `• ✍️ Content - Création de contenu\n` +
            `• 💻 Code - Aide au développement\n` +
            `• 📧 Email - Gestion emails\n` +
            `• 📅 Calendar - Gestion agenda\n\n` +
            `Commandes:\n` +
            `/start - Menu principal\n` +
            `/stats - Statistiques\n` +
            `/budget - État budget\n` +
            `/agents - Liste agents`
        );
        break;

      // Email sub-actions
      case 'email_read':
        await safeSendMessage(chatId, '📥 Lis tes emails avec: "Résume mes emails"');
        break;

      case 'email_send':
        await safeSendMessage(chatId, '📤 Envoie un email avec: "Envoie un email à..."');
        break;

      case 'email_summary':
        await safeSendMessage(chatId, '📊 Génération du résumé...');
        // Trigger email summary
        try {
          const result = await EmailAgent.summarizeUnread('gmail');
          await safeSendMessage(chatId, result.summary);
        } catch (error) {
          await safeSendMessage(chatId, `❌ Erreur: ${error.message}`);
        }
        break;

      // Calendar sub-actions
      case 'cal_today':
        await safeSendMessage(chatId, '📆 Chargement de ton agenda...');
        try {
          const result = await CalendarAgent.todayAgenda();
          await safeSendMessage(chatId, result.summary);
        } catch (error) {
          await safeSendMessage(chatId, `❌ Erreur: ${error.message}`);
        }
        break;

      case 'cal_week':
        await safeSendMessage(chatId, '📅 Chargement de ta semaine...');
        try {
          const result = await CalendarAgent.weekAgenda();
          await safeSendMessage(chatId, result.summary);
        } catch (error) {
          await safeSendMessage(chatId, `❌ Erreur: ${error.message}`);
        }
        break;

      case 'cal_create':
        await safeSendMessage(chatId, '➕ Crée un event avec: "Crée un meeting mardi 14h avec..."');
        break;
    }
  } catch (error) {
    console.error('Callback query error:', error);
    await safeSendMessage(chatId, `❌ Erreur: ${error.message}`);
  }
});

/**
 * Messages normaux
 */
bot.on('message', async (msg) => {
  // Ignorer les commandes (déjà gérées)
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from.id;

  if (!text) {
    return;
  }

  console.log(`📨 Message de ${msg.from.first_name}: "${text.substring(0, 50)}..."`);

  try {
    // Check rate limiting
    checkRateLimit(userId);

    // Envoyer "typing..."
    await bot.sendChatAction(chatId, 'typing');
    // Détecter l'intent
    const intent = detectIntent(text);
    console.log(`🎯 Intent détecté: ${intent}`);

    let result;

    switch (intent) {
      case 'email':
        {
          // Détecter action email spécifique
          if (text.match(/résume|non lu|combien/i)) {
            result = await EmailAgent.summarizeUnread('gmail');

            if (result.cost > 0) {
              await budgetGuardian.checkAndRecord(result.cost, { action: 'email-summarize' });
            }

            await bot.sendMessage(chatId, result.summary, { parse_mode: 'Markdown' });
          } else {
            await bot.sendMessage(
              chatId,
              '📧 **Email Agent**\n\nActions disponibles:\n' +
              '• "Résume mes emails"\n' +
              '• "Combien d\'emails non lus ?"\n' +
              '• "Mes emails non lus"\n\n' +
              '_Plus de fonctionnalités bientôt!_',
              { parse_mode: 'Markdown' }
            );
          }
        }
        break;

      case 'calendar':
        {
          // Détecter action calendar spécifique
          if (text.match(/aujourd'hui|agenda du jour/i)) {
            result = await CalendarAgent.todayAgenda();
            await bot.sendMessage(chatId, result.summary, { parse_mode: 'Markdown' });
          } else if (text.match(/semaine|cette semaine/i)) {
            result = await CalendarAgent.weekAgenda();
            await bot.sendMessage(chatId, result.summary, { parse_mode: 'Markdown' });
          } else if (text.match(/crée|créer|ajoute|meeting|rendez-vous/i)) {
            result = await CalendarAgent.smartSchedule(text);

            if (result.cost > 0) {
              await budgetGuardian.checkAndRecord(result.cost, { action: 'calendar-smart-schedule' });
            }

            if (result.success) {
              await bot.sendMessage(
                chatId,
                `✅ **Événement créé !**\n\n` +
                `📅 ${result.event.summary}\n` +
                `🕐 ${new Date(result.event.start).toLocaleString('fr-FR')}\n` +
                `🔗 ${result.event.link}`,
                { parse_mode: 'Markdown' }
              );
            } else {
              await bot.sendMessage(
                chatId,
                `❌ ${result.error}\n\n💡 ${result.suggestion}`,
                { parse_mode: 'Markdown' }
              );
            }
          } else {
            await bot.sendMessage(
              chatId,
              '📅 **Calendar Agent**\n\nActions disponibles:\n' +
              '• "Mon agenda aujourd\'hui"\n' +
              '• "Mon agenda de la semaine"\n' +
              '• "Crée un meeting demain à 14h"\n\n' +
              '_Plus de fonctionnalités bientôt!_',
              { parse_mode: 'Markdown' }
            );
          }
        }
        break;

      case 'research':
        {
          const agent = new ResearchAgent();
          result = await agent.research(text, 'auto');

          // Track cost
          if (result.cost > 0) {
            await budgetGuardian.checkAndRecord(result.cost, { model: result.model });
          }

          const response = formatResponse(result, 'research');
          await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }
        break;

      case 'content':
        {
          const agent = new ContentCreator();
          result = await agent.create({
            type: 'blog-post',
            topic: text,
            quality: 'auto'
          });

          // Track cost
          if (result.cost > 0) {
            await budgetGuardian.checkAndRecord(result.cost, { model: result.model });
          }

          const response = formatResponse(result, 'content');
          await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }
        break;

      case 'code':
        {
          const agent = new CodeAssistant();
          result = await agent.assist({
            action: 'generate',
            description: text,
            language: 'auto'
          });

          // Track cost
          if (result.cost > 0) {
            await budgetGuardian.checkAndRecord(result.cost, { model: result.model });
          }

          // Envoyer le code en format Markdown
          let codeResponse = '```';
          if (result.language) {
            codeResponse += result.language;
          }
          codeResponse += '\n' + (result.code || result.content) + '\n```';

          if (result.explanation) {
            codeResponse += '\n\n' + result.explanation;
          }

          const response = formatResponse({ ...result, content: codeResponse }, 'code');
          await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }
        break;

      default:
        await bot.sendMessage(
          chatId,
          '🤔 Je ne suis pas sûr de comprendre.\n\n' +
            'Utilise /help pour voir ce que je peux faire!'
        );
    }
  } catch (error) {
    console.error('❌ Erreur:', error);

    let errorMessage = '❌ Désolé, une erreur est survenue.';

    if (error.message.includes('budget')) {
      errorMessage += '\n\n💰 Budget mensuel dépassé. Contacte l\'admin.';
    } else {
      errorMessage += '\n\n_' + error.message + '_';
    }

    await bot.sendMessage(chatId, errorMessage, { parse_mode: 'Markdown' });
  }
});

// Gestion des erreurs
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM reçu, arrêt du bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT reçu, arrêt du bot...');
  bot.stopPolling();
  process.exit(0);
});

console.log('✅ Bot prêt à recevoir des messages!');
