/**
 * 🤖 META-AGENT v4.0 - Auto-développement
 *
 * Agent qui peut s'améliorer et créer de nouveaux agents
 */

const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const logger = require('../../core/logger/logger');

class MetaAgent {
  constructor(config = {}) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.projectRoot = path.join(__dirname, '../../..');
    this.agentsPath = path.join(this.projectRoot, 'src/agents');

    logger.info('🤖 Meta-Agent initialisé - Auto-développement activé');
  }

  /**
   * Analyser le code existant
   */
  async analyzeCode(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const code = await fs.readFile(fullPath, 'utf-8');

      const prompt = 'Analyse ce code JavaScript et fournis un rapport détaillé avec suggestions.\n\nCode:\n' + code;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un expert en développement JavaScript.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      logger.info('✅ Analyse code terminée', { file: filePath });

      return {
        file: filePath,
        analysis: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Erreur analyse code', { error: error.message });
      throw error;
    }
  }

  /**
   * Générer un nouvel agent
   */
  async generateNewAgent(specs) {
    try {
      const { name, description, capabilities } = specs;

      const prompt = 'Génère un agent Node.js complet.\n\nNom: ' + name + '\nDescription: ' + description + '\nCapacités: ' + capabilities.join(', ');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un expert en développement Node.js.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      });

      const agentCode = response.choices[0].message.content;

      const agentDir = path.join(this.agentsPath, name.toLowerCase());
      await fs.mkdir(agentDir, { recursive: true });

      const agentFile = path.join(agentDir, name.toLowerCase() + '.agent.js');
      await fs.writeFile(agentFile, agentCode, 'utf-8');

      logger.info('✅ Nouvel agent généré', { name, file: agentFile });

      return {
        success: true,
        name,
        file: agentFile,
        code: agentCode
      };
    } catch (error) {
      logger.error('❌ Erreur génération agent', { error: error.message });
      throw error;
    }
  }

  /**
   * Améliorer du code existant
   */
  async improveCode(filePath, improvements = ['performance', 'readability']) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const originalCode = await fs.readFile(fullPath, 'utf-8');

      const prompt = 'Améliore ce code en te concentrant sur: ' + improvements.join(', ') + '\n\nCode:\n' + originalCode;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un expert en optimisation de code.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      const improvedCode = response.choices[0].message.content;

      const backupPath = fullPath + '.backup';
      await fs.writeFile(backupPath, originalCode, 'utf-8');
      await fs.writeFile(fullPath, improvedCode, 'utf-8');

      logger.info('✅ Code amélioré', { file: filePath });

      return {
        success: true,
        file: filePath,
        backup: backupPath,
        improvedCode
      };
    } catch (error) {
      logger.error('❌ Erreur amélioration code', { error: error.message });
      throw error;
    }
  }

  /**
   * Détecter les bugs
   */
  async detectBugs(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const code = await fs.readFile(fullPath, 'utf-8');

      const prompt = 'Détecte tous les bugs potentiels dans ce code et fournis un rapport JSON.\n\nCode:\n' + code;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un expert en détection de bugs.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      });

      const result = response.choices[0].message.content;

      logger.info('✅ Détection bugs terminée', { file: filePath });

      return {
        file: filePath,
        bugs: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Erreur détection bugs', { error: error.message });
      throw error;
    }
  }

  /**
   * Générer des tests
   */
  async generateTests(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const code = await fs.readFile(fullPath, 'utf-8');

      const prompt = 'Génère des tests Jest complets pour ce code.\n\nCode:\n' + code;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un expert en testing Jest.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      const testsCode = response.choices[0].message.content;
      const testFile = fullPath.replace(/\.js$/, '.test.js');
      await fs.writeFile(testFile, testsCode, 'utf-8');

      logger.info('✅ Tests générés', { testFile });

      return {
        success: true,
        testFile,
        code: testsCode
      };
    } catch (error) {
      logger.error('❌ Erreur génération tests', { error: error.message });
      throw error;
    }
  }

  /**
   * Génération de documentation
   */
  async generateDocumentation(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const code = await fs.readFile(fullPath, 'utf-8');

      const prompt = 'Génère une documentation Markdown complète pour ce code.\n\nCode:\n' + code;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un expert en documentation technique.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4
      });

      const documentation = response.choices[0].message.content;

      const docsDir = path.join(this.projectRoot, 'docs');
      await fs.mkdir(docsDir, { recursive: true });

      const docFile = path.join(docsDir, path.basename(filePath).replace(/\.js$/, '.md'));
      await fs.writeFile(docFile, documentation, 'utf-8');

      logger.info('✅ Documentation générée', { docFile });

      return {
        success: true,
        docFile,
        documentation
      };
    } catch (error) {
      logger.error('❌ Erreur génération documentation', { error: error.message });
      throw error;
    }
  }

  /**
   * Refactoring intelligent
   */
  async refactor(filePath, options = {}) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const originalCode = await fs.readFile(fullPath, 'utf-8');

      const prompt = 'Refactorise ce code pour améliorer sa qualité.\n\nCode:\n' + originalCode;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un expert en refactoring.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      const refactoredCode = response.choices[0].message.content;

      const backupPath = fullPath + '.backup';
      await fs.writeFile(backupPath, originalCode, 'utf-8');
      await fs.writeFile(fullPath, refactoredCode, 'utf-8');

      logger.info('✅ Refactoring terminé', { file: filePath });

      return {
        success: true,
        file: filePath,
        backup: backupPath,
        refactoredCode
      };
    } catch (error) {
      logger.error('❌ Erreur refactoring', { error: error.message });
      throw error;
    }
  }

  /**
   * Rapport complet du projet
   */
  async generateProjectReport() {
    try {
      const files = await this._getAllFiles(this.projectRoot);
      const jsFiles = files.filter(f => f.endsWith('.js') && !f.includes('node_modules'));

      const report = {
        timestamp: new Date().toISOString(),
        totalFiles: jsFiles.length,
        analyses: []
      };

      logger.info('✅ Rapport projet généré', { files: report.totalFiles });

      return report;
    } catch (error) {
      logger.error('❌ Erreur génération rapport', { error: error.message });
      throw error;
    }
  }

  async _getAllFiles(dir) {
    const files = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory() && !item.includes('node_modules')) {
        files.push(...await this._getAllFiles(fullPath));
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }
}

module.exports = MetaAgent;
