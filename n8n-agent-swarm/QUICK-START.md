# 🚀 IMPORT RAPIDE - Guide Express

## ⚡ Import en 3 Minutes

### Étape 1: Démarrer n8n

```bash
cd n8n-agent-swarm

# Option A: Docker (recommandé)
docker-compose up -d

# Option B: npx
npx n8n
```

### Étape 2: Importer le Workflow

**Méthode Manuelle (la plus simple):**

1. Ouvrir: http://localhost:5678
2. Cliquer sur **"+"** (New Workflow)
3. Menu **"..."** → **"Import from File"**
4. Sélectionner: `n8n-workflows/main-workflow.json`
5. Cliquer **"Import"**

✅ **Workflow importé avec 19 nodes et 7 agents!**

### Étape 3: Configurer les Credentials

Dans n8n, aller dans **Settings > Credentials**:

#### 🔐 Requis (4 credentials):

1. **Telegram Bot** (`telegram-bot-credentials`)
   - Type: Telegram API
   - Token: De @BotFather
   - Guide: `templates/telegram-bot-setup.md`

2. **OpenRouter API** (`openrouter-credentials`)
   - Type: OpenRouter API
   - Key: De https://openrouter.ai/keys
   - Format: `sk-or-...`

3. **OpenAI API** (`openai-credentials`)
   - Type: OpenAI API
   - Key: De https://platform.openai.com/api-keys
   - Format: `sk-...`

4. **Google OAuth** (pour Gmail, Calendar, Contacts, Sheets)
   - Type: Google OAuth2
   - Client ID & Secret: De Google Cloud Console
   - Guide: `docs/API-KEYS.md`

#### ⚠️ Optionnel (mais recommandé):

5. YouTube API Key
6. Tavily API Key
7. Perplexity API Key
8. OpenWeatherMap API Key

### Étape 4: Activer le Workflow

1. Dans n8n, ouvrir le workflow importé
2. Cliquer sur le toggle **"Inactive"** → **"Active"**
3. Le workflow est maintenant en cours d'exécution! ✅

### Étape 5: Tester via Telegram

Envoyer à ton bot Telegram:

```
"Hello!"
```

Puis essayer le Meta Agent:

```
"Add a Snapchat agent"
```

---

## 🎯 Commandes de Test

### Tests de Base:
```
"What's the weather in Paris?"
"Send an email to test@example.com"
"Create a meeting tomorrow at 2pm"
```

### Tests du Meta Agent 🔮:
```
"Add a Snapchat agent for posting stories"
"Create a Twitter integration"
"Build a Notion agent"
"Add Instagram agent"
```

---

## 🆘 Troubleshooting Rapide

### ❌ "n8n not running"
```bash
docker-compose up -d
# Attendre 30 secondes
curl http://localhost:5678
```

### ❌ "Credentials not configured"
- Aller dans Settings > Credentials
- Vérifier que tous les credentials sont créés
- Tester chaque credential avec le bouton "Test"

### ❌ "Workflow not active"
- Ouvrir le workflow dans n8n
- Cliquer sur le toggle pour l'activer
- Vérifier qu'il n'y a pas d'erreurs (icônes rouges)

### ❌ "Telegram bot doesn't respond"
- Vérifier le token Telegram
- S'assurer que le workflow est activé
- Tester: `/start` dans Telegram

---

## 📊 Contenu du Workflow

**Nodes:** 19
**Agents:** 7
**Capacités:** 50+

### Les 7 Agents:

1. **Main Executive Agent** - Orchestrateur
2. **Email Agent** - Gmail operations
3. **Calendar Agent** - Google Calendar
4. **Contact Agent** - Google Contacts
5. **YouTube Agent** - Video research
6. **Web Agent** - Search & weather
7. **🔮 Meta Agent** - Self-evolution (NEW!)

### Fonctionnalités:

- ✅ Voice messages (Whisper)
- ✅ Conversation memory
- ✅ Multi-agent coordination
- ✅ Google Sheets logging
- ✅ Error handling
- ✅ **Self-modification** (Meta Agent)

---

## 🔮 Utiliser le Meta Agent

Une fois le workflow activé:

```
Toi: "Add a Snapchat agent"

Meta Agent: 🔮 Generating Snapchat agent...

I'll create a complete Snapchat agent for you:

**Configuration:**
[Complete agent config]

**Capabilities:**
- Post stories
- Send snaps
- View messages
- Manage friends

**Setup:**
1. Create: agent-configs/snapchat-agent.md
2. Add Snapchat API credentials
3. Update workflow
4. Test!

Ready to deploy! 🚀
```

---

## 💡 Scripts Utiles

```bash
# Import automatique
npm run import-workflow

# Validation
npm run validate

# Configuration interactive
npm run configure

# Tests
npm test
```

---

## 📚 Documentation Complète

- **Installation**: `docs/INSTALLATION.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Meta Agent**: `docs/META-AGENT.md`
- **Exemples**: `DEMO.md`
- **API Keys**: `docs/API-KEYS.md`

---

## ✅ Checklist d'Import

- [ ] n8n démarré
- [ ] Workflow importé
- [ ] Credentials configurés:
  - [ ] Telegram Bot
  - [ ] OpenRouter
  - [ ] OpenAI
  - [ ] Google OAuth
- [ ] Workflow activé
- [ ] Testé via Telegram

---

**Temps total: ~5 minutes avec les credentials déjà prêts**

**Prêt à automatiser ! 🚀**
