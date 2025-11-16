#!/usr/bin/env node

/**
 * Google Calendar OAuth Setup Helper
 *
 * Ce script aide à obtenir le refresh token Google Calendar nécessaire pour le Calendar Agent
 */

require('dotenv').config();

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  📅 Google Calendar OAuth Setup - Calendar Agent Pro         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Ce script va t'aider à configurer l'accès Google Calendar pour le Calendar Agent.

📋 PRÉREQUIS:
1. Compte Google
2. Projet Google Cloud (https://console.cloud.google.com)
3. Calendar API activée
4. OAuth credentials créées

💡 NOTE: Tu peux utiliser les MÊMES credentials que Gmail!

🚀 ÉTAPES:

ÉTAPE 1: Utiliser un projet existant OU créer nouveau
────────────────────────────────────────────────────────────────
Option A: Si tu as déjà configuré Gmail
  → Utilise le même projet! Passe à ÉTAPE 2

Option B: Créer un nouveau projet
  1. Va sur: https://console.cloud.google.com/
  2. Clique "Select a project" → "New Project"
  3. Nom: "AI Agent Swarm"
  4. Clique "Create"

ÉTAPE 2: Activer Google Calendar API
────────────────────────────────────────────────────────────────
1. Dans ton projet, va sur:
   https://console.cloud.google.com/apis/library
2. Cherche "Google Calendar API"
3. Clique "Enable"

ÉTAPE 3: Configurer OAuth Consent Screen (si pas déjà fait)
────────────────────────────────────────────────────────────────
1. Va sur: https://console.cloud.google.com/apis/credentials/consent
2. Si déjà configuré pour Gmail, ajoute juste les scopes Calendar:
   - Calendar API: .../auth/calendar
   - Calendar API: .../auth/calendar.events
3. Si nouveau projet, suis les étapes de setup-gmail-oauth.js

ÉTAPE 4: Utiliser/Créer OAuth Client ID
────────────────────────────────────────────────────────────────
Option A: Utiliser les credentials Gmail existants
  → Aucune action nécessaire! Utilise GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET

Option B: Créer de nouveaux credentials
  1. Va sur: https://console.cloud.google.com/apis/credentials
  2. Clique "Create Credentials" → "OAuth client ID"
  3. Type: "Desktop app" ou "Web application"
  4. Name: "AI Agent Calendar"
  5. Redirect URI: http://localhost:3000/oauth2callback
  6. COPIE Client ID et Secret

ÉTAPE 5: Configurer .env
────────────────────────────────────────────────────────────────
Ajoute dans ton fichier .env:

GOOGLE_CLIENT_ID=ton_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ton_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback

ÉTAPE 6: Obtenir le Refresh Token
────────────────────────────────────────────────────────────────
1. Va sur cette URL (remplace CLIENT_ID):

https://accounts.google.com/o/oauth2/v2/auth?client_id=CLIENT_ID&redirect_uri=http://localhost:3000/oauth2callback&response_type=code&scope=https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent

2. Autorise l'application
3. Tu seras redirigé vers: http://localhost:3000/oauth2callback?code=XXXXX
4. COPIE le code=XXXXX

5. Échange le code contre refresh token avec cURL:

curl -X POST https://oauth2.googleapis.com/token \\
  -d "code=TON_CODE" \\
  -d "client_id=TON_CLIENT_ID" \\
  -d "client_secret=TON_CLIENT_SECRET" \\
  -d "redirect_uri=http://localhost:3000/oauth2callback" \\
  -d "grant_type=authorization_code"

6. Réponse contient "refresh_token": "1//XXXXX"
7. COPIE ce refresh token dans .env:

GOOGLE_REFRESH_TOKEN=1//XXXXX

💡 ASTUCE - Configuration Gmail + Calendar simultanée:
────────────────────────────────────────────────────────────────
Tu peux obtenir UN SEUL refresh token pour Gmail ET Calendar!

Utilise cette URL avec TOUS les scopes:
https://accounts.google.com/o/oauth2/v2/auth?client_id=CLIENT_ID&redirect_uri=http://localhost:3000/oauth2callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.modify%20https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent

Puis utilise:
- GMAIL_REFRESH_TOKEN=le_token (pour Email Agent)
- GOOGLE_REFRESH_TOKEN=le_token (pour Calendar Agent)

✅ C'EST TOUT!

Pour tester:
  node scripts/agents/calendar-agent-pro.js

Pour utiliser dans le bot:
  npm start

────────────────────────────────────────────────────────────────

🔒 SÉCURITÉ:
- Ne partage JAMAIS tes credentials
- Ajoute .env au .gitignore
- Rotate les tokens régulièrement
- En production, utilise Secrets Manager

📚 Documentation:
https://developers.google.com/calendar/api/quickstart/nodejs

`);

// Check if credentials are configured
const hasClientId = !!process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('your_');
const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET && !process.env.GOOGLE_CLIENT_SECRET.includes('your_');

if (hasClientId && hasClientSecret) {
  console.log('✅ Credentials détectés dans .env!\n');
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('\n📋 Prochaine étape: obtenir le refresh token (voir ÉTAPE 6 ci-dessus)\n');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback')}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')}&access_type=offline&prompt=consent`;

  console.log('🔗 Ouvre cette URL dans ton navigateur:\n');
  console.log(authUrl);
  console.log('\n');

  // Combined URL for both Gmail + Calendar
  const combinedUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback')}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')}&access_type=offline&prompt=consent`;

  console.log('💡 Ou cette URL pour Gmail + Calendar combinés:\n');
  console.log(combinedUrl);
  console.log('\n');
} else {
  console.log('⚠️  Configure d\'abord GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env\n');
}
