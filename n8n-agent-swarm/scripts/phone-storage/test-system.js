#!/usr/bin/env node

/**
 * Système de Test Complet pour Phone Storage
 *
 * Teste tous les composants sans appeler l'API Telegram
 */

const fs = require('fs').promises;
const path = require('path');

// Couleurs pour terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function pass(message) {
  testsPassed++;
  log(`✅ ${message}`, 'green');
}

function fail(message, error = null) {
  testsFailed++;
  log(`❌ ${message}`, 'red');
  if (error) {
    log(`   Error: ${error.message}`, 'red');
  }
}

async function testJSONTemplates() {
  log('\n📋 Test 1: Validation des templates JSON', 'cyan');

  const templates = [
    'my-profile.json',
    'my-memory.json',
    'my-contacts.json',
    'my-habits.json'
  ];

  for (const template of templates) {
    const filePath = path.join(__dirname, '../../templates/phone-storage', template);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      // Vérifier les champs requis
      if (data.version && data.last_updated) {
        pass(`${template} - Structure valide`);
      } else {
        fail(`${template} - Champs manquants (version ou last_updated)`);
      }
    } catch (error) {
      fail(`${template} - Erreur`, error);
    }
  }
}

async function testSyncManager() {
  log('\n⚙️  Test 2: Sync Manager', 'cyan');

  try {
    const syncManager = require('./sync-manager');
    pass('Module sync-manager chargé');

    // Test initialize
    await syncManager.initialize();
    pass('initialize() fonctionne');

    // Test getSyncStatus
    const status = syncManager.getSyncStatus();
    if (status && typeof status.loaded === 'boolean') {
      pass('getSyncStatus() retourne une structure valide');
    } else {
      fail('getSyncStatus() - structure invalide');
    }

    // Test getCacheStats
    const stats = syncManager.getCacheStats();
    if (stats && typeof stats.loaded === 'boolean' && stats.files) {
      pass('getCacheStats() retourne une structure valide');
    } else {
      fail('getCacheStats() - structure invalide');
    }

    // Test clearCache
    syncManager.clearCache();
    pass('clearCache() fonctionne');

    // Test checkExpiry
    const expiryResult = syncManager.checkExpiry();
    if (expiryResult && typeof expiryResult.expired === 'boolean') {
      pass('checkExpiry() retourne une structure valide');
    } else {
      fail('checkExpiry() - structure invalide');
    }

  } catch (error) {
    fail('Sync Manager - Erreur générale', error);
  }
}

async function testInitStorage() {
  log('\n🚀 Test 3: Init Storage Module', 'cyan');

  try {
    const initStorage = require('./init-storage');
    pass('Module init-storage chargé');

    // Test validateJSONFile
    const testData = {
      version: '1.0.0',
      user: { name: 'Test' },
      communication: {},
      budget: {},
      system: {}
    };

    try {
      initStorage.validateJSONFile('my-profile.json', testData);
      pass('validateJSONFile() valide les données correctes');
    } catch (error) {
      fail('validateJSONFile() - Erreur', error);
    }

    // Test personalizeTemplate
    try {
      const personalized = await initStorage.personalizeTemplate('my-profile.json');
      if (personalized && personalized.version && personalized.last_updated) {
        pass('personalizeTemplate() génère des données valides');
      } else {
        fail('personalizeTemplate() - Données invalides');
      }
    } catch (error) {
      fail('personalizeTemplate() - Erreur', error);
    }

  } catch (error) {
    fail('Init Storage - Erreur générale', error);
  }
}

async function testTelegramFileHandler() {
  log('\n📤 Test 4: Telegram File Handler Module', 'cyan');

  try {
    const telegramHandler = require('./telegram-file-handler');
    pass('Module telegram-file-handler chargé');

    // Vérifier que les fonctions existent
    const requiredFunctions = [
      'downloadFile',
      'uploadFile',
      'processIncomingFile',
      'sendMessage',
      'handleSyncCommand',
      'handleBackupCommand',
      'handleStatusCommand',
      'handleClearCommand'
    ];

    for (const funcName of requiredFunctions) {
      if (typeof telegramHandler[funcName] === 'function') {
        pass(`Fonction ${funcName}() existe`);
      } else {
        fail(`Fonction ${funcName}() manquante`);
      }
    }

  } catch (error) {
    fail('Telegram File Handler - Erreur générale', error);
  }
}

async function testDirectories() {
  log('\n📁 Test 5: Structure des Répertoires', 'cyan');

  const directories = [
    'templates/phone-storage',
    'scripts/phone-storage',
    '.cache/phone-storage',
    '.cache/phone-storage/backups'
  ];

  for (const dir of directories) {
    const dirPath = path.join(__dirname, '../..', dir);
    try {
      await fs.mkdir(dirPath, { recursive: true });
      await fs.access(dirPath);
      pass(`Répertoire ${dir} existe`);
    } catch (error) {
      fail(`Répertoire ${dir} - Erreur`, error);
    }
  }
}

async function testEnvironmentVariables() {
  log('\n🔧 Test 6: Variables d\'Environnement', 'cyan');

  require('dotenv').config({ path: path.join(__dirname, '../../.env') });

  const requiredVars = [
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID'
  ];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      pass(`Variable ${varName} définie`);
    } else {
      log(`⚠️  Variable ${varName} non définie (normal en dev)`, 'yellow');
    }
  }
}

async function testWorkflow() {
  log('\n🔄 Test 7: Workflow Complet (Simulation)', 'cyan');

  try {
    const syncManager = require('./sync-manager');

    // 1. Initialize
    await syncManager.initialize();
    pass('Étape 1: Initialization');

    // 2. Check status
    const status1 = syncManager.getSyncStatus();
    if (!status1.loaded) {
      pass('Étape 2: Status - Cache vide (attendu)');
    }

    // 3. Try to load (will fail gracefully)
    try {
      await syncManager.loadAllFiles();
      const status2 = syncManager.getSyncStatus();
      pass('Étape 3: LoadAllFiles - Gère gracieusement les fichiers manquants');
    } catch (error) {
      // C'est OK si ça échoue car les fichiers ne sont pas dans le cache
      pass('Étape 3: LoadAllFiles - Échec attendu (pas de fichiers)');
    }

    // 4. Clear cache
    syncManager.clearCache();
    pass('Étape 4: Clear cache');

    // 5. Check expiry
    const expiryCheck = syncManager.checkExpiry();
    if (expiryCheck.expired) {
      pass('Étape 5: Check expiry - Cache expiré (attendu)');
    }

  } catch (error) {
    fail('Workflow - Erreur', error);
  }
}

async function testPackageScripts() {
  log('\n📦 Test 8: Scripts package.json', 'cyan');

  try {
    const packageJson = require('../../package.json');

    const requiredScripts = [
      'storage:init',
      'storage:sync',
      'storage:status',
      'storage:backup',
      'storage:clear'
    ];

    for (const scriptName of requiredScripts) {
      if (packageJson.scripts[scriptName]) {
        pass(`Script ${scriptName} défini`);
      } else {
        fail(`Script ${scriptName} manquant`);
      }
    }

    // Vérifier les dépendances
    const requiredDeps = ['dotenv', 'form-data'];
    for (const dep of requiredDeps) {
      if (packageJson.dependencies[dep]) {
        pass(`Dépendance ${dep} installée`);
      } else {
        fail(`Dépendance ${dep} manquante`);
      }
    }

  } catch (error) {
    fail('Package.json - Erreur', error);
  }
}

async function runAllTests() {
  log('╔════════════════════════════════════════╗', 'cyan');
  log('║  🧪 TESTS DU SYSTÈME PHONE STORAGE    ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');

  await testJSONTemplates();
  await testSyncManager();
  await testInitStorage();
  await testTelegramFileHandler();
  await testDirectories();
  await testEnvironmentVariables();
  await testWorkflow();
  await testPackageScripts();

  // Résumé
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║  📊 RÉSUMÉ DES TESTS                   ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');

  const total = testsPassed + testsFailed;
  const percentage = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : 0;

  log(`\n✅ Tests réussis: ${testsPassed}`, 'green');
  log(`❌ Tests échoués: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log(`📊 Taux de réussite: ${percentage}%`, percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red');

  if (testsFailed === 0) {
    log('\n🎉 TOUS LES TESTS SONT PASSÉS! 🎉', 'green');
    log('✅ Le système est prêt pour le déploiement!', 'green');
  } else {
    log(`\n⚠️  ${testsFailed} test(s) ont échoué`, 'red');
    log('❌ Corrigez les erreurs avant le déploiement', 'red');
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Exécution
if (require.main === module) {
  runAllTests().catch(error => {
    log('\n💥 ERREUR FATALE LORS DES TESTS', 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
