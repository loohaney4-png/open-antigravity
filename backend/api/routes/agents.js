const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../../lib/logger');
const AgentOrchestrator = require('../../services/agent-orchestrator');
const pluginsMarketplace = require('./plugins-marketplace');

// Get all agents
router.get('/', async (req, res) => {
  try {
    const agents = await AgentOrchestrator.getAllAgents();
    res.json(agents);
  } catch (error) {
    logger.error('Error fetching agents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agent by ID
router.get('/:agentId', async (req, res) => {
  try {
    const agent = await AgentOrchestrator.getAgent(req.params.agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    logger.error('Error fetching agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new agent
router.post('/', async (req, res) => {
  try {
    const { name, model, role, instructions, workspaceId } = req.body;
    
    if (!name || !model || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, model, role' });
    }

    const agentId = uuidv4();
    const agent = await AgentOrchestrator.createAgent({
      id: agentId,
      name,
      model,
      role,
      instructions,
      workspaceId,
      status: 'idle',
      createdAt: new Date().toISOString()
    });

    res.status(201).json(agent);
  } catch (error) {
    logger.error('Error creating agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute task on agent
router.post('/:agentId/execute', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { task, context } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Missing required field: task' });
    }

    const taskId = uuidv4();
    const execution = await AgentOrchestrator.executeTask(agentId, {
      taskId,
      task,
      context,
      startedAt: new Date().toISOString()
    });

    res.status(202).json(execution);
  } catch (error) {
    logger.error('Error executing task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop agent
router.post('/:agentId/stop', async (req, res) => {
  try {
    const agent = await AgentOrchestrator.stopAgent(req.params.agentId);
    res.json(agent);
  } catch (error) {
    logger.error('Error stopping agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete agent
router.delete('/:agentId', async (req, res) => {
  try {
    await AgentOrchestrator.deleteAgent(req.params.agentId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ PLUGIN MANAGEMENT ROUTES ============

// Get agent's installed plugins
router.get('/:agentId/plugins', (req, res) => {
  try {
    const { agentId } = req.params;
    const plugins = pluginsMarketplace.getAgentPlugins(agentId);

    res.json({
      success: true,
      data: plugins
    });
  } catch (error) {
    logger.error(`Get agent plugins error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

// Install plugin for agent
router.post('/:agentId/plugins/install', (req, res) => {
  try {
    const { agentId } = req.params;
    const { pluginId } = req.body;

    if (!pluginId) {
      return res.status(400).json({
        error: 'pluginId is required'
      });
    }

    const plugin = pluginsMarketplace.installPluginForAgent(agentId, pluginId);

    logger.info(`Plugin installed: ${pluginId} for agent ${agentId}`);

    res.json({
      success: true,
      data: {
        pluginId,
        agentId,
        installed: true,
        message: `Plugin ${plugin.name} installed successfully`
      }
    });
  } catch (error) {
    logger.error(`Install plugin error: ${error.message}`);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      error: error.message
    });
  }
});

// Remove plugin from agent
router.delete('/:agentId/plugins/:pluginId', (req, res) => {
  try {
    const { agentId, pluginId } = req.params;

    pluginsMarketplace.removePluginFromAgent(agentId, pluginId);

    logger.info(`Plugin removed: ${pluginId} from agent ${agentId}`);

    res.json({
      success: true,
      data: {
        pluginId,
        agentId,
        removed: true,
        message: 'Plugin removed successfully'
      }
    });
  } catch (error) {
    logger.error(`Remove plugin error: ${error.message}`);
    res.status(404).json({
      error: error.message
    });
  }
});

module.exports = router;
