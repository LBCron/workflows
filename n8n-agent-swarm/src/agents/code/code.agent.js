#!/usr/bin/env node

/**
 * Code Assistant Agent PRO
 *
 * Assistant code intelligent avec coûts optimisés
 */

const router = require('../../core/router/router');

class CodeAssistantPro {
  constructor() {
    this.actions = {
      generate: 'Générer du code',
      debug: 'Debugger du code',
      optimize: 'Optimiser du code',
      review: 'Code review',
      test: 'Générer tests',
      document: 'Documenter code',
      explain: 'Expliquer code'
    };
  }

  async assist(request) {
    const { action, code, language, description, error } = request;

    console.log(`💻 ${this.actions[action]}: ${language || 'auto'}`);

    // Build prompt
    const prompt = this.buildPrompt(action, { code, language, description, error });

    // Determine priority
    const priority = action === 'debug' ? 'high' : 'normal';

    // Route
    const result = await router.route(prompt, {
      type: 'code',
      priority,
      maxTokens: 4000
    });

    // Parse response
    const parsed = this.parseCodeResponse(result.content);

    return {
      action,
      language,
      result: parsed,
      model: result.model,
      cost: result.cost,
      cached: result.cached
    };
  }

  buildPrompt(action, params) {
    const prompts = {
      generate: `
Génère du code ${params.language || 'JavaScript'} pour:

${params.description}

Exigences:
- Code propre et bien commenté
- Gestion des erreurs
- Exemple d'utilisation

Code:
`,

      debug: `
Debug ce code ${params.language || 'JavaScript'}:

\`\`\`${params.language || 'javascript'}
${params.code}
\`\`\`

${params.error ? `Erreur: ${params.error}` : ''}

Fournis:
1. Cause racine du problème
2. Explication claire
3. Code corrigé
4. Comment éviter à l'avenir
`,

      optimize: `
Optimise ce code ${params.language || 'JavaScript'}:

\`\`\`${params.language || 'javascript'}
${params.code}
\`\`\`

Fournis:
1. Analyse performance actuelle
2. Améliorations suggérées (top 3)
3. Code optimisé
4. Gain de performance estimé
`,

      review: `
Code review de ce ${params.language || 'JavaScript'}:

\`\`\`${params.language || 'javascript'}
${params.code}
\`\`\`

Évalue:
1. Qualité globale (/10)
2. Points forts
3. Points à améliorer (top 3)
4. Problèmes de sécurité potentiels
5. Suggestions d'amélioration
`,

      test: `
Génère tests unitaires pour ce code:

\`\`\`${params.language || 'javascript'}
${params.code}
\`\`\`

Framework: ${params.testFramework || 'Jest/Mocha'}
Couverture: Complète (edge cases inclus)
`,

      document: `
Documente ce code:

\`\`\`${params.language || 'javascript'}
${params.code}
\`\`\`

Génère:
1. Docstrings/JSDoc complets
2. README d'usage
3. Exemples pratiques
`,

      explain: `
Explique ce code en détail:

\`\`\`${params.language || 'javascript'}
${params.code}
\`\`\`

Explique:
1. Ce que fait le code (overview)
2. Comment ça fonctionne (ligne par ligne si complexe)
3. Cas d'usage
4. Dépendances
`
    };

    return prompts[action] || prompts.generate;
  }

  parseCodeResponse(response) {
    // Extract code blocks
    const codeBlocks = response.match(/```[\s\S]*?```/g) || [];
    const extracted = codeBlocks.map(block =>
      block.replace(/```\w*\n?/, '').replace(/```$/, '').trim()
    );

    return {
      full: response,
      code: extracted[0] || null,
      additionalCode: extracted.slice(1),
      explanation: response.replace(/```[\s\S]*?```/g, '').trim()
    };
  }
}

module.exports = new CodeAssistantPro();

// CLI
if (require.main === module) {
  const action = process.argv[2] || 'generate';
  const description = process.argv[3] || 'function to reverse a string';

  (async () => {
    const agent = new CodeAssistantPro();
    const result = await agent.assist({
      action,
      language: 'javascript',
      description
    });

    console.log('\n💻 RÉSULTAT:');
    console.log('='.repeat(60));
    if (result.result.code) {
      console.log('CODE:');
      console.log(result.result.code);
      console.log('\nEXPLICATION:');
    }
    console.log(result.result.explanation);
    console.log('='.repeat(60));
    console.log(`\n💰 Coût: €${result.cost} | Modèle: ${result.model}`);
  })();
}
