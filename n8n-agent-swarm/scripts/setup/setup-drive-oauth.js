#!/usr/bin/env node

/**
 * Google Drive OAuth Setup Helper
 *
 * Ce script aide à obtenir le refresh token Drive nécessaire pour le Drive Agent
 */

require('dotenv').config();
const http = require('http');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  📁 Google Drive OAuth Setup - Drive Agent                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Ce script va t'aider à configurer l'accès Google Drive pour le Drive Agent.

📋 PRÉREQUIS:
1. Compte Google
2. Projet Google Cloud (https://console.cloud.google.com)
3. Google Drive API activée
4. OAuth credentials créées

🚀 ÉTAPES:

ÉTAPE 1: Créer un projet Google Cloud (si pas déjà fait)
────────────────────────────────────────────────────────────────
1. Va sur: https://console.cloud.google.com/
2. Clique "Select a project" → "New Project"
3. Nom du projet: "AI Agent Swarm" (ou autre)
4. Clique "Create"

💡 Si tu as déjà créé un projet pour Gmail/Calendar, utilise le même!

ÉTAPE 2: Activer Google Drive API
────────────────────────────────────────────────────────────────
1. Dans ton projet, va sur:
   https://console.cloud.google.com/apis/library
2. Cherche "Google Drive API"
3. Clique "Enable"
4. Cherche aussi "Google Docs API" et enable
5. Cherche aussi "Google Sheets API" et enable

ÉTAPE 3: Configurer OAuth Consent Screen (si pas déjà fait)
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
7. Ajoute ces scopes Drive:
   - Google Drive API: .../auth/drive
   - Google Drive API: .../auth/drive.file
   - Google Docs API: .../auth/documents
8. Save and Continue → Save and Continue → Back to Dashboard

💡 Si déjà configuré pour Gmail, ajoute juste les scopes Drive!

ÉTAPE 4: Créer OAuth Client ID (ou réutiliser existant)
────────────────────────────────────────────────────────────────
Option A - Utiliser les credentials Gmail existants:
  Si tu as déjà GMAIL_CLIENT_ID et GMAIL_CLIENT_SECRET,
  tu peux les réutiliser pour Drive! Passe à ÉTAPE 5.

Option B - Créer de nouveaux credentials:
  1. Va sur: https://console.cloud.google.com/apis/credentials
  2. Clique "Create Credentials" → "OAuth client ID"
  3. Application type: "Desktop app" ou "Web application"
  4. Name: "AI Agent Drive"
  5. Si Web application, ajoute Authorized redirect URIs:
     http://localhost:3000/oauth2callback
  6. Clique "Create"
  7. COPIE le Client ID et Client Secret

ÉTAPE 5: Configurer .env
────────────────────────────────────────────────────────────────
Ajoute dans ton fichier .env:

GOOGLE_DRIVE_CLIENT_ID=ton_client_id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=ton_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/oauth2callback

💡 Ou réutilise les credentials Gmail si déjà configuré:
GOOGLE_DRIVE_CLIENT_ID=\${GMAIL_CLIENT_ID}
GOOGLE_DRIVE_CLIENT_SECRET=\${GMAIL_CLIENT_SECRET}

ÉTAPE 6: Obtenir le Refresh Token
────────────────────────────────────────────────────────────────
1. Va sur cette URL (remplace CLIENT_ID):

https://accounts.google.com/o/oauth2/v2/auth?client_id=CLIENT_ID&redirect_uri=http://localhost:3000/oauth2callback&response_type=code&scope=https://www.googleapis.com/auth/drive%20https://www.googleapis.com/auth/drive.file%20https://www.googleapis.com/auth/documents&access_type=offline&prompt=consent

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

OU avec PowerShell (Windows):

Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method POST -Body @{
  code = "TON_CODE"
  client_id = "TON_CLIENT_ID"
  client_secret = "TON_CLIENT_SECRET"
  redirect_uri = "http://localhost:3000/oauth2callback"
  grant_type = "authorization_code"
}

6. Réponse contient "refresh_token": "1//XXXXX"
7. COPIE ce refresh token dans .env:

GOOGLE_DRIVE_REFRESH_TOKEN=1//XXXXX

✅ C'EST TOUT!

Pour tester:
  node -e "const DriveAgent = require('./src/agents/drive-agent'); const agent = new DriveAgent(); agent.listRecentFiles(5).then(console.log);"

Pour utiliser dans le Manager Bot:
  /drive liste

────────────────────────────────────────────────────────────────

🔒 SÉCURITÉ:
- Ne partage JAMAIS tes credentials
- Ajoute .env au .gitignore
- Rotate les tokens régulièrement
- En production, utilise Secrets Manager

📚 Documentation:
https://developers.google.com/drive/api/quickstart/nodejs

💡 ASTUCE - Tout-en-un:
Si tu veux utiliser les mêmes credentials pour Gmail, Calendar ET Drive,
crée une seule paire de credentials avec tous les scopes:
- Gmail: .../auth/gmail.readonly, .../auth/gmail.send, .../auth/gmail.modify
- Calendar: .../auth/calendar, .../auth/calendar.events
- Drive: .../auth/drive, .../auth/drive.file, .../auth/documents

Puis dans .env:
GOOGLE_CLIENT_ID=xxxxx (utilisé pour tout)
GOOGLE_CLIENT_SECRET=xxxxx (utilisé pour tout)
GMAIL_CLIENT_ID=\${GOOGLE_CLIENT_ID}
GMAIL_CLIENT_SECRET=\${GOOGLE_CLIENT_SECRET}
GOOGLE_CALENDAR_CLIENT_ID=\${GOOGLE_CLIENT_ID}
GOOGLE_CALENDAR_CLIENT_SECRET=\${GOOGLE_CLIENT_SECRET}
GOOGLE_DRIVE_CLIENT_ID=\${GOOGLE_CLIENT_ID}
GOOGLE_DRIVE_CLIENT_SECRET=\${GOOGLE_CLIENT_SECRET}

Un seul refresh token avec tous les scopes, réutilisé partout!

`);

// Check if credentials are configured
const hasClientId = !!process.env.GOOGLE_DRIVE_CLIENT_ID && !process.env.GOOGLE_DRIVE_CLIENT_ID.includes('your_');
const hasClientSecret = !!process.env.GOOGLE_DRIVE_CLIENT_SECRET && !process.env.GOOGLE_DRIVE_CLIENT_SECRET.includes('your_');

// Check if Gmail credentials exist (can be reused)
const hasGmailClientId = !!process.env.GMAIL_CLIENT_ID && !process.env.GMAIL_CLIENT_ID.includes('your_');
const hasGmailClientSecret = !!process.env.GMAIL_CLIENT_SECRET && !process.env.GMAIL_CLIENT_SECRET.includes('your_');

if (hasClientId && hasClientSecret) {
  console.log('✅ Drive credentials détectés dans .env!\n');
  console.log('Client ID:', process.env.GOOGLE_DRIVE_CLIENT_ID);
  console.log('\n📋 Prochaine étape: obtenir le refresh token (voir ÉTAPE 6 ci-dessus)\n');

  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';
  const scopes = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_DRIVE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;

  console.log('🔗 Ouvre cette URL dans ton navigateur:\n');
  console.log(authUrl);
  console.log('\n');

  // Provide curl command template
  console.log('📋 Après avoir obtenu le code, exécute:\n');
  console.log(`curl -X POST https://oauth2.googleapis.com/token \\
  -d "code=TON_CODE_ICI" \\
  -d "client_id=${process.env.GOOGLE_DRIVE_CLIENT_ID}" \\
  -d "client_secret=${process.env.GOOGLE_DRIVE_CLIENT_SECRET}" \\
  -d "redirect_uri=${redirectUri}" \\
  -d "grant_type=authorization_code"
`);

} else if (hasGmailClientId && hasGmailClientSecret) {
  console.log('💡 Gmail credentials détectés! Tu peux les réutiliser pour Drive.\n');
  console.log('Ajoute dans .env:\n');
  console.log('GOOGLE_DRIVE_CLIENT_ID=${GMAIL_CLIENT_ID}');
  console.log('GOOGLE_DRIVE_CLIENT_SECRET=${GMAIL_CLIENT_SECRET}');
  console.log('GOOGLE_DRIVE_REDIRECT_URI=${GMAIL_REDIRECT_URI}\n');
  console.log('Puis relance ce script.\n');
} else {
  console.log('⚠️  Configure d\'abord GOOGLE_DRIVE_CLIENT_ID et GOOGLE_DRIVE_CLIENT_SECRET dans .env\n');
  console.log('Ou configure GMAIL_CLIENT_ID et GMAIL_CLIENT_SECRET pour les réutiliser.\n');
}
