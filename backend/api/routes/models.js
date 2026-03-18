const express = require('express');
const router = express.Router();
const logger = require('../../lib/logger');
const ModelGateway = require('../../services/model-gateway');

// Get available models
router.get('/', async (req, res) => {
  try {
    const models = await ModelGateway.getAvailableModels();
    res.json(models);
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get model by ID
router.get('/:modelId', async (req, res) => {
  try {
    const model = await ModelGateway.getModel(req.params.modelId);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    res.json(model);
  } catch (error) {
    logger.error('Error fetching model:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get model providers
router.get('/providers/list', async (req, res) => {
  try {
    const providers = await ModelGateway.getProviders();
    res.json(providers);
  } catch (error) {
    logger.error('Error fetching providers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add model provider credentials
router.post('/providers/configure', async (req, res) => {
  try {
    const { provider, apiKey, apiEndpoint } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields: provider, apiKey' });
    }

    const configured = await ModelGateway.configureProvider({
      provider,
      apiKey,
      apiEndpoint
    });

    res.status(201).json(configured);
  } catch (error) {
    logger.error('Error configuring provider:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test model connectivity
router.post('/:modelId/test', async (req, res) => {
  try {
    const result = await ModelGateway.testModel(req.params.modelId);
    res.json(result);
  } catch (error) {
    logger.error('Error testing model:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate completion
router.post('/generate', async (req, res) => {
  try {
    const { modelId, prompt, systemPrompt, maxTokens, temperature } = req.body;

    if (!modelId || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: modelId, prompt' });
    }

    const completion = await ModelGateway.generateCompletion({
      modelId,
      prompt,
      systemPrompt,
      maxTokens: maxTokens || 2048,
      temperature: temperature || 0.7
    });

    res.json(completion);
  } catch (error) {
    logger.error('Error generating completion:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
