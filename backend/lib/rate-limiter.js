const logger = require('../lib/logger');

/**
 * Rate limiter for API endpoints
 */
class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.requests = new Map();
  }

  /**
   * Set rate limit for endpoint
   */
  setLimit(endpoint, maxRequests, windowMs) {
    this.limits.set(endpoint, {
      maxRequests,
      windowMs
    });
    logger.info(`Rate limit set for ${endpoint}: ${maxRequests} requests per ${windowMs}ms`);
  }

  /**
   * Check if request is allowed
   */
  checkLimit(endpoint, identifier) {
    const limit = this.limits.get(endpoint);

    if (!limit) {
      return { allowed: true };
    }

    const key = `${endpoint}:${identifier}`;
    const now = Date.now();

    if (!this.requests.has(key)) {
      this.requests.set(key, {
        count: 1,
        firstRequest: now,
        resetTime: now + limit.windowMs
      });

      return { allowed: true };
    }

    const record = this.requests.get(key);

    // Reset if window expired
    if (now > record.resetTime) {
      record.count = 1;
      record.firstRequest = now;
      record.resetTime = now + limit.windowMs;
      return { allowed: true };
    }

    // Check if limit exceeded
    if (record.count >= limit.maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      };
    }

    // Increment and allow
    record.count++;
    return { allowed: true };
  }

  /**
   * Get request count for endpoint
   */
  getCount(endpoint, identifier) {
    const key = `${endpoint}:${identifier}`;
    const record = this.requests.get(key);
    return record ? record.count : 0;
  }

  /**
   * Reset limit for endpoint
   */
  reset(endpoint, identifier) {
    const key = `${endpoint}:${identifier}`;
    this.requests.delete(key);
  }

  /**
   * Clear all limits
   */
  clear() {
    this.requests.clear();
  }
}

// Singleton
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new RateLimiter();
    // Set default limits
    instance.setLimit('/api/agents', 100, 60000); // 100 requests per minute
    instance.setLimit('/api/models/generate', 50, 60000); // 50 requests per minute
    instance.setLimit('/api/auth/login', 10, 300000); // 10 requests per 5 minutes
  }
  return instance;
}

module.exports = { RateLimiter, getInstance };
