# 🪟 Windows Setup Guide

Guide rapide pour démarrer n8n Agent Swarm sur Windows.

## ⚡ Installation en 5 Minutes

### Prérequis

1. **Docker Desktop pour Windows**
   - Télécharger: https://www.docker.com/products/docker-desktop/
   - Installer et redémarrer l'ordinateur
   - Lancer Docker Desktop

2. **Node.js** (version 18+)
   - Télécharger: https://nodejs.org/
   - Vérifier: `node --version`

### Étape 1: Configuration

Ouvrir PowerShell dans le dossier du projet :

```powershell
cd "C:\Users\Ronan\OneDrive\桌面\workflow"

# Copier le fichier de configuration
copy .env.example .env

# Ouvrir pour éditer
notepad .env
```

**Modifier dans .env (minimum requis) :**

```env
# Mots de passe n8n et PostgreSQL
N8N_PASSWORD=ton_mot_de_passe_securise
POSTGRES_PASSWORD=ton_mot_de_passe_postgres

# API Keys (à obtenir)
TELEGRAM_BOT_TOKEN=ton_token_de_botfather
OPENROUTER_API_KEY=sk-or-ta_cle_openrouter
OPENAI_API_KEY=sk-ta_cle_openai
```

### Étape 2: Démarrage Automatique

**Option A : Script Batch (Plus Simple)** ✨

Double-cliquer sur : `scripts\start-n8n.bat`

**Option B : Commande npm**

```powershell
npm install
npm run start:windows
```

**Option C : Manuel**

```powershell
# Démarrer Docker
docker-compose up -d

# Attendre 30 secondes
timeout /t 30

# Importer le workflow
npm run auto-import:windows
```

### Étape 3: Ouvrir n8n

Le navigateur s'ouvrira automatiquement sur http://localhost:5678

**Première connexion :**
1. Créer un compte administrateur
2. Le workflow est déjà importé automatiquement !
3. Passer à la configuration des credentials

---

## 🔑 Obtenir les API Keys

### 1. Telegram Bot Token

1. Ouvrir Telegram
2. Chercher **@BotFather**
3. Envoyer `/newbot`
4. Donner un nom : "Mon Agent Swarm"
5. Donner un username : "mon_agent_swarm_bot"
6. Copier le token : `1234567890:ABCdef...`

### 2. OpenRouter API (pour GPT-4)

1. Aller sur https://openrouter.ai/keys
2. S'inscrire / Se connecter
3. Créer une nouvelle clé API
4. Copier la clé : `sk-or-...`

### 3. OpenAI API (pour Whisper)

1. Aller sur https://platform.openai.com/api-keys
2. Se connecter
3. Créer une nouvelle clé
4. Copier la clé : `sk-...`

### 4. Google OAuth (Optionnel)

Pour Gmail, Calendar, Contacts, Sheets, YouTube :

1. Aller sur https://console.cloud.google.com/
2. Créer un projet
3. Activer les APIs :
   - Gmail API
   - Google Calendar API
   - People API (Contacts)
   - Google Sheets API
   - YouTube Data API v3
4. Créer des credentials OAuth 2.0
5. Copier Client ID et Client Secret

---

## 🎯 Configuration dans n8n

### Dans n8n UI (http://localhost:5678)

**Aller à : Settings → Credentials**

1. **Telegram Bot**
   - Type : "Telegram"
   - Nom : `telegram-bot-credentials`
   - Access Token : Coller le token de BotFather

2. **OpenRouter API**
   - Type : "HTTP Request"
   - Nom : `openrouter-credentials`
   - Authentication : "Generic Credential Type"
   - Ajouter header `Authorization: Bearer sk-or-...`

3. **OpenAI API**
   - Type : "OpenAI"
   - Nom : `openai-credentials`
   - API Key : Coller la clé OpenAI

4. **Google OAuth** (si configuré)
   - Type : "Google OAuth2 API"
   - Nom : `google-oauth-credentials`
   - Client ID : Coller
   - Client Secret : Coller
   - Scopes : Autoriser toutes les APIs

### Activer le Workflow

1. Ouvrir le workflow "Multi-Agent AI System"
2. Cliquer sur le toggle **"Active"** en haut à droite
3. Le workflow est maintenant en écoute !

---

## 🧪 Tester le Système

### Test 1: Message Simple

Envoyer à ton bot Telegram :

```
Hello!
```

**Réponse attendue :** Le Main Agent répond et se présente

### Test 2: Email Agent

```
Check my emails
```

**Réponse attendue :** Liste des emails récents

### Test 3: Meta Agent (Auto-Generate) 🔮

```
Add a Snapchat agent
```

**Réponse attendue :** Le Meta Agent génère la configuration complète d'un agent Snapchat !

---

## 📋 Commandes Utiles (PowerShell)

```powershell
# Démarrer n8n
npm run start:windows

# Voir les logs
npm run logs

# Arrêter n8n
npm stop

# Redémarrer n8n
npm run restart

# Générer un agent manuellement
npm run generate-agent snapchat

# Importer le workflow à nouveau
npm run auto-import:windows

# Nettoyer tout (⚠️ supprime les données)
npm run clean
```

---

## 🐛 Dépannage

### Docker ne démarre pas

**Solution :**
1. Vérifier que Docker Desktop est lancé
2. Attendre qu'il soit complètement démarré (icône verte)
3. Relancer le script

### Port 5678 déjà utilisé

**Solution :**
```powershell
# Arrêter le conteneur existant
docker-compose down

# Relancer
npm run start:windows
```

### Workflow pas importé

**Solution :**
```powershell
# Import manuel
npm run auto-import:windows
```

### Erreur "Credentials not found"

**Solution :**
1. Aller dans n8n → Settings → Credentials
2. Vérifier que les noms correspondent exactement :
   - `telegram-bot-credentials`
   - `openrouter-credentials`
   - `openai-credentials`
   - `google-oauth-credentials`

---

## 🚀 Prochaines Étapes

1. ✅ Tester tous les agents via Telegram
2. ✅ Utiliser le Meta Agent pour créer de nouveaux agents
3. ✅ Personnaliser les prompts des agents
4. ✅ Ajouter d'autres services (Notion, Slack, Discord, etc.)
5. ✅ Configurer le déploiement en production

---

## 📚 Documentation Complète

- [README.md](README.md) - Documentation principale
- [QUICK-START.md](QUICK-START.md) - Guide de démarrage rapide
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture du système
- [docs/META-AGENT.md](docs/META-AGENT.md) - Documentation du Meta Agent

---

## 💡 Astuces

### Raccourci Clavier

Créer un raccourci sur le bureau vers `scripts\start-n8n.bat` pour démarrer en un clic !

### Démarrage Automatique Windows

Ajouter à la startup de Windows :
1. `Win + R` → `shell:startup`
2. Créer un raccourci vers `scripts\start-n8n.bat`

### Accès à Distance

Pour accéder depuis un autre appareil sur le même réseau :

1. Trouver ton IP locale : `ipconfig`
2. Accéder via : `http://[TON_IP]:5678`

---

**Besoin d'aide ?** Ouvre une issue sur GitHub ou consulte la documentation complète !
