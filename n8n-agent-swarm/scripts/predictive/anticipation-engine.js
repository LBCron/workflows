#!/usr/bin/env node

/**
 * Predictive Anticipation Engine
 *
 * Learns user patterns and proactively suggests actions BEFORE being asked.
 *
 * Capabilities:
 * - Pattern detection (temporal, behavioral, contextual)
 * - Proactive suggestions
 * - Predictive notifications
 * - Smart reminders
 * - Anticipatory actions
 *
 * Examples:
 * - "Every Friday 16h you deploy. Run tests now?" (Friday 15h)
 * - "You usually email weekly report on Friday. Draft it?" (Friday morning)
 * - "Meeting in 30min. Want briefing of materials?" (Before meetings)
 */

const fs = require('fs').promises;
const path = require('path');

class PredictiveAnticipationEngine {
  constructor() {
    this.patterns = [];
    this.predictions = [];
    this.learningData = {
      actions: [],
      contexts: [],
      outcomes: []
    };
  }

  /**
   * Learn from user action
   */
  learnAction(action, context, outcome = 'success') {
    const learningEntry = {
      action,
      context: {
        timestamp: new Date().toISOString(),
        dayOfWeek: new Date().getDay(),
        hour: new Date().getHours(),
        ...context
      },
      outcome,
      id: `action_${Date.now()}`
    };

    this.learningData.actions.push(learningEntry);

    // Detect patterns after enough data
    if (this.learningData.actions.length % 10 === 0) {
      this.detectPatterns();
    }

    return learningEntry;
  }

  /**
   * Detect patterns from historical actions
   */
  detectPatterns() {
    const patterns = [];

    // Group actions by type
    const actionsByType = {};
    for (const action of this.learningData.actions) {
      if (!actionsByType[action.action.type]) {
        actionsByType[action.action.type] = [];
      }
      actionsByType[action.action.type].push(action);
    }

    // Analyze each action type for patterns
    for (const [actionType, actions] of Object.entries(actionsByType)) {
      if (actions.length < 3) continue; // Need at least 3 occurrences

      // Temporal patterns
      const temporalPattern = this.detectTemporalPattern(actions);
      if (temporalPattern) {
        patterns.push({
          type: 'temporal',
          action: actionType,
          pattern: temporalPattern,
          confidence: temporalPattern.confidence,
          occurrences: actions.length
        });
      }

      // Sequential patterns (actions that follow each other)
      const sequentialPattern = this.detectSequentialPattern(actionType, actions);
      if (sequentialPattern) {
        patterns.push({
          type: 'sequential',
          action: actionType,
          pattern: sequentialPattern,
          confidence: sequentialPattern.confidence,
          occurrences: sequentialPattern.occurrences
        });
      }

      // Contextual patterns
      const contextualPattern = this.detectContextualPattern(actions);
      if (contextualPattern) {
        patterns.push({
          type: 'contextual',
          action: actionType,
          pattern: contextualPattern,
          confidence: contextualPattern.confidence,
          occurrences: actions.length
        });
      }
    }

    this.patterns = patterns;
    return patterns;
  }

  /**
   * Detect temporal patterns (same action at similar times)
   */
  detectTemporalPattern(actions) {
    const daysOfWeek = {};
    const hoursOfDay = {};

    for (const action of actions) {
      const day = action.context.dayOfWeek;
      const hour = action.context.hour;

      daysOfWeek[day] = (daysOfWeek[day] || 0) + 1;
      hoursOfDay[hour] = (hoursOfDay[hour] || 0) + 1;
    }

    // Find most common day
    const mostCommonDay = Object.entries(daysOfWeek)
      .sort((a, b) => b[1] - a[1])[0];

    // Find most common hour
    const mostCommonHour = Object.entries(hoursOfDay)
      .sort((a, b) => b[1] - a[1])[0];

    if (!mostCommonDay || !mostCommonHour) return null;

    const dayFrequency = mostCommonDay[1] / actions.length;
    const hourFrequency = mostCommonHour[1] / actions.length;

    // Require at least 60% consistency
    if (dayFrequency < 0.6 && hourFrequency < 0.6) return null;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      dayOfWeek: parseInt(mostCommonDay[0]),
      dayName: dayNames[parseInt(mostCommonDay[0])],
      hour: parseInt(mostCommonHour[0]),
      dayFrequency,
      hourFrequency,
      confidence: (dayFrequency + hourFrequency) / 2,
      description: `Usually happens on ${dayNames[parseInt(mostCommonDay[0])]} around ${mostCommonHour[0]}:00`
    };
  }

  /**
   * Detect sequential patterns (action A followed by action B)
   */
  detectSequentialPattern(actionType, actions) {
    const sequences = {};

    // Look for actions that consistently happen before this one
    for (let i = 1; i < this.learningData.actions.length; i++) {
      const current = this.learningData.actions[i];
      const previous = this.learningData.actions[i - 1];

      if (current.action.type === actionType) {
        // Time difference in minutes
        const timeDiff = (new Date(current.context.timestamp) - new Date(previous.context.timestamp)) / (1000 * 60);

        // Only consider actions within 2 hours
        if (timeDiff <= 120) {
          const key = previous.action.type;
          if (!sequences[key]) {
            sequences[key] = { count: 0, avgTimeDiff: 0, timeDiffs: [] };
          }
          sequences[key].count++;
          sequences[key].timeDiffs.push(timeDiff);
        }
      }
    }

    // Find most common preceding action
    const sortedSequences = Object.entries(sequences)
      .sort((a, b) => b[1].count - a[1].count);

    if (sortedSequences.length === 0) return null;

    const [precedingAction, data] = sortedSequences[0];
    const frequency = data.count / actions.length;

    if (frequency < 0.5) return null; // Need at least 50% consistency

    // Calculate average time difference
    const avgTimeDiff = data.timeDiffs.reduce((a, b) => a + b, 0) / data.timeDiffs.length;

    return {
      precedingAction,
      occurrences: data.count,
      frequency,
      avgTimeDiffMinutes: Math.round(avgTimeDiff),
      confidence: frequency,
      description: `Usually follows '${precedingAction}' after ${Math.round(avgTimeDiff)} minutes`
    };
  }

  /**
   * Detect contextual patterns
   */
  detectContextualPattern(actions) {
    // Analyze context when this action typically happens
    const contexts = {
      beforeDeadline: 0,
      highWorkload: 0,
      lowWorkload: 0,
      stressed: 0,
      calm: 0
    };

    for (const action of actions) {
      const ctx = action.context;

      if (ctx.beforeDeadline) contexts.beforeDeadline++;
      if (ctx.workload === 'high') contexts.highWorkload++;
      if (ctx.workload === 'low') contexts.lowWorkload++;
      if (ctx.emotional && ctx.emotional.stressLevel === 'high') contexts.stressed++;
      if (ctx.emotional && ctx.emotional.stressLevel === 'low') contexts.calm++;
    }

    // Find dominant context
    const dominant = Object.entries(contexts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])[0];

    if (!dominant) return null;

    const frequency = dominant[1] / actions.length;

    if (frequency < 0.6) return null;

    return {
      dominantContext: dominant[0],
      frequency,
      confidence: frequency,
      description: `Usually happens when: ${dominant[0].replace(/([A-Z])/g, ' $1').toLowerCase()}`
    };
  }

  /**
   * Generate predictions for current moment
   */
  async generatePredictions(currentContext) {
    const predictions = [];

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    for (const pattern of this.patterns) {
      if (pattern.confidence < 0.6) continue; // Skip low-confidence patterns

      // Check temporal patterns
      if (pattern.type === 'temporal') {
        const temporal = pattern.pattern;

        // Check if we're approaching the pattern time
        const isRightDay = currentDay === temporal.dayOfWeek;
        const hourDiff = Math.abs(currentHour - temporal.hour);

        if (isRightDay && hourDiff <= 1) {
          // We're within 1 hour of usual time
          const leadTime = temporal.hour - currentHour;

          predictions.push({
            type: 'temporal',
            action: pattern.action,
            confidence: pattern.confidence,
            leadTimeHours: leadTime,
            message: leadTime > 0
              ? `Tu fais habituellement '${pattern.action}' dans ${leadTime}h. Veux-tu que je prépare ?`
              : `C'est l'heure habituelle pour '${pattern.action}'. Prêt ?`,
            priority: leadTime === 0 ? 'high' : 'medium',
            suggestedAction: this.getSuggestedAction(pattern.action, currentContext)
          });
        }
      }

      // Check sequential patterns
      if (pattern.type === 'sequential' && this.learningData.actions.length > 0) {
        const lastAction = this.learningData.actions[this.learningData.actions.length - 1];

        if (lastAction.action.type === pattern.pattern.precedingAction) {
          const timeSinceLastAction = (now - new Date(lastAction.context.timestamp)) / (1000 * 60);
          const expectedTime = pattern.pattern.avgTimeDiffMinutes;

          if (Math.abs(timeSinceLastAction - expectedTime) < 15) {
            predictions.push({
              type: 'sequential',
              action: pattern.action,
              confidence: pattern.confidence,
              message: `Tu viens de faire '${pattern.pattern.precedingAction}'. Habituellement, tu fais '${pattern.action}' ensuite. Continuer ?`,
              priority: 'high',
              suggestedAction: this.getSuggestedAction(pattern.action, currentContext)
            });
          }
        }
      }

      // Check contextual patterns
      if (pattern.type === 'contextual') {
        const contextMatch = this.checkContextMatch(pattern.pattern.dominantContext, currentContext);

        if (contextMatch) {
          predictions.push({
            type: 'contextual',
            action: pattern.action,
            confidence: pattern.confidence,
            message: `Contexte détecté : ${pattern.pattern.description}. Tu fais souvent '${pattern.action}' dans cette situation.`,
            priority: 'medium',
            suggestedAction: this.getSuggestedAction(pattern.action, currentContext)
          });
        }
      }
    }

    // Sort by priority and confidence
    predictions.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const scoreA = priorityWeight[a.priority] * a.confidence;
      const scoreB = priorityWeight[b.priority] * b.confidence;
      return scoreB - scoreA;
    });

    this.predictions = predictions;
    return predictions;
  }

  /**
   * Check if current context matches pattern context
   */
  checkContextMatch(dominantContext, currentContext) {
    switch (dominantContext) {
      case 'beforeDeadline':
        return currentContext.beforeDeadline === true;
      case 'highWorkload':
        return currentContext.workload && currentContext.workload.level === 'high';
      case 'lowWorkload':
        return currentContext.workload && currentContext.workload.level === 'low';
      case 'stressed':
        return currentContext.emotional && currentContext.emotional.stressLevel === 'high';
      case 'calm':
        return currentContext.emotional && currentContext.emotional.stressLevel === 'low';
      default:
        return false;
    }
  }

  /**
   * Get suggested action for a predicted action type
   */
  getSuggestedAction(actionType, context) {
    const actions = {
      'deploy': {
        prepare: 'Run tests first?',
        execute: 'Deploy now',
        confirm: 'Review changes before deploy?'
      },
      'weekly_report': {
        prepare: 'Gather weekly stats',
        execute: 'Generate report',
        confirm: 'Review and send?'
      },
      'email_boss': {
        prepare: 'Draft email',
        execute: 'Send email',
        confirm: 'Review before sending?'
      },
      'backup': {
        prepare: 'Check what needs backup',
        execute: 'Run backup now',
        confirm: 'Verify backup contents?'
      }
    };

    return actions[actionType] || {
      prepare: 'Préparer',
      execute: 'Exécuter',
      confirm: 'Confirmer ?'
    };
  }

  /**
   * Get top prediction for current moment
   */
  getTopPrediction() {
    if (this.predictions.length === 0) return null;
    return this.predictions[0];
  }

  /**
   * Get all active predictions
   */
  getActivePredictions() {
    return this.predictions;
  }

  /**
   * Save learning data
   */
  async saveData(filePath) {
    const data = {
      patterns: this.patterns,
      learningData: this.learningData,
      savedAt: new Date().toISOString()
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Load learning data
   */
  async loadData(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      this.patterns = data.patterns || [];
      this.learningData = data.learningData || { actions: [], contexts: [], outcomes: [] };

      console.log(`✅ Loaded ${this.learningData.actions.length} actions and ${this.patterns.length} patterns`);
    } catch (error) {
      console.log('ℹ️  No existing data to load (starting fresh)');
    }
  }

  /**
   * Get learning statistics
   */
  getStats() {
    return {
      total_actions: this.learningData.actions.length,
      patterns_detected: this.patterns.length,
      active_predictions: this.predictions.length,
      pattern_breakdown: {
        temporal: this.patterns.filter(p => p.type === 'temporal').length,
        sequential: this.patterns.filter(p => p.type === 'sequential').length,
        contextual: this.patterns.filter(p => p.type === 'contextual').length
      },
      confidence_distribution: {
        high: this.patterns.filter(p => p.confidence >= 0.8).length,
        medium: this.patterns.filter(p => p.confidence >= 0.6 && p.confidence < 0.8).length,
        low: this.patterns.filter(p => p.confidence < 0.6).length
      }
    };
  }
}

// Export singleton
const anticipationEngine = new PredictiveAnticipationEngine();

module.exports = anticipationEngine;

// CLI usage
if (require.main === module) {
  (async () => {
    console.log('🔮 Predictive Anticipation Engine\n');

    // Load existing data
    const dataPath = path.join(__dirname, '../../.cache/prediction-data.json');
    await anticipationEngine.loadData(dataPath);

    // Add some sample learning data
    console.log('📚 Learning from sample actions...\n');

    // Friday deployments
    for (let i = 0; i < 5; i++) {
      anticipationEngine.learnAction(
        { type: 'deploy', target: 'production' },
        { dayOfWeek: 5, hour: 16, workload: 'medium' },
        'success'
      );
    }

    // Monday morning emails
    for (let i = 0; i < 4; i++) {
      anticipationEngine.learnAction(
        { type: 'email_boss', subject: 'Weekly report' },
        { dayOfWeek: 1, hour: 9, workload: 'low' },
        'success'
      );
    }

    // Detect patterns
    const patterns = anticipationEngine.detectPatterns();

    console.log('📊 Detected Patterns:');
    console.log(JSON.stringify(patterns, null, 2));

    // Generate predictions for current moment
    const currentContext = {
      dayOfWeek: 5,
      hour: 15,
      workload: { level: 'medium' },
      emotional: { stressLevel: 'normal' }
    };

    const predictions = await anticipationEngine.generatePredictions(currentContext);

    console.log('\n🎯 Current Predictions:');
    console.log(JSON.stringify(predictions, null, 2));

    console.log('\n💡 Stats:');
    console.log(JSON.stringify(anticipationEngine.getStats(), null, 2));

    // Save data
    await anticipationEngine.saveData(dataPath);
    console.log(`\n💾 Data saved to ${dataPath}`);
  })();
}
