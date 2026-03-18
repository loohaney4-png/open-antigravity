const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const logger = require('../lib/logger');

/**
 * Configuration manager for Open-Antigravity
 */
class ConfigManager {
  constructor(configPath = '.antigravity/config.json') {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from file
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        const config = JSON.parse(content);
        logger.info(`Configuration loaded from ${this.configPath}`);
        return config;
      } else {
        logger.warn(`Configuration file not found at ${this.configPath}, using defaults`);
        return this.getDefaultConfig();
      }
    } catch (error) {
      logger.error('Error loading configuration:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      name: 'Open-Antigravity Project',
      version: '1.0.0',
      description: 'An Open-Antigravity powered application',
      agents: [],
      defaultModel: 'gpt-4-turbo',
      workspace: {
        path: './src'
      },
      features: {
        authentication: true,
        monitoring: true,
        logging: true,
        plugins: true
      },
      limits: {
        maxAgents: 10,
        maxTaskRetries: 3,
        taskTimeout: 300000
      },
      models: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 1
      }
    };
  }

  /**
   * Get configuration value
   */
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set configuration value
   */
  set(key, value) {
    const keys = key.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in obj) || typeof obj[k] !== 'object') {
        obj[k] = {};
      }
      obj = obj[k];
    }

    obj[keys[keys.length - 1]] = value;
    logger.info(`Configuration updated: ${key} = ${value}`);
  }

  /**
   * Save configuration to file
   */
  saveConfig() {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.config, null, 2)
      );

      logger.info(`Configuration saved to ${this.configPath}`);
    } catch (error) {
      logger.error('Error saving configuration:', error);
      throw error;
    }
  }

  /**
   * Merge configuration
   */
  merge(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
    logger.info('Configuration merged');
  }

  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];

    if (!this.config.name) {
      errors.push('Project name is required');
    }

    if (!this.config.defaultModel) {
      errors.push('Default model must be specified');
    }

    if (this.config.limits && this.config.limits.maxAgents < 1) {
      errors.push('Max agents must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = ConfigManager;
