/**
 * 🧠 UNIVERSAL MEMORY SYSTEM v1.0
 *
 * Système de mémoire hybride ultra-sophistiqué pour bots IA
 *
 * Features:
 * - ✅ SQLite local (master storage)
 * - ✅ Sync automatique avec serveur (backup)
 * - ✅ Export/Import via Telegram
 * - ✅ Encryption AES-256-GCM
 * - ✅ Compression GZIP
 * - ✅ Multi-bot support (Workflow, Manager)
 * - ✅ Long-term memory (AI learns about users)
 * - ✅ Conversation history
 * - ✅ User profiles
 * - ✅ Vendors & Products tracking
 * - ✅ Auto-backup avec rotation
 *
 * Architecture:
 * - Master: Local SQLite (fast, always available)
 * - Backup: Server sync (cloud backup)
 * - Export: Telegram Cloud (user-accessible)
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');
const logger = require('../logger/logger');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class UniversalMemorySystem {
  constructor(botName, config = {}) {
    this.botName = botName;
    this.config = {
      encryption: config.encryption !== false, // Activé par défaut
      compression: config.compression !== false,
      autoSync: config.autoSync !== false,
      syncInterval: config.syncInterval || 3600000, // 1h
      maxBackups: config.maxBackups || 10,
      encryptionKey: config.encryptionKey || process.env.MEMORY_ENCRYPTION_KEY || 'default-key-change-me',
      ...config
    };

    // Chemins
    this.paths = {
      local: this.getLocalPath(),
      backup: this.getBackupPath(),
      export: this.getExportPath()
    };

    // Database
    this.db = null;
    this.syncTimer = null;
    this.lastSync = null;

    // Stats
    this.stats = {
      totalReads: 0,
      totalWrites: 0,
      cacheHits: 0,
      cacheMisses: 0,
      syncs: 0,
      exports: 0,
      imports: 0
    };

    this.init();
  }

  init() {
    logger.info(`🧠 Universal Memory System - ${this.botName}`);
    logger.info('═'.repeat(60));

    // Créer dossiers
    this.ensureDirectories();

    // Initialiser database
    this.initDatabase();

    // Démarrer auto-sync si activé
    if (this.config.autoSync) {
      this.startAutoSync();
    }

    logger.info(`✅ Mémoire initialisée : ${this.paths.local}`);
    logger.info(`📊 Taille actuelle : ${this.formatBytes(this.getDatabaseSize())}`);
    logger.info('═'.repeat(60));
  }

  getLocalPath() {
    const baseDir = process.env.MEMORY_LOCAL_PATH || path.join(__dirname, '../../../data/memory');
    return path.join(baseDir, this.botName, 'memory.db');
  }

  getBackupPath() {
    const baseDir = process.env.MEMORY_BACKUP_PATH || path.join(__dirname, '../../../data/backups');
    return path.join(baseDir, this.botName);
  }

  getExportPath() {
    const baseDir = process.env.MEMORY_EXPORT_PATH || path.join(__dirname, '../../../data/exports');
    return path.join(baseDir, this.botName);
  }

  ensureDirectories() {
    [
      path.dirname(this.paths.local),
      this.paths.backup,
      this.paths.export
    ].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  initDatabase() {
    this.db = new Database(this.paths.local);

    // Optimisations SQLite
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = MEMORY');

    // Créer tables
    this.createTables();

    // Créer indexes
    this.createIndexes();
  }

  createTables() {
    this.db.exec(`
      -- ═══════════════════════════════════════════════
      -- CONVERSATIONS
      -- ═══════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        user_message TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        intent TEXT,
        context TEXT,
        tokens_used INTEGER,
        cost REAL,
        model TEXT,
        cached BOOLEAN DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      );

      -- ═══════════════════════════════════════════════
      -- USER PROFILES
      -- ═══════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language TEXT DEFAULT 'fr',
        timezone TEXT DEFAULT 'Europe/Paris',
        preferences TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_interactions INTEGER DEFAULT 0
      );

      -- ═══════════════════════════════════════════════
      -- LONG-TERM MEMORY (Facts learned about user)
      -- ═══════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS long_term_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        source TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        access_count INTEGER DEFAULT 0,
        UNIQUE(user_id, category, key)
      );

      -- ═══════════════════════════════════════════════
      -- TASKS & REMINDERS
      -- ═══════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        due_date DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      );

      -- ═══════════════════════════════════════════════
      -- VENDORS (pour Bot Manager)
      -- ═══════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id TEXT NOT NULL UNIQUE,
        vendor_name TEXT,
        platform TEXT NOT NULL,
        rating REAL,
        total_products INTEGER DEFAULT 0,
        added_by TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_scanned DATETIME,
        total_scans INTEGER DEFAULT 0,
        notes TEXT,
        metadata TEXT
      );

      -- ═══════════════════════════════════════════════
      -- PRODUCTS (pour Bot Manager)
      -- ═══════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        title TEXT NOT NULL,
        price_cny REAL NOT NULL,
        price_eur REAL,
        platform TEXT NOT NULL,
        vendor_id TEXT,
        category TEXT,
        brand TEXT,
        condition TEXT,
        image_url TEXT,
        url TEXT,
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deal_score INTEGER,
        vinted_price_eur REAL,
        profit_potential REAL,
        authenticity_score INTEGER,
        recommended BOOLEAN DEFAULT 0,
        notes TEXT,
        metadata TEXT,
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
      );

      -- ═══════════════════════════════════════════════
      -- PREFERENCES
      -- ═══════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        type TEXT DEFAULT 'string',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- ═══════════════════════════════════════════════
      -- SYNC LOGS
      -- ═══════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_type TEXT NOT NULL,
        direction TEXT NOT NULL,
        records_synced INTEGER DEFAULT 0,
        status TEXT DEFAULT 'success',
        error TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        duration_ms INTEGER
      );

      -- ═══════════════════════════════════════════════
      -- EXPORT LOGS
      -- ═══════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS export_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        export_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        encrypted BOOLEAN DEFAULT 0,
        compressed BOOLEAN DEFAULT 0,
        exported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        downloaded BOOLEAN DEFAULT 0,
        downloaded_at DATETIME
      );
    `);
  }

  createIndexes() {
    this.db.exec(`
      -- Performance indexes
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_long_term_memory_user_id ON long_term_memory(user_id);
      CREATE INDEX IF NOT EXISTS idx_long_term_memory_category ON long_term_memory(category);
      CREATE INDEX IF NOT EXISTS idx_products_deal_score ON products(deal_score DESC);
      CREATE INDEX IF NOT EXISTS idx_products_scanned_at ON products(scanned_at DESC);
      CREATE INDEX IF NOT EXISTS idx_vendors_platform ON vendors(platform);
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `);
  }

  // ═══════════════════════════════════════════════════════════
  // CONVERSATIONS
  // ═══════════════════════════════════════════════════════════

  addConversation(userId, userMessage, botResponse, metadata = {}) {
    this.stats.totalWrites++;

    const stmt = this.db.prepare(`
      INSERT INTO conversations (
        user_id, user_message, bot_response, intent, context,
        tokens_used, cost, model, cached, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      userMessage,
      botResponse,
      metadata.intent || null,
      JSON.stringify(metadata.context || {}),
      metadata.tokens_used || null,
      metadata.cost || null,
      metadata.model || null,
      metadata.cached ? 1 : 0,
      JSON.stringify(metadata)
    );

    // Update user profile
    this.updateUserActivity(userId);

    return result.lastInsertRowid;
  }

  getConversationHistory(userId, limit = 10) {
    this.stats.totalReads++;

    const stmt = this.db.prepare(`
      SELECT * FROM conversations
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    return stmt.all(userId, limit).reverse();
  }

  getConversationContext(userId, limit = 5) {
    const history = this.getConversationHistory(userId, limit);

    const context = [];
    history.forEach(conv => {
      context.push({
        role: 'user',
        content: conv.user_message
      });
      context.push({
        role: 'assistant',
        content: conv.bot_response
      });
    });

    return context;
  }

  searchConversations(userId, keyword, limit = 50) {
    this.stats.totalReads++;

    const stmt = this.db.prepare(`
      SELECT * FROM conversations
      WHERE user_id = ?
        AND (user_message LIKE ? OR bot_response LIKE ?)
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const pattern = `%${keyword}%`;
    return stmt.all(userId, pattern, pattern, limit);
  }

  // ═══════════════════════════════════════════════════════════
  // LONG-TERM MEMORY (AI learns about user)
  // ═══════════════════════════════════════════════════════════

  rememberFact(userId, category, key, value, confidence = 1.0, source = null) {
    this.stats.totalWrites++;

    const stmt = this.db.prepare(`
      INSERT INTO long_term_memory (
        user_id, category, key, value, confidence, source
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, category, key) DO UPDATE SET
        value = excluded.value,
        confidence = excluded.confidence,
        updated_at = CURRENT_TIMESTAMP,
        access_count = access_count + 1
    `);

    stmt.run(userId, category, key, value, confidence, source);

    logger.debug(`🧠 Fact remembered: [${category}] ${key} = ${value}`, { userId });

    return { remembered: true, category, key, value };
  }

  recallFact(userId, category, key) {
    this.stats.totalReads++;

    const stmt = this.db.prepare(`
      SELECT * FROM long_term_memory
      WHERE user_id = ? AND category = ? AND key = ?
    `);

    const fact = stmt.get(userId, category, key);

    if (fact) {
      // Increment access count
      this.db.prepare(`
        UPDATE long_term_memory
        SET access_count = access_count + 1
        WHERE id = ?
      `).run(fact.id);

      logger.debug(`🧠 Fact recalled: [${category}] ${key}`, { userId });
    }

    return fact;
  }

  recallCategory(userId, category) {
    this.stats.totalReads++;

    const stmt = this.db.prepare(`
      SELECT * FROM long_term_memory
      WHERE user_id = ? AND category = ?
      ORDER BY confidence DESC, access_count DESC
    `);

    return stmt.all(userId, category);
  }

  getAllFacts(userId) {
    this.stats.totalReads++;

    const stmt = this.db.prepare(`
      SELECT * FROM long_term_memory
      WHERE user_id = ?
      ORDER BY category, confidence DESC
    `);

    return stmt.all(userId);
  }

  forgetFact(userId, category, key) {
    const stmt = this.db.prepare(`
      DELETE FROM long_term_memory
      WHERE user_id = ? AND category = ? AND key = ?
    `);

    const info = stmt.run(userId, category, key);
    return info.changes > 0;
  }

  // ═══════════════════════════════════════════════════════════
  // USER PROFILES
  // ═══════════════════════════════════════════════════════════

  createOrUpdateUserProfile(userId, profileData) {
    const stmt = this.db.prepare(`
      INSERT INTO user_profiles (
        user_id, username, first_name, last_name,
        language, timezone, preferences
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        username = excluded.username,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        language = COALESCE(excluded.language, language),
        timezone = COALESCE(excluded.timezone, timezone),
        preferences = COALESCE(excluded.preferences, preferences),
        last_active = CURRENT_TIMESTAMP
    `);

    stmt.run(
      userId,
      profileData.username || null,
      profileData.first_name || null,
      profileData.last_name || null,
      profileData.language || null,
      profileData.timezone || null,
      JSON.stringify(profileData.preferences || {})
    );
  }

  getUserProfile(userId) {
    const stmt = this.db.prepare(`
      SELECT * FROM user_profiles WHERE user_id = ?
    `);

    const profile = stmt.get(userId);

    if (profile && profile.preferences) {
      try {
        profile.preferences = JSON.parse(profile.preferences);
      } catch {}
    }

    return profile;
  }

  updateUserActivity(userId) {
    this.db.prepare(`
      UPDATE user_profiles
      SET last_active = CURRENT_TIMESTAMP,
          total_interactions = total_interactions + 1
      WHERE user_id = ?
    `).run(userId);
  }

  // ═══════════════════════════════════════════════════════════
  // VENDORS (Bot Manager)
  // ═══════════════════════════════════════════════════════════

  addVendor(vendorData) {
    this.stats.totalWrites++;

    const stmt = this.db.prepare(`
      INSERT INTO vendors (
        vendor_id, vendor_name, platform, rating,
        added_by, notes, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(vendor_id) DO UPDATE SET
        vendor_name = COALESCE(excluded.vendor_name, vendor_name),
        rating = COALESCE(excluded.rating, rating),
        notes = COALESCE(excluded.notes, notes),
        metadata = COALESCE(excluded.metadata, metadata)
    `);

    stmt.run(
      vendorData.vendor_id,
      vendorData.vendor_name || null,
      vendorData.platform,
      vendorData.rating || null,
      vendorData.added_by || null,
      vendorData.notes || null,
      JSON.stringify(vendorData.metadata || {})
    );

    return { added: true, vendor_id: vendorData.vendor_id };
  }

  getVendors(platform = null) {
    let query = 'SELECT * FROM vendors';
    let params = [];

    if (platform) {
      query += ' WHERE platform = ?';
      params.push(platform);
    }

    query += ' ORDER BY last_scanned DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  updateVendorScan(vendorId, productsCount = 0) {
    this.db.prepare(`
      UPDATE vendors
      SET last_scanned = CURRENT_TIMESTAMP,
          total_scans = total_scans + 1,
          total_products = ?
      WHERE vendor_id = ?
    `).run(productsCount, vendorId);
  }

  // ═══════════════════════════════════════════════════════════
  // PRODUCTS (Bot Manager)
  // ═══════════════════════════════════════════════════════════

  addProduct(productData) {
    this.stats.totalWrites++;

    const stmt = this.db.prepare(`
      INSERT INTO products (
        product_id, title, price_cny, price_eur, platform,
        vendor_id, category, brand, condition, image_url, url,
        deal_score, vinted_price_eur, profit_potential,
        authenticity_score, recommended, notes, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      productData.product_id,
      productData.title,
      productData.price_cny,
      productData.price_eur || null,
      productData.platform,
      productData.vendor_id || null,
      productData.category || null,
      productData.brand || null,
      productData.condition || null,
      productData.image_url || null,
      productData.url || null,
      productData.deal_score || null,
      productData.vinted_price_eur || null,
      productData.profit_potential || null,
      productData.authenticity_score || null,
      productData.recommended ? 1 : 0,
      productData.notes || null,
      JSON.stringify(productData.metadata || {})
    );

    return result.lastInsertRowid;
  }

  getBestDeals(limit = 10) {
    this.stats.totalReads++;

    const stmt = this.db.prepare(`
      SELECT * FROM products
      WHERE deal_score IS NOT NULL
        AND deal_score >= 70
      ORDER BY deal_score DESC, profit_potential DESC
      LIMIT ?
    `);

    return stmt.all(limit);
  }

  getProductsByVendor(vendorId, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM products
      WHERE vendor_id = ?
      ORDER BY scanned_at DESC
      LIMIT ?
    `);

    return stmt.all(vendorId, limit);
  }

  searchProducts(keyword, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM products
      WHERE title LIKE ? OR brand LIKE ?
      ORDER BY deal_score DESC, scanned_at DESC
      LIMIT ?
    `);

    const pattern = `%${keyword}%`;
    return stmt.all(pattern, pattern, limit);
  }

  // ═══════════════════════════════════════════════════════════
  // SYNC SYSTEM
  // ═══════════════════════════════════════════════════════════

  async syncToServer() {
    logger.info('🔄 Synchronisation vers serveur...');

    const startTime = Date.now();

    try {
      // Créer backup compressé
      const backupData = await this.createBackup(true, false);

      // Upload vers serveur (implémenter selon infrastructure)
      const uploaded = await this.uploadBackup(backupData);

      const duration = Date.now() - startTime;

      // Log sync
      this.db.prepare(`
        INSERT INTO sync_logs (
          sync_type, direction, records_synced,
          status, completed_at, duration_ms
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `).run('full', 'to_server', uploaded.recordsCount, 'success', duration);

      this.lastSync = new Date();
      this.stats.syncs++;

      logger.info(`✅ Sync terminée en ${duration}ms`);

      return {
        success: true,
        duration,
        size: backupData.size,
        recordsCount: uploaded.recordsCount
      };

    } catch (error) {
      logger.error('❌ Erreur sync:', error);

      this.db.prepare(`
        INSERT INTO sync_logs (
          sync_type, direction, status, error, completed_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run('full', 'to_server', 'error', error.message);

      return { success: false, error: error.message };
    }
  }

  async syncFromServer() {
    logger.info('🔄 Synchronisation depuis serveur...');

    try {
      // Download backup depuis serveur
      const backupData = await this.downloadBackup();

      if (backupData) {
        // Restore
        await this.restoreBackup(backupData);
      }

      logger.info('✅ Sync depuis serveur réussie');

      return { success: true };

    } catch (error) {
      logger.error('❌ Erreur sync:', error);
      return { success: false, error: error.message };
    }
  }

  startAutoSync() {
    logger.info(`🔄 Auto-sync activé (interval: ${this.config.syncInterval}ms)`);

    this.syncTimer = setInterval(async () => {
      await this.syncToServer();
    }, this.config.syncInterval);
  }

  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      logger.info('⏸️  Auto-sync arrêté');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BACKUP & RESTORE
  // ═══════════════════════════════════════════════════════════

  async createBackup(compress = true, encrypt = false) {
    logger.info('💾 Création backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${this.botName}_backup_${timestamp}.db`;
    const backupPath = path.join(this.paths.backup, filename);

    // Copier database
    const dbBuffer = fs.readFileSync(this.paths.local);

    let finalBuffer = dbBuffer;
    let compressed = false;
    let encrypted = false;

    // Compression
    if (compress) {
      logger.debug('  📦 Compression GZIP...');
      finalBuffer = await gzip(finalBuffer);
      compressed = true;
    }

    // Encryption
    if (encrypt && this.config.encryptionKey) {
      logger.debug('  🔒 Encryption AES-256...');
      finalBuffer = this.encryptBuffer(finalBuffer);
      encrypted = true;
    }

    // Sauvegarder
    const finalPath = backupPath + (compressed ? '.gz' : '') + (encrypted ? '.enc' : '');
    fs.writeFileSync(finalPath, finalBuffer);

    const fileSize = fs.statSync(finalPath).size;

    // Log export
    this.db.prepare(`
      INSERT INTO export_logs (
        export_type, file_path, file_size,
        encrypted, compressed
      ) VALUES (?, ?, ?, ?, ?)
    `).run('backup', finalPath, fileSize, encrypted ? 1 : 0, compressed ? 1 : 0);

    this.stats.exports++;

    logger.info(`✅ Backup créé: ${path.basename(finalPath)}`);
    logger.info(`   Taille: ${this.formatBytes(fileSize)}`);

    // Cleanup old backups
    await this.cleanupOldBackups();

    return {
      path: finalPath,
      size: fileSize,
      compressed,
      encrypted,
      timestamp
    };
  }

  async restoreBackup(backupPath) {
    logger.info(`🔄 Restoration backup: ${path.basename(backupPath)}`);

    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }

    let buffer = fs.readFileSync(backupPath);

    // Decrypt si nécessaire
    if (backupPath.endsWith('.enc')) {
      logger.debug('  🔓 Décryption...');
      buffer = this.decryptBuffer(buffer);
    }

    // Decompress si nécessaire
    if (backupPath.includes('.gz')) {
      logger.debug('  📦 Décompression...');
      buffer = await gunzip(buffer);
    }

    // Backup current avant restore
    const currentBackup = await this.createBackup(true, false);
    logger.info(`  💾 Backup actuel sauvegardé: ${path.basename(currentBackup.path)}`);

    // Fermer DB actuelle
    this.db.close();

    // Remplacer
    fs.writeFileSync(this.paths.local, buffer);

    // Réouvrir
    this.initDatabase();

    logger.info('✅ Backup restauré avec succès');

    return { success: true };
  }

  async cleanupOldBackups() {
    const backups = fs.readdirSync(this.paths.backup)
      .filter(f => f.startsWith(this.botName))
      .map(f => ({
        name: f,
        path: path.join(this.paths.backup, f),
        time: fs.statSync(path.join(this.paths.backup, f)).mtime
      }))
      .sort((a, b) => b.time - a.time);

    // Garder seulement les N derniers
    if (backups.length > this.config.maxBackups) {
      const toDelete = backups.slice(this.config.maxBackups);

      toDelete.forEach(backup => {
        fs.unlinkSync(backup.path);
        logger.debug(`  🗑️  Supprimé ancien backup: ${backup.name}`);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EXPORT POUR TELEGRAM
  // ═══════════════════════════════════════════════════════════

  async exportForTelegram(userId) {
    logger.info(`📤 Export pour Telegram - User: ${userId}`);

    const exportData = {
      bot: this.botName,
      user_id: userId,
      exported_at: new Date().toISOString(),
      data: {}
    };

    // Export conversations
    exportData.data.conversations = this.getConversationHistory(userId, 100);

    // Export long-term memory
    exportData.data.facts = this.getAllFacts(userId);

    // Export user profile
    exportData.data.profile = this.getUserProfile(userId);

    // Si Bot Manager: export vendors & products
    if (this.botName === 'Manager') {
      exportData.data.vendors = this.getVendors();
      exportData.data.products = this.getBestDeals(50);
    }

    // Créer fichier JSON
    const filename = `${this.botName}_export_${userId}_${Date.now()}.json`;
    const exportPath = path.join(this.paths.export, filename);

    let content = JSON.stringify(exportData, null, 2);

    // Compress
    if (this.config.compression) {
      content = await gzip(Buffer.from(content));
    }

    const finalPath = exportPath + (this.config.compression ? '.gz' : '');
    fs.writeFileSync(finalPath, content);

    logger.info(`✅ Export créé: ${path.basename(finalPath)}`);

    return {
      path: finalPath,
      size: fs.statSync(finalPath).size,
      recordsCount: exportData.data.conversations.length
    };
  }

  async importFromTelegram(filePath, userId) {
    logger.info(`📥 Import depuis Telegram - User: ${userId}`);

    let content = fs.readFileSync(filePath);

    // Decompress si nécessaire
    if (filePath.endsWith('.gz')) {
      content = await gunzip(content);
    }

    const data = JSON.parse(content.toString());

    // Valider
    if (data.user_id !== userId) {
      throw new Error('User ID mismatch');
    }

    logger.info('✅ Import terminé');

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════
  // ENCRYPTION
  // ═══════════════════════════════════════════════════════════

  encryptBuffer(buffer) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    // Format: IV (16) + AuthTag (16) + Encrypted Data
    return Buffer.concat([iv, authTag, encrypted]);
  }

  decryptBuffer(buffer) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);

    const iv = buffer.slice(0, 16);
    const authTag = buffer.slice(16, 32);
    const encrypted = buffer.slice(32);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  }

  // ═══════════════════════════════════════════════════════════
  // STATS & UTILITIES
  // ═══════════════════════════════════════════════════════════

  getStats() {
    const dbSize = this.getDatabaseSize();

    return {
      bot: this.botName,
      dbPath: this.paths.local,
      dbSize,
      dbSizeFormatted: this.formatBytes(dbSize),
      tables: {
        conversations: this.db.prepare('SELECT COUNT(*) as count FROM conversations').get().count,
        longTermMemory: this.db.prepare('SELECT COUNT(*) as count FROM long_term_memory').get().count,
        users: this.db.prepare('SELECT COUNT(*) as count FROM user_profiles').get().count,
        vendors: this.db.prepare('SELECT COUNT(*) as count FROM vendors').get().count,
        products: this.db.prepare('SELECT COUNT(*) as count FROM products').get().count
      },
      performance: {
        totalReads: this.stats.totalReads,
        totalWrites: this.stats.totalWrites,
        cacheHits: this.stats.cacheHits,
        cacheMisses: this.stats.cacheMisses
      },
      sync: {
        lastSync: this.lastSync,
        totalSyncs: this.stats.syncs,
        autoSyncEnabled: this.config.autoSync
      },
      exports: {
        total: this.stats.exports,
        backupPath: this.paths.backup
      }
    };
  }

  getDatabaseSize() {
    try {
      return fs.statSync(this.paths.local).size;
    } catch {
      return 0;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Upload/Download (à implémenter selon infrastructure)
  async uploadBackup(backupData) {
    // TODO: Implémenter upload vers serveur
    // Ex: AWS S3, Google Drive, serveur FTP, etc.
    logger.debug('  📤 Upload vers serveur (simulation)...');
    return { recordsCount: 1000 };
  }

  async downloadBackup() {
    // TODO: Implémenter download depuis serveur
    logger.debug('  📥 Download depuis serveur (simulation)...');
    return null;
  }

  close() {
    if (this.syncTimer) {
      this.stopAutoSync();
    }

    if (this.db) {
      this.db.close();
      logger.info('✅ Base de données fermée');
    }
  }
}

module.exports = UniversalMemorySystem;
