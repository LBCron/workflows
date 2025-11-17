#!/usr/bin/env node

/**
 * LLM Client Factory - Stub
 *
 * Factory pour créer des clients LLM (OpenAI, Anthropic, Groq, etc.)
 * STUB: Version minimale pour permettre au router de fonctionner
 */

const OpenAI = require('openai');

class LLMClientFactory {
  /**
   * Create client for specific provider and model
   */
  static create(provider, model) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY manquant');
    }

    // Pour l'instant, on retourne toujours un client OpenAI
    // TODO: Implémenter support pour Anthropic, Groq, etc.
    return new OpenAI({ apiKey });
  }
}

module.exports = { LLMClientFactory };
