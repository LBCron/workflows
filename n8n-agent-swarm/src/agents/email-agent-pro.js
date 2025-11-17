/**
 * Email Agent Pro v2.0
 *
 * Agent email avancé avec:
 * - AI Email Composing (GPT-4)
 * - Smart Reply suggestions
 * - Email templates intelligents
 * - Sentiment analysis
 * - Priority detection
 * - Auto-categorization
 * - Follow-up reminders
 * - Email scheduling
 */

const logger = require('../utils/logger');

class EmailAgentPro {
  constructor(vault, openaiClient = null) {
    this.vault = vault;
    this.openai = openaiClient;
    this.gmail = null;
    this.isAuthenticated = false;
  }

  async initialize() {
    try {
      const creds = await this.vault.getCredentials('gmail');

      if (!creds) {
        logger.warn('Gmail credentials not configured - Email Agent Pro in limited mode');
        return;
      }

      // Gmail API initialization (requires googleapis)
      // const { google } = require('googleapis');
      // const oauth2Client = new google.auth.OAuth2(...);
      // this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      this.isAuthenticated = false; // Set to true when gmail is configured

      logger.info('✅ Email Agent Pro initialized');
    } catch (error) {
      logger.error('Email Agent Pro initialization error:', error);
    }
  }

  /**
   * AI Email Composing
   */
  async composeEmailWithAI(context) {
    if (!this.openai) {
      throw new Error('OpenAI client not configured');
    }

    const {
      purpose, // "reply" | "new" | "follow_up" | "cold_outreach"
      recipient,
      topic,
      tone = 'professional', // professional | casual | friendly | formal
      length = 'medium', // short | medium | long
      language = 'français',
      includeContext = null, // Previous email thread
      keyPoints = []
    } = context;

    let prompt = this.buildEmailPrompt(context);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en rédaction d'emails professionnels. Tu rédiges des emails clairs, concis et efficaces selon le contexte donné.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const emailBody = response.choices[0].message.content;

    // Générer sujet si nécessaire
    const subject = context.subject || await this.generateSubject(emailBody, topic);

    return {
      subject,
      body: emailBody,
      metadata: {
        purpose,
        tone,
        length,
        generatedAt: new Date().toISOString()
      }
    };
  }

  buildEmailPrompt(context) {
    const { purpose, recipient, topic, tone, length, keyPoints, includeContext } = context;

    let prompt = `Rédige un email ${tone} en ${context.language || 'français'}.\n\n`;

    prompt += `**Type:** ${purpose}\n`;
    prompt += `**Destinataire:** ${recipient}\n`;
    prompt += `**Sujet:** ${topic}\n`;
    prompt += `**Longueur:** ${length}\n\n`;

    if (keyPoints && keyPoints.length > 0) {
      prompt += `**Points clés à aborder:**\n`;
      keyPoints.forEach((point, i) => {
        prompt += `${i + 1}. ${point}\n`;
      });
      prompt += `\n`;
    }

    if (includeContext) {
      prompt += `**Contexte (email précédent):**\n`;
      prompt += `"${includeContext}"\n\n`;
    }

    if (purpose === 'reply') {
      prompt += `Rédige une réponse appropriée qui répond aux points soulevés.\n`;
    } else if (purpose === 'follow_up') {
      prompt += `Rédige un email de relance poli et professionnel.\n`;
    } else if (purpose === 'cold_outreach') {
      prompt += `Rédige un email de prospection engageant sans être trop agressif.\n`;
    }

    prompt += `\nFournis uniquement le corps de l'email, sans signature.`;

    return prompt;
  }

  async generateSubject(emailBody, topic) {
    if (!this.openai) {
      return topic || 'Sujet';
    }

    const prompt = `
Génère un sujet d'email court et percutant (max 60 caractères) pour cet email:

Topic: ${topic}

Corps de l'email:
"${emailBody.substring(0, 300)}..."

Fournis uniquement le sujet, sans guillemets.
    `.trim();

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 50
    });

    return response.choices[0].message.content.trim();
  }

  /**
   * Smart Reply Suggestions
   */
  async generateSmartReplies(emailContent, count = 3) {
    if (!this.openai) {
      throw new Error('OpenAI client not configured');
    }

    const prompt = `
Analyse cet email et génère ${count} suggestions de réponses courtes et appropriées:

Email reçu:
"${emailContent}"

Génère des réponses de styles variés:
1. Réponse courte et directe
2. Réponse polie et détaillée
3. Réponse alternative

Format JSON:
{
  "replies": [
    {
      "type": "short|detailed|alternative",
      "text": "...",
      "tone": "professional|casual|friendly"
    }
  ]
}
    `.trim();

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Email Analysis
   */
  async analyzeEmail(emailContent) {
    if (!this.openai) {
      // Fallback simple analysis
      return {
        sentiment: 'neutral',
        priority: 'medium',
        category: 'other',
        requiresAction: false,
        actionType: 'read',
        suggestedDueDate: null,
        keyPoints: [],
        tone: 'professional',
        complexity: 'moderate'
      };
    }

    const prompt = `
Analyse complète de cet email:

"${emailContent}"

Fournis en JSON:
{
  "sentiment": "positive|neutral|negative",
  "priority": "low|medium|high|urgent",
  "category": "personal|work|sales|support|newsletter|spam",
  "requiresAction": true|false,
  "actionType": "reply|schedule|read|archive|delete",
  "suggestedDueDate": "YYYY-MM-DD ou null",
  "keyPoints": ["point1", "point2"],
  "tone": "professional|casual|friendly|formal|angry",
  "complexity": "simple|moderate|complex"
}
    `.trim();

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Smart Categorization
   */
  async categorizeEmails(emails) {
    const categories = {
      urgent: [],
      important: [],
      newsletters: [],
      social: [],
      promotions: [],
      spam: [],
      other: []
    };

    for (const email of emails) {
      try {
        const analysis = await this.analyzeEmail(email.snippet || email.subject || '');

        if (analysis.priority === 'urgent') {
          categories.urgent.push(email);
        } else if (analysis.priority === 'high') {
          categories.important.push(email);
        } else if (analysis.category === 'newsletter') {
          categories.newsletters.push(email);
        } else if (analysis.category === 'spam') {
          categories.spam.push(email);
        } else {
          categories.other.push(email);
        }
      } catch (error) {
        logger.error('Email categorization error:', error);
        categories.other.push(email);
      }
    }

    return categories;
  }

  /**
   * Email Templates Intelligents
   */
  getTemplates() {
    return {
      meeting_request: {
        name: 'Demande de réunion',
        subject: 'Demande de réunion - [TOPIC]',
        variables: ['recipient_name', 'topic', 'proposed_dates', 'duration'],
        generate: async (vars) => {
          return await this.composeEmailWithAI({
            purpose: 'new',
            recipient: vars.recipient_name,
            topic: vars.topic,
            tone: 'professional',
            keyPoints: [
              `Proposer une réunion de ${vars.duration}`,
              `Dates proposées: ${vars.proposed_dates.join(', ')}`,
              'Demander confirmation'
            ]
          });
        }
      },

      follow_up: {
        name: 'Relance',
        subject: 'Re: [ORIGINAL_SUBJECT]',
        variables: ['original_subject', 'days_since', 'context'],
        generate: async (vars) => {
          return await this.composeEmailWithAI({
            purpose: 'follow_up',
            topic: vars.original_subject,
            tone: 'professional',
            keyPoints: [
              `Faire référence à l'email du ${vars.days_since} jours`,
              'Rappeler poliment',
              'Demander si aide nécessaire'
            ]
          });
        }
      },

      thank_you: {
        name: 'Remerciement',
        subject: 'Merci - [REASON]',
        variables: ['recipient_name', 'reason'],
        generate: async (vars) => {
          return await this.composeEmailWithAI({
            purpose: 'new',
            recipient: vars.recipient_name,
            topic: `Remerciement pour ${vars.reason}`,
            tone: 'friendly',
            length: 'short',
            keyPoints: [
              'Exprimer gratitude sincère',
              'Mentionner impact positif',
              'Offrir aide en retour si pertinent'
            ]
          });
        }
      },

      cold_outreach: {
        name: 'Prospection',
        subject: '[PERSONALIZED] - [VALUE_PROPOSITION]',
        variables: ['recipient_name', 'company', 'value_proposition', 'pain_point'],
        generate: async (vars) => {
          return await this.composeEmailWithAI({
            purpose: 'cold_outreach',
            recipient: vars.recipient_name,
            topic: vars.value_proposition,
            tone: 'professional',
            keyPoints: [
              `Montrer connaissance de ${vars.company}`,
              `Identifier pain point: ${vars.pain_point}`,
              `Proposer solution: ${vars.value_proposition}`,
              'Call-to-action clair mais soft'
            ]
          });
        }
      }
    };
  }

  /**
   * Email Statistics
   */
  getStats() {
    return {
      totalProcessed: 0,
      aiComposed: 0,
      analyzed: 0,
      categorized: 0,
      templatesUsed: 0,
      averageComposeTime: 0
    };
  }
}

module.exports = EmailAgentPro;
