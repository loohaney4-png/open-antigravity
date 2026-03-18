const express = require('express');
const router = express.Router();
const { getInstance: getAudit } = require('../lib/audit');
const { requireAuth, requireAdmin } = require('../auth/middleware');
const logger = require('../lib/logger');

const audit = getAudit();

/**
 * Get audit events (admin only)
 */
router.get('/', requireAdmin, (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      action: req.query.action,
      userId: req.query.userId,
      since: req.query.since
    };

    const events = audit.queryEvents(filters);
    res.json({
      count: events.length,
      events
    });
  } catch (error) {
    logger.error('Error fetching audit events:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user activity
 */
router.get('/user/:userId', requireAuth, (req, res) => {
  try {
    // Users can only view their own activity unless they're admin
    const userId = req.user.id;
    if (req.params.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const activity = audit.getUserActivity(req.params.userId, limit);

    res.json({
      userId: req.params.userId,
      count: activity.length,
      activity
    });
  } catch (error) {
    logger.error('Error fetching user activity:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get events by type
 */
router.get('/type/:type', requireAdmin, (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const events = audit.getEventsByType(req.params.type, limit);

    res.json({
      type: req.params.type,
      count: events.length,
      events
    });
  } catch (error) {
    logger.error('Error fetching events by type:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export audit log
 */
router.get('/export', requireAdmin, (req, res) => {
  try {
    const format = req.query.format || 'json';
    const data = audit.export(format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit.csv"');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="audit.json"');
    }

    res.send(data);
  } catch (error) {
    logger.error('Error exporting audit log:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear audit log (admin only)
 */
router.post('/clear', requireAdmin, (req, res) => {
  try {
    audit.clear();
    res.json({ message: 'Audit log cleared' });
  } catch (error) {
    logger.error('Error clearing audit log:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
