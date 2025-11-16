/**
 * ⚡ WORKFLOW ENGINE v4.0
 *
 * Système d'automations et workflows
 */

const logger = require('../logger/logger');
const cron = require('node-cron');

class WorkflowEngine {
  constructor() {
    this.workflows = new Map();
    this.scheduledTasks = new Map();

    logger.info('⚡ Workflow Engine initialisé');
  }

  /**
   * Créer un workflow
   */
  createWorkflow(name, steps) {
    const workflow = {
      name,
      steps,
      createdAt: new Date(),
      lastRun: null,
      runCount: 0
    };

    this.workflows.set(name, workflow);

    logger.info('✅ Workflow créé', { name, stepCount: steps.length });

    return workflow;
  }

  /**
   * Exécuter un workflow
   */
  async executeWorkflow(name, context = {}) {
    const workflow = this.workflows.get(name);

    if (!workflow) {
      throw new Error('Workflow non trouvé: ' + name);
    }

    logger.info('▶️ Exécution workflow', { name });

    let results = [];
    let currentContext = { ...context };

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];

      try {
        logger.info('⏭️ Étape ' + (i + 1), { step: step.name });

        const result = await step.execute(currentContext);

        results.push({
          step: step.name,
          success: true,
          result
        });

        if (result && typeof result === 'object') {
          currentContext = { ...currentContext, ...result };
        }

      } catch (error) {
        logger.error('❌ Erreur étape workflow', {
          workflow: name,
          step: step.name,
          error: error.message
        });

        results.push({
          step: step.name,
          success: false,
          error: error.message
        });

        if (step.stopOnError !== false) {
          break;
        }
      }
    }

    workflow.lastRun = new Date();
    workflow.runCount++;

    logger.info('✅ Workflow terminé', {
      name,
      steps: results.length,
      success: results.every(r => r.success)
    });

    return {
      workflow: name,
      results,
      success: results.every(r => r.success)
    };
  }

  /**
   * Planifier un workflow (cron)
   */
  scheduleWorkflow(name, cronExpression) {
    if (this.scheduledTasks.has(name)) {
      this.scheduledTasks.get(name).stop();
    }

    const task = cron.schedule(cronExpression, async () => {
      logger.info('⏰ Exécution planifiée', { workflow: name });
      await this.executeWorkflow(name);
    });

    this.scheduledTasks.set(name, task);

    logger.info('⏰ Workflow planifié', { name, cron: cronExpression });

    return task;
  }

  /**
   * Arrêter une tâche planifiée
   */
  stopScheduledWorkflow(name) {
    const task = this.scheduledTasks.get(name);

    if (task) {
      task.stop();
      this.scheduledTasks.delete(name);
      logger.info('⏸️ Tâche planifiée arrêtée', { name });
    }
  }

  /**
   * Lister tous les workflows
   */
  listWorkflows() {
    return Array.from(this.workflows.values()).map(w => ({
      name: w.name,
      steps: w.steps.length,
      lastRun: w.lastRun,
      runCount: w.runCount
    }));
  }

  /**
   * Templates de workflows pré-configurés
   */
  createDailyReportWorkflow() {
    return this.createWorkflow('daily-report', [
      {
        name: 'Récupérer emails',
        execute: async (ctx) => {
          return { emails: [] };
        }
      },
      {
        name: 'Analyser emails',
        execute: async (ctx) => {
          return { summary: 'Analyse des emails...' };
        }
      },
      {
        name: 'Envoyer rapport',
        execute: async (ctx) => {
          return { sent: true };
        }
      }
    ]);
  }

  createSocialMediaWorkflow() {
    return this.createWorkflow('social-media-post', [
      {
        name: 'Générer contenu',
        execute: async (ctx) => {
          return { content: 'Contenu généré...' };
        }
      },
      {
        name: 'Créer image',
        execute: async (ctx) => {
          return { image: 'URL image...' };
        }
      },
      {
        name: 'Publier',
        execute: async (ctx) => {
          return { posted: true };
        }
      }
    ]);
  }
}

module.exports = new WorkflowEngine();
