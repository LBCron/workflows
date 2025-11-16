#!/usr/bin/env node

/**
 * Meta-Agent - Créateur automatique d'agents
 *
 * Cet agent peut créer de nouveaux agents à la demande!
 * Il génère le code, teste l'agent, et l'enregistre dans le système.
 *
 * Exemple: "Crée-moi un agent Instagram"
 * → Génère automatiquement instagram-agent.js avec toutes les fonctionnalités
 */

const router = require('../ai-core/intelligent-router-pro');
const budgetGuardian = require('../monitoring/budget-guardian');
const fs = require('fs').promises;
const path = require('path');

class MetaAgent {
  constructor() {
    this.agentsPath = path.join(__dirname);
    this.configPath = path.join(__dirname, '../config');
    this.templatePath = path.join(__dirname, '../templates/agent-template.js');

    this.capabilities = [
      'create',     // Créer nouvel agent
      'list',       // Lister agents existants
      'analyze',    // Analyser besoin utilisateur
      'generate',   // Générer code
      'test',       // Tester agent
      'register'    // Enregistrer dans système
    ];
  }

  /**
   * Point d'entrée principal
   */
  async createAgent(description, options = {}) {
    console.log(`\n🤖 Meta-Agent: Création d'un nouvel agent`);
    console.log(`📝 Description: "${description}"`);

    try {
      // 1. Analyser la demande
      console.log('\n1️⃣ Analyse de la demande...');
      const analysis = await this.analyzeRequest(description);
      console.log(`✅ Agent: ${analysis.name}`);
      console.log(`✅ ${analysis.capabilities.length} capacités identifiées`);

      // 2. Vérifier si existe déjà
      const exists = await this.agentExists(analysis.name);
      if (exists) {
        throw new Error(`❌ Agent "${analysis.name}" existe déjà!`);
      }

      // 3. Générer le code
      console.log('\n2️⃣ Génération du code...');
      const code = await this.generateCode(analysis);
      console.log(`✅ ${code.split('\n').length} lignes générées`);

      // 4. Sauvegarder
      console.log('\n3️⃣ Sauvegarde...');
      const filename = await this.saveAgent(analysis.name, code);
      console.log(`✅ Fichier: ${filename}`);

      // 5. Tester
      console.log('\n4️⃣ Tests...');
      const testResult = await this.testAgent(filename);

      if (!testResult.success) {
        throw new Error(`Tests échoués: ${testResult.error}`);
      }

      console.log(`✅ ${testResult.methods.length} méthodes validées`);

      // 6. Enregistrer dans le registre
      console.log('\n5️⃣ Enregistrement...');
      await this.registerAgent(analysis);
      console.log(`✅ Agent enregistré dans le système`);

      console.log('\n🎉 Agent créé avec succès!\n');

      return {
        success: true,
        name: analysis.name,
        className: analysis.className,
        file: filename,
        description: analysis.description,
        capabilities: analysis.capabilities,
        methods: testResult.methods,
        apis: analysis.apis_needed,
        tested: true
      };

    } catch (error) {
      console.error(`\n❌ Erreur: ${error.message}\n`);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyser la demande de l'utilisateur avec l'IA
   */
  async analyzeRequest(description) {
    const prompt = `Tu es un architecte logiciel expert. Analyse cette demande de création d'agent et extrais les informations nécessaires.

DEMANDE: "${description}"

Retourne UNIQUEMENT un objet JSON valide (pas de markdown, pas d'explication) avec cette structure exacte:

{
  "name": "nom-de-l-agent-en-kebab-case",
  "className": "NomAgentEnPascalCase",
  "description": "Description claire en une phrase",
  "capabilities": ["capacité 1", "capacité 2", "capacité 3"],
  "apis_needed": ["nom-api-1", "nom-api-2"],
  "methods": [
    {
      "name": "nomMethode",
      "description": "Ce qu'elle fait",
      "params": ["param1", "param2"],
      "returnType": "ce qu'elle retourne"
    }
  ]
}

EXEMPLES:

Demande: "Crée un agent Instagram"
→ {
  "name": "instagram-agent",
  "className": "InstagramAgent",
  "description": "Gestion complète compte Instagram",
  "capabilities": ["publier photo", "lire DMs", "liker posts", "voir analytics"],
  "apis_needed": ["instagram-private-api"],
  "methods": [
    {"name": "publishPhoto", "description": "Publie une photo", "params": ["imageUrl", "caption"], "returnType": "post ID"},
    {"name": "readDMs", "description": "Lit les messages directs", "params": [], "returnType": "liste messages"},
    {"name": "likePost", "description": "Like un post", "params": ["postId"], "returnType": "success boolean"}
  ]
}

Demande: "Agent pour traduire du texte"
→ {
  "name": "translator-agent",
  "className": "TranslatorAgent",
  "description": "Traduction multi-langues intelligente",
  "capabilities": ["traduire texte", "détecter langue", "translittération"],
  "apis_needed": ["openai"],
  "methods": [
    {"name": "translate", "description": "Traduit un texte", "params": ["text", "targetLang"], "returnType": "texte traduit"},
    {"name": "detectLanguage", "description": "Détecte la langue", "params": ["text"], "returnType": "code langue"},
    {"name": "getSupportedLanguages", "description": "Liste langues supportées", "params": [], "returnType": "array langues"}
  ]
}

IMPORTANT:
- name en kebab-case (lowercase avec tirets)
- className en PascalCase
- Minimum 2 méthodes, maximum 6
- Sois créatif mais réaliste
- Si API externe nécessaire, le préciser dans apis_needed

Réponds UNIQUEMENT avec le JSON, rien avant, rien après.`;

    const result = await router.route(prompt, {
      type: 'analysis',
      priority: 'high',
      maxTokens: 1000,
      temperature: 0.3
    });

    // Track cost
    if (result.cost > 0) {
      budgetGuardian.trackCost(result.cost, 'meta-agent-analyze');
    }

    // Parse JSON
    try {
      let jsonStr = result.content.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      // Remove any text before first {
      const firstBrace = jsonStr.indexOf('{');
      if (firstBrace > 0) {
        jsonStr = jsonStr.substring(firstBrace);
      }

      // Remove any text after last }
      const lastBrace = jsonStr.lastIndexOf('}');
      if (lastBrace < jsonStr.length - 1) {
        jsonStr = jsonStr.substring(0, lastBrace + 1);
      }

      const analysis = JSON.parse(jsonStr);

      // Validate required fields
      if (!analysis.name || !analysis.className || !analysis.methods) {
        throw new Error('JSON invalide: champs requis manquants');
      }

      return analysis;

    } catch (error) {
      console.error('Réponse IA:', result.content);
      throw new Error(`Impossible de parser l'analyse: ${error.message}`);
    }
  }

  /**
   * Générer le code de l'agent
   */
  async generateCode(analysis) {
    const methodsSignatures = analysis.methods.map(m =>
      `- ${m.name}(${m.params.join(', ')}): ${m.description} → retourne ${m.returnType}`
    ).join('\n  ');

    const prompt = `Tu es un développeur expert Node.js. Génère le code JavaScript complet et fonctionnel pour cet agent.

SPÉCIFICATIONS:
Nom classe: ${analysis.className}
Description: ${analysis.description}
Capacités: ${analysis.capabilities.join(', ')}
APIs: ${analysis.apis_needed.join(', ')}

MÉTHODES À IMPLÉMENTER:
  ${methodsSignatures}

TEMPLATE STRUCTURE:
\`\`\`javascript
#!/usr/bin/env node

/**
 * ${analysis.className} - ${analysis.description}
 *
 * Auto-généré par Meta-Agent
 * Créé le: ${new Date().toISOString()}
 */

const router = require('../ai-core/intelligent-router-pro');

class ${analysis.className} {
  constructor() {
    this.name = '${analysis.name}';
    this.description = '${analysis.description}';
    this.capabilities = ${JSON.stringify(analysis.capabilities)};
  }

  ${analysis.methods.map(m => this.generateMethodTemplate(m)).join('\n\n  ')}

  /**
   * Get agent status
   */
  async getStatus() {
    return {
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
      ready: true
    };
  }
}

module.exports = new ${analysis.className}();

// CLI test
if (require.main === module) {
  (async () => {
    console.log('🧪 Testing ${analysis.className}...\\n');
    const agent = require('./');
    const status = await agent.getStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
    console.log('\\n✅ Agent loaded successfully!');
  })();
}
\`\`\`

RÈGLES CRITIQUES:
1. Code COMPLET et FONCTIONNEL (pas de TODOs!)
2. Gestion erreurs avec try/catch
3. Validation paramètres
4. Logs utiles (console.log pour succès, console.error pour erreurs)
5. Utilise router intelligent pour appels IA si nécessaire
6. Retourne toujours des objets structurés
7. Commentaires clairs en français
8. Pas de dépendances externes non listées

Si l'agent nécessite une API externe (Instagram, Twitter, etc.), utilise le router intelligent pour simuler les appels ou indique clairement dans les logs que l'API n'est pas configurée.

GÉNÈRE LE CODE COMPLET. Réponds UNIQUEMENT avec le code JavaScript entre \`\`\`javascript et \`\`\`, rien d'autre.`;

    const result = await router.route(prompt, {
      type: 'code',
      priority: 'high',
      maxTokens: 4000,
      temperature: 0.2
    });

    // Track cost
    if (result.cost > 0) {
      budgetGuardian.trackCost(result.cost, 'meta-agent-generate');
    }

    // Extract code
    const codeMatch = result.content.match(/```(?:javascript)?\n([\s\S]*?)\n```/);
    if (!codeMatch) {
      throw new Error('Code non trouvé dans la réponse');
    }

    return codeMatch[1];
  }

  /**
   * Template pour une méthode
   */
  generateMethodTemplate(method) {
    const paramsStr = method.params.join(', ');

    return `/**
   * ${method.description}
   * @param {${method.params.map(p => `string`).join(', ')}} ${method.params.join(', ')}
   * @returns ${method.returnType}
   */
  async ${method.name}(${paramsStr}) {
    console.log(\`🔧 \${this.name}: ${method.name}(\${${method.params.join(', ')}})\`);

    try {
      // Implementation
      // TODO: Add actual logic here

      return {
        success: true,
        data: {}
      };

    } catch (error) {
      console.error(\`❌ Error in ${method.name}:\`, error.message);

      return {
        success: false,
        error: error.message
      };
    }
  }`;
  }

  /**
   * Sauvegarder l'agent
   */
  async saveAgent(name, code) {
    const filename = `${name}.js`;
    const filepath = path.join(this.agentsPath, filename);

    // Vérifier si existe
    try {
      await fs.access(filepath);
      throw new Error(`Fichier ${filename} existe déjà`);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    // Sauvegarder
    await fs.writeFile(filepath, code, 'utf8');

    return filename;
  }

  /**
   * Tester l'agent
   */
  async testAgent(filename) {
    try {
      const agentPath = path.join(this.agentsPath, filename);

      // Clear cache
      delete require.cache[require.resolve(agentPath)];

      // Load agent
      const agent = require(agentPath);

      // Vérifier structure
      if (!agent || typeof agent !== 'object') {
        throw new Error('Agent doit exporter un objet');
      }

      // Lister méthodes
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(agent))
        .filter(m => m !== 'constructor' && typeof agent[m] === 'function');

      if (methods.length === 0) {
        throw new Error('Agent doit avoir au moins une méthode');
      }

      // Test getStatus si existe
      if (typeof agent.getStatus === 'function') {
        const status = await agent.getStatus();
        if (!status.name) {
          throw new Error('getStatus doit retourner un objet avec "name"');
        }
      }

      return {
        success: true,
        methods
      };

    } catch (error) {
      // Supprimer fichier invalide
      const filepath = path.join(this.agentsPath, filename);
      try {
        await fs.unlink(filepath);
      } catch {}

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enregistrer dans le registre
   */
  async registerAgent(analysis) {
    const registryPath = path.join(this.configPath, 'agents-registry.json');

    let registry = {};
    try {
      const data = await fs.readFile(registryPath, 'utf8');
      registry = JSON.parse(data);
    } catch {
      // Fichier n'existe pas
    }

    registry[analysis.name] = {
      file: `${analysis.name}.js`,
      className: analysis.className,
      description: analysis.description,
      capabilities: analysis.capabilities,
      methods: analysis.methods.map(m => m.name),
      apis: analysis.apis_needed,
      created: new Date().toISOString(),
      auto_generated: true,
      generator: 'meta-agent',
      version: '1.0.0'
    };

    await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
  }

  /**
   * Vérifier si agent existe
   */
  async agentExists(name) {
    const filepath = path.join(this.agentsPath, `${name}.js`);
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lister tous les agents
   */
  async listAgents() {
    const registryPath = path.join(this.configPath, 'agents-registry.json');

    try {
      const data = await fs.readFile(registryPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  /**
   * Obtenir info sur un agent
   */
  async getAgentInfo(name) {
    const registry = await this.listAgents();
    return registry[name] || null;
  }
}

module.exports = new MetaAgent();

// CLI test
if (require.main === module) {
  (async () => {
    console.log('🧪 Testing Meta-Agent...\n');

    const metaAgent = new MetaAgent();

    // Test création agent simple
    console.log('Test: Création agent Weather');
    const result = await metaAgent.createAgent('Crée un agent pour la météo');

    if (result.success) {
      console.log('\n✅ Meta-Agent test passed!');
      console.log('Agent créé:', result.name);
      console.log('Méthodes:', result.methods.join(', '));
    } else {
      console.error('\n❌ Test failed:', result.error);
    }
  })();
}
