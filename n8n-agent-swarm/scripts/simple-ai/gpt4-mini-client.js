#!/usr/bin/env node

/**
 * GPT-4 Mini Client - Le seul dont tu as besoin !
 *
 * Ultra-cheap: €0.00015/1K input, €0.0006/1K output
 * Excellent pour: code, analyse, contenu, recherche, chat
 */

const https = require('https');

class GPT4MiniClient {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = 'gpt-4o-mini';
    this.stats = {
      totalCalls: 0,
      totalCost: 0,
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0
    };

    // Coûts ultra-cheap
    this.inputCostPer1K = 0.00015;   // €0.00015 par 1K tokens
    this.outputCostPer1K = 0.0006;   // €0.0006 par 1K tokens
  }

  async complete(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    this.stats.totalCalls++;
    const startTime = Date.now();

    try {
      const requestData = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || 'Tu es un assistant IA expert et efficace.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        max_tokens: options.maxTokens || 4000
      };

      const response = await this.request(requestData);

      // Calcul coût
      const usage = response.usage || {
        prompt_tokens: this.estimateTokens(prompt),
        completion_tokens: this.estimateTokens(response.choices[0].message.content),
        total_tokens: 0
      };
      usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;

      const cost = this.calculateCost(usage.prompt_tokens, usage.completion_tokens);

      this.stats.totalCost += cost;
      this.stats.totalTokens += usage.total_tokens;
      this.stats.inputTokens += usage.prompt_tokens;
      this.stats.outputTokens += usage.completion_tokens;

      const duration = Date.now() - startTime;

      return {
        content: response.choices[0].message.content,
        cost,
        tokens: usage.total_tokens,
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        model: this.model,
        duration
      };

    } catch (error) {
      console.error('❌ Erreur GPT-4 Mini:', error.message);
      throw error;
    }
  }

  async request(data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);

      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseData));
            } catch (e) {
              reject(new Error(`Failed to parse response: ${e.message}`));
            }
          } else {
            try {
              const error = JSON.parse(responseData);
              reject(new Error(`OpenAI Error: ${error.error?.message || res.statusCode}`));
            } catch {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  calculateCost(inputTokens, outputTokens) {
    const inputCost = (inputTokens / 1000) * this.inputCostPer1K;
    const outputCost = (outputTokens / 1000) * this.outputCostPer1K;
    return inputCost + outputCost;
  }

  estimateTokens(text) {
    // Approximation: 1 token ≈ 4 caractères
    return Math.ceil(text.length / 4);
  }

  getStats() {
    return {
      calls: this.stats.totalCalls,
      cost: this.stats.totalCost,
      costFormatted: '€' + this.stats.totalCost.toFixed(6),
      tokens: this.stats.totalTokens,
      inputTokens: this.stats.inputTokens,
      outputTokens: this.stats.outputTokens,
      avgCostPerCall: this.stats.totalCalls > 0
        ? this.stats.totalCost / this.stats.totalCalls
        : 0,
      avgCostPerCallFormatted: this.stats.totalCalls > 0
        ? '€' + (this.stats.totalCost / this.stats.totalCalls).toFixed(6)
        : '€0.000000'
    };
  }

  resetStats() {
    this.stats = {
      totalCalls: 0,
      totalCost: 0,
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0
    };
  }
}

// Singleton
const gpt4MiniClient = new GPT4MiniClient();

module.exports = gpt4MiniClient;

// CLI test
if (require.main === module) {
  (async () => {
    console.log('🧪 Testing GPT-4 Mini Client...\n');

    try {
      // Test simple
      const result = await gpt4MiniClient.complete('What is 2+2? Answer briefly.', {
        temperature: 0.3,
        maxTokens: 50
      });

      console.log('✅ Test successful!');
      console.log('\nResponse:', result.content);
      console.log('\nStats:');
      console.log(`  Cost: €${result.cost.toFixed(6)}`);
      console.log(`  Tokens: ${result.tokens} (${result.inputTokens} in, ${result.outputTokens} out)`);
      console.log(`  Duration: ${result.duration}ms`);
      console.log(`  Model: ${result.model}`);

      console.log('\nOverall Stats:');
      console.log(JSON.stringify(gpt4MiniClient.getStats(), null, 2));

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      if (!process.env.OPENAI_API_KEY) {
        console.log('\n💡 Set OPENAI_API_KEY environment variable to test');
      }
      process.exit(1);
    }
  })();
}
