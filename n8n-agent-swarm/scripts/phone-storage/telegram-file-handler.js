#!/usr/bin/env node

/**
 * Telegram File Handler
 *
 * Handles file operations with Telegram:
 * - Download files from Telegram (when user sends them)
 * - Upload files to Telegram (for sync)
 * - File validation
 * - Integration with sync-manager
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  CACHE_DIR: path.join(__dirname, '../../.cache/phone-storage'),
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20 MB
  ACCEPTED_FILENAMES: [
    'my-profile.json',
    'my-memory.json',
    'my-contacts.json',
    'my-habits.json'
  ]
};

/**
 * Make Telegram API request
 */
async function telegramApiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${CONFIG.TELEGRAM_BOT_TOKEN}/${endpoint}`,
      method: method,
      headers: {}
    };

    let postData = null;
    if (data) {
      postData = JSON.stringify(data);
      options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      };
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.ok) {
            resolve(parsed.result);
          } else {
            reject(new Error(`Telegram API error: ${parsed.description}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Get file info from Telegram
 */
async function getFileInfo(fileId) {
  return await telegramApiRequest('GET', `getFile?file_id=${fileId}`);
}

/**
 * Download file from Telegram
 */
async function downloadFile(fileId, savePath) {
  // Get file info
  const fileInfo = await getFileInfo(fileId);

  if (!fileInfo.file_path) {
    throw new Error('File path not available');
  }

  // Check file size
  if (fileInfo.file_size > CONFIG.MAX_FILE_SIZE) {
    throw new Error(`File too large: ${fileInfo.file_size} bytes (max: ${CONFIG.MAX_FILE_SIZE})`);
  }

  // Download file
  const fileUrl = `https://api.telegram.org/file/bot${CONFIG.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;

  return new Promise((resolve, reject) => {
    https.get(fileUrl, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed: ${res.statusCode}`));
        return;
      }

      const fileStream = require('fs').createWriteStream(savePath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve({
          path: savePath,
          size: fileInfo.file_size,
          file_id: fileId
        });
      });

      fileStream.on('error', (error) => {
        fs.unlink(savePath).catch(() => {}); // Clean up on error
        reject(error);
      });
    }).on('error', reject);
  });
}

/**
 * Upload file to Telegram
 */
async function uploadFile(filePath, caption = '') {
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
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.ok) {
            resolve(parsed.result);
          } else {
            reject(new Error(`Upload failed: ${parsed.description}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

/**
 * Send message to Telegram
 */
async function sendMessage(text, parseMode = 'Markdown') {
  return await telegramApiRequest('POST', 'sendMessage', {
    chat_id: CONFIG.TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: parseMode
  });
}

/**
 * Process incoming file from user
 */
async function processIncomingFile(fileId, fileName) {
  console.log(`📥 Processing incoming file: ${fileName}`);

  // Validate filename
  if (!CONFIG.ACCEPTED_FILENAMES.includes(fileName)) {
    console.log(`⚠️  Unrecognized file: ${fileName}`);
    await sendMessage(`⚠️ Unrecognized file: ${fileName}\n\nExpected files:\n${CONFIG.ACCEPTED_FILENAMES.map(f => `• ${f}`).join('\n')}`);
    return { success: false, reason: 'invalid_filename' };
  }

  try {
    // Download file
    const savePath = path.join(CONFIG.CACHE_DIR, fileName);
    const result = await downloadFile(fileId, savePath);

    console.log(`✅ Downloaded: ${fileName} (${result.size} bytes)`);

    // Validate JSON
    const content = await fs.readFile(savePath, 'utf8');
    const data = JSON.parse(content);

    // Validate structure
    const { validateJSONFile } = require('./init-storage');
    validateJSONFile(fileName, data);

    console.log(`✅ Validated: ${fileName}`);

    // Load into sync manager
    const syncManager = require('./sync-manager');
    const fileType = fileName.replace('my-', '').replace('.json', '');

    await syncManager.initialize();
    await syncManager.loadFile(fileType, savePath);

    console.log(`✅ Loaded into cache: ${fileType}`);

    return {
      success: true,
      fileName,
      fileType,
      size: result.size,
      data
    };

  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error.message);
    await sendMessage(`❌ Error processing ${fileName}:\n${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Process all incoming files (batch)
 */
async function processIncomingFiles(files) {
  console.log(`📥 Processing ${files.length} file(s)...`);

  const results = [];

  for (const file of files) {
    const result = await processIncomingFile(file.file_id, file.file_name);
    results.push(result);
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;

  console.log(`✅ Processed: ${successful} successful, ${failed} failed`);

  // Send confirmation message
  if (successful === files.length) {
    await sendMessage(`✅ *Memory Loaded!*\n\n📊 Loaded ${successful} file(s):\n${results.map(r => `• ${r.fileName}`).join('\n')}\n\nContext restored. Ready to help! 🎯`);
  } else if (successful > 0) {
    await sendMessage(`⚠️ *Partial Load*\n\n✅ Loaded: ${successful}\n❌ Failed: ${failed}\n\nCheck the errors above.`);
  } else {
    await sendMessage(`❌ *Load Failed*\n\nAll ${failed} file(s) failed to load. Please check the files and try again.`);
  }

  return results;
}

/**
 * Send updated files back to user
 */
async function sendUpdatedFiles(fileTypes = null) {
  const syncManager = require('./sync-manager');

  // If no specific types, send all dirty files
  const filesToSend = fileTypes || syncManager.getDirtyFiles();

  if (filesToSend.length === 0) {
    console.log('✅ No files to send (no changes)');
    await sendMessage('✅ No changes to sync. All up to date!');
    return { success: true, sent: 0 };
  }

  console.log(`📤 Sending ${filesToSend.length} updated file(s)...`);

  await sendMessage(`📤 *Syncing Updated Files*\n\nSending ${filesToSend.length} file(s) with changes...`);

  const results = [];

  for (const fileType of filesToSend) {
    try {
      // Save to cache first
      const { filePath } = await syncManager.saveFile(fileType);

      // Upload to Telegram
      const fileName = CONFIG.ACCEPTED_FILENAMES.find(f => f.includes(fileType));
      const caption = `Updated: ${fileName}\n${new Date().toLocaleString()}`;

      const uploadResult = await uploadFile(filePath, caption);

      console.log(`✅ Sent: ${fileName}`);

      results.push({
        success: true,
        fileType,
        fileName,
        message_id: uploadResult.message_id
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Failed to send ${fileType}:`, error.message);
      results.push({
        success: false,
        fileType,
        error: error.message
      });
    }
  }

  const successful = results.filter(r => r.success).length;

  await sendMessage(`✅ *Sync Complete!*\n\n📤 Sent ${successful}/${filesToSend.length} file(s)\n\n💾 Save these files to your "Saved Messages" to keep them safe!`);

  return { success: true, sent: successful, results };
}

/**
 * Handle /sync command
 */
async function handleSyncCommand() {
  const syncManager = require('./sync-manager');

  await syncManager.initialize();

  const status = syncManager.getSyncStatus();

  if (!status.loaded) {
    await sendMessage('⚠️ *No Memory Loaded*\n\nPlease send your memory files first to enable syncing.');
    return { success: false, reason: 'not_loaded' };
  }

  if (status.dirty_files.length === 0) {
    await sendMessage('✅ *Already Synced*\n\nNo changes detected. Everything is up to date!');
    return { success: true, changed: false };
  }

  // Run sync cycle
  const syncResult = await syncManager.syncCycle();

  // Send updated files
  await sendUpdatedFiles(status.dirty_files);

  return { success: true, syncResult };
}

/**
 * Handle /backup command
 */
async function handleBackupCommand() {
  const syncManager = require('./sync-manager');

  await syncManager.initialize();

  const status = syncManager.getSyncStatus();

  if (!status.loaded) {
    await sendMessage('⚠️ *No Memory Loaded*\n\nPlease send your memory files first to create a backup.');
    return { success: false, reason: 'not_loaded' };
  }

  await sendMessage('📦 *Creating Backup*\n\nGenerating backup of all your files...');

  // Create backup
  const backup = await syncManager.createBackup();

  // Send all files
  await sendUpdatedFiles(['profile', 'memory', 'contacts', 'habits']);

  await sendMessage(`✅ *Backup Complete!*\n\n📦 Created: ${backup.timestamp}\n📁 Files: ${backup.files.length}\n\n💾 All files sent. Save them to your "Saved Messages"!`);

  return { success: true, backup };
}

/**
 * Handle /status command
 */
async function handleStatusCommand() {
  const syncManager = require('./sync-manager');

  await syncManager.initialize();

  const status = syncManager.getSyncStatus();
  const stats = syncManager.getCacheStats();

  let message = '📊 *Memory Status*\n\n';

  if (status.loaded) {
    message += `✅ Memory loaded\n`;
    message += `📅 Loaded: ${new Date(status.loaded_at).toLocaleString()}\n`;
    message += `⏰ Expires: ${new Date(status.expires_at).toLocaleString()}\n`;
    message += `🔄 Last sync: ${new Date(status.last_sync).toLocaleString()}\n\n`;

    message += `📁 *Files*\n`;
    for (const fileType of status.files_loaded) {
      const fileStats = stats.files[fileType];
      const dirtyIcon = fileStats.dirty ? '📝' : '✅';
      message += `${dirtyIcon} ${fileType}: ${fileStats.size_kb} KB${fileStats.dirty ? ' (has changes)' : ''}\n`;
    }

    if (status.dirty_files.length > 0) {
      message += `\n⚠️ ${status.dirty_files.length} file(s) need syncing\nUse /sync to update`;
    } else {
      message += `\n✅ All files synced`;
    }

  } else {
    message += `❌ No memory loaded\n\n`;
    message += `📥 Send your memory files to get started!`;
  }

  await sendMessage(message);

  return { success: true, status, stats };
}

/**
 * Handle /clear command
 */
async function handleClearCommand() {
  const syncManager = require('./sync-manager');

  const status = syncManager.getSyncStatus();

  if (!status.loaded) {
    await sendMessage('ℹ️ Cache already clear.');
    return { success: true, was_loaded: false };
  }

  syncManager.clearCache();

  await sendMessage(`🗑️ *Cache Cleared*\n\nRAM cache has been cleared.\nYour files on the phone are safe!\n\n📥 Send files again when you want to resume.`);

  return { success: true, was_loaded: true };
}

// Export functions
module.exports = {
  // File operations
  downloadFile,
  uploadFile,
  processIncomingFile,
  processIncomingFiles,
  sendUpdatedFiles,

  // Commands
  handleSyncCommand,
  handleBackupCommand,
  handleStatusCommand,
  handleClearCommand,

  // Utilities
  sendMessage,
  getFileInfo,
  telegramApiRequest,

  // Config
  CONFIG
};

// CLI usage
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    switch (command) {
      case 'sync':
        await handleSyncCommand();
        break;

      case 'backup':
        await handleBackupCommand();
        break;

      case 'status':
        await handleStatusCommand();
        break;

      case 'clear':
        await handleClearCommand();
        break;

      case 'test':
        await sendMessage('🧪 Test message from telegram-file-handler.js');
        break;

      default:
        console.log(`
Usage: node telegram-file-handler.js <command>

Commands:
  sync       Sync dirty files to Telegram
  backup     Create full backup and send to Telegram
  status     Show current status
  clear      Clear RAM cache
  test       Send test message

Examples:
  node telegram-file-handler.js sync
  node telegram-file-handler.js status
        `);
    }
  })().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}
