#!/usr/bin/env node

/**
 * Advanced Context Engine
 *
 * Deep contextual awareness that understands:
 * - Temporal context (time, day, season)
 * - Emotional state (detected from language)
 * - Work context (focus mode, meetings, deadlines)
 * - Personal preferences (learned over time)
 * - Environmental factors (location, timezone)
 *
 * Provides intelligent, context-aware responses
 */

const fs = require('fs').promises;
const path = require('path');

class AdvancedContextEngine {
  constructor() {
    this.contextCache = {
      temporal: null,
      emotional: null,
      workload: null,
      preferences: null,
      environment: null,
      lastUpdate: null
    };

    this.emotionalKeywords = {
      positive: {
        high: ['amazing', 'excellent', 'perfect', 'fantastic', 'love', 'excited', 'happy'],
        medium: ['good', 'nice', 'thanks', 'appreciate', 'glad', 'pleased'],
        low: ['ok', 'fine', 'alright', 'sure']
      },
      negative: {
        high: ['terrible', 'awful', 'hate', 'frustrated', 'angry', 'disaster'],
        medium: ['bad', 'annoying', 'difficult', 'problem', 'issue', 'concern'],
        low: ['not great', 'could be better', 'meh', 'eh']
      },
      stressed: ['urgent', 'asap', 'rush', 'deadline', 'pressure', 'overwhelmed', 'stressed'],
      calm: ['later', 'whenever', 'no rush', 'take time', 'relaxed', 'peaceful']
    };
  }

  /**
   * Analyze complete context for a given moment
   */
  async analyzeContext(userMessage = null, userId = null) {
    const now = new Date();

    const context = {
      temporal: this.getTemporalContext(now),
      emotional: userMessage ? this.analyzeEmotionalState(userMessage) : null,
      workload: await this.analyzeWorkload(now, userId),
      environment: this.getEnvironmentalContext(now),
      preferences: await this.getUserPreferences(userId),
      metadata: {
        timestamp: now.toISOString(),
        confidence: 0.85
      }
    };

    // Generate contextual insights
    context.insights = this.generateInsights(context);
    context.recommendations = this.generateRecommendations(context);

    // Cache for reuse
    this.contextCache = { ...context, lastUpdate: now };

    return context;
  }

  /**
   * Get temporal context (time-based)
   */
  getTemporalContext(date = new Date()) {
    const hour = date.getHours();
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    const dayOfMonth = date.getDate();
    const month = date.getMonth();

    // Time of day
    let timeOfDay;
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    // Work vs personal time
    const isWorkHours = hour >= 9 && hour < 18 && day >= 1 && day <= 5;
    const isWeekend = day === 0 || day === 6;

    // Special times
    const isLunchTime = hour >= 12 && hour < 14;
    const isEndOfDay = hour >= 17 && hour < 19 && !isWeekend;
    const isStartOfWeek = day === 1;
    const isEndOfWeek = day === 5;
    const isEndOfMonth = dayOfMonth >= 28;

    return {
      date: date.toISOString(),
      hour,
      timeOfDay,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      isWorkHours,
      isWeekend,
      isLunchTime,
      isEndOfDay,
      isStartOfWeek,
      isEndOfWeek,
      isEndOfMonth,
      season: this.getSeason(month),
      suggestedEnergy: this.getSuggestedEnergy(hour, day)
    };
  }

  /**
   * Get season based on month
   */
  getSeason(month) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Get suggested energy level for time
   */
  getSuggestedEnergy(hour, day) {
    // Weekend mornings = relaxed
    if ((day === 0 || day === 6) && hour < 12) return 'relaxed';

    // Work morning = high energy
    if (hour >= 9 && hour < 12 && day >= 1 && day <= 5) return 'high';

    // Post-lunch dip
    if (hour >= 13 && hour < 15) return 'medium';

    // Late evening = low
    if (hour >= 21 || hour < 6) return 'low';

    return 'medium';
  }

  /**
   * Analyze emotional state from message
   */
  analyzeEmotionalState(message) {
    const messageLower = message.toLowerCase();

    let sentiment = 'neutral';
    let intensity = 'medium';
    let stressLevel = 'normal';
    let confidence = 0.7;

    // Check positive emotions
    for (const [level, keywords] of Object.entries(this.emotionalKeywords.positive)) {
      const matches = keywords.filter(kw => messageLower.includes(kw));
      if (matches.length > 0) {
        sentiment = 'positive';
        intensity = level;
        confidence = 0.8;
        break;
      }
    }

    // Check negative emotions
    for (const [level, keywords] of Object.entries(this.emotionalKeywords.negative)) {
      const matches = keywords.filter(kw => messageLower.includes(kw));
      if (matches.length > 0) {
        sentiment = 'negative';
        intensity = level;
        confidence = 0.8;
        break;
      }
    }

    // Check stress level
    const stressedMatches = this.emotionalKeywords.stressed.filter(kw => messageLower.includes(kw));
    const calmMatches = this.emotionalKeywords.calm.filter(kw => messageLower.includes(kw));

    if (stressedMatches.length > 0) {
      stressLevel = stressedMatches.length >= 2 ? 'high' : 'elevated';
    } else if (calmMatches.length > 0) {
      stressLevel = 'low';
    }

    // Analyze urgency
    const urgencyIndicators = ['!!', 'urgent', 'asap', 'now', 'immediate', 'quickly'];
    const urgency = urgencyIndicators.some(ind => messageLower.includes(ind)) ? 'high' : 'normal';

    return {
      sentiment,
      intensity,
      stressLevel,
      urgency,
      confidence,
      detectedEmotions: {
        positive: sentiment === 'positive',
        negative: sentiment === 'negative',
        stressed: stressLevel !== 'normal',
        urgent: urgency === 'high'
      }
    };
  }

  /**
   * Analyze current workload
   */
  async analyzeWorkload(date, userId) {
    // In real implementation, this would check:
    // - Calendar for upcoming meetings
    // - Task list for deadlines
    // - Email inbox for urgent items
    // - Recent activity level

    // Mock implementation
    const hour = date.getHours();
    const day = date.getDay();

    const isHighWorkload = (day >= 1 && day <= 5) && (hour >= 9 && hour < 17);

    return {
      level: isHighWorkload ? 'medium' : 'low',
      upcomingDeadlines: 0, // Would be fetched from memory
      upcomingMeetings: 0,  // Would be fetched from calendar
      unreadEmails: 0,      // Would be fetched from email
      pendingTasks: 0,      // Would be fetched from task list
      focusMode: false,     // Would be user-set
      availableTime: this.estimateAvailableTime(date)
    };
  }

  /**
   * Estimate available time
   */
  estimateAvailableTime(date) {
    const hour = date.getHours();
    const day = date.getDay();

    if (day === 0 || day === 6) return 'plenty'; // Weekend

    if (hour < 9) return 'plenty';
    if (hour >= 9 && hour < 12) return 'moderate';
    if (hour >= 12 && hour < 14) return 'limited'; // Lunch
    if (hour >= 14 && hour < 17) return 'moderate';
    if (hour >= 17) return 'plenty'; // After work

    return 'moderate';
  }

  /**
   * Get environmental context
   */
  getEnvironmentalContext(date) {
    // In real implementation, could use:
    // - Geolocation API
    // - Weather API
    // - Network status

    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      // Mock data
      location: 'office', // Would be detected
      weather: 'clear',   // Would be from API
      network: 'wifi'     // Would be detected
    };
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId) {
    // In real implementation, load from phone storage (my-profile.json)

    // Default preferences
    return {
      communication: {
        tone: 'casual',
        verbosity: 'concise',
        emoji_usage: 'moderate'
      },
      workStyle: {
        preferredWorkHours: { start: '09:00', end: '18:00' },
        focusBlocks: [],
        preferredResponseTime: 'immediate'
      },
      notifications: {
        enabled: true,
        quiet_hours: { start: '22:00', end: '08:00' },
        grouping: true
      }
    };
  }

  /**
   * Generate contextual insights
   */
  generateInsights(context) {
    const insights = [];

    const { temporal, emotional, workload, environment } = context;

    // Temporal insights
    if (temporal.isStartOfWeek) {
      insights.push({
        type: 'temporal',
        priority: 'medium',
        message: 'Début de semaine - bon moment pour planifier'
      });
    }

    if (temporal.isEndOfWeek) {
      insights.push({
        type: 'temporal',
        priority: 'medium',
        message: 'Fin de semaine - penser aux résumés et rapports'
      });
    }

    if (temporal.isLunchTime) {
      insights.push({
        type: 'temporal',
        priority: 'low',
        message: 'Heure du déjeuner - pause recommandée'
      });
    }

    // Emotional insights
    if (emotional) {
      if (emotional.stressLevel === 'high') {
        insights.push({
          type: 'emotional',
          priority: 'high',
          message: 'Niveau de stress élevé détecté - proposer aide prioritaire'
        });
      }

      if (emotional.urgency === 'high') {
        insights.push({
          type: 'emotional',
          priority: 'high',
          message: 'Urgence détectée - réponse rapide requise'
        });
      }

      if (emotional.sentiment === 'positive' && emotional.intensity === 'high') {
        insights.push({
          type: 'emotional',
          priority: 'low',
          message: 'État positif - bon moment pour tâches créatives'
        });
      }
    }

    // Workload insights
    if (workload.focusMode) {
      insights.push({
        type: 'workload',
        priority: 'high',
        message: 'Mode focus activé - minimiser interruptions'
      });
    }

    if (workload.level === 'high') {
      insights.push({
        type: 'workload',
        priority: 'medium',
        message: 'Charge de travail élevée - prioriser tâches importantes'
      });
    }

    return insights;
  }

  /**
   * Generate contextual recommendations
   */
  generateRecommendations(context) {
    const recommendations = [];

    const { temporal, emotional, workload } = context;

    // Morning recommendations
    if (temporal.timeOfDay === 'morning' && temporal.isWorkHours) {
      recommendations.push({
        action: 'morning_briefing',
        message: 'Veux-tu un résumé de ta journée ?',
        priority: 'medium'
      });
    }

    // End of day recommendations
    if (temporal.isEndOfDay) {
      recommendations.push({
        action: 'end_of_day_summary',
        message: 'C\'est la fin de journée. Résumé des tâches accomplies ?',
        priority: 'medium'
      });
    }

    // Stress management
    if (emotional && emotional.stressLevel === 'high') {
      recommendations.push({
        action: 'stress_relief',
        message: 'Tu sembles stressé. Veux-tu que je priorise tes tâches ?',
        priority: 'high'
      });
    }

    // Focus time
    if (workload.level === 'high' && temporal.suggestedEnergy === 'high') {
      recommendations.push({
        action: 'activate_focus',
        message: 'Activer le mode focus pour 2h ?',
        priority: 'medium'
      });
    }

    // End of week
    if (temporal.isEndOfWeek && temporal.isEndOfDay) {
      recommendations.push({
        action: 'weekly_review',
        message: 'Créer le rapport hebdomadaire maintenant ?',
        priority: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Get context summary for display
   */
  getContextSummary() {
    if (!this.contextCache.lastUpdate) {
      return 'No context available';
    }

    const { temporal, emotional, workload } = this.contextCache;

    const summary = [
      `🕐 ${temporal.timeOfDay} (${temporal.dayOfWeek})`,
      temporal.isWorkHours ? '💼 Work hours' : '🏠 Personal time'
    ];

    if (emotional) {
      const emoji = emotional.sentiment === 'positive' ? '😊' :
                    emotional.sentiment === 'negative' ? '😟' : '😐';
      summary.push(`${emoji} ${emotional.sentiment}`);
    }

    if (workload) {
      const emoji = workload.level === 'high' ? '⚡' :
                    workload.level === 'medium' ? '📊' : '✨';
      summary.push(`${emoji} Workload: ${workload.level}`);
    }

    return summary.join(' | ');
  }

  /**
   * Adapt response based on context
   */
  adaptResponse(baseResponse, context) {
    const { temporal, emotional, preferences } = context;

    let adaptedResponse = baseResponse;

    // Adjust verbosity
    if (preferences.communication.verbosity === 'concise') {
      // Shorten response (in real implementation)
      adaptedResponse = this.makeResponseConcise(baseResponse);
    }

    // Adjust tone
    if (emotional && emotional.stressLevel === 'high') {
      // More supportive tone
      adaptedResponse = `Je comprends que c'est urgent. ${adaptedResponse}`;
    }

    // Add appropriate ending
    if (temporal.isEndOfDay) {
      adaptedResponse += '\n\nBonne soirée ! 🌆';
    } else if (temporal.timeOfDay === 'morning') {
      adaptedResponse += '\n\nBonne journée ! ☀️';
    }

    return adaptedResponse;
  }

  /**
   * Make response more concise
   */
  makeResponseConcise(response) {
    // Simple implementation - remove filler words
    return response
      .replace(/notamment|en fait|donc|alors|/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Export singleton
const contextEngine = new AdvancedContextEngine();

module.exports = contextEngine;

// CLI usage
if (require.main === module) {
  (async () => {
    const message = process.argv[2] || 'Hey can you help me urgently?';

    console.log('🎯 Advanced Context Engine\n');
    console.log(`Analyzing message: "${message}"\n`);

    const context = await contextEngine.analyzeContext(message, 'user_123');

    console.log('📊 Context Analysis:');
    console.log(JSON.stringify(context, null, 2));

    console.log('\n📌 Context Summary:');
    console.log(contextEngine.getContextSummary());
  })();
}
