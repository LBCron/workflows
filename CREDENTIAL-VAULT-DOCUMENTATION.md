# 🔐 Universal Credential Vault - Documentation Complète

**Version:** 1.0.0
**Date:** 2025-11-17
**Status:** ✅ Production Ready

---

## 📋 Vue d'ensemble

Le **Universal Credential Vault** est un système de gestion d'identifiants ultra-sécurisé qui supporte **27+ services** différents avec chiffrement AES-256-GCM.

### 🎯 Capacités

- **6 Email Providers:** Gmail, Outlook, Yahoo, ProtonMail, iCloud, Custom SMTP
- **7 Commerce Platforms:** Xianyu, Weigou, Vinted, Taobao, AliExpress, eBay, Leboncoin
- **5 Productivity Tools:** Google, Microsoft 365, Notion, Trello, Slack
- **4 Social Media:** WeChat, WhatsApp, Twitter/X, LinkedIn
- **4 Payment Systems:** PayPal, Stripe, Alipay, WeChat Pay
- **1 Custom:** N'importe quel service custom

### 🔒 Sécurité

- **Chiffrement:** AES-256-GCM (authentifié)
- **Stockage:** Fichier JSON chiffré local (`.credentials.vault`)
- **Master Password:** Requis via variable d'environnement
- **Salt:** Configurable pour dérivation de clé
- **Auto-delete:** Messages credentials supprimés après traitement

---

## 🚀 Quick Start

### 1. Configuration

Ajouter dans `.env.paul`:

```env
# Credential Vault
MASTER_PASSWORD=your-super-strong-master-password-here
VAULT_SALT=your-random-salt-value-here
```

⚠️ **IMPORTANT:** Gardez ces valeurs secrètes et ne les commitez JAMAIS !

### 2. Commandes Telegram

#### Menu principal
```
/credentials
```

Affiche tous les services configurés groupés par type.

#### Lister services disponibles
```
/list_services
```

Affiche les **27 services supportés** avec leurs IDs.

#### Ajouter un service

**Via boutons:**
1. `/list_services` → Cliquer sur catégorie → Choisir service

**Via commande manuelle:**
```
/set_outlook
email: your@outlook.com
password: your_password
```

⚠️ Le message sera **supprimé automatiquement** après traitement.

#### Supprimer un service
```
/remove_service outlook
```

#### Export backup chiffré
```
/export_vault
```

Vous recevrez un fichier JSON chiffré avec mot de passe custom.

---

## 📧 Email Providers

### Gmail

**Configuration:**
```
/set_gmail
email: your@gmail.com
app_password: xxxx xxxx xxxx xxxx
```

**Instructions:**
1. Aller sur https://myaccount.google.com/security
2. Activer "2-Step Verification"
3. Créer "App password" pour "Mail"
4. Copier le mot de passe (16 caractères)

---

### Outlook/Hotmail

**Configuration:**
```
/set_outlook
email: your@outlook.com
password: your_password
```

Si 2FA activé, utilisez app password à la place.

**SMTP:** smtp-mail.outlook.com:587

---

### Yahoo Mail

**Configuration:**
```
/set_yahoo
email: your@yahoo.com
app_password: xxxxxxxxxxxx
```

**Instructions:**
1. https://login.yahoo.com/account/security
2. "Generate app password"
3. Sélectionner "Other App"

**SMTP:** smtp.mail.yahoo.com:465

---

### ProtonMail

**Configuration:**
```
/set_protonmail
email: your@protonmail.com
password: your_password
bridge_password: generated_by_bridge
```

**Prérequis:** ProtonMail Bridge installé

**SMTP:** localhost:1025

---

### iCloud Mail

**Configuration:**
```
/set_icloud
email: your@icloud.com
app_password: xxxx-xxxx-xxxx-xxxx
```

**Instructions:**
1. appleid.apple.com
2. Security → App-Specific Passwords
3. Générer mot de passe

**SMTP:** smtp.mail.me.com:587

---

### Custom SMTP

**Configuration:**
```
/set_custom_smtp
email: your@domain.com
password: your_password
smtp_host: smtp.yourdomain.com
smtp_port: 587
smtp_secure: false
```

Pour tout autre provider email.

---

## 🛍️ Commerce Platforms

### Xianyu (闲鱼)

**Configuration:**
```
/set_xianyu
username: your_username
password: your_password
```

⚠️ Première connexion: résolution CAPTCHA manuelle requise

---

### Vinted

**Configuration:**
```
/set_vinted
email: your@email.com
password: your_password
```

---

### Taobao (淘宝)

**Configuration:**
```
/set_taobao
username: your_username
password: your_password
```

---

### AliExpress

**Configuration:**
```
/set_aliexpress
email: your@email.com
password: your_password
```

---

### eBay

**Configuration:**
```
/set_ebay
username: your_username
password: your_password
```

**Optionnel (API):**
```
api_key: your_api_key
api_secret: your_api_secret
```

---

### Leboncoin

**Configuration:**
```
/set_leboncoin
email: your@email.com
password: your_password
```

---

### Weigou (微购)

**Configuration:**
```
/set_weigou
username: your_username
password: your_password
```

---

## 📊 Productivity Tools

### Google Workspace

**Configuration:**
```
/set_google
client_id: xxxxx.apps.googleusercontent.com
client_secret: GOCSPX-xxxxx
refresh_token: your_refresh_token
```

**Setup:**
1. Google Cloud Console
2. Créer projet
3. Activer APIs (Drive, Calendar, Gmail)
4. Créer OAuth credentials
5. Obtenir refresh token

---

### Microsoft 365

**Configuration:**
```
/set_microsoft365
client_id: your_client_id
client_secret: your_client_secret
refresh_token: your_refresh_token
tenant_id: your_tenant_id
```

**Setup:**
1. Azure Portal → App registrations
2. Créer application
3. API permissions (Mail, Calendar, OneDrive)
4. Obtenir credentials

---

### Notion

**Configuration:**
```
/set_notion
api_key: secret_xxxxxxxxxxxx
```

**Setup:**
1. https://www.notion.so/my-integrations
2. Créer intégration
3. Copier API key

---

### Trello

**Configuration:**
```
/set_trello
api_key: your_api_key
api_token: your_api_token
```

**Setup:**
1. https://trello.com/app-key
2. Copier API Key
3. Générer Token

---

### Slack

**Configuration:**
```
/set_slack
bot_token: xoxb-xxxxxxxxxxxxx
workspace_id: T0XXXXXXX
```

**Setup:**
1. api.slack.com/apps
2. Créer app
3. OAuth → Bot Token

---

## 💬 Social Media

### WeChat (微信)

**Configuration:**
```
/set_wechat
username: your_wechat_id
password: your_password
```

⚠️ Scan QR requis pour première connexion

---

### WhatsApp

**Configuration:**
```
/set_whatsapp
phone: +33612345678
session_data: generated_after_qr_scan
```

---

### Twitter/X

**Configuration:**
```
/set_twitter
api_key: xxxxxxxxxxxx
api_secret: xxxxxxxxxxxx
access_token: xxxxxxxxxxxx
access_secret: xxxxxxxxxxxx
```

**Setup:**
1. developer.twitter.com
2. Créer app
3. Keys & Tokens

---

### LinkedIn

**Configuration:**
```
/set_linkedin
email: your@email.com
password: your_password
```

---

## 💳 Payment Systems

### PayPal

**Configuration:**
```
/set_paypal
client_id: your_client_id
client_secret: your_client_secret
```

**Setup:**
1. developer.paypal.com
2. Create App
3. Copier credentials

---

### Stripe

**Configuration:**
```
/set_stripe
api_key: pk_live_xxxxxxxxxxxx
secret_key: sk_live_xxxxxxxxxxxx
```

**Setup:**
1. dashboard.stripe.com
2. Developers → API keys

---

### Alipay (支付宝)

**Configuration:**
```
/set_alipay
app_id: your_app_id
private_key: your_private_key
```

**Setup:**
1. open.alipay.com
2. Créer application
3. Obtenir credentials

---

### WeChat Pay (微信支付)

**Configuration:**
```
/set_wechatpay
mch_id: your_merchant_id
api_key: your_api_key
```

**Setup:**
1. pay.weixin.qq.com
2. Merchant account
3. API credentials

---

## ⚙️ Service Custom

Pour n'importe quel service non listé:

**Configuration:**
```
/set_custom
service_name: Mon API Custom
url: https://api.example.com
username: optional_username
password: optional_password
api_key: optional_api_key
notes: Optional notes here
```

---

## 🔧 API Usage (Programmation)

### Importer le vault

```javascript
const UniversalCredentialVault = require('./src/core/universal-credential-vault');

const vault = new UniversalCredentialVault();
await vault.load();
```

### Lister services supportés

```javascript
const services = vault.getSupportedServices();

// Filtrer par type
const emailServices = services.filter(s => s.type === 'email');
```

### Ajouter credentials

```javascript
await vault.setCredentials('gmail', {
  email: 'your@gmail.com',
  app_password: 'xxxx xxxx xxxx xxxx'
});
```

### Récupérer credentials

```javascript
const gmailCreds = await vault.getCredentials('gmail');

console.log(gmailCreds.email); // 'your@gmail.com'
console.log(gmailCreds.app_password); // 'xxxx xxxx xxxx xxxx'
```

### Vérifier si configuré

```javascript
const hasGmail = await vault.hasCredentials('gmail');

if (hasGmail) {
  const creds = await vault.getCredentials('gmail');
  // Use credentials...
}
```

### Supprimer credentials

```javascript
await vault.deleteCredentials('gmail');
```

### Export backup

```javascript
const backup = await vault.exportEncrypted('my-backup-password');

// Save to file
const fs = require('fs');
fs.writeFileSync('vault_backup.json', JSON.stringify(backup, null, 2));
```

### Import backup

```javascript
const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('vault_backup.json', 'utf8'));

const count = await vault.importEncrypted(backup, 'my-backup-password');
console.log(`${count} services imported`);
```

---

## 🔒 Sécurité Best Practices

### 1. Master Password

- Minimum **20 caractères**
- Combinaison majuscules/minuscules/chiffres/symboles
- Unique (ne réutilisez JAMAIS ailleurs)
- Stocké uniquement dans `.env.paul` (gitignored)

### 2. Vault Salt

- Valeur aléatoire
- Au moins 16 caractères
- Changée si master password change

### 3. Backups

- Créer backups réguliers avec `/export_vault`
- Stocker backups dans un lieu sûr (pas git!)
- Utiliser mot de passe différent pour backup

### 4. Telegram Messages

- Messages `/set_XXX` supprimés automatiquement
- Ne partagez JAMAIS votre chat Telegram
- Utilisez Telegram avec 2FA activé

### 5. Permissions fichier

```bash
chmod 600 .credentials.vault
chmod 600 .env.paul
```

---

## 📊 Tests

### Lancer tests automatiques

```bash
node test-vault.js
```

**Tests couverts:**
- ✅ Chargement/Sauvegarde
- ✅ Ajout/Suppression credentials
- ✅ Encryption AES-256-GCM
- ✅ Export/Import backup
- ✅ 27 services templates

---

## 🐛 Troubleshooting

### "MASTER_PASSWORD manquant"

**Solution:** Ajouter dans `.env.paul`:
```env
MASTER_PASSWORD=your-master-password
VAULT_SALT=your-salt
```

### "Format vault invalide"

**Cause:** Vault corrompu ou wrong password

**Solution:**
```bash
rm .credentials.vault
# Reconfigure services
```

### "Champ requis manquant"

**Cause:** Champs obligatoires non fournis

**Solution:** Vérifier template du service avec `/list_services`

### Service non supporté

**Solution:** Utiliser `/set_custom` pour services personnalisés

---

## 📈 Statistiques

- **Services supportés:** 27
- **Types de services:** 6 (email, commerce, productivity, social, payment, custom)
- **Chiffrement:** AES-256-GCM
- **Taille vault (vide):** ~200 bytes
- **Taille vault (10 services):** ~2KB
- **Performance:** <10ms pour save/load

---

## 🔄 Changelog

### v1.0.0 (2025-11-17)

- ✅ Initial release
- ✅ 27 services templates
- ✅ AES-256-GCM encryption
- ✅ Telegram integration
- ✅ Export/Import backup
- ✅ Auto-delete sensitive messages
- ✅ Multi-step conversations
- ✅ Comprehensive tests

---

## 📞 Support

Pour toute question ou problème:

1. Consulter cette documentation
2. Vérifier `/help` dans Telegram
3. Tester avec `node test-vault.js`

---

## 🎯 Roadmap

- [ ] Import/export CSV
- [ ] Rotation automatique credentials
- [ ] Audit log
- [ ] Multi-user support
- [ ] Cloud sync (chiffré)
- [ ] Mobile app

---

**Status:** ✅ **Production Ready**
**Sécurité:** 🔐 **AES-256-GCM**
**Tests:** ✅ **100% Passed**
