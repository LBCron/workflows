# 🤖 Configuration des 5 Agents - Guide Complet

Ce guide explique comment configurer et utiliser les **5 agents sophistiqués** du système AI Agent Swarm.

## 📋 Vue d'ensemble

Le système comprend 5 agents spécialisés:

| Agent | Description | Coût | Configuration |
|-------|-------------|------|---------------|
| 🔬 **Research Agent** | Recherche et analyse intelligente | €0-0.015/requête | Aucune (API AI uniquement) |
| ✍️ **Content Creator** | Création de contenu optimisé | €0-0.01/requête | Aucune (API AI uniquement) |
| 💻 **Code Assistant** | Génération et debug de code | €0-0.01/requête | Aucune (API AI uniquement) |
| 📧 **Email Agent** | Gestion Gmail/Outlook | €0.001-0.003/requête | OAuth2 Gmail/Outlook |
| 📅 **Calendar Agent** | Gestion Google Calendar | €0.001-0.003/requête | OAuth2 Google Calendar |

## 🚀 Quick Start

### Agents de base (Research, Content, Code)

✅ **Pas de configuration supplémentaire nécessaire!**

Ces agents fonctionnent immédiatement dès que tu as configuré:
- `TELEGRAM_BOT_TOKEN`
- Une clé API AI (OpenAI, Anthropic, Groq, ou Google)
- `MONTHLY_BUDGET_LIMIT`

### Agents avancés (Email, Calendar)

⚠️ **Configuration OAuth2 requise** - Voir sections ci-dessous

---

## 📧 Email Agent Pro - Configuration Gmail

### Fonctionnalités

- ✅ Lire et résumer emails non lus
- ✅ Générer réponses intelligentes
- ✅ Composer nouveaux emails
- ✅ Catégoriser emails (urgent/important/spam)
- ✅ Support Gmail ET Outlook/Hotmail
- ✅ Utilise l'IA pour analyse sémantique

### Configuration Gmail (recommandé)

#### Étape 1: Setup automatique

```bash
npm run setup:gmail
```

Ce script interactif te guidera à travers:
1. Création projet Google Cloud
2. Activation Gmail API
3. Configuration OAuth consent
4. Obtention credentials
5. Génération refresh token

#### Étape 2: Configuration manuelle .env

Ajoute dans `.env`:

```bash
# Gmail Agent
GMAIL_CLIENT_ID=your_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/oauth2callback
GMAIL_REFRESH_TOKEN=1//your_refresh_token_here
```

#### Étape 3: Test

```bash
# Test standalone
node scripts/agents/email-agent-pro.js

# Test via bot Telegram
npm start
# Puis envoie: "Résume mes emails"
```

### Configuration Outlook/Hotmail (optionnel)

```bash
# Outlook Agent
OUTLOOK_CLIENT_ID=your_outlook_app_id
OUTLOOK_CLIENT_SECRET=your_outlook_secret
OUTLOOK_ACCESS_TOKEN=your_access_token
```

Documentation complète: [Microsoft Graph Auth](https://learn.microsoft.com/en-us/graph/auth/)

### Utilisation via Telegram

**Exemples de commandes:**

```
Résume mes emails
Combien d'emails non lus ?
Mes emails non lus
```

**Actions disponibles:**

| Action | Commande | Coût estimé |
|--------|----------|-------------|
| Résumer emails | "Résume mes emails" | €0.001-0.003 |
| Compter non lus | "Combien d'emails ?" | Gratuit |
| Générer réponse | (bientôt) | €0.002-0.005 |
| Composer email | (bientôt) | €0.003-0.008 |

---

## 📅 Calendar Agent Pro - Configuration

### Fonctionnalités

- ✅ Voir agenda du jour/semaine
- ✅ Créer événements intelligemment (parsing langage naturel)
- ✅ Trouver créneaux libres
- ✅ Résumer semaine avec IA
- ✅ Suggestions optimisation
- ✅ Support Google Calendar

### Configuration

#### Étape 1: Setup automatique

```bash
npm run setup:calendar
```

Ce script te guidera pour:
1. Activer Google Calendar API
2. Obtenir OAuth credentials (peut réutiliser Gmail!)
3. Générer refresh token

#### Étape 2: Configuration manuelle .env

Ajoute dans `.env`:

```bash
# Calendar Agent
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_REFRESH_TOKEN=1//your_refresh_token_here
```

💡 **Astuce:** Tu peux utiliser les MÊMES credentials que Gmail!

#### Étape 3: Test

```bash
# Test standalone
node scripts/agents/calendar-agent-pro.js

# Test via bot Telegram
npm start
# Puis envoie: "Mon agenda aujourd'hui"
```

### Utilisation via Telegram

**Exemples de commandes:**

```
Mon agenda aujourd'hui
Quel est mon agenda ?
Mon agenda de la semaine
Crée un meeting demain à 14h avec Jean
Ajoute un rendez-vous lundi 10h "Dentiste"
Quand suis-je libre aujourd'hui ?
```

**Actions disponibles:**

| Action | Commande | Coût |
|--------|----------|------|
| Agenda du jour | "Mon agenda aujourd'hui" | Gratuit |
| Agenda semaine | "Mon agenda cette semaine" | Gratuit |
| Créer événement | "Crée meeting demain 14h" | €0.001-0.003 |
| Trouver créneaux | "Quand suis-je libre ?" | Gratuit |
| Résumé IA | "Résume ma semaine" | €0.002-0.005 |

---

## 🔬 Research Agent Pro

### Fonctionnalités

- ✅ 4 niveaux de profondeur (rapide, standard, approfondi, expert)
- ✅ Multi-sources (2-12 sources selon niveau)
- ✅ Sélection modèle AI automatique
- ✅ Cache intelligent pour économies

### Niveaux de recherche

| Niveau | Sources | Tokens | Coût | Usage |
|--------|---------|--------|------|-------|
| RAPIDE | 2 | 500 | Gratuit | Questions simples |
| STANDARD | 5 | 1500 | €0.0005 | Recherches normales |
| APPROFONDI | 8 | 3000 | €0.003 | Analyses détaillées |
| EXPERT | 12+ | 6000 | €0.015 | Recherche académique |

### Utilisation

```
Recherche l'histoire de l'IA
C'est quoi le machine learning ?
Analyse approfondie de la blockchain
```

Le niveau est détecté automatiquement selon les mots-clés.

---

## ✍️ Content Creator Pro

### Fonctionnalités

- ✅ 4 niveaux de qualité (basique, standard, premium, viral)
- ✅ 5 styles (blog, social, technique, créatif, marketing)
- ✅ SEO optimisé automatiquement
- ✅ Adaptation longueur automatique

### Niveaux de qualité

| Niveau | Tokens | Coût | Usage |
|--------|--------|------|-------|
| BASIQUE | 800 | Gratuit | Posts rapides |
| STANDARD | 1500 | €0.001 | Articles normaux |
| PREMIUM | 3000 | €0.005 | Contenu professionnel |
| VIRAL | 4000 | €0.01 | Campagnes marketing |

### Utilisation

```
Écris un article sur le web3
Crée un post LinkedIn sur l'IA
Rédige un thread Twitter viral sur ChatGPT
Génère une description produit pour...
```

---

## 💻 Code Assistant Pro

### Fonctionnalités

- ✅ Génération de code
- ✅ Debug et correction d'erreurs
- ✅ Optimisation de performance
- ✅ Explications détaillées
- ✅ Support multi-langages

### Utilisation

```
Code une fonction fibonacci en Python
Debug ce code: [ton code]
Optimise cette fonction JavaScript
Explique ce code: [ton code]
Génère un API REST en Node.js
```

---

## 💰 Coûts et Budget

### Estimation mensuelle

**Scénario usage personnel léger (20-30 requêtes/jour):**

| Agent | Requêtes/jour | Coût/mois |
|-------|---------------|-----------|
| Research | 10 | €0.50-2.00 |
| Content | 5 | €0.25-1.00 |
| Code | 5 | €0.25-1.00 |
| Email | 5 | €0.15-0.50 |
| Calendar | 5 | €0.10-0.30 |
| **TOTAL** | **30** | **€1.25-4.80** |

Avec cache 70%: **€0.40-1.50/mois** 🎉

**Scénario usage intensif (100 requêtes/jour):**

- Sans cache: €15-25/mois
- Avec cache 70%: **€5-8/mois** ✅

### Protection budget

Le Budget Guardian:
- ⚠️ Alerte à 75% (€15 si limite €20)
- ⚠️ Alerte à 90% (€18)
- 🛑 **Bloque à 95%** (€19)
- Bascule vers modèles gratuits si proche limite

---

## 🧪 Tests

### Test agent individuel

```bash
# Email Agent
node scripts/agents/email-agent-pro.js

# Calendar Agent
node scripts/agents/calendar-agent-pro.js

# Research Agent
node scripts/agents/research-agent-pro.js

# Content Creator
node scripts/agents/content-creator-pro.js

# Code Assistant
node scripts/agents/code-assistant-pro.js
```

### Test système complet

```bash
npm run simulate
```

Cela va tester:
- ✅ Tous les agents
- ✅ Intelligent router
- ✅ Budget guardian
- ✅ Mega cache
- ✅ Intégrations

---

## 🔒 Sécurité

### Best Practices

1. **Ne JAMAIS commiter .env**
   ```bash
   # Vérifie que .env est dans .gitignore
   cat .gitignore | grep .env
   ```

2. **Rotate tokens régulièrement**
   - Gmail refresh token: 6 mois
   - API keys: 3 mois

3. **Limiter scopes OAuth au minimum nécessaire**
   - Gmail: readonly, send, modify (pas delete!)
   - Calendar: calendar, events (pas settings!)

4. **Utiliser des secrets managers en production**
   - Google Secret Manager
   - AWS Secrets Manager
   - HashiCorp Vault

5. **Monitor les coûts**
   ```bash
   # Voir budget actuel
   /budget (dans Telegram)
   ```

---

## 🐛 Troubleshooting

### Email Agent ne fonctionne pas

**Erreur: "Gmail connection failed"**

Solutions:
1. Vérifie que Gmail API est activée
2. Vérifie GMAIL_CLIENT_ID dans .env
3. Vérifie GMAIL_REFRESH_TOKEN est valide
4. Re-run `npm run setup:gmail`

**Erreur: "No LLM API keys configured"**

Solutions:
1. Configure au moins une clé AI (OPENAI_API_KEY, GROQ_API_KEY, etc.)
2. Vérifie que .env est chargé

### Calendar Agent ne fonctionne pas

**Erreur: "Calendar connection failed"**

Solutions:
1. Vérifie que Calendar API est activée
2. Vérifie GOOGLE_REFRESH_TOKEN
3. Vérifie scopes OAuth incluent calendar
4. Re-run `npm run setup:calendar`

### Budget dépassé

**Erreur: "Budget mensuel dépassé"**

Solutions:
1. Augmente MONTHLY_BUDGET_LIMIT dans .env
2. Ou attends le début du mois prochain
3. Ou force DEFAULT_MODEL=llama-3-70b (gratuit via Groq)

---

## 📚 Ressources

### Documentation officielle

- [Gmail API](https://developers.google.com/gmail/api)
- [Google Calendar API](https://developers.google.com/calendar)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic API](https://docs.anthropic.com)
- [Groq API](https://console.groq.com/docs)

### Scripts utiles

```bash
# Setup Gmail
npm run setup:gmail

# Setup Calendar
npm run setup:calendar

# Test complet
npm run simulate

# Voir stats
npm start  # puis /stats dans Telegram

# Voir budget
npm start  # puis /budget dans Telegram
```

---

## 🎯 Prochaines étapes

Fonctionnalités à venir:

- [ ] Email Agent: Réponse automatique intelligente
- [ ] Email Agent: Filtres et règles automatiques
- [ ] Calendar Agent: Optimisation agenda avec IA
- [ ] Calendar Agent: Suggestions de créneaux pour meetings
- [ ] Social Media Agent: Post automatique Twitter/LinkedIn
- [ ] Data Analyst Agent: Analyse de données et graphiques
- [ ] Voice Agent: Synthèse vocale des réponses

---

**Version:** 3.0.0
**Dernière mise à jour:** 2024-11-16
**Auteur:** AI Agent Swarm Team

Pour support: ouvre une issue sur GitHub ou contacte via Telegram.
