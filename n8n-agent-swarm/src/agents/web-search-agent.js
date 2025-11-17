/**
 * Web Search Agent
 *
 * Permet de rechercher sur le web et résumer les résultats avec IA
 * Utilise DuckDuckGo (gratuit) ou SerpAPI (si configuré)
 */

const axios = require('axios');

class WebSearchAgent {
  constructor(openai) {
    this.openai = openai;
    this.searchEngine = process.env.SEARCH_ENGINE || 'duckduckgo'; // ou 'serpapi'
    this.serpApiKey = process.env.SERPAPI_KEY;
  }

  /**
   * Recherche principale
   */
  async search(query, maxResults = 5) {
    console.log(`🔍 Searching: "${query}"`);

    let results = [];

    if (this.searchEngine === 'serpapi' && this.serpApiKey) {
      results = await this.searchSerpAPI(query, maxResults);
    } else {
      results = await this.searchDuckDuckGo(query, maxResults);
    }

    // Résumer avec GPT
    const summary = await this.summarizeResults(query, results);

    return {
      query,
      results,
      summary,
      source: this.searchEngine
    };
  }

  /**
   * Recherche avec DuckDuckGo (gratuit!)
   */
  async searchDuckDuckGo(query, maxResults) {
    try {
      // API DuckDuckGo
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_html: 1,
          skip_disambig: 1
        },
        timeout: 10000
      });

      const results = [];

      // Abstract principal
      if (response.data.Abstract) {
        results.push({
          title: response.data.Heading || 'DuckDuckGo Answer',
          snippet: response.data.Abstract,
          url: response.data.AbstractURL || '',
          source: response.data.AbstractSource || 'DuckDuckGo'
        });
      }

      // Related topics
      if (response.data.RelatedTopics) {
        const topics = response.data.RelatedTopics.slice(0, maxResults - 1);

        for (const topic of topics) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related',
              snippet: topic.Text,
              url: topic.FirstURL,
              source: 'DuckDuckGo'
            });
          } else if (topic.Topics) {
            // Nested topics
            for (const subtopic of topic.Topics.slice(0, 2)) {
              if (subtopic.Text && subtopic.FirstURL) {
                results.push({
                  title: subtopic.Text.split(' - ')[0],
                  snippet: subtopic.Text,
                  url: subtopic.FirstURL,
                  source: 'DuckDuckGo'
                });
              }
            }
          }
        }
      }

      return results.slice(0, maxResults);

    } catch (error) {
      console.error('DuckDuckGo search error:', error.message);
      throw new Error('Erreur recherche DuckDuckGo: ' + error.message);
    }
  }

  /**
   * Recherche avec SerpAPI (payant mais meilleur)
   */
  async searchSerpAPI(query, maxResults) {
    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          q: query,
          api_key: this.serpApiKey,
          num: maxResults
        },
        timeout: 10000
      });

      const results = [];

      // Organic results
      if (response.data.organic_results) {
        for (const result of response.data.organic_results.slice(0, maxResults)) {
          results.push({
            title: result.title,
            snippet: result.snippet || result.description || '',
            url: result.link,
            source: 'Google'
          });
        }
      }

      // Answer box si disponible
      if (response.data.answer_box && response.data.answer_box.answer) {
        results.unshift({
          title: 'Answer Box',
          snippet: response.data.answer_box.answer,
          url: response.data.answer_box.link || '',
          source: 'Google Answer'
        });
      }

      return results;

    } catch (error) {
      console.error('SerpAPI search error:', error.message);
      throw new Error('Erreur recherche SerpAPI: ' + error.message);
    }
  }

  /**
   * Résumer les résultats avec GPT
   */
  async summarizeResults(query, results) {
    if (results.length === 0) {
      return 'Aucun résultat trouvé.';
    }

    const prompt = `
Résume ces résultats de recherche pour la question: "${query}"

Résultats:
${results.map((r, i) => `
${i + 1}. **${r.title}**
${r.snippet}
Source: ${r.url}
`).join('\n')}

Instructions:
- Fournis un résumé clair et concis (3-5 paragraphes)
- Cite les sources avec [1], [2], etc.
- Mentionne les faits clés
- Si les résultats se contredisent, note-le
- Conclus avec une réponse directe à la question si possible
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant de recherche qui résume les résultats web de manière claire et factuelle.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error('GPT summarize error:', error);

      // Fallback: résumé basique
      return `Résultats pour "${query}":\n\n` +
        results.slice(0, 3).map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}\n`).join('\n');
    }
  }

  /**
   * Recherche avec focus sur actualités
   */
  async searchNews(query, maxResults = 5) {
    if (this.searchEngine === 'serpapi' && this.serpApiKey) {
      try {
        const response = await axios.get('https://serpapi.com/search', {
          params: {
            q: query,
            api_key: this.serpApiKey,
            tbm: 'nws', // News search
            num: maxResults
          },
          timeout: 10000
        });

        const results = [];

        if (response.data.news_results) {
          for (const result of response.data.news_results.slice(0, maxResults)) {
            results.push({
              title: result.title,
              snippet: result.snippet || '',
              url: result.link,
              source: result.source,
              date: result.date
            });
          }
        }

        const summary = await this.summarizeResults(query, results);

        return {
          query,
          results,
          summary,
          type: 'news'
        };

      } catch (error) {
        console.error('News search error:', error);
        return await this.search(query + ' news', maxResults);
      }
    } else {
      // Fallback: recherche normale avec "news"
      return await this.search(query + ' news', maxResults);
    }
  }

  /**
   * Recherche d'images (si SerpAPI)
   */
  async searchImages(query, maxResults = 5) {
    if (this.searchEngine === 'serpapi' && this.serpApiKey) {
      try {
        const response = await axios.get('https://serpapi.com/search', {
          params: {
            q: query,
            api_key: this.serpApiKey,
            tbm: 'isch', // Image search
            num: maxResults
          },
          timeout: 10000
        });

        const results = [];

        if (response.data.images_results) {
          for (const result of response.data.images_results.slice(0, maxResults)) {
            results.push({
              title: result.title || 'Image',
              url: result.original,
              thumbnail: result.thumbnail,
              source: result.source
            });
          }
        }

        return {
          query,
          results,
          type: 'images'
        };

      } catch (error) {
        console.error('Image search error:', error);
        throw new Error('Image search not available without SerpAPI');
      }
    } else {
      throw new Error('Image search requires SerpAPI (set SERPAPI_KEY)');
    }
  }

  /**
   * Recherche rapide (juste premier résultat)
   */
  async quickAnswer(question) {
    const results = await this.search(question, 3);

    if (results.results.length === 0) {
      return 'Aucune réponse trouvée.';
    }

    // Résumé ultra-court
    const prompt = `
Question: "${question}"

Meilleur résultat:
${results.results[0].snippet}

Réponds à la question en 1-2 phrases maximum, de manière directe et factuelle.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 100
      });

      return response.choices[0].message.content;

    } catch (error) {
      return results.results[0].snippet;
    }
  }
}

module.exports = WebSearchAgent;
