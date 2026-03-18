const logger = require('../lib/logger');

/**
 * Example plugin: Code formatter
 */
const FormatterPlugin = {
  name: 'formatter',
  version: '1.0.0',
  description: 'Format and lint code automatically',
  hooks: {
    'before-task-execute': (task) => {
      logger.info('Formatter: Preparing to format code');
      return { formatted: true };
    },
    'after-task-complete': (task, result) => {
      logger.info('Formatter: Applied formatting rules');
      return result;
    }
  }
};

/**
 * Example plugin: Security scanner
 */
const SecurityPlugin = {
  name: 'security',
  version: '1.0.0',
  description: 'Scan code for security vulnerabilities',
  hooks: {
    'before-artifact-save': (artifact) => {
      logger.info('Security: Scanning artifact for vulnerabilities');
      return artifact;
    }
  }
};

/**
 * Example plugin: Performance monitor
 */
const PerformancePlugin = {
  name: 'performance-monitor',
  version: '1.0.0',
  description: 'Monitor and report performance metrics',
  hooks: {
    'agent-status-change': (agentId, oldStatus, newStatus) => {
      logger.info(`Performance: Agent ${agentId} status changed: ${oldStatus} -> ${newStatus}`);
    },
    'task-complete': (taskId, duration) => {
      logger.info(`Performance: Task ${taskId} completed in ${duration}ms`);
    }
  }
};

/**
 * Example plugin: Slack notifications
 */
const SlackPlugin = {
  name: 'slack-notifications',
  version: '1.0.0',
  description: 'Send notifications to Slack',
  hooks: {
    'task-complete': async (taskId, result) => {
      logger.info(`Slack: Would send notification for task ${taskId}`);
      // In production: await fetch(SLACK_WEBHOOK, {...})
    },
    'agent-error': async (agentId, error) => {
      logger.error(`Slack: Would notify about error in agent ${agentId}:`, error.message);
    }
  }
};

module.exports = {
  FormatterPlugin,
  SecurityPlugin,
  PerformancePlugin,
  SlackPlugin
};
