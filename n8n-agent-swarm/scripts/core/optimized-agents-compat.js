/**
 * Compatibility layer - redirects to new structure
 * @deprecated Use src/agents/index.js instead
 */

const AgentFactory = require('../../src/agents');
const factory = new AgentFactory();

// For backward compatibility, export optimized instances
module.exports = {
  research: factory.create('research'),
  content: factory.create('content'),
  code: factory.create('code'),
  email: factory.create('email'),
  calendar: factory.create('calendar'),
  meta: factory.create('meta')
};
