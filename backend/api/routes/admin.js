const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../../auth/middleware');
const { getInstance: getMetrics } = require('../../lib/metrics');
const { getInstance: getAudit } = require('../../lib/audit');
const { getInstance: getHealth } = require('../../lib/health');
const logger = require('../../lib/logger');

/**
 * Admin dashboard data
 */

/**
 * Get dashboard overview
 */
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const metrics = getMetrics().getMetrics();
    const health = await getHealth().getStatus();
    const audit = getAudit();

    res.json({
      metrics: {
        api: metrics.api,
        models: metrics.models,
        agentCount: metrics.agents.total,
        workspaceCount: metrics.workspaces.total
      },
      health: {
        status: health.status,
        checks: health.checks
      },
      recentEvents: audit.queryEvents().slice(-10)
    });
  } catch (error) {
    logger.error('Error fetching dashboard overview:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get system stats
 */
router.get('/stats', requireAdmin, (req, res) => {
  try {
    const metrics = getMetrics();
    const audit = getAudit();

    const apiMetrics = metrics.getAPIMetrics();
    const allMetrics = metrics.getMetrics();

    const stats = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      api: apiMetrics,
      agents: {
        total: allMetrics.agents.total,
        agents: Array.from(allMetrics.agents.entries()).map(([id, data]) => ({
          id,
          name: data.name,
          status: data.status,
          tasksExecuted: data.tasks_executed,
          errors: data.errors
        }))
      },
      models: allMetrics.models,
      recentUsers: audit.queryEvents({ type: 'AUTH' }).slice(-20)
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user management
 */
router.get('/users', requireAdmin, (req, res) => {
  try {
    // In production, would query actual database
    const audit = getAudit();
    const authEvents = audit.getEventsByType('AUTH', 1000);

    // Extract unique users from audit log
    const users = new Map();
    for (const event of authEvents) {
      if (event.userId && !users.has(event.userId)) {
        users.set(event.userId, {
          id: event.userId,
          lastActivity: event.timestamp,
          loginCount: 0
        });
      }
    }

    // Count logins
    for (const event of authEvents) {
      if (event.userId && event.action === 'login' && event.success) {
        users.get(event.userId).loginCount++;
      }
    }

    res.json({
      totalUsers: users.size,
      users: Array.from(users.values())
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get security report
 */
router.get('/security', requireAdmin, (req, res) => {
  try {
    const audit = getAudit();

    const authEvents = audit.getEventsByType('AUTH', 1000);
    const errors = audit.getEventsByType('ERROR', 1000);

    // Count failed logins
    const failedLogins = authEvents.filter(e => e.action === 'login' && !e.success).length;

    // Count errors
    const errorsByType = {};
    for (const error of errors) {
      errorsByType[error.error] = (errorsByType[error.error] || 0) + 1;
    }

    res.json({
      failedLoginAttempts: failedLogins,
      totalErrors: errors.length,
      errorTypes: errorsByType,
      suspiciousActivity: failedLogins > 10 ? 'HIGH' : 'NORMAL'
    });
  } catch (error) {
    logger.error('Error fetching security report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get system configuration
 */
router.get('/config', requireAdmin, (req, res) => {
  try {
    res.json({
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown',
      nodeVersion: process.version,
      platform: process.platform,
      cpuCount: require('os').cpus().length,
      features: {
        authentication: true,
        monitoring: true,
        plugins: true,
        rateLimit: true
      }
    });
  } catch (error) {
    logger.error('Error fetching config:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
