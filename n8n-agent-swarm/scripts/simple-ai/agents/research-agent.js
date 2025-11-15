#!/usr/bin/env node

/**
 * Research Agent - Simple et efficace avec GPT-4 Mini
 *
 * Stratégie:
 * 1. Collecte sources gratuites (Wikipedia, News API)
 * 2. Synthèse avec GPT-4 Mini (ultra-cheap)
 * 3. Cache 24h (faits stables)
 */

const router = require('../simple-router');
const https = require('https');

class ResearchAgent {
  constructor() {
    this.stats = {
      queries: 0,
      totalCost: 0,
      cacheHits: 0
    };
  }

  async research(query, depth = 'standard') {
    this.stats.queries++;

    console.log(`\n🔍 RESEARCH AGENT`);
    console.log(`Query: "${query}"`);
    console.log(`Depth: ${depth}`);

    const startTime = Date.now();

    try {
      // 1. Collecte sources (GRATUIT)
      const sources = await this.collectSources(query);
      console.log(`📚 ${sources.length} sources collectées`);

      // 2. Synthèse avec GPT-4 Mini
      const prompt = this.buildPrompt(query, sources, depth);

      const result = await router.route(prompt, {
        systemPrompt: 'Tu es un expert en recherche et synthèse d\'information. Tu fournis des analyses claires, factuelles et bien structurées.',
        temperature: 0.5, // Plus factuel
        maxTokens: this.getMaxTokensByDepth(depth),
        type: 'research',
        cacheTTL: 24 * 60 * 60 * 1000 // 24h - faits stables
      });

      if (result.cached) this.stats.cacheHits++;
      this.stats.totalCost += result.cost || 0;

      const duration = Date.now() - startTime;

      return {
        query,
        depth,
        sources,
        synthesis: result.content,
        cost: result.cost || 0,
        cached: result.cached,
        duration,
        sourceCount: sources.length
      };

    } catch (error) {
      console.error('❌ Research error:', error.message);
      throw error;
    }
  }

  buildPrompt(query, sources, depth) {
    let prompt = `Recherche approfondie sur: ${query}\n\n`;

    if (sources.length > 0) {
      prompt += `Sources disponibles:\n\n`;
      sources.forEach((s, i) => {
        prompt += `${i + 1}. **${s.title}**\n`;
        prompt += `   ${s.snippet}\n`;
        if (s.url) prompt += `   Source: ${s.url}\n`;
        prompt += `\n`;
      });
    }

    prompt += `\nFournis une synthèse ${this.getDepthDescription(depth)}:\n\n`;

    switch (depth) {
      case 'quick':
        prompt += `1. Résumé en 2-3 phrases\n2. Point clé principal\n`;
        break;

      case 'standard':
        prompt += `1. Résumé (2-3 phrases)\n2. Points clés (5 points)\n3. Contexte important\n4. Sources citées\n`;
        break;

      case 'deep':
        prompt += `1. Résumé exécutif\n2. Analyse détaillée (7-10 points clés)\n3. Contexte et implications\n4. Tendances et perspectives\n5. Sources et références\n`;
        break;

      case 'expert':
        prompt += `1. Résumé exécutif complet\n2. Analyse approfondie (10+ points)\n3. Contexte historique et actuel\n4. Analyse critique et nuances\n5. Implications et perspectives futures\n6. Méthodologie et sources détaillées\n7. Recommandations\n`;
        break;
    }

    return prompt.trim();
  }

  getMaxTokensByDepth(depth) {
    const tokens = {
      quick: 500,
      standard: 1500,
      deep: 3000,
      expert: 6000
    };
    return tokens[depth] || tokens.standard;
  }

  getDepthDescription(depth) {
    const descriptions = {
      quick: 'rapide et concise',
      standard: 'claire et structurée',
      deep: 'approfondie et détaillée',
      expert: 'complète et exhaustive'
    };
    return descriptions[depth] || descriptions.standard;
  }

  async collectSources(query) {
    const sources = [];

    // Wikipedia (gratuit, rapide, fiable)
    try {
      const wiki = await this.searchWikipedia(query);
      if (wiki) sources.push(wiki);
    } catch (err) {
      console.log('⚠️  Wikipedia not available');
    }

    // News API (gratuit - 100 requêtes/jour)
    if (process.env.NEWS_API_KEY) {
      try {
        const news = await this.searchNews(query);
        sources.push(...news.slice(0, 3));
      } catch (err) {
        console.log('⚠️  News API not available');
      }
    }

    return sources;
  }

  async searchWikipedia(query) {
    return new Promise((resolve, reject) => {
      const url = `/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

      const options = {
        hostname: 'fr.wikipedia.org',
        port: 443,
        path: url,
        method: 'GET',
        headers: {
          'User-Agent': 'ResearchAgent/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              resolve({
                title: parsed.title,
                snippet: parsed.extract,
                url: parsed.content_urls?.desktop?.page,
                source: 'Wikipedia'
              });
            } catch {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(null);
      });

      req.end();
    });
  }

  async searchNews(query) {
    if (!process.env.NEWS_API_KEY) return [];

    return new Promise((resolve, reject) => {
      const url = `/v2/everything?q=${encodeURIComponent(query)}&pageSize=3&language=fr`;

      const options = {
        hostname: 'newsapi.org',
        port: 443,
        path: url,
        method: 'GET',
        headers: {
          'X-Api-Key': process.env.NEWS_API_KEY
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              resolve(
                (parsed.articles || []).map(a => ({
                  title: a.title,
                  snippet: a.description || '',
                  url: a.url,
                  source: a.source?.name || 'News'
                }))
              );
            } catch {
              resolve([]);
            }
          } else {
            resolve([]);
          }
        });
      });

      req.on('error', () => resolve([]));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve([]);
      });

      req.end();
    });
  }

  getStats() {
    return {
      queries: this.stats.queries,
      totalCost: this.stats.totalCost,
      totalCostFormatted: '€' + this.stats.totalCost.toFixed(6),
      cacheHits: this.stats.cacheHits,
      cacheRate: this.stats.queries > 0
        ? ((this.stats.cacheHits / this.stats.queries) * 100).toFixed(1) + '%'
        : '0%'
    };
  }
}

// Singleton
const researchAgent = new ResearchAgent();

module.exports = researchAgent;

// CLI test
if (require.main === module) {
  (async () => {
    const query = process.argv[2] || 'intelligence artificielle';
    const depth = process.argv[3] || 'standard';

    console.log('🧪 Testing Research Agent...\n');

    try {
      const result = await researchAgent.research(query, depth);

      console.log('\n' + '═'.repeat(60));
      console.log('📊 RÉSULTATS');
      console.log('═'.repeat(60));
      console.log(`\n${result.synthesis}\n`);
      console.log('═'.repeat(60));
      console.log(`\n📈 Stats:`);
      console.log(`   Sources: ${result.sourceCount}`);
      console.log(`   Coût: €${result.cost.toFixed(6)}`);
      console.log(`   Cached: ${result.cached}`);
      console.log(`   Duration: ${result.duration}ms`);

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  })();
}
