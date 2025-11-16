#!/usr/bin/env node

/**
 * Environment Validator - Vérifie la configuration au démarrage
 *
 * Valide que toutes les variables d'environnement requises sont présentes
 * et testées lorsque possible.
 */

require('dotenv').config();

async function validate() {
  console.log('\n🔍 VALIDATION CONFIGURATION\n');

  let errors = 0;
  let warnings = 0;

  // ===== TELEGRAM (REQUIS) =====
  console.log('📱 TELEGRAM');
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('   ❌ TELEGRAM_BOT_TOKEN manquant');
    console.log('      → Obtiens-le via @BotFather sur Telegram');
    errors++;
  } else {
    console.log('   ✅ Telegram Bot Token configuré');
    console.log(`      → ${process.env.TELEGRAM_BOT_TOKEN.substring(0, 20)}...`);
  }

  // ===== OPENAI (REQUIS) =====
  console.log('\n🤖 OPENAI');
  if (!process.env.OPENAI_API_KEY) {
    console.log('   ❌ OPENAI_API_KEY manquant');
    console.log('      → Obtiens-le sur https://platform.openai.com/api-keys');
    errors++;
  } else {
    console.log('   ✅ OpenAI API Key configuré');
    console.log(`      → ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);

    // Tester la clé
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Clé OpenAI valide (${data.data.length} modèles disponibles)`);
      } else {
        console.log('   ❌ Clé OpenAI invalide (code:', response.status, ')');
        errors++;
      }
    } catch (err) {
      console.log('   ⚠️  Impossible de tester la clé OpenAI');
      console.log(`      → ${err.message}`);
      warnings++;
    }
  }

  // ===== ANTHROPIC (OPTIONNEL) =====
  console.log('\n🧠 ANTHROPIC (OPTIONNEL)');
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('   ✅ Anthropic API Key configuré');
    console.log(`      → ${process.env.ANTHROPIC_API_KEY.substring(0, 20)}...`);
    console.log('      → Modèles: Claude Opus, Sonnet, Haiku');
  } else {
    console.log('   ⚠️  Anthropic API Key non configuré');
    console.log('      → Optionnel mais recommandé pour Claude');
    console.log('      → https://console.anthropic.com/');
    warnings++;
  }

  // ===== GROQ (OPTIONNEL - GRATUIT) =====
  console.log('\n⚡ GROQ (OPTIONNEL - GRATUIT)');
  if (process.env.GROQ_API_KEY) {
    console.log('   ✅ Groq API Key configuré');
    console.log(`      → ${process.env.GROQ_API_KEY.substring(0, 20)}...`);
    console.log('      → Modèles: Llama 3 70B (GRATUIT!)');
  } else {
    console.log('   ⚠️  Groq API Key non configuré');
    console.log('      → GRATUIT et ultra-rapide!');
    console.log('      → https://console.groq.com/');
    warnings++;
  }

  // ===== GOOGLE (OPTIONNEL) =====
  console.log('\n🔍 GOOGLE (OPTIONNEL)');
  if (process.env.GOOGLE_API_KEY) {
    console.log('   ✅ Google API Key configuré');
    console.log(`      → ${process.env.GOOGLE_API_KEY.substring(0, 20)}...`);
    console.log('      → Modèles: Gemini Pro, Gemini Flash');
  } else {
    console.log('   ⚠️  Google API Key non configuré');
    console.log('      → Optionnel pour Gemini');
    console.log('      → https://makersuite.google.com/app/apikey');
    warnings++;
  }

  // ===== BUDGET =====
  console.log('\n💰 BUDGET');
  const budget = parseFloat(process.env.MONTHLY_BUDGET_EUR || '20');
  console.log(`   ✅ Budget mensuel: €${budget}`);

  if (budget < 5) {
    console.log('   ⚠️  Budget très bas (< €5)');
    console.log('      → Recommandé: €10-20 pour usage normal');
    warnings++;
  } else if (budget > 100) {
    console.log('   ⚠️  Budget élevé (> €100)');
    console.log('      → Budget Guardian te protégera');
  }

  // ===== LOGGING =====
  console.log('\n📊 LOGGING');
  const logLevel = process.env.LOG_LEVEL || 'info';
  console.log(`   ✅ Log Level: ${logLevel}`);

  if (logLevel === 'debug') {
    console.log('      → Mode debug actif (logs verbeux)');
  }

  // ===== CACHE =====
  console.log('\n💾 CACHE');
  const cacheTTL = parseInt(process.env.CACHE_TTL || '3600');
  console.log(`   ✅ Cache TTL: ${cacheTTL}s (${Math.round(cacheTTL/60)}min)`);

  // ===== FUTURE AGENTS =====
  console.log('\n🔜 AGENTS FUTURS (EMAIL/CALENDAR)');

  if (process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) {
    console.log('   ✅ Config Gmail/Calendar détectée');
  } else {
    console.log('   ℹ️  Pas de config Gmail/Calendar');
    console.log('      → Normal, ces agents seront ajoutés plus tard');
  }

  // ===== RÉSUMÉ =====
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ\n');
  console.log(`   ✅ Variables OK: ${getOkCount()}`);
  console.log(`   ❌ Erreurs: ${errors}`);
  console.log(`   ⚠️  Avertissements: ${warnings}`);

  if (errors > 0) {
    console.log('\n❌ Configuration invalide !');
    console.log('   Corrige les erreurs ci-dessus avant de démarrer.\n');
    console.log('💡 Aide:');
    console.log('   1. Copie .env.example vers .env');
    console.log('   2. Remplis les variables REQUISES (TELEGRAM_BOT_TOKEN, OPENAI_API_KEY)');
    console.log('   3. Relance: npm run validate\n');
    process.exit(1);
  }

  if (warnings > 0) {
    console.log('\n⚠️  Configuration OK mais incomplète');
    console.log('   Configure les clés optionnelles pour plus de fonctionnalités:\n');

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('   - ANTHROPIC_API_KEY → Claude (Opus, Sonnet, Haiku)');
    }
    if (!process.env.GROQ_API_KEY) {
      console.log('   - GROQ_API_KEY → Llama 3 70B (GRATUIT!)');
    }
    if (!process.env.GOOGLE_API_KEY) {
      console.log('   - GOOGLE_API_KEY → Gemini Pro/Flash');
    }

    console.log('\n   Le système fonctionnera avec les clés configurées.');
  } else {
    console.log('\n✅ Configuration parfaite !');
    console.log('   Toutes les clés API sont configurées.');
  }

  console.log('\n🚀 Pour démarrer le bot:');
  console.log('   npm start\n');
  console.log('📊 Pour voir les stats:');
  console.log('   npm run optimize\n');
}

function getOkCount() {
  let count = 0;
  if (process.env.TELEGRAM_BOT_TOKEN) count++;
  if (process.env.OPENAI_API_KEY) count++;
  if (process.env.ANTHROPIC_API_KEY) count++;
  if (process.env.GROQ_API_KEY) count++;
  if (process.env.GOOGLE_API_KEY) count++;
  return count;
}

// Exécuter si appelé directement
if (require.main === module) {
  validate().catch((error) => {
    console.error('\n❌ Erreur validation:', error.message);
    process.exit(1);
  });
}

module.exports = { validate };
