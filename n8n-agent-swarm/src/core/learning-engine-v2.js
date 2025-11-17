/**
 * Learning Engine V2.0 - Advanced User Behavior Analysis
 *
 * Analyse comportementale sophistiquée avec:
 * - Profilage utilisateur multi-dimensions
 * - Détection de patterns & préférences
 * - Recommandations intelligentes
 * - Analyse sentiment
 * - Timeline interaction
 * - Insights prédictifs
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class LearningEngineV2 {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/learning');
    this.profilesPath = path.join(this.dataPath, 'profiles');

    // Profils utilisateurs en cache
    this.profiles = new Map();

    // Configuration
    this.config = {
      minInteractionsForProfile: 10,
      sentimentAnalysisEnabled: true,
      autoInsightsEnabled: true,
      insightFrequency: 50 // Tous les 50 messages
    };

    // Stats globales
    this.globalStats = {
      totalInteractions: 0,
      totalUsers: 0,
      avgInteractionsPerUser: 0,
      topTopics: [],
      topIntents: []
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Créer dossiers
    await fs.mkdir(this.profilesPath, { recursive: true });

    // Charger profils existants
    await this.loadAllProfiles();

    this.initialized = true;
    logger.info('🧠 Learning Engine V2 initialized');
  }

  /**
   * Enregistrer une interaction
   */
  async trackInteraction(userId, interaction) {
    await this.ensureInitialized();

    // Charger ou créer profil
    let profile = this.profiles.get(userId);

    if (!profile) {
      profile = this.createNewProfile(userId);
      this.profiles.set(userId, profile);
    }

    // Ajouter interaction
    profile.interactions.push({
      timestamp: new Date().toISOString(),
      ...interaction
    });

    // Limiter historique (garder 1000 dernières)
    if (profile.interactions.length > 1000) {
      profile.interactions = profile.interactions.slice(-1000);
    }

    // Mettre à jour stats
    profile.stats.totalInteractions++;
    profile.stats.lastInteraction = new Date().toISOString();

    // Analyser et mettre à jour profil
    await this.analyzeAndUpdate(profile);

    // Sauvegarder
    await this.saveProfile(userId, profile);

    // Insights automatiques ?
    if (profile.stats.totalInteractions % this.config.insightFrequency === 0) {
      const insights = await this.generateInsights(userId);
      return { tracked: true, insights };
    }

    return { tracked: true };
  }

  createNewProfile(userId) {
    return {
      userId,
      createdAt: new Date().toISOString(),
      stats: {
        totalInteractions: 0,
        firstInteraction: new Date().toISOString(),
        lastInteraction: new Date().toISOString()
      },
      interactions: [],
      patterns: {
        preferredTime: null,
        preferredDays: [],
        avgSessionLength: 0,
        avgResponseTime: 0
      },
      preferences: {
        topics: {},
        intents: {},
        complexity: 'medium',
        tone: 'professional'
      },
      insights: {
        strengths: [],
        interests: [],
        recommendations: []
      }
    };
  }

  /**
   * Analyser et mettre à jour le profil
   */
  async analyzeAndUpdate(profile) {
    // Analyse temporelle
    this.analyzeTemporalPatterns(profile);

    // Analyse topics & intents
    this.analyzeTopicsAndIntents(profile);

    // Analyse complexité
    this.analyzeComplexity(profile);

    // Analyse sentiment
    if (this.config.sentimentAnalysisEnabled) {
      this.analyzeSentiment(profile);
    }
  }

  analyzeTemporalPatterns(profile) {
    const interactions = profile.interactions;

    if (interactions.length < 10) return;

    // Analyse heures préférées
    const hours = interactions.map(i => new Date(i.timestamp).getHours());
    const hourCounts = {};
    hours.forEach(h => {
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });

    const preferredHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0];

    profile.patterns.preferredTime = preferredHour;

    // Analyse jours préférés
    const days = interactions.map(i => new Date(i.timestamp).getDay());
    const dayCounts = {};
    days.forEach(d => {
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    });

    profile.patterns.preferredDays = Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][parseInt(day)]);
  }

  analyzeTopicsAndIntents(profile) {
    const interactions = profile.interactions;

    // Topics
    const topics = {};
    interactions.forEach(i => {
      if (i.topic) {
        topics[i.topic] = (topics[i.topic] || 0) + 1;
      }
    });

    profile.preferences.topics = topics;

    // Intents
    const intents = {};
    interactions.forEach(i => {
      if (i.intent) {
        intents[i.intent] = (intents[i.intent] || 0) + 1;
      }
    });

    profile.preferences.intents = intents;
  }

  analyzeComplexity(profile) {
    const interactions = profile.interactions.slice(-50); // 50 dernières

    if (interactions.length < 10) return;

    // Analyser longueur messages
    const avgLength = interactions.reduce((sum, i) => sum + (i.messageLength || 0), 0) / interactions.length;

    // Complexité basée sur longueur
    if (avgLength < 50) {
      profile.preferences.complexity = 'simple';
    } else if (avgLength < 150) {
      profile.preferences.complexity = 'medium';
    } else {
      profile.preferences.complexity = 'advanced';
    }
  }

  analyzeSentiment(profile) {
    // Simple sentiment analysis basé sur mots-clés
    const positive = ['merci', 'super', 'génial', 'excellent', 'parfait', 'top'];
    const negative = ['problème', 'erreur', 'bug', 'nul', 'mauvais'];

    const interactions = profile.interactions.slice(-50);

    let positiveCount = 0;
    let negativeCount = 0;

    interactions.forEach(i => {
      const text = (i.userMessage || '').toLowerCase();

      positive.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });

      negative.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
    });

    if (positiveCount > negativeCount) {
      profile.preferences.tone = 'positive';
    } else if (negativeCount > positiveCount) {
      profile.preferences.tone = 'supportive';
    } else {
      profile.preferences.tone = 'professional';
    }
  }

  /**
   * Générer insights
   */
  async generateInsights(userId) {
    const profile = this.profiles.get(userId);

    if (!profile) {
      return { error: 'Profile not found' };
    }

    const insights = {
      userId,
      generatedAt: new Date().toISOString(),
      stats: {
        totalInteractions: profile.stats.totalInteractions,
        userSince: profile.createdAt
      },
      patterns: profile.patterns,
      preferences: profile.preferences,
      recommendations: this.generateRecommendations(profile),
      summary: this.generateSummary(profile)
    };

    return insights;
  }

  generateRecommendations(profile) {
    const recommendations = [];

    // Recommandations basées sur topics
    const topTopics = Object.entries(profile.preferences.topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);

    if (topTopics.length > 0) {
      recommendations.push({
        type: 'topics',
        suggestion: `Vous semblez intéressé par: ${topTopics.join(', ')}`,
        action: 'Voulez-vous des suggestions avancées sur ces sujets ?'
      });
    }

    // Recommandations basées sur temporal patterns
    if (profile.patterns.preferredTime) {
      recommendations.push({
        type: 'timing',
        suggestion: `Vous êtes plus actif vers ${profile.patterns.preferredTime}h`,
        action: 'Je peux planifier des rappels automatiques à cette heure'
      });
    }

    // Recommandations basées sur complexité
    if (profile.preferences.complexity === 'advanced') {
      recommendations.push({
        type: 'features',
        suggestion: 'Vous utilisez des fonctionnalités avancées',
        action: 'Découvrez les APIs et automatisations disponibles'
      });
    }

    return recommendations;
  }

  generateSummary(profile) {
    const daysSince = Math.floor(
      (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const topTopic = Object.entries(profile.preferences.topics)
      .sort((a, b) => b[1] - a[1])[0];

    const topIntent = Object.entries(profile.preferences.intents)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      userSince: `${daysSince} jours`,
      totalInteractions: profile.stats.totalInteractions,
      avgPerDay: (profile.stats.totalInteractions / Math.max(daysSince, 1)).toFixed(1),
      favoriteTime: profile.patterns.preferredTime ? `${profile.patterns.preferredTime}h` : 'Variable',
      favoriteDays: profile.patterns.preferredDays.join(', ') || 'Tous',
      mainTopic: topTopic ? topTopic[0] : 'Varié',
      mainIntent: topIntent ? topIntent[0] : 'Varié',
      complexity: profile.preferences.complexity,
      tone: profile.preferences.tone
    };
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    await this.ensureInitialized();

    const profile = this.profiles.get(userId);

    if (!profile) {
      return null;
    }

    return profile;
  }

  /**
   * Get user insights
   */
  async getUserInsights(userId) {
    await this.ensureInitialized();

    return await this.generateInsights(userId);
  }

  /**
   * Persistence
   */
  async loadAllProfiles() {
    try {
      const files = await fs.readdir(this.profilesPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const userId = file.replace('.json', '');
          const data = await fs.readFile(path.join(this.profilesPath, file), 'utf8');
          const profile = JSON.parse(data);

          this.profiles.set(userId, profile);
        }
      }

      this.globalStats.totalUsers = this.profiles.size;

      logger.info(`📊 Loaded ${this.profiles.size} user profiles`);

    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('📊 No existing profiles, starting fresh');
      } else {
        throw error;
      }
    }
  }

  async saveProfile(userId, profile) {
    const filepath = path.join(this.profilesPath, `${userId}.json`);
    await fs.writeFile(filepath, JSON.stringify(profile, null, 2), 'utf8');
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get global statistics
   */
  getGlobalStats() {
    const totalInteractions = Array.from(this.profiles.values())
      .reduce((sum, p) => sum + p.stats.totalInteractions, 0);

    const avgInteractions = this.profiles.size > 0
      ? totalInteractions / this.profiles.size
      : 0;

    // Top topics across all users
    const allTopics = {};
    this.profiles.forEach(profile => {
      Object.entries(profile.preferences.topics).forEach(([topic, count]) => {
        allTopics[topic] = (allTopics[topic] || 0) + count;
      });
    });

    const topTopics = Object.entries(allTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    return {
      totalUsers: this.profiles.size,
      totalInteractions,
      avgInteractionsPerUser: avgInteractions.toFixed(1),
      topTopics
    };
  }
}

module.exports = LearningEngineV2;
