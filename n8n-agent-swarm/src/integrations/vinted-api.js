/**
 * Vinted API Integration
 *
 * Free Vinted API for price comparison
 * No authentication required
 *
 * @author Manager Bot Team
 * @version 1.0.0
 */

const fetch = require('node-fetch');
const logger = require('../core/logger');

const CONFIG = {
  BASE_URL: 'https://www.vinted.fr/api/v2',
  CATALOG_ENDPOINT: '/catalog/items',
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  TIMEOUT: 10000,
  MAX_RETRIES: 3
};

class VintedAPI {
  constructor() {
    this.sessionCookie = null;
  }

  /**
   * Search products on Vinted
   * @param {string} query - Search query
   * @param {Object} options - Search options
   */
  async search(query, options = {}) {
    const {
      minPrice,
      maxPrice,
      perPage = 20,
      page = 1
    } = options;

    try {
      const params = new URLSearchParams({
        'search_text': query,
        'per_page': perPage.toString(),
        'page': page.toString()
      });

      if (minPrice) params.append('price_from', minPrice.toString());
      if (maxPrice) params.append('price_to', maxPrice.toString());

      const url = `${CONFIG.BASE_URL}${CONFIG.CATALOG_ENDPOINT}?${params}`;

      const response = await this.fetchWithRetry(url);

      if (!response.ok) {
        throw new Error(`Vinted API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        items: data.items || [],
        totalCount: data.pagination?.total_entries || 0,
        currentPage: data.pagination?.current_page || 1,
        totalPages: data.pagination?.total_pages || 1
      };

    } catch (error) {
      logger.error('Vinted search error:', error);
      throw error;
    }
  }

  /**
   * Get price statistics for a product
   * @param {string} query - Product search query
   * @param {Object} options - Options
   */
  async getPriceStats(query, options = {}) {
    try {
      // Search for similar products
      const results = await this.search(query, {
        ...options,
        perPage: 100 // Get more results for better stats
      });

      if (results.items.length === 0) {
        return {
          found: false,
          query,
          avgPrice: null,
          minPrice: null,
          maxPrice: null,
          count: 0,
          listings: []
        };
      }

      // Extract prices
      const prices = results.items
        .map(item => parseFloat(item.price?.amount || 0))
        .filter(p => p > 0)
        .sort((a, b) => a - b);

      if (prices.length === 0) {
        return {
          found: false,
          query,
          avgPrice: null,
          minPrice: null,
          maxPrice: null,
          count: 0,
          listings: []
        };
      }

      // Calculate stats
      const sum = prices.reduce((a, b) => a + b, 0);
      const avgPrice = sum / prices.length;
      const minPrice = prices[0];
      const maxPrice = prices[prices.length - 1];

      // Get median
      const mid = Math.floor(prices.length / 2);
      const medianPrice = prices.length % 2 === 0
        ? (prices[mid - 1] + prices[mid]) / 2
        : prices[mid];

      // Get top 5 listings
      const topListings = results.items.slice(0, 5).map(item => ({
        id: item.id,
        title: item.title,
        price: parseFloat(item.price?.amount || 0),
        currency: item.price?.currency_code || 'EUR',
        url: item.url || `https://www.vinted.fr/items/${item.id}`,
        photo: item.photos?.[0]?.url || null,
        size: item.size_title || '',
        brand: item.brand_title || '',
        condition: item.status || ''
      }));

      return {
        found: true,
        query,
        avgPrice: Math.round(avgPrice * 100) / 100,
        medianPrice: Math.round(medianPrice * 100) / 100,
        minPrice: Math.round(minPrice * 100) / 100,
        maxPrice: Math.round(maxPrice * 100) / 100,
        count: results.items.length,
        totalCount: results.totalCount,
        listings: topListings
      };

    } catch (error) {
      logger.error('Vinted price stats error:', error);
      return {
        found: false,
        query,
        error: error.message
      };
    }
  }

  /**
   * Calculate profit potential
   * @param {number} xianyuPrice - Price from Xianyu (EUR)
   * @param {Object} vintedStats - Vinted price stats
   */
  calculateProfit(xianyuPrice, vintedStats) {
    if (!vintedStats.found || !vintedStats.avgPrice) {
      return {
        profitable: false,
        profit: 0,
        margin: 0,
        recommendation: 'SKIP'
      };
    }

    // Costs to consider
    const SHIPPING_FROM_CHINA = 15; // €15 average
    const VINTED_FEES = 0.12; // 12% commission
    const PACKAGING = 2; // €2 packaging

    const totalCost = xianyuPrice + SHIPPING_FROM_CHINA + PACKAGING;
    const sellingPrice = vintedStats.avgPrice;
    const fees = sellingPrice * VINTED_FEES;
    const netProfit = sellingPrice - totalCost - fees;
    const margin = (netProfit / sellingPrice) * 100;

    // Profitability thresholds
    let recommendation = 'SKIP';
    if (netProfit >= 50) {
      recommendation = 'BUY'; // Excellent profit
    } else if (netProfit >= 20) {
      recommendation = 'CONSIDER'; // Good profit
    }

    return {
      profitable: netProfit > 0,
      profit: Math.round(netProfit * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      recommendation,
      breakdown: {
        xianyuPrice,
        shipping: SHIPPING_FROM_CHINA,
        packaging: PACKAGING,
        totalCost,
        sellingPrice,
        fees,
        netProfit
      }
    };
  }

  /**
   * Fetch with retry logic
   */
  async fetchWithRetry(url, retries = CONFIG.MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': CONFIG.USER_AGENT,
            'Accept': 'application/json',
            'Accept-Language': 'fr-FR,fr;q=0.9'
          },
          timeout: CONFIG.TIMEOUT
        });

        return response;

      } catch (error) {
        if (i === retries - 1) throw error;

        logger.warn(`Vinted fetch retry ${i + 1}/${retries}`);
        await this.sleep(1000 * (i + 1)); // Exponential backoff
      }
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean search query for better Vinted matches
   */
  cleanQuery(productTitle) {
    // Remove common Chinese marketplace terms
    let cleaned = productTitle
      .replace(/[【】\[\]]/g, ' ')
      .replace(/全新|二手|9成新|95新/g, '')
      .replace(/包邮|顺丰/g, '')
      .trim();

    // Extract brand if present
    const brandMatch = cleaned.match(/^([A-Z][a-z]+)/);
    if (brandMatch) {
      return brandMatch[0] + ' ' + cleaned.substring(brandMatch[0].length).trim();
    }

    return cleaned;
  }
}

module.exports = VintedAPI;
