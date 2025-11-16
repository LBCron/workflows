#!/usr/bin/env node

/**
 * Bot Telegram - AI Agent Swarm
 *
 * Bot Telegram simple qui utilise les agents sophistiqués
 * (Research, Content, Code) avec intelligent router, cache, et budget guardian.
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const ResearchAgent = require('./agents/research-agent-pro');
const ContentCreator = require('./agents/content-creator-pro');
const CodeAssistant = require('./agents/code-assistant-pro');
const BudgetGuardian = require('./monitoring/budget-guardian');

// Validation
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN manquant dans .env');
  process.exit(1);
}

// Initialisation
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const budgetGuardian = new BudgetGuardian();

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🤖 Bot Telegram - AI Agent Swarm                            ║
║                                                               ║
║  Status: ✅ DÉMARRÉ                                           ║
║  Time: ${new Date().toISOString()}                ║
║                                                               ║
║  Agents disponibles:                                          ║
║  🔬 Research Agent Pro                                        ║
║  ✍️  Content Creator Pro                                      ║
║  💻 Code Assistant Pro                                        ║
║                                                               ║
║  Features:                                                    ║
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

  // Research keywords
  if (
    lower.match(/recherch|analyse|étudie|compare|trouve|explique|c'est quoi|qu'est-ce que/i) ||
    lower.includes('?')
  ) {
    return 'research';
  }

  // Content creation keywords
  if (lower.match(/écris|crée|génère|rédige|compose|article|post|contenu|texte/i)) {
    return 'content';
  }

  // Code keywords
  if (lower.match(/code|fonction|script|programme|debug|optimise|class|def|function/i)) {
    return 'code';
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

  await bot.sendMessage(
    chatId,
    `👋 Salut ${userName}!\n\n` +
      `Je suis ton assistant AI avec 3 agents sophistiqués:\n\n` +
      `🔬 **Research Agent** - Recherche et analyse\n` +
      `✍️  **Content Creator** - Création de contenu\n` +
      `💻 **Code Assistant** - Aide au code\n\n` +
      `**Exemples:**\n` +
      `• "Recherche les tendances IA 2024"\n` +
      `• "Écris un article sur le web3"\n` +
      `• "Code une fonction fibonacci en Python"\n\n` +
      `**Commandes:**\n` +
      `/stats - Statistiques\n` +
      `/budget - Budget status\n` +
      `/help - Aide`,
    { parse_mode: 'Markdown' }
  );
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
      `**Commandes:**\n` +
      `/start - Démarrage\n` +
      `/stats - Statistiques système\n` +
      `/budget - État du budget\n` +
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
    const budgetStatus = budgetGuardian.getStatus();

    const statsMessage =
      `**📊 Statistiques Système**\n\n` +
      `**Budget:**\n` +
      `• Utilisé: €${budgetStatus.used.toFixed(2)} / €${budgetStatus.limit}\n` +
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
    const status = budgetGuardian.getStatus();

    const percentage = ((status.used / status.limit) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));

    const budgetMessage =
      `**💰 Budget Status**\n\n` +
      `${bar}\n\n` +
      `• Utilisé: €${status.used.toFixed(4)}\n` +
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
 * Messages normaux
 */
bot.on('message', async (msg) => {
  // Ignorer les commandes (déjà gérées)
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) {
    return;
  }

  console.log(`📨 Message de ${msg.from.first_name}: "${text.substring(0, 50)}..."`);

  // Envoyer "typing..."
  await bot.sendChatAction(chatId, 'typing');

  try {
    // Détecter l'intent
    const intent = detectIntent(text);
    console.log(`🎯 Intent détecté: ${intent}`);

    let result;

    switch (intent) {
      case 'research':
        {
          const agent = new ResearchAgent();
          result = await agent.research(text, 'auto');

          // Track cost
          if (result.cost > 0) {
            budgetGuardian.trackCost(result.cost, result.model);
          }

          const response = formatResponse(result, 'research');
          await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }
        break;

      case 'content':
        {
          const agent = new ContentCreator();
          result = await agent.create(text, 'auto', 'auto');

          // Track cost
          if (result.cost > 0) {
            budgetGuardian.trackCost(result.cost, result.model);
          }

          const response = formatResponse(result, 'content');
          await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }
        break;

      case 'code':
        {
          const agent = new CodeAssistant();
          result = await agent.assist(text, 'auto', 'auto');

          // Track cost
          if (result.cost > 0) {
            budgetGuardian.trackCost(result.cost, result.model);
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
