# 🧪 PHASE 2 - PLAN DE TESTS END-TO-END

**Date:** 2025-11-17
**Session:** Phase 2 Integration Complete
**Status:** READY FOR TESTING

---

## 📋 RÉSUMÉ INTÉGRATION

### Composants créés (Phase 1):
- ✅ Setup Wizard (400 lignes)
- ✅ Drive Agent (300 lignes)
- ✅ Web Search Agent (250 lignes)
- ✅ .env.complete.example
- ✅ OAuth Drive script

### Intégration (Phase 2):
- ✅ Manager Bot integration complète
- ✅ Commandes /setup, /drive, /search
- ✅ Callback query routing
- ✅ OAuth message handling

### Commits:
1. `807b17c` - Phase 1 features (1720 insertions)
2. `4ad1c28` - Manager Bot integration (261 insertions)
3. `3cb8810` - OAuth Drive script (210 insertions)

**Total:** ~2200 lignes de code ajoutées

---

## 🎯 OBJECTIFS TESTS

1. **Vérifier** que toutes les features fonctionnent end-to-end
2. **Identifier** bugs/erreurs potentiels
3. **Valider** l'expérience utilisateur
4. **Documenter** les comportements observés
5. **Préparer** production deployment

---

## ✅ CHECKLIST PRÉ-TESTS

### Environnement:
- [ ] Node.js v16+ installé
- [ ] npm packages installés (`npm install`)
- [ ] .env configuré avec MANAGER_BOT_TOKEN
- [ ] .env configuré avec OPENAI_API_KEY
- [ ] .env configuré avec MANAGER_ADMIN_USER_ID

### Dépendances optionnelles (pour tests complets):
- [ ] Google Drive credentials (pour /drive)
- [ ] DuckDuckGo accessible (pour /search)
- [ ] Telegram bot créé et token obtenu

---

## 🧪 TESTS UNITAIRES

### Test 1: Setup Wizard - Imports & Initialization

**Objectif:** Vérifier que Setup Wizard s'importe et s'initialise sans erreur

```bash
# Test import
node -e "const SetupWizard = require('./n8n-agent-swarm/src/bots/telegram/setup-wizard'); console.log('✅ Import OK');"
```

**Résultat attendu:**
- Pas d'erreur
- Message: "✅ Import OK"

**Résultat obtenu:**
- [ ] PASS
- [ ] FAIL (détails: _______________)

---

### Test 2: Drive Agent - Imports & Initialization

**Objectif:** Vérifier que Drive Agent s'importe et s'initialise

```bash
# Test import
node -e "const DriveAgent = require('./n8n-agent-swarm/src/agents/drive-agent'); console.log('✅ Import OK');"
```

**Résultat attendu:**
- Pas d'erreur
- Message: "✅ Import OK"

**Résultat obtenu:**
- [ ] PASS
- [ ] FAIL (détails: _______________)

---

### Test 3: Web Search Agent - Imports & Initialization

**Objectif:** Vérifier que Web Search Agent s'importe et s'initialise

```bash
# Test import
node -e "const WebSearchAgent = require('./n8n-agent-swarm/src/agents/web-search-agent'); console.log('✅ Import OK');"
```

**Résultat attendu:**
- Pas d'erreur
- Message: "✅ Import OK"

**Résultat obtenu:**
- [ ] PASS
- [ ] FAIL (détails: _______________)

---

### Test 4: Manager Bot - Imports complets

**Objectif:** Vérifier que Manager Bot importe tous les nouveaux agents

```bash
# Test imports Manager Bot
node -e "
const ManagerBot = require('./n8n-agent-swarm/src/bots/telegram/manager-bot');
console.log('✅ Manager Bot import OK');
"
```

**Résultat attendu:**
- Pas d'erreur
- Message: "✅ Manager Bot import OK"

**Résultat obtenu:**
- [ ] PASS
- [ ] FAIL (détails: _______________)

---

## 🤖 TESTS INTÉGRATION BOT

### Test 5: Manager Bot - Démarrage

**Objectif:** Vérifier que Manager Bot démarre sans crash

**Prérequis:**
- .env.manager configuré
- MANAGER_BOT_TOKEN valide
- OPENAI_API_KEY valide

```bash
# Démarrer Manager Bot (Ctrl+C pour arrêter)
node n8n-agent-swarm/src/bots/telegram/manager-bot.js
```

**Résultat attendu:**
```
🤖 Manager Bot v2.0 - Démarrage...
✅ Bot token validated
✅ OpenAI API key validated
✅ Manager Bot v2.0 actif !
```

**Résultat obtenu:**
- [ ] PASS - Bot démarre sans erreur
- [ ] FAIL (erreur: _______________)

**Logs importants:**
```
[Copier les logs ici]
```

---

### Test 6: Commande /start

**Objectif:** Vérifier que /start affiche le menu complet avec nouvelles commandes

**Procédure:**
1. Ouvrir Telegram
2. Trouver le Manager Bot
3. Envoyer: `/start`

**Résultat attendu:**
```
🤖 Manager Bot v2.0

Assistant commerce Chine-France + Google Services.

🎯 Setup Initial:
/setup - Configuration interactive (Xianyu + Google)

🛒 Commerce:
...

📁 Google Services:
/drive - Google Drive (cherche, lis, crée)
/search - Recherche web + résumé IA
```

**Résultat obtenu:**
- [ ] PASS - Menu complet affiché
- [ ] FAIL (différence: _______________)

---

### Test 7: Commande /setup - Démarrage wizard

**Objectif:** Vérifier que /setup lance le Setup Wizard

**Procédure:**
1. Envoyer: `/setup`

**Résultat attendu:**
```
🎯 SETUP WIZARD - Configuration Complète

欢迎！/ Welcome!

Ce wizard va configurer:
1. 闲鱼 Xianyu Login
2. 📧 Gmail (optionnel)
3. 📅 Calendar (optionnel)
4. 📁 Drive (optionnel)

⏱️ Temps estimé: 10-15 minutes

[Boutons:]
[ 开始 / Start Setup ]
```

**Résultat obtenu:**
- [ ] PASS - Wizard démarre
- [ ] PASS - Boutons affichés
- [ ] FAIL (erreur: _______________)

---

### Test 8: Setup Wizard - Boutons interactifs

**Objectif:** Vérifier que les boutons du wizard fonctionnent

**Procédure:**
1. Cliquer sur "开始 / Start Setup"

**Résultat attendu:**
- Callback query traité
- Passage à l'étape suivante (Xianyu setup)
- Pas d'erreur Telegram "callback query timeout"

**Résultat obtenu:**
- [ ] PASS - Bouton fonctionne
- [ ] FAIL (erreur: _______________)

---

### Test 9: Commande /drive - Menu aide

**Objectif:** Vérifier que /drive sans arguments affiche l'aide

**Procédure:**
1. Envoyer: `/drive`

**Résultat attendu:**
```
📁 Google Drive Agent

Commandes:
/drive cherche [mot-clé] - Chercher fichiers
/drive lis [nom-fichier] - Lire un fichier
/drive crée [titre] - Créer un document
/drive liste - Fichiers récents

Exemples:
/drive cherche contrat
/drive lis rapport.txt
/drive crée "Mon rapport"
```

**Résultat obtenu:**
- [ ] PASS - Aide affichée
- [ ] FAIL (erreur: _______________)

---

### Test 10: Commande /drive liste (sans OAuth)

**Objectif:** Vérifier comportement quand Drive OAuth non configuré

**Prérequis:** GOOGLE_DRIVE_REFRESH_TOKEN non configuré

**Procédure:**
1. Envoyer: `/drive liste`

**Résultat attendu:**
- Message d'erreur clair
- Mention de configuration OAuth nécessaire

**Résultat obtenu:**
- [ ] PASS - Erreur claire
- [ ] FAIL (crash ou erreur cryptique)

**Message d'erreur:**
```
[Copier le message]
```

---

### Test 11: Commande /search - Menu aide

**Objectif:** Vérifier que /search sans arguments affiche l'aide

**Procédure:**
1. Envoyer: `/search`

**Résultat attendu:**
```
🔍 Web Search Agent

Usage: /search [requête]

Exemples:
/search tendances IA 2024
/search actualités Bitcoin
/search Nike Air Max prix

🎁 Gratuit (DuckDuckGo) + résumé IA!
```

**Résultat obtenu:**
- [ ] PASS - Aide affichée
- [ ] FAIL (erreur: _______________)

---

### Test 12: Commande /search - Recherche réelle

**Objectif:** Vérifier que la recherche web fonctionne

**Prérequis:** Internet accessible

**Procédure:**
1. Envoyer: `/search tendances IA 2024`

**Résultat attendu:**
```
🔍 Recherche: "tendances IA 2024"...

🔍 **Résultats pour: "tendances IA 2024"**

📝 **Résumé:**
[Résumé IA généré par GPT-4o-mini]

🔗 **Sources:**
1. [Titre]
   [URL]

2. [Titre]
   [URL]

🎯 Source: duckduckgo
```

**Résultat obtenu:**
- [ ] PASS - Recherche fonctionne
- [ ] PASS - Résumé IA généré
- [ ] PASS - Sources citées
- [ ] FAIL (erreur: _______________)

**Temps de réponse:** _____ secondes

---

## 🔐 TESTS OAUTH

### Test 13: Script OAuth Drive

**Objectif:** Vérifier que le script OAuth Drive fonctionne

**Procédure:**
```bash
node n8n-agent-swarm/scripts/setup/setup-drive-oauth.js
```

**Résultat attendu:**
- Guide affiché
- Détection credentials existants (si présents)
- Génération URL OAuth
- Template curl fourni

**Résultat obtenu:**
- [ ] PASS - Script s'exécute
- [ ] PASS - Guide complet
- [ ] FAIL (erreur: _______________)

---

### Test 14: Drive Agent avec OAuth configuré

**Objectif:** Vérifier Drive Agent fonctionnel avec OAuth

**Prérequis:**
- GOOGLE_DRIVE_CLIENT_ID configuré
- GOOGLE_DRIVE_CLIENT_SECRET configuré
- GOOGLE_DRIVE_REFRESH_TOKEN configuré

**Procédure:**
1. Envoyer: `/drive liste`

**Résultat attendu:**
```
📄 Fichiers récents...

📁 10 fichiers récents:

1. [Nom fichier]
   Modifié: [Date]

2. [Nom fichier]
   Modifié: [Date]
...
```

**Résultat obtenu:**
- [ ] PASS - Liste fichiers
- [ ] FAIL (erreur: _______________)

---

### Test 15: Drive Agent - Recherche

**Objectif:** Vérifier recherche Drive

**Prérequis:** OAuth Drive configuré

**Procédure:**
1. Envoyer: `/drive cherche test`

**Résultat attendu:**
```
🔍 Recherche "test" dans Drive...

📁 Trouvé X fichier(s):

1. [Nom]
   Type: [Type]
   🔗 [URL]
```

**Résultat obtenu:**
- [ ] PASS - Recherche fonctionne
- [ ] PASS - Résultats affichés
- [ ] FAIL (erreur: _______________)

---

### Test 16: Drive Agent - Création document

**Objectif:** Vérifier création document Drive

**Prérequis:** OAuth Drive configuré

**Procédure:**
1. Envoyer: `/drive crée Test Manager Bot`

**Résultat attendu:**
```
📝 Création "Test Manager Bot"...

✅ Document créé!

📄 Test Manager Bot
🔗 https://docs.google.com/document/d/...
```

**Résultat obtenu:**
- [ ] PASS - Document créé
- [ ] PASS - URL fournie
- [ ] PASS - Document existe dans Drive
- [ ] FAIL (erreur: _______________)

---

## 🔄 TESTS CALLBACK QUERIES

### Test 17: Callback routing Setup Wizard

**Objectif:** Vérifier que callbacks setup_* sont routés correctement

**Procédure:**
1. `/setup`
2. Cliquer n'importe quel bouton "setup_xxx"

**Résultat attendu:**
- Callback traité par setupWizard.handleCallback()
- Pas de timeout Telegram
- Action exécutée

**Résultat obtenu:**
- [ ] PASS - Callback routé
- [ ] FAIL (erreur: _______________)

---

### Test 18: Callback non-setup

**Objectif:** Vérifier que callbacks non-setup_ sont traités

**Procédure:**
1. Si autre callback existe dans le bot, le tester

**Résultat attendu:**
- Callback répondu
- Message "✅ Action enregistrée"

**Résultat obtenu:**
- [ ] PASS
- [ ] FAIL
- [ ] N/A (pas d'autres callbacks)

---

## 💬 TESTS MESSAGE HANDLING

### Test 19: OAuth codes handling

**Objectif:** Vérifier que codes OAuth sont interceptés

**Prérequis:** Setup Wizard en attente code OAuth

**Procédure:**
1. Démarrer setup Gmail/Calendar/Drive
2. Obtenir code OAuth (simulation: "4/XXXXXXXXX")
3. Envoyer le code dans Telegram

**Résultat attendu:**
- Code intercepté par setupWizard.handleMessage()
- Pas de processing message normal
- Token exchangé et sauvegardé

**Résultat obtenu:**
- [ ] PASS - Code intercepté
- [ ] FAIL (erreur: _______________)

---

### Test 20: Message normal (non-OAuth)

**Objectif:** Vérifier que messages normaux fonctionnent

**Procédure:**
1. Envoyer message texte normal: "Bonjour"

**Résultat attendu:**
- Message non intercepté par Setup Wizard
- Traitement normal (intent analysis, etc.)
- Réponse du bot

**Résultat obtenu:**
- [ ] PASS - Message traité normalement
- [ ] FAIL (erreur: _______________)

---

## 🚨 TESTS ERREURS

### Test 21: Drive sans credentials

**Objectif:** Error handling quand Drive pas configuré

**Prérequis:** GOOGLE_DRIVE_REFRESH_TOKEN vide

**Procédure:**
1. `/drive liste`

**Résultat attendu:**
- Erreur claire et user-friendly
- Pas de crash bot
- Suggestion de configuration

**Résultat obtenu:**
- [ ] PASS - Erreur claire
- [ ] FAIL (crash)

---

### Test 22: Search sans internet

**Objectif:** Error handling si DuckDuckGo inaccessible

**Procédure:**
1. Couper internet (ou bloquer DuckDuckGo)
2. `/search test`

**Résultat attendu:**
- Timeout géré
- Message d'erreur clair
- Pas de crash

**Résultat obtenu:**
- [ ] PASS - Erreur gérée
- [ ] FAIL (crash)

---

### Test 23: Callback query timeout

**Objectif:** Vérifier gestion timeout callback

**Procédure:**
1. `/setup`
2. Attendre >30 secondes
3. Cliquer bouton

**Résultat attendu:**
- Timeout Telegram (normal)
- Pas de crash bot
- État wizard maintenu ou reset

**Résultat obtenu:**
- [ ] PASS - Géré gracieusement
- [ ] FAIL (crash)

---

## 📊 TESTS PERFORMANCE

### Test 24: Search response time

**Objectif:** Vérifier temps de réponse acceptable

**Procédure:**
1. `/search Nike Air Max`
2. Chronométrer

**Résultat attendu:**
- Réponse < 10 secondes
- UI responsive (message "Recherche...")

**Résultat obtenu:**
- Temps: _____ secondes
- [ ] PASS (< 10s)
- [ ] SLOW (10-30s)
- [ ] FAIL (> 30s ou timeout)

---

### Test 25: Drive search performance

**Objectif:** Vérifier temps de réponse Drive

**Prérequis:** OAuth Drive configuré

**Procédure:**
1. `/drive cherche test`
2. Chronométrer

**Résultat attendu:**
- Réponse < 5 secondes

**Résultat obtenu:**
- Temps: _____ secondes
- [ ] PASS (< 5s)
- [ ] ACCEPTABLE (5-10s)
- [ ] SLOW (> 10s)

---

## 🔄 TESTS INTÉGRATION COMPLÈTE

### Test 26: Workflow complet Setup

**Objectif:** Tester workflow Setup de A à Z

**Procédure:**
1. `/setup`
2. "开始 / Start Setup"
3. Xianyu setup (skip si pas de credentials)
4. Gmail setup (ou skip)
5. Calendar setup (ou skip)
6. Drive setup (ou skip)
7. Terminer

**Résultat attendu:**
- Workflow fluide
- Tous les steps fonctionnent
- Message de confirmation finale
- État sauvegardé

**Résultat obtenu:**
- [ ] PASS - Workflow complet OK
- [ ] PARTIAL (certaines étapes skip)
- [ ] FAIL (erreur: _______________)

---

### Test 27: Multi-commandes séquentielles

**Objectif:** Vérifier que plusieurs commandes fonctionnent consécutivement

**Procédure:**
1. `/search IA 2024`
2. `/drive liste`
3. `/search Bitcoin`
4. `/drive cherche test`

**Résultat attendu:**
- Toutes les commandes exécutées
- Pas d'interference entre commandes
- Pas de memory leak

**Résultat obtenu:**
- [ ] PASS - Toutes OK
- [ ] FAIL (laquelle: _______________)

---

### Test 28: Stress test rapide

**Objectif:** Vérifier stabilité sous charge modérée

**Procédure:**
1. Envoyer 10 commandes rapidement:
   - `/search test 1`
   - `/search test 2`
   - ...
   - `/search test 10`

**Résultat attendu:**
- Rate limiting activé si trop rapide
- Pas de crash
- Toutes les commandes traitées (ou rate limited)

**Résultat obtenu:**
- [ ] PASS - Stable
- [ ] RATE LIMITED (normal)
- [ ] FAIL (crash)

---

## 📝 RÉSULTATS GLOBAUX

### Résumé tests:

**Tests unitaires (4):**
- PASS: _____ / 4
- FAIL: _____ / 4

**Tests intégration bot (16):**
- PASS: _____ / 16
- FAIL: _____ / 16

**Tests OAuth (4):**
- PASS: _____ / 4
- FAIL: _____ / 4
- SKIP: _____ / 4 (OAuth non configuré)

**Tests callbacks (2):**
- PASS: _____ / 2
- FAIL: _____ / 2

**Tests messages (2):**
- PASS: _____ / 2
- FAIL: _____ / 2

**Tests erreurs (3):**
- PASS: _____ / 3
- FAIL: _____ / 3

**Tests performance (2):**
- PASS: _____ / 2
- FAIL: _____ / 2

**Tests intégration complète (3):**
- PASS: _____ / 3
- FAIL: _____ / 3

---

**TOTAL:**
- **PASS:** _____ / 36
- **FAIL:** _____ / 36
- **SKIP:** _____ / 36

**Taux de réussite:** _____ %

---

## 🐛 BUGS IDENTIFIÉS

### Bug #1:
**Description:**
**Sévérité:** Critique / Haute / Moyenne / Basse
**Reproduction:**
**Fix prévu:**

### Bug #2:
**Description:**
**Sévérité:** Critique / Haute / Moyenne / Basse
**Reproduction:**
**Fix prévu:**

---

## ✅ RECOMMANDATIONS

### Avant production:
- [ ] Tous les tests PASS
- [ ] Bugs critiques corrigés
- [ ] OAuth configuré et testé
- [ ] Documentation à jour
- [ ] Backup système en place

### Améliorations suggérées:
1. _____________________
2. _____________________
3. _____________________

### Prochaines étapes:
1. _____________________
2. _____________________
3. _____________________

---

## 📚 DOCUMENTATION RÉFÉRENCE

- `NEW-FEATURES-ADDED.md` - Features Phase 1
- `BOT-IMPROVEMENTS-ROADMAP.md` - Roadmap complète
- `OAUTH-SETUP-GUIDE.md` - Guide OAuth
- `.env.complete.example` - Template config

---

**Status:** READY FOR TESTING ✅
**Phase:** 2 / 4
**Next:** Phase 3 - Optimisations & Polish
