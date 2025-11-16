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

    // TRANSLATION - Détection
    const translationKeywords = ['traduis', 'translate', 'traduction'];
    if (translationKeywords.some(k => t.includes(k))) {
      // Extraire langue cible
      let targetLang = 'en';
      const langMap = {
        'anglais': 'en', 'english': 'en',
        'français': 'fr', 'french': 'fr',
        'espagnol': 'es', 'spanish': 'es',
        'allemand': 'de', 'german': 'de',
        'italien': 'it', 'italian': 'it',
        'portugais': 'pt', 'portuguese': 'pt',
        'chinois': 'zh', 'chinese': 'zh',
        'japonais': 'ja', 'japanese': 'ja',
        'arabe': 'ar', 'arabic': 'ar'
      };

      for (const [langName, langCode] of Object.entries(langMap)) {
        if (t.includes(langName)) {
          targetLang = langCode;
          break;
        }
      }

      // Extraire le texte à traduire (après ":" ou ":")
      let textToTranslate = text;
      const colonIndex = text.indexOf(':');
      if (colonIndex > -1) {
        textToTranslate = text.substring(colonIndex + 1).trim();
      }

      return {
        type: 'translation',
        targetLang,
        text: textToTranslate
      };
    }

    // IMAGE - Détection
    const imageKeywords = ['image', 'photo', 'picture', 'génère une image', 'crée une image', 'dessine'];
    if (imageKeywords.some(k => t.includes(k))) {
      // Extraire le prompt (tout le texte après les keywords)
      let prompt = text;
      for (const keyword of imageKeywords) {
        if (t.includes(keyword)) {
          const index = t.indexOf(keyword) + keyword.length;
          prompt = text.substring(text.toLowerCase().indexOf(keyword) + keyword.length).trim();
          break;
        }
      }

      return {
        type: 'image',
        prompt: prompt || text
      };
    }

    // EMAIL - Détection
    if (t.includes('email') || t.includes('mail') ||
        t.includes('gmail') || t.includes('outlook')) {

      let action = 'read';
      if (t.includes('envoie') || t.includes('send')) {
        action = 'send';
      } else if (t.includes('lis') || t.includes('read') || t.includes('check')) {
        action = 'read';
      }

      return {
        type: 'email',
        action,
        description: text
      };
    }

    // CALENDAR - Détection
    if (t.includes('agenda') || t.includes('calendrier') ||
        t.includes('rendez-vous') || t.includes('réunion') ||
        t.includes('événement')) {

      let action = 'list';
      if (t.includes('crée') || t.includes('ajoute') || t.includes('schedule')) {
        action = 'create';
      } else if (t.includes('liste') || t.includes('montre') || t.includes('affiche')) {
        action = 'list';
      }

      return {
        type: 'calendar',
        action,
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
