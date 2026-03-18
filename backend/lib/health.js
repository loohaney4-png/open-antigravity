const logger = require('../lib/logger');
const { getInstance: getMetrics } = require('../lib/metrics');

/**
 * Health check system for monitoring service status
 */
class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.history = [];
    this.registerDefaultChecks();
  }

  /**
   * Register a health check
   */
  registerCheck(name, checkFn) {
    this.checks.set(name, {
      name,
      check: checkFn,
      lastStatus: null,
      lastCheck: null
    });
    logger.info(`Health check registered: ${name}`);
  }

  /**
   * Register default checks
   */
  registerDefaultChecks() {
    // Memory check
    this.registerCheck('memory', async () => {
      const usage = process.memoryUsage();
      const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
      
      return {
        status: heapUsedPercent < 90 ? 'healthy' : 'degraded',
        details: {
          heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
          heapUsedPercent: heapUsedPercent.toFixed(2) + '%'
        }
      };
    });

    // CPU check (simplified)
    this.registerCheck('cpu', async () => {
      const uptime = process.uptime();
      return {
        status: 'healthy',
        details: {
          uptime: uptime.toFixed(2) + ' seconds',
          platform: process.platform
        }
      };
    });

    // Metrics check
    this.registerCheck('metrics', async () => {
      const metrics = getMetrics().getAPIMetrics();
      const errorRate = parseFloat(metrics.errorRate);
      
      return {
        status: errorRate < 5 ? 'healthy' : 'degraded',
        details: {
          requests: metrics.requests,
          errors: metrics.errors,
          errorRate: metrics.errorRate,
          avgResponseTime: metrics.avgResponseTime + 'ms'
        }
      };
    });
  }

  /**
   * Run all health checks
   */
  async runChecks() {
    const results = new Map();
    const timestamp = new Date().toISOString();

    for (const [name, checkData] of this.checks) {
      try {
        const result = await checkData.check();
        results.set(name, {
          ...result,
          timestamp
        });

        checkData.lastStatus = result.status;
        checkData.lastCheck = timestamp;

        logger.debug(`Health check: ${name} = ${result.status}`);
      } catch (error) {
        results.set(name, {
          status: 'unhealthy',
          error: error.message,
          timestamp
        });

        checkData.lastStatus = 'unhealthy';
        checkData.lastCheck = timestamp;

        logger.error(`Health check failed: ${name}`, error);
      }
    }

    // Store in history
    this.history.push({
      timestamp,
      results: Object.fromEntries(results)
    });

    // Keep only last 100 checks
    if (this.history.length > 100) {
      this.history.shift();
    }

    return {
      timestamp,
      status: this.getOverallStatus(results),
      checks: Object.fromEntries(results)
    };
  }

  /**
   * Get overall status
   */
  getOverallStatus(results) {
    let hasUnhealthy = false;
    let hasDegraded = false;

    for (const result of results.values()) {
      if (result.status === 'unhealthy') {
        hasUnhealthy = true;
      } else if (result.status === 'degraded') {
        hasDegraded = true;
      }
    }

    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  }

  /**
   * Get health status
   */
  async getStatus() {
    return this.runChecks();
  }

  /**
   * Get health history
   */
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }
}

// Singleton
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new HealthChecker();
  }
  return instance;
}

module.exports = { HealthChecker, getInstance };
