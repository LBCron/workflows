#!/usr/bin/env node

/**
 * Content Creator - Simple avec GPT-4 Mini
 *
 * Crée du contenu professionnel:
 * - Blog posts
 * - Social media posts
 * - Emails
 * - Scripts vidéo
 *
 * Optimisé pour SEO et lisibilité
 */

const router = require('../simple-router');

class ContentCreator {
  constructor() {
    this.stats = {
      created: 0,
      totalCost: 0,
      cacheHits: 0,
      byType: {}
    };

    this.contentTypes = [
      'blog-post',
      'social-post',
      'email',
      'script-video',
      'ad-copy',
      'newsletter'
    ];
  }

  async create(type, topic, options = {}) {
    this.stats.created++;
    if (!this.stats.byType[type]) {
      this.stats.byType[type] = 0;
    }
    this.stats.byType[type]++;

    console.log(`\n✍️  CONTENT CREATOR`);
    console.log(`Type: ${type}`);
    console.log(`Topic: "${topic}"`);

    const startTime = Date.now();

    try {
      // Build prompt
      const prompt = this.buildPrompt(type, topic, options);

      // Generate content
      const result = await router.route(prompt, {
        systemPrompt: 'Tu es un expert en création de contenu professionnel et engageant. Tu maîtrises le copywriting, le SEO et le storytelling.',
        temperature: 0.8, // Plus créatif
        maxTokens: this.getMaxTokensByType(type),
        type: 'content',
        cacheTTL: 6 * 60 * 60 * 1000 // 6h
      });

      if (result.cached) this.stats.cacheHits++;
      this.stats.totalCost += result.cost || 0;

      // Analyse et optimisation
      const analysis = this.analyzeContent(result.content, type);

      const duration = Date.now() - startTime;

      return {
        type,
        topic,
        content: result.content,
        analysis,
        cost: result.cost || 0,
        cached: result.cached,
        duration
      };

    } catch (error) {
      console.error('❌ Content creation error:', error.message);
      throw error;
    }
  }

  buildPrompt(type, topic, options) {
    const templates = {
      'blog-post': this.buildBlogPrompt(topic, options),
      'social-post': this.buildSocialPrompt(topic, options),
      'email': this.buildEmailPrompt(topic, options),
      'script-video': this.buildScriptPrompt(topic, options),
      'ad-copy': this.buildAdPrompt(topic, options),
      'newsletter': this.buildNewsletterPrompt(topic, options)
    };

    return templates[type] || templates['blog-post'];
  }

  buildBlogPrompt(topic, options) {
    return `
Écris un article de blog professionnel et engageant sur: ${topic}

Structure requise:
1. **Titre accrocheur** (H1) - Maximum 60 caractères
2. **Introduction** (2-3 paragraphes)
   - Hook captivant
   - Contexte
   - Promesse de valeur
3. **Corps principal** (5-7 sections H2)
   - Chaque section avec 2-3 paragraphes
   - Données, exemples concrets
   - Transition fluide entre sections
4. **Conclusion** (2 paragraphes)
   - Résumé des points clés
   - Call-to-action puissant

Ton: ${options.tone || 'professionnel et accessible'}
Longueur cible: ${options.length || '800-1000 mots'}
Public: ${options.audience || 'professionnels et passionnés'}

Optimisations:
- SEO-friendly (mots-clés naturels)
- Scannable (listes, sous-titres)
- Engageant (storytelling, questions rhétoriques)
- Actionnable (conseils pratiques)
    `.trim();
  }

  buildSocialPrompt(topic, options) {
    const platform = options.platform || 'LinkedIn';
    const maxLength = {
      'LinkedIn': '1300 caractères',
      'Twitter': '280 caractères',
      'Facebook': '400 caractères',
      'Instagram': '2200 caractères'
    }[platform] || '300 caractères';

    return `
Crée un post ${platform} engageant sur: ${topic}

Structure:
1. **Hook puissant** (première ligne captivante)
2. **Corps** (valeur ajoutée claire)
   - Insight ou conseil actionnable
   - Données ou exemple si pertinent
   - ${platform === 'LinkedIn' ? 'Style professionnel mais humain' : 'Style conversationnel'}
3. **Call-to-action** (question, invitation, next step)

Longueur: ${maxLength}
Ton: ${options.tone || 'professionnel mais accessible'}
Emojis: ${options.emojis !== false ? 'Oui, utilisés stratégiquement' : 'Non'}

Hashtags: ${options.hashtags !== false ? '3-5 hashtags pertinents' : 'Aucun'}
    `.trim();
  }

  buildEmailPrompt(topic, options) {
    return `
Rédige un email professionnel sur: ${topic}

Structure:
1. **Objet** (max 50 caractères, percutant)
2. **Pré-header** (complément de l'objet, 40-60 caractères)
3. **Salutation personnalisée**
4. **Introduction** (1 paragraphe - établir contexte)
5. **Corps principal** (2-3 paragraphes concis)
   - Valeur claire
   - Bénéfices concrets
   - Preuves/exemples si pertinent
6. **Call-to-action** (clair, unique, actionnable)
7. **Signature professionnelle**

Ton: ${options.tone || 'professionnel et cordial'}
Type: ${options.emailType || 'informatif'}
Public: ${options.audience || 'professionnels'}
    `.trim();
  }

  buildScriptPrompt(topic, options) {
    const duration = options.duration || '5-7 minutes';

    return `
Écris un script vidéo YouTube professionnel sur: ${topic}

Durée cible: ${duration}

Structure avec timestamps:
1. **HOOK (0:00-0:10)** - 10 secondes captivantes
   - Question provocante OU statistique choc OU promesse
2. **INTRO (0:10-0:30)** - Présentation
   - Qui es-tu, pourquoi t'écouter
   - Plan de la vidéo
3. **CORPS PRINCIPAL (0:30-${duration === '5-7 minutes' ? '6:00' : '8:00'})**
   - Section 1 (timestamp) - Titre + contenu
   - Section 2 (timestamp) - Titre + contenu
   - Section 3 (timestamp) - Titre + contenu
   - [Ajouter plus si nécessaire]
   - Exemples, anecdotes, visuels à mentionner
4. **CONCLUSION (dernière minute)**
   - Récap rapide (30s)
   - CTA: like, subscribe, comment (15s)
   - Outro (15s)

Format:
[TIMESTAMP] - Titre Section
[VISUEL: description]
Texte à dire...

Ton: ${options.tone || 'dynamique et accessible'}
Style: ${options.style || 'éducatif et engageant'}
    `.trim();
  }

  buildAdPrompt(topic, options) {
    return `
Crée un copy publicitaire pour: ${topic}

Format: ${options.format || 'Google Ads / Facebook Ads'}

Éléments requis:
1. **Titre principal** (30 caractères max, percutant)
2. **Sous-titres** (2-3 variations, 90 caractères max chacun)
3. **Description** (150-200 caractères)
   - Bénéfice #1
   - Bénéfice #2
   - Urgence/scarcité si pertinent
4. **Call-to-action** (court et actionnable)

Ton: ${options.tone || 'persuasif mais authentique'}
Public cible: ${options.audience || 'large'}
Offre: ${options.offer || 'à définir'}

Techniques:
- AIDA (Attention, Intérêt, Désir, Action)
- Urgence/scarcité
- Preuve sociale
- Bénéfices > Fonctionnalités
    `.trim();
  }

  buildNewsletterPrompt(topic, options) {
    return `
Rédige une newsletter engageante sur: ${topic}

Structure:
1. **Sujet email** (40-50 caractères, ouverture garantie)
2. **Header personnalisé** (salutation + intro courte)
3. **Article principal** (300-400 mots)
   - Titre H2 accrocheur
   - Contenu de valeur
   - Visuels suggérés
4. **Section "En bref"** (3-4 news courtes, 50 mots chacune)
5. **Recommandation** (1 ressource/outil/article)
6. **CTA final** (invitation claire)
7. **Footer** (liens sociaux, désabonnement)

Ton: ${options.tone || 'friendly et professionnel'}
Fréquence: ${options.frequency || 'hebdomadaire'}
Public: ${options.audience || 'abonnés engagés'}
    `.trim();
  }

  getMaxTokensByType(type) {
    const tokens = {
      'blog-post': 3000,
      'social-post': 300,
      'email': 800,
      'script-video': 2500,
      'ad-copy': 400,
      'newsletter': 2000
    };
    return tokens[type] || 1500;
  }

  analyzeContent(content, type) {
    const analysis = {
      wordCount: 0,
      charCount: content.length,
      seoScore: 0,
      readabilityScore: 0,
      engagementScore: 0
    };

    // Word count
    analysis.wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    // SEO Score (0-100)
    let seo = 50;
    if (content.match(/^#{1,3}\s/m)) seo += 15; // Headers
    if (analysis.wordCount > 300) seo += 10;
    if (analysis.wordCount > 800) seo += 15;
    if (content.match(/\*\*.*?\*\*/g)) seo += 10; // Bold text
    analysis.seoScore = Math.min(seo, 100);

    // Readability Score (0-100)
    let readability = 50;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = sentences > 0 ? analysis.wordCount / sentences : 0;

    if (avgWordsPerSentence < 20) readability += 20;
    if (avgWordsPerSentence < 15) readability += 15;
    if (content.match(/^[-•*]\s/m)) readability += 15; // Lists
    analysis.readabilityScore = Math.min(readability, 100);

    // Engagement Score (0-100)
    let engagement = 50;
    if (content.match(/\?/g)?.length > 0) engagement += 15; // Questions
    if (content.match(/!\s/g)?.length > 0) engagement += 10; // Exclamations
    if (type === 'social-post' && content.match(/[👍🎯✨💡🚀]/g)) engagement += 15; // Emojis
    if (content.toLowerCase().includes('vous') || content.toLowerCase().includes('votre')) {
      engagement += 10; // Direct address
    }
    analysis.engagementScore = Math.min(engagement, 100);

    return analysis;
  }

  getStats() {
    return {
      created: this.stats.created,
      totalCost: this.stats.totalCost,
      totalCostFormatted: '€' + this.stats.totalCost.toFixed(6),
      cacheHits: this.stats.cacheHits,
      cacheRate: this.stats.created > 0
        ? ((this.stats.cacheHits / this.stats.created) * 100).toFixed(1) + '%'
        : '0%',
      byType: this.stats.byType
    };
  }
}

// Singleton
const contentCreator = new ContentCreator();

module.exports = contentCreator;

// CLI test
if (require.main === module) {
  (async () => {
    const type = process.argv[2] || 'blog-post';
    const topic = process.argv[3] || 'Les avantages de GPT-4 Mini pour les startups';

    console.log('🧪 Testing Content Creator...\n');

    try {
      const result = await contentCreator.create(type, topic, {
        tone: 'professionnel',
        length: '500 mots'
      });

      console.log('\n' + '═'.repeat(60));
      console.log('📝 CONTENU GÉNÉRÉ');
      console.log('═'.repeat(60));
      console.log(`\n${result.content}\n`);
      console.log('═'.repeat(60));
      console.log(`\n📊 Analyse:`);
      console.log(`   Mots: ${result.analysis.wordCount}`);
      console.log(`   SEO Score: ${result.analysis.seoScore}/100`);
      console.log(`   Readability: ${result.analysis.readabilityScore}/100`);
      console.log(`   Engagement: ${result.analysis.engagementScore}/100`);
      console.log(`\n💰 Coût: €${result.cost.toFixed(6)}`);
      console.log(`   Cached: ${result.cached}`);
      console.log(`   Duration: ${result.duration}ms`);

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  })();
}
