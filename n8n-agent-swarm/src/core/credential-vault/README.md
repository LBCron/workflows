# 🔐 Universal Credential Vault

Système de gestion sécurisée des credentials pour 30+ services, avec chiffrement AES-256-GCM et intégration Telegram.

## 📋 Fonctionnalités

✅ **Support 30+ Services:**
- 📧 **Email:** Gmail, Outlook, Yahoo, ProtonMail, iCloud, Custom SMTP
- 🛍️ **Commerce:** Xianyu (闲鱼), Weigou (微购), Vinted, Taobao, AliExpress, eBay, Leboncoin
- 📊 **Productivity:** Google Workspace, Microsoft 365, Notion, Trello, Slack
- 💬 **Social Media:** WeChat, WhatsApp, Twitter/X, LinkedIn
- 💳 **Payment:** PayPal, Stripe, Alipay, WeChat Pay
- ⚙️ **Custom:** N'importe quel service avec credentials personnalisés

✅ **Sécurité:**
- Chiffrement AES-256-GCM
- Master password requis
- Stockage local chiffré
- Auto-suppression des messages sensibles
- Backup/Restore chiffré

✅ **Intégration Telegram:**
- Commandes simples et intuitives
- Interface avec boutons interactifs
- Configuration guidée pour chaque service
- Messages auto-supprimés pour sécurité

## 🚀 Installation

### 1. Configuration .env

Ajoutez dans votre fichier `.env`:

```bash
# Master password pour chiffrement (REQUIS - minimum 16 caractères)
MASTER_PASSWORD=votre_mot_de_passe_fort_minimum_16_chars

# Salt optionnel (pour sécurité supplémentaire)
VAULT_SALT=votre_salt_optionnel
```

### 2. Démarrer le bot avec vault

```bash
# Utiliser le bot avec vault intégré
node src/bot/bot-with-vault.js
```

Ou mettre à jour le `package.json`:

```json
{
  "scripts": {
    "start:vault": "node src/bot/bot-with-vault.js"
  }
}
```

## 📱 Commandes Telegram

### Commandes principales

```
/credentials        - Menu principal du vault
/list_services      - Lister tous les services supportés (30+)
/add_service [id]   - Ajouter/configurer un service
/remove_service [id] - Supprimer un service
/export_vault       - Créer un backup chiffré
/import_vault       - Restaurer depuis backup
```

### Exemples d'utilisation

#### 1. Voir les services disponibles

```
/list_services
```

Réponse:
```
📋 Services Supportés (30)

📧 EMAIL:
  • Gmail (gmail)
  • Outlook/Hotmail (outlook)
  • Yahoo Mail (yahoo)
  • ProtonMail (protonmail)
  • iCloud Mail (icloud)
  • Custom SMTP (custom_smtp)

🛍️ COMMERCE:
  • Xianyu (闲鱼) (xianyu)
  • Weigou (微购) (weigou)
  • Vinted (vinted)
  • Taobao (淘宝) (taobao)
  ...
```

#### 2. Ajouter un service - Exemple Outlook

```
/add_service outlook
```

Le bot répond avec les instructions:
```
🔐 Configuration Outlook/Hotmail

Outlook/Hotmail:
1. Email: votre adresse @outlook.com ou @hotmail.com
2. Password: votre mot de passe Outlook
3. Si 2FA activé: utiliser app password

Champs requis:
• email
• password

Format d'envoi:
```
/set_outlook
email: votre@outlook.com
password: VotreMotDePasse123
```
```

Ensuite, envoyez vos credentials:
```
/set_outlook
email: john.doe@outlook.com
password: MonMotDePasseSecure123
```

**⚠️ Important:** Le message contenant vos credentials sera **automatiquement supprimé** après traitement pour sécurité.

#### 3. Ajouter Xianyu (Commerce Chine)

```
/add_service xianyu
```

Instructions:
```
🔐 Configuration Xianyu (闲鱼)

Xianyu (闲鱼):
1. Username: votre nom d'utilisateur
2. Password: votre mot de passe
3. Première connexion: résolution CAPTCHA manuelle

Champs requis:
• username
• password

Champs optionnels:
• phone (optionnel)
• session_cookies (optionnel)
```

Configuration:
```
/set_xianyu
username: mon_username_xianyu
password: MotDePasseXianyu123
phone: +86 138 0000 0000
```

#### 4. Voir les services configurés

```
/credentials
```

Réponse:
```
🔐 Credential Vault Universel

Services configurés (3):

📧 EMAIL
  ✅ Gmail
  ✅ Outlook/Hotmail

🛍️ COMMERCE
  ✅ Xianyu (闲鱼)

Commandes disponibles:
/add_service - Ajouter un service
/list_services - Services disponibles
/remove_service - Supprimer un service
/export_vault - Backup chiffré
```

#### 5. Supprimer un service

```
/remove_service outlook
```

Réponse:
```
✅ Service supprimé: Outlook/Hotmail

Les credentials ont été supprimés du vault.
```

#### 6. Export backup (sécurisé)

```
/export_vault
```

Instructions:
```
🔐 Export du Vault

Le vault contient 3 service(s).

Pour exporter, envoyez un mot de passe de chiffrement:
/export_with_password VotreMotDePasse123

⚠️ Important: Ce mot de passe sera nécessaire pour restaurer le backup.
```

## 🔧 Utilisation Programmatique

### Exemple dans votre code

```javascript
const UniversalCredentialVault = require('./src/core/credential-vault/universal-credential-vault');

// Créer instance
const vault = new UniversalCredentialVault();

// Charger le vault
await vault.load();

// Ajouter credentials
await vault.setCredentials('outlook', {
  email: 'john@outlook.com',
  password: 'MonMotDePasse123'
});

// Récupérer credentials
const outlookCreds = await vault.getCredentials('outlook');
console.log(outlookCreds);
// {
//   email: 'john@outlook.com',
//   password: 'MonMotDePasse123',
//   serviceType: 'email',
//   provider: 'outlook',
//   addedAt: '2025-11-17T...',
//   lastUpdated: '2025-11-17T...'
// }

// Lister services configurés
const services = await vault.listConfiguredServices();
console.log(services);
// [
//   {
//     id: 'outlook',
//     name: 'Outlook/Hotmail',
//     type: 'email',
//     provider: 'outlook',
//     addedAt: '...',
//     lastUpdated: '...'
//   }
// ]

// Vérifier si service existe
const hasOutlook = await vault.hasCredentials('outlook');
console.log(hasOutlook); // true

// Supprimer credentials
await vault.deleteCredentials('outlook');

// Export backup
const backup = await vault.exportEncrypted('MotDePasseBackup123');
console.log(backup);
// {
//   version: '1.0',
//   data: 'abc123...',
//   exportedAt: '2025-11-17T...'
// }

// Import backup
const count = await vault.importEncrypted(backup, 'MotDePasseBackup123');
console.log(`${count} services importés`);
```

## 📦 Services Supportés

### Email (6 providers)

| Service | ID | Champs requis |
|---------|----|--------------|
| Gmail | `gmail` | email, app_password |
| Outlook | `outlook` | email, password |
| Yahoo | `yahoo` | email, app_password |
| ProtonMail | `protonmail` | email, password, bridge_password |
| iCloud | `icloud` | email, app_password |
| Custom SMTP | `custom_smtp` | email, password, smtp_host, smtp_port |

### Commerce (7 platforms)

| Service | ID | Champs requis |
|---------|----|--------------|
| Xianyu | `xianyu` | username, password |
| Weigou | `weigou` | username, password |
| Vinted | `vinted` | email, password |
| Taobao | `taobao` | username, password |
| AliExpress | `aliexpress` | email, password |
| eBay | `ebay` | username, password |
| Leboncoin | `leboncoin` | email, password |

### Productivity (5 services)

| Service | ID | Champs requis |
|---------|----|--------------|
| Google | `google` | client_id, client_secret, refresh_token |
| Microsoft 365 | `microsoft365` | client_id, client_secret, refresh_token |
| Notion | `notion` | api_key |
| Trello | `trello` | api_key, api_token |
| Slack | `slack` | bot_token, workspace_id |

### Social Media (4 platforms)

| Service | ID | Champs requis |
|---------|----|--------------|
| WeChat | `wechat` | username, password |
| WhatsApp | `whatsapp` | phone, session_data |
| Twitter/X | `twitter` | api_key, api_secret, access_token, access_secret |
| LinkedIn | `linkedin` | email, password |

### Payment (4 services)

| Service | ID | Champs requis |
|---------|----|--------------|
| PayPal | `paypal` | client_id, client_secret |
| Stripe | `stripe` | api_key, secret_key |
| Alipay | `alipay` | app_id, private_key |
| WeChat Pay | `wechatpay` | mch_id, api_key |

### Custom

| Service | ID | Champs requis |
|---------|----|--------------|
| Custom | `custom` | service_name, url |

Pour un service custom, tous les champs (username, password, api_key, notes) sont optionnels.

## 🔒 Sécurité

### Chiffrement

- **Algorithme:** AES-256-GCM (Galois/Counter Mode)
- **Clé:** Dérivée du MASTER_PASSWORD via scrypt
- **IV:** Aléatoire pour chaque sauvegarde
- **Authentication:** Tag GCM pour intégrité

### Bonnes pratiques

1. **Master Password:**
   - Minimum 16 caractères
   - Mélange majuscules, minuscules, chiffres, symboles
   - Unique (ne pas réutiliser ailleurs)
   - Stocké UNIQUEMENT dans .env (jamais dans git)

2. **Fichier vault:**
   - `.credentials.vault` créé à la racine du projet
   - Ajouté au `.gitignore` automatiquement
   - Chiffré même au repos

3. **Messages Telegram:**
   - Messages avec credentials supprimés automatiquement
   - Affichage masqué des mots de passe (••••••)
   - Pas de logs des credentials

4. **Backup:**
   - Exporter avec mot de passe fort
   - Stocker dans lieu sécurisé (cloud chiffré, USB)
   - Tester la restauration régulièrement

## 🛠️ Architecture

```
src/core/credential-vault/
├── universal-credential-vault.js    # Core vault avec chiffrement
├── vault-telegram-handler.js        # Handler Telegram
└── README.md                         # Cette documentation

src/bot/
└── bot-with-vault.js                 # Bot avec vault intégré

.credentials.vault                    # Fichier chiffré (créé auto)
```

### Flux de données

```
Telegram User
    ↓
[/add_service outlook]
    ↓
VaultTelegramHandler
    ↓
[Shows instructions]
    ↓
User sends: /set_outlook
email: john@outlook.com
password: Pass123
    ↓
[Message auto-deleted]
    ↓
VaultTelegramHandler.handleSetCredentials()
    ↓
UniversalCredentialVault.setCredentials()
    ↓
[Encrypt with AES-256-GCM]
    ↓
.credentials.vault (encrypted file)
    ↓
[Confirmation sent to user]
```

## 📊 Tests

### Test manuel via Telegram

1. Démarrer le bot: `npm run start:vault`
2. Envoyer `/list_services` - doit lister 30+ services
3. Envoyer `/add_service outlook`
4. Suivre les instructions
5. Envoyer `/credentials` - doit montrer Outlook configuré
6. Envoyer `/remove_service outlook`
7. Envoyer `/credentials` - doit montrer 0 services

### Test programmatique

```javascript
// Test basique
const vault = new UniversalCredentialVault();
await vault.load();

// Test ajout
await vault.setCredentials('test_service', {
  username: 'test',
  password: 'test123'
});

// Test récupération
const creds = await vault.getCredentials('test_service');
assert(creds.username === 'test');

// Test suppression
await vault.deleteCredentials('test_service');
const hasService = await vault.hasCredentials('test_service');
assert(hasService === false);

console.log('✅ Tests passés');
```

## 🐛 Troubleshooting

### Erreur: "MASTER_PASSWORD manquant"

**Solution:** Ajouter `MASTER_PASSWORD=...` dans `.env`

### Erreur: "Format vault invalide"

**Cause:** Fichier `.credentials.vault` corrompu ou mauvais master password

**Solution:**
1. Sauvegarder l'ancien fichier: `mv .credentials.vault .credentials.vault.bak`
2. Le vault créera un nouveau fichier vide
3. Réimporter depuis backup si disponible

### Message credentials non supprimé

**Cause:** Bot n'a pas les permissions de supprimer messages

**Solution:** Donner permission "Delete messages" au bot dans les settings du groupe Telegram

### Service non reconnu

**Cause:** ID de service incorrect

**Solution:** Utiliser `/list_services` pour voir les IDs exacts (sensible à la casse)

## 🚀 Cas d'Usage

### 1. Assistant Personnel Multi-Services

```javascript
// Gmail pour emails
const gmailCreds = await vault.getCredentials('gmail');
// Utiliser pour EmailAgent

// Google Calendar pour agenda
const calendarCreds = await vault.getCredentials('google');
// Utiliser pour CalendarAgent

// Notion pour notes
const notionCreds = await vault.getCredentials('notion');
// Utiliser pour NotionAgent
```

### 2. Commerce Bot (Chine-France)

```javascript
// Xianyu scraping
const xianyuCreds = await vault.getCredentials('xianyu');
// Login et scrape

// Vinted comparison
const vintedCreds = await vault.getCredentials('vinted');
// Compare prices

// PayPal pour paiements
const paypalCreds = await vault.getCredentials('paypal');
// Process payments
```

### 3. Social Media Manager

```javascript
// LinkedIn posting
const linkedinCreds = await vault.getCredentials('linkedin');

// Twitter posting
const twitterCreds = await vault.getCredentials('twitter');

// WeChat marketing
const wechatCreds = await vault.getCredentials('wechat');
```

## 📝 Changelog

### v1.0.0 (2025-11-17)

- ✅ Initial release
- ✅ Support 30+ services
- ✅ Chiffrement AES-256-GCM
- ✅ Intégration Telegram complète
- ✅ Backup/Restore chiffré
- ✅ Auto-suppression messages sensibles
- ✅ Templates pour tous les services populaires

## 📄 License

MIT

## 🤝 Support

Pour questions ou problèmes:
1. Vérifier ce README
2. Voir les exemples dans `/examples`
3. Tester avec `/list_services` et `/credentials`

---

**Made with 🔐 by LBCron**
