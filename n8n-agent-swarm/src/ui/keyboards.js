/**
 * Telegram Keyboards & Interactive Buttons v2.0
 *
 * Premium UI components for Telegram Bot
 */

/**
 * Main menu keyboard
 */
function getMainMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🧠 Smart Chat', callback_data: 'chat' },
          { text: '📧 Email', callback_data: 'email' }
        ],
        [
          { text: '📅 Calendar', callback_data: 'calendar' },
          { text: '🔍 Search', callback_data: 'search' }
        ],
        [
          { text: '🛍️ Commerce', callback_data: 'commerce' },
          { text: '📊 Analytics', callback_data: 'analytics' }
        ],
        [
          { text: '⚙️ Settings', callback_data: 'settings' },
          { text: '❓ Help', callback_data: 'help' }
        ]
      ]
    }
  };
}

/**
 * Commerce platforms keyboard
 */
function getCommerceKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🛍️ Xianyu 闲鱼', callback_data: 'commerce:xianyu' },
          { text: '👕 Vinted', callback_data: 'commerce:vinted' }
        ],
        [
          { text: '🛒 Taobao 淘宝', callback_data: 'commerce:taobao' },
          { text: '🌐 eBay', callback_data: 'commerce:ebay' }
        ],
        [
          { text: '📦 AliExpress', callback_data: 'commerce:aliexpress' },
          { text: '🏠 Leboncoin', callback_data: 'commerce:leboncoin' }
        ],
        [
          { text: '🔙 Back', callback_data: 'main_menu' }
        ]
      ]
    }
  };
}

/**
 * Email providers keyboard
 */
function getEmailProvidersKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📧 Gmail', callback_data: 'email:gmail' },
          { text: '📧 Outlook', callback_data: 'email:outlook' }
        ],
        [
          { text: '📧 Yahoo', callback_data: 'email:yahoo' },
          { text: '☁️ iCloud', callback_data: 'email:icloud' }
        ],
        [
          { text: '🔒 ProtonMail', callback_data: 'email:protonmail' },
          { text: '⚙️ Custom', callback_data: 'email:custom' }
        ],
        [
          { text: '🔙 Back', callback_data: 'main_menu' }
        ]
      ]
    }
  };
}

/**
 * Settings keyboard
 */
function getSettingsKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔐 Credentials Vault', callback_data: 'settings:vault' }
        ],
        [
          { text: '🧠 Learning Engine', callback_data: 'settings:learning' }
        ],
        [
          { text: '📱 iPhone Sync', callback_data: 'settings:iphone' }
        ],
        [
          { text: '📊 Monitoring', callback_data: 'settings:monitoring' }
        ],
        [
          { text: '⚡ Cache', callback_data: 'settings:cache' }
        ],
        [
          { text: '🔙 Back', callback_data: 'main_menu' }
        ]
      ]
    }
  };
}

/**
 * Credentials Vault keyboard
 */
function getVaultKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '➕ Add Service', callback_data: 'vault:add' },
          { text: '📋 List Services', callback_data: 'vault:list' }
        ],
        [
          { text: '📊 Statistics', callback_data: 'vault:stats' },
          { text: '📤 Export', callback_data: 'vault:export' }
        ],
        [
          { text: '📥 Import', callback_data: 'vault:import' },
          { text: '🗑️ Delete Service', callback_data: 'vault:delete' }
        ],
        [
          { text: '🔙 Back', callback_data: 'settings' }
        ]
      ]
    }
  };
}

/**
 * Service categories keyboard
 */
function getServiceCategoriesKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📧 Email (10+)', callback_data: 'vault:category:email' }
        ],
        [
          { text: '🛍️ Commerce (12+)', callback_data: 'vault:category:commerce' }
        ],
        [
          { text: '📊 Productivity (8+)', callback_data: 'vault:category:productivity' }
        ],
        [
          { text: '💬 Social Media (6+)', callback_data: 'vault:category:social' }
        ],
        [
          { text: '💳 Payment (5+)', callback_data: 'vault:category:payment' }
        ],
        [
          { text: '⚙️ Custom', callback_data: 'vault:category:custom' }
        ],
        [
          { text: '🔙 Back', callback_data: 'vault' }
        ]
      ]
    }
  };
}

/**
 * Confirmation keyboard (Yes/No)
 */
function getConfirmationKeyboard(action, data = '') {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Yes', callback_data: `confirm:${action}:${data}` },
          { text: '❌ No', callback_data: `cancel:${action}` }
        ]
      ]
    }
  };
}

/**
 * Pagination keyboard
 */
function getPaginationKeyboard(page, totalPages, prefix = 'page') {
  const buttons = [];

  if (page > 1) {
    buttons.push({ text: '◀️ Previous', callback_data: `${prefix}:${page - 1}` });
  }

  buttons.push({ text: `${page}/${totalPages}`, callback_data: `${prefix}:current` });

  if (page < totalPages) {
    buttons.push({ text: 'Next ▶️', callback_data: `${prefix}:${page + 1}` });
  }

  return {
    reply_markup: {
      inline_keyboard: [
        buttons,
        [{ text: '🔙 Back', callback_data: 'back' }]
      ]
    }
  };
}

/**
 * Learning Engine keyboard
 */
function getLearningEngineKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🧠 Analyze Behavior', callback_data: 'learning:analyze' }
        ],
        [
          { text: '👤 View Profile', callback_data: 'learning:profile' }
        ],
        [
          { text: '💡 Suggestions', callback_data: 'learning:suggestions' }
        ],
        [
          { text: '📊 Metrics', callback_data: 'learning:metrics' }
        ],
        [
          { text: '🧹 Clear Caches', callback_data: 'learning:clear' }
        ],
        [
          { text: '🔙 Back', callback_data: 'settings' }
        ]
      ]
    }
  };
}

/**
 * iPhone Sync keyboard
 */
function getiPhoneSyncKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📤 Export Conversations', callback_data: 'iphone:export' }
        ],
        [
          { text: '💾 Create Backup', callback_data: 'iphone:backup' }
        ],
        [
          { text: '📥 Restore Backup', callback_data: 'iphone:restore' }
        ],
        [
          { text: '📋 List Exports', callback_data: 'iphone:list_exports' }
        ],
        [
          { text: '💾 List Backups', callback_data: 'iphone:list_backups' }
        ],
        [
          { text: '📊 Statistics', callback_data: 'iphone:stats' }
        ],
        [
          { text: '🔙 Back', callback_data: 'settings' }
        ]
      ]
    }
  };
}

/**
 * Monitoring Dashboard keyboard
 */
function getMonitoringKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '❤️ Health Status', callback_data: 'monitoring:health' }
        ],
        [
          { text: '📊 Metrics', callback_data: 'monitoring:metrics' }
        ],
        [
          { text: '🚨 Alerts', callback_data: 'monitoring:alerts' }
        ],
        [
          { text: '🔄 Refresh', callback_data: 'monitoring:refresh' }
        ],
        [
          { text: '🔙 Back', callback_data: 'settings' }
        ]
      ]
    }
  };
}

/**
 * Cache Manager keyboard
 */
function getCacheKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 Statistics', callback_data: 'cache:stats' }
        ],
        [
          { text: '🧹 Clear Memory', callback_data: 'cache:clear_memory' }
        ],
        [
          { text: '🗑️ Clear Disk', callback_data: 'cache:clear_disk' }
        ],
        [
          { text: '♻️ Clear All', callback_data: 'cache:clear_all' }
        ],
        [
          { text: '🔙 Back', callback_data: 'settings' }
        ]
      ]
    }
  };
}

/**
 * Quick actions keyboard (inline)
 */
function getQuickActionsKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        ['📧 Check Email', '📅 Today\'s Schedule'],
        ['🛍️ Scan Xianyu', '🔍 Web Search'],
        ['📊 Analytics', '⚙️ Settings']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

/**
 * Cancel keyboard
 */
function getCancelKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '❌ Cancel', callback_data: 'cancel' }]
      ]
    }
  };
}

module.exports = {
  getMainMenuKeyboard,
  getCommerceKeyboard,
  getEmailProvidersKeyboard,
  getSettingsKeyboard,
  getVaultKeyboard,
  getServiceCategoriesKeyboard,
  getConfirmationKeyboard,
  getPaginationKeyboard,
  getLearningEngineKeyboard,
  getiPhoneSyncKeyboard,
  getMonitoringKeyboard,
  getCacheKeyboard,
  getQuickActionsKeyboard,
  getCancelKeyboard
};
