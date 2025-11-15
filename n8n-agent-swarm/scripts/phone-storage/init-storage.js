#!/usr/bin/env node

/**
 * Phone Storage Initialization Script
 *
 * Initializes the personal memory system by:
 * 1. Creating initial JSON files from templates
 * 2. Sending them to user via Telegram
 * 3. Guiding user through setup
 * 4. Validating received files
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuration
const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  TEMPLATES_DIR: path.join(__dirname, '../../templates/phone-storage'),
  CACHE_DIR: path.join(__dirname, '../../.cache/phone-storage'),
  FILES: ['my-profile.json', 'my-memory.json', 'my-contacts.json', 'my-habits.json']
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

/**
 * Send message to Telegram
 */
async function sendTelegramMessage(text, parseMode = 'Markdown') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: CONFIG.TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: parseMode
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`Telegram API error: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Send file to Telegram
 */
async function sendTelegramFile(filePath, caption = '') {
  const FormData = require('form-data');
  const form = new FormData();

  form.append('chat_id', CONFIG.TELEGRAM_CHAT_ID);
  form.append('document', await fs.readFile(filePath), {
    filename: path.basename(filePath),
    contentType: 'application/json'
  });

  if (caption) {
    form.append('caption', caption);
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendDocument`,
      method: 'POST',
      headers: form.getHeaders()
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`Telegram API error: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

/**
 * Validate JSON file structure
 */
function validateJSONFile(filename, data) {
  const requiredFields = {
    'my-profile.json': ['user', 'communication', 'budget', 'system'],
    'my-memory.json': ['context', 'projects', 'deadlines', 'metadata'],
    'my-contacts.json': ['contacts', 'groups', 'shortcuts', 'metadata'],
    'my-habits.json': ['detected_patterns', 'frequent_actions', 'preferences_learned', 'metadata']
  };

  const required = requiredFields[filename];
  if (!required) {
    throw new Error(`Unknown file: ${filename}`);
  }

  const missing = required.filter(field => !(field in data));
  if (missing.length > 0) {
    throw new Error(`Missing required fields in ${filename}: ${missing.join(', ')}`);
  }

  // Check version
  if (!data.version) {
    throw new Error(`Missing version field in ${filename}`);
  }

  return true;
}

/**
 * Personalize template with user data
 */
async function personalizeTemplate(filename) {
  const templatePath = path.join(CONFIG.TEMPLATES_DIR, filename);
  const template = JSON.parse(await fs.readFile(templatePath, 'utf8'));

  // Update timestamps
  const now = new Date().toISOString();
  template.last_updated = now;

  if (template.system) {
    template.system.created_at = now;
    template.system.last_synced = now;
  }

  if (template.metadata) {
    template.metadata.created_at = now;
    template.metadata.last_sync = now;
  }

  return template;
}

/**
 * Create cache directory
 */
async function ensureCacheDir() {
  try {
    await fs.mkdir(CONFIG.CACHE_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Initialize phone storage
 */
async function initializeStorage() {
  console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  📱 Phone Storage Initialization      ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

  // Validate environment
  if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
    console.error(`${colors.red}❌ Error: Missing Telegram configuration${colors.reset}`);
    console.log(`${colors.yellow}Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env${colors.reset}`);
    process.exit(1);
  }

  try {
    // Create cache directory
    console.log(`${colors.blue}📁 Creating cache directory...${colors.reset}`);
    await ensureCacheDir();
    console.log(`${colors.green}✅ Cache directory ready${colors.reset}\n`);

    // Process each template file
    console.log(`${colors.blue}📄 Processing template files...${colors.reset}`);
    const personalizedFiles = [];

    for (const filename of CONFIG.FILES) {
      console.log(`   • ${filename}`);

      // Personalize template
      const personalized = await personalizeTemplate(filename);

      // Save to cache
      const cachePath = path.join(CONFIG.CACHE_DIR, filename);
      await fs.writeFile(cachePath, JSON.stringify(personalized, null, 2));

      // Validate
      validateJSONFile(filename, personalized);

      personalizedFiles.push({
        filename,
        cachePath,
        data: personalized
      });
    }

    console.log(`${colors.green}✅ All files processed and validated${colors.reset}\n`);

    // Send introduction message
    console.log(`${colors.blue}📤 Sending introduction to Telegram...${colors.reset}`);

    const introMessage = `🧠 *Welcome to Your Personal Memory System!*

I've prepared your personal storage files. These will be stored on YOUR phone for maximum privacy.

📱 *How it works:*
1️⃣ You'll receive 4 JSON files
2️⃣ Save them in Telegram "Saved Messages"
3️⃣ I'll update them as we interact
4️⃣ Sync happens automatically every hour

🔐 *Privacy:*
• Your data stays on YOUR phone
• Server only keeps temporary cache (RAM)
• Auto-deleted after 6 hours
• Full control over your information

📁 *Files you'll receive:*
• my-profile.json - Your preferences & settings
• my-memory.json - Context & ongoing projects
• my-contacts.json - People & communication
• my-habits.json - Learned patterns & shortcuts

Sending your files now... 📤`;

    await sendTelegramMessage(introMessage);
    console.log(`${colors.green}✅ Introduction sent${colors.reset}\n`);

    // Send each file with description
    console.log(`${colors.blue}📤 Sending files to Telegram...${colors.reset}`);

    const fileDescriptions = {
      'my-profile.json': '👤 Your Profile\nPreferences, timezone, budget settings',
      'my-memory.json': '🧠 Your Memory\nContext, projects, important facts',
      'my-contacts.json': '📇 Your Contacts\nPeople, communication preferences',
      'my-habits.json': '🔮 Your Habits\nLearned patterns, automation opportunities'
    };

    for (const { filename, cachePath } of personalizedFiles) {
      const caption = fileDescriptions[filename];
      await sendTelegramFile(cachePath, caption);
      console.log(`   ${colors.green}✅${colors.reset} ${filename}`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`${colors.green}\n✅ All files sent successfully!${colors.reset}\n`);

    // Send next steps
    const nextStepsMessage = `✅ *Setup Complete!*

Your files are ready. Here's what to do:

📌 *Save the files:*
1. Find the 4 files I just sent
2. Forward them to "Saved Messages"
3. Pin them for easy access

🚀 *Start using:*
Just send me the files when you want to:
• Start a new session: "Here's my memory"
• Update context: "Sync my files"
• Backup: Use /backup command

💡 *Pro Tips:*
• Files auto-sync every hour
• Use /status to check sync state
• Use /clear to clear cache only
• Data stays on YOUR phone 🔐

Ready to help whenever you need! Just send the files to begin. 🎯`;

    await sendTelegramMessage(nextStepsMessage);

    // Generate summary
    console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║  ✅ Initialization Complete!          ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.green}📊 Summary:${colors.reset}`);
    console.log(`   • Files created: ${personalizedFiles.length}`);
    console.log(`   • Cache location: ${CONFIG.CACHE_DIR}`);
    console.log(`   • Sent to Telegram: ${CONFIG.TELEGRAM_CHAT_ID}`);
    console.log(`\n${colors.yellow}📱 Next Step:${colors.reset}`);
    console.log(`   Check Telegram and save the files to "Saved Messages"`);
    console.log(`\n${colors.blue}💡 Usage:${colors.reset}`);
    console.log(`   User sends files → Memory loaded → Context active`);
    console.log(`\n${colors.cyan}🔐 Privacy:${colors.reset}`);
    console.log(`   All data on user's phone. Server cache expires in 6h.`);
    console.log();

  } catch (error) {
    console.error(`${colors.red}❌ Error during initialization:${colors.reset}`, error.message);
    process.exit(1);
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  initializeStorage().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  initializeStorage,
  validateJSONFile,
  personalizeTemplate,
  sendTelegramMessage,
  sendTelegramFile
};
