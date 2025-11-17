#!/usr/bin/env node

/**
 * AI Agent Swarm - Premium Bots Launcher
 *
 * Lancement des bots Paul et Manager avec tous les systèmes premium intégrés
 */

require('dotenv').config();
const PaulBot = require('./paul-bot');
const ManagerBot = require('./manager-bot');
const logger = require('../utils/logger');

// Validation
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN manquant dans .env');
  process.exit(1);
}

if (!process.env.MASTER_PASSWORD) {
  console.error('❌ MASTER_PASSWORD manquant dans .env (requis pour le vault)');
  process.exit(1);
}

// Mode de démarrage
const mode = process.argv[2] || 'paul'; // paul | manager | both

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🤖 AI AGENT SWARM - PREMIUM EDITION                         ║
║                                                               ║
║  Version: 4.0.0                                              ║
║  Mode: ${mode.toUpperCase().padEnd(56)} ║
║  Time: ${new Date().toISOString()}                ║
║                                                               ║
║  🔥 PREMIUM SYSTEMS:                                          ║
║  ✅ Credential Vault Ultimate                                ║
║  ✅ Learning Engine V2                                       ║
║  ✅ iPhone Sync Ultimate                                     ║
║  ✅ Performance Monitoring                                   ║
║  ✅ UI Premium                                               ║
║  ✅ Security Manager Enterprise                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  let paulBot, managerBot;

  try {
    if (mode === 'paul' || mode === 'both') {
      logger.info('🚀 Starting Paul Bot...');

      paulBot = new PaulBot(process.env.TELEGRAM_BOT_TOKEN);
      await paulBot.start();
    }

    if (mode === 'manager' || mode === 'both') {
      if (!process.env.MANAGER_BOT_TOKEN) {
        logger.error('❌ MANAGER_BOT_TOKEN required for manager mode');
        process.exit(1);
      }

      if (!process.env.ADMIN_CHAT_IDS) {
        logger.warn('⚠️ ADMIN_CHAT_IDS not set, manager bot will be accessible to all');
      }

      const adminChatIds = process.env.ADMIN_CHAT_IDS
        ? process.env.ADMIN_CHAT_IDS.split(',').map(id => id.trim())
        : [];

      logger.info('🚀 Starting Manager Bot...');

      managerBot = new ManagerBot(process.env.MANAGER_BOT_TOKEN, adminChatIds);
      await managerBot.start();
    }

    logger.info('✅ All bots started successfully');

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down...`);

      if (paulBot) {
        await paulBot.stop();
      }

      if (managerBot) {
        await managerBot.stop();
      }

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
