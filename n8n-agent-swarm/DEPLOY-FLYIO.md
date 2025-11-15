# 🚀 Deploy n8n Agent Swarm to Fly.io

Guide complet pour déployer votre système multi-agent n8n sur Fly.io avec HTTPS, PostgreSQL, et scaling automatique.

## 🎯 Pourquoi Fly.io ?

- ✅ **HTTPS automatique** avec certificat SSL gratuit
- ✅ **PostgreSQL managed** inclus
- ✅ **CDN global** avec faible latence
- ✅ **Auto-scaling** intelligent
- ✅ **€0/mois** pour commencer (avec crédits gratuits)
- ✅ **Deploy en 5 minutes**

---

## 📋 Prérequis

1. **Compte Fly.io** (gratuit)
   - Créer sur : https://fly.io/app/sign-up
   - Ajouter une carte bancaire (pas de charge si < $5/mois)

2. **Fly CLI installé**
   - Voir instructions ci-dessous

3. **Fichier .env configuré**
   - Avec toutes vos API keys

---

## 🔧 Installation Fly CLI

### Windows (PowerShell)

```powershell
# Télécharger et installer
iwr https://fly.io/install.ps1 -useb | iex

# Vérifier l'installation
fly version

# Se connecter
fly auth login
```

### macOS / Linux

```bash
# Installer
curl -L https://fly.io/install.sh | sh

# Vérifier
fly version

# Se connecter
fly auth login
```

---

## 🚀 Déploiement Rapide (Automatique)

### Option 1 : Script Tout-en-Un 🎯

```bash
# Déployer tout automatiquement
bash scripts/deploy-fly.sh
```

Ce script va :
1. ✅ Vérifier Fly CLI
2. ✅ Créer l'app Fly.io si nécessaire
3. ✅ Créer la base PostgreSQL
4. ✅ Créer le volume de stockage
5. ✅ Configurer tous les secrets depuis .env
6. ✅ Déployer l'application
7. ✅ Ouvrir l'URL finale

---

## 🛠️ Déploiement Manuel (Étape par Étape)

### Étape 1 : Créer l'application Fly.io

```bash
# Lancer depuis le dossier n8n-agent-swarm
cd n8n-agent-swarm

# Créer l'app (utilise fly.toml)
fly apps create n8n-agent-swarm --org personal
```

**Note :** Si le nom est déjà pris, utilisez : `n8n-agent-swarm-votrenom`

### Étape 2 : Créer la base de données PostgreSQL

```bash
# Créer un cluster PostgreSQL
fly postgres create --name n8n-postgres --region cdg --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 10

# Attacher la DB à l'app
fly postgres attach n8n-postgres --app n8n-agent-swarm
```

Fly.io va automatiquement créer la variable `DATABASE_URL`.

### Étape 3 : Créer le volume de stockage

```bash
# Volume pour les données n8n (workflows, credentials)
fly volumes create n8n_data --size 10 --region cdg --app n8n-agent-swarm
```

### Étape 4 : Configurer les secrets

**Option A : Script Automatique**

```bash
# Configure tous les secrets depuis .env
bash scripts/setup-fly-secrets.sh
```

**Option B : Manuel**

```bash
# Secrets essentiels
fly secrets set \
  N8N_BASIC_AUTH_USER=admin \
  N8N_BASIC_AUTH_PASSWORD=VotreMotDePasseSecurise123! \
  TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz \
  OPENROUTER_API_KEY=sk-or-votre_cle \
  OPENAI_API_KEY=sk-votre_cle_openai \
  --app n8n-agent-swarm

# Secrets Google (optionnel)
fly secrets set \
  GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com \
  GOOGLE_CLIENT_SECRET=votre_client_secret \
  GOOGLE_SHEET_ID=votre_sheet_id \
  YOUTUBE_API_KEY=votre_youtube_key \
  --app n8n-agent-swarm

# Secrets Web Search (optionnel)
fly secrets set \
  TAVILY_API_KEY=tvly-votre_cle \
  PERPLEXITY_API_KEY=pplx-votre_cle \
  OPENWEATHERMAP_API_KEY=votre_cle \
  --app n8n-agent-swarm
```

### Étape 5 : Déployer

```bash
# Premier déploiement
fly deploy

# Attendre que l'app démarre (2-3 minutes)
fly status

# Ouvrir dans le navigateur
fly open
```

### Étape 6 : Configurer le Webhook Telegram

Une fois déployé, récupérez votre URL :

```bash
# Votre URL sera du type : https://n8n-agent-swarm.fly.dev
fly info

# Mettre à jour le webhook Telegram
fly secrets set WEBHOOK_URL=https://n8n-agent-swarm.fly.dev --app n8n-agent-swarm
```

---

## 📥 Importer le Workflow

### Option 1 : Via l'interface n8n

1. Ouvrir : `https://n8n-agent-swarm.fly.dev`
2. Se connecter avec les credentials (N8N_BASIC_AUTH_USER / PASSWORD)
3. **Settings** → **Import from File**
4. Sélectionner : `n8n-workflows/main-workflow.json`
5. **Activate** le workflow

### Option 2 : Via API (automatique)

```bash
# Importer automatiquement via l'API
curl -X POST https://n8n-agent-swarm.fly.dev/api/v1/workflows \
  -u admin:VotreMotDePasse \
  -H "Content-Type: application/json" \
  -d @n8n-workflows/main-workflow.json
```

---

## 🔍 Monitoring & Logs

### Voir les logs en temps réel

```bash
# Logs en direct
fly logs

# Logs des 100 dernières lignes
fly logs --lines 100

# Filtrer par niveau
fly logs | grep ERROR
```

### Vérifier le statut

```bash
# Statut de l'app
fly status

# Métriques
fly dashboard metrics
```

### SSH dans le conteneur

```bash
# Se connecter au conteneur
fly ssh console

# Explorer les fichiers n8n
ls -la /home/node/.n8n
```

---

## 🔄 Mises à jour

### Mettre à jour n8n

```bash
# Redéployer avec la dernière version
fly deploy --image n8nio/n8n:latest

# Ou mettre à jour fly.toml et redéployer
fly deploy
```

### Mettre à jour les secrets

```bash
# Modifier un secret
fly secrets set OPENAI_API_KEY=nouvelle_cle

# Lister les secrets configurés
fly secrets list
```

---

## ⚙️ Configuration Avancée

### Scaling Automatique

Dans `fly.toml`, ajustez :

```toml
[scaling]
  min_count = 1  # Toujours au moins 1 instance
  max_count = 3  # Max 3 instances sous forte charge
```

Redéployer : `fly deploy`

### Augmenter la mémoire

```bash
# Passer à 2GB de RAM
fly scale memory 2048

# Vérifier
fly status
```

### Augmenter le volume

```bash
# Étendre le volume à 20GB
fly volumes extend n8n_data --size 20
```

### Ajouter une région supplémentaire

```bash
# Ajouter une instance à New York
fly scale regions add ewr

# Lister les régions actives
fly regions list
```

---

## 🐛 Troubleshooting

### Erreur : "App not found"

```bash
# Vérifier les apps existantes
fly apps list

# Créer l'app si elle n'existe pas
fly apps create n8n-agent-swarm
```

### Erreur : "Volume not found"

```bash
# Lister les volumes
fly volumes list

# Créer le volume
fly volumes create n8n_data --size 10 --region cdg
```

### Erreur : "Database connection failed"

```bash
# Vérifier la connexion PostgreSQL
fly postgres db list --app n8n-postgres

# Réattacher la DB
fly postgres attach n8n-postgres --app n8n-agent-swarm
```

### L'app ne démarre pas

```bash
# Voir les logs détaillés
fly logs

# Vérifier les health checks
fly checks list

# Redémarrer l'app
fly apps restart n8n-agent-swarm
```

### Secrets non pris en compte

```bash
# Lister les secrets
fly secrets list

# Redéployer après changement de secrets
fly deploy
```

### Webhook Telegram ne fonctionne pas

```bash
# Vérifier l'URL configurée
fly secrets list | grep WEBHOOK_URL

# Mettre à jour avec la bonne URL
fly secrets set WEBHOOK_URL=https://votre-app.fly.dev

# Tester le webhook
curl https://votre-app.fly.dev/webhook-test/telegram
```

---

## 💰 Coûts Estimés

### Plan Gratuit (Free Tier)

- **3 machines partagées** (shared-cpu-1x)
- **3GB de volumes persistants**
- **160GB de trafic sortant/mois**

**Coût : $0/mois** tant que vous restez sous ces limites.

### Configuration Recommandée

- **1 machine** : shared-cpu-1x (1GB RAM) → **~$1.94/mois**
- **PostgreSQL** : shared-cpu-1x (10GB) → **~$0/mois** (inclus)
- **Volume** : 10GB → **$0.15/GB/mois** = **$1.50/mois**
- **Trafic** : Sous 160GB → **$0/mois**

**Total : ~$3.50/mois**

### Optimiser les coûts

```bash
# Auto-stop quand pas utilisé (économise ~50%)
fly.toml : auto_stop_machines = true

# Utiliser 1 seule région
fly.toml : primary_region = "cdg"

# Limiter les logs (réduire stockage)
fly.toml : EXECUTIONS_DATA_MAX_AGE = "48"  # 2 jours au lieu de 7
```

---

## 🔐 Sécurité

### Activer l'authentification

```bash
# Basic Auth (déjà configuré)
fly secrets set N8N_BASIC_AUTH_ACTIVE=true
```

### Utiliser des secrets pour TOUT

```bash
# ❌ Jamais dans fly.toml
OPENAI_API_KEY = "sk-..."

# ✅ Toujours via secrets
fly secrets set OPENAI_API_KEY=sk-...
```

### Rotations des secrets

```bash
# Changer régulièrement les mots de passe
fly secrets set N8N_BASIC_AUTH_PASSWORD=NouveauMotDePasse123!

# Changer les API keys compromises
fly secrets set TELEGRAM_BOT_TOKEN=nouveau_token
```

### Limiter l'accès SSH

```bash
# Voir qui a accès
fly orgs members

# Révoquer un accès
fly orgs remove-member email@example.com
```

---

## 📊 Backup & Restore

### Backup automatique

```bash
# Créer un snapshot du volume
fly volumes snapshot n8n_data

# Lister les snapshots
fly volumes snapshots list
```

### Backup manuel

```bash
# Exporter toutes les données
fly ssh console
cd /home/node/.n8n
tar -czf backup.tar.gz *
exit

# Copier localement
fly ssh sftp get /home/node/.n8n/backup.tar.gz
```

### Restore depuis un backup

```bash
# Copier le backup
fly ssh sftp put backup.tar.gz /tmp/

# Restaurer
fly ssh console
cd /home/node/.n8n
tar -xzf /tmp/backup.tar.gz
exit

# Redémarrer
fly apps restart n8n-agent-swarm
```

---

## 🎯 Commandes Rapides

```bash
# Déployer
fly deploy

# Logs
fly logs

# Status
fly status

# Ouvrir l'app
fly open

# Redémarrer
fly apps restart n8n-agent-swarm

# SSH
fly ssh console

# Scaling
fly scale count 2
fly scale memory 2048

# Secrets
fly secrets set KEY=VALUE
fly secrets list

# Monitoring
fly dashboard metrics
```

---

## 📚 Ressources

- **Documentation Fly.io** : https://fly.io/docs/
- **n8n Documentation** : https://docs.n8n.io/
- **Fly.io Status** : https://status.fly.io/
- **Community Forum** : https://community.fly.io/
- **Pricing Calculator** : https://fly.io/docs/about/pricing/

---

## ✅ Checklist de Déploiement

- [ ] Compte Fly.io créé et carte ajoutée
- [ ] Fly CLI installé et authentifié (`fly auth login`)
- [ ] Fichier .env configuré avec toutes les API keys
- [ ] App créée (`fly apps create`)
- [ ] PostgreSQL créé et attaché
- [ ] Volume créé (`fly volumes create`)
- [ ] Secrets configurés (`bash scripts/setup-fly-secrets.sh`)
- [ ] Premier déploiement (`fly deploy`)
- [ ] Workflow importé dans n8n
- [ ] Webhook Telegram configuré avec l'URL Fly.io
- [ ] Test du bot via Telegram
- [ ] Monitoring configuré

---

**Déploiement complet en 5 minutes avec :** `bash scripts/deploy-fly.sh` 🚀

**Questions ?** Ouvre une issue sur GitHub !
