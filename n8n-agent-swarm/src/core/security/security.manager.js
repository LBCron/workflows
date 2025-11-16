/**
 * 🔒 SECURITY MANAGER v4.0
 *
 * Système de sécurité complet
 */

const logger = require('../logger/logger');
const crypto = require('crypto');

class SecurityManager {
  constructor() {
    this.allowedUsers = new Set();
    this.rateLimits = new Map();
    this.blockedIPs = new Set();

    logger.info('🔒 Security Manager initialisé');
  }

  /**
   * Vérifier les permissions utilisateur
   */
  checkPermissions(userId, action) {
    if (this.blockedIPs.has(userId)) {
      logger.warn('🚫 Utilisateur bloqué tenté un accès', { userId, action });
      throw new Error('Accès refusé: utilisateur bloqué');
    }

    return true;
  }

  /**
   * Rate limiting
   */
  checkRateLimit(userId, limit = 10, window = 60000) {
    const now = Date.now();
    const userRequests = this.rateLimits.get(userId) || [];

    const recentRequests = userRequests.filter(time => now - time < window);

    if (recentRequests.length >= limit) {
      logger.warn('⚠️ Rate limit dépassé', { userId, count: recentRequests.length });
      throw new Error('Trop de requêtes. Attendez un peu.');
    }

    recentRequests.push(now);
    this.rateLimits.set(userId, recentRequests);

    return true;
  }

  /**
   * Valider les entrées
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    // Supprimer les caractères dangereux
    let sanitized = input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    return sanitized;
  }

  /**
   * Chiffrement de données sensibles
   */
  encrypt(text, key) {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Déchiffrement
   */
  decrypt(text, key) {
    const algorithm = 'aes-256-cbc';
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }

  /**
   * Générer un token sécurisé
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hasher un mot de passe
   */
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    return { salt, hash };
  }

  /**
   * Vérifier un mot de passe
   */
  verifyPassword(password, hash, salt) {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  /**
   * Logger une activité suspecte
   */
  logSuspiciousActivity(userId, activity) {
    logger.warn('🚨 Activité suspecte détectée', {
      userId,
      activity,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Bloquer un utilisateur
   */
  blockUser(userId, reason) {
    this.blockedIPs.add(userId);
    logger.info('🚫 Utilisateur bloqué', { userId, reason });
  }
}

module.exports = new SecurityManager();
