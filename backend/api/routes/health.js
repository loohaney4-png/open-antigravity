const express = require('express');
const router = express.Router();
const { getInstance } = require('../lib/health');
const logger = require('../lib/logger');

const health = getInstance();

/**
 * Get health status
 */
router.get('/', async (req, res) => {
  try {
    const status = await health.getStatus();
    res.status(status.status === 'healthy' ? 200 : 503).json(status);
  } catch (error) {
    logger.error('Error checking health:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * Get health history
 */
router.get('/history', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const history = health.getHistory(limit);
    res.json(history);
  } catch (error) {
    logger.error('Error fetching health history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Register custom health check
 */
router.post('/check/:checkName', (req, res) => {
  try {
    const { checkFn } = req.body;
    if (!checkFn) {
      return res.status(400).json({ error: 'checkFn is required' });
    }

    // Register the check (in production, would validate the function)
    health.registerCheck(req.params.checkName, eval(`(${checkFn})`));

    res.json({ message: `Health check '${req.params.checkName}' registered` });
  } catch (error) {
    logger.error('Error registering health check:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
