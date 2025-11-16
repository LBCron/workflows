#!/usr/bin/env node

/**
 * Gmail OAuth Setup Helper
 *
 * Ce script aide à obtenir le refresh token Gmail nécessaire pour l'Email Agent
 */

require('dotenv').config();
const http = require('http');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  📧 Gmail OAuth Setup - Email Agent Pro                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Ce script va t'aider à configurer l'accès Gmail pour l'Email Agent.

📋 PRÉREQUIS:
1. Compte Google/Gmail
2. Projet Google Cloud (https://console.cloud.google.com)
3. Gmail API activée
4. OAuth credentials créées

🚀 ÉTAPES:

ÉTAPE 1: Créer un projet Google Cloud
────────────────────────────────────────────────────────────────
1. Va sur: https://console.cloud.google.com/
2. Clique "Select a project" → "New Project"
3. Nom du projet: "AI Agent Swarm" (ou autre)
4. Clique "Create"

ÉTAPE 2: Activer Gmail API
────────────────────────────────────────────────────────────────
1. Dans ton projet, va sur:
   https://console.cloud.google.com/apis/library
2. Cherche "Gmail API"
3. Clique "Enable"

ÉTAPE 3: Configurer OAuth Consent Screen
────────────────────────────────────────────────────────────────
1. Va sur: https://console.cloud.google.com/apis/credentials/consent
2. Sélectionne "External" (ou "Internal" si Google Workspace)
3. Clique "Create"
4. Remplis les infos:
   - App name: AI Agent Swarm
   - User support email: ton email
   - Developer contact: ton email
5. Clique "Save and Continue"
6. Dans "Scopes", clique "Add or Remove Scopes"
7. Ajoute ces scopes:
   - Gmail API: .../auth/gmail.readonly
   - Gmail API: .../auth/gmail.send
   - Gmail API: .../auth/gmail.modify
8. Save and Continue → Save and Continue → Back to Dashboard

ÉTAPE 4: Créer OAuth Client ID
────────────────────────────────────────────────────────────────
1. Va sur: https://console.cloud.google.com/apis/credentials
2. Clique "Create Credentials" → "OAuth client ID"
3. Application type: "Desktop app" ou "Web application"
4. Name: "AI Agent Gmail"
5. Si Web application, ajoute Authorized redirect URIs:
   http://localhost:3000/oauth2callback
6. Clique "Create"
7. COPIE le Client ID et Client Secret

ÉTAPE 5: Configurer .env
────────────────────────────────────────────────────────────────
Ajoute dans ton fichier .env:

GMAIL_CLIENT_ID=ton_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=ton_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/oauth2callback

ÉTAPE 6: Obtenir le Refresh Token
────────────────────────────────────────────────────────────────
1. Va sur cette URL (remplace CLIENT_ID):

https://accounts.google.com/o/oauth2/v2/auth?client_id=CLIENT_ID&redirect_uri=http://localhost:3000/oauth2callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.modify&access_type=offline&prompt=consent

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

GMAIL_REFRESH_TOKEN=1//XXXXX

✅ C'EST TOUT!

Pour tester:
  node scripts/agents/email-agent-pro.js

Pour utiliser dans le bot:
  npm start

────────────────────────────────────────────────────────────────

🔒 SÉCURITÉ:
- Ne partage JAMAIS tes credentials
- Ajoute .env au .gitignore
- Rotate les tokens régulièrement
- En production, utilise Secrets Manager

📚 Documentation:
https://developers.google.com/gmail/api/quickstart/nodejs

`);

// Check if credentials are configured
const hasClientId = !!process.env.GMAIL_CLIENT_ID && !process.env.GMAIL_CLIENT_ID.includes('your_');
const hasClientSecret = !!process.env.GMAIL_CLIENT_SECRET && !process.env.GMAIL_CLIENT_SECRET.includes('your_');

if (hasClientId && hasClientSecret) {
  console.log('✅ Credentials détectés dans .env!\n');
  console.log('Client ID:', process.env.GMAIL_CLIENT_ID);
  console.log('\n📋 Prochaine étape: obtenir le refresh token (voir ÉTAPE 6 ci-dessus)\n');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GMAIL_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth2callback')}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify')}&access_type=offline&prompt=consent`;

  console.log('🔗 Ouvre cette URL dans ton navigateur:\n');
  console.log(authUrl);
  console.log('\n');
} else {
  console.log('⚠️  Configure d\'abord GMAIL_CLIENT_ID et GMAIL_CLIENT_SECRET dans .env\n');
}
