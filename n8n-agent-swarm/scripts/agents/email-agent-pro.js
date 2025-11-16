#!/usr/bin/env node

/**
 * Email Agent PRO
 *
 * Agent de gestion d'emails multi-plateformes avec IA
 * Support: Gmail, Outlook/Hotmail
 */

const router = require('../ai-core/intelligent-router-pro');

class EmailAgentPro {
  constructor() {
    this.gmailClient = null;
    this.outlookClient = null;

    this.actions = {
      summarize: {
        name: 'RÉSUMÉ',
        description: 'Résumer emails non lus',
        priority: 'normal',
        expectedCost: 0.001
      },
      reply: {
        name: 'RÉPONSE',
        description: 'Générer réponse intelligente',
        priority: 'normal',
        expectedCost: 0.002
      },
      compose: {
        name: 'COMPOSER',
        description: 'Rédiger un nouvel email',
        priority: 'normal',
        expectedCost: 0.003
      },
      categorize: {
        name: 'CATÉGORISER',
        description: 'Trier et organiser',
        priority: 'low',
        expectedCost: 0.001
      }
    };
  }

  // ===== GMAIL INTEGRATION =====

  async connectGmail() {
    // Note: Requiert googleapis package
    // Configuration OAuth2 via variables d'environnement

    if (this.gmailClient) return this.gmailClient;

    try {
      const { google } = require('googleapis');

      const auth = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth2callback'
      );

      if (process.env.GMAIL_REFRESH_TOKEN) {
        auth.setCredentials({
          refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });
      }

      this.gmailClient = google.gmail({ version: 'v1', auth });
      return this.gmailClient;

    } catch (error) {
      throw new Error(`Gmail connection failed: ${error.message}\nInstall: npm install googleapis`);
    }
  }

  async readGmail(query = 'is:unread', maxResults = 10) {
    const gmail = await this.connectGmail();

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults
    });

    if (!res.data.messages || res.data.messages.length === 0) {
      return [];
    }

    const emails = [];

    for (const message of res.data.messages) {
      try {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        emails.push({
          id: msg.data.id,
          threadId: msg.data.threadId,
          from: this.getHeader(msg, 'From'),
          to: this.getHeader(msg, 'To'),
          subject: this.getHeader(msg, 'Subject'),
          date: this.getHeader(msg, 'Date'),
          snippet: msg.data.snippet,
          body: this.getEmailBody(msg)
        });
      } catch (error) {
        console.error(`Error reading email ${message.id}:`, error.message);
      }
    }

    return emails;
  }

  async sendGmail(to, subject, body, options = {}) {
    const gmail = await this.connectGmail();

    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      options.replyTo ? `In-Reply-To: ${options.replyTo}` : '',
      'Content-Type: text/html; charset=utf-8',
      '',
      body
    ].filter(Boolean).join('\n');

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        threadId: options.threadId
      }
    });

    return {
      success: true,
      messageId: res.data.id,
      to,
      subject
    };
  }

  // ===== OUTLOOK/HOTMAIL INTEGRATION =====

  async connectOutlook() {
    if (this.outlookClient) return this.outlookClient;

    try {
      const { Client } = require('@microsoft/microsoft-graph-client');

      this.outlookClient = Client.init({
        authProvider: (done) => {
          done(null, process.env.OUTLOOK_ACCESS_TOKEN);
        }
      });

      return this.outlookClient;

    } catch (error) {
      throw new Error(`Outlook connection failed: ${error.message}\nInstall: npm install @microsoft/microsoft-graph-client`);
    }
  }

  async readOutlook(folder = 'inbox', filter = 'isRead eq false', maxResults = 10) {
    const client = await this.connectOutlook();

    const messages = await client
      .api(`/me/mailFolders/${folder}/messages`)
      .filter(filter)
      .top(maxResults)
      .select('id,from,subject,receivedDateTime,bodyPreview,body')
      .get();

    return messages.value.map(m => ({
      id: m.id,
      from: m.from.emailAddress.address,
      fromName: m.from.emailAddress.name,
      subject: m.subject,
      date: m.receivedDateTime,
      snippet: m.bodyPreview,
      body: m.body.content
    }));
  }

  async sendOutlook(to, subject, body) {
    const client = await this.connectOutlook();

    const message = {
      subject,
      body: {
        contentType: 'HTML',
        content: body
      },
      toRecipients: [{
        emailAddress: {
          address: to
        }
      }]
    };

    await client.api('/me/sendMail').post({ message });

    return {
      success: true,
      to,
      subject
    };
  }

  // ===== AI-POWERED ACTIONS =====

  async summarizeUnread(provider = 'gmail') {
    console.log('📧 Summarizing unread emails...');

    const emails = provider === 'gmail'
      ? await this.readGmail('is:unread', 20)
      : await this.readOutlook('inbox', 'isRead eq false', 20);

    if (emails.length === 0) {
      return {
        summary: "📭 Aucun email non lu !",
        count: 0,
        cost: 0
      };
    }

    // Préparer la liste d'emails pour l'IA
    const emailList = emails.map((e, i) =>
      `Email ${i + 1}:\nDe: ${e.from}\nSujet: ${e.subject}\nAperçu: ${e.snippet || e.body?.substring(0, 150)}`
    ).join('\n\n');

    const prompt = `Tu es un assistant email intelligent. Résume ces ${emails.length} emails de manière concise et organisée en français.

Pour chaque email important, indique:
- Expéditeur
- Sujet
- Action recommandée (si applicable)

Classe-les par priorité (urgent, important, normal, spam).

EMAILS:
${emailList}

Fournis un résumé clair et actionnable.`;

    // Utiliser le router intelligent
    const result = await router.route(prompt, {
      type: 'analysis',
      priority: 'normal',
      maxTokens: 1000,
      factual: false // Emails changent souvent
    });

    return {
      summary: `📬 **${emails.length} email${emails.length > 1 ? 's' : ''} non lu${emails.length > 1 ? 's' : ''}**\n\n${result.content}`,
      count: emails.length,
      emails: emails.slice(0, 5), // Return top 5 for reference
      cost: result.cost,
      cached: result.cached
    };
  }

  async generateReply(emailId, provider = 'gmail', tone = 'professional') {
    console.log(`📝 Generating reply for email ${emailId}...`);

    // Lire l'email original
    let email;
    if (provider === 'gmail') {
      const gmail = await this.connectGmail();
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'full'
      });

      email = {
        from: this.getHeader(msg, 'From'),
        subject: this.getHeader(msg, 'Subject'),
        body: this.getEmailBody(msg)
      };
    } else {
      const client = await this.connectOutlook();
      const msg = await client.api(`/me/messages/${emailId}`).get();

      email = {
        from: msg.from.emailAddress.address,
        subject: msg.subject,
        body: msg.body.content
      };
    }

    const tones = {
      professional: 'professionnel et courtois',
      friendly: 'amical et décontracté',
      formal: 'formel et respectueux',
      brief: 'concis et direct'
    };

    const prompt = `Tu es un assistant email intelligent. Génère une réponse ${tones[tone] || tones.professional} à cet email en français.

EMAIL ORIGINAL:
De: ${email.from}
Sujet: ${email.subject}

Contenu:
${email.body}

INSTRUCTIONS:
- Réponds de manière appropriée au contexte
- Ton: ${tones[tone] || tones.professional}
- Sois clair et concis
- Inclus une salutation et signature appropriées
- N'invente pas d'informations

Fournis uniquement le contenu de la réponse, sans "Objet:" ni métadonnées.`;

    const result = await router.route(prompt, {
      type: 'content',
      priority: 'normal',
      maxTokens: 800
    });

    return {
      reply: result.content,
      originalFrom: email.from,
      originalSubject: email.subject,
      suggestedSubject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      cost: result.cost,
      cached: result.cached
    };
  }

  async composeEmail(description, tone = 'professional') {
    console.log(`✍️ Composing email: "${description}"...`);

    const tones = {
      professional: 'professionnel et courtois',
      friendly: 'amical et chaleureux',
      formal: 'très formel et respectueux',
      marketing: 'engageant et persuasif'
    };

    const prompt = `Tu es un assistant email intelligent. Rédige un email complet en français basé sur cette description:

"${description}"

INSTRUCTIONS:
- Ton: ${tones[tone] || tones.professional}
- Inclus un objet approprié
- Inclus une salutation et signature
- Sois clair, structuré et professionnel
- Adapte la longueur au contexte

FORMAT DE SORTIE:
Objet: [l'objet de l'email]

[Corps de l'email avec salutation et signature]`;

    const result = await router.route(prompt, {
      type: 'content',
      priority: 'normal',
      maxTokens: 1000
    });

    // Parser l'objet et le corps
    const lines = result.content.split('\n');
    let subject = '';
    let body = '';
    let foundSubject = false;

    for (const line of lines) {
      if (line.startsWith('Objet:')) {
        subject = line.replace('Objet:', '').trim();
        foundSubject = true;
      } else if (foundSubject) {
        body += line + '\n';
      }
    }

    return {
      subject: subject || 'Email généré par IA',
      body: body.trim() || result.content,
      fullContent: result.content,
      cost: result.cost,
      cached: result.cached
    };
  }

  async categorizeEmails(provider = 'gmail', maxEmails = 50) {
    console.log(`🗂️ Categorizing emails...`);

    const emails = provider === 'gmail'
      ? await this.readGmail('', maxEmails)
      : await this.readOutlook('inbox', '', maxEmails);

    if (emails.length === 0) {
      return { categories: {}, total: 0 };
    }

    // Créer un résumé pour l'IA
    const emailSummaries = emails.map((e, i) =>
      `${i + 1}. De: ${e.from} | Sujet: ${e.subject}`
    ).join('\n');

    const prompt = `Catégorise ces ${emails.length} emails dans les catégories suivantes:
- urgent (nécessite action immédiate)
- important (à traiter bientôt)
- travail (professionnel)
- personnel (non-professionnel)
- spam (indésirable)
- newsletter (abonnements)

Pour chaque email, indique uniquement le numéro et la catégorie.

EMAILS:
${emailSummaries}

FORMAT: "1: urgent", "2: personnel", etc.`;

    const result = await router.route(prompt, {
      type: 'analysis',
      priority: 'low',
      maxTokens: 1500
    });

    // Parser les résultats
    const categories = {
      urgent: [],
      important: [],
      travail: [],
      personnel: [],
      spam: [],
      newsletter: []
    };

    const lines = result.content.split('\n');
    for (const line of lines) {
      const match = line.match(/(\d+):\s*(\w+)/);
      if (match) {
        const idx = parseInt(match[1]) - 1;
        const category = match[2].toLowerCase();
        if (emails[idx] && categories[category]) {
          categories[category].push({
            id: emails[idx].id,
            from: emails[idx].from,
            subject: emails[idx].subject
          });
        }
      }
    }

    return {
      categories,
      total: emails.length,
      cost: result.cost
    };
  }

  // ===== HELPERS =====

  getHeader(message, name) {
    if (!message.data || !message.data.payload || !message.data.payload.headers) {
      return '';
    }
    const header = message.data.payload.headers.find(h => h.name === name);
    return header ? header.value : '';
  }

  getEmailBody(message) {
    if (!message.data || !message.data.payload) return '';

    let body = '';

    if (message.data.payload.body && message.data.payload.body.data) {
      body = Buffer.from(message.data.payload.body.data, 'base64').toString('utf-8');
    } else if (message.data.payload.parts) {
      for (const part of message.data.payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body && part.body.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          }
        }
      }
    }

    // Strip HTML tags for simpler analysis
    return body.replace(/<[^>]*>/g, '').substring(0, 5000);
  }

  // ===== STATUS =====

  async getStatus() {
    const status = {
      gmail: false,
      outlook: false,
      actions: Object.keys(this.actions)
    };

    try {
      await this.connectGmail();
      status.gmail = true;
    } catch (error) {
      status.gmailError = error.message;
    }

    try {
      await this.connectOutlook();
      status.outlook = true;
    } catch (error) {
      status.outlookError = error.message;
    }

    return status;
  }
}

module.exports = new EmailAgentPro();

// CLI test
if (require.main === module) {
  (async () => {
    console.log('🧪 Testing Email Agent Pro...\n');

    const agent = new EmailAgentPro();

    try {
      const status = await agent.getStatus();
      console.log('Status:', JSON.stringify(status, null, 2));

      if (status.gmail) {
        console.log('\n📧 Testing Gmail summarize...');
        const summary = await agent.summarizeUnread('gmail');
        console.log(summary.summary);
        console.log(`\nCost: €${summary.cost.toFixed(6)}`);
      }

      console.log('\n✅ Email Agent test passed!');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.log('\n💡 Configure environment variables:');
      console.log('   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN');
      console.log('   or OUTLOOK_ACCESS_TOKEN');
    }
  })();
}
