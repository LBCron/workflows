# 🚀 Quick Start Guide - AI Agent Swarm Premium Edition

Guide de démarrage rapide en **5 minutes** pour lancer les bots Paul & Manager.

---

## ⚡ **DÉMARRAGE RAPIDE**

### **1. Prérequis**

```bash
# Vérifier Node.js (>= 18)
node --version

# Vérifier npm (>= 9)
npm --version
```

### **2. Installation**

```bash
cd n8n-agent-swarm
npm install
```

### **3. Configuration**

**Copier le template :**
```bash
cp .env.premium.example .env
```

**Éditer `.env` avec vos tokens :**
```env
# REQUIS
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
MASTER_PASSWORD=your_strong_password_here

# OPTIONNEL (pour Manager Bot)
MANAGER_BOT_TOKEN=123456:ABC-DEF...
ADMIN_CHAT_IDS=123456789,987654321

# OPTIONNEL (pour AI features)
OPENAI_API_KEY=sk-...
```

### **4. Lancer**

**Paul Bot (utilisateurs) :**
```bash
npm run start:paul
```

**Manager Bot (admin) :**
```bash
npm run start:manager
```

**Les deux :**
```bash
npm run start:premium
```

---

## 🎯 **CONFIGURATION MINIMALE**

Pour démarrer rapidement, vous avez besoin de **2 variables** seulement :

```env
TELEGRAM_BOT_TOKEN=votre_token_paul_bot
MASTER_PASSWORD=un_mot_de_passe_fort
```

C'est tout ! Le reste est optionnel.

---

## 📱 **CRÉER VOS BOTS TELEGRAM**

### **1. Ouvrir @BotFather sur Telegram**

### **2. Créer Paul Bot (principal)**
```
/newbot
Nom: Paul AI Assistant
Username: votre_paul_bot

# Copier le token reçu
```

### **3. Créer Manager Bot (optionnel)**
```
/newbot
Nom: AI Manager
Username: votre_manager_bot

# Copier le token reçu
```

### **4. Trouver votre Chat ID**
1. Envoyer un message à votre bot
2. Aller sur : `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Chercher `"chat":{"id":123456789}`

---

## ✅ **VÉRIFICATION**

### **Tester Paul Bot**

Dans Telegram, envoyez à votre bot :
```
/start
```

Vous devriez voir :
```
✅ Bonjour ! 🤖

Je suis Paul, votre assistant AI premium...
```

### **Tester les commandes**

```
/menu     → Menu principal
/profile  → Votre profil
/stats    → Statistiques
```

---

## 🔧 **COMMANDES NPM**

```bash
# Développement (auto-reload)
npm run dev:paul       # Paul Bot
npm run dev:manager    # Manager Bot

# Production
npm run start:paul     # Paul Bot
npm run start:manager  # Manager Bot
npm run start:premium  # Les deux

# Tests
npm test               # Tous les tests
node tests/integration/test-premium-systems.js  # Tests premium

# Maintenance
npm run lint           # Vérifier code
npm run lint:fix       # Corriger automatiquement
```

---

## 📊 **COMMANDES BOT**

### **Paul Bot (Utilisateurs)**

```
/start          - Démarrage
/menu           - Menu interactif
/credentials    - Gérer credentials
/profile        - Voir profil utilisateur
/export         - Export iPhone
/stats          - Statistiques
/help           - Aide
```

### **Manager Bot (Admins)**

```
/dashboard      - Vue d'ensemble
/performance    - Métriques performance
/security       - Status sécurité
/users          - Analytics utilisateurs
/vault          - Status credential vault
/health         - Health check
/ban <userId>   - Bannir user
/unban <userId> - Débannir user
```

---

## 🐛 **TROUBLESHOOTING**

### **Erreur: TELEGRAM_BOT_TOKEN manquant**
```bash
# Vérifier que .env existe
ls -la .env

# Vérifier le contenu
cat .env | grep TELEGRAM_BOT_TOKEN
```

### **Erreur: MASTER_PASSWORD manquant**
```bash
# Ajouter dans .env
echo "MASTER_PASSWORD=votre_password" >> .env
```

### **Bot ne répond pas**
1. Vérifier que le bot est démarré
2. Vérifier les logs console
3. Vérifier le token dans .env
4. Tester avec `/start`

### **Erreur de permissions**
```bash
# Donner les droits d'exécution
chmod +x n8n-agent-swarm/src/bots/start-premium.js
```

---

## 🔐 **SÉCURITÉ**

### **Variables Sensibles**

**À GARDER SECRET :**
- `TELEGRAM_BOT_TOKEN`
- `MANAGER_BOT_TOKEN`
- `MASTER_PASSWORD`
- `OPENAI_API_KEY`
- Tous les `*_CLIENT_SECRET`

**Ne JAMAIS :**
- Committer `.env` dans git ✅ (déjà dans .gitignore)
- Partager vos tokens
- Utiliser un master password faible

### **Master Password**

Utilisez un password **fort** :
```bash
# Bon exemple (32+ caractères)
MASTER_PASSWORD=aB3$xY9!mN7@kL2&pQ5#wE8*rT4^uI6

# Mauvais exemple
MASTER_PASSWORD=password123  ❌
```

---

## 📂 **STRUCTURE FICHIERS**

```
n8n-agent-swarm/
├── .env                    ← Votre configuration
├── .env.premium.example    ← Template
│
├── src/
│   ├── bots/
│   │   ├── paul-bot.js         ← Bot principal
│   │   ├── manager-bot.js      ← Bot admin
│   │   └── start-premium.js    ← Launcher
│   │
│   ├── core/
│   │   ├── credential-vault-ultimate.js
│   │   ├── learning-engine-v2.js
│   │   ├── iphone-sync-ultimate.js
│   │   ├── performance-monitoring.js
│   │   └── security-manager.js
│   │
│   └── ui/
│       └── telegram-ui-premium.js
│
├── data/               ← Données (créé auto)
│   ├── vault/          ← Credentials chiffrés
│   ├── learning/       ← Profils users
│   └── exports/        ← Exports iPhone
│
├── logs/               ← Logs (créé auto)
└── package.json
```

---

## 💡 **EXEMPLES D'UTILISATION**

### **Export iPhone**
```
Vous: /export

Bot:
📱 Export iPhone Complet
✅ Export terminé !

Contenu:
📊 15 interactions

Formats: json, html, markdown

📥 Envoi des fichiers...
```

### **Voir Profil**
```
Vous: /profile

Bot:
🧠 Votre Profil AI

Utilisateur depuis 5 jours

Total interactions: 42
Moyenne/jour: 8.4
Heure préférée: 14h
Topics: AI, coding, automation
```

### **Dashboard Manager**
```
Vous: /dashboard

Bot:
🎛️ SYSTEM DASHBOARD

Status: ✅ HEALTHY
Uptime: 2h 15m

📊 Performance:
• Requests: 150 (0.00% errors)
• Cache hit rate: 75.3%

👥 Users:
• Total users: 5
• Total interactions: 42
```

---

## 🚀 **PROCHAINES ÉTAPES**

1. **Configurer services** (optionnel)
   - Gmail OAuth
   - Google Calendar
   - OpenAI API

2. **Personnaliser**
   - Modifier thresholds dans `performance-monitoring.js`
   - Ajuster rate limits
   - Customiser messages

3. **Monitorer**
   - Vérifier `/dashboard` régulièrement
   - Surveiller les logs
   - Tester les backups

---

## 📚 **DOCUMENTATION COMPLÈTE**

- **README Premium** : `README-PREMIUM.md`
- **Code Review** : `docs/CODE_REVIEW_PERFORMANCE_MONITORING.md`
- **Configuration** : `.env.premium.example`

---

## 🆘 **SUPPORT**

- GitHub Issues : [Créer un issue](https://github.com/yourusername/workflows/issues)
- Documentation : `README-PREMIUM.md`
- Tests : `npm test`

---

**Version:** 4.0.0 Premium Edition
**Date:** 2025-11-17
**Temps de setup:** ~5 minutes ⚡

🎉 **Bon démarrage !**
