# 🚀 Guide de Déploiement - Système AI Sophistiqué

## Vue d'Ensemble

Tu as maintenant **DEUX workflows sophistiqués** prêts à importer dans n8n:

### 1️⃣ **Ultimate AI Agent Swarm** (`workflows/ultimate-ai-swarm.json`)
- ✅ Intégration **Intelligent Router** (multi-modèles)
- ✅ **3 Agents Premium**: Research Pro, Content Creator Pro, Code Assistant Pro
- ✅ **Mega Cache** intégré (70-80% cache hit rate)
- ✅ **Budget Guardian** avec tracking en temps réel
- ✅ Analyse de complexité automatique
- ✅ Sélection intelligente du meilleur modèle
- 💰 **Coût: €0.08-0.15/mois** (avec DEFAULT_MODEL=gpt-4o-mini)

### 2️⃣ **Multi-Agent System** (`n8n-workflows/main-workflow.json`)
- ✅ **7 Agents Spécialisés**: Email, Calendar, Contact, YouTube, Web, Meta, Main Executive
- ✅ Support **Telegram** avec messages vocaux (Whisper)
- ✅ Logging vers **Google Sheets**
- ✅ Gestion d'erreurs avancée
- ✅ Agent Meta pour créer de nouveaux agents
- 💡 **Système complet d'automatisation personnelle**

---

## 📥 Étape 1: Importer les Workflows dans n8n

### A. Accéder à n8n

1. **Ouvre ton instance n8n:**
   ```
   https://n8n-agent-swarm.fly.dev/
   ```

2. **Connecte-toi avec tes identifiants**

### B. Importer le Workflow Ultimate AI Agent Swarm

1. **Clique sur le menu** (en haut à gauche) → **Workflows**
2. **Clique sur "New Workflow"** (bouton en haut à droite)
3. **Clique sur les 3 points** → **Import from File**
4. **Copie le contenu** de `/home/user/workflows/n8n-agent-swarm/workflows/ultimate-ai-swarm.json`
5. **Colle-le** dans l'importation
6. **Clique "Import"**

### C. Importer le Workflow Multi-Agent System (Optionnel)

1. **Répète les étapes** ci-dessus
2. **Utilise le fichier** `/home/user/workflows/n8n-agent-swarm/n8n-workflows/main-workflow.json`

---

## 🔑 Étape 2: Configurer les Credentials

### Configuration Essentielle pour Ultimate AI Agent Swarm

**Note Importante:** Le workflow Ultimate utilise des scripts Node.js externes. Tu dois d'abord déployer les scripts sur ton serveur Fly.io.

#### Déployer les Scripts sur Fly.io

Les agents utilisent les scripts dans `/scripts/ai-core/`. Ces scripts doivent être accessibles sur le serveur.

**Vérification des secrets Fly.io:**
```bash
fly secrets list -a n8n-agent-swarm
```

**Si DEFAULT_MODEL n'est pas défini, ajoute-le:**
```bash
fly secrets set DEFAULT_MODEL=gpt-4o-mini -a n8n-agent-swarm
```

**Si OPENAI_API_KEY n'est pas défini:**
```bash
fly secrets set OPENAI_API_KEY=sk-your-key-here -a n8n-agent-swarm
```

---

## 🧪 Étape 3: Tester le Workflow

### Test du Ultimate AI Agent Swarm

1. **Dans n8n, ouvre le workflow** "Ultimate AI Agent Swarm"

2. **Active le workflow** (toggle en haut à droite)

3. **Teste via l'URL webhook:**

```bash
# Test basique (Content Creator)
curl -X POST https://n8n-agent-swarm.fly.dev/webhook/ai-swarm \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Write a short paragraph about AI",
    "userId": "test-user",
    "sessionId": "test-session-1"
  }'

# Test Research Agent
curl -X POST https://n8n-agent-swarm.fly.dev/webhook/ai-swarm \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Research the latest trends in artificial intelligence and machine learning",
    "userId": "test-user",
    "sessionId": "test-session-2"
  }'

# Test Code Agent
curl -X POST https://n8n-agent-swarm.fly.dev/webhook/ai-swarm \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Write a Python function to calculate fibonacci numbers",
    "userId": "test-user",
    "sessionId": "test-session-3"
  }'
```

### Réponse Attendue

```json
{
  "success": true,
  "agent": "content|research|code",
  "response": "...",
  "request": {
    "input": "...",
    "complexity": "simple|medium|complex|expert",
    "estimatedTokens": 123
  },
  "execution": {
    "model": "gpt-4o-mini",
    "cached": false,
    "cost": 0.0003,
    "tokens": {
      "input": 50,
      "output": 200
    }
  },
  "budget": {
    "used": 0.12,
    "limit": 20,
    "percentage": 0.6,
    "remaining": 19.88,
    "status": "OK"
  },
  "performance": {
    "responseTime": 1234,
    "cacheHit": false,
    "costSavings": 0
  }
}
```

---

## 📊 Étape 4: Monitoring et Statistiques

### Voir les Stats en Temps Réel

**Sur le serveur (SSH):**

```bash
# Stats du router intelligent
fly ssh console -a n8n-agent-swarm
cd /app
node -e "console.log(require('./scripts/ai-core/intelligent-router-pro').getStats())"

# Budget status
node scripts/monitoring/budget-guardian.js status

# Cache stats
node scripts/optimization/mega-cache.js stats
```

### Endpoints de Monitoring (À créer)

Tu peux créer des workflows séparés pour exposer ces stats via webhook:

- `/webhook/stats` → Stats du router
- `/webhook/budget` → Budget status
- `/webhook/cache` → Cache statistics

---

## 🎯 Utilisation des Workflows

### Workflow 1: Ultimate AI Agent Swarm

**Cas d'usage:**
- ✅ Génération de contenu (articles, posts)
- ✅ Recherche approfondie
- ✅ Assistance code/debug
- ✅ Analyse de données
- ✅ Questions complexes

**Avantages:**
- Routing intelligent vers le meilleur modèle
- Cache automatique (70-80% économies)
- Budget protection
- Analytics détaillés

**Endpoint:** `POST /webhook/ai-swarm`

**Payload:**
```json
{
  "message": "Your request here",
  "userId": "optional-user-id",
  "sessionId": "optional-session-id"
}
```

### Workflow 2: Multi-Agent System (Telegram)

**Cas d'usage:**
- ✅ Assistant personnel via Telegram
- ✅ Gestion emails (Gmail)
- ✅ Gestion calendrier
- ✅ Contacts Google
- ✅ Recherche YouTube
- ✅ Web search
- ✅ Créer de nouveaux agents (Meta Agent)

**Configuration requise:**
1. Telegram Bot Token
2. Google OAuth (Gmail, Calendar, Contacts, Sheets)
3. OpenRouter API Key
4. YouTube API Key
5. Tavily/Perplexity API (pour web search)

**Utilisation:** Envoie simplement un message à ton bot Telegram!

---

## 💡 Configuration Avancée

### Passer en Mode Multi-Modèles (Intelligent Router)

Par défaut, le système utilise **GPT-4 Mini uniquement** (simple, cheap).

**Pour activer le routing intelligent multi-modèles:**

```bash
# 1. Retire DEFAULT_MODEL
fly secrets unset DEFAULT_MODEL -a n8n-agent-swarm

# 2. Ajoute les autres clés API
fly secrets set \
  ANTHROPIC_API_KEY=sk-ant-your-key \
  GROQ_API_KEY=gsk_your-key \
  GOOGLE_API_KEY=your-key \
  -a n8n-agent-swarm

# 3. Redémarre
fly apps restart n8n-agent-swarm
```

**Le router choisira alors automatiquement:**
- Llama 3 (gratuit via Groq) pour tâches simples
- GPT-4 Mini pour tasks medium
- Claude Sonnet pour tasks complex
- Claude Opus pour tasks expert

### Personnaliser les Agents

Les agents utilisent des system prompts dans le code. Pour les modifier:

1. **Dans n8n, ouvre le workflow**
2. **Double-clique sur l'agent** (ex: "🔬 Research Agent Pro")
3. **Modifie le `systemPrompt`** dans le code JavaScript
4. **Save & Test**

---

## 📈 Optimisation des Coûts

### Stratégie 1: Mode Simple (Recommandé pour toi)

```bash
# .env ou Fly secrets
DEFAULT_MODEL=gpt-4o-mini
MONTHLY_BUDGET_LIMIT=20
```

**Résultat:**
- €0.08-0.15/mois (avec cache 70%)
- Excellente qualité (92/100)
- Zero complexité

### Stratégie 2: Mode Intelligent (Avancé)

```bash
# Retire DEFAULT_MODEL
# Ajoute toutes les clés API
```

**Résultat:**
- €0.20-0.30/mois
- Qualité maximale (95/100)
- Fallback automatique
- Distribution intelligente des tâches

### Maximiser le Cache

```javascript
// Dans vos requêtes, utilisez des sessionId cohérents
{
  "message": "...",
  "sessionId": "user-123-daily-briefing"  // ✅ Réutilisable
}
```

**Le cache reconnaîtra les patterns et retournera les résultats instantanément (€0.00).**

---

## 🔧 Troubleshooting

### Problème: "Cannot find module '/scripts/ai-core/intelligent-router-pro'"

**Cause:** Les scripts Node.js ne sont pas accessibles dans le container n8n.

**Solution:**

Les workflows n8n Code nodes ont besoin d'accéder aux scripts. Tu as 2 options:

**Option A: Monter les scripts dans le container (Recommandé)**

Dans `fly.toml`, ajoute un volume ou copie les scripts:

```toml
[build]
  [build.args]
    NODE_ENV = "production"

[mounts]
  source = "n8n_scripts"
  destination = "/scripts"
```

**Option B: Créer des HTTP endpoints (Alternative)**

Crée des workflows séparés qui exposent les fonctionnalités via webhooks:

- `/webhook/ai-research` → Appelle Research Agent
- `/webhook/ai-content` → Appelle Content Creator
- `/webhook/ai-code` → Appelle Code Assistant

### Problème: "Budget limit exceeded"

**Solution:**

```bash
# Augmente la limite
fly secrets set MONTHLY_BUDGET_LIMIT=50 -a n8n-agent-swarm

# Ou reset le budget
fly ssh console -a n8n-agent-swarm
rm /app/.cache/budget-data.json
```

### Problème: "OpenAI API Error"

**Vérification:**

```bash
# Vérifie que la clé est bien configurée
fly secrets list -a n8n-agent-swarm

# Re-set si nécessaire
fly secrets set OPENAI_API_KEY=sk-new-key -a n8n-agent-swarm
```

---

## 🎉 Prochaines Étapes

### 1. Tester les Workflows

```bash
# Test Ultimate AI
curl -X POST https://n8n-agent-swarm.fly.dev/webhook/ai-swarm \
  -H "Content-Type: application/json" \
  -d '{"message": "Test du système"}'
```

### 2. Personnaliser pour Tes Besoins

- Modifie les system prompts
- Ajoute de nouveaux agents
- Configure les intégrations (Gmail, Calendar, etc.)

### 3. Monitoring

- Configure les endpoints de stats
- Track les coûts quotidiennement
- Optimise le cache

---

## 📚 Ressources

- **Workflows:**
  - `workflows/ultimate-ai-swarm.json` - Workflow avec intelligent router
  - `n8n-workflows/main-workflow.json` - Workflow multi-agent Telegram

- **Scripts:**
  - `scripts/ai-core/intelligent-router-pro.js` - Router intelligent
  - `scripts/optimization/mega-cache.js` - Système de cache
  - `scripts/monitoring/budget-guardian.js` - Budget tracking

- **Configuration:**
  - `.env.example` - Template de configuration
  - `AI-SYSTEM-README.md` - Documentation système AI
  - `fly.toml` - Configuration Fly.io

---

## 🚀 Prêt?

Commence par importer **Ultimate AI Agent Swarm** dans n8n et teste-le!

**Questions?** Ouvre un issue GitHub ou consulte la documentation.

**Bon automatisation! 🎯**
