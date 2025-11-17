# AI Agent Swarm - Premium Edition 🚀

Version complète avec tous les systèmes premium intégrés.

## 🔥 Features Premium

### ✅ Systèmes Implémentés

1. **Credential Vault Ultimate** (`src/core/credential-vault-ultimate.js`)
   - Chiffrement AES-256-GCM
   - Support multi-services (Gmail, Outlook, Calendar, etc.)
   - Rotation automatique tokens OAuth
   - Import/Export sécurisé
   - Health checks

2. **Learning Engine V2** (`src/core/learning-engine-v2.js`)
   - Profilage utilisateur multi-dimensions
   - Détection patterns comportementaux
   - Analyse sentiment
   - Recommandations intelligentes
   - Timeline interaction

3. **iPhone Sync Ultimate** (`src/core/iphone-sync-ultimate.js`)
   - Export automatique multi-formats (JSON, HTML, Markdown)
   - Compression intelligente
   - Chiffrement bout-en-bout
   - Sync iCloud Drive (macOS)
   - Restauration facile

4. **Performance Monitoring** (`src/core/performance-monitoring.js`)
   - Cache multi-niveaux (L1/L2/L3)
   - Rate limiting adaptatif
   - Métriques temps réel
   - Alertes automatiques
   - Health checks

5. **UI Premium** (`src/ui/telegram-ui-premium.js`)
   - Boutons interactifs intelligents
   - Menus contextuels dynamiques
   - Progress bars temps réel
   - Rich media cards
   - Listes paginées

6. **Security Manager Enterprise** (`src/core/security-manager.js`)
   - Audit logs complets
   - Whitelist/Blacklist users & IPs
   - Intrusion detection
   - Auto-ban système
   - Security events monitoring

## 🤖 Bots

### Paul Bot (`src/bots/paul-bot.js`)
Bot principal pour les utilisateurs avec toutes les features premium.

**Features:**
- Intégration complète de tous les systèmes
- Conversation naturelle avec intent detection
- Profil utilisateur adaptatif
- Export iPhone automatique
- UI premium avec menus interactifs

**Commandes:**
```
/start - Démarrage
/menu - Menu principal
/credentials - Gérer credentials
/profile - Voir profil utilisateur
/export - Export iPhone
/stats - Statistiques
/help - Aide
```

### Manager Bot (`src/bots/manager-bot.js`)
Bot d'administration et monitoring.

**Features:**
- Dashboard temps réel
- Performance analytics
- Security monitoring
- User management
- Auto-reports horaires

**Commandes Admin:**
```
/dashboard - Vue d'ensemble
/performance - Métriques performance
/security - Status sécurité
/users - Analytics utilisateurs
/vault - Status credential vault
/health - Health check
/ban <userId> - Bannir user
/unban <userId> - Débannir user
/reset_metrics - Reset métriques
```

## 🚀 Installation

### 1. Prérequis

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### 2. Installation

```bash
cd n8n-agent-swarm
npm install
```

### 3. Configuration

Créer `.env` :

```env
# Bot Tokens
TELEGRAM_BOT_TOKEN=your_paul_bot_token
MANAGER_BOT_TOKEN=your_manager_bot_token

# Security
MASTER_PASSWORD=your_master_password_for_encryption
ADMIN_CHAT_IDS=123456789,987654321

# Optional - Services
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

## 🎯 Lancement

### Paul Bot uniquement
```bash
node src/index.js paul
# ou
npm run start:paul
```

### Manager Bot uniquement
```bash
node src/index.js manager
# ou
npm run start:manager
```

### Les deux bots
```bash
node src/index.js both
# ou
npm start
```

## 📦 Structure

```
n8n-agent-swarm/
├── src/
│   ├── bots/
│   │   ├── paul-bot.js          # Bot principal utilisateurs
│   │   └── manager-bot.js       # Bot admin/monitoring
│   │
│   ├── core/
│   │   ├── credential-vault-ultimate.js
│   │   ├── learning-engine-v2.js
│   │   ├── iphone-sync-ultimate.js
│   │   ├── performance-monitoring.js
│   │   └── security-manager.js
│   │
│   ├── ui/
│   │   └── telegram-ui-premium.js
│   │
│   ├── utils/
│   │   └── logger.js
│   │
│   └── index.js                 # Entry point principal
│
├── data/                        # Données persistantes
│   ├── vault/                   # Credentials chiffrés
│   ├── learning/                # Profils utilisateurs
│   └── exports/                 # Exports iPhone
│
├── logs/                        # Logs système
│   ├── security-audit.log
│   └── security-events.log
│
├── config/                      # Configuration
│   ├── whitelist.json
│   └── blacklist.json
│
└── package.json
```

## 🔐 Sécurité

### Encryption
- AES-256-GCM pour toutes les données sensibles
- Master password requis
- Tokens OAuth rotation automatique

### Access Control
- Whitelist/Blacklist IP & Users
- Rate limiting adaptatif
- Auto-ban après tentatives échouées
- Intrusion detection

### Audit
- Tous les événements loggés
- Security events tracés
- Audit trail complet

## 📊 Monitoring

### Performance
- Cache hit rate monitoring
- Response time tracking (avg, P95, P99)
- API cost tracking
- Memory & CPU usage

### Security
- Failed login attempts
- Threat detection
- Blacklist management
- Critical events alerting

### Health Checks
- System health monitoring
- Component status tracking
- Auto-reporting

## 🧠 Learning Engine

### Profiling
- Analyse comportementale multi-dimensions
- Patterns temporels (heures, jours préférés)
- Topics & intents favoris
- Complexité adaptative

### Insights
- Recommandations personnalisées
- Suggestions automatiques
- Prédictions comportementales

## 📱 iPhone Sync

### Export Formats
- **JSON**: Format complet technique
- **HTML**: Format élégant lisible
- **Markdown**: Format notes-friendly

### Features
- Compression automatique (gzip)
- Chiffrement bout-en-bout
- Sync iCloud Drive (macOS)
- Restauration simple

## 🎨 UI Premium

### Menus Interactifs
- Boutons contextuels intelligents
- Navigation fluide
- Actions rapides

### Progress Tracking
- Progress bars temps réel
- Status updates live
- Completion notifications

### Rich Content
- Cards enrichies
- Listes paginées
- Media support

## 🔧 Maintenance

### Logs
```bash
# Security audit
tail -f logs/security-audit.log

# Security events
tail -f logs/security-events.log
```

### Backup
```bash
# Backup vault
cp -r data/vault data/vault.backup

# Backup learning profiles
cp -r data/learning data/learning.backup
```

### Reset
```bash
# Reset metrics (via Manager Bot)
/reset_metrics

# Clear cache
# Redémarrer le bot
```

## 📈 Roadmap

- [ ] 2FA support complet
- [ ] Webhook mode (alternative à polling)
- [ ] Multi-language support
- [ ] Voice messages support
- [ ] Image analysis
- [ ] Advanced analytics dashboard web

## 🤝 Support

Pour toute question ou problème:
- GitHub Issues
- Documentation complète en ligne
- Community Discord

## 📄 License

MIT License

---

**Premium Edition** by AI Agent Swarm Team
Version 4.0.0 - 2025
