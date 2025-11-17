#!/usr/bin/env node

/**
 * Universal Credential Vault
 *
 * Système de gestion d'identifiants UNIVERSEL pour:
 * - Email providers (Gmail, Outlook, Yahoo, ProtonMail, iCloud, Custom SMTP)
 * - Commerce platforms (Xianyu, Weigou, Vinted, Taobao, AliExpress, eBay, Leboncoin)
 * - Productivity (Google, Microsoft 365, Notion, Trello, Slack)
 * - Social media (WeChat, WhatsApp, Twitter, LinkedIn)
 * - Banking/Payment (PayPal, Stripe, Alipay, WeChat Pay)
 * - Custom services (n'importe quel service)
 *
 * Chiffrement: AES-256-GCM
 * Stockage: JSON chiffré local
 *
 * @version 1.0.0
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../core/logger');

class UniversalCredentialVault {
  constructor() {
    this.vaultPath = path.join(__dirname, '../../.credentials.vault');
    this.masterPassword = process.env.MASTER_PASSWORD || 'default-master-password-CHANGE-ME';

    // Dériver clé de chiffrement
    this.salt = process.env.VAULT_SALT || 'default-salt-change-in-production';
    this.encryptionKey = crypto.scryptSync(this.masterPassword, this.salt, 32);

    this.credentials = {};
    this.isLoaded = false;

    // Templates de services supportés
    this.serviceTemplates = this.getServiceTemplates();

    logger.info('🔐 Universal Credential Vault initialized');
  }

  /**
   * Templates pour chaque type de service
   */
  getServiceTemplates() {
    return {
      // === EMAIL PROVIDERS ===
      'gmail': {
        type: 'email',
        provider: 'gmail',
        fields: ['email', 'app_password'],
        optional: [],
        instructions: `Gmail App Password:
1. Aller sur https://myaccount.google.com/security
2. "2-Step Verification" → "App passwords"
3. Générer un mot de passe pour "Mail"
4. Copier le mot de passe (16 caractères)`
      },

      'outlook': {
        type: 'email',
        provider: 'outlook',
        fields: ['email', 'password'],
        optional: ['app_password'],
        smtp: {
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false
        },
        instructions: `Outlook/Hotmail:
1. Email: votre adresse @outlook.com ou @hotmail.com
2. Password: votre mot de passe Outlook
3. Si 2FA activé: utiliser app password`
      },

      'yahoo': {
        type: 'email',
        provider: 'yahoo',
        fields: ['email', 'app_password'],
        smtp: {
          host: 'smtp.mail.yahoo.com',
          port: 465,
          secure: true
        },
        instructions: `Yahoo Mail:
1. Aller sur https://login.yahoo.com/account/security
2. "Generate app password"
3. Sélectionner "Other App"
4. Copier le mot de passe`
      },

      'protonmail': {
        type: 'email',
        provider: 'protonmail',
        fields: ['email', 'password', 'bridge_password'],
        smtp: {
          host: '127.0.0.1',
          port: 1025,
          secure: false
        },
        instructions: `ProtonMail:
1. Installer ProtonMail Bridge
2. Email: votre adresse @protonmail.com
3. Bridge Password: généré par Bridge`
      },

      'icloud': {
        type: 'email',
        provider: 'icloud',
        fields: ['email', 'app_password'],
        smtp: {
          host: 'smtp.mail.me.com',
          port: 587,
          secure: false
        },
        instructions: `iCloud Mail:
1. Aller sur appleid.apple.com
2. Security → App-Specific Passwords
3. Générer un mot de passe`
      },

      'custom_smtp': {
        type: 'email',
        provider: 'custom',
        fields: ['email', 'password', 'smtp_host', 'smtp_port'],
        optional: ['smtp_secure'],
        instructions: `Custom SMTP:
Remplir les informations SMTP de votre provider`
      },

      // === COMMERCE PLATFORMS ===
      'xianyu': {
        type: 'commerce',
        provider: 'xianyu',
        fields: ['username', 'password'],
        optional: ['phone', 'session_cookies'],
        instructions: `Xianyu (闲鱼):
1. Username: votre nom d'utilisateur
2. Password: votre mot de passe
3. Première connexion: résolution CAPTCHA manuelle`
      },

      'weigou': {
        type: 'commerce',
        provider: 'weigou',
        fields: ['username', 'password'],
        optional: ['session_cookies'],
        instructions: `Weigou (微购):
1. Username: votre identifiant
2. Password: votre mot de passe`
      },

      'vinted': {
        type: 'commerce',
        provider: 'vinted',
        fields: ['email', 'password'],
        optional: ['session_cookies'],
        instructions: `Vinted:
1. Email: votre email Vinted
2. Password: votre mot de passe`
      },

      'taobao': {
        type: 'commerce',
        provider: 'taobao',
        fields: ['username', 'password'],
        optional: ['phone', 'session_cookies'],
        instructions: `Taobao (淘宝):
1. Username: votre nom d'utilisateur
2. Password: votre mot de passe`
      },

      'aliexpress': {
        type: 'commerce',
        provider: 'aliexpress',
        fields: ['email', 'password'],
        optional: ['session_cookies'],
        instructions: `AliExpress:
1. Email: votre email
2. Password: votre mot de passe`
      },

      'ebay': {
        type: 'commerce',
        provider: 'ebay',
        fields: ['username', 'password'],
        optional: ['api_key', 'api_secret'],
        instructions: `eBay:
1. Username: votre identifiant eBay
2. Password: votre mot de passe
3. API (optionnel): pour automatisation avancée`
      },

      'leboncoin': {
        type: 'commerce',
        provider: 'leboncoin',
        fields: ['email', 'password'],
        optional: ['session_cookies'],
        instructions: `Leboncoin:
1. Email: votre email
2. Password: votre mot de passe`
      },

      // === PRODUCTIVITY ===
      'google': {
        type: 'productivity',
        provider: 'google',
        fields: ['client_id', 'client_secret', 'refresh_token'],
        optional: ['access_token'],
        instructions: `Google OAuth:
1. Créer projet Google Cloud Console
2. Activer APIs (Drive, Calendar, Gmail)
3. Créer OAuth credentials
4. Obtenir refresh token`
      },

      'microsoft365': {
        type: 'productivity',
        provider: 'microsoft',
        fields: ['client_id', 'client_secret', 'refresh_token'],
        optional: ['tenant_id'],
        instructions: `Microsoft 365:
1. Azure Portal → App registrations
2. Créer application
3. API permissions (Mail, Calendar, OneDrive)
4. Obtenir credentials`
      },

      'notion': {
        type: 'productivity',
        provider: 'notion',
        fields: ['api_key'],
        optional: ['workspace_id'],
        instructions: `Notion:
1. Aller sur https://www.notion.so/my-integrations
2. Créer une intégration
3. Copier l'API key`
      },

      'trello': {
        type: 'productivity',
        provider: 'trello',
        fields: ['api_key', 'api_token'],
        optional: [],
        instructions: `Trello:
1. https://trello.com/app-key
2. Copier API Key
3. Générer Token`
      },

      'slack': {
        type: 'productivity',
        provider: 'slack',
        fields: ['bot_token', 'workspace_id'],
        optional: ['signing_secret'],
        instructions: `Slack:
1. api.slack.com/apps
2. Créer app
3. OAuth → Bot Token`
      },

      // === SOCIAL MEDIA ===
      'wechat': {
        type: 'social',
        provider: 'wechat',
        fields: ['username', 'password'],
        optional: ['session_cookies'],
        instructions: `WeChat:
1. Username: votre WeChat ID
2. Password: votre mot de passe
⚠️ Scan QR requis pour première connexion`
      },

      'whatsapp': {
        type: 'social',
        provider: 'whatsapp',
        fields: ['phone', 'session_data'],
        optional: [],
        instructions: `WhatsApp:
1. Phone: votre numéro avec code pays
2. Session: généré après scan QR`
      },

      'twitter': {
        type: 'social',
        provider: 'twitter',
        fields: ['api_key', 'api_secret', 'access_token', 'access_secret'],
        optional: [],
        instructions: `Twitter/X:
1. developer.twitter.com
2. Créer app
3. Keys & Tokens`
      },

      'linkedin': {
        type: 'social',
        provider: 'linkedin',
        fields: ['email', 'password'],
        optional: ['api_key'],
        instructions: `LinkedIn:
1. Email: votre email LinkedIn
2. Password: votre mot de passe`
      },

      // === PAYMENT ===
      'paypal': {
        type: 'payment',
        provider: 'paypal',
        fields: ['client_id', 'client_secret'],
        optional: ['email'],
        instructions: `PayPal:
1. developer.paypal.com
2. Create App
3. Copier credentials`
      },

      'stripe': {
        type: 'payment',
        provider: 'stripe',
        fields: ['api_key', 'secret_key'],
        optional: ['webhook_secret'],
        instructions: `Stripe:
1. dashboard.stripe.com
2. Developers → API keys`
      },

      'alipay': {
        type: 'payment',
        provider: 'alipay',
        fields: ['app_id', 'private_key'],
        optional: ['public_key'],
        instructions: `Alipay:
1. open.alipay.com
2. Créer application
3. Obtenir credentials`
      },

      'wechatpay': {
        type: 'payment',
        provider: 'wechatpay',
        fields: ['mch_id', 'api_key'],
        optional: ['cert_path'],
        instructions: `WeChat Pay:
1. pay.weixin.qq.com
2. Merchant account
3. API credentials`
      },

      // === CUSTOM ===
      'custom': {
        type: 'custom',
        provider: 'custom',
        fields: ['service_name', 'url'],
        optional: ['username', 'password', 'api_key', 'notes'],
        instructions: `Service Custom:
Remplir les champs pertinents pour votre service`
      }
    };
  }

  /**
   * Lister tous les services supportés
   */
  getSupportedServices() {
    return Object.keys(this.serviceTemplates).map(key => ({
      id: key,
      type: this.serviceTemplates[key].type,
      provider: this.serviceTemplates[key].provider,
      name: this.getServiceDisplayName(key)
    }));
  }

  getServiceDisplayName(serviceId) {
    const names = {
      'gmail': 'Gmail',
      'outlook': 'Outlook/Hotmail',
      'yahoo': 'Yahoo Mail',
      'protonmail': 'ProtonMail',
      'icloud': 'iCloud Mail',
      'custom_smtp': 'Custom SMTP',
      'xianyu': 'Xianyu (闲鱼)',
      'weigou': 'Weigou (微购)',
      'vinted': 'Vinted',
      'taobao': 'Taobao (淘宝)',
      'aliexpress': 'AliExpress',
      'ebay': 'eBay',
      'leboncoin': 'Leboncoin',
      'google': 'Google Workspace',
      'microsoft365': 'Microsoft 365',
      'notion': 'Notion',
      'trello': 'Trello',
      'slack': 'Slack',
      'wechat': 'WeChat (微信)',
      'whatsapp': 'WhatsApp',
      'twitter': 'Twitter/X',
      'linkedin': 'LinkedIn',
      'paypal': 'PayPal',
      'stripe': 'Stripe',
      'alipay': 'Alipay (支付宝)',
      'wechatpay': 'WeChat Pay (微信支付)',
      'custom': 'Service Custom'
    };

    return names[serviceId] || serviceId;
  }

  /**
   * Obtenir template d'un service
   */
  getServiceTemplate(serviceId) {
    return this.serviceTemplates[serviceId] || null;
  }

  /**
   * Charger le vault
   */
  async load() {
    try {
      const exists = await fs.access(this.vaultPath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        logger.info('🔐 Vault vide, initialisation...');
        this.credentials = {};
        await this.save();
        this.isLoaded = true;
        return;
      }

      const encrypted = await fs.readFile(this.vaultPath, 'utf8');

      if (!encrypted) {
        this.credentials = {};
        this.isLoaded = true;
        return;
      }

      // Décoder
      const parts = encrypted.split(':');
      if (parts.length !== 3) {
        throw new Error('Format vault invalide');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedData = Buffer.from(parts[2], 'hex');

      // Déchiffrer
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      this.credentials = JSON.parse(decrypted.toString('utf8'));
      this.isLoaded = true;

      const serviceCount = Object.keys(this.credentials).length;
      logger.info(`✅ Vault chargé: ${serviceCount} service(s) configuré(s)`);

    } catch (error) {
      logger.error('❌ Erreur chargement vault:', error.message);
      this.credentials = {};
      this.isLoaded = true;
    }
  }

  /**
   * Sauvegarder le vault
   */
  async save() {
    try {
      const data = JSON.stringify(this.credentials);

      // IV aléatoire
      const iv = crypto.randomBytes(16);

      // Chiffrer
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

      let encrypted = cipher.update(data, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      const authTag = cipher.getAuthTag();

      // Format: IV:AuthTag:EncryptedData
      const vaultData = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;

      await fs.writeFile(this.vaultPath, vaultData, 'utf8');

      logger.info('✅ Vault sauvegardé');

    } catch (error) {
      logger.error('❌ Erreur sauvegarde vault:', error.message);
      throw error;
    }
  }

  /**
   * Ajouter/Mettre à jour credentials
   */
  async setCredentials(serviceId, credentials) {
    if (!this.isLoaded) {
      await this.load();
    }

    // Valider avec template
    const template = this.getServiceTemplate(serviceId);

    if (!template) {
      throw new Error(`Service '${serviceId}' non supporté. Utilisez 'custom' pour services custom.`);
    }

    // Vérifier champs requis
    for (const field of template.fields) {
      if (!credentials[field]) {
        throw new Error(`Champ requis manquant: ${field}`);
      }
    }

    // Ajouter metadata
    this.credentials[serviceId] = {
      ...credentials,
      serviceType: template.type,
      provider: template.provider,
      addedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    await this.save();

    logger.info(`✅ Credentials '${serviceId}' sauvegardés`);
  }

  /**
   * Récupérer credentials
   */
  async getCredentials(serviceId) {
    if (!this.isLoaded) {
      await this.load();
    }

    return this.credentials[serviceId] || null;
  }

  /**
   * Supprimer credentials
   */
  async deleteCredentials(serviceId) {
    if (!this.isLoaded) {
      await this.load();
    }

    delete this.credentials[serviceId];
    await this.save();

    logger.info(`✅ Credentials '${serviceId}' supprimés`);
  }

  /**
   * Lister services configurés
   */
  async listConfiguredServices() {
    if (!this.isLoaded) {
      await this.load();
    }

    return Object.keys(this.credentials).map(key => ({
      id: key,
      name: this.getServiceDisplayName(key),
      type: this.credentials[key].serviceType,
      provider: this.credentials[key].provider,
      addedAt: this.credentials[key].addedAt,
      lastUpdated: this.credentials[key].lastUpdated
    }));
  }

  /**
   * Vérifier si service configuré
   */
  async hasCredentials(serviceId) {
    if (!this.isLoaded) {
      await this.load();
    }

    return this.credentials[serviceId] !== undefined;
  }

  /**
   * Exporter credentials (pour backup)
   */
  async exportEncrypted(password) {
    if (!this.isLoaded) {
      await this.load();
    }

    // Chiffrer avec password custom (pour backup)
    const key = crypto.scryptSync(password, 'export-salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(JSON.stringify(this.credentials), 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();

    return {
      version: '1.0',
      data: `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Importer credentials (depuis backup)
   */
  async importEncrypted(backupData, password) {
    try {
      const parts = backupData.data.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedData = Buffer.from(parts[2], 'hex');

      const key = crypto.scryptSync(password, 'export-salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      const imported = JSON.parse(decrypted.toString('utf8'));

      // Fusionner avec credentials existants
      this.credentials = { ...this.credentials, ...imported };

      await this.save();

      logger.info('✅ Credentials importés');

      return Object.keys(imported).length;

    } catch (error) {
      throw new Error('Import échoué: password incorrect ou données corrompues');
    }
  }
}

module.exports = UniversalCredentialVault;
