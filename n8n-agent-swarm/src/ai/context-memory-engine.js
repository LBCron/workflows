/**
 * Smart Context & Memory Engine v2.0
 *
 * Système de mémoire contextuelle avancé avec:
 * - Contextual Memory illimitée
 * - RAG (Retrieval Augmented Generation)
 * - Vector embeddings
 * - Semantic search
 * - Knowledge Base personnel
 * - Smart context switching
 * - Conversation summarization
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class ContextMemoryEngine extends EventEmitter {
  constructor(openaiClient = null) {
    super();

    this.openai = openaiClient;

    // Conversation history
    this.conversations = new Map(); // userId → conversation[]

    // Memory storage
    this.memories = new Map(); // userId → memories[]

    // Knowledge base
    this.knowledgeBase = new Map(); // userId → knowledge items[]

    // Embeddings cache
    this.embeddings = new Map(); // text → embedding vector

    // Context stacks (for multi-topic conversations)
    this.contextStacks = new Map(); // userId → context stack

    // Settings
    this.maxConversationLength = 1000; // messages
    this.maxMemories = 10000;
    this.embeddingModel = 'text-embedding-3-small';

    // Statistics
    this.stats = {
      conversationsTracked: 0,
      memoriesStored: 0,
      embeddingsGenerated: 0,
      knowledgeItems: 0,
      searches: 0
    };

    logger.info('🧠 Context & Memory Engine initialized');
  }

  /**
   * Conversation Tracking
   */
  async addMessage(userId, role, content, metadata = {}) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }

    const conversation = this.conversations.get(userId);

    const message = {
      role, // user | assistant | system
      content,
      timestamp: Date.now(),
      metadata
    };

    conversation.push(message);

    // Limit conversation length
    if (conversation.length > this.maxConversationLength) {
      // Summarize old messages before removing
      const toSummarize = conversation.splice(0, 100);
      await this.summarizeAndStore(userId, toSummarize);
    }

    this.stats.conversationsTracked++;

    // Detect context switch
    if (await this.detectContextSwitch(userId, content)) {
      this.pushContext(userId);
    }

    return message;
  }

  getConversation(userId, limit = 50) {
    const conversation = this.conversations.get(userId) || [];
    return conversation.slice(-limit);
  }

  async clearConversation(userId) {
    const conversation = this.conversations.get(userId);

    if (conversation && conversation.length > 0) {
      // Save summary before clearing
      await this.summarizeAndStore(userId, conversation);
    }

    this.conversations.delete(userId);
    logger.info(`🧹 Conversation cleared for user ${userId}`);
  }

  /**
   * Memory Storage
   */
  async storeMemory(userId, content, metadata = {}) {
    if (!this.memories.has(userId)) {
      this.memories.set(userId, []);
    }

    const memories = this.memories.get(userId);

    // Generate embedding for semantic search
    const embedding = await this.generateEmbedding(content);

    const memory = {
      id: this.generateId(),
      content,
      embedding,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        accessCount: 0,
        lastAccessed: null
      }
    };

    memories.push(memory);

    // Limit memories
    if (memories.length > this.maxMemories) {
      // Remove least accessed
      memories.sort((a, b) => a.metadata.accessCount - b.metadata.accessCount);
      memories.shift();
    }

    this.stats.memoriesStored++;

    logger.info(`💾 Memory stored for user ${userId}: ${content.substring(0, 50)}...`);

    return memory;
  }

  async recallMemories(userId, query, limit = 5) {
    const memories = this.memories.get(userId) || [];

    if (memories.length === 0) {
      return [];
    }

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    // Calculate similarity scores
    const scored = memories.map(memory => ({
      ...memory,
      similarity: this.cosineSimilarity(queryEmbedding, memory.embedding)
    }));

    // Sort by similarity
    scored.sort((a, b) => b.similarity - a.similarity);

    // Update access counts
    scored.slice(0, limit).forEach(memory => {
      memory.metadata.accessCount++;
      memory.metadata.lastAccessed = new Date().toISOString();
    });

    this.stats.searches++;

    return scored.slice(0, limit);
  }

  /**
   * Vector Embeddings
   */
  async generateEmbedding(text) {
    if (!this.openai) {
      // Fallback: simple hash-based pseudo-embedding
      return this.simpleEmbedding(text);
    }

    // Check cache
    const cached = this.embeddings.get(text);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text
      });

      const embedding = response.data[0].embedding;

      // Cache
      this.embeddings.set(text, embedding);

      this.stats.embeddingsGenerated++;

      return embedding;

    } catch (error) {
      logger.error('Embedding generation error:', error);
      return this.simpleEmbedding(text);
    }
  }

  simpleEmbedding(text) {
    // Fallback simple embedding (word frequency based)
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(384).fill(0); // Small vector

    words.forEach((word, i) => {
      const hash = this.hashString(word);
      const index = hash % vector.length;
      vector[index] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / (magnitude || 1));
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    if (magA === 0 || magB === 0) {
      return 0;
    }

    return dotProduct / (magA * magB);
  }

  /**
   * Knowledge Base
   */
  async addKnowledge(userId, title, content, metadata = {}) {
    if (!this.knowledgeBase.has(userId)) {
      this.knowledgeBase.set(userId, []);
    }

    const kb = this.knowledgeBase.get(userId);

    // Generate embedding
    const embedding = await this.generateEmbedding(content);

    const item = {
      id: this.generateId(),
      title,
      content,
      embedding,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    kb.push(item);

    this.stats.knowledgeItems++;

    logger.info(`📚 Knowledge added: ${title}`);

    return item;
  }

  async queryKnowledge(userId, query, limit = 3) {
    const kb = this.knowledgeBase.get(userId) || [];

    if (kb.length === 0) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Score by similarity
    const scored = kb.map(item => ({
      ...item,
      similarity: this.cosineSimilarity(queryEmbedding, item.embedding)
    }));

    // Sort and return top matches
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit);
  }

  async importDocument(userId, title, documentPath) {
    try {
      const content = await fs.readFile(documentPath, 'utf-8');

      // Split into chunks if large
      const chunks = this.chunkText(content, 1000);

      const items = [];

      for (let i = 0; i < chunks.length; i++) {
        const item = await this.addKnowledge(
          userId,
          `${title} - Part ${i + 1}`,
          chunks[i],
          { source: documentPath, part: i + 1, totalParts: chunks.length }
        );
        items.push(item);
      }

      logger.info(`📄 Document imported: ${title} (${chunks.length} parts)`);

      return items;

    } catch (error) {
      logger.error('Document import error:', error);
      throw error;
    }
  }

  chunkText(text, maxLength = 1000) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/);

    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Context Switching
   */
  async detectContextSwitch(userId, message) {
    // Simple heuristics for context switch detection
    const switchIndicators = [
      'changeons de sujet',
      'parlons de',
      'revenons à',
      'maintenant',
      'sinon',
      'autre chose',
      'au fait'
    ];

    const lowerMessage = message.toLowerCase();

    return switchIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  pushContext(userId) {
    if (!this.contextStacks.has(userId)) {
      this.contextStacks.set(userId, []);
    }

    const stack = this.contextStacks.get(userId);
    const currentContext = this.getConversation(userId);

    stack.push({
      conversation: [...currentContext],
      timestamp: Date.now()
    });

    // Clear current conversation for new context
    this.conversations.set(userId, []);

    logger.info(`🔄 Context pushed for user ${userId}`);
  }

  popContext(userId) {
    const stack = this.contextStacks.get(userId);

    if (!stack || stack.length === 0) {
      return null;
    }

    const previousContext = stack.pop();
    this.conversations.set(userId, previousContext.conversation);

    logger.info(`🔙 Context popped for user ${userId}`);

    return previousContext;
  }

  /**
   * Conversation Summarization
   */
  async summarizeConversation(userId, messages = null) {
    if (!this.openai) {
      return this.simpleSummary(messages || this.getConversation(userId));
    }

    try {
      const conversation = messages || this.getConversation(userId);

      if (conversation.length === 0) {
        return 'No conversation to summarize.';
      }

      // Build conversation text
      const conversationText = conversation
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Résume cette conversation en français, en extrayant les points clés et décisions importantes:\n\n${conversationText}`
          }
        ],
        temperature: 0.5
      });

      const summary = response.choices[0].message.content;

      logger.info(`📝 Conversation summarized: ${summary.substring(0, 100)}...`);

      return summary;

    } catch (error) {
      logger.error('Summarization error:', error);
      return this.simpleSummary(messages || this.getConversation(userId));
    }
  }

  simpleSummary(conversation) {
    if (conversation.length === 0) {
      return 'No messages.';
    }

    return `Conversation de ${conversation.length} messages du ${new Date(conversation[0].timestamp).toLocaleString()} au ${new Date(conversation[conversation.length - 1].timestamp).toLocaleString()}`;
  }

  async summarizeAndStore(userId, conversation) {
    const summary = await this.summarizeConversation(userId, conversation);
    await this.storeMemory(userId, summary, {
      type: 'summary',
      messageCount: conversation.length
    });
  }

  /**
   * RAG (Retrieval Augmented Generation)
   */
  async augmentPrompt(userId, query) {
    // Retrieve relevant memories
    const relevantMemories = await this.recallMemories(userId, query, 3);

    // Retrieve relevant knowledge
    const relevantKnowledge = await this.queryKnowledge(userId, query, 2);

    let augmentedPrompt = query;

    if (relevantMemories.length > 0 || relevantKnowledge.length > 0) {
      augmentedPrompt += '\n\n**Context from memory:**\n';

      relevantMemories.forEach(mem => {
        augmentedPrompt += `\n- ${mem.content}`;
      });

      if (relevantKnowledge.length > 0) {
        augmentedPrompt += '\n\n**From knowledge base:**\n';
        relevantKnowledge.forEach(kb => {
          augmentedPrompt += `\n- ${kb.title}: ${kb.content.substring(0, 200)}...`;
        });
      }
    }

    return augmentedPrompt;
  }

  /**
   * Utilities
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Export/Import
   */
  async exportUserData(userId) {
    return {
      conversations: this.conversations.get(userId) || [],
      memories: (this.memories.get(userId) || []).map(m => ({
        ...m,
        embedding: null // Don't export embeddings
      })),
      knowledge: (this.knowledgeBase.get(userId) || []).map(k => ({
        ...k,
        embedding: null
      })),
      exportedAt: new Date().toISOString()
    };
  }

  async importUserData(userId, data) {
    // Import conversations
    if (data.conversations) {
      this.conversations.set(userId, data.conversations);
    }

    // Import memories (regenerate embeddings)
    if (data.memories) {
      for (const memory of data.memories) {
        await this.storeMemory(userId, memory.content, memory.metadata);
      }
    }

    // Import knowledge
    if (data.knowledge) {
      for (const item of data.knowledge) {
        await this.addKnowledge(userId, item.title, item.content, item.metadata);
      }
    }

    logger.info(`📥 User data imported for ${userId}`);
  }

  /**
   * Statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeUsers: this.conversations.size,
      totalConversations: Array.from(this.conversations.values())
        .reduce((sum, conv) => sum + conv.length, 0),
      totalMemories: Array.from(this.memories.values())
        .reduce((sum, mems) => sum + mems.length, 0),
      totalKnowledge: Array.from(this.knowledgeBase.values())
        .reduce((sum, kb) => sum + kb.length, 0),
      embeddingsCached: this.embeddings.size
    };
  }
}

module.exports = ContextMemoryEngine;
