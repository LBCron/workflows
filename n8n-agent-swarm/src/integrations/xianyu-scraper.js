/**
 * Xianyu Auto-Scraper Integration
 *
 * Node.js wrapper for ai-goofish-monitor Python project
 * Handles QR login, scraping, and result parsing
 *
 * @author Manager Bot Team
 * @version 1.0.0
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../core/logger');
const EventEmitter = require('events');

// Configuration
const CONFIG = {
  PYTHON_PATH: process.env.PYTHON_PATH || 'python3',
  SCRAPER_DIR: process.env.XIANYU_SCRAPER_PATH || path.join(__dirname, '../../ai-goofish-monitor'),
  MAX_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  QR_TIMEOUT: 2 * 60 * 1000, // 2 minutes for QR scan
  PROGRESS_INTERVAL: 50, // Progress update every N products
  MAX_PRODUCTS: 1000, // Maximum products to scrape
  MAX_PAGES: 50 // Maximum pages (1 page ≈ 20 products)
};

class XianyuScraper extends EventEmitter {
  constructor() {
    super();

    this.isAuthenticated = false;
    this.authStatePath = path.join(CONFIG.SCRAPER_DIR, 'xianyu_state.json');
    this.process = null;
    this.aborted = false;

    logger.info('✅ Xianyu Scraper initialized');
  }

  // ═════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ═════════════════════════════════════════════════════════

  /**
   * Check if user is logged in
   */
  async isLoggedIn() {
    try {
      await fs.access(this.authStatePath);
      const stats = await fs.stat(this.authStatePath);

      // Check if state file is less than 7 days old
      const daysSinceModified = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);

      if (daysSinceModified > 7) {
        logger.warn('⚠️ Xianyu auth state expired (>7 days)');
        return false;
      }

      this.isAuthenticated = true;
      return true;

    } catch (error) {
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Perform QR code login
   * Returns path to QR code image
   */
  async login() {
    logger.info('🔐 Starting Xianyu QR login...');

    return new Promise((resolve, reject) => {
      const loginScript = path.join(CONFIG.SCRAPER_DIR, 'login.py');

      const process = spawn(CONFIG.PYTHON_PATH, [loginScript], {
        cwd: CONFIG.SCRAPER_DIR,
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
        logger.info(`[Login] ${data.toString().trim()}`);

        // Check if QR code generated
        if (output.includes('qrcode.png')) {
          const qrPath = path.join(CONFIG.SCRAPER_DIR, 'qrcode.png');
          this.emit('qr-ready', qrPath);
        }

        // Check if login successful
        if (output.includes('Login successful') || output.includes('登录成功')) {
          this.isAuthenticated = true;
          this.emit('login-success');
        }
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
        logger.error(`[Login Error] ${data.toString().trim()}`);
      });

      process.on('close', (code) => {
        if (code === 0 && this.isAuthenticated) {
          logger.info('✅ Xianyu login successful');
          resolve({
            success: true,
            message: 'Login successful',
            statePath: this.authStatePath
          });
        } else {
          logger.error(`❌ Login failed with code ${code}`);
          reject(new Error(`Login failed: ${errorOutput || 'Unknown error'}`));
        }
      });

      // Timeout
      setTimeout(() => {
        if (!this.isAuthenticated) {
          process.kill();
          reject(new Error('QR code login timeout (2 minutes)'));
        }
      }, CONFIG.QR_TIMEOUT);
    });
  }

  // ═════════════════════════════════════════════════════════
  // SCRAPING
  // ═════════════════════════════════════════════════════════

  /**
   * Scan vendor products
   * @param {Object} options - Scraping options
   * @param {string} options.vendorId - Vendor ID to scan
   * @param {number} options.maxPages - Maximum pages (default: 50)
   * @param {number} options.minPrice - Minimum price in CNY (optional)
   * @param {number} options.maxPrice - Maximum price in CNY (optional)
   * @param {Function} options.onProgress - Progress callback
   */
  async scanVendor(options) {
    const {
      vendorId,
      maxPages = CONFIG.MAX_PAGES,
      minPrice,
      maxPrice,
      onProgress
    } = options;

    // Validate
    if (!vendorId) {
      throw new Error('vendorId is required');
    }

    // Sanitize vendor ID
    const sanitizedVendorId = this.sanitizeInput(vendorId);

    // Check auth
    const loggedIn = await this.isLoggedIn();
    if (!loggedIn) {
      throw new Error('Not logged in. Please run /xianyu_login first.');
    }

    logger.info(`🔍 Starting scan: vendor=${sanitizedVendorId}, pages=${maxPages}`);

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Create task config
      const taskConfig = this.createTaskConfig({
        vendorId: sanitizedVendorId,
        maxPages,
        minPrice,
        maxPrice
      });

      // Write task config
      const configPath = path.join(CONFIG.SCRAPER_DIR, 'config.json');
      fs.writeFile(configPath, JSON.stringify(taskConfig, null, 2))
        .catch(err => logger.error('Config write error:', err));

      // Spawn scraper
      const scraperScript = path.join(CONFIG.SCRAPER_DIR, 'spider_v2.py');

      const args = [
        scraperScript,
        '--task-id', sanitizedVendorId,
        '--max-pages', maxPages.toString()
      ];

      if (minPrice) args.push('--min-price', minPrice.toString());
      if (maxPrice) args.push('--max-price', maxPrice.toString());

      this.process = spawn(CONFIG.PYTHON_PATH, args, {
        cwd: CONFIG.SCRAPER_DIR,
        env: { ...process.env }
      });

      this.aborted = false;

      let outputBuffer = '';
      let errorBuffer = '';
      let productsScanned = 0;

      this.process.stdout.on('data', (data) => {
        outputBuffer += data.toString();

        // Parse progress
        const lines = outputBuffer.split('\n');
        outputBuffer = lines.pop() || '';

        lines.forEach(line => {
          if (!line.trim()) return;

          // Try parse JSON events
          try {
            const event = JSON.parse(line);

            if (event.type === 'progress') {
              productsScanned = event.count || 0;

              // Emit progress every N products
              if (productsScanned % CONFIG.PROGRESS_INTERVAL === 0) {
                this.emit('progress', {
                  count: productsScanned,
                  page: event.page,
                  duration: Date.now() - startTime
                });

                if (onProgress) {
                  onProgress({
                    count: productsScanned,
                    page: event.page
                  });
                }
              }
            }

            if (event.type === 'complete') {
              this.emit('complete', event);
            }

          } catch (e) {
            // Not JSON, just log it
            logger.info(`[Scraper] ${line}`);
          }
        });
      });

      this.process.stderr.on('data', (data) => {
        errorBuffer += data.toString();
        logger.error(`[Scraper Error] ${data.toString().trim()}`);
      });

      this.process.on('close', async (code) => {
        const duration = Date.now() - startTime;

        if (this.aborted) {
          logger.warn('⚠️ Scan aborted by user');
          reject(new Error('Scan aborted'));
          return;
        }

        if (code !== 0) {
          logger.error(`❌ Scraper failed with code ${code}`);
          reject(new Error(`Scraping failed: ${errorBuffer || 'Unknown error'}`));
          return;
        }

        // Parse results
        try {
          const results = await this.parseResults(sanitizedVendorId);

          logger.info(`✅ Scan complete: ${results.length} products in ${(duration / 1000).toFixed(0)}s`);

          resolve({
            vendorId: sanitizedVendorId,
            productsScanned: results.length,
            duration,
            results
          });

        } catch (error) {
          logger.error('❌ Failed to parse results:', error);
          reject(error);
        }
      });

      // Timeout
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          logger.warn('⏱️ Scan timeout, aborting...');
          this.abort();
          reject(new Error('Scan timeout (15 minutes)'));
        }
      }, CONFIG.MAX_TIMEOUT);
    });
  }

  /**
   * Abort current scan
   */
  abort() {
    if (this.process && !this.process.killed) {
      this.aborted = true;
      this.process.kill('SIGTERM');
      logger.info('🛑 Scan aborted');
      return true;
    }
    return false;
  }

  // ═════════════════════════════════════════════════════════
  // RESULTS PARSING
  // ═════════════════════════════════════════════════════════

  /**
   * Parse JSONL results
   */
  async parseResults(taskId) {
    const resultsPath = path.join(CONFIG.SCRAPER_DIR, 'results', `${taskId}.jsonl`);

    try {
      const content = await fs.readFile(resultsPath, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l.trim());

      const results = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          logger.warn('Failed to parse JSONL line:', line);
          return null;
        }
      }).filter(Boolean);

      // Transform to standard format
      return results.map(item => this.transformProduct(item));

    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`Results file not found: ${resultsPath}`);
        return [];
      }
      throw error;
    }
  }

  /**
   * Transform Python output to standard format
   */
  transformProduct(rawProduct) {
    return {
      id: rawProduct.id || rawProduct.product_id,
      title: rawProduct.title || '',
      price: parseFloat(rawProduct.price || 0),
      priceCny: parseFloat(rawProduct.price || 0),
      priceEur: parseFloat(rawProduct.price || 0) * 0.13, // CNY to EUR
      images: rawProduct.images || [],
      condition: rawProduct.condition || rawProduct.新旧程度 || '',
      sellerId: rawProduct.seller_id || rawProduct.vendor_id,
      url: rawProduct.url || rawProduct.link || '',
      platform: 'xianyu',

      // AI analysis (if available)
      aiAnalysis: rawProduct.ai_analysis || null,
      aiRecommendation: rawProduct.ai_recommendation || 'unknown',
      aiScore: parseInt(rawProduct.ai_score || 50),
      authenticityScore: parseInt(rawProduct.authenticity_score || 50),

      // Metadata
      scrapedAt: new Date().toISOString(),
      source: 'xianyu-scraper'
    };
  }

  // ═════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═════════════════════════════════════════════════════════

  /**
   * Create task configuration for Python scraper
   */
  createTaskConfig(options) {
    const {
      vendorId,
      maxPages,
      minPrice,
      maxPrice
    } = options;

    return {
      tasks: [
        {
          id: vendorId,
          name: `Vendor ${vendorId}`,
          keyword: vendorId,
          enabled: true,
          max_pages: maxPages,
          min_price: minPrice || 0,
          max_price: maxPrice || 999999,
          cron: null, // One-time scan
          custom_prompt: this.getAnalysisPrompt(),
          notify: false // We handle notifications via Telegram
        }
      ]
    };
  }

  /**
   * Get AI analysis prompt
   */
  getAnalysisPrompt() {
    return `Analyze this product for resale potential in France:

1. Authenticity (0-100): Assess if product is genuine
2. Condition (0-100): Evaluate physical condition
3. Market demand: Estimate demand in France
4. Recommended action: BUY / CONSIDER / SKIP

Focus on:
- Brand authenticity signs
- Wear and tear
- Completeness (box, accessories)
- Resale value on Vinted/Leboncoin

Return JSON with scores and recommendation.`;
  }

  // ═════════════════════════════════════════════════════════
  // UTILITIES
  // ═════════════════════════════════════════════════════════

  /**
   * Sanitize user input (vendor ID)
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    // Allow only alphanumeric and underscore
    return input.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
  }

  /**
   * Check if Python dependencies are installed
   */
  async checkDependencies() {
    return new Promise((resolve) => {
      const process = spawn(CONFIG.PYTHON_PATH, ['-m', 'pip', 'list']);

      let output = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', () => {
        const hasPlaywright = output.includes('playwright');
        const hasFastAPI = output.includes('fastapi');
        const hasOpenAI = output.includes('openai');

        resolve({
          playwright: hasPlaywright,
          fastapi: hasFastAPI,
          openai: hasOpenAI,
          allInstalled: hasPlaywright && hasFastAPI && hasOpenAI
        });
      });

      process.on('error', () => {
        resolve({
          playwright: false,
          fastapi: false,
          openai: false,
          allInstalled: false
        });
      });
    });
  }

  /**
   * Get scraper status
   */
  async getStatus() {
    const loggedIn = await this.isLoggedIn();
    const deps = await this.checkDependencies();

    return {
      authenticated: loggedIn,
      dependencies: deps,
      scraperPath: CONFIG.SCRAPER_DIR,
      pythonPath: CONFIG.PYTHON_PATH,
      ready: loggedIn && deps.allInstalled
    };
  }
}

module.exports = XianyuScraper;
