const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../../lib/logger');
const WorkspaceManager = require('../../services/workspace-manager');

// Get all workspaces
router.get('/', async (req, res) => {
  try {
    const workspaces = await WorkspaceManager.getAllWorkspaces();
    res.json(workspaces);
  } catch (error) {
    logger.error('Error fetching workspaces:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get workspace by ID
router.get('/:workspaceId', async (req, res) => {
  try {
    const workspace = await WorkspaceManager.getWorkspace(req.params.workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    res.json(workspace);
  } catch (error) {
    logger.error('Error fetching workspace:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new workspace
router.post('/', async (req, res) => {
  try {
    const { name, description, path } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    const workspaceId = uuidv4();
    const workspace = await WorkspaceManager.createWorkspace({
      id: workspaceId,
      name,
      description,
      path,
      status: 'ready',
      createdAt: new Date().toISOString()
    });

    res.status(201).json(workspace);
  } catch (error) {
    logger.error('Error creating workspace:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get workspace files
router.get('/:workspaceId/files', async (req, res) => {
  try {
    const files = await WorkspaceManager.getWorkspaceFiles(req.params.workspaceId);
    res.json(files);
  } catch (error) {
    logger.error('Error fetching workspace files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Read file
router.get('/:workspaceId/files/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const content = await WorkspaceManager.readFile(req.params.workspaceId, filePath);
    res.json({ path: filePath, content });
  } catch (error) {
    logger.error('Error reading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Write file
router.post('/:workspaceId/files/:filePath(*)', async (req, res) => {
  try {
    const { content } = req.body;
    const filePath = req.params.filePath;

    if (!content) {
      return res.status(400).json({ error: 'Missing required field: content' });
    }

    const file = await WorkspaceManager.writeFile(req.params.workspaceId, filePath, content);
    res.json(file);
  } catch (error) {
    logger.error('Error writing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute command in workspace
router.post('/:workspaceId/execute', async (req, res) => {
  try {
    const { command, cwd } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Missing required field: command' });
    }

    const result = await WorkspaceManager.executeCommand(req.params.workspaceId, command, cwd);
    res.json(result);
  } catch (error) {
    logger.error('Error executing command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete workspace
router.delete('/:workspaceId', async (req, res) => {
  try {
    await WorkspaceManager.deleteWorkspace(req.params.workspaceId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting workspace:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
