const TestHelper = require('./testHelper');
const ModelGateway = require('../services/model-gateway');

describe('Model Gateway', () => {
  describe('getAvailableModels', () => {
    it('should return list of models', async () => {
      const models = await ModelGateway.getAvailableModels();

      TestHelper.assertContains(models.map(m => m.id), 'gpt-4-turbo');
      TestHelper.assertContains(models.map(m => m.id), 'claude-3-opus');
      TestHelper.assertContains(models.map(m => m.id), 'gemini-2.0-flash');
    });

    it('should return models with required properties', async () => {
      const models = await ModelGateway.getAvailableModels();
      const firstModel = models[0];

      TestHelper.assertHasProperty(firstModel, 'id');
      TestHelper.assertHasProperty(firstModel, 'name');
      TestHelper.assertHasProperty(firstModel, 'provider');
      TestHelper.assertHasProperty(firstModel, 'maxTokens');
    });
  });

  describe('getModel', () => {
    it('should return specific model', async () => {
      const model = await ModelGateway.getModel('gpt-4-turbo');

      TestHelper.assertEqual(model.name, 'GPT-4 Turbo');
      TestHelper.assertEqual(model.provider, 'openai');
    });

    it('should return null for non-existent model', async () => {
      const model = await ModelGateway.getModel('non-existent-model');

      TestHelper.assertEqual(model, null);
    });
  });

  describe('getProviders', () => {
    it('should return list of providers', async () => {
      const providers = await ModelGateway.getProviders();

      TestHelper.assertContains(providers.map(p => p.name), 'openai');
      TestHelper.assertContains(providers.map(p => p.name), 'anthropic');
      TestHelper.assertContains(providers.map(p => p.name), 'google');
    });
  });

  describe('generateCompletion', () => {
    it('should generate completion', async () => {
      const result = await ModelGateway.generateCompletion({
        modelId: 'gpt-4-turbo',
        prompt: 'Hello, world!',
        maxTokens: 100
      });

      TestHelper.assertHasProperty(result, 'completion');
      TestHelper.assertHasProperty(result, 'tokensUsed');
      TestHelper.assertHasProperty(result, 'finishReason');
    });
  });
});

module.exports = { describe, it };
