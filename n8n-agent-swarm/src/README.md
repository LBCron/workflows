# Source Code Architecture

Cette documentation décrit la nouvelle architecture du projet après refactorisation.

## 📁 Structure

```
src/
├── agents/              # Agents AI (modular, un agent par dossier)
├── bot/                 # Telegram bot (refactorisé)
├── core/                # Systèmes core (router, cache, budget, logger, optimizer)
├── services/            # Services externes (LLM, Gmail, Calendar, Storage)
├── config/              # Configuration centralisée
├── utils/               # Utilitaires
└── index.js             # Point d'entrée principal
```

## 🤖 Agents (`agents/`)

Chaque agent est dans son propre dossier avec:
- `{agent}.agent.js` - Classe principale
- `{agent}.config.js` - Configuration
- `{agent}.prompts.js` - Prompts (si applicable)

**Factory Pattern**: Utiliser `AgentFactory` pour créer des agents:

```javascript
const AgentFactory = require('./agents');
const factory = new AgentFactory();

const researchAgent = factory.create('research');
const result = await researchAgent.research('AI trends 2024');
```

### Agents disponibles:
- **research** - Recherche multi-niveau
- **content** - Création de contenu
- **code** - Assistant code
- **email** - Gestion emails (Gmail/Outlook)
- **calendar** - Gestion calendrier (Google Calendar)
- **meta** - Création d'agents (auto-développement)

## 🤖 Bot (`bot/`)

Structure modulaire du bot Telegram:

```
bot/
├── index.js              # Main bot (< 100 lignes)
├── handlers/             # Gestionnaires de messages
│   ├── message.handler.js
│   ├── command.handler.js
│   └── callback.handler.js
├── commands/             # Commandes slash
│   ├── start.command.js
│   ├── help.command.js
│   ├── create.command.js
│   └── agents.command.js
├── middlewares/          # Middlewares
│   ├── auth.middleware.js
│   ├── rate-limit.middleware.js
│   └── logger.middleware.js
└── utils/                # Utilitaires bot
    ├── intent-detector.js
    └── response-formatter.js
```

**Séparation des responsabilités**:
- **index.js**: Initialisation et démarrage
- **handlers/**: Logique de traitement des messages
- **commands/**: Implémentation des commandes
- **middlewares/**: Logique transversale (auth, logs, rate limiting)
- **utils/**: Helpers spécifiques au bot

## ⚙️ Core (`core/`)

Systèmes fondamentaux du projet:

### Router (`core/router/`)
Routage intelligent multi-modèles (GPT-4, Claude, Llama, Gemini)
```javascript
const router = require('./core/router/router');
const result = await router.route(prompt, { type: 'research' });
```

### Cache (`core/cache/`)
Mega Cache sémantique (70-80% économies)
```javascript
const cache = require('./core/cache/cache');
const cached = await cache.get(key);
```

### Budget (`core/budget/`)
Budget Guardian (protection coûts)
```javascript
const budget = require('./core/budget/budget.guardian');
await budget.checkAndRecord(cost, model, operation);
```

### Logger (`core/logger/`)
Logging professionnel
```javascript
const logger = require('./core/logger/logger');
logger.info('Message', { meta: 'data' });
logger.error('Erreur', error);
```

### Optimizer (`core/optimizer/`)
Agent Optimizer (cache + budget + errors automatiques)
```javascript
const AgentOptimizer = require('./core/optimizer/optimizer');
const optimized = AgentOptimizer.optimizeAgent(agent, options);
```

## 🔌 Services (`services/`)

Services externes et API clients:

### LLM (`services/llm/`)
Clients LLM (OpenAI, Anthropic, Google, Groq)
```javascript
const llm = require('./services/llm/llm.factory');
const client = llm.create('openai');
```

### Gmail (`services/gmail/`)
Service Gmail
```javascript
const gmail = require('./services/gmail/gmail.service');
const emails = await gmail.readEmails();
```

### Calendar (`services/calendar/`)
Service Google Calendar
```javascript
const calendar = require('./services/calendar/calendar.service');
const events = await calendar.listEvents(start, end);
```

## ⚙️ Configuration (`config/`)

Configuration centralisée avec support multi-environnement:

```javascript
const { config } = require('./config');

// Accès direct
console.log(config.telegram.token);
console.log(config.openai.apiKey);
console.log(config.budget.monthlyLimit);
```

**Fichiers de config** (dans `/config/` à la racine):
- `default.json` - Config par défaut
- `development.json` - Dev
- `production.json` - Prod
- `test.json` - Tests

**Variables d'environnement** prennent priorité sur les fichiers.

## 🛠️ Utils (`utils/`)

Utilitaires partagés:
- `validation.js` - Validation de données
- `helpers.js` - Helpers généraux
- `errors.js` - Erreurs personnalisées
- `constants.js` - Constantes

## 📦 Point d'Entrée (`index.js`)

Le fichier principal qui démarre tout:

```javascript
const { main } = require('./src');
main();
```

Ou:
```bash
npm start  # Lance src/index.js
```

## 🔄 Migration depuis l'ancienne structure

### Imports à mettre à jour

**Avant** (ancienne structure):
```javascript
const logger = require('../scripts/core/logger');
const router = require('../scripts/ai-core/intelligent-router-pro');
const researchAgent = require('../scripts/agents/research-agent-pro');
```

**Après** (nouvelle structure):
```javascript
const logger = require('../src/core/logger/logger');
const router = require('../src/core/router/router');
const AgentFactory = require('../src/agents');
const factory = new AgentFactory();
const researchAgent = factory.create('research');
```

### Fichiers de compatibilité

Pendant la transition, des fichiers de compatibilité existent dans `scripts/core/*-compat.js` qui redirigent vers la nouvelle structure.

## 🎯 Avantages de cette Architecture

### ✅ Maintenabilité
- Code organisé par domaine
- Responsabilités claires
- Facile à naviguer

### ✅ Testabilité
- Tests par domaine (`tests/unit/agents/`, `tests/unit/core/`)
- Mocking facilité
- Isolation des composants

### ✅ Scalabilité
- Ajout facile de nouveaux agents
- Services découplés
- Configuration flexible

### ✅ Performance
- Lazy loading possible
- Tree shaking optimisé
- Imports efficaces

### ✅ Développement
- Onboarding simplifié
- Standards clairs
- Hot reload efficace

## 📚 Documentation Additionnelle

- [Architecture Overview](../docs/architecture/overview.md)
- [Agent Development Guide](../docs/guides/agent-development.md)
- [Bot Development Guide](../docs/guides/bot-development.md)
- [Configuration Guide](../docs/guides/configuration.md)
- [API Reference](../docs/api/)

---

*Architecture mise à jour: 2025-11-16*
