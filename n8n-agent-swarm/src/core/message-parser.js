/**
 * Message Parser - Détection d'intent intelligente
 *
 * Analyse les messages utilisateurs et détecte automatiquement:
 * - Le type d'action demandée (research, content, code)
 * - Les paramètres associés (depth, quality, type, etc.)
 * - Le niveau de complexité
 */

class MessageParser {
  /**
   * Détecte l'intention à partir d'un message
   * @param {string} text - Message utilisateur
   * @returns {Object} Intent détecté avec type et paramètres
   */
  static detect(text) {
    const t = text.toLowerCase();

    // RESEARCH - Détection
    const researchKeywords = [
      'recherche', 'trouve', 'cherche', 'infos', 'information',
      'qu\'est-ce', 'c\'est quoi', 'explique', 'définis',
      'comment', 'pourquoi', 'quand', 'où', 'qui'
    ];

    if (researchKeywords.some(k => t.includes(k))) {
      // Déterminer le niveau de profondeur
      let depth = 'standard';

      if (t.includes('approfondi') || t.includes('détaillé') ||
          t.includes('exhaustif') || t.includes('complet')) {
        depth = 'deep';
      } else if (t.includes('expert') || t.includes('académique') ||
                 t.includes('scientifique') || t.includes('recherche avancée')) {
        depth = 'expert';
      } else if (t.includes('rapide') || t.includes('simple') ||
                 t.includes('résumé') || text.length < 50) {
        depth = 'quick';
      }

      return {
        type: 'research',
        depth,
        query: text
      };
    }

    // CONTENT - Détection
    const contentKeywords = [
      'écris', 'crée', 'rédige', 'génère',
      'article', 'post', 'email', 'lettre',
      'texte', 'contenu', 'document'
    ];

    if (contentKeywords.some(k => t.includes(k))) {
      // Déterminer le type de contenu
      let contentType = 'blog-post';

      if (t.includes('linkedin') || t.includes('post social') ||
          t.includes('réseaux sociaux')) {
        contentType = 'social-post';
      } else if (t.includes('email') || t.includes('mail')) {
        contentType = 'email';
      } else if (t.includes('ad') || t.includes('pub') ||
                 t.includes('publicité')) {
        contentType = 'ad-copy';
      } else if (t.includes('seo') || t.includes('blog')) {
        contentType = 'blog-post';
      }

      // Déterminer la qualité
      let quality = 'standard';

      if (t.includes('professionnel') || t.includes('premium') ||
          t.includes('haute qualité')) {
        quality = 'high';
      } else if (t.includes('rapide') || t.includes('simple')) {
        quality = 'low';
      }

      return {
        type: 'content',
        contentType,
        quality,
        topic: text
      };
    }

    // CODE - Détection
    const codeKeywords = [
      'code', 'fonction', 'script', 'programme',
      'debug', 'génère', 'crée', 'développe',
      'optimise', 'améliore', 'review', 'corrige'
    ];

    if (codeKeywords.some(k => t.includes(k))) {
      // Déterminer l'action
      let action = 'generate';

      if (t.includes('debug') || t.includes('corrige') ||
          t.includes('bug') || t.includes('erreur')) {
        action = 'debug';
      } else if (t.includes('optimise') || t.includes('améliore') ||
                 t.includes('performe')) {
        action = 'optimize';
      } else if (t.includes('review') || t.includes('analyse') ||
                 t.includes('vérifie')) {
        action = 'review';
      } else if (t.includes('explique') || t.includes('commente')) {
        action = 'explain';
      }

      // Détecter le langage si mentionné
      let language = null;
      const languages = {
        'python': ['python', 'py'],
        'javascript': ['javascript', 'js', 'node'],
        'typescript': ['typescript', 'ts'],
        'java': ['java'],
        'c++': ['c++', 'cpp'],
        'go': ['go', 'golang'],
        'rust': ['rust'],
        'php': ['php'],
        'ruby': ['ruby'],
        'swift': ['swift']
      };

      for (const [lang, keywords] of Object.entries(languages)) {
        if (keywords.some(k => t.includes(k))) {
          language = lang;
          break;
        }
      }

      return {
        type: 'code',
        action,
        language,
        description: text
      };
    }

    // EMAIL - Détection (futur Email Agent)
    if (t.includes('email') || t.includes('mail') ||
        t.includes('gmail') || t.includes('outlook')) {
      return {
        type: 'email',
        action: 'compose', // ou 'read', 'send', 'summarize'
        description: text
      };
    }

    // CALENDAR - Détection (futur Calendar Agent)
    if (t.includes('agenda') || t.includes('calendrier') ||
        t.includes('rendez-vous') || t.includes('réunion') ||
        t.includes('événement')) {
      return {
        type: 'calendar',
        action: 'schedule', // ou 'list', 'check'
        description: text
      };
    }

    // Par défaut: Research rapide
    return {
      type: 'research',
      depth: 'quick',
      query: text
    };
  }

  /**
   * Extrait des entités du texte (dates, nombres, etc.)
   * @param {string} text
   * @returns {Object} Entités extraites
   */
  static extractEntities(text) {
    const entities = {
      dates: [],
      numbers: [],
      urls: [],
      emails: []
    };

    // Dates (format simple)
    const dateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
    entities.dates = text.match(dateRegex) || [];

    // Nombres
    const numberRegex = /\d+/g;
    entities.numbers = text.match(numberRegex) || [];

    // URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    entities.urls = text.match(urlRegex) || [];

    // Emails
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    entities.emails = text.match(emailRegex) || [];

    return entities;
  }

  /**
   * Estime la complexité d'une requête
   * @param {string} text
   * @returns {string} 'low', 'medium', 'high'
   */
  static estimateComplexity(text) {
    const length = text.length;
    const words = text.split(/\s+/).length;

    if (length < 50 || words < 10) {
      return 'low';
    } else if (length < 200 || words < 40) {
      return 'medium';
    } else {
      return 'high';
    }
  }
}

module.exports = MessageParser;
