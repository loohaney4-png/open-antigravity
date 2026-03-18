const express = require('express');
const router = express.Router();
const logger = require('../../lib/logger');
const { requireAuth } = require('../../auth/middleware');

// Plugin registry
const plugins = new Map();

/**
 * Register a new plugin
 */
function registerPlugin(pluginConfig) {
  const { name, version, description, hooks } = pluginConfig;

  if (plugins.has(name)) {
    throw new Error(`Plugin ${name} already registered`);
  }

  plugins.set(name, {
    name,
    version,
    description,
    hooks: hooks || {},
    enabled: true,
    installed_at: new Date().toISOString()
  });

  logger.info(`Plugin registered: ${name} v${version}`);
  return plugins.get(name);
}

/**
 * Execute plugin hooks
 */
function executeHook(hookName, ...args) {
  const results = [];

  for (const [pluginName, plugin] of plugins.entries()) {
    if (!plugin.enabled) continue;

    const hook = plugin.hooks[hookName];
    if (hook && typeof hook === 'function') {
      try {
        const result = hook(...args);
        results.push({ plugin: pluginName, result });
      } catch (error) {
        logger.error(`Error executing hook ${hookName} in ${pluginName}:`, error);
      }
    }
  }

  return results;
}

/**
 * Get all plugins
 */
router.get('/', requireAuth, (req, res) => {
  const pluginList = Array.from(plugins.values());
  res.json(pluginList);
});

/**
 * Get plugin by name
 */
router.get('/:name', requireAuth, (req, res) => {
  const plugin = plugins.get(req.params.name);

  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }

  res.json(plugin);
});

/**
 * Install plugin
 */
router.post('/install', requireAuth, (req, res) => {
  try {
    const { name, version, description, hooks } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Plugin name required' });
    }

    const plugin = registerPlugin({
      name,
      version: version || '1.0.0',
      description: description || '',
      hooks
    });

    res.status(201).json(plugin);
  } catch (error) {
    logger.error('Plugin installation error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Enable plugin
 */
router.post('/:name/enable', requireAuth, (req, res) => {
  const plugin = plugins.get(req.params.name);

  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }

  plugin.enabled = true;
  logger.info(`Plugin enabled: ${req.params.name}`);
  res.json(plugin);
});

/**
 * Disable plugin
 */
router.post('/:name/disable', requireAuth, (req, res) => {
  const plugin = plugins.get(req.params.name);

  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }

  plugin.enabled = false;
  logger.info(`Plugin disabled: ${req.params.name}`);
  res.json(plugin);
});

/**
 * Uninstall plugin
 */
router.delete('/:name', requireAuth, (req, res) => {
  const plugin = plugins.get(req.params.name);

  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }

  plugins.delete(req.params.name);
  logger.info(`Plugin uninstalled: ${req.params.name}`);
  res.status(204).send();
});

module.exports = {
  router,
  registerPlugin,
  executeHook,
  getPlugins: () => plugins
};
