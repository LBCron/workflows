#!/usr/bin/env node

/**
 * Agent Template - Base pour tous les agents
 *
 * Ce template peut être copié pour créer manuellement de nouveaux agents
 * ou utilisé comme référence par le Meta-Agent
 */

const router = require('../../core/router/router');

class AgentTemplate {
  constructor() {
    this.name = 'template-agent';
    this.description = 'Template de base pour créer des agents';
    this.capabilities = ['example-action'];
  }

  /**
   * Action exemple
   * @param {string} param - Paramètre exemple
   * @returns {Object} Résultat de l'action
   */
  async exampleAction(param) {
    console.log(`🔧 ${this.name}: exampleAction(${param})`);

    try {
      // Validation
      if (!param) {
        throw new Error('Paramètre requis');
      }

      // Utiliser le router intelligent si besoin d'IA
      const result = await router.route({
        prompt: `Action: ${param}`,
        type: 'analysis'
      });

      return {
        success: true,
        data: result.content,
        cost: result.cost
      };

    } catch (error) {
      console.error(`❌ Error in exampleAction:`, error.message);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get agent status
   */
  async getStatus() {
    return {
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
      ready: true
    };
  }
}

module.exports = new AgentTemplate();

// CLI test
if (require.main === module) {
  (async () => {
    console.log('🧪 Testing Agent Template...\n');

    const agent = new AgentTemplate();

    // Test status
    const status = await agent.getStatus();
    console.log('Status:', JSON.stringify(status, null, 2));

    // Test action
    console.log('\nTest action:');
    const result = await agent.exampleAction('test parameter');
    console.log('Result:', JSON.stringify(result, null, 2));

    console.log('\n✅ Template test passed!');
  })();
}
