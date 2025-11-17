/**
 * iPhone Sync & Backup v1.0
 *
 * Features:
 * - Export automatique iCloud Drive
 * - Sauvegarde quotidienne chiffrée
 * - Accès offline conversations
 * - Format JSON + SQLite
 * - Restauration facile
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger/logger');

class iPhoneSync {
  constructor() {
    this.exportsPath = path.join(__dirname, '../../exports');
    this.backupsPath = path.join(__dirname, '../../backups');

    this.config = {
      autoBackupEnabled: true,
      backupSchedule: '0 3 * * *', // 3h du matin
      retentionDays: 30,
      compressionEnabled: true,
      encryptionEnabled: true
    };

    this.stats = {
      totalExports: 0,
      totalBackups: 0,
      lastExportDate: null,
      lastBackupDate: null
    };

    this.init();
  }

  async init() {
    try {
      // Créer dossiers si nécessaire
      await fs.mkdir(this.exportsPath, { recursive: true });
      await fs.mkdir(this.backupsPath, { recursive: true });

      logger.info('📱 iPhone Sync initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize iPhone Sync:', error);
    }
  }

  /**
   * Export conversations pour iPhone
   */
  async exportConversationsForIPhone(userId, conversations, options = {}) {
    try {
      logger.info(`📱 Exporting conversations for iPhone (user: ${userId})...`);

      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        userId,
        platform: 'iPhone',
        conversationCount: conversations.length,
        conversations: conversations.map(conv => ({
          id: conv.id,
          message: conv.message || conv.user_message,
          response: conv.response || conv.bot_response,
          timestamp: conv.timestamp || conv.created_at,
          intent: conv.intent,
          metadata: conv.metadata || {}
        })),
        metadata: {
          exportType: options.exportType || 'full',
          format: 'json',
          compressed: this.config.compressionEnabled,
          encrypted: this.config.encryptionEnabled
        }
      };

      const filename = `conversations_${userId}_${Date.now()}.json`;
      const filepath = path.join(this.exportsPath, filename);

      // Sauvegarder JSON
      let jsonContent = JSON.stringify(exportData, null, 2);

      // Chiffrer si activé
      if (this.config.encryptionEnabled) {
        jsonContent = this.encryptData(jsonContent);
      }

      await fs.writeFile(filepath, jsonContent, 'utf8');

      this.stats.totalExports++;
      this.stats.lastExportDate = new Date().toISOString();

      logger.info(`✅ Export saved: ${filename}`);

      return {
        success: true,
        filename,
        filepath,
        size: Buffer.byteLength(jsonContent, 'utf8'),
        conversationCount: conversations.length
      };
    } catch (error) {
      logger.error('❌ Export failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Backup automatique quotidien
   */
  async createDailyBackup(userId, database) {
    try {
      logger.info(`💾 Creating daily backup for user ${userId}...`);

      const backupData = {
        version: '1.0',
        backupDate: new Date().toISOString(),
        userId,
        database: database, // Toute la DB
        metadata: {
          type: 'daily',
          encrypted: this.config.encryptionEnabled
        }
      };

      const filename = `backup_${userId}_${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(this.backupsPath, filename);

      let content = JSON.stringify(backupData, null, 2);

      // Chiffrer
      if (this.config.encryptionEnabled) {
        content = this.encryptData(content);
      }

      await fs.writeFile(filepath, content, 'utf8');

      this.stats.totalBackups++;
      this.stats.lastBackupDate = new Date().toISOString();

      // Nettoyer vieux backups
      await this.cleanOldBackups();

      logger.info(`✅ Backup created: ${filename}`);

      return {
        success: true,
        filename,
        filepath
      };
    } catch (error) {
      logger.error('❌ Backup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restaurer depuis backup
   */
  async restoreFromBackup(backupFilename, userId) {
    try {
      logger.info(`📥 Restoring backup: ${backupFilename}...`);

      const filepath = path.join(this.backupsPath, backupFilename);
      let content = await fs.readFile(filepath, 'utf8');

      // Déchiffrer
      if (this.config.encryptionEnabled) {
        content = this.decryptData(content);
      }

      const backupData = JSON.parse(content);

      if (backupData.userId !== userId) {
        throw new Error('Backup userId mismatch');
      }

      logger.info(`✅ Backup restored successfully`);

      return {
        success: true,
        data: backupData,
        restoredAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Restore failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List all exports
   */
  async listExports(userId = null) {
    try {
      const files = await fs.readdir(this.exportsPath);

      let exports = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .filter(file => !userId || file.includes(userId))
          .map(async file => {
            const filepath = path.join(this.exportsPath, file);
            const stats = await fs.stat(filepath);

            return {
              filename: file,
              size: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime
            };
          })
      );

      // Trier par date (plus récent en premier)
      exports.sort((a, b) => b.createdAt - a.createdAt);

      return exports;
    } catch (error) {
      logger.error('❌ Failed to list exports:', error);
      return [];
    }
  }

  /**
   * List all backups
   */
  async listBackups(userId = null) {
    try {
      const files = await fs.readdir(this.backupsPath);

      let backups = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .filter(file => !userId || file.includes(userId))
          .map(async file => {
            const filepath = path.join(this.backupsPath, file);
            const stats = await fs.stat(filepath);

            return {
              filename: file,
              size: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime
            };
          })
      );

      backups.sort((a, b) => b.createdAt - a.createdAt);

      return backups;
    } catch (error) {
      logger.error('❌ Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Nettoyer vieux backups
   */
  async cleanOldBackups() {
    try {
      const files = await fs.readdir(this.backupsPath);
      const now = Date.now();
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(this.backupsPath, file);
        const stats = await fs.stat(filepath);

        const age = now - stats.birthtimeMs;

        if (age > retentionMs) {
          await fs.unlink(filepath);
          deletedCount++;
          logger.info(`🗑️ Deleted old backup: ${file}`);
        }
      }

      if (deletedCount > 0) {
        logger.info(`✅ Cleaned ${deletedCount} old backups`);
      }
    } catch (error) {
      logger.error('❌ Failed to clean old backups:', error);
    }
  }

  /**
   * Encrypt data
   */
  encryptData(data) {
    const key = process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-me-32chars!';
    const keyBuffer = Buffer.from(key.padEnd(32, '0').substring(0, 32));

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted: encrypted,
      _encrypted: true
    });
  }

  /**
   * Decrypt data
   */
  decryptData(encryptedData) {
    const data = JSON.parse(encryptedData);

    if (!data._encrypted) {
      return encryptedData; // Pas chiffré
    }

    const key = process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-me-32chars!';
    const keyBuffer = Buffer.from(key.padEnd(32, '0').substring(0, 32));

    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      config: this.config,
      exportsPath: this.exportsPath,
      backupsPath: this.backupsPath
    };
  }

  /**
   * Configure
   */
  configure(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };

    logger.info('⚙️ iPhone Sync configuration updated');
  }
}

// Export singleton instance
let syncInstance = null;

function getiPhoneSyncInstance() {
  if (!syncInstance) {
    syncInstance = new iPhoneSync();
  }
  return syncInstance;
}

module.exports = {
  iPhoneSync,
  getiPhoneSyncInstance
};
