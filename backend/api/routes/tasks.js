const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../../lib/logger');

const tasks = new Map();

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const allTasks = Array.from(tasks.values());
    res.json(allTasks);
  } catch (error) {
    logger.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
router.get('/:taskId', async (req, res) => {
  try {
    const task = tasks.get(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    logger.error('Error fetching task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { agentId, title, description, priority } = req.body;

    if (!agentId || !title) {
      return res.status(400).json({ error: 'Missing required fields: agentId, title' });
    }

    const taskId = uuidv4();
    const task = {
      id: taskId,
      agentId,
      title,
      description,
      priority: priority || 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    tasks.set(taskId, task);
    res.status(201).json(task);
  } catch (error) {
    logger.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.patch('/:taskId', async (req, res) => {
  try {
    const task = tasks.get(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { status, description, priority } = req.body;
    task.status = status || task.status;
    task.description = description || task.description;
    task.priority = priority || task.priority;
    task.updatedAt = new Date().toISOString();

    if (status === 'in-progress' && !task.startedAt) {
      task.startedAt = new Date().toISOString();
    }
    if (status === 'completed' && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }

    tasks.set(req.params.taskId, task);
    res.json(task);
  } catch (error) {
    logger.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:taskId', async (req, res) => {
  try {
    tasks.delete(req.params.taskId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
