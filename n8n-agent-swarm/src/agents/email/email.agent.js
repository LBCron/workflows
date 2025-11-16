/**
 * 📧 EMAIL AGENT PRO v4.0
 *
 * Gestion complète des emails via Gmail et Outlook
 *
 * Fonctionnalités:
 * - ✅ Envoi d'emails (Gmail/Outlook)
 * - ✅ Lecture et recherche d'emails
 * - ✅ Réponses automatiques intelligentes
 * - ✅ Gestion des brouillons
 * - ✅ Templates d'emails professionnels
 * - ✅ Pièces jointes
 * - ✅ Filtres et labels
 * - ✅ Analyse d'emails avec AI
 */

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const logger = require('../../core/logger/logger');

class EmailAgentPro {
  constructor(config = {}) {
    this.config = {
      provider: config.provider || 'gmail', // 'gmail' ou 'outlook'
      ...config
    };

    this.transporter = null;
    this.gmail = null;
    this.initialized = false;

    logger.info('📧 Email Agent Pro initialisé', { provider: this.config.provider });
  }

  /**
   * Initialise la connexion email
   */
  async initialize() {
    try {
      if (this.config.provider === 'gmail') {
        await this._initializeGmail();
      } else if (this.config.provider === 'outlook') {
        await this._initializeOutlook();
      }

      this.initialized = true;
      logger.info('✅ Email Agent connecté', { provider: this.config.provider });

      return { success: true, provider: this.config.provider };
    } catch (error) {
      logger.error('❌ Erreur initialisation email', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialise Gmail avec OAuth2
   */
  async _initializeGmail() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Créer transporter Nodemailer avec Gmail
    const accessToken = await oauth2Client.getAccessToken();

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });
  }

  /**
   * Initialise Outlook/Office365
   */
  async _initializeOutlook() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.OUTLOOK_USER,
        pass: process.env.OUTLOOK_PASSWORD
      }
    });
  }

  /**
   * 📤 ENVOYER UN EMAIL
   *
   * @param {Object} options - Options d'envoi
   * @returns {Object} Résultat d'envoi
   */
  async send(options) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        to,
        subject,
        body,
        html,
        cc,
        bcc,
        attachments,
        template,
        variables
      } = options;

      // Utiliser un template si spécifié
      let finalBody = body;
      let finalHtml = html;

      if (template) {
        const rendered = this._renderTemplate(template, variables);
        finalBody = rendered.text;
        finalHtml = rendered.html;
      }

      const mailOptions = {
        from: this.config.provider === 'gmail'
          ? process.env.GMAIL_USER
          : process.env.OUTLOOK_USER,
        to,
        subject,
        text: finalBody,
        html: finalHtml,
        cc,
        bcc,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('✅ Email envoyé', { to, subject, messageId: result.messageId });

      return {
        success: true,
        messageId: result.messageId,
        to,
        subject,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Erreur envoi email', { error: error.message, to: options.to });
      throw error;
    }
  }

  /**
   * 📥 LIRE LES EMAILS
   *
   * @param {Object} filters - Filtres de recherche
   * @returns {Array} Liste d'emails
   */
  async read(filters = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        maxResults = 10,
        query = '',
        labelIds = ['INBOX'],
        unreadOnly = false
      } = filters;

      let searchQuery = query;
      if (unreadOnly && !searchQuery.includes('is:unread')) {
        searchQuery += ' is:unread';
      }

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: searchQuery,
        labelIds
      });

      const messages = response.data.messages || [];

      // Récupérer les détails de chaque message
      const emails = await Promise.all(
        messages.map(async (message) => {
          const details = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          return this._parseEmailDetails(details.data);
        })
      );

      logger.info('📥 Emails récupérés', { count: emails.length, query: searchQuery });

      return emails;
    } catch (error) {
      logger.error('❌ Erreur lecture emails', { error: error.message });
      throw error;
    }
  }

  /**
   * 💬 RÉPONDRE À UN EMAIL
   *
   * @param {Object} options - Options de réponse
   * @returns {Object} Résultat d'envoi
   */
  async reply(options) {
    try {
      const { messageId, body, html, useAI = false } = options;

      // Si useAI, générer une réponse intelligente
      let finalBody = body;
      let finalHtml = html;

      if (useAI && this.config.aiModel) {
        const originalEmail = await this._getEmailById(messageId);
        const aiResponse = await this._generateAIReply(originalEmail, options.context);
        finalBody = aiResponse.text;
        finalHtml = aiResponse.html;
      }

      // Récupérer les headers de l'email original
      const original = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const headers = original.data.payload.headers;
      const to = headers.find(h => h.name === 'From')?.value;
      const subject = headers.find(h => h.name === 'Subject')?.value;

      return await this.send({
        to,
        subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
        body: finalBody,
        html: finalHtml,
        inReplyTo: messageId
      });
    } catch (error) {
      logger.error('❌ Erreur réponse email', { error: error.message });
      throw error;
    }
  }

  /**
   * 🔍 RECHERCHER DANS LES EMAILS
   *
   * @param {Object} criteria - Critères de recherche
   * @returns {Array} Emails correspondants
   */
  async search(criteria) {
    const {
      from,
      to,
      subject,
      body,
      hasAttachment,
      dateAfter,
      dateBefore,
      isUnread,
      label
    } = criteria;

    let query = '';

    if (from) query += `from:${from} `;
    if (to) query += `to:${to} `;
    if (subject) query += `subject:${subject} `;
    if (body) query += `${body} `;
    if (hasAttachment) query += 'has:attachment ';
    if (dateAfter) query += `after:${dateAfter} `;
    if (dateBefore) query += `before:${dateBefore} `;
    if (isUnread) query += 'is:unread ';
    if (label) query += `label:${label} `;

    logger.info('🔍 Recherche emails', { query: query.trim() });

    return await this.read({ query: query.trim(), maxResults: 50 });
  }

  /**
   * 📝 CRÉER UN BROUILLON
   *
   * @param {Object} options - Options du brouillon
   * @returns {Object} Brouillon créé
   */
  async createDraft(options) {
    try {
      const { to, subject, body, html } = options;

      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body || html
      ].join('\n');

      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const draft = await this.gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage
          }
        }
      });

      logger.info('📝 Brouillon créé', { to, subject, draftId: draft.data.id });

      return {
        success: true,
        draftId: draft.data.id,
        to,
        subject
      };
    } catch (error) {
      logger.error('❌ Erreur création brouillon', { error: error.message });
      throw error;
    }
  }

  /**
   * 📊 ANALYSER LES EMAILS AVEC AI
   *
   * @param {Array} emails - Liste d'emails à analyser
   * @returns {Object} Analyse
   */
  async analyzeWithAI(emails) {
    try {
      const analysis = {
        total: emails.length,
        unread: emails.filter(e => e.unread).length,
        important: emails.filter(e => e.important).length,
        categories: {
          work: 0,
          personal: 0,
          promotions: 0,
          newsletters: 0
        },
        topSenders: {},
        summary: '',
        actionItems: []
      };

      // Catégoriser les emails
      for (const email of emails) {
        // Compter les expéditeurs
        analysis.topSenders[email.from] = (analysis.topSenders[email.from] || 0) + 1;

        // Catégoriser (simplifié - pourrait utiliser AI pour classification)
        if (email.subject.match(/meeting|call|conference/i)) {
          analysis.categories.work++;
        } else if (email.subject.match(/offer|sale|discount/i)) {
          analysis.categories.promotions++;
        } else if (email.subject.match(/newsletter|update/i)) {
          analysis.categories.newsletters++;
        } else {
          analysis.categories.personal++;
        }

        // Extraire les action items (simplifié)
        if (email.body.match(/urgent|asap|deadline|action required/i)) {
          analysis.actionItems.push({
            from: email.from,
            subject: email.subject,
            snippet: email.snippet,
            date: email.date
          });
        }
      }

      // Top 5 expéditeurs
      analysis.topSenders = Object.entries(analysis.topSenders)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([email, count]) => ({ email, count }));

      analysis.summary = `Vous avez ${analysis.total} emails dont ${analysis.unread} non lus. ${analysis.actionItems.length} emails nécessitent une action.`;

      logger.info('📊 Analyse emails terminée', {
        total: analysis.total,
        actionItems: analysis.actionItems.length
      });

      return analysis;
    } catch (error) {
      logger.error('❌ Erreur analyse emails', { error: error.message });
      throw error;
    }
  }

  /**
   * 🎨 TEMPLATES D'EMAILS
   */
  _renderTemplate(templateName, variables = {}) {
    const templates = {
      'meeting-request': {
        text: `Bonjour ${variables.name},\n\nJe souhaiterais planifier une réunion concernant ${variables.topic}.\n\nSeriez-vous disponible le ${variables.date} à ${variables.time} ?\n\nCordialement,\n${variables.sender}`,
        html: `<p>Bonjour ${variables.name},</p><p>Je souhaiterais planifier une réunion concernant <strong>${variables.topic}</strong>.</p><p>Seriez-vous disponible le ${variables.date} à ${variables.time} ?</p><p>Cordialement,<br>${variables.sender}</p>`
      },
      'follow-up': {
        text: `Bonjour ${variables.name},\n\nJe me permets de revenir vers vous concernant ${variables.topic}.\n\n${variables.message}\n\nCordialement,\n${variables.sender}`,
        html: `<p>Bonjour ${variables.name},</p><p>Je me permets de revenir vers vous concernant <strong>${variables.topic}</strong>.</p><p>${variables.message}</p><p>Cordialement,<br>${variables.sender}</p>`
      },
      'thank-you': {
        text: `Bonjour ${variables.name},\n\nMerci beaucoup pour ${variables.reason}.\n\n${variables.message}\n\nCordialement,\n${variables.sender}`,
        html: `<p>Bonjour ${variables.name},</p><p>Merci beaucoup pour <strong>${variables.reason}</strong>.</p><p>${variables.message}</p><p>Cordialement,<br>${variables.sender}</p>`
      },
      'newsletter': {
        text: `${variables.title}\n\n${variables.content}\n\n${variables.footer}`,
        html: `<h2>${variables.title}</h2><div>${variables.content}</div><footer>${variables.footer}</footer>`
      }
    };

    return templates[templateName] || { text: variables.body, html: variables.html };
  }

  /**
   * Parse les détails d'un email
   */
  _parseEmailDetails(message) {
    const headers = message.payload.headers;

    return {
      id: message.id,
      threadId: message.threadId,
      from: headers.find(h => h.name === 'From')?.value || '',
      to: headers.find(h => h.name === 'To')?.value || '',
      subject: headers.find(h => h.name === 'Subject')?.value || '',
      date: headers.find(h => h.name === 'Date')?.value || '',
      snippet: message.snippet,
      body: this._getBody(message.payload),
      labels: message.labelIds || [],
      unread: message.labelIds?.includes('UNREAD'),
      important: message.labelIds?.includes('IMPORTANT'),
      hasAttachment: message.payload.parts?.some(part => part.filename)
    };
  }

  /**
   * Extrait le body d'un email
   */
  _getBody(payload) {
    let body = '';

    if (payload.body.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
      payload.parts.forEach(part => {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body += Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      });
    }

    return body;
  }

  /**
   * Récupère un email par ID
   */
  async _getEmailById(messageId) {
    const message = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    return this._parseEmailDetails(message.data);
  }

  /**
   * Génère une réponse AI intelligente
   */
  async _generateAIReply(originalEmail, context = '') {
    // Cette méthode pourrait utiliser OpenAI pour générer des réponses intelligentes
    // Pour l'instant, retourne un template simple

    const response = {
      text: `Merci pour votre email concernant "${originalEmail.subject}".\n\n${context}\n\nCordialement`,
      html: `<p>Merci pour votre email concernant "<strong>${originalEmail.subject}</strong>".</p><p>${context}</p><p>Cordialement</p>`
    };

    return response;
  }
}

module.exports = EmailAgentPro;
