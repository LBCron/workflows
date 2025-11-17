/**
 * Learning Engine Ultimate v2.0
 *
 * Système d'apprentissage automatique avancé avec:
 * - Analyse comportementale profonde
 * - Adaptation contextuelle temps réel
 * - Prédiction intentions
 * - Suggestions proactives intelligentes
 * - Amélioration continue multi-modèles
 * - Memory consolidation nocturne
 */

const logger = require('./logger/logger');

class LearningEngineUltimate {
  constructor(memory, openaiClient) {
    this.memory = memory;
    this.openai = openaiClient;

    // Caches en mémoire
    this.userProfiles = new Map(); // userId → profile
    this.intentPatterns = new Map(); // userId → patterns
    this.contextWindows = new Map(); // userId → recent context
    this.predictionCache = new Map(); // query hash → prediction

    // Configuration
    this.config = {
      minConversationsForLearning: 10,
      contextWindowSize: 20,
      predictionCacheSize: 1000,
      learningBatchSize: 100,
      consolidationHour: 4, // 4h du matin
      adaptationThreshold: 0.7
    };

    // Métriques
    this.metrics = {
      predictionsCorrect: 0,
      predictionsTotal: 0,
      adaptationsApplied: 0,
      proactiveSuggestionsSent: 0,
      proactiveSuggestionsAccepted: 0
    };

    logger.info('🧠 Learning Engine Ultimate initialized');
  }

  /**
   * Analyser comportement utilisateur en profondeur
   */
  async analyzeUserBehaviorDeep(userId, conversationHistory = []) {
    logger.info(`🧠 Deep analysis for user ${userId}...`);

    if (conversationHistory.length < this.config.minConversationsForLearning) {
      logger.info(`⏳ Pas assez de données: ${conversationHistory.length} conversations`);
      return null;
    }

    try {
      // 1. Analyse multi-dimensionnelle avec GPT-4
      const analysis = await this.performMultiDimensionalAnalysis(conversationHistory);

      // 2. Détecter patterns temporels
      const temporalPatterns = this.detectTemporalPatterns(conversationHistory);

      // 3. Analyser séquences d'actions
      const actionSequences = this.analyzeActionSequences(conversationHistory);

      // 4. Identifier topics d'intérêt
      const topicInterests = await this.extractTopicInterests(conversationHistory);

      // 5. Prédire besoins futurs
      const futureNeeds = await this.predictFutureNeeds(conversationHistory, analysis);

      const profile = {
        userId,
        analyzedAt: new Date().toISOString(),
        conversationsAnalyzed: conversationHistory.length,

        // Dimensions comportementales
        communicationStyle: analysis.communicationStyle || {},
        expertise: analysis.expertiseLevel || {},
        preferences: analysis.preferences || {},

        // Patterns
        temporal: temporalPatterns,
        actionSequences: actionSequences,

        // Intérêts
        topics: topicInterests,

        // Prédictions
        futureNeeds: futureNeeds,

        // Méta
        confidence: this.calculateConfidenceScore(conversationHistory.length),
        version: '2.0'
      };

      // Sauvegarder
      this.userProfiles.set(userId, profile);

      logger.info(`✅ Profile créé avec ${Object.keys(profile).length} dimensions`);

      return profile;
    } catch (error) {
      logger.error('❌ Error analyzing user behavior:', error);
      return null;
    }
  }

  /**
   * Analyse multi-dimensionnelle avec GPT-4
   */
  async performMultiDimensionalAnalysis(history) {
    if (!this.openai) {
      logger.warn('⚠️ OpenAI client not available');
      return {
        communicationStyle: {},
        expertiseLevel: {},
        preferences: {}
      };
    }

    try {
      // Préparer échantillon représentatif
      const sample = this.selectRepresentativeSample(history, 50);

      const prompt = `Analyse approfondie de cet utilisateur sur ${history.length} conversations.

Échantillon (${sample.length} messages récents):
${sample.map((h, i) => `[${i+1}] User: ${h.message || h.user_message || ''}`).join('\n')}

Réponds en JSON:
{
  "communicationStyle": {
    "formality": 0-100,
    "verbosity": "concis|normal|verbeux",
    "tone": "professional|casual|technique"
  },
  "expertiseLevel": {
    "technical": 0-100,
    "overall": "débutant|intermédiaire|avancé|expert"
  },
  "preferences": {
    "preferred_features": [],
    "response_length_preferred": "short|medium|long",
    "prefers_examples": true|false
  }
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('❌ Error in multi-dimensional analysis:', error);
      return {
        communicationStyle: {},
        expertiseLevel: {},
        preferences: {}
      };
    }
  }

  /**
   * Sélectionner échantillon représentatif
   */
  selectRepresentativeSample(history, size) {
    if (history.length <= size) return history;

    // Stratégie: Mix de messages récents + anciens + variés
    const recent = history.slice(-Math.floor(size * 0.6));
    const old = history.slice(0, Math.floor(size * 0.4));

    return [...old, ...recent];
  }

  /**
   * Détecter patterns temporels
   */
  detectTemporalPatterns(history) {
    const byHour = new Array(24).fill(0);
    const byDayOfWeek = new Array(7).fill(0);

    history.forEach(conv => {
      const timestamp = conv.timestamp || conv.created_at || new Date();
      const date = new Date(timestamp);
      byHour[date.getHours()]++;
      byDayOfWeek[date.getDay()]++;
    });

    return {
      peakHours: this.findPeaks(byHour),
      peakDays: this.findPeaks(byDayOfWeek),
      dailyPattern: this.classifyDailyPattern(byHour),
      weeklyPattern: this.classifyWeeklyPattern(byDayOfWeek),
      consistency: this.calculateConsistency(history)
    };
  }

  findPeaks(array) {
    const max = Math.max(...array);
    if (max === 0) return [];

    return array
      .map((val, idx) => ({ value: val, index: idx }))
      .filter(item => item.value > max * 0.7)
      .map(item => item.index);
  }

  classifyDailyPattern(byHour) {
    const morning = byHour.slice(6, 12).reduce((a, b) => a + b, 0);
    const afternoon = byHour.slice(12, 18).reduce((a, b) => a + b, 0);
    const evening = byHour.slice(18, 24).reduce((a, b) => a + b, 0);
    const night = byHour.slice(0, 6).reduce((a, b) => a + b, 0);

    const max = Math.max(morning, afternoon, evening, night);

    if (max === morning) return 'morning_person';
    if (max === afternoon) return 'afternoon_person';
    if (max === evening) return 'evening_person';
    return 'night_owl';
  }

  classifyWeeklyPattern(byDayOfWeek) {
    const weekday = byDayOfWeek.slice(1, 6).reduce((a, b) => a + b, 0);
    const weekend = byDayOfWeek[0] + byDayOfWeek[6];

    if (weekday > weekend * 2) return 'weekday_focused';
    if (weekend > weekday * 2) return 'weekend_focused';
    return 'balanced';
  }

  calculateConsistency(history) {
    if (history.length < 7) return 'insufficient_data';

    const dates = history.map(h => {
      const timestamp = h.timestamp || h.created_at || new Date();
      return new Date(timestamp).toDateString();
    });

    const uniqueDays = new Set(dates).size;
    const firstDate = new Date(history[0].timestamp || history[0].created_at || new Date());
    const lastDate = new Date(history[history.length - 1].timestamp || history[history.length - 1].created_at || new Date());
    const totalDays = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));

    const usageRatio = uniqueDays / totalDays;

    if (usageRatio > 0.8) return 'very_consistent';
    if (usageRatio > 0.5) return 'consistent';
    if (usageRatio > 0.3) return 'occasional';
    return 'sporadic';
  }

  /**
   * Analyser séquences d'actions
   */
  analyzeActionSequences(history) {
    const sequences = [];

    // Fenêtre glissante pour détecter séquences
    for (let i = 0; i < history.length - 2; i++) {
      const sequence = [
        history[i].intent,
        history[i + 1].intent,
        history[i + 2].intent
      ].filter(Boolean);

      if (sequence.length === 3) {
        sequences.push(sequence.join(' → '));
      }
    }

    // Compter fréquences
    const sequenceCounts = {};
    sequences.forEach(seq => {
      sequenceCounts[seq] = (sequenceCounts[seq] || 0) + 1;
    });

    // Top sequences
    const topSequences = Object.entries(sequenceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([seq, count]) => ({
        sequence: seq,
        count,
        probability: sequences.length > 0 ? count / sequences.length : 0
      }));

    return {
      totalSequences: sequences.length,
      uniqueSequences: Object.keys(sequenceCounts).length,
      topSequences,
      markovChain: this.buildMarkovChain(history)
    };
  }

  buildMarkovChain(history) {
    const chain = {};

    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i].intent || 'unknown';
      const next = history[i + 1].intent || 'unknown';

      if (!chain[current]) {
        chain[current] = {};
      }

      chain[current][next] = (chain[current][next] || 0) + 1;
    }

    // Normaliser en probabilités
    for (const current in chain) {
      const total = Object.values(chain[current]).reduce((a, b) => a + b, 0);
      for (const next in chain[current]) {
        chain[current][next] = chain[current][next] / total;
      }
    }

    return chain;
  }

  /**
   * Extraire topics d'intérêt
   */
  async extractTopicInterests(history) {
    if (!this.openai) {
      return { main_topics: [], emerging_topics: [] };
    }

    try {
      // Combiner tous les messages
      const allText = history
        .map(h => h.message || h.user_message || '')
        .join(' ')
        .substring(0, 5000); // Limiter la taille

      const prompt = `Extrait les topics principaux de ces conversations:

Texte: ${allText}

Réponds en JSON:
{
  "main_topics": [
    {"topic": "nom", "relevance": 0-100}
  ]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('❌ Error extracting topics:', error);
      return { main_topics: [] };
    }
  }

  /**
   * Prédire besoins futurs
   */
  async predictFutureNeeds(history, analysis) {
    if (!this.openai) {
      return {
        immediate_needs: [],
        short_term_needs: [],
        long_term_needs: []
      };
    }

    try {
      const recentMessages = history.slice(-10).map(h => h.message || h.user_message || '').join(' | ');

      const prompt = `Basé sur l'historique, prédis les besoins futurs:

Historique récent: ${recentMessages}

Réponds en JSON:
{
  "immediate_needs": [],
  "short_term_needs": [],
  "recommended_features": []
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('❌ Error predicting needs:', error);
      return {
        immediate_needs: [],
        short_term_needs: []
      };
    }
  }

  calculateConfidenceScore(conversationCount) {
    if (conversationCount < 10) return 0.2;
    if (conversationCount < 50) return 0.5;
    if (conversationCount < 200) return 0.7;
    if (conversationCount < 1000) return 0.85;
    return 0.95;
  }

  /**
   * Adapter réponse en temps réel
   */
  async adaptResponseRealtime(userId, originalResponse, context) {
    const profile = this.userProfiles.get(userId);

    if (!profile || profile.confidence < this.config.adaptationThreshold) {
      return originalResponse; // Pas assez confiant pour adapter
    }

    if (!this.openai) {
      return originalResponse;
    }

    try {
      const prompt = `Adapte cette réponse selon le profil utilisateur:

Réponse originale: "${originalResponse}"

Profil:
- Verbosité préférée: ${profile.preferences.response_length_preferred || 'medium'}
- Expertise: ${profile.expertise.overall || 'intermédiaire'}

RÈGLES:
1. Garder le même contenu factuel
2. Adapter UNIQUEMENT le style et niveau de détail

Réponse adaptée:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      this.metrics.adaptationsApplied++;

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('❌ Error adapting response:', error);
      return originalResponse;
    }
  }

  /**
   * Prédire intent AVANT traitement
   */
  async predictIntentEnhanced(userId, message) {
    const profile = this.userProfiles.get(userId);

    if (!profile || !this.openai) {
      return null;
    }

    // Check cache
    const cacheKey = `${userId}:${message}`;
    if (this.predictionCache.has(cacheKey)) {
      return this.predictionCache.get(cacheKey);
    }

    try {
      const prompt = `Prédis l'intent de ce message:

Message: "${message}"

Réponds en JSON:
{
  "predicted_intent": "...",
  "confidence": 0-100
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 200
      });

      const prediction = JSON.parse(response.choices[0].message.content);

      // Cache
      if (this.predictionCache.size >= this.config.predictionCacheSize) {
        const firstKey = this.predictionCache.keys().next().value;
        this.predictionCache.delete(firstKey);
      }
      this.predictionCache.set(cacheKey, prediction);

      this.metrics.predictionsTotal++;

      return prediction;
    } catch (error) {
      logger.error('❌ Error predicting intent:', error);
      return null;
    }
  }

  /**
   * Générer suggestions proactives
   */
  async generateProactiveSuggestions(userId) {
    const profile = this.userProfiles.get(userId);

    if (!profile) return [];

    const suggestions = [];
    const now = new Date();
    const hour = now.getHours();

    // Basé sur patterns temporels
    if (profile.temporal?.peakHours?.includes(hour)) {
      if (profile.temporal.dailyPattern === 'morning_person' && hour >= 8 && hour <= 9) {
        suggestions.push({
          type: 'greeting',
          priority: 'high',
          message: `☀️ Bonjour ! C'est votre heure habituelle. Comment puis-je vous aider aujourd'hui ?`
        });
      }
    }

    // Basé sur besoins futurs prédits
    if (profile.futureNeeds?.immediate_needs) {
      for (const need of profile.futureNeeds.immediate_needs.slice(0, 2)) {
        suggestions.push({
          type: 'predicted_need',
          priority: 'medium',
          message: `💡 Suggestion: ${need}`
        });
      }
    }

    return suggestions.slice(0, 3); // Max 3 suggestions
  }

  /**
   * Feedback loop - Apprendre des interactions
   */
  async learnFromFeedback(userId, interaction) {
    const { predictedIntent, actualIntent } = interaction;

    // Mise à jour métriques
    if (predictedIntent === actualIntent) {
      this.metrics.predictionsCorrect++;
    }

    // Si erreur significative, déclencher ré-analyse
    if (predictedIntent !== actualIntent) {
      logger.warn(`❌ Prediction error: ${predictedIntent} → ${actualIntent}`);

      const accuracy = this.metrics.predictionsTotal > 0
        ? this.metrics.predictionsCorrect / this.metrics.predictionsTotal
        : 0;

      if (accuracy < 0.7 && this.metrics.predictionsTotal > 20) {
        logger.info('⚠️ Accuracy faible, ré-analyse recommandée');
      }
    }
  }

  /**
   * Get user profile
   */
  getUserProfile(userId) {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Get métriques système
   */
  getMetrics() {
    return {
      ...this.metrics,
      accuracy: this.metrics.predictionsTotal > 0
        ? ((this.metrics.predictionsCorrect / this.metrics.predictionsTotal * 100).toFixed(2) + '%')
        : 'N/A',
      cachedProfiles: this.userProfiles.size,
      cachedPredictions: this.predictionCache.size
    };
  }

  /**
   * Clear caches
   */
  clearCaches() {
    this.predictionCache.clear();
    this.contextWindows.clear();
    logger.info('🧹 Learning engine caches cleared');
  }
}

// Export singleton instance
let engineInstance = null;

function getLearningEngineInstance(memory, openaiClient) {
  if (!engineInstance) {
    engineInstance = new LearningEngineUltimate(memory, openaiClient);
  }
  return engineInstance;
}

module.exports = {
  LearningEngineUltimate,
  getLearningEngineInstance
};
