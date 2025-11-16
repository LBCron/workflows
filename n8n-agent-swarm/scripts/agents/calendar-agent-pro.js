#!/usr/bin/env node

/**
 * Calendar Agent PRO
 *
 * Agent de gestion d'agenda intelligent avec Google Calendar
 */

const router = require('../ai-core/intelligent-router-pro');

class CalendarAgentPro {
  constructor() {
    this.calendar = null;

    this.actions = {
      list: {
        name: 'LISTER',
        description: 'Voir événements à venir',
        priority: 'low',
        expectedCost: 0
      },
      create: {
        name: 'CRÉER',
        description: 'Créer nouvel événement',
        priority: 'normal',
        expectedCost: 0.001
      },
      smart_create: {
        name: 'CRÉATION_INTELLIGENTE',
        description: 'Parser description et créer événement',
        priority: 'normal',
        expectedCost: 0.003
      },
      summarize: {
        name: 'RÉSUMÉ',
        description: 'Résumer agenda du jour/semaine',
        priority: 'normal',
        expectedCost: 0.002
      }
    };
  }

  // ===== GOOGLE CALENDAR INTEGRATION =====

  async connect() {
    if (this.calendar) return this.calendar;

    try {
      const { google } = require('googleapis');

      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback'
      );

      if (process.env.GOOGLE_REFRESH_TOKEN) {
        auth.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });
      }

      this.calendar = google.calendar({ version: 'v3', auth });
      return this.calendar;

    } catch (error) {
      throw new Error(`Calendar connection failed: ${error.message}\nInstall: npm install googleapis`);
    }
  }

  // ===== BASIC OPERATIONS =====

  async listEvents(timeMin = new Date(), timeMax = null, maxResults = 10) {
    const calendar = await this.connect();

    const params = {
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    };

    if (timeMax) {
      params.timeMax = timeMax.toISOString();
    }

    const res = await calendar.events.list(params);

    return res.data.items.map(event => ({
      id: event.id,
      summary: event.summary || '(Sans titre)',
      description: event.description || '',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || '',
      attendees: event.attendees || [],
      htmlLink: event.htmlLink,
      isAllDay: !event.start.dateTime
    }));
  }

  async createEvent(summary, start, end, description = '', location = '') {
    const calendar = await this.connect();

    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: start.toISOString(),
        timeZone: process.env.TIMEZONE || 'Europe/Paris'
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: process.env.TIMEZONE || 'Europe/Paris'
      }
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    return {
      success: true,
      eventId: res.data.id,
      summary: res.data.summary,
      start: res.data.start.dateTime,
      link: res.data.htmlLink
    };
  }

  async updateEvent(eventId, updates) {
    const calendar = await this.connect();

    const res = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      resource: updates
    });

    return {
      success: true,
      eventId: res.data.id,
      summary: res.data.summary,
      link: res.data.htmlLink
    };
  }

  async deleteEvent(eventId) {
    const calendar = await this.connect();

    await calendar.events.delete({
      calendarId: 'primary',
      eventId
    });

    return {
      success: true,
      eventId,
      message: 'Événement supprimé'
    };
  }

  // ===== AI-POWERED FEATURES =====

  async todayAgenda() {
    console.log('📅 Getting today\'s agenda...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await this.listEvents(today, tomorrow, 50);

    if (events.length === 0) {
      return {
        summary: "📅 Aucun événement aujourd'hui ! Journée libre 🎉",
        count: 0,
        events: []
      };
    }

    // Trier par heure
    events.sort((a, b) => new Date(a.start) - new Date(b.start));

    // Formater pour l'utilisateur
    const formatted = events.map(e => {
      const startTime = new Date(e.start);
      const endTime = new Date(e.end);

      if (e.isAllDay) {
        return `📌 Toute la journée: ${e.summary}`;
      }

      const timeStr = startTime.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const endTimeStr = endTime.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      let line = `⏰ ${timeStr}-${endTimeStr}: ${e.summary}`;
      if (e.location) line += ` 📍 ${e.location}`;

      return line;
    }).join('\n');

    return {
      summary: `📅 **Agenda du ${today.toLocaleDateString('fr-FR')}** (${events.length} événement${events.length > 1 ? 's' : ''})\n\n${formatted}`,
      count: events.length,
      events: events.slice(0, 10)
    };
  }

  async weekAgenda() {
    console.log('📅 Getting week agenda...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const events = await this.listEvents(today, nextWeek, 100);

    if (events.length === 0) {
      return {
        summary: "📅 Aucun événement cette semaine !",
        count: 0,
        events: []
      };
    }

    // Grouper par jour
    const byDay = {};
    for (const event of events) {
      const day = new Date(event.start).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });

      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(event);
    }

    // Formater
    let formatted = '';
    for (const [day, dayEvents] of Object.entries(byDay)) {
      formatted += `\n**${day}** (${dayEvents.length})\n`;
      dayEvents.slice(0, 5).forEach(e => {
        const time = new Date(e.start).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        formatted += `  ⏰ ${time} - ${e.summary}\n`;
      });
      if (dayEvents.length > 5) {
        formatted += `  ... et ${dayEvents.length - 5} autre(s)\n`;
      }
    }

    return {
      summary: `📅 **Agenda de la semaine** (${events.length} événements)${formatted}`,
      count: events.length,
      events,
      byDay
    };
  }

  async smartSchedule(description) {
    console.log(`🤖 Smart scheduling: "${description}"...`);

    const prompt = `Tu es un assistant agenda intelligent. Parse cette demande de rendez-vous et extrais les informations suivantes:

DEMANDE: "${description}"

INSTRUCTIONS:
- Détermine le titre de l'événement
- Détermine la date et l'heure (utilise la date du jour si non spécifié: ${new Date().toLocaleDateString('fr-FR')})
- Détermine la durée (défaut: 1 heure)
- Détermine le lieu si mentionné
- Détermine la description si applicable

IMPORTANT: Retourne UNIQUEMENT un objet JSON valide avec cette structure:
{
  "title": "Titre de l'événement",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "duration": 60,
  "location": "Lieu (optionnel)",
  "description": "Description (optionnel)"
}

Ne retourne RIEN d'autre que le JSON. Pas de markdown, pas d'explication.`;

    const result = await router.route(prompt, {
      type: 'analysis',
      priority: 'normal',
      maxTokens: 500
    });

    try {
      // Extract JSON from response
      let jsonStr = result.content.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const parsed = JSON.parse(jsonStr);

      // Valider les données
      if (!parsed.title || !parsed.date || !parsed.time) {
        throw new Error('Missing required fields: title, date, or time');
      }

      // Créer les dates
      const [year, month, day] = parsed.date.split('-').map(Number);
      const [hour, minute] = parsed.time.split(':').map(Number);

      const start = new Date(year, month - 1, day, hour, minute);
      const end = new Date(start.getTime() + (parsed.duration || 60) * 60000);

      // Créer l'événement
      const event = await this.createEvent(
        parsed.title,
        start,
        end,
        parsed.description || '',
        parsed.location || ''
      );

      return {
        success: true,
        event,
        parsed,
        cost: result.cost
      };

    } catch (error) {
      console.error('Error parsing AI response:', error.message);
      console.error('AI Response:', result.content);

      return {
        success: false,
        error: `Impossible de parser la demande: ${error.message}`,
        aiResponse: result.content,
        suggestion: 'Essayez de reformuler avec plus de détails (date, heure, titre)'
      };
    }
  }

  async findFreeSlots(date = new Date(), durationMinutes = 60, workHoursOnly = true) {
    console.log(`🔍 Finding free slots for ${date.toLocaleDateString('fr-FR')}...`);

    // Début et fin de la journée
    const dayStart = new Date(date);
    dayStart.setHours(workHoursOnly ? 9 : 0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(workHoursOnly ? 18 : 23, 0, 0, 0);

    // Récupérer les événements du jour
    const events = await this.listEvents(dayStart, dayEnd, 50);

    // Trier par heure de début
    events.sort((a, b) => new Date(a.start) - new Date(b.start));

    // Trouver les créneaux libres
    const freeSlots = [];
    let currentTime = dayStart;

    for (const event of events) {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // S'il y a un créneau libre avant cet événement
      if (eventStart - currentTime >= durationMinutes * 60000) {
        freeSlots.push({
          start: new Date(currentTime),
          end: new Date(eventStart),
          duration: Math.floor((eventStart - currentTime) / 60000)
        });
      }

      // Avancer après cet événement
      if (eventEnd > currentTime) {
        currentTime = eventEnd;
      }
    }

    // Créneau libre jusqu'à la fin de journée
    if (dayEnd - currentTime >= durationMinutes * 60000) {
      freeSlots.push({
        start: new Date(currentTime),
        end: new Date(dayEnd),
        duration: Math.floor((dayEnd - currentTime) / 60000)
      });
    }

    // Formater
    const formatted = freeSlots.map(slot => {
      const startTime = slot.start.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const endTime = slot.end.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `⚪ ${startTime}-${endTime} (${slot.duration} min)`;
    }).join('\n');

    return {
      date: date.toLocaleDateString('fr-FR'),
      freeSlots,
      count: freeSlots.length,
      summary: freeSlots.length > 0
        ? `🕐 **Créneaux libres le ${date.toLocaleDateString('fr-FR')}**\n\n${formatted}`
        : `❌ Aucun créneau libre de ${durationMinutes} min`
    };
  }

  async summarizeWeek() {
    console.log('📊 Summarizing week with AI...');

    const weekData = await this.weekAgenda();

    if (weekData.count === 0) {
      return {
        summary: "📅 Semaine tranquille, aucun événement prévu !",
        cost: 0
      };
    }

    // Préparer les données pour l'IA
    const eventsList = weekData.events.map(e => {
      const date = new Date(e.start).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric'
      });
      const time = new Date(e.start).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${date} ${time} - ${e.summary}`;
    }).join('\n');

    const prompt = `Tu es un assistant agenda. Analyse cette liste d'événements de la semaine et fournis un résumé intelligent en français:

ÉVÉNEMENTS (${weekData.count}):
${eventsList}

INSTRUCTIONS:
- Identifie les jours les plus chargés
- Note les patterns (meetings récurrents, etc.)
- Suggère des optimisations si applicable
- Sois concis (max 150 mots)

Fournis un résumé clair et actionnable.`;

    const result = await router.route(prompt, {
      type: 'analysis',
      priority: 'normal',
      maxTokens: 500
    });

    return {
      summary: `📊 **Résumé de la semaine** (${weekData.count} événements)\n\n${result.content}`,
      count: weekData.count,
      cost: result.cost,
      cached: result.cached
    };
  }

  // ===== STATUS =====

  async getStatus() {
    const status = {
      connected: false,
      actions: Object.keys(this.actions)
    };

    try {
      await this.connect();
      // Test connection
      await this.listEvents(new Date(), null, 1);
      status.connected = true;
    } catch (error) {
      status.error = error.message;
    }

    return status;
  }
}

module.exports = new CalendarAgentPro();

// CLI test
if (require.main === module) {
  (async () => {
    console.log('🧪 Testing Calendar Agent Pro...\n');

    const agent = new CalendarAgentPro();

    try {
      const status = await agent.getStatus();
      console.log('Status:', JSON.stringify(status, null, 2));

      if (status.connected) {
        console.log('\n📅 Testing today\'s agenda...');
        const today = await agent.todayAgenda();
        console.log(today.summary);

        console.log('\n🔍 Finding free slots...');
        const slots = await agent.findFreeSlots();
        console.log(slots.summary);
      }

      console.log('\n✅ Calendar Agent test passed!');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.log('\n💡 Configure environment variables:');
      console.log('   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
    }
  })();
}
