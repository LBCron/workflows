#!/usr/bin/env node

/**
 * Content Creator Agent PRO
 *
 * Création de contenu avec qualité adaptative
 */

const router = require('../../core/router/router');

class ContentCreatorPro {
  constructor() {
    this.qualities = {
      basic: {
        name: 'BASIQUE',
        description: 'Brouillon rapide',
        maxTokens: 800,
        priority: 'low',
        temperature: 0.7
      },
      standard: {
        name: 'STANDARD',
        description: 'Qualité correcte',
        maxTokens: 1500,
        priority: 'normal',
        temperature: 0.8
      },
      high: {
        name: 'HAUTE',
        description: 'Qualité professionnelle',
        maxTokens: 2500,
        priority: 'high',
        temperature: 0.8
      },
      premium: {
        name: 'PREMIUM',
        description: 'Excellence éditoriale',
        maxTokens: 4000,
        priority: 'critical',
        temperature: 0.9
      }
    };

    this.templates = {
      'blog-post': {
        basic: 'Article simple avec intro + 3 sections + conclusion',
        standard: 'Article structuré avec H2/H3 optimisé SEO',
        high: 'Article professionnel avec storytelling et CTA',
        premium: 'Article expert avec données, citations, insights uniques'
      },
      'email': {
        basic: 'Email simple et direct',
        standard: 'Email professionnel bien structuré',
        high: 'Email persuasif optimisé conversions',
        premium: 'Email stratégique de négociation/vente'
      },
      'social-post': {
        basic: 'Post simple 1-2 phrases',
        standard: 'Post engageant avec hook + value + CTA',
        high: 'Post viral avec storytelling + émojis + hashtags',
        premium: 'Post thought leader avec insights uniques'
      }
    };
  }

  async create(request) {
    const { type, topic, quality = 'auto', ...options } = request;

    console.log(`✍️  Creating ${type}: "${topic}"`);

    // Determine quality
    const level = this.determineQuality(request, quality);
    console.log(`📊 Qualité: ${level.name}`);

    // Build prompt
    const prompt = this.buildPrompt(type, topic, level, options);

    // Route
    const result = await router.route(prompt, {
      type: 'creative',
      priority: level.priority,
      maxTokens: level.maxTokens,
      temperature: level.temperature
    });

    return {
      type,
      topic,
      quality: level.name,
      content: result.content,
      model: result.model,
      cost: result.cost,
      cached: result.cached
    };
  }

  determineQuality(request, userQuality) {
    if (userQuality !== 'auto') {
      return this.qualities[userQuality] || this.qualities.standard;
    }

    // Auto-detect
    if (request.forPublication || request.professional) {
      return this.qualities.premium;
    }

    if (request.seo || request.marketing) {
      return this.qualities.high;
    }

    if (request.draft || request.internal) {
      return this.qualities.standard;
    }

    if (request.quick) {
      return this.qualities.basic;
    }

    return this.qualities.standard;
  }

  buildPrompt(type, topic, level, options = {}) {
    let prompt = `Crée un ${type} de qualité ${level.name} sur le sujet:\n\n"${topic}"\n\n`;

    // Template
    const template = this.templates[type]?.[level.name.toLowerCase()];
    if (template) {
      prompt += `Style: ${template}\n\n`;
    }

    // Quality requirements
    if (level.name === 'PREMIUM') {
      prompt += `Exigences PREMIUM:\n`;
      prompt += `- Insights originaux et recherche approfondie\n`;
      prompt += `- Storytelling captivant\n`;
      prompt += `- Données et exemples concrets\n`;
      prompt += `- Style éditorial excellence\n`;
      prompt += `- SEO optimisé\n`;
      prompt += `- CTA puissant\n\n`;
    } else if (level.name === 'HAUTE') {
      prompt += `Exigences HAUTE QUALITÉ:\n`;
      prompt += `- Bien structuré\n`;
      prompt += `- Ton professionnel\n`;
      prompt += `- SEO friendly\n`;
      prompt += `- Valeur ajoutée claire\n\n`;
    }

    // Options
    if (options.tone) prompt += `Ton: ${options.tone}\n`;
    if (options.audience) prompt += `Audience: ${options.audience}\n`;
    if (options.length) prompt += `Longueur: ${options.length} mots\n`;

    return prompt;
  }
}

module.exports = new ContentCreatorPro();

// CLI
if (require.main === module) {
  const type = process.argv[2] || 'blog-post';
  const topic = process.argv[3] || 'Intelligence Artificielle en 2024';
  const quality = process.argv[4] || 'standard';

  (async () => {
    const agent = new ContentCreatorPro();
    const result = await agent.create({ type, topic, quality });

    console.log('\n📄 CONTENU:');
    console.log('='.repeat(60));
    console.log(result.content);
    console.log('='.repeat(60));
    console.log(`\n💰 Coût: €${result.cost} | Modèle: ${result.model} | Qualité: ${result.quality}`);
  })();
}
