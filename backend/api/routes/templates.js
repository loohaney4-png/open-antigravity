const express = require('express');
const router = express.Router();
const logger = require('../../lib/logger');
const { getAllTemplates, createAgentFromTemplate } = require('./templates');
const { optionalAuth } = require('../../auth/middleware');

/**
 * Get all agent templates
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const templates = getAllTemplates();
    res.json(templates);
  } catch (error) {
    logger.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get template by ID
 */
router.get('/:templateId', optionalAuth, (req, res) => {
  try {
    const templates = getAllTemplates();
    const template = templates.find(t => t.id === req.params.templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    logger.error('Error fetching template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create agent from template
 */
router.post('/:templateId/create', optionalAuth, (req, res) => {
  try {
    const { customizations } = req.body;

    const agent = createAgentFromTemplate(req.params.templateId, customizations);

    res.status(201).json(agent);
  } catch (error) {
    logger.error('Error creating agent from template:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
