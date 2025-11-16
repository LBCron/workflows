/**
 * 🎯 EXEMPLE D'INTÉGRATION COMPLÈTE
 *
 * Démontre comment utiliser les nouvelles fonctionnalités ensemble
 */

require('dotenv').config();

const NotificationAgent = require('../src/agents/notification/notification.agent');
const NotionAgent = require('../src/agents/notion/notion.agent');
const ConversationMemory = require('../src/core/conversation/memory.manager');
const SmartSuggestions = require('../src/core/suggestions/smart-suggestions');

// Simuler le router (en production, utiliser le vrai router)
const mockRouter = {
  async route({ prompt, type, temperature }) {
    return {
      content: `Mock AI response for: ${prompt.substring(0, 50)}...`
    };
  }
};

async function main() {
  console.log('🚀 Exemple d\'intégration des nouvelles fonctionnalités\n');

  // ═══════════════════════════════════════════════════════════════════
  // 1. INITIALISATION
  // ═══════════════════════════════════════════════════════════════════

  console.log('═══ 1. INITIALISATION ═══\n');

  const notification = new NotificationAgent();
  const notion = new NotionAgent();
  const memory = new ConversationMemory({ autoSave: false });
  const suggestions = new SmartSuggestions();

  // Injecter le router AI
  notification.setAIRouter(mockRouter);
  notion.setAIRouter(mockRouter);
  memory.setAIRouter(mockRouter);
  suggestions.setAIRouter(mockRouter);

  // Lier memory et suggestions
  suggestions.setConversationMemory(memory);

  // Initialiser la mémoire
  await memory.initialize();

  console.log('✅ Tous les composants initialisés\n');

  // ═══════════════════════════════════════════════════════════════════
  // 2. SCÉNARIO: NOUVELLE CONVERSATION
  // ═══════════════════════════════════════════════════════════════════

  console.log('═══ 2. SCÉNARIO: NOUVELLE CONVERSATION ═══\n');

  const userId = 'demo-user-123';

  // L'utilisateur envoie un message
  console.log('User: Bonjour! Je m\'appelle Alice et je travaille sur un projet important.');

  await memory.addMessage(
    userId,
    'user',
    'Bonjour! Je m\'appelle Alice et je travaille sur un projet important.'
  );

  // Le bot répond
  const botResponse = 'Bonjour Alice! Ravi de vous rencontrer. Comment puis-je vous aider avec votre projet ?';

  await memory.addMessage(userId, 'assistant', botResponse);

  console.log('Bot:', botResponse);

  // Vérifier le contexte
  const context = memory.getContext(userId);
  console.log('\n📝 Contexte stocké:', context.length, 'messages');

  // Vérifier les entités extraites
  const stats = memory.getStats(userId);
  console.log('🔍 Stats:', stats);

  console.log();

  // ═══════════════════════════════════════════════════════════════════
  // 3. SCÉNARIO: CRÉER UNE TO-DO LIST DANS NOTION
  // ═══════════════════════════════════════════════════════════════════

  console.log('═══ 3. SCÉNARIO: TO-DO LIST NOTION ═══\n');

  console.log('User: Peux-tu créer une to-do list pour mon projet ?');

  await memory.addMessage(
    userId,
    'user',
    'Peux-tu créer une to-do list pour mon projet ?'
  );

  if (process.env.NOTION_API_KEY) {
    // Si configuré, créer vraiment la to-do list
    console.log('✅ Création de la to-do list dans Notion...');

    try {
      await notion.initialize();

      // Note: Nécessite un parent ID valide
      // const todoList = await notion.createTodoList({
      //   parentId: 'YOUR_PARENT_PAGE_ID',
      //   title: 'Projet Alice',
      //   tasks: [
      //     { name: 'Phase 1', priority: 'High', status: 'Not Started' },
      //     { name: 'Phase 2', priority: 'Medium', status: 'Not Started' }
      //   ]
      // });
      //
      // console.log('✅ To-do list créée:', todoList.url);

      console.log('ℹ️  To-do list créée (configurez un parent ID valide)');
    } catch (error) {
      console.log('⚠️  Erreur Notion:', error.message);
    }
  } else {
    console.log('⚠️  NOTION_API_KEY non configurée - Simulation seulement');
    console.log('✅ To-do list simulée créée');
  }

  await memory.addMessage(
    userId,
    'assistant',
    'J\'ai créé une to-do list pour votre projet dans Notion!'
  );

  console.log();

  // ═══════════════════════════════════════════════════════════════════
  // 4. SCÉNARIO: CRÉER DES RAPPELS
  // ═══════════════════════════════════════════════════════════════════

  console.log('═══ 4. SCÉNARIO: CRÉER DES RAPPELS ═══\n');

  console.log('User: Rappelle-moi demain à 14h de vérifier l\'avancement');

  // Créer un rappel pour demain 14h
  const tomorrow2pm = new Date();
  tomorrow2pm.setDate(tomorrow2pm.getDate() + 1);
  tomorrow2pm.setHours(14, 0, 0, 0);

  const reminder = notification.createReminder({
    message: 'Vérifier l\'avancement du projet',
    datetime: tomorrow2pm.toISOString(),
    priority: 'high'
  });

  console.log('✅ Rappel créé pour:', reminder.scheduled);
  console.log('   Message:', reminder.message);

  // Créer aussi un rappel récurrent hebdomadaire
  const weeklyReview = notification.createRecurringReminder({
    message: 'Review hebdomadaire du projet',
    cronExpression: '0 10 * * 1', // Lundi 10h
    priority: 'medium'
  });

  console.log('✅ Rappel hebdomadaire créé');
  console.log('   Schedule:', weeklyReview.schedule);

  await memory.addMessage(
    userId,
    'assistant',
    `J'ai créé 2 rappels : un pour demain à 14h, et un récurrent tous les lundis à 10h.`
  );

  console.log();

  // ═══════════════════════════════════════════════════════════════════
  // 5. SCÉNARIO: SMART SUGGESTIONS
  // ═══════════════════════════════════════════════════════════════════

  console.log('═══ 5. SCÉNARIO: SMART SUGGESTIONS ═══\n');

  // Simuler un contexte utilisateur
  const userContext = {
    unreadEmails: 15,
    upcomingMeetings: 1,
    pendingTasks: 5
  };

  const smartSuggestions = await suggestions.generateSuggestions(userId, userContext);

  console.log('💡 Suggestions générées:', smartSuggestions.length);

  smartSuggestions.forEach((sugg, idx) => {
    console.log(`\n   ${idx + 1}. ${sugg.icon} ${sugg.title}`);
    console.log(`      ${sugg.message}`);
    console.log(`      Priorité: ${sugg.priority}`);
    if (sugg.actions.length > 0) {
      console.log(`      Actions:`);
      sugg.actions.forEach(action => {
        console.log(`         - ${action.label}`);
      });
    }
  });

  console.log();

  // Enregistrer l'interaction
  suggestions.recordPattern(userId, 'create_todo', { context: 'project_management' });

  // ═══════════════════════════════════════════════════════════════════
  // 6. SCÉNARIO: STATISTIQUES ET RÉSUMÉ
  // ═══════════════════════════════════════════════════════════════════

  console.log('═══ 6. STATISTIQUES FINALES ═══\n');

  // Stats conversation
  const finalStats = memory.getStats(userId);
  console.log('📊 Conversation:');
  console.log('   Total messages:', finalStats.totalMessages);
  console.log('   Entités extraites:', finalStats.entities);

  // Stats rappels
  const remindersList = notification.listReminders();
  console.log('\n🔔 Rappels:');
  console.log('   One-time:', remindersList.oneTime.length);
  console.log('   Récurrents:', remindersList.recurring.length);

  // Patterns utilisateur
  const userPatterns = suggestions.getUserPatterns(userId);
  console.log('\n🔄 Patterns d\'utilisation:');
  console.log('   Actions totales:', userPatterns.totalActions);
  if (userPatterns.topActions.length > 0) {
    console.log('   Top actions:');
    userPatterns.topActions.forEach(action => {
      console.log(`      - ${action.action}: ${action.count} fois`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7. NETTOYAGE
  // ═══════════════════════════════════════════════════════════════════

  console.log('\n═══ 7. NETTOYAGE ═══\n');

  // Nettoyer les rappels démo
  notification.cleanupExpiredReminders();

  // Effacer l'historique démo
  await memory.clearHistory(userId);

  console.log('✅ Nettoyage terminé\n');

  // ═══════════════════════════════════════════════════════════════════
  // RÉSUMÉ
  // ═══════════════════════════════════════════════════════════════════

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ EXEMPLE D\'INTÉGRATION TERMINÉ                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('📝 Fonctionnalités démontrées:');
  console.log('   ✅ Conversation Memory - Contexte intelligent');
  console.log('   ✅ Notification Agent - Rappels programmés');
  console.log('   ✅ Notion Agent - To-do lists (simulé)');
  console.log('   ✅ Smart Suggestions - Recommandations');
  console.log('   ✅ Patterns d\'utilisation - Analytics');
  console.log();

  console.log('🎯 Prochaines étapes:');
  console.log('   1. Intégrer avec le bot Telegram');
  console.log('   2. Configurer NOTION_API_KEY si besoin');
  console.log('   3. Personnaliser les suggestions');
  console.log('   4. Ajouter vos propres patterns');
  console.log();
}

// Exécuter l'exemple
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
