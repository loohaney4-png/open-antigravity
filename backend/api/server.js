const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const WebSocket = require('ws');
const http = require('http');
const logger = require('../lib/logger');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
const agentRoutes = require('./routes/agents');
const modelRoutes = require('./routes/models');
const workspaceRoutes = require('./routes/workspaces');
const artifactRoutes = require('./routes/artifacts');
const taskRoutes = require('./routes/tasks');
const browserRoutes = require('./routes/browser');
const pluginsRoutes = require('./routes/plugins-marketplace');

app.use('/api/agents', agentRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/artifacts', artifactRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/browser', browserRoutes);
app.use('/api/plugins', pluginsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  logger.info('WebSocket client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      logger.debug('WebSocket message received:', data);
      // Handle different message types
      handleWebSocketMessage(ws, data);
    } catch (error) {
      logger.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
});

function handleWebSocketMessage(ws, data) {
  const { type, payload } = data;
  
  switch (type) {
    case 'subscribe-agent':
      // Subscribe to agent status updates
      ws.agentId = payload.agentId;
      ws.send(JSON.stringify({ type: 'subscribed', agentId: payload.agentId }));
      break;
    case 'agent-command':
      // Send command to agent
      logger.info(`Command for agent ${payload.agentId}:`, payload.command);
      ws.send(JSON.stringify({ type: 'command-ack', commandId: payload.commandId }));
      break;
    default:
      ws.send(JSON.stringify({ error: 'Unknown message type' }));
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Open-Antigravity backend listening on port ${PORT}`);
});

module.exports = { app, server, wss };
