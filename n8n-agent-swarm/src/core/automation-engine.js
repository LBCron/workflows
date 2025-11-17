/**
 * Automation Engine v2.0
 *
 * Moteur d'automatisation avec:
 * - Workflow builder
 * - Triggers (event, schedule, webhook)
 * - Actions (email, calendar, notification, etc.)
 * - Conditional logic
 * - Variables & data transformation
 * - Error handling & retry
 * - Execution history
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class AutomationEngine extends EventEmitter {
  constructor() {
    super();

    // Workflows stockés
    this.workflows = new Map(); // workflowId → workflow

    // Executions actives
    this.activeExecutions = new Map(); // executionId → execution

    // History
    this.executionHistory = []; // Last 1000 executions
    this.maxHistorySize = 1000;

    // Triggers actifs
    this.activeTriggers = new Map(); // triggerId → trigger instance

    // Stats
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      workflowsActive: 0
    };

    logger.info('🤖 Automation Engine initialized');
  }

  /**
   * Workflow Management
   */
  createWorkflow(definition) {
    const workflow = {
      id: this.generateId(),
      name: definition.name,
      description: definition.description || '',
      enabled: definition.enabled !== false,
      trigger: definition.trigger,
      actions: definition.actions || [],
      conditions: definition.conditions || [],
      variables: definition.variables || {},
      errorHandling: definition.errorHandling || { retry: true, maxRetries: 3 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecutedAt: null,
      executionCount: 0
    };

    this.workflows.set(workflow.id, workflow);

    // Activer trigger si workflow enabled
    if (workflow.enabled) {
      this.activateTrigger(workflow);
    }

    logger.info(`✅ Workflow created: ${workflow.name} (${workflow.id})`);

    return workflow;
  }

  updateWorkflow(workflowId, updates) {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Désactiver ancien trigger
    this.deactivateTrigger(workflowId);

    // Appliquer updates
    Object.assign(workflow, updates, {
      updatedAt: new Date().toISOString()
    });

    // Réactiver si enabled
    if (workflow.enabled) {
      this.activateTrigger(workflow);
    }

    logger.info(`✅ Workflow updated: ${workflow.name}`);

    return workflow;
  }

  deleteWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Désactiver trigger
    this.deactivateTrigger(workflowId);

    // Supprimer
    this.workflows.delete(workflowId);

    logger.info(`🗑️ Workflow deleted: ${workflow.name}`);
  }

  getWorkflow(workflowId) {
    return this.workflows.get(workflowId);
  }

  listWorkflows(filters = {}) {
    let workflows = Array.from(this.workflows.values());

    if (filters.enabled !== undefined) {
      workflows = workflows.filter(w => w.enabled === filters.enabled);
    }

    if (filters.triggerType) {
      workflows = workflows.filter(w => w.trigger.type === filters.triggerType);
    }

    return workflows;
  }

  /**
   * Trigger System
   */
  activateTrigger(workflow) {
    const { id, trigger } = workflow;

    if (trigger.type === 'schedule') {
      this.activateScheduleTrigger(id, trigger);
    } else if (trigger.type === 'event') {
      this.activateEventTrigger(id, trigger);
    } else if (trigger.type === 'webhook') {
      this.activateWebhookTrigger(id, trigger);
    } else if (trigger.type === 'manual') {
      // Manual triggers don't need activation
      logger.info(`Manual trigger for workflow ${id}`);
    }

    this.stats.workflowsActive++;
  }

  activateScheduleTrigger(workflowId, trigger) {
    // Schedule: { type: 'schedule', cron: '0 9 * * *' }
    const schedule = require('node-schedule');

    const job = schedule.scheduleJob(trigger.cron, async () => {
      await this.executeWorkflow(workflowId, { source: 'schedule' });
    });

    this.activeTriggers.set(workflowId, {
      type: 'schedule',
      job
    });

    logger.info(`⏰ Schedule trigger activated for workflow ${workflowId}: ${trigger.cron}`);
  }

  activateEventTrigger(workflowId, trigger) {
    // Event: { type: 'event', eventName: 'email_received', filters: {...} }
    const handler = async (eventData) => {
      // Vérifier filters
      if (this.matchesFilters(eventData, trigger.filters)) {
        await this.executeWorkflow(workflowId, {
          source: 'event',
          eventName: trigger.eventName,
          data: eventData
        });
      }
    };

    this.on(trigger.eventName, handler);

    this.activeTriggers.set(workflowId, {
      type: 'event',
      eventName: trigger.eventName,
      handler
    });

    logger.info(`📡 Event trigger activated for workflow ${workflowId}: ${trigger.eventName}`);
  }

  activateWebhookTrigger(workflowId, trigger) {
    // Webhook: { type: 'webhook', path: '/webhook/my-workflow' }
    const webhookId = this.generateId();

    this.activeTriggers.set(workflowId, {
      type: 'webhook',
      webhookId,
      path: trigger.path
    });

    logger.info(`🔗 Webhook trigger activated for workflow ${workflowId}: ${trigger.path}`);
  }

  deactivateTrigger(workflowId) {
    const trigger = this.activeTriggers.get(workflowId);

    if (!trigger) return;

    if (trigger.type === 'schedule' && trigger.job) {
      trigger.job.cancel();
    } else if (trigger.type === 'event') {
      this.off(trigger.eventName, trigger.handler);
    }

    this.activeTriggers.delete(workflowId);
    this.stats.workflowsActive = Math.max(0, this.stats.workflowsActive - 1);
  }

  matchesFilters(data, filters) {
    if (!filters) return true;

    for (const [key, value] of Object.entries(filters)) {
      if (data[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Workflow Execution
   */
  async executeWorkflow(workflowId, context = {}) {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.enabled) {
      logger.warn(`Workflow ${workflow.name} is disabled`);
      return null;
    }

    const execution = {
      id: this.generateId(),
      workflowId,
      workflowName: workflow.name,
      startTime: Date.now(),
      endTime: null,
      status: 'running',
      steps: [],
      context: { ...workflow.variables, ...context },
      error: null,
      retryCount: 0
    };

    this.activeExecutions.set(execution.id, execution);

    try {
      logger.info(`▶️ Executing workflow: ${workflow.name} (${execution.id})`);

      // Évaluer conditions
      const conditionsPassed = await this.evaluateConditions(workflow.conditions, execution.context);

      if (!conditionsPassed) {
        execution.status = 'skipped';
        execution.endTime = Date.now();
        logger.info(`⏭️ Workflow ${workflow.name} skipped (conditions not met)`);
        return this.finalizeExecution(execution);
      }

      // Exécuter actions séquentiellement
      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i];

        const stepResult = await this.executeAction(action, execution.context);

        execution.steps.push({
          actionName: action.name || `Action ${i + 1}`,
          actionType: action.type,
          status: stepResult.success ? 'success' : 'failed',
          output: stepResult.output,
          error: stepResult.error,
          duration: stepResult.duration
        });

        // Si action échoue et pas de error handling, arrêter
        if (!stepResult.success && !workflow.errorHandling.continueOnError) {
          throw new Error(`Action ${action.name} failed: ${stepResult.error}`);
        }

        // Mettre à jour contexte avec output de l'action
        if (stepResult.output) {
          execution.context[`step${i + 1}_output`] = stepResult.output;
        }
      }

      execution.status = 'success';
      execution.endTime = Date.now();

      logger.info(`✅ Workflow ${workflow.name} completed successfully`);

      this.stats.successfulExecutions++;

    } catch (error) {
      logger.error(`❌ Workflow ${workflow.name} failed:`, error);

      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = Date.now();

      // Retry si configuré
      if (workflow.errorHandling.retry &&
          execution.retryCount < workflow.errorHandling.maxRetries) {

        execution.retryCount++;

        logger.info(`🔄 Retrying workflow ${workflow.name} (attempt ${execution.retryCount})`);

        // Wait before retry (exponential backoff)
        await this.sleep(Math.pow(2, execution.retryCount) * 1000);

        return await this.executeWorkflow(workflowId, context);
      }

      this.stats.failedExecutions++;
    }

    return this.finalizeExecution(execution);
  }

  async evaluateConditions(conditions, context) {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions = always pass
    }

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context);

      if (!result) {
        return false;
      }
    }

    return true;
  }

  async evaluateCondition(condition, context) {
    const { type, field, operator, value } = condition;

    const fieldValue = this.resolveVariable(field, context);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).includes(value);
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      default:
        logger.warn(`Unknown operator: ${operator}`);
        return true;
    }
  }

  async executeAction(action, context) {
    const startTime = Date.now();

    try {
      let output = null;

      switch (action.type) {
        case 'send_email':
          output = await this.actionSendEmail(action, context);
          break;

        case 'create_calendar_event':
          output = await this.actionCreateCalendarEvent(action, context);
          break;

        case 'send_notification':
          output = await this.actionSendNotification(action, context);
          break;

        case 'http_request':
          output = await this.actionHttpRequest(action, context);
          break;

        case 'delay':
          output = await this.actionDelay(action, context);
          break;

        case 'set_variable':
          output = await this.actionSetVariable(action, context);
          break;

        case 'log':
          output = await this.actionLog(action, context);
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        output,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Actions Implementation
   */
  async actionSendEmail(action, context) {
    const { to, subject, body } = action.params;

    const resolvedTo = this.resolveVariable(to, context);
    const resolvedSubject = this.resolveVariable(subject, context);
    const resolvedBody = this.resolveVariable(body, context);

    logger.info(`📧 Send email to ${resolvedTo}: ${resolvedSubject}`);

    // Placeholder - would use email service
    return {
      sent: true,
      to: resolvedTo,
      subject: resolvedSubject
    };
  }

  async actionCreateCalendarEvent(action, context) {
    const { title, start, duration } = action.params;

    logger.info(`📅 Create calendar event: ${title}`);

    // Placeholder - would use calendar service
    return {
      created: true,
      eventId: this.generateId()
    };
  }

  async actionSendNotification(action, context) {
    const { message, priority } = action.params;

    const resolvedMessage = this.resolveVariable(message, context);

    logger.info(`🔔 Send notification: ${resolvedMessage}`);

    this.emit('notification', {
      message: resolvedMessage,
      priority: priority || 'normal'
    });

    return {
      sent: true,
      message: resolvedMessage
    };
  }

  async actionHttpRequest(action, context) {
    const { method, url, headers, body } = action.params;

    logger.info(`🌐 HTTP ${method} ${url}`);

    // Placeholder - would use axios or fetch
    return {
      status: 200,
      data: { success: true }
    };
  }

  async actionDelay(action, context) {
    const { duration } = action.params; // milliseconds

    logger.info(`⏱️ Delay ${duration}ms`);

    await this.sleep(duration);

    return {
      delayed: duration
    };
  }

  async actionSetVariable(action, context) {
    const { name, value } = action.params;

    const resolvedValue = this.resolveVariable(value, context);

    context[name] = resolvedValue;

    logger.info(`📝 Set variable ${name} = ${resolvedValue}`);

    return {
      variableName: name,
      value: resolvedValue
    };
  }

  async actionLog(action, context) {
    const { message, level } = action.params;

    const resolvedMessage = this.resolveVariable(message, context);

    logger[level || 'info'](resolvedMessage);

    return {
      logged: true,
      message: resolvedMessage
    };
  }

  /**
   * Variable Resolution
   */
  resolveVariable(value, context) {
    if (typeof value !== 'string') {
      return value;
    }

    // Support for {{variable}} syntax
    return value.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmed = variableName.trim();
      return context[trimmed] !== undefined ? context[trimmed] : match;
    });
  }

  /**
   * Execution Finalization
   */
  finalizeExecution(execution) {
    // Mettre à jour workflow stats
    const workflow = this.workflows.get(execution.workflowId);
    if (workflow) {
      workflow.lastExecutedAt = new Date().toISOString();
      workflow.executionCount++;
    }

    // Ajouter à history
    this.executionHistory.unshift({
      id: execution.id,
      workflowId: execution.workflowId,
      workflowName: execution.workflowName,
      status: execution.status,
      startTime: execution.startTime,
      endTime: execution.endTime,
      duration: execution.endTime - execution.startTime,
      stepsCount: execution.steps.length,
      error: execution.error
    });

    // Limiter taille history
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(0, this.maxHistorySize);
    }

    // Retirer des executions actives
    this.activeExecutions.delete(execution.id);

    // Update stats
    this.stats.totalExecutions++;
    this.updateAverageExecutionTime(execution.endTime - execution.startTime);

    // Emit event
    this.emit('execution_completed', execution);

    return execution;
  }

  updateAverageExecutionTime(duration) {
    const total = this.stats.averageExecutionTime * (this.stats.totalExecutions - 1);
    this.stats.averageExecutionTime = (total + duration) / this.stats.totalExecutions;
  }

  /**
   * Utilities
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Statistics & Monitoring
   */
  getStats() {
    return {
      ...this.stats,
      activeWorkflows: this.workflows.size,
      activeExecutions: this.activeExecutions.size,
      historySize: this.executionHistory.length
    };
  }

  getExecutionHistory(limit = 50) {
    return this.executionHistory.slice(0, limit);
  }

  getExecution(executionId) {
    // Check active first
    let execution = this.activeExecutions.get(executionId);

    if (!execution) {
      // Check history
      execution = this.executionHistory.find(e => e.id === executionId);
    }

    return execution;
  }
}

module.exports = AutomationEngine;
