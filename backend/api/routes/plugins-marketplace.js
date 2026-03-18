const express = require('express');
const router = express.Router();
const logger = require('../../lib/logger');

// Mock plugin database - in production, use PostgreSQL
const PLUGINS_DATABASE = [
  {
    id: 'weather-plugin',
    name: 'Weather Integration',
    author: 'OpenAntigravity Team',
    version: '1.0.0',
    description: 'Get real-time weather data for any location',
    category: 'Data Integration',
    tags: ['weather', 'api', 'data'],
    rating: 4.8,
    downloads: 1250,
    reviewCount: 42,
    publishedAt: '2024-01-15',
    updatedAt: '2024-01-20',
    enabled: true
  },
  {
    id: 'email-plugin',
    name: 'Email Sender',
    author: 'Community',
    version: '2.1.0',
    description: 'Send emails from your agent with templates',
    category: 'Communication',
    tags: ['email', 'smtp', 'notifications'],
    rating: 4.6,
    downloads: 2100,
    reviewCount: 68,
    publishedAt: '2023-11-10',
    updatedAt: '2024-01-18',
    enabled: true
  },
  {
    id: 'database-plugin',
    name: 'Database Connector',
    author: 'OpenAntigravity Team',
    version: '1.5.0',
    description: 'Connect to PostgreSQL, MySQL, MongoDB, and more',
    category: 'Data Integration',
    tags: ['database', 'sql', 'nosql'],
    rating: 4.9,
    downloads: 3450,
    reviewCount: 156,
    publishedAt: '2024-01-01',
    updatedAt: '2024-01-19',
    enabled: true
  },
  {
    id: 'slack-plugin',
    name: 'Slack Integration',
    author: 'Community',
    version: '1.2.0',
    description: 'Send messages and files to Slack channels',
    category: 'Communication',
    tags: ['slack', 'messaging', 'integration'],
    rating: 4.7,
    downloads: 1890,
    reviewCount: 52,
    publishedAt: '2023-12-20',
    updatedAt: '2024-01-17',
    enabled: true
  },
  {
    id: 'analytics-plugin',
    name: 'Analytics Dashboard',
    author: 'OpenAntigravity Team',
    version: '1.0.0',
    description: 'Track agent performance metrics and insights',
    category: 'Analytics',
    tags: ['analytics', 'metrics', 'dashboard'],
    rating: 4.5,
    downloads: 987,
    reviewCount: 28,
    publishedAt: '2024-01-10',
    updatedAt: '2024-01-15',
    enabled: true
  },
  {
    id: 'pdf-generator',
    name: 'PDF Generator',
    author: 'Community',
    version: '2.0.0',
    description: 'Generate PDF reports from agent data',
    category: 'File Processing',
    tags: ['pdf', 'reports', 'generation'],
    rating: 4.4,
    downloads: 756,
    reviewCount: 20,
    publishedAt: '2023-12-05',
    updatedAt: '2024-01-16',
    enabled: true
  },
  {
    id: 'seo-plugin',
    name: 'SEO Analyzer',
    author: 'Community',
    version: '1.1.0',
    description: 'Analyze and optimize webpage SEO metrics',
    category: 'Web Tools',
    tags: ['seo', 'web', 'analysis'],
    rating: 4.3,
    downloads: 543,
    reviewCount: 15,
    publishedAt: '2023-11-30',
    updatedAt: '2024-01-14',
    enabled: true
  },
  {
    id: 'cache-plugin',
    name: 'Redis Caching',
    author: 'OpenAntigravity Team',
    version: '1.3.0',
    description: 'High-performance caching with Redis',
    category: 'Performance',
    tags: ['cache', 'redis', 'performance'],
    rating: 4.8,
    downloads: 2234,
    reviewCount: 64,
    publishedAt: '2024-01-05',
    updatedAt: '2024-01-19',
    enabled: true
  },
  {
    id: 'search-plugin',
    name: 'Full-Text Search',
    author: 'Community',
    version: '1.0.0',
    description: 'Elasticsearch-powered full-text search',
    category: 'Search',
    tags: ['search', 'elasticsearch', 'indexing'],
    rating: 4.6,
    downloads: 1678,
    reviewCount: 45,
    publishedAt: '2024-01-08',
    updatedAt: '2024-01-18',
    enabled: true
  },
  {
    id: 'notification-plugin',
    name: 'Push Notifications',
    author: 'OpenAntigravity Team',
    version: '1.4.0',
    description: 'Send push, SMS, and webhook notifications',
    category: 'Communication',
    tags: ['notifications', 'push', 'sms'],
    rating: 4.7,
    downloads: 1945,
    reviewCount: 58,
    publishedAt: '2024-01-02',
    updatedAt: '2024-01-19',
    enabled: true
  }
];

// Store installed plugins per agent
const agentPlugins = new Map();

/**
 * Get marketplace plugins
 * GET /api/plugins/marketplace
 */
router.get('/marketplace', (req, res) => {
  try {
    const { category, search, sort } = req.query;

    let plugins = [...PLUGINS_DATABASE];

    // Filter by category
    if (category && category !== 'all') {
      plugins = plugins.filter(p => p.category === category);
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      plugins = plugins.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.author.toLowerCase().includes(searchLower) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchLower)))
      );
    }

    // Sort
    switch (sort) {
      case 'rating':
        plugins.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        plugins.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        break;
      case 'updated':
        plugins.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
      case 'downloads':
      default:
        plugins.sort((a, b) => b.downloads - a.downloads);
        break;
    }

    res.json({
      success: true,
      data: plugins
    });
  } catch (error) {
    logger.error(`Get marketplace error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Get plugin details
 * GET /api/plugins/:pluginId
 */
router.get('/:pluginId', (req, res) => {
  try {
    const { pluginId } = req.params;

    const plugin = PLUGINS_DATABASE.find(p => p.id === pluginId);

    if (!plugin) {
      return res.status(404).json({
        error: 'Plugin not found'
      });
    }

    res.json({
      success: true,
      data: plugin
    });
  } catch (error) {
    logger.error(`Get plugin error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

// Note: Agent plugin management routes should be in agents.js
// These helper functions are exported so agents.js can use them
function getAgentPlugins(agentId) {
  const pluginIds = agentPlugins.get(agentId) || [];
  return pluginIds
    .map(id => PLUGINS_DATABASE.find(p => p.id === id))
    .filter(Boolean);
}

function installPluginForAgent(agentId, pluginId) {
  const plugin = PLUGINS_DATABASE.find(p => p.id === pluginId);
  if (!plugin) {
    throw new Error('Plugin not found');
  }

  let plugins = agentPlugins.get(agentId) || [];
  if (plugins.includes(pluginId)) {
    throw new Error('Plugin already installed');
  }

  plugins.push(pluginId);
  agentPlugins.set(agentId, plugins);
  return plugin;
}

function removePluginFromAgent(agentId, pluginId) {
  let plugins = agentPlugins.get(agentId) || [];
  if (!plugins.includes(pluginId)) {
    throw new Error('Plugin not installed for this agent');
  }

  plugins = plugins.filter(id => id !== pluginId);
  agentPlugins.set(agentId, plugins);
}

// Export helper functions for agents route
module.exports.helpers = {
  getAgentPlugins,
  installPluginForAgent,
  removePluginFromAgent,
  PLUGINS_DATABASE
};

/**
 * Get plugin reviews
 * GET /api/plugins/:pluginId/reviews
 */
router.get('/:pluginId/reviews', (req, res) => {
  try {
    const { pluginId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Mock reviews data
    const mockReviews = [
      {
        id: 'review_1',
        author: 'User123',
        rating: 5,
        text: 'Excellent plugin, works perfectly!',
        date: '2024-01-20',
        helpful: 45
      },
      {
        id: 'review_2',
        author: 'Developer42',
        rating: 5,
        text: 'Great integration, easy to use.',
        date: '2024-01-18',
        helpful: 32
      },
      {
        id: 'review_3',
        author: 'TechLead',
        rating: 4,
        text: 'Good plugin, minor documentation issues.',
        date: '2024-01-15',
        helpful: 18
      }
    ];

    const startIndex = (page - 1) * limit;
    const paginatedReviews = mockReviews.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        total: mockReviews.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error(`Get reviews error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Search plugins
 * GET /api/plugins/search
 */
router.get('/search', (req, res) => {
  try {
    const { q, category, sort } = req.query;

    let results = [...PLUGINS_DATABASE];

    // Search query
    if (q) {
      const queryLower = q.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(queryLower) ||
        p.description.toLowerCase().includes(queryLower) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(queryLower)))
      );
    }

    // Filter by category
    if (category) {
      results = results.filter(p => p.category === category);
    }

    // Sort
    switch (sort) {
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        break;
      default:
        results.sort((a, b) => b.downloads - a.downloads);
        break;
    }

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    logger.error(`Search error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

// Export router and helper functions
module.exports = router;
module.exports.getAgentPlugins = getAgentPlugins;
module.exports.installPluginForAgent = installPluginForAgent;
module.exports.removePluginFromAgent = removePluginFromAgent;
module.exports.PLUGINS_DATABASE = PLUGINS_DATABASE;
