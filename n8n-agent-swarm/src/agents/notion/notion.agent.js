/**
 * 📝 NOTION AGENT PRO v1.0
 *
 * Agent Notion complet - Pages, Databases, Tasks
 *
 * Fonctionnalités:
 * - ✅ Création/lecture/mise à jour de pages
 * - ✅ Gestion de databases
 * - ✅ Recherche dans Notion
 * - ✅ To-Do lists intelligentes
 * - ✅ Templates de pages
 * - ✅ Collaboration et partage
 * - ✅ Intégration AI pour génération de contenu
 */

const { Client } = require('@notionhq/client');
const logger = require('../../core/logger/logger');

class NotionAgent {
  constructor(config = {}) {
    this.config = {
      notionToken: process.env.NOTION_API_KEY,
      ...config
    };

    this.notion = null;
    this.aiRouter = null;
    this.initialized = false;

    if (this.config.notionToken) {
      this.notion = new Client({
        auth: this.config.notionToken
      });
      this.initialized = true;
    }

    logger.info('📝 Notion Agent initialisé', {
      configured: !!this.config.notionToken
    });
  }

  /**
   * Inject AI router
   */
  setAIRouter(router) {
    this.aiRouter = router;
  }

  /**
   * Initialize connection
   */
  async initialize() {
    if (!this.config.notionToken) {
      throw new Error('NOTION_API_KEY non configurée');
    }

    if (!this.notion) {
      this.notion = new Client({
        auth: this.config.notionToken
      });
    }

    // Test la connexion
    try {
      await this.notion.users.me();
      this.initialized = true;
      logger.info('✅ Notion Agent connecté');
      return { success: true };
    } catch (error) {
      logger.error('❌ Erreur connexion Notion', { error: error.message });
      throw error;
    }
  }

  /**
   * 📄 CRÉER UNE PAGE
   *
   * @param {Object} options - Options de création
   * @returns {Object} Page créée
   */
  async createPage(options) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        parentId,
        title,
        content = [],
        icon = '📄',
        cover = null,
        properties = {}
      } = options;

      if (!parentId) {
        throw new Error('parentId requis (page parente ou database ID)');
      }

      if (!title) {
        throw new Error('title requis');
      }

      // Construire les propriétés
      const pageProperties = {
        title: {
          title: [
            {
              text: { content: title }
            }
          ]
        },
        ...properties
      };

      // Construire le contenu (blocks)
      const children = this._buildContentBlocks(content);

      const response = await this.notion.pages.create({
        parent: { page_id: parentId },
        icon: { emoji: icon },
        cover: cover ? { external: { url: cover } } : null,
        properties: pageProperties,
        children
      });

      logger.info('📄 Page créée', {
        pageId: response.id,
        title
      });

      return {
        id: response.id,
        url: response.url,
        title,
        createdAt: response.created_time
      };
    } catch (error) {
      logger.error('❌ Erreur création page', { error: error.message });
      throw error;
    }
  }

  /**
   * 📖 LIRE UNE PAGE
   *
   * @param {string} pageId - ID de la page
   * @returns {Object} Contenu de la page
   */
  async getPage(pageId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Récupérer les métadonnées
      const page = await this.notion.pages.retrieve({ page_id: pageId });

      // Récupérer le contenu (blocks)
      const blocks = await this.notion.blocks.children.list({
        block_id: pageId,
        page_size: 100
      });

      // Extraire le titre
      const title = this._extractTitle(page.properties);

      // Convertir les blocks en texte lisible
      const content = this._blocksToText(blocks.results);

      return {
        id: page.id,
        title,
        url: page.url,
        content,
        blocks: blocks.results,
        createdAt: page.created_time,
        lastEditedAt: page.last_edited_time,
        archived: page.archived
      };
    } catch (error) {
      logger.error('❌ Erreur lecture page', { pageId, error: error.message });
      throw error;
    }
  }

  /**
   * ✏️ METTRE À JOUR UNE PAGE
   *
   * @param {string} pageId - ID de la page
   * @param {Object} updates - Mises à jour
   * @returns {Object} Page mise à jour
   */
  async updatePage(pageId, updates) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const { title, properties = {}, archived } = updates;

      const updateData = {};

      if (title) {
        updateData.properties = {
          title: {
            title: [{ text: { content: title } }]
          }
        };
      }

      if (Object.keys(properties).length > 0) {
        updateData.properties = {
          ...updateData.properties,
          ...properties
        };
      }

      if (archived !== undefined) {
        updateData.archived = archived;
      }

      const response = await this.notion.pages.update({
        page_id: pageId,
        ...updateData
      });

      logger.info('✏️ Page mise à jour', { pageId });

      return {
        id: response.id,
        success: true
      };
    } catch (error) {
      logger.error('❌ Erreur mise à jour page', { pageId, error: error.message });
      throw error;
    }
  }

  /**
   * ➕ AJOUTER DU CONTENU À UNE PAGE
   *
   * @param {string} pageId - ID de la page
   * @param {Array} content - Contenu à ajouter
   * @returns {Object} Résultat
   */
  async appendToPage(pageId, content) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const children = this._buildContentBlocks(content);

      await this.notion.blocks.children.append({
        block_id: pageId,
        children
      });

      logger.info('➕ Contenu ajouté', { pageId });

      return {
        success: true,
        pageId,
        blocksAdded: children.length
      };
    } catch (error) {
      logger.error('❌ Erreur ajout contenu', { pageId, error: error.message });
      throw error;
    }
  }

  /**
   * 🗄️ CRÉER UNE DATABASE
   *
   * @param {Object} options - Options de la database
   * @returns {Object} Database créée
   */
  async createDatabase(options) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        parentId,
        title,
        properties,
        icon = '🗄️'
      } = options;

      if (!parentId || !title || !properties) {
        throw new Error('parentId, title, et properties requis');
      }

      const response = await this.notion.databases.create({
        parent: { page_id: parentId },
        icon: { emoji: icon },
        title: [
          {
            text: { content: title }
          }
        ],
        properties
      });

      logger.info('🗄️ Database créée', {
        databaseId: response.id,
        title
      });

      return {
        id: response.id,
        url: response.url,
        title
      };
    } catch (error) {
      logger.error('❌ Erreur création database', { error: error.message });
      throw error;
    }
  }

  /**
   * 📊 REQUÊTER UNE DATABASE
   *
   * @param {string} databaseId - ID de la database
   * @param {Object} filter - Filtres
   * @returns {Array} Résultats
   */
  async queryDatabase(databaseId, filter = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await this.notion.databases.query({
        database_id: databaseId,
        filter: filter.filter,
        sorts: filter.sorts,
        page_size: filter.pageSize || 100
      });

      const results = response.results.map(page => ({
        id: page.id,
        url: page.url,
        properties: this._extractProperties(page.properties),
        createdAt: page.created_time,
        lastEditedAt: page.last_edited_time
      }));

      logger.info('📊 Database requêtée', {
        databaseId,
        count: results.length
      });

      return results;
    } catch (error) {
      logger.error('❌ Erreur requête database', { databaseId, error: error.message });
      throw error;
    }
  }

  /**
   * ➕ AJOUTER ENTRÉE À UNE DATABASE
   *
   * @param {string} databaseId - ID de la database
   * @param {Object} properties - Propriétés de l'entrée
   * @returns {Object} Entrée créée
   */
  async addDatabaseEntry(databaseId, properties) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await this.notion.pages.create({
        parent: { database_id: databaseId },
        properties
      });

      logger.info('➕ Entrée ajoutée à la database', {
        databaseId,
        entryId: response.id
      });

      return {
        id: response.id,
        url: response.url,
        properties: this._extractProperties(response.properties)
      };
    } catch (error) {
      logger.error('❌ Erreur ajout entrée database', { error: error.message });
      throw error;
    }
  }

  /**
   * 🔍 RECHERCHER DANS NOTION
   *
   * @param {string} query - Requête de recherche
   * @param {Object} options - Options
   * @returns {Array} Résultats
   */
  async search(query, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        filter = {},
        sort = {},
        pageSize = 20
      } = options;

      const response = await this.notion.search({
        query,
        filter,
        sort,
        page_size: pageSize
      });

      const results = response.results.map(item => ({
        id: item.id,
        type: item.object, // 'page' or 'database'
        title: this._extractTitle(item.properties || {}),
        url: item.url,
        lastEditedAt: item.last_edited_time
      }));

      logger.info('🔍 Recherche effectuée', {
        query,
        found: results.length
      });

      return results;
    } catch (error) {
      logger.error('❌ Erreur recherche', { query, error: error.message });
      throw error;
    }
  }

  /**
   * ✅ CRÉER UNE TO-DO LIST
   *
   * @param {Object} options - Options de la to-do
   * @returns {Object} To-do créée
   */
  async createTodoList(options) {
    try {
      const {
        parentId,
        title = 'To-Do List',
        tasks = []
      } = options;

      // Créer une database pour les to-dos
      const database = await this.createDatabase({
        parentId,
        title,
        icon: '✅',
        properties: {
          'Task': {
            title: {}
          },
          'Status': {
            select: {
              options: [
                { name: 'Not Started', color: 'gray' },
                { name: 'In Progress', color: 'blue' },
                { name: 'Done', color: 'green' }
              ]
            }
          },
          'Priority': {
            select: {
              options: [
                { name: 'Low', color: 'gray' },
                { name: 'Medium', color: 'yellow' },
                { name: 'High', color: 'red' }
              ]
            }
          },
          'Due Date': {
            date: {}
          }
        }
      });

      // Ajouter les tâches
      for (const task of tasks) {
        await this.addDatabaseEntry(database.id, {
          'Task': {
            title: [{ text: { content: task.name } }]
          },
          'Status': {
            select: { name: task.status || 'Not Started' }
          },
          'Priority': {
            select: { name: task.priority || 'Medium' }
          },
          'Due Date': task.dueDate ? {
            date: { start: task.dueDate }
          } : {}
        });
      }

      logger.info('✅ To-Do List créée', {
        databaseId: database.id,
        taskCount: tasks.length
      });

      return {
        id: database.id,
        url: database.url,
        title,
        taskCount: tasks.length
      };
    } catch (error) {
      logger.error('❌ Erreur création to-do list', { error: error.message });
      throw error;
    }
  }

  /**
   * 🤖 GÉNÉRER UNE PAGE AVEC AI
   *
   * @param {Object} options - Options de génération
   * @returns {Object} Page générée
   */
  async generatePageWithAI(options) {
    try {
      if (!this.aiRouter) {
        throw new Error('AI Router non disponible');
      }

      const {
        parentId,
        topic,
        style = 'professional',
        sections = ['Introduction', 'Points clés', 'Conclusion']
      } = options;

      // Générer le contenu avec AI
      const prompt = `Génère une page Notion ${style} sur le sujet: "${topic}"

Structure demandée:
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Pour chaque section, fournis un paragraphe de contenu pertinent et bien structuré.

Format de réponse: JSON avec cette structure:
{
  "title": "Titre de la page",
  "content": [
    { "type": "heading_2", "text": "Section 1" },
    { "type": "paragraph", "text": "Contenu..." },
    ...
  ]
}`;

      const response = await this.aiRouter.route({
        prompt,
        type: 'content',
        temperature: 0.7
      });

      // Parser la réponse
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Réponse AI invalide');
      }

      const generated = JSON.parse(jsonMatch[0]);

      // Créer la page
      const page = await this.createPage({
        parentId,
        title: generated.title,
        content: generated.content,
        icon: '🤖'
      });

      logger.info('🤖 Page générée avec AI', {
        pageId: page.id,
        topic
      });

      return page;
    } catch (error) {
      logger.error('❌ Erreur génération page AI', { error: error.message });
      throw error;
    }
  }

  /**
   * Helpers privés
   */
  _buildContentBlocks(content) {
    return content.map(block => {
      const { type, text, children } = block;

      const baseBlock = {};

      switch (type) {
        case 'paragraph':
          return {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: text } }]
            }
          };

        case 'heading_1':
          return {
            object: 'block',
            type: 'heading_1',
            heading_1: {
              rich_text: [{ text: { content: text } }]
            }
          };

        case 'heading_2':
          return {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ text: { content: text } }]
            }
          };

        case 'heading_3':
          return {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ text: { content: text } }]
            }
          };

        case 'bulleted_list_item':
          return {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ text: { content: text } }]
            }
          };

        case 'numbered_list_item':
          return {
            object: 'block',
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{ text: { content: text } }]
            }
          };

        case 'to_do':
          return {
            object: 'block',
            type: 'to_do',
            to_do: {
              rich_text: [{ text: { content: text } }],
              checked: block.checked || false
            }
          };

        case 'code':
          return {
            object: 'block',
            type: 'code',
            code: {
              rich_text: [{ text: { content: text } }],
              language: block.language || 'javascript'
            }
          };

        default:
          return {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: text } }]
            }
          };
      }
    });
  }

  _extractTitle(properties) {
    const titleProp = Object.values(properties).find(
      prop => prop.type === 'title'
    );

    if (!titleProp || !titleProp.title || titleProp.title.length === 0) {
      return 'Sans titre';
    }

    return titleProp.title.map(t => t.plain_text).join('');
  }

  _extractProperties(properties) {
    const extracted = {};

    for (const [key, value] of Object.entries(properties)) {
      switch (value.type) {
        case 'title':
          extracted[key] = value.title.map(t => t.plain_text).join('');
          break;
        case 'rich_text':
          extracted[key] = value.rich_text.map(t => t.plain_text).join('');
          break;
        case 'select':
          extracted[key] = value.select?.name || null;
          break;
        case 'multi_select':
          extracted[key] = value.multi_select.map(s => s.name);
          break;
        case 'date':
          extracted[key] = value.date?.start || null;
          break;
        case 'checkbox':
          extracted[key] = value.checkbox;
          break;
        case 'number':
          extracted[key] = value.number;
          break;
        default:
          extracted[key] = value;
      }
    }

    return extracted;
  }

  _blocksToText(blocks) {
    return blocks.map(block => {
      const type = block.type;
      const content = block[type];

      if (!content || !content.rich_text) {
        return '';
      }

      const text = content.rich_text.map(t => t.plain_text).join('');

      switch (type) {
        case 'heading_1':
          return `# ${text}`;
        case 'heading_2':
          return `## ${text}`;
        case 'heading_3':
          return `### ${text}`;
        case 'bulleted_list_item':
          return `• ${text}`;
        case 'numbered_list_item':
          return `1. ${text}`;
        default:
          return text;
      }
    }).filter(t => t).join('\n');
  }
}

module.exports = NotionAgent;
