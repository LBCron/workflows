# 🔐 GUIDE COMPLET - OAUTH GMAIL & GOOGLE CALENDAR SETUP

**Date:** 2025-11-17
**Temps requis:** 1-2 heures (une seule fois)
**Niveau:** Intermédiaire

---

## ❓ POURQUOI C'EST NÉCESSAIRE ?

Pour que le Bot Paul puisse:
- ✅ **Lire vos emails** Gmail
- ✅ **Envoyer des emails** à votre place
- ✅ **Voir votre calendrier** Google Calendar
- ✅ **Créer des événements** automatiquement

**C'est sécurisé:**
- Vous autorisez VOTRE propre application
- Les tokens restent sur VOTRE machine
- Pas de serveur tiers
- Révocable à tout moment

---

## 📋 VUE D'ENSEMBLE

```
Google Cloud Console
    ↓
Créer Projet AI Bot
    ↓
Activer Gmail API + Calendar API
    ↓
Configurer OAuth Consent
    ↓
Créer OAuth Credentials
    ↓
Obtenir Refresh Token
    ↓
Ajouter dans .env
    ↓
✅ Bot fonctionnel!
```

---

## 🚀 ÉTAPE 1: GOOGLE CLOUD CONSOLE (5 min)

### 1.1 Accéder à la console

1. Ouvrir: https://console.cloud.google.com/
2. Se connecter avec votre compte Gmail
3. Accepter les conditions (si première fois)

### 1.2 Créer un nouveau projet

1. Cliquer sur le sélecteur de projet (en haut à gauche)
2. Cliquer "**New Project**"
3. Paramètres:
   - **Project name:** `AI Bot Email Calendar`
   - **Organization:** None (ou votre org)
   - **Location:** No organization
4. Cliquer "**Create**"
5. Attendre 10-20 secondes
6. Sélectionner le nouveau projet

**✅ Checkpoint:** Vous êtes dans le projet "AI Bot Email Calendar"

---

## 🔌 ÉTAPE 2: ACTIVER LES APIs (5 min)

### 2.1 Activer Gmail API

1. Dans le menu latéral: "**APIs & Services**" → "**Library**"
2. Chercher: `Gmail API`
3. Cliquer sur "**Gmail API**"
4. Cliquer "**Enable**"
5. Attendre 5-10 secondes

### 2.2 Activer Google Calendar API

1. Retourner à "**Library**"
2. Chercher: `Google Calendar API`
3. Cliquer sur "**Google Calendar API**"
4. Cliquer "**Enable**"
5. Attendre 5-10 secondes

**✅ Checkpoint:** 2 APIs activées (Gmail + Calendar)

---

## 🔒 ÉTAPE 3: CONFIGURER OAUTH CONSENT SCREEN (10 min)

### 3.1 Accéder au consent screen

1. Menu latéral: "**APIs & Services**" → "**OAuth consent screen**"
2. Vous verrez un formulaire de configuration

### 3.2 Choisir User Type

1. Sélectionner: **External**
   - Pourquoi? Vous êtes seul utilisateur, pas dans une organisation Google Workspace
2. Cliquer "**Create**"

### 3.3 Remplir App Information

**Écran 1: App information**

- **App name:** `AI Bot Assistant`
- **User support email:** Votre email Gmail
- **App logo:** (optionnel, laisser vide)
- **App domain:**
  - Homepage: (laisser vide)
  - Privacy policy: (laisser vide)
  - Terms of service: (laisser vide)
- **Authorized domains:** (laisser vide)
- **Developer contact information:** Votre email Gmail

Cliquer "**Save and Continue**"

### 3.4 Ajouter les Scopes

**Écran 2: Scopes**

1. Cliquer "**Add or Remove Scopes**"
2. Dans la popup, chercher et cocher:

   **Gmail Scopes:**
   - ✅ `https://www.googleapis.com/auth/gmail.readonly`
     - Description: "Read all Gmail messages"
   - ✅ `https://www.googleapis.com/auth/gmail.send`
     - Description: "Send email on your behalf"
   - ✅ `https://www.googleapis.com/auth/gmail.modify`
     - Description: "Manage Gmail messages"

   **Calendar Scopes:**
   - ✅ `https://www.googleapis.com/auth/calendar`
     - Description: "See, edit, share, and permanently delete all calendars"
   - ✅ `https://www.googleapis.com/auth/calendar.events`
     - Description: "View and edit events on all your calendars"

3. Cliquer "**Update**"
4. Vérifier que 5 scopes sont listés
5. Cliquer "**Save and Continue**"

### 3.5 Ajouter Test Users

**Écran 3: Test users**

1. Cliquer "**Add Users**"
2. Entrer votre email Gmail (celui que vous utiliserez avec le bot)
3. Cliquer "**Add**"
4. Cliquer "**Save and Continue**"

### 3.6 Summary

**Écran 4: Summary**

1. Vérifier que tout est correct
2. Cliquer "**Back to Dashboard**"

**✅ Checkpoint:** OAuth consent screen configuré avec 5 scopes et 1 test user

---

## 🔑 ÉTAPE 4: CRÉER OAUTH CLIENT ID (5 min)

### 4.1 Créer les credentials

1. Menu latéral: "**APIs & Services**" → "**Credentials**"
2. Cliquer "**Create Credentials**" (en haut)
3. Sélectionner "**OAuth client ID**"

### 4.2 Configurer le client

**Application type:**
- Sélectionner: **Desktop app**
  - Pourquoi? Le bot tourne sur votre machine locale

**Name:**
- Entrer: `AI Bot Desktop Client`

Cliquer "**Create**"

### 4.3 Télécharger les credentials

1. Une popup s'affiche avec:
   - **Client ID:** `xxxxx.apps.googleusercontent.com`
   - **Client Secret:** `GOCSPX-xxxxx`

2. **OPTION A:** Copier manuellement
   - Copier Client ID
   - Copier Client Secret
   - Les noter dans un fichier temporaire

3. **OPTION B:** Télécharger JSON
   - Cliquer "**Download JSON**"
   - Sauvegarder le fichier
   - Renommer en `credentials.json`

4. Cliquer "**OK**"

**✅ Checkpoint:** Vous avez Client ID et Client Secret

---

## 🎫 ÉTAPE 5: OBTENIR LE REFRESH TOKEN (20-30 min)

### 5.1 Méthode manuelle (PowerShell)

Cette méthode utilise PowerShell pour obtenir le refresh token.

#### 5.1.1 Construire l'URL d'autorisation

1. Ouvrir Notepad
2. Copier ce template:

```
https://accounts.google.com/o/oauth2/v2/auth?
client_id=VOTRE_CLIENT_ID&
redirect_uri=http://localhost:3000/oauth2callback&
response_type=code&
scope=https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.modify%20https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/calendar.events&
access_type=offline&
prompt=consent
```

3. Remplacer `VOTRE_CLIENT_ID` par votre vrai Client ID
4. Tout mettre sur une seule ligne (supprimer les retours à la ligne)
5. L'URL finale ressemble à:

```
https://accounts.google.com/o/oauth2/v2/auth?client_id=123456789-abc123.apps.googleusercontent.com&redirect_uri=http://localhost:3000/oauth2callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.modify%20https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent
```

#### 5.1.2 Autoriser l'application

1. Copier l'URL complète
2. Ouvrir dans votre navigateur
3. Se connecter avec votre compte Gmail
4. Vous verrez: "**AI Bot Assistant wants to access your Google Account**"
5. Vérifier les permissions:
   - ✅ Read all Gmail messages
   - ✅ Send email on your behalf
   - ✅ See, edit, share, and permanently delete all calendars
6. Cliquer "**Allow**" (ou "Autoriser")

#### 5.1.3 Récupérer le code

1. Vous serez redirigé vers:
   ```
   http://localhost:3000/oauth2callback?code=4/0Adeu5BW...LONG_CODE...&scope=https://...
   ```

2. La page ne chargera pas (normal!)
3. Copier **UNIQUEMENT** la partie après `code=` et avant `&scope`
4. Exemple:
   ```
   4/0Adeu5BW-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx-yyyyyyyyyyyyyyyy
   ```

#### 5.1.4 Échanger le code contre un refresh token

1. Ouvrir **PowerShell**
2. Copier/coller ce script en remplaçant les valeurs:

```powershell
$code = "VOTRE_CODE_ICI"
$clientId = "VOTRE_CLIENT_ID"
$clientSecret = "VOTRE_CLIENT_SECRET"

$body = @{
    code = $code
    client_id = $clientId
    client_secret = $clientSecret
    redirect_uri = "http://localhost:3000/oauth2callback"
    grant_type = "authorization_code"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method POST -Body $body -ContentType "application/json"

Write-Host "Refresh Token:" -ForegroundColor Green
Write-Host $response.refresh_token -ForegroundColor Yellow
```

3. Appuyer **Enter**
4. Vous verrez:
   ```
   Refresh Token:
   1//0gxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

5. **COPIER CE REFRESH TOKEN** (commence par `1//0g`)

#### 5.1.5 Tester le refresh token

Vérifier qu'il fonctionne:

```powershell
$refreshToken = "VOTRE_REFRESH_TOKEN"
$clientId = "VOTRE_CLIENT_ID"
$clientSecret = "VOTRE_CLIENT_SECRET"

$body = @{
    refresh_token = $refreshToken
    client_id = $clientId
    client_secret = $clientSecret
    grant_type = "refresh_token"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method POST -Body $body -ContentType "application/json"

Write-Host "Access Token obtenu!" -ForegroundColor Green
Write-Host $response.access_token.Substring(0, 30) + "..." -ForegroundColor Yellow
```

Si vous voyez "Access Token obtenu!", c'est bon! ✅

**✅ Checkpoint:** Vous avez un Refresh Token valide

---

## 📝 ÉTAPE 6: AJOUTER DANS .ENV (5 min)

### 6.1 Éditer .env.manager (pour Manager Bot)

Ouvrir: `n8n-agent-swarm/.env.manager`

Ajouter à la fin:

```bash
# ===== GMAIL OAUTH =====
GMAIL_CLIENT_ID=votre_client_id_ici.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-votre_secret_ici
GMAIL_REDIRECT_URI=http://localhost:3000/oauth2callback
GMAIL_REFRESH_TOKEN=1//0gxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===== GOOGLE CALENDAR OAUTH =====
GOOGLE_CALENDAR_CLIENT_ID=votre_client_id_ici.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=GOCSPX-votre_secret_ici
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_CALENDAR_REFRESH_TOKEN=1//0gxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CALENDAR_ID=primary
```

**Note:** Client ID et Secret sont les **MÊMES** pour Gmail et Calendar!

### 6.2 Créer .env pour Paul Bot

Si vous n'avez pas encore de `.env`, créer:

```bash
cp n8n-agent-swarm/.env.example n8n-agent-swarm/.env
```

Puis ajouter les mêmes variables OAuth.

**✅ Checkpoint:** Variables OAuth dans .env

---

## ✅ ÉTAPE 7: TESTER (10 min)

### 7.1 Installer dépendances Google

```bash
cd n8n-agent-swarm
npm install googleapis google-auth-library
```

### 7.2 Tester Gmail API

Créer un fichier test `test-gmail.js`:

```javascript
require('dotenv').config({ path: '.env.manager' });
const { google } = require('googleapis');

async function testGmail() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const { data } = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5
    });

    console.log('✅ Gmail API fonctionne!');
    console.log(`Messages trouvés: ${data.messages?.length || 0}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testGmail();
```

Lancer:
```bash
node test-gmail.js
```

Si vous voyez "✅ Gmail API fonctionne!", c'est bon!

### 7.3 Tester Calendar API

Créer `test-calendar.js`:

```javascript
require('dotenv').config({ path: '.env.manager' });
const { google } = require('googleapis');

async function testCalendar() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime'
    });

    console.log('✅ Calendar API fonctionne!');
    console.log(`Événements à venir: ${data.items?.length || 0}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testCalendar();
```

Lancer:
```bash
node test-calendar.js
```

### 7.4 Tester le bot complet

```bash
node scripts/telegram-bot.js
```

Dans Telegram:
1. `/start`
2. Cliquer "📧 Emails"
3. Cliquer "📊 Résumé"

Si ça fonctionne → **Setup OAuth 100% complet!** 🎉

---

## 🐛 TROUBLESHOOTING

### Problème 1: "Error 403: access_denied"

**Cause:** App non configurée en "Test mode" ou email pas dans test users

**Solution:**
1. Aller dans OAuth consent screen
2. Vérifier "Publishing status": **Testing**
3. Ajouter votre email dans "Test users"

### Problème 2: "Error 400: redirect_uri_mismatch"

**Cause:** Redirect URI pas autorisée

**Solution:**
1. Aller dans Credentials → OAuth Client ID
2. Ajouter `http://localhost:3000/oauth2callback` dans "Authorized redirect URIs"

### Problème 3: "invalid_grant"

**Cause:** Refresh token expiré ou invalide

**Solution:**
1. Redemander un nouveau authorization code
2. Régénérer un nouveau refresh token
3. Mettre à jour .env

### Problème 4: "insufficient permissions"

**Cause:** Scopes manquants

**Solution:**
1. Vérifier OAuth consent screen → Scopes
2. Ajouter les scopes manquants
3. Redemander authorization (avec `prompt=consent`)

---

## ❓ FAQ

### Q: Le refresh token expire-t-il ?

**R:** Non, il est valide indéfiniment SAUF si:
- Vous le révoquez manuellement
- Vous changez votre mot de passe Google
- Google détecte une activité suspecte
- L'app reste inactive pendant 6 mois (rare)

### Q: C'est sécurisé ?

**R:** Oui!
- Vous autorisez VOTRE propre application
- Les tokens sont stockés localement sur VOTRE machine
- Pas de serveur tiers
- Communication HTTPS avec Google
- Révocable à tout moment

### Q: Puis-je utiliser plusieurs comptes Gmail ?

**R:** Oui!
1. Répéter le processus pour chaque compte
2. Stocker avec des préfixes différents:
   - `GMAIL_PRIMARY_REFRESH_TOKEN`
   - `GMAIL_WORK_REFRESH_TOKEN`

### Q: Dois-je publier l'app ?

**R:** Non!
- Mode "Testing" suffit
- Vous êtes le seul utilisateur
- Pas besoin de vérification Google

### Q: Combien ça coûte ?

**R:** Gratuit!
- APIs Gmail et Calendar sont gratuites
- Quotas généreux:
  - Gmail: 1 milliard de requêtes/jour
  - Calendar: 1 million de requêtes/jour

---

## 📊 RÉSUMÉ FINAL

✅ **Ce que vous avez fait:**
1. Créé un projet Google Cloud
2. Activé Gmail API + Calendar API
3. Configuré OAuth consent screen
4. Créé OAuth Client credentials
5. Obtenu un Refresh Token
6. Configuré .env
7. Testé que tout fonctionne

✅ **Ce que le bot peut faire maintenant:**
- Lire vos emails Gmail
- Envoyer des emails à votre place
- Voir votre calendrier
- Créer des événements
- Trouver des créneaux libres
- Résumer vos emails
- Suggérer des réponses

🎉 **Setup OAuth 100% complet!**

---

**Prochaine étape:** Tester toutes les fonctionnalités Email et Calendar du bot!
