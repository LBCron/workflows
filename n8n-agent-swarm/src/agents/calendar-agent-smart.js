/**
 * Calendar Agent Smart v2.0
 *
 * Agent calendrier intelligent avec:
 * - Smart scheduling (trouver meilleur créneau)
 * - Conflict detection
 * - Travel time calculation
 * - Meeting preparation suggestions
 * - Automatic rescheduling
 * - Focus time protection
 * - Meeting analytics
 */

const logger = require('../utils/logger');

class CalendarAgentSmart {
  constructor(vault, openaiClient = null) {
    this.vault = vault;
    this.openai = openaiClient;
    this.calendar = null;
    this.isAuthenticated = false;

    // Préférences de scheduling
    this.preferences = {
      workingHours: {
        start: 9, // 9h
        end: 18 // 18h
      },
      preferredMeetingLength: 60, // minutes
      bufferBetweenMeetings: 15, // minutes
      focusTimeBlocks: [ // Pas de meetings
        { day: 1, start: 9, end: 12 }, // Lundi matin
        { day: 5, start: 14, end: 17 } // Vendredi après-midi
      ],
      lunchTime: { start: 12, end: 13 },
      maxMeetingsPerDay: 6
    };
  }

  async initialize() {
    try {
      const creds = await this.vault.getCredentials('google_calendar');

      if (!creds) {
        logger.warn('Calendar credentials not configured - Calendar Agent in limited mode');
        return;
      }

      // Google Calendar API initialization (requires googleapis)
      // const { google } = require('googleapis');
      // const oauth2Client = new google.auth.OAuth2(...);
      // this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      this.isAuthenticated = false; // Set to true when calendar is configured

      logger.info('✅ Calendar Agent Smart initialized');
    } catch (error) {
      logger.error('Calendar Agent Smart initialization error:', error);
    }
  }

  /**
   * Smart Scheduling - Trouver meilleur créneau
   */
  async findBestSlot(requirements) {
    const {
      duration = 60, // minutes
      participants = [],
      preferredDays = [1, 2, 3, 4, 5], // Lundi-Vendredi
      preferredTimes = [], // e.g., [{start: 10, end: 12}]
      urgency = 'normal', // low | normal | high | urgent
      mustBeThisWeek = false,
      requiresPreparation = false
    } = requirements;

    // 1. Récupérer disponibilités
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (mustBeThisWeek ? 7 : 14));

    const freeSlots = await this.findFreeSlots(startDate, endDate, duration);

    // 2. Scorer chaque slot
    const scoredSlots = freeSlots.map(slot => ({
      ...slot,
      score: this.scoreSlot(slot, requirements)
    }));

    // 3. Trier par score
    scoredSlots.sort((a, b) => b.score - a.score);

    // 4. Vérifier disponibilité participants si fournie
    if (participants.length > 0) {
      const availableSlots = [];

      for (const slot of scoredSlots.slice(0, 10)) {
        const available = await this.checkParticipantsAvailability(
          participants,
          slot.start,
          slot.end
        );

        if (available) {
          availableSlots.push(slot);
        }
      }

      return availableSlots.slice(0, 5);
    }

    return scoredSlots.slice(0, 5);
  }

  scoreSlot(slot, requirements) {
    let score = 100;

    const slotStart = new Date(slot.start);
    const hour = slotStart.getHours();
    const day = slotStart.getDay();

    // Préférence heures de travail
    if (hour < this.preferences.workingHours.start ||
        hour >= this.preferences.workingHours.end) {
      score -= 30;
    }

    // Préférence milieu de journée
    if (hour >= 10 && hour <= 15) {
      score += 20;
    }

    // Éviter début/fin journée
    if (hour === 9 || hour >= 17) {
      score -= 10;
    }

    // Préférence jours
    if (requirements.preferredDays && !requirements.preferredDays.includes(day)) {
      score -= 15;
    }

    // Lundi matin et Vendredi après-midi moins populaires
    if (day === 1 && hour < 11) score -= 10;
    if (day === 5 && hour >= 15) score -= 10;

    // Urgence
    if (requirements.urgency === 'urgent') {
      // Favoriser slots proches
      const daysAway = Math.floor((slotStart - new Date()) / (1000 * 60 * 60 * 24));
      score += Math.max(0, 50 - daysAway * 10);
    }

    // Focus time protection
    const isFocusTime = this.preferences.focusTimeBlocks.some(block =>
      block.day === day && hour >= block.start && hour < block.end
    );

    if (isFocusTime) {
      score -= 40;
    }

    // Lunch time
    if (hour >= this.preferences.lunchTime.start &&
        hour < this.preferences.lunchTime.end) {
      score -= 25;
    }

    return Math.max(0, score);
  }

  async findFreeSlots(startDate, endDate, duration) {
    // Placeholder - requires Google Calendar API
    // In real implementation, would query calendar.freebusy

    // Générer tous les créneaux possibles
    const allSlots = this.generateTimeSlots(startDate, endDate, duration);

    // Pour l'instant, retourner tous les slots (à filtrer avec vraie API)
    return allSlots.slice(0, 20);
  }

  generateTimeSlots(startDate, endDate, duration) {
    const slots = [];
    const current = new Date(startDate);
    current.setHours(this.preferences.workingHours.start, 0, 0, 0);

    while (current < endDate) {
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      // Only during working hours
      if (current.getHours() >= this.preferences.workingHours.start &&
          slotEnd.getHours() <= this.preferences.workingHours.end) {

        slots.push({
          start: new Date(current),
          end: new Date(slotEnd)
        });
      }

      // Next slot (avec buffer)
      current.setMinutes(current.getMinutes() + duration + this.preferences.bufferBetweenMeetings);

      // Si fin de journée, passer au lendemain
      if (current.getHours() >= this.preferences.workingHours.end) {
        current.setDate(current.getDate() + 1);
        current.setHours(this.preferences.workingHours.start, 0, 0, 0);
      }
    }

    return slots;
  }

  async checkParticipantsAvailability(participants, startTime, endTime) {
    // Placeholder - requires Calendar API freebusy query
    return true; // Assume available for now
  }

  /**
   * Conflict Detection & Resolution
   */
  async detectConflicts(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await this.getEvents(startOfDay, endOfDay);

    const conflicts = [];

    for (let i = 0; i < events.length - 1; i++) {
      const event1 = events[i];
      const event2 = events[i + 1];

      const end1 = new Date(event1.end);
      const start2 = new Date(event2.start);

      // Overlap?
      if (end1 > start2) {
        conflicts.push({
          type: 'overlap',
          event1,
          event2,
          severity: 'high'
        });
      }

      // No buffer?
      const gap = (start2 - end1) / 60000; // minutes

      if (gap < this.preferences.bufferBetweenMeetings) {
        conflicts.push({
          type: 'no_buffer',
          event1,
          event2,
          gap,
          severity: 'medium'
        });
      }
    }

    // Too many meetings?
    if (events.length > this.preferences.maxMeetingsPerDay) {
      conflicts.push({
        type: 'overloaded',
        count: events.length,
        max: this.preferences.maxMeetingsPerDay,
        severity: 'medium'
      });
    }

    return conflicts;
  }

  async suggestResolutions(conflicts) {
    const suggestions = [];

    for (const conflict of conflicts) {
      if (conflict.type === 'overlap') {
        // Suggérer reschedule
        const alternatives = await this.findBestSlot({
          duration: 60, // Default
          urgency: 'normal'
        });

        suggestions.push({
          conflict,
          action: 'reschedule',
          target: conflict.event2,
          alternatives: alternatives.slice(0, 3)
        });
      }
    }

    return suggestions;
  }

  /**
   * Meeting Preparation
   */
  async suggestPreparation(event) {
    if (!this.openai) {
      return {
        prepTime: 30,
        tasks: ['Réviser le sujet du meeting'],
        documents: [],
        research: [],
        agenda: []
      };
    }

    const eventStart = new Date(event.start);
    const duration = this.getEventDuration(event);

    // Analyse avec GPT
    const prompt = `
Analyse ce meeting et suggère une préparation:

Titre: ${event.summary || event.title}
Description: ${event.description || 'N/A'}
Durée: ${duration} minutes

Réponds en JSON:
{
  "prepTime": <minutes>,
  "tasks": ["tâche1", "tâche2"],
  "documents": ["doc1 à préparer", "doc2"],
  "research": ["point à rechercher"],
  "agenda": ["point 1", "point 2"]
}
    `.trim();

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      });

      const prep = JSON.parse(response.choices[0].message.content);
      return prep;
    } catch (error) {
      logger.error('Meeting preparation suggestion error:', error);
      return {
        prepTime: 30,
        tasks: ['Préparer le meeting'],
        documents: [],
        research: [],
        agenda: []
      };
    }
  }

  /**
   * Meeting Analytics
   */
  async analyzeMeetingPatterns(startDate, endDate) {
    const events = await this.getEvents(startDate, endDate);

    const analytics = {
      totalMeetings: events.length,
      totalHours: 0,
      averagePerDay: 0,
      byDay: {},
      byHour: {},
      topParticipants: {},
      meetingTypes: {},
      productivity: {
        focusTime: 0,
        meetingTime: 0,
        ratio: 0
      }
    };

    events.forEach(event => {
      const duration = this.getEventDuration(event);
      analytics.totalHours += duration / 60;

      const start = new Date(event.start);
      const day = start.toLocaleDateString();
      const hour = start.getHours();

      analytics.byDay[day] = (analytics.byDay[day] || 0) + 1;
      analytics.byHour[hour] = (analytics.byHour[hour] || 0) + 1;
    });

    const days = Object.keys(analytics.byDay).length;
    analytics.averagePerDay = days > 0 ? analytics.totalMeetings / days : 0;

    // Calcul temps de focus (heures travail - meetings)
    const workingDays = this.countWorkingDays(startDate, endDate);
    const totalWorkHours = workingDays *
      (this.preferences.workingHours.end - this.preferences.workingHours.start);

    analytics.productivity.meetingTime = analytics.totalHours;
    analytics.productivity.focusTime = totalWorkHours - analytics.totalHours;
    analytics.productivity.ratio =
      analytics.productivity.meetingTime > 0 ?
      analytics.productivity.focusTime / analytics.productivity.meetingTime : 0;

    return analytics;
  }

  /**
   * Helpers
   */
  async getEvents(startDate, endDate) {
    // Placeholder - requires Calendar API
    return [];
  }

  getEventDuration(event) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return (end - start) / 60000; // minutes
  }

  countWorkingDays(startDate, endDate) {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const day = current.getDay();
      if (day >= 1 && day <= 5) { // Lundi-Vendredi
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Statistics
   */
  getStats() {
    return {
      slotsAnalyzed: 0,
      meetingsScheduled: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      preparationsGenerated: 0
    };
  }
}

module.exports = CalendarAgentSmart;
