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
   * Chinese to English translation dictionary
   * Maps common Chinese product terms to English for better Vinted matching
   */
  getTranslationDictionary() {
    return {
      // Clothing types
      '连帽卫衣': 'Hoodie',
      '卫衣': 'Sweatshirt',
      'T恤': 'T-shirt',
      '衬衫': 'Shirt',
      '外套': 'Jacket',
      '夹克': 'Jacket',
      '大衣': 'Coat',
      '羽绒服': 'Down Jacket',
      '毛衣': 'Sweater',
      '背心': 'Vest',
      '裤子': 'Pants',
      '牛仔裤': 'Jeans',
      '短裤': 'Shorts',
      '裙子': 'Skirt',
      '连衣裙': 'Dress',

      // Footwear
      '运动鞋': 'Sneakers',
      '球鞋': 'Sneakers',
      '空军一号': 'Air Force 1',
      '乔丹': 'Jordan',
      '椰子': 'Yeezy',
      '板鞋': 'Skateboard Shoes',
      '靴子': 'Boots',
      '凉鞋': 'Sandals',

      // Accessories
      '包': 'Bag',
      '背包': 'Backpack',
      '手提包': 'Handbag',
      '钱包': 'Wallet',
      '帽子': 'Hat',
      '围巾': 'Scarf',
      '手套': 'Gloves',
      '腰带': 'Belt',
      '太阳镜': 'Sunglasses',
      '墨镜': 'Sunglasses',
      '项链': 'Necklace',
      '手表': 'Watch',

      // Colors
      '白色': 'White',
      '黑色': 'Black',
      '蓝色': 'Blue',
      '红色': 'Red',
      '绿色': 'Green',
      '黄色': 'Yellow',
      '灰色': 'Gray',
      '粉色': 'Pink',
      '紫色': 'Purple',
      '橙色': 'Orange',
      '棕色': 'Brown',
      '米色': 'Beige',

      // Conditions
      '全新': 'New',
      '二手': 'Used',
      '九成新': 'Like New',
      '95新': 'Excellent',
      '8成新': 'Good',

      // Brands/Popular terms
      '正品': 'Authentic',
      '原版': 'Original',
      '限量': 'Limited',
      '联名': 'Collaboration',
      '复古': 'Vintage',
      '经典': 'Classic',

      // Sizes
      '大号': 'Large',
      '中号': 'Medium',
      '小号': 'Small',
      '加大': 'Extra Large',

      // Other
      '男': 'Men',
      '女': 'Women',
      '男女通用': 'Unisex',
      '儿童': 'Kids'
    };
  }

  /**
   * Extract brand from product title
   * @param {string} title - Product title
   * @returns {string|null} - Detected brand or null
   */
  extractBrand(title) {
    const commonBrands = [
      'Supreme', 'Nike', 'Adidas', 'Jordan', 'Yeezy',
      'Gucci', 'Louis Vuitton', 'LV', 'Prada', 'Chanel',
      'Dior', 'Balenciaga', 'Off-White', 'Bape', 'Palace',
      'Stone Island', 'Moncler', 'Canada Goose', 'North Face',
      'Champion', 'Fila', 'Puma', 'Reebok', 'New Balance',
      'Converse', 'Vans', 'Lacoste', 'Ralph Lauren', 'Tommy Hilfiger',
      'Burberry', 'Versace', 'Armani', 'Givenchy', 'Fendi'
    ];

    const upperTitle = title.toUpperCase();

    for (const brand of commonBrands) {
      if (upperTitle.includes(brand.toUpperCase())) {
        return brand;
      }
    }

    return null;
  }

  /**
   * Extract product type from title
   * @param {string} title - Product title
   * @returns {string|null} - Product type or null
   */
  extractProductType(title) {
    const productTypes = [
      'Hoodie', 'Sweatshirt', 'T-shirt', 'Shirt', 'Jacket', 'Coat',
      'Sweater', 'Pants', 'Jeans', 'Shorts', 'Skirt', 'Dress',
      'Sneakers', 'Shoes', 'Boots', 'Bag', 'Backpack', 'Hat',
      'Watch', 'Sunglasses', 'Belt', 'Scarf'
    ];

    const lowerTitle = title.toLowerCase();

    for (const type of productTypes) {
      if (lowerTitle.includes(type.toLowerCase())) {
        return type;
      }
    }

    return null;
  }

  /**
   * Clean Chinese product title for Vinted search
   * Translates Chinese terms to English for better matching
   * @param {string} title - Original Chinese/mixed title
   * @returns {string} - Cleaned English title
   */
  cleanChineseTitle(title) {
    const translations = this.getTranslationDictionary();
    let cleaned = title;

    // Step 1: Replace known Chinese terms with English
    Object.entries(translations).forEach(([chinese, english]) => {
      const regex = new RegExp(chinese, 'g');
      cleaned = cleaned.replace(regex, english);
    });

    // Step 2: Remove Chinese characters and special symbols
    cleaned = cleaned
      .replace(/[【】\[\]]/g, ' ')
      .replace(/[^\x00-\x7F]+/g, ' ') // Remove non-ASCII (remaining Chinese)
      .replace(/\s+/g, ' ')
      .trim();

    // Step 3: Extract brand and put it first for better matching
    const brand = this.extractBrand(cleaned);
    if (brand) {
      // Remove brand from current position
      cleaned = cleaned.replace(new RegExp(brand, 'gi'), '').trim();
      // Add brand at the beginning
      cleaned = `${brand} ${cleaned}`;
    }

    // Step 4: Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Clean search query for better Vinted matches
   * Enhanced version with Chinese support
   */
  cleanQuery(productTitle) {
    // First, try to translate Chinese terms
    let cleaned = this.cleanChineseTitle(productTitle);

    // Remove marketplace-specific terms
    cleaned = cleaned
      .replace(/包邮|顺丰|快递/g, '')
      .replace(/全新|二手|9成新|95新|8成新/g, '')
      .replace(/正品|原版/g, 'Authentic')
      .trim();

    // Extract brand if present and prioritize it
    const brand = this.extractBrand(cleaned);
    const productType = this.extractProductType(cleaned);

    // Build optimized query: Brand + Type + other keywords
    if (brand && productType) {
      return `${brand} ${productType}`;
    } else if (brand) {
      return cleaned; // Already has brand at front
    }

    return cleaned;
  }
}

module.exports = VintedAPI;
