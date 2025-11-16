/**
 * Main Entry Point
 */

require('dotenv').config();
const logger = require('./core/logger/logger');
const bot = require('./bot');

async function main() {
  try {
    logger.info('🚀 Démarrage du système AI Agent Swarm...');
    await bot.start();
    logger.info('✅ Système démarré avec succès');
  } catch (error) {
    logger.error('Erreur fatale au démarrage', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
