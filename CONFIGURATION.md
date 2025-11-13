# Configuration du Dépôt

## Rendre le dépôt privé

Pour rendre ce dépôt privé sur GitHub:

1. Allez sur la page GitHub du dépôt: https://github.com/LBCron/workflows
2. Cliquez sur **Settings** (Paramètres)
3. Descendez jusqu'à la section **Danger Zone**
4. Cliquez sur **Change repository visibility**
5. Sélectionnez **Make private**
6. Confirmez en tapant le nom du dépôt

## Configuration des Secrets GitHub

Pour utiliser des secrets dans vos workflows:

1. Allez dans **Settings > Secrets and variables > Actions**
2. Cliquez sur **New repository secret**
3. Ajoutez vos secrets (API keys, tokens, etc.)

Exemples de secrets utiles:
- `DEPLOY_TOKEN`: Token pour les déploiements
- `API_KEY`: Clé API pour services externes
- `SLACK_WEBHOOK`: URL webhook pour notifications Slack
- `DATABASE_URL`: URL de connexion base de données

## Utilisation des Workflows

### Workflow Planifié
- S'exécute automatiquement selon le planning défini
- Peut être lancé manuellement depuis Actions > Tâche Planifiée > Run workflow

### Workflow au Push
- S'exécute automatiquement à chaque push
- Valide le code avant merge

### Workflow de Déploiement
- Lancé manuellement uniquement
- Actions > Déploiement Manuel > Run workflow
- Choisir l'environnement (staging/production)

## Personnalisation

1. Modifiez les workflows dans `.github/workflows/`
2. Ajoutez vos scripts dans `scripts/`
3. Configurez les déclencheurs selon vos besoins
4. Ajoutez des secrets dans les paramètres GitHub

## Sécurité

- ✅ Ne jamais committer de secrets
- ✅ Utiliser les GitHub Secrets
- ✅ Garder le dépôt privé
- ✅ Limiter les accès aux collaborateurs nécessaires
