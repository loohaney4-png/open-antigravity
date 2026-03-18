const { getInstance: getMetrics } = require('../lib/metrics');
const { getInstance: getRateLimiter } = require('../lib/rate-limiter');
const { getInstance: getAudit } = require('../lib/audit');
const logger = require('../lib/logger');

/**
 * Metrics middleware - track all API requests
 */
function metricsMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();
    const metrics = getMetrics();

    // Store original send
    const originalSend = res.send;

    // Override send to capture response
    res.send = function(data) {
      const duration = Date.now() - startTime;
      metrics.recordRequest(req.path, res.statusCode, duration);

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Rate limiting middleware
 */
function rateLimitMiddleware() {
  return (req, res, next) => {
    const limiter = getRateLimiter();
    const identifier = req.ip || req.connection.remoteAddress;

    const result = limiter.checkLimit(req.path, identifier);

    if (!result.allowed) {
      res.set('Retry-After', result.retryAfter);
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: result.retryAfter
      });
    }

    next();
  };
}

/**
 * Audit middleware - log important events
 */
function auditMiddleware() {
  return (req, res, next) => {
    const audit = getAudit();

    // Store original send
    const originalSend = res.send;

    res.send = function(data) {
      // Log API calls to audit log
      if (req.user) {
        audit.logAPI(req.method, req.path, res.statusCode, req.user.id, {
          query: req.query,
          userAgent: req.get('User-Agent')
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Error handling middleware with audit
 */
function errorMiddleware() {
  return (err, req, res, next) => {
    const audit = getAudit();

    logger.error('Unhandled error:', err);

    // Audit the error
    audit.logError(err, {
      endpoint: req.path,
      method: req.method,
      userId: req.user?.id
    });

    res.status(500).json({
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message
    });
  };
}

/**
 * Request logging middleware
 */
function loggingMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();

    // Log on response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      logger[level](
        `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
      );
    });

    next();
  };
}

/**
 * Request validation middleware
 */
function validationMiddleware() {
  return (req, res, next) => {
    // Validate JSON content
    if (req.contentType === 'application/json' && req.body) {
      if (typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }

    // Validate request size
    if (req.headers['content-length'] > 10 * 1024 * 1024) { // 10MB limit
      return res.status(413).json({ error: 'Request payload too large' });
    }

    next();
  };
}

/**
 * CORS and security headers middleware
 */
function securityMiddleware() {
  return (req, res, next) => {
    // Security headers
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // CORS
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

    if (allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Credentials', 'true');
    }

    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  };
}

module.exports = {
  metricsMiddleware,
  rateLimitMiddleware,
  auditMiddleware,
  errorMiddleware,
  loggingMiddleware,
  validationMiddleware,
  securityMiddleware
};
