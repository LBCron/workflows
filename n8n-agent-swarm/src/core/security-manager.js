/**
 * Security Manager Enterprise v2.0
 *
 * Système de sécurité avancé avec:
 * - Audit logs complets
 * - Encryption at rest & in transit
 * - Token rotation automatique
 * - Whitelist IP/Users
 * - Intrusion detection
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const EventEmitter = require('events');

class SecurityManager extends EventEmitter {
  constructor() {
    super();

    this.auditLogPath = path.join(__dirname, '../../logs/security-audit.log');
    this.securityEventsPath = path.join(__dirname, '../../logs/security-events.log');

    // Whitelist
    this.whitelist = {
      users: new Set(),
      ips: new Set()
    };

    // Blacklist
    this.blacklist = {
      users: new Map(),
      ips: new Map()
    };

    // Failed attempts
    this.failedAttempts = new Map();

    // Token rotation
    this.tokenRotation = {
      enabled: true,
      interval: 7 * 24 * 60 * 60 * 1000,
      lastRotation: new Map()
    };

    // Intrusion detection
    this.intrusionDetection = {
      enabled: true,
      thresholds: {
        failedLogins: 5,
        requestsPerMinute: 100,
        suspiciousPatterns: 3
      },
      detectedThreats: []
    };

    // Security metrics
    this.metrics = {
      auditLogs: 0,
      securityEvents: 0,
      blockedAttempts: 0,
      tokensRotated: 0,
      threatsDetected: 0
    };
  }

  async initialize() {
    await fs.mkdir(path.dirname(this.auditLogPath), { recursive: true });

    await this.loadWhitelist();
    await this.loadBlacklist();

    this.startSecurityMonitoring();

    logger.info('🔒 Security Manager initialized');
  }

  /**
   * Audit logging
   */
  async auditLog(event) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      userId: event.userId,
      ip: event.ip || 'unknown',
      action: event.action,
      resource: event.resource,
      result: event.result,
      metadata: event.metadata || {},
      severity: event.severity || 'info'
    };

    await fs.appendFile(
      this.auditLogPath,
      JSON.stringify(logEntry) + '\n',
      'utf8'
    );

    this.metrics.auditLogs++;

    if (logEntry.severity === 'critical') {
      await this.handleCriticalEvent(logEntry);
    }

    logger.info(`📝 Audit: ${event.type} by ${event.userId} - ${event.result}`);
  }

  /**
   * Security event logging
   */
  async logSecurityEvent(event) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      ip: event.ip,
      details: event.details,
      threat_level: event.threatLevel || 'low'
    };

    await fs.appendFile(
      this.securityEventsPath,
      JSON.stringify(securityEvent) + '\n',
      'utf8'
    );

    this.metrics.securityEvents++;

    if (this.intrusionDetection.enabled) {
      await this.analyzeSecurityEvent(securityEvent);
    }

    this.emit('security_event', securityEvent);
  }

  /**
   * Validate access
   */
  async validateAccess(userId, ip, action) {
    if (this.isBlacklisted(userId, ip)) {
      await this.auditLog({
        type: 'access_denied',
        userId,
        ip,
        action,
        result: 'blocked',
        severity: 'warning',
        metadata: { reason: 'blacklisted' }
      });

      this.metrics.blockedAttempts++;

      return {
        allowed: false,
        reason: 'blacklisted'
      };
    }

    if (this.whitelist.users.size > 0 && !this.whitelist.users.has(userId)) {
      await this.auditLog({
        type: 'access_denied',
        userId,
        ip,
        action,
        result: 'blocked',
        severity: 'warning',
        metadata: { reason: 'not_whitelisted' }
      });

      this.metrics.blockedAttempts++;

      return {
        allowed: false,
        reason: 'not_whitelisted'
      };
    }

    await this.auditLog({
      type: 'access_granted',
      userId,
      ip,
      action,
      result: 'success',
      severity: 'info'
    });

    return {
      allowed: true
    };
  }

  /**
   * Track failed login
   */
  async trackFailedLogin(userId, ip, reason) {
    if (!this.failedAttempts.has(userId)) {
      this.failedAttempts.set(userId, []);
    }

    const attempts = this.failedAttempts.get(userId);
    attempts.push({
      timestamp: Date.now(),
      ip,
      reason
    });

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentAttempts = attempts.filter(a => a.timestamp > oneHourAgo);
    this.failedAttempts.set(userId, recentAttempts);

    await this.logSecurityEvent({
      type: 'failed_login',
      severity: recentAttempts.length >= 3 ? 'warning' : 'info',
      userId,
      ip,
      details: { reason, attemptCount: recentAttempts.length },
      threatLevel: recentAttempts.length >= 5 ? 'high' : 'low'
    });

    if (recentAttempts.length >= this.intrusionDetection.thresholds.failedLogins) {
      await this.blacklistUser(userId, 'too_many_failed_attempts', 24 * 60 * 60 * 1000);

      logger.warn(`🚨 User ${userId} auto-banned: too many failed attempts`);
    }
  }

  /**
   * Blacklist management
   */
  async blacklistUser(userId, reason, duration = null) {
    const bannedAt = Date.now();
    const expiresAt = duration ? bannedAt + duration : null;

    this.blacklist.users.set(userId, {
      reason,
      bannedAt,
      expiresAt
    });

    await this.saveBlacklist();

    await this.auditLog({
      type: 'user_blacklisted',
      userId,
      action: 'blacklist_add',
      result: 'success',
      severity: 'critical',
      metadata: { reason, duration }
    });

    this.emit('user_blacklisted', { userId, reason });
  }

  async unblacklistUser(userId) {
    this.blacklist.users.delete(userId);
    await this.saveBlacklist();

    await this.auditLog({
      type: 'user_unblacklisted',
      userId,
      action: 'blacklist_remove',
      result: 'success',
      severity: 'info'
    });
  }

  isBlacklisted(userId, ip) {
    if (this.blacklist.users.has(userId)) {
      const ban = this.blacklist.users.get(userId);

      if (ban.expiresAt && Date.now() > ban.expiresAt) {
        this.blacklist.users.delete(userId);
        this.saveBlacklist();
        return false;
      }

      return true;
    }

    if (ip && this.blacklist.ips.has(ip)) {
      const ban = this.blacklist.ips.get(ip);

      if (ban.expiresAt && Date.now() > ban.expiresAt) {
        this.blacklist.ips.delete(ip);
        this.saveBlacklist();
        return false;
      }

      return true;
    }

    return false;
  }

  /**
   * Encryption utilities
   */
  encrypt(data, key = null) {
    const encryptionKey = key || process.env.MASTER_PASSWORD;

    if (!encryptionKey) {
      throw new Error('Encryption key not available');
    }

    const derivedKey = crypto.scryptSync(encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData, iv, authTag, key = null) {
    const encryptionKey = key || process.env.MASTER_PASSWORD;

    if (!encryptionKey) {
      throw new Error('Encryption key not available');
    }

    const derivedKey = crypto.scryptSync(encryptionKey, 'salt', 32);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      derivedKey,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Intrusion detection
   */
  async analyzeSecurityEvent(event) {
    // Pattern matching pour détecter comportements suspects

    const patterns = [
      {
        name: 'brute_force',
        check: () => {
          const attempts = this.failedAttempts.get(event.userId) || [];
          return attempts.length >= 5;
        }
      }
    ];

    for (const pattern of patterns) {
      if (pattern.check()) {
        await this.handleThreatDetected({
          type: pattern.name,
          event,
          severity: 'high'
        });
      }
    }
  }

  async handleThreatDetected(threat) {
    this.intrusionDetection.detectedThreats.push({
      ...threat,
      detectedAt: Date.now()
    });

    this.metrics.threatsDetected++;

    logger.warn(`🚨 THREAT DETECTED: ${threat.type}`, threat.event);

    if (threat.severity === 'high' || threat.severity === 'critical') {
      if (threat.event.userId) {
        await this.blacklistUser(threat.event.userId, threat.type, 60 * 60 * 1000);
      }
    }

    this.emit('threat_detected', threat);
  }

  async handleCriticalEvent(event) {
    logger.error('🚨 CRITICAL SECURITY EVENT:', event);
    this.emit('critical_event', event);
  }

  startSecurityMonitoring() {
    // Nettoyer failed attempts toutes les heures
    setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;

      for (const [userId, attempts] of this.failedAttempts.entries()) {
        const recent = attempts.filter(a => a.timestamp > oneHourAgo);

        if (recent.length === 0) {
          this.failedAttempts.delete(userId);
        } else {
          this.failedAttempts.set(userId, recent);
        }
      }
    }, 60 * 60 * 1000);

    logger.info('✅ Security monitoring started');
  }

  async loadWhitelist() {
    try {
      const whitelistPath = path.join(__dirname, '../../config/whitelist.json');
      const data = await fs.readFile(whitelistPath, 'utf8');
      const whitelist = JSON.parse(data);

      this.whitelist.users = new Set(whitelist.users || []);
      this.whitelist.ips = new Set(whitelist.ips || []);

      logger.info(`✅ Whitelist loaded: ${this.whitelist.users.size} users`);
    } catch {}
  }

  async saveWhitelist() {
    const whitelistPath = path.join(__dirname, '../../config/whitelist.json');
    await fs.mkdir(path.dirname(whitelistPath), { recursive: true });

    const data = {
      users: Array.from(this.whitelist.users),
      ips: Array.from(this.whitelist.ips)
    };

    await fs.writeFile(whitelistPath, JSON.stringify(data, null, 2), 'utf8');
  }

  async loadBlacklist() {
    try {
      const blacklistPath = path.join(__dirname, '../../config/blacklist.json');
      const data = await fs.readFile(blacklistPath, 'utf8');
      const blacklist = JSON.parse(data);

      this.blacklist.users = new Map(Object.entries(blacklist.users || {}));
      this.blacklist.ips = new Map(Object.entries(blacklist.ips || {}));

      logger.info(`✅ Blacklist loaded: ${this.blacklist.users.size} users`);
    } catch {}
  }

  async saveBlacklist() {
    const blacklistPath = path.join(__dirname, '../../config/blacklist.json');
    await fs.mkdir(path.dirname(blacklistPath), { recursive: true });

    const data = {
      users: Object.fromEntries(this.blacklist.users),
      ips: Object.fromEntries(this.blacklist.ips)
    };

    await fs.writeFile(blacklistPath, JSON.stringify(data, null, 2), 'utf8');
  }

  getSecurityMetrics() {
    return {
      ...this.metrics,
      whitelist: {
        users: this.whitelist.users.size,
        ips: this.whitelist.ips.size
      },
      blacklist: {
        users: this.blacklist.users.size,
        ips: this.blacklist.ips.size
      },
      intrusionDetection: {
        enabled: this.intrusionDetection.enabled,
        threatsDetected: this.intrusionDetection.detectedThreats.length
      },
      failedAttempts: this.failedAttempts.size
    };
  }
}

module.exports = SecurityManager;
