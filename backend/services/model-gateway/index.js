const logger = require('../../lib/logger');
const axios = require('axios');

const providers = new Map();
const models = new Map();

// Initialize default models
const defaultModels = [
  // FREE - Ollama models (runs locally, completely free)
  {
    id: 'mistral',
    name: 'Mistral 7B',
    provider: 'ollama',
    description: 'Mistral 7B - Free, open-source model (runs locally via Ollama)',
    maxTokens: 32768,
    costPer1kTokens: { input: 0, output: 0 },
    isFree: true
  },
  {
    id: 'neural-chat',
    name: 'Neural Chat 7B',
    provider: 'ollama',
    description: 'Neural Chat 7B - Free, optimized for conversations (runs locally)',
    maxTokens: 8192,
    costPer1kTokens: { input: 0, output: 0 },
    isFree: true
  },
  {
    id: 'llama2',
    name: 'Llama 2 7B',
    provider: 'ollama',
    description: 'Llama 2 7B - Free, open-source model (runs locally via Ollama)',
    maxTokens: 4096,
    costPer1kTokens: { input: 0, output: 0 },
    isFree: true
  },
  // PAID - Premium models (optional, kept for reference)
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'OpenAI GPT-4 Turbo model (paid)',
    maxTokens: 128000,
    costPer1kTokens: { input: 0.01, output: 0.03 }
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Anthropic Claude 3 Opus model (paid)',
    maxTokens: 200000,
    costPer1kTokens: { input: 0.015, output: 0.075 }
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Google Gemini 2.0 Flash model (paid)',
    maxTokens: 1000000,
    costPer1kTokens: { input: 0.075, output: 0.3 }
  }
];

defaultModels.forEach(model => models.set(model.id, model));

// Initialize default providers
const defaultProviders = [
  {
    name: 'ollama',
    displayName: 'Ollama (Free - Local)',
    configured: true,
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
    description: 'Free, open-source models running locally. No API keys needed!',
    models: ['mistral', 'neural-chat', 'llama2'],
    isFree: true
  },
  {
    name: 'openai',
    displayName: 'OpenAI',
    configured: false,
    description: 'Premium models - OpenAI API key required',
    models: ['gpt-4-turbo']
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic',
    configured: false,
    description: 'Premium models - Anthropic API key required',
    models: ['claude-3-opus']
  },
  {
    name: 'google',
    displayName: 'Google',
    configured: false,
    description: 'Premium models - Google API key required',
    models: ['gemini-2.0-flash']
  }
];

defaultProviders.forEach(provider => providers.set(provider.name, provider));

class ModelGateway {
  static async getAvailableModels() {
    return Array.from(models.values());
  }

  static async getModel(modelId) {
    return models.get(modelId);
  }

  static async getProviders() {
    return Array.from(providers.values());
  }

  static async configureProvider(config) {
    const { provider, apiKey, apiEndpoint } = config;

    if (!providers.has(provider)) {
      throw new Error(`Provider ${provider} not found`);
    }

    const providerConfig = providers.get(provider);
    providerConfig.configured = true;
    providerConfig.apiKey = apiKey; // Store securely in production
    providerConfig.apiEndpoint = apiEndpoint || providerConfig.defaultEndpoint;

    logger.info(`Provider ${provider} configured`);
    return providerConfig;
  }

  static async testModel(modelId) {
    const model = models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const provider = providers.get(model.provider);
    if (!provider.configured) {
      throw new Error(`Provider ${model.provider} not configured`);
    }

    try {
      // Simulate API call
      logger.info(`Testing model ${modelId} with provider ${model.provider}`);
      
      // In production, make actual API call
      const testPrompt = 'Say hello in one word.';
      const response = await this.generateCompletion({
        modelId,
        prompt: testPrompt,
        maxTokens: 10
      });

      return {
        status: 'success',
        message: `Model ${modelId} is working correctly`,
        testResponse: response
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to test model ${modelId}: ${error.message}`
      };
    }
  }

  static async generateCompletion(config) {
    const { modelId, prompt, systemPrompt, maxTokens, temperature } = config;

    const model = models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const provider = providers.get(model.provider);
    if (!provider.configured) {
      throw new Error(`Provider ${model.provider} not configured`);
    }

    logger.info(`Generating completion with model ${modelId}`);

    try {
      const completion = await this._callModelAPI({
        modelId,
        model,
        provider,
        prompt,
        systemPrompt,
        maxTokens,
        temperature
      });

      return {
        modelId,
        prompt,
        completion: completion.text,
        tokensUsed: completion.tokens,
        finishReason: completion.finishReason
      };
    } catch (error) {
      logger.error(`Error generating completion with ${modelId}:`, error);
      throw error;
    }
  }

  static async _callModelAPI(config) {
    const { modelId, model, provider, prompt, systemPrompt, maxTokens, temperature } = config;

    // Handle Ollama (free, local) models
    if (model.provider === 'ollama') {
      return await this._callOllamaAPI({
        modelName: modelId,
        prompt,
        systemPrompt,
        maxTokens,
        temperature,
        endpoint: provider.endpoint
      });
    }

    // Handle OpenAI models
    if (model.provider === 'openai') {
      return await this._callOpenAIAPI(config);
    }

    // Handle Anthropic models
    if (model.provider === 'anthropic') {
      return await this._callAnthropicAPI(config);
    }

    // Handle Google models
    if (model.provider === 'google') {
      return await this._callGoogleAPI(config);
    }

    throw new Error(`Unknown provider: ${model.provider}`);
  }

  static async _callOllamaAPI(config) {
    const { modelName, prompt, systemPrompt, maxTokens, temperature, endpoint } = config;

    try {
      // Check if Ollama is running
      const healthCheck = await axios.get(`${endpoint}/api/tags`, {
        timeout: 5000
      }).catch(() => null);

      if (!healthCheck) {
        throw new Error(`Ollama server not available at ${endpoint}. Please install and run Ollama: https://ollama.ai`);
      }

      // Call Ollama API
      const response = await axios.post(`${endpoint}/api/generate`, {
        model: modelName,
        prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
        stream: false,
        options: {
          temperature: temperature || 0.7,
          num_predict: maxTokens || 256
        }
      }, {
        timeout: 120000 // 2 minute timeout for local generation
      });

      return {
        text: response.data.response,
        tokens: Math.ceil(response.data.response.split(' ').length),
        finishReason: 'stop'
      };
    } catch (error) {
      logger.error('Ollama API error:', error.message);
      throw new Error(`Failed to call Ollama: ${error.message}`);
    }
  }

  static async _callOpenAIAPI(config) {
    // Placeholder for OpenAI implementation
    return {
      text: 'OpenAI integration requires API key configuration',
      tokens: 10,
      finishReason: 'stop'
    };
  }

  static async _callAnthropicAPI(config) {
    // Placeholder for Anthropic implementation
    return {
      text: 'Anthropic integration requires API key configuration',
      tokens: 10,
      finishReason: 'stop'
    };
  }

  static async _callGoogleAPI(config) {
    // Placeholder for Google implementation
    return {
      text: 'Google API integration requires API key configuration',
      tokens: 10,
      finishReason: 'stop'
    };
  }

  static async streamCompletion(config, onChunk) {
    const { modelId, prompt, systemPrompt, maxTokens, temperature } = config;

    const model = models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    logger.info(`Streaming completion with model ${modelId}`);

    // Simulate streaming response
    const response = await this.generateCompletion(config);
    const words = response.completion.split(' ');

    for (const word of words) {
      onChunk({ type: 'token', content: word + ' ' });
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    onChunk({ type: 'done', tokens: response.tokensUsed });
  }

  static async listModelsForProvider(providerName) {
    const provider = providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    return provider.models.map(modelId => models.get(modelId));
  }
}

module.exports = ModelGateway;
