const express = require('express');
const router = express.Router();
const { getInstance } = require('../lib/metrics');
const { requireAuth } = require('../auth/middleware');
const logger = require('../lib/logger');

const metrics = getInstance();

/**
 * Get all metrics
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const allMetrics = metrics.getMetrics();
    res.json(allMetrics);
  } catch (error) {
    logger.error('Error fetching metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get API metrics
 */
router.get('/api', requireAuth, (req, res) => {
  try {
    const apiMetrics = metrics.getAPIMetrics();
    res.json(apiMetrics);
  } catch (error) {
    logger.error('Error fetching API metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get agent metrics
 */
router.get('/agent/:agentId', requireAuth, (req, res) => {
  try {
    const agentMetrics = metrics.getAgentMetrics(req.params.agentId);
    if (!agentMetrics) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agentMetrics);
  } catch (error) {
    logger.error('Error fetching agent metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reset metrics
 */
router.post('/reset', requireAuth, (req, res) => {
  try {
    metrics.reset();
    res.json({ message: 'Metrics reset successfully' });
  } catch (error) {
    logger.error('Error resetting metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
