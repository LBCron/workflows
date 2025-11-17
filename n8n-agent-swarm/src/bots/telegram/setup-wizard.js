/**
 * Setup Wizard - Premier lancement Manager Bot
 *
 * Guide l'utilisateur à travers la configuration initiale:
 * 1. Connexion Xianyu (obligatoire)
 * 2. Gmail OAuth (optionnel)
 * 3. Calendar OAuth (optionnel)
 * 4. Drive OAuth (optionnel)
 */

const path = require('path');
const crypto = require('crypto');

class SetupWizard {
  constructor(bot, memory, xianyuScraper, emailAgent, calendarAgent, driveAgent) {
    this.bot = bot;
    this.memory = memory;
    this.xianyuScraper = xianyuScraper;
    this.emailAgent = emailAgent;
    this.calendarAgent = calendarAgent;
    this.driveAgent = driveAgent;

    // Map pour tracker l'état de setup de chaque user
    this.setupStates = new Map(); // userId → { step, chatId, completed: {} }
  }

  /**
   * Démarrer le wizard
   */
  async start(chatId, userId) {
    // Vérifier si déjà configuré
    const isSetup = await this.memory.getUserSetupStatus?.(userId);

    if (isSetup) {
      return await this.bot.sendMessage(chatId,
        `✅ Vous êtes déjà configuré!\n\n` +
        `Commandes disponibles:\n` +
        `/xianyu_scan - Scanner vendeur Xianyu\n` +
        `/email - Gérer emails\n` +
        `/calendar - Gérer agenda\n` +
        `/drive - Gérer Drive\n` +
        `/search - Recherche web\n` +
        `/help - Aide complète`
      );
    }

    // Initialiser l'état
    this.setupStates.set(userId, {
      step: 'welcome',
      chatId,
      completed: {
        xianyu: false,
        gmail: false,
        calendar: false,
        drive: false
      },
      tokens: {}
    });

    await this.showWelcome(chatId);
  }

  /**
   * Écran de bienvenue
   */
  async showWelcome(chatId) {
    const message =
      `👋 **Bienvenue sur Manager Bot!**\n\n` +
      `🇨🇳 配置首次使用\n` +
      `🇬🇧 First-time setup required\n\n` +
      `Je vais vous guider pour connecter:\n` +
      `1️⃣ Xianyu (闲鱼) - Obligatoire\n` +
      `2️⃣ Gmail - Optionnel\n` +
      `3️⃣ Google Calendar - Optionnel\n` +
      `4️⃣ Google Drive - Optionnel\n\n` +
      `准备好了吗？ Ready?`;

    await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🚀 开始 / Start Setup', callback_data: 'setup_start' }
        ]]
      }
    });
  }

  /**
   * Handler pour les callback queries
   */
  async handleCallback(query) {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.callback_data;

    // Acknowledge callback
    await this.bot.answerCallbackQuery(query.id);

    // Router vers la bonne étape
    if (data === 'setup_start') {
      await this.setupXianyu(chatId, userId);
    } else if (data === 'setup_gmail_yes') {
      await this.setupGmail(chatId, userId);
    } else if (data === 'setup_gmail_skip') {
      await this.askCalendar(chatId, userId);
    } else if (data === 'setup_calendar_yes') {
      await this.setupCalendar(chatId, userId);
    } else if (data === 'setup_calendar_skip') {
      await this.askDrive(chatId, userId);
    } else if (data === 'setup_drive_yes') {
      await this.setupDrive(chatId, userId);
    } else if (data === 'setup_drive_skip') {
      await this.finishSetup(chatId, userId);
    }
  }

  /**
   * Étape 1: Setup Xianyu
   */
  async setupXianyu(chatId, userId) {
    await this.bot.sendMessage(chatId,
      `1️⃣ **连接闲鱼 / Connect Xianyu**\n\n` +
      `请扫描二维码登录\n` +
      `Please scan QR code to login\n\n` +
      `⏳ Génération du QR code...`,
      { parse_mode: 'Markdown' }
    );

    try {
      // Listener pour le QR code
      this.xianyuScraper.once('qr-ready', async (qrPath) => {
        await this.bot.sendPhoto(chatId, qrPath, {
          caption: '📱 扫描此二维码 / Scan this QR code\n\n等待登录... / Waiting for login...'
        });
      });

      // Listener pour le succès
      this.xianyuScraper.once('login-success', async () => {
        const state = this.setupStates.get(userId);
        if (state) {
          state.completed.xianyu = true;

          await this.bot.sendMessage(chatId,
            `✅ **闲鱼已连接！ / Xianyu Connected!**\n\n` +
            `现在可以扫描卖家了 / You can now scan vendors!`,
            { parse_mode: 'Markdown' }
          );

          // Passer à l'étape suivante
          await this.askGmail(chatId, userId);
        }
      });

      // Lancer le login
      await this.xianyuScraper.login();

    } catch (error) {
      console.error('Xianyu login error:', error);
      await this.bot.sendMessage(chatId,
        `❌ Erreur connexion Xianyu\n\n` +
        `错误: ${error.message}\n\n` +
        `Réessayez: /setup`
      );
    }
  }

  /**
   * Demander si l'utilisateur veut connecter Gmail
   */
  async askGmail(chatId, userId) {
    await this.bot.sendMessage(chatId,
      `2️⃣ **连接 Gmail?**\n\n` +
      `Permet de:\n` +
      `✅ Lire vos emails\n` +
      `✅ Envoyer des emails\n` +
      `✅ Résumer avec IA\n` +
      `✅ Rechercher emails\n\n` +
      `Voulez-vous connecter Gmail?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ 是 / Yes', callback_data: 'setup_gmail_yes' },
            { text: '⏭️ 跳过 / Skip', callback_data: 'setup_gmail_skip' }
          ]]
        }
      }
    );
  }

  /**
   * Setup Gmail OAuth
   */
  async setupGmail(chatId, userId) {
    const oauthUrl = this.generateGmailOAuthUrl();

    await this.bot.sendMessage(chatId,
      `2️⃣ **Gmail OAuth**\n\n` +
      `Cliquez sur ce lien pour autoriser:\n` +
      `${oauthUrl}\n\n` +
      `Après autorisation, vous serez redirigé.\n` +
      `Copiez le CODE et envoyez-le ici.\n\n` +
      `Format: \`CODE: 4/0Adeu5BW...\``
      ,
      { parse_mode: 'Markdown' }
    );

    // Marquer qu'on attend un code
    const state = this.setupStates.get(userId);
    if (state) {
      state.step = 'waiting_gmail_code';
    }
  }

  /**
   * Gérer le code OAuth Gmail
   */
  async handleGmailCode(chatId, userId, code) {
    await this.bot.sendMessage(chatId, `⏳ Échange du code OAuth...`);

    try {
      const tokens = await this.emailAgent.exchangeCodeForTokens(code);

      const state = this.setupStates.get(userId);
      if (state) {
        state.completed.gmail = true;
        state.tokens.gmail = tokens;
      }

      await this.bot.sendMessage(chatId,
        `✅ **Gmail connecté!**\n\n` +
        `Vous pouvez maintenant:\n` +
        `• Lire emails: /email lire\n` +
        `• Envoyer: /email envoie à...\n` +
        `• Chercher: /email cherche...`,
        { parse_mode: 'Markdown' }
      );

      await this.askCalendar(chatId, userId);

    } catch (error) {
      await this.bot.sendMessage(chatId,
        `❌ Erreur OAuth: ${error.message}\n\n` +
        `Réessayez ou passez: /setup`
      );
    }
  }

  /**
   * Demander Calendar
   */
  async askCalendar(chatId, userId) {
    await this.bot.sendMessage(chatId,
      `3️⃣ **Google Calendar?**\n\n` +
      `Permet de:\n` +
      `✅ Voir votre agenda\n` +
      `✅ Créer des événements\n` +
      `✅ Trouver créneaux libres\n` +
      `✅ Rappels automatiques\n\n` +
      `Voulez-vous connecter Calendar?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ 是 / Yes', callback_data: 'setup_calendar_yes' },
            { text: '⏭️ 跳过 / Skip', callback_data: 'setup_calendar_skip' }
          ]]
        }
      }
    );
  }

  /**
   * Setup Calendar
   */
  async setupCalendar(chatId, userId) {
    const oauthUrl = this.generateCalendarOAuthUrl();

    await this.bot.sendMessage(chatId,
      `3️⃣ **Calendar OAuth**\n\n` +
      `Cliquez: ${oauthUrl}\n\n` +
      `Copiez le CODE et envoyez-le.\n` +
      `Format: \`CODE: 4/0Adeu5BW...\``,
      { parse_mode: 'Markdown' }
    );

    const state = this.setupStates.get(userId);
    if (state) {
      state.step = 'waiting_calendar_code';
    }
  }

  /**
   * Demander Drive
   */
  async askDrive(chatId, userId) {
    await this.bot.sendMessage(chatId,
      `4️⃣ **Google Drive?**\n\n` +
      `Permet de:\n` +
      `✅ Chercher fichiers\n` +
      `✅ Lire documents\n` +
      `✅ Créer docs\n` +
      `✅ Modifier docs\n\n` +
      `Voulez-vous connecter Drive?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ 是 / Yes', callback_data: 'setup_drive_yes' },
            { text: '⏭️ 跳过 / Skip', callback_data: 'setup_drive_skip' }
          ]]
        }
      }
    );
  }

  /**
   * Setup Drive
   */
  async setupDrive(chatId, userId) {
    const oauthUrl = this.generateDriveOAuthUrl();

    await this.bot.sendMessage(chatId,
      `4️⃣ **Drive OAuth**\n\n` +
      `Cliquez: ${oauthUrl}\n\n` +
      `Copiez le CODE et envoyez-le.\n` +
      `Format: \`CODE: 4/0Adeu5BW...\``,
      { parse_mode: 'Markdown' }
    );

    const state = this.setupStates.get(userId);
    if (state) {
      state.step = 'waiting_drive_code';
    }
  }

  /**
   * Terminer le setup
   */
  async finishSetup(chatId, userId) {
    const state = this.setupStates.get(userId);
    if (!state) return;

    // Sauvegarder dans la mémoire
    if (this.memory.markUserAsSetup) {
      await this.memory.markUserAsSetup(userId, state.completed, state.tokens);
    }

    const message =
      `🎉 **配置完成！ / Setup Complete!**\n\n` +
      `Services connectés:\n` +
      `${state.completed.xianyu ? '✅' : '❌'} Xianyu\n` +
      `${state.completed.gmail ? '✅' : '❌'} Gmail\n` +
      `${state.completed.calendar ? '✅' : '❌'} Calendar\n` +
      `${state.completed.drive ? '✅' : '❌'} Drive\n\n` +
      `你现在可以使用机器人了！\n` +
      `You can now use the bot!\n\n` +
      `**试试 / Try:**\n` +
      `/xianyu_scan VENDOR_ID - Scanner vendeur\n` +
      `/email - Gérer emails\n` +
      `/calendar - Gérer agenda\n` +
      `/drive - Gérer Drive\n` +
      `/search - Recherche web\n` +
      `/help - Aide complète`;

    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    // Cleanup
    this.setupStates.delete(userId);
  }

  /**
   * Handler pour messages texte (codes OAuth)
   */
  async handleMessage(msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;

    const state = this.setupStates.get(userId);
    if (!state) return false; // Pas en cours de setup

    // Vérifier si c'est un code OAuth
    if (text.startsWith('CODE:') || text.startsWith('code:') || text.match(/^4\/0[A-Za-z0-9_-]+/)) {
      const code = text.replace(/^CODE:\s*/i, '').trim();

      if (state.step === 'waiting_gmail_code') {
        await this.handleGmailCode(chatId, userId, code);
        return true;
      } else if (state.step === 'waiting_calendar_code') {
        await this.handleCalendarCode(chatId, userId, code);
        return true;
      } else if (state.step === 'waiting_drive_code') {
        await this.handleDriveCode(chatId, userId, code);
        return true;
      }
    }

    return false; // Message non géré
  }

  /**
   * Générer OAuth URLs
   */
  generateGmailOAuthUrl() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth2callback';
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify'
    ].join(' ');

    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent`;
  }

  generateCalendarOAuthUrl() {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3000/oauth2callback';
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ].join(' ');

    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent`;
  }

  generateDriveOAuthUrl() {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/documents'
    ].join(' ');

    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent`;
  }

  /**
   * Handle Calendar code
   */
  async handleCalendarCode(chatId, userId, code) {
    await this.bot.sendMessage(chatId, `⏳ Échange du code Calendar...`);

    try {
      const tokens = await this.calendarAgent.exchangeCodeForTokens(code);

      const state = this.setupStates.get(userId);
      if (state) {
        state.completed.calendar = true;
        state.tokens.calendar = tokens;
      }

      await this.bot.sendMessage(chatId,
        `✅ **Calendar connecté!**\n\n` +
        `Commandes:\n` +
        `• /calendar aujourd'hui\n` +
        `• /calendar crée meeting...\n` +
        `• /calendar trouve créneaux`,
        { parse_mode: 'Markdown' }
      );

      await this.askDrive(chatId, userId);

    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Erreur: ${error.message}`);
    }
  }

  /**
   * Handle Drive code
   */
  async handleDriveCode(chatId, userId, code) {
    await this.bot.sendMessage(chatId, `⏳ Échange du code Drive...`);

    try {
      const tokens = await this.driveAgent.exchangeCodeForTokens(code);

      const state = this.setupStates.get(userId);
      if (state) {
        state.completed.drive = true;
        state.tokens.drive = tokens;
      }

      await this.bot.sendMessage(chatId,
        `✅ **Drive connecté!**\n\n` +
        `Commandes:\n` +
        `• /drive cherche [query]\n` +
        `• /drive lis [filename]\n` +
        `• /drive crée [title]`,
        { parse_mode: 'Markdown' }
      );

      await this.finishSetup(chatId, userId);

    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Erreur: ${error.message}`);
    }
  }
}

module.exports = SetupWizard;
