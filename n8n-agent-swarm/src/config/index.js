/**
 * Configuration Loader
 */

const path = require('path');
const fs = require('fs');

const env = process.env.NODE_ENV || 'development';

// Load environment config
let envConfig = {};
const configPath = path.join(__dirname, '../../config', `${env}.json`);
if (fs.existsSync(configPath)) {
  envConfig = require(configPath);
}

// Merge with environment variables
const config = {
  env,
  port: process.env.PORT || 3000,
  logLevel: process.env.LOG_LEVEL || 'info',

  // Telegram
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    webhook: process.env.TELEGRAM_WEBHOOK_URL
  },

  // LLM APIs
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY
  },

  // Budget
  budget: {
    monthlyLimit: parseFloat(process.env.MONTHLY_BUDGET_LIMIT || '10'),
    alertThresholds: [0.75, 0.90, 0.95]
  },

  // Cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000')
  },

  // Override with env config
  ...envConfig
};

// Validate required config
function validate() {
  const required = ['telegram.token'];

  required.forEach(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    if (!value) {
      throw new Error(`Configuration manquante: ${key}`);
    }
  });
}

module.exports = { config, validate };
