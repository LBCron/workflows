/**
 * Agent Factory
 */

const logger = require('../core/logger/logger');

class AgentFactory {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.agents = new Map();
  }

  create(type, options = {}) {
    if (this.agents.has(type)) {
      return this.agents.get(type);
    }

    const agentModules = {
      research: './research/research.agent',
      content: './content/content.agent',
      code: './code/code.agent',
      email: './email/email.agent',
      calendar: './calendar/calendar.agent',
      meta: './meta/meta.agent',
      notification: './notification/notification.agent',
      notion: './notion/notion.agent'
    };

    const modulePath = agentModules[type];
    if (!modulePath) {
      throw new Error(`Agent type '${type}' inconnu`);
    }

    try {
      const AgentClass = require(modulePath);
      const agent = new AgentClass({ ...this.dependencies, ...options });
      this.agents.set(type, agent);
      logger.info(`Agent '${type}' créé et mis en cache`);
      return agent;
    } catch (error) {
      logger.error(`Erreur création agent '${type}'`, error);
      throw error;
    }
  }

  get(type) {
    return this.agents.get(type);
  }

  getAll() {
    return Array.from(this.agents.values());
  }
}

module.exports = AgentFactory;
