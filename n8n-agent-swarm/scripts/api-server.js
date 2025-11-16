#!/usr/bin/env node

/**
 * API Server - Expose les Agents Premium via HTTP
 *
 * Ce serveur expose les agents sophistiqués (Research, Content, Code)
 * avec intelligent router, mega cache, et budget guardian.
 *
 * Endpoints:
 * - POST /api/research - Research Agent Pro
 * - POST /api/content - Content Creator Pro
 * - POST /api/code - Code Assistant Pro
 * - GET /api/stats - Statistiques système
 * - GET /api/budget - Budget status
 * - GET /api/health - Health check
 */

const express = require('express');
const ResearchAgent = require('./agents/research-agent-pro');
const ContentCreator = require('./agents/content-creator-pro');
const CodeAssistant = require('./agents/code-assistant-pro');
const BudgetGuardian = require('./monitoring/budget-guardian');
const IntelligentRouter = require('./ai-core/intelligent-router-pro');

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS for n8n
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Initialize global instances
const budgetGuardian = new BudgetGuardian();
const router = new IntelligentRouter();

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

/**
 * Research Agent Pro endpoint
 *
 * Body:
 * {
 *   "query": "Recherche sur l'IA",
 *   "depth": "auto" | "quick" | "standard" | "deep" | "expert",
 *   "sessionId": "optional-session-id"
 * }
 */
app.post('/api/research', async (req, res) => {
  const startTime = Date.now();

  try {
    const { query, depth = 'auto', sessionId } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: query'
      });
    }

    console.log(`🔬 Research request: "${query}" (depth: ${depth})`);

    const agent = new ResearchAgent();
    const result = await agent.research(query, depth, { sessionId });

    // Track budget
    if (result.cost > 0) {
      budgetGuardian.trackCost(result.cost, result.model);
    }

    res.json({
      success: true,
      agent: 'research',
      result: result.content,
      metadata: {
        depth: result.depth,
        model: result.model,
        cached: result.cached || false,
        cost: result.cost,
        tokens: result.tokens,
        sources: result.sources || 0,
        responseTime: Date.now() - startTime
      },
      budget: budgetGuardian.getStatus()
    });

  } catch (error) {
    console.error('❌ Research error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      agent: 'research'
    });
  }
});

/**
 * Content Creator Pro endpoint
 *
 * Body:
 * {
 *   "prompt": "Écris un article sur...",
 *   "style": "auto" | "blog" | "social" | "technical" | "creative",
 *   "length": "auto" | "short" | "medium" | "long",
 *   "sessionId": "optional-session-id"
 * }
 */
app.post('/api/content', async (req, res) => {
  const startTime = Date.now();

  try {
    const { prompt, style = 'auto', length = 'auto', sessionId } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: prompt'
      });
    }

    console.log(`✍️ Content request: "${prompt.substring(0, 50)}..." (style: ${style})`);

    const agent = new ContentCreator();
    const result = await agent.create(prompt, style, length, { sessionId });

    // Track budget
    if (result.cost > 0) {
      budgetGuardian.trackCost(result.cost, result.model);
    }

    res.json({
      success: true,
      agent: 'content',
      result: result.content,
      metadata: {
        style: result.style,
        length: result.length,
        model: result.model,
        cached: result.cached || false,
        cost: result.cost,
        tokens: result.tokens,
        wordCount: result.wordCount || 0,
        responseTime: Date.now() - startTime
      },
      budget: budgetGuardian.getStatus()
    });

  } catch (error) {
    console.error('❌ Content error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      agent: 'content'
    });
  }
});

/**
 * Code Assistant Pro endpoint
 *
 * Body:
 * {
 *   "request": "Écris une fonction Python...",
 *   "language": "auto" | "javascript" | "python" | "go" | etc.,
 *   "task": "auto" | "generate" | "debug" | "optimize" | "explain",
 *   "sessionId": "optional-session-id"
 * }
 */
app.post('/api/code', async (req, res) => {
  const startTime = Date.now();

  try {
    const { request, language = 'auto', task = 'auto', sessionId } = req.body;

    if (!request) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: request'
      });
    }

    console.log(`💻 Code request: "${request.substring(0, 50)}..." (lang: ${language})`);

    const agent = new CodeAssistant();
    const result = await agent.assist(request, language, task, { sessionId });

    // Track budget
    if (result.cost > 0) {
      budgetGuardian.trackCost(result.cost, result.model);
    }

    res.json({
      success: true,
      agent: 'code',
      result: result.content,
      metadata: {
        language: result.language,
        task: result.task,
        model: result.model,
        cached: result.cached || false,
        cost: result.cost,
        tokens: result.tokens,
        responseTime: Date.now() - startTime
      },
      budget: budgetGuardian.getStatus()
    });

  } catch (error) {
    console.error('❌ Code error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      agent: 'code'
    });
  }
});

/**
 * Stats endpoint - Router & Cache stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    const routerStats = router.getStats();

    res.json({
      success: true,
      router: routerStats,
      budget: budgetGuardian.getStatus(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Budget status endpoint
 */
app.get('/api/budget', (req, res) => {
  try {
    const status = budgetGuardian.getStatus();

    res.json({
      success: true,
      budget: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reset budget (admin endpoint)
 */
app.post('/api/budget/reset', (req, res) => {
  try {
    budgetGuardian.reset();

    res.json({
      success: true,
      message: 'Budget reset successfully',
      budget: budgetGuardian.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    availableEndpoints: [
      'POST /api/research',
      'POST /api/content',
      'POST /api/code',
      'GET /api/stats',
      'GET /api/budget',
      'GET /api/health'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🚀 AI Agent Swarm API Server                                ║
║                                                               ║
║  Status: ✅ RUNNING                                           ║
║  Port: ${PORT}                                                    ║
║  Time: ${new Date().toISOString()}                ║
║                                                               ║
║  Endpoints:                                                   ║
║  • POST /api/research - Research Agent Pro                    ║
║  • POST /api/content  - Content Creator Pro                   ║
║  • POST /api/code     - Code Assistant Pro                    ║
║  • GET  /api/stats    - System Statistics                     ║
║  • GET  /api/budget   - Budget Status                         ║
║  • GET  /api/health   - Health Check                          ║
║                                                               ║
║  Features:                                                    ║
║  ✅ Intelligent Router (7 AI models)                          ║
║  ✅ Mega Cache (70-80% hit rate)                              ║
║  ✅ Budget Guardian (auto-protection)                         ║
║  ✅ 3 Premium Agents                                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
