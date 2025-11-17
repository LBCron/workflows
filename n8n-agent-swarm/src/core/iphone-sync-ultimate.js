/**
 * iPhone Sync Ultimate v2.0
 *
 * Système de synchronisation avancé pour iPhone avec:
 * - Export automatique iCloud Drive
 * - Backup chiffré quotidien
 * - Format optimisé iOS
 * - Restauration facile
 * - Compression intelligente
 * - Sync différentiel
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');
const logger = require('../utils/logger');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class iPhoneSyncUltimate {
  constructor(bot, learningEngine) {
    this.bot = bot;
    this.learningEngine = learningEngine;

    // Chemins
    this.exportsDir = path.join(__dirname, '../../exports/iphone');
    this.backupsDir = path.join(__dirname, '../../backups/iphone');
    this.iCloudPath = this.detectiCloudPath();

    // Configuration
    this.config = {
      autoExportEnabled: false,
      exportSchedule: '0 3 * * *', // 3h du matin
      compressionEnabled: true,
      encryptionEnabled: true,
      maxBackups: 30,
      exportFormats: ['json', 'html', 'markdown']
    };

    // Stats
    this.stats = {
      totalExports: 0,
      totalBackups: 0,
      lastExportDate: null,
      lastExportSize: 0,
      lastSyncDate: null,
      iCloudSyncEnabled: false
    };
  }

  async initialize() {
    // Créer dossiers
    await fs.mkdir(this.exportsDir, { recursive: true });
    await fs.mkdir(this.backupsDir, { recursive: true });

    // Vérifier iCloud
    if (this.iCloudPath) {
      const iCloudBackupDir = path.join(this.iCloudPath, 'AI-Bot-Backups');
      await fs.mkdir(iCloudBackupDir, { recursive: true }).catch(() => {});
      this.stats.iCloudSyncEnabled = true;
      logger.info('✅ iCloud Drive détecté et configuré');
    }

    await this.loadStats();

    logger.info('📱 iPhone Sync initialized');
  }

  detectiCloudPath() {
    if (process.platform !== 'darwin') return null;

    const homedir = require('os').homedir();
    const possiblePaths = [
      path.join(homedir, 'Library/Mobile Documents/com~apple~CloudDocs'),
      path.join(homedir, 'iCloud Drive')
    ];

    for (const p of possiblePaths) {
      try {
        require('fs').accessSync(p);
        return p;
      } catch {}
    }

    return null;
  }

  /**
   * Export complet vers iPhone
   */
  async exportForIPhone(chatId, userId, options = {}) {
    logger.info(`📱 Starting iPhone export for user ${userId}...`);

    const exportOptions = { ...this.config, ...options };

    try {
      // 1. Récupérer toutes les données
      const data = await this.gatherAllData(userId);

      // 2. Créer exports multi-formats
      const exports = await this.createMultiFormatExports(data, exportOptions);

      // 3. Compresser si activé
      if (exportOptions.compressionEnabled) {
        for (const format in exports) {
          exports[format] = await this.compressData(exports[format]);
        }
      }

      // 4. Chiffrer si activé
      if (exportOptions.encryptionEnabled) {
        for (const format in exports) {
          exports[format] = await this.encryptData(exports[format], userId);
        }
      }

      // 5. Sauvegarder localement
      const exportPaths = await this.saveExports(exports, userId);

      // 6. Envoyer via Telegram
      await this.sendExportsToUser(chatId, exportPaths, data);

      // 7. Sync vers iCloud si disponible
      if (this.stats.iCloudSyncEnabled) {
        await this.synciCloud(exportPaths, userId);
      }

      // 8. Mettre à jour stats
      this.stats.totalExports++;
      this.stats.lastExportDate = new Date().toISOString();
      this.stats.lastExportSize = this.calculateTotalSize(exportPaths);
      await this.saveStats();

      logger.info('✅ iPhone export completed successfully');

      return {
        success: true,
        formats: Object.keys(exports),
        totalSize: this.stats.lastExportSize,
        paths: exportPaths
      };

    } catch (error) {
      logger.error('❌ iPhone export failed:', error);
      throw error;
    }
  }

  async gatherAllData(userId) {
    logger.info('📊 Gathering all data...');

    const profile = await this.learningEngine.getUserProfile(userId);
    const insights = await this.learningEngine.getUserInsights(userId);

    const data = {
      metadata: {
        userId,
        exportDate: new Date().toISOString(),
        version: '2.0',
        device: 'iPhone'
      },
      profile: profile || {},
      insights: insights || {},
      conversations: profile?.interactions || [],
      statistics: {
        totalInteractions: profile?.stats?.totalInteractions || 0,
        userSince: profile?.createdAt || new Date().toISOString()
      }
    };

    logger.info(`✅ Gathered ${data.conversations.length} interactions + metadata`);

    return data;
  }

  async createMultiFormatExports(data, options) {
    const exports = {};

    if (options.exportFormats.includes('json')) {
      exports.json = JSON.stringify(data, null, 2);
    }

    if (options.exportFormats.includes('html')) {
      exports.html = await this.generateHTMLExport(data);
    }

    if (options.exportFormats.includes('markdown')) {
      exports.markdown = await this.generateMarkdownExport(data);
    }

    return exports;
  }

  async generateHTMLExport(data) {
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Bot - Export ${data.metadata.exportDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f7;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .section {
      padding: 30px;
      border-bottom: 1px solid #eee;
    }
    .conversation {
      background: #f9f9f9;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 AI Bot Export</h1>
      <p>Export • ${new Date(data.metadata.exportDate).toLocaleString('fr-FR')}</p>
    </div>

    <div class="section">
      <h2>📊 Statistiques</h2>
      <p><strong>${data.conversations.length}</strong> interactions</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return html;
  }

  async generateMarkdownExport(data) {
    let md = `# 🤖 AI Bot Export\n\n`;
    md += `**Date:** ${new Date(data.metadata.exportDate).toLocaleString('fr-FR')}\n\n`;
    md += `## 📊 Statistiques\n\n`;
    md += `- **Interactions:** ${data.conversations.length}\n\n`;

    return md;
  }

  async compressData(data) {
    const buffer = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
    const compressed = await gzip(buffer);

    logger.info(`📦 Compressed: ${buffer.length} → ${compressed.length} bytes`);

    return compressed;
  }

  async encryptData(data, userId) {
    const key = crypto.scryptSync(process.env.MASTER_PASSWORD + userId, 'export-salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
  }

  async saveExports(exports, userId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPaths = {};

    for (const [format, data] of Object.entries(exports)) {
      const filename = `ai-bot-export-${timestamp}.${format}${this.config.compressionEnabled ? '.gz' : ''}${this.config.encryptionEnabled ? '.enc' : ''}`;
      const filepath = path.join(this.exportsDir, filename);

      await fs.writeFile(filepath, data);

      exportPaths[format] = filepath;

      logger.info(`✅ Saved ${format} export: ${filepath}`);
    }

    return exportPaths;
  }

  async sendExportsToUser(chatId, exportPaths, data) {
    await this.bot.sendMessage(chatId, `
📱 **Export iPhone Complet**

✅ Export terminé !

**Contenu:**
📊 ${data.conversations.length} interactions

**Formats:** ${Object.keys(exportPaths).join(', ')}

📥 Envoi des fichiers...
    `, { parse_mode: 'Markdown' });

    for (const [format, filepath] of Object.entries(exportPaths)) {
      try {
        await this.bot.sendDocument(chatId, filepath, {
          caption: `📄 Export ${format.toUpperCase()}`
        });
      } catch (error) {
        logger.error(`Failed to send ${format}:`, error);
      }
    }
  }

  async synciCloud(exportPaths, userId) {
    if (!this.iCloudPath) return;

    try {
      const iCloudBackupDir = path.join(this.iCloudPath, 'AI-Bot-Backups');

      for (const [format, srcPath] of Object.entries(exportPaths)) {
        const filename = path.basename(srcPath);
        const destPath = path.join(iCloudBackupDir, filename);

        await fs.copyFile(srcPath, destPath);

        logger.info(`☁️ Synced to iCloud: ${filename}`);
      }

      this.stats.lastSyncDate = new Date().toISOString();
      await this.saveStats();

      logger.info('✅ iCloud sync completed');

    } catch (error) {
      logger.error('❌ iCloud sync failed:', error);
    }
  }

  calculateTotalSize(exportPaths) {
    let total = 0;
    for (const filepath of Object.values(exportPaths)) {
      try {
        const stats = require('fs').statSync(filepath);
        total += stats.size;
      } catch {}
    }
    return total;
  }

  async loadStats() {
    try {
      const statsPath = path.join(this.exportsDir, 'sync-stats.json');
      const data = await fs.readFile(statsPath, 'utf8');
      this.stats = { ...this.stats, ...JSON.parse(data) };
    } catch {}
  }

  async saveStats() {
    const statsPath = path.join(this.exportsDir, 'sync-stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2), 'utf8');
  }

  getStats() {
    return {
      ...this.stats,
      iCloudPath: this.iCloudPath
    };
  }
}

module.exports = iPhoneSyncUltimate;
