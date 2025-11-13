# Workflows d'Automatisation

Ce dépôt privé contient des workflows pour automatiser diverses tâches.

## Structure

```
.
├── .github/workflows/    # Workflows GitHub Actions
├── scripts/             # Scripts d'automatisation
└── README.md           # Ce fichier
```

## Workflows Disponibles

### 1. Workflow de Test Automatique
- Exécute les tests à chaque push
- Vérifie la qualité du code

### 2. Workflow de Déploiement
- Déploie automatiquement sur les branches spécifiques
- Gère les environnements de staging et production

### 3. Workflow de Maintenance
- Exécution planifiée de tâches de maintenance
- Nettoyage automatique des ressources

## Utilisation

1. Les workflows sont déclenchés automatiquement selon leur configuration
2. Vous pouvez aussi les lancer manuellement depuis l'interface GitHub Actions
3. Les scripts personnalisés sont dans le dossier `scripts/`

## Configuration

Les secrets et variables d'environnement doivent être configurés dans :
`Settings > Secrets and variables > Actions`

## Sécurité

⚠️ Ce dépôt est privé. Ne jamais commit de secrets ou tokens dans le code.
Utilisez toujours les GitHub Secrets pour les informations sensibles.
