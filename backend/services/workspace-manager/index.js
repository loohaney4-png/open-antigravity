const logger = require('../../lib/logger');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const workspaces = new Map();

class WorkspaceManager {
  static async getAllWorkspaces() {
    return Array.from(workspaces.values());
  }

  static async getWorkspace(workspaceId) {
    return workspaces.get(workspaceId);
  }

  static async createWorkspace(config) {
    const { id, name, path: workspacePath } = config;

    const workspace = {
      id,
      name,
      path: workspacePath || `/workspaces/${id}`,
      status: 'ready',
      createdAt: config.createdAt,
      agents: [],
      files: [],
      containers: []
    };

    // Create workspace directory
    try {
      await fs.mkdir(workspace.path, { recursive: true });
      logger.info(`Workspace directory created: ${workspace.path}`);
    } catch (error) {
      logger.error(`Error creating workspace directory:`, error);
      workspace.status = 'error';
    }

    workspaces.set(id, workspace);
    logger.info(`Workspace created: ${id} (${name})`);
    return workspace;
  }

  static async getWorkspaceFiles(workspaceId, dirPath = '.') {
    const workspace = workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    try {
      const fullPath = path.join(workspace.path, dirPath);
      const files = await fs.readdir(fullPath);
      
      const fileList = await Promise.all(
        files.map(async (file) => {
          const fullFilePath = path.join(fullPath, file);
          const stat = await fs.stat(fullFilePath);
          return {
            name: file,
            path: path.join(dirPath, file),
            isDirectory: stat.isDirectory(),
            size: stat.size,
            modified: stat.mtime
          };
        })
      );

      return fileList;
    } catch (error) {
      logger.error(`Error reading workspace files:`, error);
      throw error;
    }
  }

  static async readFile(workspaceId, filePath) {
    const workspace = workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    try {
      const fullPath = path.join(workspace.path, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      logger.error(`Error reading file:`, error);
      throw error;
    }
  }

  static async writeFile(workspaceId, filePath, content) {
    const workspace = workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    try {
      const fullPath = path.join(workspace.path, filePath);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      await fs.mkdir(dir, { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, content, 'utf-8');
      
      logger.info(`File written: ${filePath} in workspace ${workspaceId}`);
      
      return {
        path: filePath,
        size: content.length,
        created: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error writing file:`, error);
      throw error;
    }
  }

  static async executeCommand(workspaceId, command, cwd = '.') {
    const workspace = workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    try {
      const fullCwd = path.join(workspace.path, cwd);
      logger.info(`Executing command in ${fullCwd}: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        cwd: fullCwd,
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      return {
        command,
        status: 'success',
        stdout,
        stderr,
        exitCode: 0,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error executing command:`, error);
      return {
        command,
        status: 'error',
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
        executedAt: new Date().toISOString()
      };
    }
  }

  static async deleteWorkspace(workspaceId) {
    const workspace = workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    try {
      // In production, clean up directory and any containers
      // For now, just remove from map
      workspaces.delete(workspaceId);
      logger.info(`Workspace ${workspaceId} deleted`);
    } catch (error) {
      logger.error(`Error deleting workspace:`, error);
      throw error;
    }
  }

  static async getWorkspaceStats(workspaceId) {
    const workspace = workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    try {
      const result = await this.executeCommand(workspaceId, 'du -sh .', '.');
      const sizeMatch = result.stdout.match(/^(\S+)/);

      return {
        workspaceId,
        totalSize: sizeMatch ? sizeMatch[1] : 'unknown',
        agentCount: workspace.agents.length,
        fileCount: workspace.files.length,
        containerCount: workspace.containers.length,
        createdAt: workspace.createdAt
      };
    } catch (error) {
      logger.error(`Error getting workspace stats:`, error);
      throw error;
    }
  }
}

module.exports = WorkspaceManager;
