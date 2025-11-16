/**
 * Optimized Agents - Tous les agents avec optimisations automatiques
 *
 * Ce fichier charge tous les agents et applique automatiquement:
 * - Mega Cache
 * - Budget Guardian
 * - Gestion d'erreurs robuste
 * - Logging professionnel
 */

const AgentOptimizer = require('./agent-optimizer');
const logger = require('./logger');

// Load all agents
const researchAgent = require('../agents/research-agent-pro');
const contentCreator = require('../agents/content-creator-pro');
const codeAssistant = require('../agents/code-assistant-pro');
const emailAgent = require('../agents/email-agent-pro');
const calendarAgent = require('../agents/calendar-agent-pro');
const metaAgent = require('../agents/meta-agent');

// Optimize all agents
logger.info('🚀 Optimisation des agents...');

const optimizedAgents = {
  research: AgentOptimizer.optimizeAgent(researchAgent, {
    cache: true,
    cacheTTL: 7200  // 2h cache for research (factual data)
  }),

  content: AgentOptimizer.optimizeAgent(contentCreator, {
    cache: true,
    cacheTTL: 3600  // 1h cache for content
  }),

  code: AgentOptimizer.optimizeAgent(codeAssistant, {
    cache: true,
    cacheTTL: 1800  // 30min cache for code (changes frequently)
  }),

  email: AgentOptimizer.optimizeAgent(emailAgent, {
    cache: false  // No cache for email (real-time data)
  }),

  calendar: AgentOptimizer.optimizeAgent(calendarAgent, {
    cache: false  // No cache for calendar (real-time data)
  }),

  meta: AgentOptimizer.optimizeAgent(metaAgent, {
    cache: false  // No cache for meta-agent (creates new agents)
  })
};

logger.info('✅ Tous les agents optimisés et prêts!');

module.exports = optimizedAgents;
