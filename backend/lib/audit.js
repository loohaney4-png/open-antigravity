const logger = require('../lib/logger');

/**
 * Audit logger for tracking important events
 */
class AuditLogger {
  constructor() {
    this.events = [];
    this.handlers = [];
  }

  /**
   * Log an event
   */
  log(event) {
    const auditEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      id: this.generateEventId()
    };

    this.events.push(auditEvent);

    // Keep only last 10000 events
    if (this.events.length > 10000) {
      this.events.shift();
    }

    // Call handlers
    for (const handler of this.handlers) {
      try {
        handler(auditEvent);
      } catch (error) {
        logger.error('Error in audit handler:', error);
      }
    }

    logger.info(`Audit: ${event.action} by ${event.userId || 'system'}`);
  }

  /**
   * Log authentication event
   */
  logAuth(action, userId, success, details = {}) {
    this.log({
      type: 'AUTH',
      action,
      userId,
      success,
      details
    });
  }

  /**
   * Log agent action
   */
  logAgent(action, userId, agentId, details = {}) {
    this.log({
      type: 'AGENT',
      action,
      userId,
      agentId,
      details
    });
  }

  /**
   * Log API call
   */
  logAPI(method, path, statusCode, userId, details = {}) {
    this.log({
      type: 'API',
      method,
      path,
      statusCode,
      userId,
      details
    });
  }

  /**
   * Log error
   */
  logError(error, context = {}) {
    this.log({
      type: 'ERROR',
      error: error.message,
      stack: error.stack,
      ...context
    });
  }

  /**
   * Register event handler
   */
  onEvent(handler) {
    this.handlers.push(handler);
  }

  /**
   * Query events
   */
  queryEvents(filters = {}) {
    let results = this.events;

    if (filters.type) {
      results = results.filter(e => e.type === filters.type);
    }

    if (filters.action) {
      results = results.filter(e => e.action === filters.action);
    }

    if (filters.userId) {
      results = results.filter(e => e.userId === filters.userId);
    }

    if (filters.since) {
      results = results.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    }

    return results;
  }

  /**
   * Get events by type
   */
  getEventsByType(type, limit = 100) {
    return this.events
      .filter(e => e.type === type)
      .slice(-limit);
  }

  /**
   * Get user activity
   */
  getUserActivity(userId, limit = 100) {
    return this.events
      .filter(e => e.userId === userId)
      .slice(-limit);
  }

  /**
   * Generate event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear audit log
   */
  clear() {
    this.events = [];
  }

  /**
   * Export audit log
   */
  export(format = 'json') {
    if (format === 'csv') {
      return this.toCSV();
    }
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Convert to CSV
   */
  toCSV() {
    if (this.events.length === 0) {
      return '';
    }

    const headers = ['timestamp', 'id', 'type', 'action', 'userId', 'success'];
    let csv = headers.join(',') + '\n';

    for (const event of this.events) {
      csv += [
        event.timestamp,
        event.id,
        event.type,
        event.action,
        event.userId || '',
        event.success || ''
      ].join(',') + '\n';
    }

    return csv;
  }
}

// Singleton
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new AuditLogger();
  }
  return instance;
}

module.exports = { AuditLogger, getInstance };
