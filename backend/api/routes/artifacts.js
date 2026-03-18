const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../../lib/logger');

const artifacts = new Map();

// Get all artifacts for task
router.get('/task/:taskId', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const taskArtifacts = Array.from(artifacts.values()).filter(a => a.taskId === taskId);
    res.json(taskArtifacts);
  } catch (error) {
    logger.error('Error fetching artifacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get artifact by ID
router.get('/:artifactId', async (req, res) => {
  try {
    const artifact = artifacts.get(req.params.artifactId);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    res.json(artifact);
  } catch (error) {
    logger.error('Error fetching artifact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create artifact
router.post('/', async (req, res) => {
  try {
    const { taskId, type, title, content, metadata } = req.body;

    if (!taskId || !type) {
      return res.status(400).json({ error: 'Missing required fields: taskId, type' });
    }

    const artifactId = uuidv4();
    const artifact = {
      id: artifactId,
      taskId,
      type, // 'plan', 'diff', 'log', 'screenshot', 'test-result', 'recording'
      title,
      content,
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    artifacts.set(artifactId, artifact);
    res.status(201).json(artifact);
  } catch (error) {
    logger.error('Error creating artifact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update artifact
router.patch('/:artifactId', async (req, res) => {
  try {
    const artifact = artifacts.get(req.params.artifactId);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    const { title, content, metadata } = req.body;
    artifact.title = title || artifact.title;
    artifact.content = content || artifact.content;
    artifact.metadata = metadata || artifact.metadata;
    artifact.updatedAt = new Date().toISOString();

    artifacts.set(req.params.artifactId, artifact);
    res.json(artifact);
  } catch (error) {
    logger.error('Error updating artifact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete artifact
router.delete('/:artifactId', async (req, res) => {
  try {
    artifacts.delete(req.params.artifactId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting artifact:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
