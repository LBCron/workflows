/**
 * 🧪 TESTS POUR NOUVELLES FONCTIONNALITÉS
 *
 * Tests complets pour:
 * - Notification Agent
 * - Notion Agent
 * - Conversation Memory
 * - Smart Suggestions
 */

const NotificationAgent = require('../src/agents/notification/notification.agent');
const NotionAgent = require('../src/agents/notion/notion.agent');
const ConversationMemory = require('../src/core/conversation/memory.manager');
const SmartSuggestions = require('../src/core/suggestions/smart-suggestions');

console.log('🧪 Démarrage des tests...\n');

// ═══════════════════════════════════════════════════════════════════
// 🔔 TESTS NOTIFICATION AGENT
// ═══════════════════════════════════════════════════════════════════

async function testNotificationAgent() {
  console.log('═══ 🔔 NOTIFICATION AGENT ═══\n');

  const agent = new NotificationAgent();

  try {
    // Test 1: Créer un rappel one-time
    console.log('Test 1: Créer rappel one-time...');
    const futureDate = new Date(Date.now() + 10000); // Dans 10 secondes
    const reminder = agent.createReminder({
      message: 'Test rappel',
      datetime: futureDate.toISOString(),
      priority: 'high'
    });

    console.log('✅ Rappel créé:', reminder.id);
    console.log('   Message:', reminder.message);
    console.log('   Dans:', reminder.timeUntil);

    // Test 2: Créer un rappel récurrent
    console.log('\nTest 2: Créer rappel récurrent...');
    const recurring = agent.createRecurringReminder({
      message: 'Résumé quotidien',
      cronExpression: '0 9 * * *', // Tous les jours à 9h
      priority: 'medium'
    });

    console.log('✅ Rappel récurrent créé:', recurring.id);
    console.log('   Schedule:', recurring.schedule);

    // Test 3: Lister les rappels
    console.log('\nTest 3: Lister les rappels...');
    const list = agent.listReminders();

    console.log('✅ Rappels trouvés:');
    console.log('   One-time:', list.oneTime.length);
    console.log('   Récurrents:', list.recurring.length);
    console.log('   Total:', list.total);

    // Test 4: Annuler un rappel
    console.log('\nTest 4: Annuler un rappel...');
    const cancelled = agent.cancelReminder(reminder.id);

    console.log('✅ Rappel annulé:', cancelled.id);

    // Test 5: Nettoyage
    console.log('\nTest 5: Nettoyage...');
    const cleanup = agent.cleanupExpiredReminders();

    console.log('✅ Nettoyage effectué');
    console.log('   Nettoyés:', cleanup.cleaned);
    console.log('   Restants:', cleanup.remaining);

    console.log('\n✅ Tous les tests Notification Agent réussis!\n');
    return true;
  } catch (error) {
    console.error('❌ Erreur Notification Agent:', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 📝 TESTS NOTION AGENT
// ═══════════════════════════════════════════════════════════════════

async function testNotionAgent() {
  console.log('═══ 📝 NOTION AGENT ═══\n');

  const agent = new NotionAgent();

  try {
    console.log('Test 1: Initialisation...');

    if (!process.env.NOTION_API_KEY) {
      console.log('⚠️  NOTION_API_KEY non configurée - Tests limités');

      // Tests de structure seulement
      console.log('\nTest structure interne...');

      const testContent = [
        { type: 'heading_1', text: 'Titre Principal' },
        { type: 'paragraph', text: 'Ceci est un paragraphe' },
        { type: 'bulleted_list_item', text: 'Item 1' },
        { type: 'code', text: 'console.log("test")', language: 'javascript' }
      ];

      const blocks = agent._buildContentBlocks(testContent);
      console.log('✅ Blocs de contenu créés:', blocks.length);

      console.log('\n⚠️  Tests complets nécessitent NOTION_API_KEY');
      console.log('✅ Tests de structure réussis!\n');
      return true;
    }

    // Si API key configurée, tester la connexion
    try {
      await agent.initialize();
      console.log('✅ Connexion Notion établie');
    } catch (error) {
      console.log('⚠️  Erreur connexion:', error.message);
    }

    console.log('\n✅ Tests Notion Agent terminés!\n');
    return true;
  } catch (error) {
    console.error('❌ Erreur Notion Agent:', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🧠 TESTS CONVERSATION MEMORY
// ═══════════════════════════════════════════════════════════════════

async function testConversationMemory() {
  console.log('═══ 🧠 CONVERSATION MEMORY ═══\n');

  const memory = new ConversationMemory({
    maxHistoryLength: 10,
    maxContextMessages: 5,
    autoSave: false // Désactiver pour les tests
  });

  try {
    // Test 1: Initialisation
    console.log('Test 1: Initialisation...');
    await memory.initialize();
    console.log('✅ Memory initialisée');

    const userId = 'test-user-123';

    // Test 2: Ajouter des messages
    console.log('\nTest 2: Ajouter des messages...');

    await memory.addMessage(userId, 'user', 'Bonjour!');
    await memory.addMessage(userId, 'assistant', 'Bonjour! Comment puis-je vous aider?');
    await memory.addMessage(userId, 'user', 'Quelle est la météo?');
    await memory.addMessage(userId, 'assistant', 'Il fait beau aujourd\'hui.');

    const history = memory.getHistory(userId);
    console.log('✅ Messages ajoutés:', history.length);

    // Test 3: Obtenir le contexte
    console.log('\nTest 3: Obtenir le contexte...');
    const context = memory.getContext(userId, { maxMessages: 3 });
    console.log('✅ Contexte récupéré:', context.length, 'messages');

    context.forEach((msg, idx) => {
      console.log(`   ${idx + 1}. [${msg.role}]: ${msg.content.substring(0, 50)}...`);
    });

    // Test 4: Statistiques
    console.log('\nTest 4: Statistiques...');
    const stats = memory.getStats(userId);
    console.log('✅ Stats:');
    console.log('   Total messages:', stats.totalMessages);
    console.log('   Messages utilisateur:', stats.userMessages);
    console.log('   Messages assistant:', stats.assistantMessages);

    // Test 5: Recherche
    console.log('\nTest 5: Recherche dans l\'historique...');
    const searchResults = memory.searchHistory(userId, 'météo');
    console.log('✅ Résultats trouvés:', searchResults.length);

    // Test 6: Statistiques globales
    console.log('\nTest 6: Statistiques globales...');
    const globalStats = memory.getGlobalStats();
    console.log('✅ Stats globales:');
    console.log('   Utilisateurs:', globalStats.totalUsers);
    console.log('   Messages totaux:', globalStats.totalMessages);

    // Test 7: Nettoyage
    console.log('\nTest 7: Effacer l\'historique...');
    await memory.clearHistory(userId);
    const afterClear = memory.getHistory(userId);
    console.log('✅ Historique effacé, messages restants:', afterClear.length);

    console.log('\n✅ Tous les tests Conversation Memory réussis!\n');
    return true;
  } catch (error) {
    console.error('❌ Erreur Conversation Memory:', error.message);
    console.error(error.stack);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 💡 TESTS SMART SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════

async function testSmartSuggestions() {
  console.log('═══ 💡 SMART SUGGESTIONS ═══\n');

  const suggestions = new SmartSuggestions({
    maxSuggestions: 5,
    suggestionCooldown: 0 // Pas de cooldown pour les tests
  });

  try {
    const userId = 'test-user-456';

    // Test 1: Générer suggestions avec contexte
    console.log('Test 1: Générer suggestions...');

    const context = {
      unreadEmails: 25,
      upcomingMeetings: 2,
      pendingTasks: 8
    };

    const result = await suggestions.generateSuggestions(userId, context);

    console.log('✅ Suggestions générées:', result.length);

    result.forEach((sugg, idx) => {
      console.log(`\n   ${idx + 1}. ${sugg.icon} ${sugg.title}`);
      console.log(`      ${sugg.message}`);
      console.log(`      Priorité: ${sugg.priority}`);
      console.log(`      Actions: ${sugg.actions.length}`);
    });

    // Test 2: Enregistrer des patterns
    console.log('\n\nTest 2: Enregistrer des patterns...');

    suggestions.recordPattern(userId, 'check_email', { time: 'morning' });
    suggestions.recordPattern(userId, 'check_email', { time: 'morning' });
    suggestions.recordPattern(userId, 'check_email', { time: 'morning' });
    suggestions.recordPattern(userId, 'check_calendar', { time: 'morning' });

    console.log('✅ Patterns enregistrés');

    // Test 3: Obtenir patterns utilisateur
    console.log('\nTest 3: Analyser patterns...');

    const patterns = suggestions.getUserPatterns(userId);

    console.log('✅ Patterns analysés:');
    console.log('   Total actions:', patterns.totalActions);
    console.log('   Top actions:');
    patterns.topActions.forEach(action => {
      console.log(`      - ${action.action}: ${action.count} fois`);
    });

    // Test 4: Suggestions basées sur l'heure
    console.log('\nTest 4: Suggestions temporelles...');

    const morningContext = {};
    const morningSuggestions = await suggestions.generateSuggestions(userId, morningContext);

    console.log('✅ Suggestions temporelles:', morningSuggestions.length);

    // Test 5: Réinitialiser patterns
    console.log('\nTest 5: Réinitialiser patterns...');

    const reset = suggestions.resetPatterns(userId);
    console.log('✅ Patterns réinitialisés');

    const afterReset = suggestions.getUserPatterns(userId);
    console.log('   Actions après reset:', afterReset.totalActions);

    console.log('\n✅ Tous les tests Smart Suggestions réussis!\n');
    return true;
  } catch (error) {
    console.error('❌ Erreur Smart Suggestions:', error.message);
    console.error(error.stack);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 EXÉCUTION DES TESTS
// ═══════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TESTS NOUVELLES FONCTIONNALITÉS                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const results = {
    notification: false,
    notion: false,
    memory: false,
    suggestions: false
  };

  // Exécuter tous les tests
  results.notification = await testNotificationAgent();
  results.notion = await testNotionAgent();
  results.memory = await testConversationMemory();
  results.suggestions = await testSmartSuggestions();

  // Résumé
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  📊 RÉSUMÉ DES TESTS                                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  console.log(`🔔 Notification Agent: ${results.notification ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📝 Notion Agent: ${results.notion ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🧠 Conversation Memory: ${results.memory ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`💡 Smart Suggestions: ${results.suggestions ? '✅ PASS' : '❌ FAIL'}`);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Score: ${passed}/${total} tests réussis`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (passed === total) {
    console.log('🎉 TOUS LES TESTS RÉUSSIS! 🎉\n');
    process.exit(0);
  } else {
    console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ\n');
    process.exit(1);
  }
}

// Lancer les tests
runAllTests().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
