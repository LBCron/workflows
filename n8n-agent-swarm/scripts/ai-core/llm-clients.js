#!/usr/bin/env node

/**
 * Unified LLM Client
 *
 * Wrapper unifié pour tous les modèles IA avec interface standardisée
 */

const https = require('https');
const http = require('http');

/**
 * Base LLM Client
 */
class BaseLLMClient {
  constructor(config) {
    this.config = config;
  }

  async request(url, options, data) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.request(url, options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseData));
            } catch (e) {
              resolve(responseData);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async complete(prompt, options = {}) {
    throw new Error('Must be implemented by subclass');
  }

  estimateCost(inputTokens, outputTokens) {
    return (inputTokens / 1000) * this.config.pricing.input +
           (outputTokens / 1000) * this.config.pricing.output;
  }

  countTokens(text) {
    // Approximation simple: 1 token ≈ 4 caractères
    return Math.ceil(text.length / 4);
  }
}

/**
 * OpenAI Client (GPT-4, GPT-4-mini)
 */
class OpenAIClient extends BaseLLMClient {
  constructor(model = 'gpt-4o-mini') {
    const configs = {
      'gpt-4-turbo': {
        name: 'gpt-4-turbo-preview',
        pricing: { input: 0.01, output: 0.03 }
      },
      'gpt-4o-mini': {
        name: 'gpt-4o-mini',
        pricing: { input: 0.00015, output: 0.0006 }
      }
    };

    super(configs[model] || configs['gpt-4o-mini']);
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  async complete(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    const url = 'https://api.openai.com/v1/chat/completions';

    const data = {
      model: this.config.name,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    };

    const response = await this.request(url, requestOptions, data);

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      model: this.config.name
    };
  }
}

/**
 * Anthropic Client (Claude Opus, Sonnet, Haiku)
 */
class AnthropicClient extends BaseLLMClient {
  constructor(model = 'claude-3-haiku') {
    const configs = {
      'claude-3-opus': {
        name: 'claude-3-opus-20240229',
        pricing: { input: 0.015, output: 0.075 }
      },
      'claude-3-sonnet': {
        name: 'claude-3-5-sonnet-20241022',
        pricing: { input: 0.003, output: 0.015 }
      },
      'claude-3-haiku': {
        name: 'claude-3-5-haiku-20241022',
        pricing: { input: 0.00025, output: 0.00125 }
      }
    };

    super(configs[model] || configs['claude-3-haiku']);
    this.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  async complete(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }

    const url = 'https://api.anthropic.com/v1/messages';

    const data = {
      model: this.config.name,
      max_tokens: options.maxTokens || 4000,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    const response = await this.request(url, requestOptions, data);

    return {
      content: response.content[0].text,
      usage: response.usage,
      model: this.config.name
    };
  }
}

/**
 * Groq Client (Llama 3 - GRATUIT!)
 */
class GroqClient extends BaseLLMClient {
  constructor(model = 'llama-3-70b') {
    const configs = {
      'llama-3-70b': {
        name: 'llama3-70b-8192',
        pricing: { input: 0, output: 0 } // GRATUIT!
      },
      'llama-3-8b': {
        name: 'llama3-8b-8192',
        pricing: { input: 0, output: 0 } // GRATUIT!
      }
    };

    super(configs[model] || configs['llama-3-70b']);
    this.apiKey = process.env.GROQ_API_KEY;
  }

  async complete(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY not set');
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const data = {
      model: this.config.name,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    };

    const response = await this.request(url, requestOptions, data);

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      model: this.config.name
    };
  }
}

/**
 * Google Client (Gemini)
 */
class GoogleClient extends BaseLLMClient {
  constructor(model = 'gemini-flash') {
    const configs = {
      'gemini-pro': {
        name: 'gemini-1.5-pro',
        pricing: { input: 0.00125, output: 0.005 }
      },
      'gemini-flash': {
        name: 'gemini-1.5-flash',
        pricing: { input: 0.000075, output: 0.0003 }
      }
    };

    super(configs[model] || configs['gemini-flash']);
    this.apiKey = process.env.GOOGLE_API_KEY;
  }

  async complete(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY not set');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.name}:generateContent?key=${this.apiKey}`;

    const data = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 4000
      }
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await this.request(url, requestOptions, data);

    return {
      content: response.candidates[0].content.parts[0].text,
      usage: response.usageMetadata,
      model: this.config.name
    };
  }
}

/**
 * Client Factory
 */
class LLMClientFactory {
  static create(provider, model) {
    switch (provider) {
      case 'openai':
        return new OpenAIClient(model);
      case 'anthropic':
        return new AnthropicClient(model);
      case 'groq':
        return new GroqClient(model);
      case 'google':
        return new GoogleClient(model);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  static getDefaultClient() {
    // Try free first
    if (process.env.GROQ_API_KEY) {
      return new GroqClient('llama-3-70b');
    }

    // Then cheap
    if (process.env.OPENAI_API_KEY) {
      return new OpenAIClient('gpt-4o-mini');
    }

    if (process.env.ANTHROPIC_API_KEY) {
      return new AnthropicClient('claude-3-haiku');
    }

    if (process.env.GOOGLE_API_KEY) {
      return new GoogleClient('gemini-flash');
    }

    throw new Error('No LLM API keys configured');
  }
}

module.exports = {
  OpenAIClient,
  AnthropicClient,
  GroqClient,
  GoogleClient,
  LLMClientFactory
};

// CLI test
if (require.main === module) {
  (async () => {
    console.log('🧪 Testing LLM Clients...\n');

    try {
      const client = LLMClientFactory.getDefaultClient();
      console.log('✅ Default client created');

      console.log('\n📝 Testing completion...');
      const result = await client.complete('Say "Hello World" in one word');
      console.log('Response:', result.content);
      console.log('Model:', result.model);

      console.log('\n✅ LLM Client test passed!');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.log('\n💡 Set environment variables:');
      console.log('   OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, or GOOGLE_API_KEY');
    }
  })();
}
