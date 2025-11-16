# 📱 Guide Mémoire iPhone - Bot Workflow

## 🎯 Vue d'ensemble

Ton bot Workflow a maintenant une **mémoire sophistiquée accessible depuis iPhone** !

Toutes tes conversations sont automatiquement sauvegardées et synchronisées avec ton iPhone via Telegram.

---

## ✨ Fonctionnalités

### ✅ Ce qui est sauvegardé automatiquement:

- 💬 **Toutes tes conversations** avec l'assistant
- 🧠 **Long-term memory** - Ce que l'AI apprend sur toi
  - Ton nom, localisation, profession
  - Tes intérêts et préférences
  - Tes habitudes et patterns
- ⚙️ **Tes préférences** de communication
- 📊 **Métadonnées** - Modèles utilisés, coûts, performance
- 🕐 **Historique complet** avec timestamps

### 📱 Compatible iPhone:

- ✅ Export automatique quotidien vers Telegram
- ✅ Sauvegarde dans Files app
- ✅ Sync automatique avec iCloud Drive
- ✅ Restauration en 1 clic
- ✅ Accessible hors-ligne

---

## 🚀 Guide d'Utilisation

### 📤 Export vers iPhone

**Méthode 1: Export manuel**

1. Envoie `/memory_export` au bot
2. Le bot crée un export compressé (`.json.gz`)
3. Télécharge le fichier dans Telegram
4. Le fichier apparaît automatiquement dans **Files app**

**Localisation iPhone:**
```
Files → Telegram → Downloads → Workflow_export_[date].json.gz
```

**Méthode 2: Auto-backup quotidien**

Le bot t'envoie automatiquement un backup chaque jour à **3h du matin**.

- 📬 Notification: Silencieuse (pas de réveil !)
- 📂 Où: Messages Telegram du bot
- 💾 Format: Fichier `.json.gz` compressé
- 📏 Taille: ~1-5 MB (selon historique)

---

### 📥 Import depuis iPhone

**Scénario: Nouveau téléphone ou restauration**

1. Ouvre **Files app** sur iPhone
2. Va dans **Telegram → Downloads**
3. Trouve ton export le plus récent
4. **Partage** le fichier avec Telegram
5. **Envoie-le** au bot
6. ✅ Le bot restaure automatiquement !

**Alternative: Depuis iCloud Drive**

Si tu as sauvegardé dans iCloud:

1. Files app → **iCloud Drive** → Dossier "Bot Backups"
2. Sélectionne l'export
3. Partage avec Telegram
4. Envoie au bot
5. ✅ Restauration auto !

---

## 📊 Commandes Disponibles

### 📈 Informations

#### `/memory_stats`
Voir les statistiques complètes de ta mémoire

**Affiche:**
- 📁 Taille base de données
- 💬 Nombre conversations
- 🧠 Facts appris
- ⚡ Performance

**Exemple:**
```
/memory_stats

🧠 Statistiques Mémoire

📁 Base de données
• Taille: 2.5 MB

💬 Conversations
• Tes conversations: 247

🧠 Long-term Memory
• Ce que je sais de toi: 12 facts

⚡ Performance
• Lectures: 1,523
• Écritures: 247
```

#### `/memory_knowledge`
Voir ce que l'AI a appris sur toi

**Affiche:**
- 👤 Infos personnelles apprises
- 🎯 Intérêts détectés
- ⚙️ Préférences identifiées
- 📊 Niveau de confiance

**Exemple:**
```
/memory_knowledge

🧠 Ce que je sais de toi:

**PROFILE:**
• name: Marc (85% confiance)
• location: Paris (70% confiance)
• job: développeur (90% confiance)

**INTERESTS:**
• topics: IA, coding, tech (95% confiance)
```

#### `/memory_search [mot-clé]`
Rechercher dans ton historique

**Exemples:**
```
/memory_search projet
/memory_search réunion
/memory_search code
```

---

### 📱 Export/Import

#### `/memory_export`
Exporter toutes tes données vers iPhone

**Processus:**
1. Commande → Création export
2. Bot envoie fichier compressé
3. Auto-sauvegarde dans Files app
4. Optionnel: Copier vers iCloud

**Format:** `.json.gz` (compressé -70%)

#### `/memory_import`
Afficher les instructions d'import

**Renvoie:**
- 📱 Guide étape par étape
- 💡 Tips iPhone
- ⚠️ Avertissements

---

### 💾 Backup

#### `/memory_backup`
Créer un backup manuel immédiat

**Utilise quand:**
- Avant changement important
- Avant réinitialisation
- Backup de sécurité

**Sauvegarde:**
- 💾 Local + Serveur
- 🔒 Encrypté AES-256
- 📦 Compressé GZIP

---

### ⚙️ Contrôle

#### `/memory_forget`
Désactiver temporairement le contexte

**Utilise quand:**
- Nouveau sujet sans contexte passé
- Conversation "fraîche"
- Test sans mémoire

**Note:** Tes données ne sont **PAS effacées**, juste non utilisées temporairement.

#### `/memory_remember`
Réactiver le contexte

Réactive l'utilisation du contexte conversationnel.

#### `/memory_clear` ⚠️
**DANGER:** Effacer TOUTES tes données

**Requiert confirmation:** `/memory_clear_confirm`

**Efface:**
- Historique conversations
- Long-term memory
- Préférences

**⚠️ IRRÉVERSIBLE !**

---

### ❓ Aide

#### `/memory_help`
Afficher l'aide des commandes mémoire

Liste complète des 11 commandes disponibles.

---

## 🔒 Sécurité & Confidentialité

### 🔐 Encryption

**AES-256-GCM** pour tous les exports

- 🔑 Clé unique par utilisateur
- 🛡️ Données chiffrées au repos
- ✅ Standard militaire

### 📦 Compression

**GZIP automatique**

- Économie **70-80%** d'espace
- Plus rapide à télécharger
- Moins de stockage nécessaire

### 🔄 Sync

**Backup serveur automatique**

- ☁️ Sync toutes les heures
- 🔄 Bidirectionnel
- 💾 Double sécurité (iPhone + Serveur)

**Emplacement serveur:**
- Local: `data/memory/Workflow/memory.db`
- Backup: `data/backups/Workflow/`
- Exports: `data/exports/Workflow/`

---

## 💡 Tips iPhone

### 📂 Sauvegarder dans iCloud

**Méthode recommandée pour sync multi-appareils:**

1. Télécharge l'export
2. **Files app** → **iCloud Drive**
3. Crée dossier "**Bot Backups**"
4. Copie le fichier dedans

✅ **Résultat:** Sync automatique sur tous tes appareils Apple !

### ⚡ Shortcuts iOS

Crée des raccourcis pour automatiser:

**Raccourci 1: Export hebdomadaire**
```
1. Ouvre Shortcuts
2. Nouvelle automatisation
3. Heure: Chaque dimanche 20h
4. Action: Envoyer message → Bot → "/memory_export"
```

**Raccourci 2: Backup avant voyage**
```
1. Shortcut "Pré-voyage"
2. Envoyer "/memory_export" au bot
3. Attendre fichier
4. Copier vers iCloud Drive
5. Notification "Backup OK"
```

**Raccourci 3: Alerte si backup > 7 jours**
```
1. Automatisation quotidienne
2. Vérifier date dernier fichier
3. Si > 7 jours → Notification
4. "Temps de faire un backup !"
```

### 🗂️ Organisation Files

**Structure recommandée:**

```
iCloud Drive/
└── Documents/
    └── Bot Backups/
        ├── 2024/
        │   ├── 11-Novembre/
        │   │   ├── Workflow_export_2024-11-01.json.gz
        │   │   ├── Workflow_export_2024-11-15.json.gz
        │   │   └── Workflow_export_2024-11-30.json.gz
        │   └── 12-Décembre/
        └── Archive/
            └── 2023/
```

### 📤 Share Sheet

Ajoute le bot à tes favoris Share:

1. Ouvre Telegram
2. Conversation bot
3. Appui long sur nom
4. "Ajouter aux favoris"

→ Partage direct depuis Files app !

---

## 📈 Espace Nécessaire

### iPhone Storage

| Historique | Taille Export | Compressé |
|------------|---------------|-----------|
| 100 conversations | ~500 KB | ~150 KB |
| 500 conversations | ~1.5 MB | ~450 KB |
| 1000 conversations | ~2.5 MB | ~750 KB |
| 5000 conversations | ~10 MB | ~3 MB |

**Compression moyenne:** -70%

### iCloud Drive

**Backups automatiques quotidiens:**
- Rotation 30 jours
- ~30 fichiers max
- **Espace total:** ~60-100 MB/an

**Tip:** Active "Optimize Storage" dans iCloud

---

## 🆘 Dépannage

### ❌ Export trop gros pour Telegram

**Limite Telegram:** 50 MB

**Si dépassée:**

1. Envoie `/memory_backup`
2. Backup serveur créé
3. Le bot te donne un lien alternatif
4. Télécharge via navigateur

**Ou:**

1. Utilise `/memory_export` avec filtre
2. Export partiel (derniers 6 mois)

### 🔧 Fichier corrompu

**Symptôme:** Import échoue, erreur "fichier invalide"

**Solution:**

1. Redemande export: `/memory_export`
2. Ou restaure depuis serveur: `/memory_backup` puis télécharge backup

**Prévention:**
- Garde toujours 2-3 backups
- Vérifie l'intégrité après download

### ⚠️ Import échoue

**Vérifications:**

✅ **Bon fichier ?**
- Format: `.json.gz`
- Nom contient: `Workflow_export`
- Taille > 0 bytes

✅ **Bon utilisateur ?**
- Le fichier est à TOI (user ID match)
- Pas un export de quelqu'un d'autre

✅ **Fichier pas corrompu ?**
- Téléchargement complet
- Pas modifié manuellement

**Si problème persiste:**

1. Essaie avec un autre export
2. Contacte le bot: `/help`
3. Check les logs serveur

### 🕐 Auto-backup pas reçu

**Causes possibles:**

1. **Bot offline** - Vérifie status: `/start`
2. **Inactif** - Dernier message > 7 jours
3. **Telegram bloqué** - Notifications désactivées
4. **Erreur réseau** - Retry automatique à 4h

**Solution:**

1. Envoie un message au bot (réactiver)
2. Attends 3h00 lendemain
3. Ou demande manuel: `/memory_export`

### 📱 Fichier pas dans Files app

**Localisation normale:**
```
Files → Sur mon iPhone → Telegram → Downloads
```

**Si absent:**

1. Vérifie **iCloud Drive** → Telegram
2. Check **Récents** dans Files
3. Ouvre Telegram → Conversation → Fichier → "Partager" → "Sauvegarder"

---

## 🎯 Cas d'Usage

### 📱 Nouveau iPhone

**Scénario:** Tu changes d'iPhone

1. **Avant changement:**
   - `/memory_export`
   - Sauvegarde dans iCloud Drive

2. **Sur nouveau iPhone:**
   - Installe Telegram
   - Télécharge bot
   - Va dans iCloud Drive
   - Envoie export au bot
   - ✅ Mémoire restaurée !

### 🔄 Sync Multi-Devices

**Scénario:** iPhone + iPad

1. Export depuis iPhone
2. Sauvegarde iCloud Drive
3. Sur iPad:
   - Ouvre Files → iCloud
   - Partage avec Telegram
   - Envoie au bot
   - ✅ Même mémoire partout !

### 💾 Backup avant Reset

**Scénario:** Reset iPhone

1. `/memory_export` ×2 (sécurité)
2. Sauvegarde iCloud + AirDrop vers Mac
3. Reset iPhone
4. Réinstalle tout
5. Import depuis iCloud
6. ✅ Mémoire intacte !

### 🔍 Recherche Historique

**Scénario:** "C'était quoi cette info de la semaine dernière ?"

1. `/memory_search [mot-clé]`
2. Browse résultats
3. Retrouve l'info
4. ✅ Trouvé !

### 🧠 Check Knowledge

**Scénario:** "Qu'est-ce que l'AI sait de moi ?"

1. `/memory_knowledge`
2. Review facts
3. Si erreur → Discussion pour corriger
4. ✅ AI apprend !

---

## 📚 Bonnes Pratiques

### ✅ DO

- 💾 **Export hebdomadaire** dans iCloud
- 🔄 **Auto-backup activé** (par défaut)
- 📂 **Organisation** des fichiers
- 🔍 **Vérification** après import
- 🗓️ **Rotation** backups (garder 3 derniers mois)

### ❌ DON'T

- ⚠️ **Ne modifie pas** les exports manuellement
- ⚠️ **Ne partage pas** tes exports (données perso)
- ⚠️ **N'utilise pas** `/memory_clear` sans réfléchir
- ⚠️ **Ne garde pas** qu'une seule copie
- ⚠️ **Ne désactive pas** auto-backup sans raison

---

## 🔮 Fonctionnalités Futures

### En développement

- 📊 **Dashboard web** pour visualiser mémoire
- 🔔 **Notifications** proactives
- 📈 **Analytics** conversationnels
- 🤖 **Suggestions** basées sur historique
- 🌐 **Export formats** (CSV, PDF)

### Demandé par utilisateurs

- 📸 **Backup photos** conversations
- 🔗 **Links** extraction automatique
- 📝 **Notes** highlight importantes
- 🏷️ **Tags** personnalisés
- 🔍 **Search** avancé avec filtres

---

## 📞 Support

### Questions ?

1. `/memory_help` - Aide intégrée
2. `/help` - Aide générale bot
3. Documentation complète dans repo

### Problème ?

1. Check ce guide
2. Section Dépannage ci-dessus
3. Logs: `/memory_stats`

---

## 📊 Métriques Moyennes

**Utilisateur typique après 3 mois:**

```
💬 Conversations: ~500
🧠 Facts appris: ~15-20
💾 Taille export: ~2 MB
📦 Compressé: ~600 KB
⚡ Export time: ~3 secondes
📱 Stockage iPhone: ~20 MB (tous backups)
☁️ Stockage iCloud: ~60 MB (30 jours)
```

---

**Version:** 4.2
**Dernière mise à jour:** 2024-11-16
**Compatibilité:** iOS 14+, Files app requis

---

🎉 **Profite de ta mémoire infinie sur iPhone !**

💡 Pour toute question: `/memory_help`
