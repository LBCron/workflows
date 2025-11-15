#!/usr/bin/env node

/**
 * Code Assistant - Simple avec GPT-4 Mini
 *
 * GPT-4 Mini est EXCELLENT pour le code!
 *
 * Actions:
 * - generate: Génère du code complet
 * - debug: Trouve et corrige les bugs
 * - optimize: Améliore les performances
 * - review: Code review complet
 * - test: Génère des tests unitaires
 * - document: Ajoute documentation complète
 * - explain: Explique le code ligne par ligne
 */

const router = require('../simple-router');

class CodeAssistant {
  constructor() {
    this.stats = {
      assists: 0,
      totalCost: 0,
      cacheHits: 0,
      byAction: {}
    };

    this.actions = [
      'generate',
      'debug',
      'optimize',
      'review',
      'test',
      'document',
      'explain'
    ];

    this.languages = [
      'javascript',
      'typescript',
      'python',
      'java',
      'go',
      'rust',
      'php',
      'ruby',
      'c',
      'cpp',
      'csharp',
      'swift',
      'kotlin'
    ];
  }

  async assist(action, params) {
    this.stats.assists++;
    if (!this.stats.byAction[action]) {
      this.stats.byAction[action] = 0;
    }
    this.stats.byAction[action]++;

    console.log(`\n💻 CODE ASSISTANT`);
    console.log(`Action: ${action}`);
    console.log(`Language: ${params.language || 'javascript'}`);

    const startTime = Date.now();

    try {
      // Build prompt
      const prompt = this.buildPrompt(action, params);

      // Get code
      const result = await router.route(prompt, {
        systemPrompt: 'Tu es un expert en programmation, spécialisé dans l\'écriture de code propre, performant et bien documenté. Tu suis les meilleures pratiques de chaque langage.',
        temperature: 0.3, // Plus déterministe pour le code
        maxTokens: this.getMaxTokensByAction(action),
        type: 'code',
        cacheTTL: 24 * 60 * 60 * 1000 // 24h - patterns de code stables
      });

      if (result.cached) this.stats.cacheHits++;
      this.stats.totalCost += result.cost || 0;

      // Extract code blocks
      const extracted = this.extractCode(result.content, params.language);

      const duration = Date.now() - startTime;

      return {
        action,
        language: params.language || 'javascript',
        code: extracted.code,
        explanation: extracted.explanation,
        fullResponse: result.content,
        cost: result.cost || 0,
        cached: result.cached,
        duration
      };

    } catch (error) {
      console.error('❌ Code assist error:', error.message);
      throw error;
    }
  }

  buildPrompt(action, params) {
    const prompts = {
      generate: this.buildGeneratePrompt(params),
      debug: this.buildDebugPrompt(params),
      optimize: this.buildOptimizePrompt(params),
      review: this.buildReviewPrompt(params),
      test: this.buildTestPrompt(params),
      document: this.buildDocumentPrompt(params),
      explain: this.buildExplainPrompt(params)
    };

    return prompts[action] || prompts.generate;
  }

  buildGeneratePrompt(params) {
    const lang = params.language || 'javascript';

    return `
Génère du code ${lang} professionnel pour: ${params.description}

Exigences:
1. **Code complet et fonctionnel**
   - Gestion des erreurs appropriée
   - Edge cases couverts
   - Validation des inputs
2. **Bonnes pratiques ${lang}**
   - Conventions de nommage
   - Structure claire
   - Performance optimale
3. **Documentation**
   - Commentaires sur la logique complexe
   - JSDoc/Docstrings pour fonctions publiques
4. **Exemple d'utilisation**
   - Cas d'usage concret
   - Résultat attendu

${params.framework ? `Framework: ${params.framework}` : ''}
${params.constraints ? `Contraintes: ${params.constraints}` : ''}

Fournis le code complet, prêt à l'emploi.
    `.trim();
  }

  buildDebugPrompt(params) {
    const lang = params.language || 'javascript';

    return `
Debug ce code ${lang}:

\`\`\`${lang}
${params.code}
\`\`\`

${params.error ? `Erreur rencontrée:\n${params.error}\n` : ''}

Analyse et fournis:
1. **Identification du problème**
   - Cause racine
   - Ligne(s) problématique(s)
2. **Explication claire**
   - Pourquoi ça ne fonctionne pas
   - Impact du bug
3. **Code corrigé**
   - Solution complète
   - Commentaires sur les changements
4. **Prévention**
   - Comment éviter ce problème à l'avenir
   - Tests suggérés
    `.trim();
  }

  buildOptimizePrompt(params) {
    const lang = params.language || 'javascript';

    return `
Optimise ce code ${lang}:

\`\`\`${lang}
${params.code}
\`\`\`

Analyse et fournis:
1. **Analyse de performance**
   - Complexité actuelle (Big O)
   - Goulots d'étranglement identifiés
2. **Optimisations suggérées**
   - Par ordre de priorité
   - Gain estimé pour chaque optimisation
3. **Code optimisé**
   - Version améliorée complète
   - Commentaires sur les changements
4. **Comparaison**
   - Avant vs Après
   - Métriques de performance
   - Trade-offs éventuels

Focus: ${params.focus || 'performance globale'}
    `.trim();
  }

  buildReviewPrompt(params) {
    const lang = params.language || 'javascript';

    return `
Code review professionnel de ce ${lang}:

\`\`\`${lang}
${params.code}
\`\`\`

Évalue selon ces critères:

1. **Qualité globale** (/10)
   - Lisibilité
   - Maintenabilité
   - Extensibilité

2. **Bonnes pratiques ${lang}**
   - ✅ Respect des conventions
   - ❌ Violations identifiées
   - Suggestions d'amélioration

3. **Sécurité**
   - Vulnérabilités potentielles
   - Validation des inputs
   - Gestion des erreurs

4. **Performance**
   - Complexité algorithmique
   - Optimisations possibles

5. **Architecture**
   - Séparation des responsabilités
   - Couplage/Cohésion
   - Patterns utilisés

6. **Top 5 améliorations prioritaires**
   - Par ordre d'importance
   - Impact estimé

7. **Points positifs**
   - Ce qui est bien fait
   - Bonnes pratiques appliquées
    `.trim();
  }

  buildTestPrompt(params) {
    const lang = params.language || 'javascript';
    const framework = params.testFramework || this.getDefaultTestFramework(lang);

    return `
Génère des tests unitaires complets pour ce code:

\`\`\`${lang}
${params.code}
\`\`\`

Framework de test: ${framework}

Exigences:
1. **Couverture complète**
   - Cas normaux (happy path)
   - Edge cases
   - Cas d'erreur
   - Cas limites

2. **Structure des tests**
   - Organisation claire (describe/it ou équivalent)
   - Noms descriptifs
   - Setup/Teardown si nécessaire

3. **Assertions robustes**
   - Vérifications complètes
   - Messages d'erreur clairs

4. **Mocks/Stubs si nécessaire**
   - Dépendances externes
   - I/O operations

Objectif: 100% de couverture de code
    `.trim();
  }

  buildDocumentPrompt(params) {
    const lang = params.language || 'javascript';

    return `
Documente complètement ce code ${lang}:

\`\`\`${lang}
${params.code}
\`\`\`

Génère:
1. **Documentation inline**
   - JSDoc/Docstrings pour toutes les fonctions/classes
   - Commentaires pour logique complexe
   - Exemples d'usage

2. **README.md**
   - Description claire
   - Installation/Setup
   - Usage avec exemples
   - API reference
   - Contributing guidelines

3. **Exemples concrets**
   - Cas d'usage réels
   - Code snippets prêts à l'emploi
   - Résultats attendus

4. **Notes techniques**
   - Choix d'architecture
   - Dépendances
   - Performance considerations
    `.trim();
  }

  buildExplainPrompt(params) {
    const lang = params.language || 'javascript';

    return `
Explique ce code ${lang} en détail:

\`\`\`${lang}
${params.code}
\`\`\`

Fournis:
1. **Vue d'ensemble**
   - Objectif global du code
   - Contexte et cas d'usage

2. **Explication ligne par ligne**
   - Découpe logique en sections
   - Explication de chaque partie
   - Concepts utilisés

3. **Concepts clés**
   - Patterns/Algorithmes employés
   - Structures de données
   - Techniques spécifiques au langage

4. **Diagrammes si pertinent**
   - Flow chart (texte)
   - Data flow
   - Architecture

Niveau: ${params.level || 'intermédiaire'}
Public: ${params.audience || 'développeurs'}
    `.trim();
  }

  getMaxTokensByAction(action) {
    const tokens = {
      generate: 2000,
      debug: 1500,
      optimize: 2000,
      review: 2500,
      test: 2000,
      document: 3000,
      explain: 2000
    };
    return tokens[action] || 1500;
  }

  getDefaultTestFramework(language) {
    const frameworks = {
      javascript: 'Jest',
      typescript: 'Jest',
      python: 'pytest',
      java: 'JUnit 5',
      go: 'testing package',
      rust: 'built-in test framework',
      php: 'PHPUnit',
      ruby: 'RSpec',
      csharp: 'NUnit'
    };
    return frameworks[language] || 'framework de test standard';
  }

  extractCode(content, language) {
    const result = {
      code: [],
      explanation: content
    };

    // Extract code blocks
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      result.code.push(match[1].trim());
    }

    // If no code blocks found, try to find code-like patterns
    if (result.code.length === 0) {
      // Look for function definitions, classes, etc.
      const lines = content.split('\n');
      const codeLikeLines = [];

      for (const line of lines) {
        if (
          line.match(/^(function|class|def|public|private|const|let|var|import|export)/i) ||
          line.match(/^\s+(if|for|while|return|console\.|print\()/i)
        ) {
          codeLikeLines.push(line);
        }
      }

      if (codeLikeLines.length > 0) {
        result.code.push(codeLikeLines.join('\n'));
      }
    }

    // If still nothing, return the whole content as code
    if (result.code.length === 0) {
      result.code.push(content);
    }

    return result;
  }

  getStats() {
    return {
      assists: this.stats.assists,
      totalCost: this.stats.totalCost,
      totalCostFormatted: '€' + this.stats.totalCost.toFixed(6),
      cacheHits: this.stats.cacheHits,
      cacheRate: this.stats.assists > 0
        ? ((this.stats.cacheHits / this.stats.assists) * 100).toFixed(1) + '%'
        : '0%',
      byAction: this.stats.byAction
    };
  }
}

// Singleton
const codeAssistant = new CodeAssistant();

module.exports = codeAssistant;

// CLI test
if (require.main === module) {
  (async () => {
    const action = process.argv[2] || 'generate';
    const description = process.argv[3] || 'fonction qui calcule la suite de Fibonacci de manière récursive avec memoization';

    console.log('🧪 Testing Code Assistant...\n');

    try {
      const result = await codeAssistant.assist(action, {
        language: 'javascript',
        description
      });

      console.log('\n' + '═'.repeat(60));
      console.log('💻 CODE GÉNÉRÉ');
      console.log('═'.repeat(60));

      if (result.code && result.code.length > 0) {
        console.log('\n```javascript');
        console.log(result.code[0]);
        console.log('```\n');
      }

      if (result.explanation && result.explanation !== result.code[0]) {
        console.log('📝 Explication:');
        console.log(result.explanation);
      }

      console.log('\n' + '═'.repeat(60));
      console.log(`💰 Coût: €${result.cost.toFixed(6)}`);
      console.log(`   Cached: ${result.cached}`);
      console.log(`   Duration: ${result.duration}ms`);

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  })();
}
