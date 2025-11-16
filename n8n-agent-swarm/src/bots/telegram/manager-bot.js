/**
 * Manager Bot - Assistant Commerce Chine-France
 * Avec Universal Memory System intégré
 */

const TelegramBot = require('node-telegram-bot-api');
const UniversalMemory = require('../../core/memory/universal-memory-system');
const OpenAI = require('openai');
const logger = require('../../core/logger');
const schedule = require('node-cron');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Scrapers (à implémenter)
const XianyuScraper = require('../../scrapers/xianyu/xianyu-scraper');
const WeChatScraper = require('../../scrapers/wechat/wechat-scraper');
const WeigouScraper = require('../../scrapers/weigou/weigou-scraper');

class ManagerBot {
  constructor() {
    this.bot = new TelegramBot(process.env.MANAGER_BOT_TOKEN, {
      polling: true
    });

    // Memory System
    this.memory = new UniversalMemory('Manager', {
      encryption: true,
      compression: true,
      autoSync: true,
      syncInterval: 3600000 // 1h
    });

    // OpenAI (GPT-4 + Whisper)
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Scrapers
    this.scrapers = {
      xianyu: new XianyuScraper(),
      wechat: new WeChatScraper(),
      weigou: new WeigouScraper()
    };

    // Admin user
    this.adminUserId = process.env.MANAGER_ADMIN_USER_ID;

    // State
    this.isScanning = false;
    this.scanQueue = [];

    // Security: Rate limiting (requests per user per minute)
    this.rateLimits = new Map();
    this.MAX_REQUESTS_PER_MINUTE = 20;
    this.MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  }

  async start() {
    logger.info('\n🤖 Manager Bot - Démarrage...');
    logger.info('═'.repeat(60));

    // Init scrapers
    await this.initScrapers();

    // Setup commands
    this.setupCommands();

    // Setup message handler
    this.setupMessageHandler();

    // Setup voice handler
    this.setupVoiceHandler();

    // Setup document handler (import)
    this.setupDocumentHandler();

    // Auto-backup quotidien
    this.setupDailyBackup();

    logger.info('✅ Manager Bot actif !');
    logger.info(`📁 Mémoire: ${this.memory.paths.local}`);
    logger.info('═'.repeat(60) + '\n');

    // Message bienvenue admin
    await this.sendToAdmin(`
🤖 **Manager Bot - Actif !**

Je suis prêt à t'aider avec ton commerce Chine-France.

**Exemples de commandes:**
- "Scanne vendeur ABC123 sur Xianyu"
- "Cherche Supreme sur WeChat"
- "Compare avec Vinted France"
- /vendors - Gérer vendeurs suivis
- /deals - Meilleurs deals trouvés
- /memory_export - Export vers iPhone

🧠 Toutes nos conversations sont sauvegardées avec mémoire !
    `);
  }

  async initScrapers() {
    logger.info('🔧 Initialisation scrapers...');

    for (const [name, scraper] of Object.entries(this.scrapers)) {
      try {
        await scraper.init();
        logger.info(`  ✅ ${name}`);
      } catch (error) {
        logger.error(`  ❌ ${name}: ${error.message}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // COMMANDS
  // ═══════════════════════════════════════════════════════════

  setupCommands() {
    // /start
    this.bot.onText(/\/start/, async (msg) => {
      if (!this.isAdmin(msg)) return;

      await this.bot.sendMessage(msg.chat.id, `
🤖 **Manager - Assistant Commerce Chine-France**

Je t'aide à trouver les meilleurs deals pour ton business.

**🛒 Commerce:**
/scan - Scanner vendeur/produit
/vendors - Gérer vendeurs suivis
/deals - Meilleurs deals trouvés
/compare - Comparer prix Chine vs Vinted

**🧠 Mémoire:**
/memory_stats - Statistiques
/memory_export - Export iPhone
/memory_knowledge - Ce que je sais

**💬 Ou parle-moi naturellement:**
"Scanne vendeur X sur Xianyu"
"Cherche Nike sur WeChat"
"Compare avec Vinted"

🎤 Tu peux aussi m'envoyer des messages vocaux !
      `, { parse_mode: 'Markdown' });
    });

    // /vendors
    this.bot.onText(/\/vendors/, async (msg) => {
      if (!this.isAdmin(msg)) return;

      const vendors = this.memory.getVendors();

      if (vendors.length === 0) {
        return this.bot.sendMessage(msg.chat.id, '📋 Aucun vendeur suivi');
      }

      let message = `📋 **Vendeurs suivis** (${vendors.length})\n\n`;

      vendors.forEach((v, i) => {
        message += `${i + 1}. **${v.vendor_name || v.vendor_id}**\n`;
        message += `   📱 ${v.platform}\n`;
        message += `   ⭐ Rating: ${v.rating || 'N/A'}\n`;
        message += `   📦 ${v.total_products} produits\n`;
        message += `   🔍 ${v.total_scans} scans\n`;
        if (v.last_scanned) {
          const date = new Date(v.last_scanned).toLocaleDateString('fr-FR');
          message += `   🕒 Dernier: ${date}\n`;
        }
        message += '\n';
      });

      message += '➕ Pour ajouter: "Ajoute vendeur X sur Xianyu"';

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /deals
    this.bot.onText(/\/deals/, async (msg) => {
      if (!this.isAdmin(msg)) return;

      const deals = this.memory.getBestDeals(10);

      if (deals.length === 0) {
        return this.bot.sendMessage(msg.chat.id, '💰 Aucun deal enregistré encore');
      }

      await this.bot.sendMessage(msg.chat.id, `💰 **Top ${deals.length} Deals**\n`);

      for (const [i, deal] of deals.entries()) {
        const message = `
**${i + 1}. ${deal.title}**

💰 **Chine:** ¥${deal.price_cny} (€${deal.price_eur?.toFixed(2) || '?'})
💵 **Vinted:** €${deal.vinted_price_eur || '?'}
📈 **Profit:** €${deal.profit_potential?.toFixed(2) || '?'}
🔥 **Score:** ${deal.deal_score}/100
✨ **Authenticité:** ${deal.authenticity_score || '?'}/100

📱 ${deal.platform}
🏪 ${deal.vendor_id || 'N/A'}

${deal.url ? `🔗 [Voir produit](${deal.url})` : ''}
        `.trim();

        await this.bot.sendMessage(msg.chat.id, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });

        if (deal.image_url) {
          try {
            await this.bot.sendPhoto(msg.chat.id, deal.image_url);
          } catch {}
        }
      }
    });

    // MEMORY COMMANDS (comme Workflow)
    this.setupMemoryCommands();
  }

  setupMemoryCommands() {
    // /memory_stats
    this.bot.onText(/\/memory_stats/, async (msg) => {
      if (!this.isAdmin(msg)) return;

      const stats = this.memory.getStats();
      const userId = msg.from.id.toString();

      await this.bot.sendMessage(msg.chat.id, `
🧠 **Statistiques Mémoire - Manager Bot**

📁 **Base de données**
- Localisation: ${stats.dbPath}
- Taille: ${stats.dbSizeFormatted}

💬 **Conversations**
- Total: ${stats.tables.conversations}
- Tes messages: ${this.memory.getConversationHistory(userId, 1000).length}

🏪 **Commerce**
- Vendeurs suivis: ${stats.tables.vendors}
- Produits scannés: ${stats.tables.products}

🧠 **Intelligence**
- Long-term memory: ${stats.tables.longTermMemory} facts

⚡ **Performance**
- Lectures: ${stats.performance.totalReads}
- Écritures: ${stats.performance.totalWrites}

🔄 **Sync**
- Dernier: ${stats.sync.lastSync || 'Jamais'}
- Auto-sync: ${stats.sync.autoSyncEnabled ? '✅' : '❌'}
      `, { parse_mode: 'Markdown' });
    });

    // /memory_export
    this.bot.onText(/\/memory_export/, async (msg) => {
      if (!this.isAdmin(msg)) return;

      const userId = msg.from.id.toString();

      await this.bot.sendMessage(msg.chat.id, '📤 Export en cours...');

      try {
        const exportData = await this.memory.exportForTelegram(userId);

        await this.bot.sendDocument(msg.chat.id, exportData.path, {
          caption: `
✅ **Export Manager terminé !**

📊 ${exportData.recordsCount} conversations
💾 ${(exportData.size / 1024).toFixed(2)} KB

📱 **iPhone:**
Files → Telegram → Downloads

Pour restaurer: /memory_import
          `.trim(),
          parse_mode: 'Markdown'
        });

      } catch (error) {
        await this.bot.sendMessage(msg.chat.id, `❌ Erreur: ${error.message}`);
      }
    });

    // /memory_knowledge
    this.bot.onText(/\/memory_knowledge/, async (msg) => {
      if (!this.isAdmin(msg)) return;

      const userId = msg.from.id.toString();
      const facts = this.memory.getAllFacts(userId);

      if (facts.length === 0) {
        return this.bot.sendMessage(msg.chat.id, '🧠 Je ne sais encore rien de spécifique.');
      }

      const knowledge = {};
      facts.forEach(f => {
        if (!knowledge[f.category]) knowledge[f.category] = [];
        knowledge[f.category].push(`${f.key}: ${f.value}`);
      });

      let message = '🧠 **Ce que je sais:**\n\n';

      Object.entries(knowledge).forEach(([cat, items]) => {
        message += `**${cat}:**\n`;
        items.forEach(item => message += `• ${item}\n`);
        message += '\n';
      });

      await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });

    // /memory_help
    this.bot.onText(/\/memory_help/, async (msg) => {
      if (!this.isAdmin(msg)) return;

      await this.bot.sendMessage(msg.chat.id, `
🧠 **Commandes Mémoire**

/memory_stats - Statistiques complètes
/memory_export - Export vers iPhone
/memory_knowledge - Ce que j'ai appris sur toi
/memory_search <texte> - Rechercher dans l'historique
/memory_backup - Backup manuel
/memory_help - Cette aide

📱 **Export iPhone:**
1. /memory_export
2. Files app → Telegram → Downloads
3. Copier vers iCloud Drive
4. Pour restaurer: envoyer le fichier au bot
      `, { parse_mode: 'Markdown' });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // MESSAGE HANDLER (Natural Language)
  // ═══════════════════════════════════════════════════════════

  setupMessageHandler() {
    this.bot.on('message', async (msg) => {
      // Ignorer commandes et autres types
      if (msg.text?.startsWith('/') || msg.voice || msg.document) return;
      if (!this.isAdmin(msg)) return;
      if (!msg.text) return;

      const userId = msg.from.id.toString();
      const userMessage = msg.text;

      // Security: Rate limiting
      if (!this.checkRateLimit(userId)) {
        return this.bot.sendMessage(
          msg.chat.id,
          '⏸️ Trop de requêtes. Attends 1 minute avant de réessayer.'
        );
      }

      logger.info(`\n💬 Message: "${userMessage}"`);

      // Thinking...
      const thinking = await this.bot.sendMessage(msg.chat.id, '🤔 Analyse...');

      try {
        // Analyser intention avec GPT-4
        const intent = await this.analyzeIntent(userId, userMessage);

        logger.info(`🎯 Intent: ${intent.action}`);

        await this.bot.deleteMessage(msg.chat.id, thinking.message_id);

        // Router vers action
        let response;

        switch (intent.action) {
          case 'scan_vendor':
            response = await this.handleScanVendor(intent, msg.chat.id);
            break;

          case 'scan_product':
            response = await this.handleScanProduct(intent, msg.chat.id);
            break;

          case 'compare_vinted':
            response = await this.handleCompareVinted(intent, msg.chat.id);
            break;

          case 'add_vendor':
            response = await this.handleAddVendor(intent);
            break;

          case 'show_vendors':
            const vendors = this.memory.getVendors();
            response = this.formatVendorsList(vendors);
            break;

          case 'show_deals':
            const deals = this.memory.getBestDeals(5);
            response = this.formatDealsList(deals);
            break;

          default:
            response = await this.handleGeneralQuestion(userId, userMessage);
        }

        // Envoyer réponse
        await this.bot.sendMessage(msg.chat.id, response, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });

        // Sauvegarder conversation
        this.memory.addConversation(userId, userMessage, response, {
          intent: intent.action,
          platform: intent.platform,
          agent: 'manager'
        });

      } catch (error) {
        logger.error('❌ Erreur:', error);
        await this.bot.deleteMessage(msg.chat.id, thinking.message_id);
        await this.bot.sendMessage(msg.chat.id, `❌ Erreur: ${error.message}`);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // VOICE HANDLER (Whisper)
  // ═══════════════════════════════════════════════════════════

  setupVoiceHandler() {
    this.bot.on('voice', async (msg) => {
      if (!this.isAdmin(msg)) return;

      const processing = await this.bot.sendMessage(msg.chat.id, '🎤 Transcription...');

      try {
        // Download voice
        const file = await this.bot.getFile(msg.voice.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${process.env.MANAGER_BOT_TOKEN}/${file.file_path}`;

        // Download
        const response = await fetch(fileUrl);
        const buffer = await response.buffer();

        // Transcrire avec Whisper
        const transcription = await this.openai.audio.transcriptions.create({
          file: new File([buffer], 'audio.ogg', { type: 'audio/ogg' }),
          model: 'whisper-1',
          language: 'fr'
        });

        await this.bot.deleteMessage(msg.chat.id, processing.message_id);

        logger.info(`🎤 Transcrit: "${transcription.text}"`);

        // Traiter comme message texte
        this.bot.emit('message', {
          ...msg,
          text: transcription.text
        });

      } catch (error) {
        logger.error('❌ Erreur transcription:', error);
        await this.bot.deleteMessage(msg.chat.id, processing.message_id);
        await this.bot.sendMessage(msg.chat.id, `❌ Erreur transcription: ${error.message}`);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // INTENT ANALYSIS (GPT-4)
  // ═══════════════════════════════════════════════════════════

  async analyzeIntent(userId, message) {
    // Contexte conversation
    const context = this.memory.getConversationContext(userId, 3);

    const prompt = `
Tu es un assistant pour analyser les intentions d'un utilisateur qui gère un commerce Chine-France.

Historique récent:
${context.map(c => `${c.role}: ${c.content}`).join('\n')}

Message actuel: "${message}"

Analyse l'intention et retourne UN SEUL JSON valide, rien d'autre.

Actions possibles:
- scan_vendor: Scanner produits d'un vendeur spécifique
- scan_product: Chercher un produit/marque
- compare_vinted: Comparer prix avec Vinted France
- add_vendor: Ajouter vendeur à suivre
- show_vendors: Voir liste vendeurs
- show_deals: Voir meilleurs deals
- general: Question générale

Plateformes: xianyu, wechat, weigou, taobao

Format JSON uniquement:
{
  "action": "scan_vendor",
  "platform": "xianyu",
  "vendor_id": "ABC123",
  "vendor_name": "Vendeur X",
  "product_keyword": "Supreme",
  "parameters": {}
}

Exemples:
"Scanne vendeur ABC123 sur Xianyu" → {"action":"scan_vendor","platform":"xianyu","vendor_id":"ABC123"}
"Cherche Supreme" → {"action":"scan_product","product_keyword":"Supreme"}
"Compare avec Vinted" → {"action":"compare_vinted"}

Réponds UNIQUEMENT avec le JSON.
    `.trim();

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Tu es un analyseur d\'intentions. Réponds uniquement en JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 300
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Impossible de parser l\'intention');
    }

    return JSON.parse(jsonMatch[0]);
  }

  // ═══════════════════════════════════════════════════════════
  // ACTION HANDLERS
  // ═══════════════════════════════════════════════════════════

  async handleScanVendor(intent, chatId) {
    // Security: Queue system for concurrent scans
    if (this.isScanning) {
      this.scanQueue.push({ intent, chatId, type: 'vendor' });
      return await this.bot.sendMessage(
        chatId,
        `⏳ Scan en file d'attente (${this.scanQueue.length} en attente)...`
      );
    }

    this.isScanning = true;

    await this.bot.sendMessage(chatId, `🔍 Scan du vendeur ${intent.vendor_id} sur ${intent.platform}...`);

    const startTime = Date.now();

    try {
      // Get scraper
      const scraper = this.scrapers[intent.platform];

      if (!scraper) {
        throw new Error(`Plateforme ${intent.platform} non supportée`);
      }

      // Scan vendor
      const products = await scraper.getVendorProducts(intent.vendor_id);

      const duration = Date.now() - startTime;

      logger.info(`✅ ${products.length} produits trouvés en ${duration}ms`);

      // Sauvegarder produits
      let bestDeal = null;
      let bestScore = 0;

      for (const product of products) {
        // Analyze with AI
        const analysis = await this.analyzeProduct(product);

        // Save to DB
        const productId = this.memory.addProduct({
          product_id: product.id || `${intent.vendor_id}_${Date.now()}_${Math.random()}`,
          title: product.title,
          price_cny: product.price,
          price_eur: product.price * 0.13,
          platform: intent.platform,
          vendor_id: intent.vendor_id,
          image_url: product.image,
          url: product.url,
          deal_score: analysis.score,
          authenticity_score: analysis.authenticity,
          vinted_price_eur: analysis.vinted_price,
          profit_potential: analysis.profit,
          recommended: analysis.score >= 80
        });

        if (analysis.score > bestScore) {
          bestScore = analysis.score;
          bestDeal = { ...product, analysis, id: productId };
        }
      }

      // Update vendor
      this.memory.updateVendorScan(intent.vendor_id, products.length);

      // Format response
      let response = `
✅ **Scan terminé !**

📱 Vendeur: ${intent.vendor_id}
🏪 Plateforme: ${intent.platform}
📦 Produits: ${products.length}
⏱️ Durée: ${duration}ms

      `.trim();

      if (bestDeal) {
        response += `\n\n🔥 **Meilleur deal:**\n`;
        response += `**${bestDeal.title}**\n`;
        response += `💰 ¥${bestDeal.price} (€${(bestDeal.price * 0.13).toFixed(2)})\n`;
        response += `🔥 Score: ${bestDeal.analysis.score}/100\n`;
        response += `💵 Vinted: €${bestDeal.analysis.vinted_price || '?'}\n`;
        response += `📈 Profit: €${bestDeal.analysis.profit?.toFixed(2) || '?'}\n`;
      }

      response += `\n\n💾 Tous les produits sont sauvegardés dans ma mémoire.`;
      response += `\nVoir: /deals`;

      return response;

    } catch (error) {
      logger.error('❌ Erreur scan:', error);
      throw error;
    } finally {
      // Release lock
      this.isScanning = false;

      // Process queue
      if (this.scanQueue.length > 0) {
        const next = this.scanQueue.shift();
        setTimeout(() => {
          if (next.type === 'vendor') {
            this.handleScanVendor(next.intent, next.chatId);
          } else {
            this.handleScanProduct(next.intent, next.chatId);
          }
        }, 1000); // 1 second delay between scans
      }
    }
  }

  async handleScanProduct(intent, chatId) {
    await this.bot.sendMessage(chatId, `🔍 Recherche "${intent.product_keyword}" sur toutes les plateformes...`);

    // Scan sur plusieurs plateformes
    const results = {};

    for (const [name, scraper] of Object.entries(this.scrapers)) {
      try {
        const products = await scraper.search(intent.product_keyword);
        results[name] = products;

        await this.bot.sendMessage(chatId, `  ✅ ${name}: ${products.length} résultats`);

      } catch (error) {
        logger.error(`❌ ${name}:`, error);
        results[name] = [];
      }
    }

    // Analyser et sauvegarder meilleurs deals
    // ... (similaire à handleScanVendor)

    return `✅ Recherche terminée ! Voir /deals`;
  }

  async handleCompareVinted(intent, chatId) {
    await this.bot.sendMessage(chatId, '💰 Comparaison avec Vinted France...');

    // Get recent products
    const recentProducts = this.memory.getRecentProducts(20);

    if (recentProducts.length === 0) {
      return '⚠️ Aucun produit récent à comparer. Scanne d\'abord des produits !';
    }

    // Pour chaque produit, chercher équivalent Vinted
    // (Nécessite API ou scraper Vinted)

    // TODO: Implémenter scraper Vinted

    return '💰 Comparaison Vinted à implémenter (besoin API/scraper Vinted)';
  }

  async handleAddVendor(intent) {
    this.memory.addVendor({
      vendor_id: intent.vendor_id,
      vendor_name: intent.vendor_name,
      platform: intent.platform,
      added_by: this.adminUserId
    });

    return `✅ Vendeur **${intent.vendor_name || intent.vendor_id}** ajouté sur ${intent.platform} !`;
  }

  async handleGeneralQuestion(userId, question) {
    // Contexte enrichi
    const context = this.memory.getConversationContext(userId, 5);
    const knowledge = this.memory.getAllFacts(userId);

    let systemPrompt = 'Tu es Manager, assistant commerce Chine-France avec mémoire.';

    if (knowledge.length > 0) {
      systemPrompt += '\n\nCe que je sais:\n';
      knowledge.forEach(f => {
        systemPrompt += `- ${f.category}.${f.key}: ${f.value}\n`;
      });
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...context,
        { role: 'user', content: question }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content;
  }

  // ═══════════════════════════════════════════════════════════
  // PRODUCT ANALYSIS (GPT-4)
  // ═══════════════════════════════════════════════════════════

  async analyzeProduct(product) {
    const prompt = `
Analyse ce produit de seconde main:

Titre: ${product.title}
Prix: ¥${product.price}
Plateforme: ${product.platform}
Vendeur: ${product.vendor || 'N/A'}

Donne en JSON:
{
  "score": 85,
  "authenticity": 90,
  "condition": 85,
  "vinted_price": 120,
  "profit": 35,
  "recommendation": "BUY"
}

Score = deal quality (0-100)
Authenticity = authenticité estimée (0-100)
Vinted_price = prix revente France (EUR)
Profit = profit estimé (EUR)
Recommendation = BUY/CONSIDER/SKIP
    `.trim();

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Tu es expert en mode et authentification.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    return JSON.parse(jsonMatch[0]);
  }

  // ═══════════════════════════════════════════════════════════
  // FORMATTERS
  // ═══════════════════════════════════════════════════════════

  formatVendorsList(vendors) {
    if (vendors.length === 0) return '📋 Aucun vendeur suivi';

    let msg = `📋 **Vendeurs suivis** (${vendors.length})\n\n`;

    vendors.slice(0, 10).forEach((v, i) => {
      msg += `${i + 1}. **${v.vendor_name || v.vendor_id}**\n`;
      msg += `   📱 ${v.platform} | ⭐ ${v.rating || '?'}\n`;
      msg += `   📦 ${v.total_products} produits | 🔍 ${v.total_scans} scans\n\n`;
    });

    return msg.trim();
  }

  formatDealsList(deals) {
    if (deals.length === 0) return '💰 Aucun deal trouvé';

    let msg = `💰 **Top Deals**\n\n`;

    deals.slice(0, 5).forEach((d, i) => {
      msg += `${i + 1}. **${d.title}**\n`;
      msg += `   💰 ¥${d.price_cny} → €${d.price_eur}\n`;
      msg += `   🔥 Score: ${d.deal_score}/100\n`;
      msg += `   📈 Profit: €${d.profit_potential || '?'}\n\n`;
    });

    return msg.trim();
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  setupDocumentHandler() {
    this.bot.on('document', async (msg) => {
      if (!this.isAdmin(msg)) return;

      const doc = msg.document;

      // Security: File size check
      if (doc.file_size > this.MAX_FILE_SIZE) {
        return this.bot.sendMessage(
          msg.chat.id,
          `❌ Fichier trop volumineux (max ${this.MAX_FILE_SIZE / 1024 / 1024}MB)`
        );
      }

      // Import mémoire
      if (doc.file_name.includes('Manager_export') && doc.file_name.endsWith('.json.gz')) {
        await this.bot.sendMessage(msg.chat.id, '📥 Import en cours...');

        try {
          const file = await this.bot.getFile(doc.file_id);
          const fileUrl = `https://api.telegram.org/file/bot${process.env.MANAGER_BOT_TOKEN}/${file.file_path}`;

          const response = await fetch(fileUrl);
          const buffer = await response.buffer();

          // Security: Sanitize filename to prevent path traversal
          const safeFilename = path.basename(doc.file_name).replace(/[^a-zA-Z0-9._-]/g, '_');
          const randomId = crypto.randomBytes(8).toString('hex');
          const tempPath = `/tmp/manager_import_${randomId}_${safeFilename}`;

          fs.writeFileSync(tempPath, buffer);

          await this.memory.importFromTelegram(tempPath, msg.from.id.toString());

          await this.bot.sendMessage(msg.chat.id, '✅ Mémoire restaurée !');

          // Cleanup
          fs.unlinkSync(tempPath);

        } catch (error) {
          await this.bot.sendMessage(msg.chat.id, `❌ Erreur: ${error.message}`);
        }
      }
    });
  }

  setupDailyBackup() {
    schedule.schedule('0 3 * * *', async () => {
      logger.info('📤 Auto-backup quotidien...');

      try {
        const exportData = await this.memory.exportForTelegram(this.adminUserId);

        await this.bot.sendDocument(this.adminUserId, exportData.path, {
          caption: '💾 Backup automatique quotidien - Manager Bot',
          disable_notification: true
        });

        logger.info('✅ Auto-backup envoyé');

      } catch (error) {
        logger.error('❌ Erreur auto-backup:', error);
      }
    });

    logger.info('✅ Auto-backup quotidien configuré (3h00)');
  }

  isAdmin(msg) {
    return msg.from.id.toString() === this.adminUserId;
  }

  // Security: Rate limiting
  checkRateLimit(userId) {
    const now = Date.now();
    const userLimit = this.rateLimits.get(userId) || { count: 0, resetAt: now + 60000 };

    // Reset if time window expired
    if (now > userLimit.resetAt) {
      userLimit.count = 0;
      userLimit.resetAt = now + 60000;
    }

    // Check limit
    if (userLimit.count >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    // Increment
    userLimit.count++;
    this.rateLimits.set(userId, userLimit);

    return true;
  }

  async sendToAdmin(message) {
    await this.bot.sendMessage(this.adminUserId, message, { parse_mode: 'Markdown' });
  }

  async shutdown() {
    logger.info('🛑 Shutdown Manager Bot...');

    await this.memory.syncToServer();
    this.memory.close();

    await this.bot.stopPolling();

    logger.info('✅ Manager Bot arrêté proprement');
  }
}

// Export
module.exports = ManagerBot;

// Si lancé directement
if (require.main === module) {
  const bot = new ManagerBot();
  bot.start().catch(console.error);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await bot.shutdown();
    process.exit(0);
  });
}
