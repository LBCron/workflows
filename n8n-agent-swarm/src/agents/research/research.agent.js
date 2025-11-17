#!/usr/bin/env node

/**
 * Research Agent PRO
 *
 * Agent de recherche multi-niveau avec coûts optimisés
 */

const router = require('../../core/router/router');

class ResearchAgentPro {
  constructor() {
    this.depths = {
      quick: {
        name: 'RAPIDE',
        description: 'Recherche rapide 1-3 sources',
        sourceCount: 2,
        maxTokens: 500,
        priority: 'low',
        expectedCost: 0
      },
      standard: {
        name: 'STANDARD',
        description: 'Recherche multi-sources 3-5',
        sourceCount: 5,
        maxTokens: 1500,
        priority: 'normal',
        expectedCost: 0.0005
      },
      deep: {
        name: 'APPROFONDI',
        description: 'Recherche exhaustive 5-10 sources',
        sourceCount: 8,
        maxTokens: 3000,
        priority: 'high',
        expectedCost: 0.003
      },
      expert: {
        name: 'EXPERT',
        description: 'Recherche niveau PhD 10+ sources',
        sourceCount: 12,
        maxTokens: 6000,
        priority: 'critical',
        expectedCost: 0.015
      }
    };
  }

  async research(query, depth = 'auto') {
    console.log(`🔍 Research: "${query}"`);

    // Determine depth
    const level = this.determineDepth(query, depth);
    console.log(`📊 Niveau: ${level.name}`);

    // Build research prompt
    const prompt = this.buildPrompt(query, level);

    // Route to appropriate model
    const result = await router.route(prompt, {
      type: 'research',
      priority: level.priority,
      maxTokens: level.maxTokens,
      factual: true // Longer cache TTL
    });

    return {
      query,
      level: level.name,
      synthesis: result.content,
      model: result.model,
      cost: result.cost,
      cached: result.cached
    };
  }

  determineDepth(query, userDepth) {
    if (userDepth !== 'auto') {
      return this.depths[userDepth] || this.depths.standard;
    }

    const q = query.toLowerCase();

    // Expert keywords
    if (q.includes('publication') || q.includes('académique') ||
        q.includes('thèse') || q.includes('scientifique') ||
        q.includes('recherche approfondie')) {
      return this.depths.expert;
    }

    // Deep keywords
    if (q.includes('analyse approfondie') || q.includes('détaillé') ||
        q.includes('complet') || q.includes('exhaustif')) {
      return this.depths.deep;
    }

    // Quick keywords
    if (q.includes('rapide') || q.includes('simple') ||
        q.includes('résumé') || q.length < 50) {
      return this.depths.quick;
    }

    return this.depths.standard;
  }

  buildPrompt(query, level) {
    let prompt = `Recherche ${level.name} sur le sujet suivant:\n\n"${query}"\n\n`;

    if (level.name === 'RAPIDE') {
      prompt += `Fournis une synthèse concise (3-5 points clés).`;
    } else if (level.name === 'STANDARD') {
      prompt += `Fournis une analyse structurée :\n`;
      prompt += `1. Résumé (2-3 phrases)\n`;
      prompt += `2. Points clés (5-7 points)\n`;
      prompt += `3. Insights principaux\n`;
    } else if (level.name === 'APPROFONDI') {
      prompt += `Fournis une analyse approfondie :\n`;
      prompt += `1. Contexte et enjeux\n`;
      prompt += `2. Analyse détaillée multi-angles\n`;
      prompt += `3. Points de consensus et divergences\n`;
      prompt += `4. Insights et implications\n`;
      prompt += `5. Recommandations\n`;
    } else { // EXPERT
      prompt += `Fournis une méta-analyse de niveau recherche :\n`;
      prompt += `1. Revue de littérature complète\n`;
      prompt += `2. Analyse critique\n`;
      prompt += `3. Méthodologie\n`;
      prompt += `4. Synthèse des résultats\n`;
      prompt += `5. Discussion et limitations\n`;
      prompt += `6. Implications pratiques\n`;
      prompt += `7. Pistes de recherche futures\n`;
    }

    return prompt;
  }
}

module.exports = new ResearchAgentPro();

// CLI
if (require.main === module) {
  const query = process.argv[2] || 'Intelligence artificielle tendances 2024';
  const depth = process.argv[3] || 'auto';

  (async () => {
    const agent = new ResearchAgentPro();
    const result = await agent.research(query, depth);

    console.log('\n📄 RÉSULTAT:');
    console.log('─'.repeat(60));
    console.log(result.synthesis);
    console.log('─'.repeat(60));
    console.log(`\n💰 Coût: €${result.cost} | Modèle: ${result.model} | Cached: ${result.cached}`);
  })();
}
