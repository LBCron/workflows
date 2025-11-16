/**
 * Xianyu Scraper - Stub pour développement
 * TODO: Implémenter scraping réel
 */

class XianyuScraper {
  async init() {
    console.log('Xianyu Scraper initialisé (stub)');
  }

  async search(keyword) {
    // Simuler résultats
    return [
      {
        id: 'xianyu_001',
        title: `${keyword} Product 1`,
        price: 250 + Math.random() * 200,
        image: null,
        vendor: 'vendor_123',
        url: 'https://xianyu.com/...'
      }
    ];
  }

  async getVendorProducts(vendorId) {
    // Simuler produits vendeur
    return [
      {
        id: `${vendorId}_001`,
        title: 'Supreme Box Logo Hoodie',
        price: 450,
        image: null,
        vendor: vendorId,
        url: 'https://xianyu.com/...'
      },
      {
        id: `${vendorId}_002`,
        title: 'Nike Air Jordan 1',
        price: 380,
        image: null,
        vendor: vendorId,
        url: 'https://xianyu.com/...'
      }
    ];
  }
}

module.exports = XianyuScraper;
