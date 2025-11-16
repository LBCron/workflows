/**
 * 🌐 TRANSLATION AGENT v4.0
 * 
 * Traduction multilingue intelligente
 */

const logger = require('../../core/logger/logger');
const OpenAI = require('openai');

class TranslationAgent {
  constructor(config = {}) {
    this.config = config;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    this.supportedLanguages = [
      'fr', 'en', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ar', 'hi'
    ];

    logger.info('🌐 Translation Agent initialisé');
  }

  async translate(text, targetLanguage, sourceLanguage = 'auto') {
    try {
      const prompt = sourceLanguage === 'auto'
        ? 'Traduis ce texte en ' + targetLanguage + ':\n\n' + text
        : 'Traduis ce texte de ' + sourceLanguage + ' vers ' + targetLanguage + ':\n\n' + text;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un traducteur professionnel expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      const translated = response.choices[0].message.content;

      logger.info('✅ Traduction terminée', {
        from: sourceLanguage,
        to: targetLanguage,
        length: text.length
      });

      return {
        success: true,
        originalText: text,
        translatedText: translated,
        sourceLanguage,
        targetLanguage
      };
    } catch (error) {
      logger.error('❌ Erreur traduction', { error: error.message });
      throw error;
    }
  }

  async detectLanguage(text) {
    try {
      const prompt = 'Détecte la langue de ce texte et réponds juste avec le code ISO (fr, en, es, etc):\n\n' + text;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0
      });

      const language = response.choices[0].message.content.trim().toLowerCase();

      logger.info('✅ Langue détectée', { language });

      return {
        language,
        text: text.substring(0, 100)
      };
    } catch (error) {
      logger.error('❌ Erreur détection langue', { error: error.message });
      throw error;
    }
  }

  async translateBatch(texts, targetLanguage) {
    try {
      const translations = await Promise.all(
        texts.map(text => this.translate(text, targetLanguage))
      );

      logger.info('✅ Traduction batch terminée', {
        count: texts.length,
        target: targetLanguage
      });

      return {
        success: true,
        translations,
        count: texts.length
      };
    } catch (error) {
      logger.error('❌ Erreur traduction batch', { error: error.message });
      throw error;
    }
  }

  async improveTranslation(originalText, translatedText, context = '') {
    try {
      const prompt = 'Améliore cette traduction en tenant compte du contexte.\n\nTexte original: ' + originalText + '\n\nTraduction actuelle: ' + translatedText + '\n\nContexte: ' + context;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un expert en traduction de haute qualité.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      const improved = response.choices[0].message.content;

      logger.info('✅ Traduction améliorée');

      return {
        success: true,
        originalTranslation: translatedText,
        improvedTranslation: improved
      };
    } catch (error) {
      logger.error('❌ Erreur amélioration traduction', { error: error.message });
      throw error;
    }
  }
}

module.exports = TranslationAgent;
