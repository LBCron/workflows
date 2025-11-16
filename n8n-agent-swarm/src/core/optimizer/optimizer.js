/**
 * Agent Optimizer - Wrapper intelligent pour optimiser tous les agents
 *
 * Ajoute automatiquement:
 * - Mega Cache
 * - Budget Guardian
 * - Gestion d'erreurs robuste
 * - Logging professionnel
 * - Métriques de performance
 */

const budgetGuardian = require('../monitoring/budget-guardian');
const megaCache = require('../optimization/mega-cache');
const logger = require('./logger');

class AgentOptimizer {
  /**
   * Optimise une méthode d'agent avec cache, budget, erreurs
   */
  static optimizeMethod(methodName, originalMethod, options = {}) {
    return async function(...args) {
      const startTime = Date.now();
      const agentName = this.name || this.constructor.name;

      try {
        // STEP 1: Check cache (si activé)
        if (options.cache !== false) {
          const cacheKey = JSON.stringify({ method: methodName, args });
          const cached = await megaCache.get(cacheKey);

          if (cached) {
            logger.debug(`${agentName}.${methodName}: Cache HIT`);
            return cached;
          }
        }

        // STEP 2: Check budget avant l'exécution
        const budgetStatus = budgetGuardian.getStatus();
        if (budgetStatus === 'BLOCKED') {
          throw new Error('Budget dépassé - Opération bloquée par Budget Guardian');
        }

        // STEP 3: Exécuter la méthode originale
        logger.info(`${agentName}.${methodName}: Démarrage`);
        const result = await originalMethod.apply(this, args);

        // STEP 4: Sauvegarder dans le cache
        if (options.cache !== false && result) {
          const cacheKey = JSON.stringify({ method: methodName, args });
          await megaCache.set(cacheKey, result, { ttl: options.cacheTTL || 3600 });
        }

        // STEP 5: Logger le succès
        const duration = Date.now() - startTime;
        logger.info(`${agentName}.${methodName}: Succès (${duration}ms)`);

        return result;

      } catch (error) {
        // STEP 6: Gestion d'erreurs robuste
        const duration = Date.now() - startTime;
        logger.error(`${agentName}.${methodName}: Erreur après ${duration}ms`, error);

        // Si l'erreur est liée au budget, la propager
        if (error.message.includes('Budget') || error.message.includes('budget')) {
          throw error;
        }

        // Sinon, retourner une erreur formatée
        throw new Error(`${agentName}.${methodName} a échoué: ${error.message}`);
      }
    };
  }

  /**
   * Optimise tous les agents automatiquement
   */
  static optimizeAgent(agent, options = {}) {
    const proto = Object.getPrototypeOf(agent);
    const methods = Object.getOwnPropertyNames(proto).filter(
      name => name !== 'constructor' && typeof proto[name] === 'function'
    );

    methods.forEach(methodName => {
      const original = agent[methodName];
      agent[methodName] = AgentOptimizer.optimizeMethod(methodName, original, options);
    });

    logger.info(`Agent ${agent.name || agent.constructor.name} optimisé (${methods.length} méthodes)`);
    return agent;
  }

  /**
   * Track cost manually (pour les agents qui font des appels API directs)
   */
  static async trackCost(cost, model, operation) {
    await budgetGuardian.checkAndRecord(cost, model, operation);
    logger.info(`Coût enregistré: $${cost.toFixed(6)} (${model})`);
  }
}

module.exports = AgentOptimizer;
