/**
 * 📅 CALENDAR AGENT PRO v4.0
 *
 * Gestion complète du calendrier via Google Calendar
 *
 * Fonctionnalités:
 * - ✅ Création d'événements
 * - ✅ Liste et recherche d'événements
 * - ✅ Modification et suppression
 * - ✅ Gestion des rappels
 * - ✅ Détection de conflits
 * - ✅ Suggestions de créneaux libres
 * - ✅ Invitations et participants
 * - ✅ Récurrence (événements répétitifs)
 */

const { google } = require('googleapis');
const logger = require('../../core/logger/logger');

class CalendarAgentPro {
  constructor(config = {}) {
    this.config = config;
    this.calendar = null;
    this.initialized = false;

    logger.info('📅 Calendar Agent Pro initialisé');
  }

  /**
   * Initialise la connexion Google Calendar
   */
  async initialize() {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      this.initialized = true;

      logger.info('✅ Calendar Agent connecté');

      return { success: true };
    } catch (error) {
      logger.error('❌ Erreur initialisation calendar', { error: error.message });
      throw error;
    }
  }

  /**
   * 📝 CRÉER UN ÉVÉNEMENT
   *
   * @param {Object} eventData - Données de l'événement
   * @returns {Object} Événement créé
   */
  async createEvent(eventData) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        summary,
        description,
        location,
        startTime,
        endTime,
        attendees = [],
        reminders = [],
        recurrence,
        colorId
      } = eventData;

      const event = {
        summary,
        description,
        location,
        start: {
          dateTime: startTime,
          timeZone: 'Europe/Paris'
        },
        end: {
          dateTime: endTime,
          timeZone: 'Europe/Paris'
        },
        attendees: attendees.map(email => ({ email })),
        reminders: {
          useDefault: reminders.length === 0,
          overrides: reminders.map(minutes => ({
            method: 'popup',
            minutes
          }))
        },
        colorId
      };

      if (recurrence) {
        event.recurrence = [recurrence];
      }

      const result = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: attendees.length > 0 ? 'all' : 'none'
      });

      logger.info('✅ Événement créé', {
        id: result.data.id,
        summary,
        start: startTime
      });

      return {
        success: true,
        event: result.data,
        id: result.data.id,
        link: result.data.htmlLink
      };
    } catch (error) {
      logger.error('❌ Erreur création événement', { error: error.message });
      throw error;
    }
  }

  /**
   * 📋 LISTER LES ÉVÉNEMENTS
   *
   * @param {Object} filters - Filtres de recherche
   * @returns {Array} Liste d'événements
   */
  async listEvents(filters = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        timeMin = new Date().toISOString(),
        timeMax,
        maxResults = 10,
        q
      } = filters;

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
        q
      });

      const events = response.data.items || [];

      logger.info('📋 Événements récupérés', { count: events.length });

      return events.map(e => ({
        id: e.id,
        summary: e.summary,
        description: e.description,
        location: e.location,
        start: e.start.dateTime || e.start.date,
        end: e.end.dateTime || e.end.date,
        attendees: e.attendees?.map(a => a.email) || [],
        link: e.htmlLink,
        status: e.status
      }));
    } catch (error) {
      logger.error('❌ Erreur liste événements', { error: error.message });
      throw error;
    }
  }

  /**
   * 🔍 RECHERCHER DES ÉVÉNEMENTS
   *
   * @param {Object} criteria - Critères de recherche
   * @returns {Array} Événements correspondants
   */
  async searchEvents(criteria) {
    const { keyword, dateFrom, dateTo, location, attendee } = criteria;

    let q = keyword || '';
    if (location) q += ` ${location}`;
    if (attendee) q += ` ${attendee}`;

    return await this.listEvents({
      q: q.trim(),
      timeMin: dateFrom,
      timeMax: dateTo,
      maxResults: 50
    });
  }

  /**
   * ✏️ MODIFIER UN ÉVÉNEMENT
   *
   * @param {string} eventId - ID de l'événement
   * @param {Object} updates - Modifications
   * @returns {Object} Événement modifié
   */
  async updateEvent(eventId, updates) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Récupérer l'événement existant
      const existing = await this.calendar.events.get({
        calendarId: 'primary',
        eventId
      });

      // Appliquer les modifications
      const event = {
        ...existing.data,
        ...updates
      };

      if (updates.startTime) {
        event.start = {
          dateTime: updates.startTime,
          timeZone: 'Europe/Paris'
        };
      }

      if (updates.endTime) {
        event.end = {
          dateTime: updates.endTime,
          timeZone: 'Europe/Paris'
        };
      }

      const result = await this.calendar.events.update({
        calendarId: 'primary',
        eventId,
        resource: event,
        sendUpdates: 'all'
      });

      logger.info('✅ Événement modifié', { id: eventId });

      return {
        success: true,
        event: result.data
      };
    } catch (error) {
      logger.error('❌ Erreur modification événement', { error: error.message });
      throw error;
    }
  }

  /**
   * 🗑️ SUPPRIMER UN ÉVÉNEMENT
   *
   * @param {string} eventId - ID de l'événement
   * @returns {Object} Résultat
   */
  async deleteEvent(eventId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all'
      });

      logger.info('✅ Événement supprimé', { id: eventId });

      return { success: true, deleted: eventId };
    } catch (error) {
      logger.error('❌ Erreur suppression événement', { error: error.message });
      throw error;
    }
  }

  /**
   * ⚠️ DÉTECTER LES CONFLITS
   *
   * @param {Object} eventData - Données du nouvel événement
   * @returns {Object} Résultat avec conflits éventuels
   */
  async detectConflicts(eventData) {
    try {
      const { startTime, endTime } = eventData;

      // Récupérer les événements dans la plage horaire
      const events = await this.listEvents({
        timeMin: startTime,
        timeMax: endTime
      });

      const conflicts = events.filter(e => {
        const eStart = new Date(e.start);
        const eEnd = new Date(e.end);
        const newStart = new Date(startTime);
        const newEnd = new Date(endTime);

        // Vérifier le chevauchement
        return (newStart < eEnd && newEnd > eStart);
      });

      logger.info('⚠️ Conflits détectés', { count: conflicts.length });

      return {
        hasConflicts: conflicts.length > 0,
        conflicts: conflicts.map(c => ({
          id: c.id,
          summary: c.summary,
          start: c.start,
          end: c.end
        }))
      };
    } catch (error) {
      logger.error('❌ Erreur détection conflits', { error: error.message });
      throw error;
    }
  }

  /**
   * 💡 SUGGÉRER DES CRÉNEAUX LIBRES
   *
   * @param {Object} preferences - Préférences de recherche
   * @returns {Array} Créneaux disponibles
   */
  async suggestFreeSlots(preferences) {
    try {
      const {
        duration = 60, // minutes
        dateFrom = new Date().toISOString(),
        dateTo,
        workHoursOnly = true
      } = preferences;

      // Récupérer tous les événements dans la période
      const events = await this.listEvents({
        timeMin: dateFrom,
        timeMax: dateTo,
        maxResults: 100
      });

      // Trouver les créneaux libres
      const freeSlots = [];
      let currentTime = new Date(dateFrom);
      const endTime = new Date(dateTo);

      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + duration * 60000);

        // Vérifier si le créneau est pendant les heures de travail
        if (workHoursOnly) {
          const hour = currentTime.getHours();
          if (hour < 9 || hour >= 18) {
            currentTime = new Date(currentTime.getTime() + 30 * 60000);
            continue;
          }
        }

        // Vérifier les conflits
        const hasConflict = events.some(e => {
          const eStart = new Date(e.start);
          const eEnd = new Date(e.end);
          return (currentTime < eEnd && slotEnd > eStart);
        });

        if (!hasConflict) {
          freeSlots.push({
            start: currentTime.toISOString(),
            end: slotEnd.toISOString(),
            duration
          });
        }

        // Avancer de 30 minutes
        currentTime = new Date(currentTime.getTime() + 30 * 60000);
      }

      logger.info('💡 Créneaux libres trouvés', { count: freeSlots.length });

      return freeSlots.slice(0, 10); // Limiter à 10 suggestions
    } catch (error) {
      logger.error('❌ Erreur suggestion créneaux', { error: error.message });
      throw error;
    }
  }

  /**
   * 📊 OBTENIR UN RÉSUMÉ DU CALENDRIER
   *
   * @param {Object} period - Période à analyser
   * @returns {Object} Résumé
   */
  async getSummary(period = {}) {
    try {
      const {
        timeMin = new Date().toISOString(),
        timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      } = period;

      const events = await this.listEvents({ timeMin, timeMax, maxResults: 100 });

      const summary = {
        total: events.length,
        upcoming: events.filter(e => new Date(e.start) > new Date()).length,
        today: events.filter(e => {
          const start = new Date(e.start);
          const today = new Date();
          return start.toDateString() === today.toDateString();
        }).length,
        thisWeek: events.length,
        locations: {},
        attendees: {}
      };

      // Analyser les lieux et participants
      events.forEach(e => {
        if (e.location) {
          summary.locations[e.location] = (summary.locations[e.location] || 0) + 1;
        }
        e.attendees?.forEach(attendee => {
          summary.attendees[attendee] = (summary.attendees[attendee] || 0) + 1;
        });
      });

      // Top 5 lieux et participants
      summary.topLocations = Object.entries(summary.locations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([location, count]) => ({ location, count }));

      summary.topAttendees = Object.entries(summary.attendees)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([email, count]) => ({ email, count }));

      logger.info('📊 Résumé calendrier généré', { total: summary.total });

      return summary;
    } catch (error) {
      logger.error('❌ Erreur résumé calendrier', { error: error.message });
      throw error;
    }
  }

  /**
   * 🔔 CONFIGURER DES RAPPELS
   *
   * @param {string} eventId - ID de l'événement
   * @param {Array} reminders - Rappels (en minutes)
   * @returns {Object} Résultat
   */
  async setReminders(eventId, reminders) {
    return await this.updateEvent(eventId, {
      reminders: {
        useDefault: false,
        overrides: reminders.map(minutes => ({
          method: 'popup',
          minutes
        }))
      }
    });
  }

  /**
   * 🔁 CRÉER UN ÉVÉNEMENT RÉCURRENT
   *
   * @param {Object} eventData - Données de l'événement
   * @param {Object} recurrenceRule - Règle de récurrence
   * @returns {Object} Événement créé
   */
  async createRecurringEvent(eventData, recurrenceRule) {
    const { frequency, interval = 1, count, until } = recurrenceRule;

    let rrule = `RRULE:FREQ=${frequency}`;
    if (interval > 1) rrule += `;INTERVAL=${interval}`;
    if (count) rrule += `;COUNT=${count}`;
    if (until) rrule += `;UNTIL=${until}`;

    return await this.createEvent({
      ...eventData,
      recurrence: rrule
    });
  }
}

module.exports = CalendarAgentPro;
