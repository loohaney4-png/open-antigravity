const logger = require('../../lib/logger');

/**
 * Browser automation service for agents
 * Allows agents to interact with web applications
 */
class BrowserAutomation {
  constructor() {
    this.browsers = new Map();
    this.sessions = new Map();
  }

  /**
   * Create a new browser session
   */
  async createSession(sessionId, options = {}) {
    try {
      // Check if playwright is available
      let playwright;
      try {
        playwright = require('playwright');
      } catch (e) {
        throw new Error('Playwright not installed. Run: npm install playwright');
      }

      const browserType = options.browserType || 'chromium';
      const browser = await playwright[browserType].launch({
        headless: options.headless !== false
      });

      const context = await browser.newContext({
        viewport: options.viewport || { width: 1280, height: 720 },
        userAgent: options.userAgent || 'Mozilla/5.0 (compatible; OpenAntigravity)'
      });

      const page = await context.newPage();

      const session = {
        id: sessionId,
        browser,
        context,
        page,
        created: new Date(),
        url: null,
        screenshots: [],
        recordings: []
      };

      this.sessions.set(sessionId, session);
      logger.info(`Browser session created: ${sessionId}`);

      return {
        sessionId,
        status: 'ready'
      };
    } catch (error) {
      logger.error(`Failed to create browser session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Navigate to a URL
   */
  async navigate(sessionId, url, options = {}) {
    const session = this.getSession(sessionId);

    try {
      await session.page.goto(url, {
        waitUntil: options.waitUntil || 'networkidle',
        timeout: options.timeout || 30000
      });

      session.url = url;
      logger.info(`Navigated to ${url}`);

      return {
        url,
        title: await session.page.title(),
        status: 'success'
      };
    } catch (error) {
      logger.error(`Navigation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Click an element
   */
  async click(sessionId, selector, options = {}) {
    const session = this.getSession(sessionId);

    try {
      await session.page.click(selector, {
        timeout: options.timeout || 5000,
        force: options.force || false
      });

      logger.info(`Clicked: ${selector}`);

      return {
        selector,
        status: 'success'
      };
    } catch (error) {
      logger.error(`Click failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fill form input
   */
  async fill(sessionId, selector, text, options = {}) {
    const session = this.getSession(sessionId);

    try {
      await session.page.fill(selector, text, {
        timeout: options.timeout || 5000
      });

      logger.info(`Filled: ${selector}`);

      return {
        selector,
        text: text.substring(0, 50), // Log safely
        status: 'success'
      };
    } catch (error) {
      logger.error(`Fill failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract text content
   */
  async getText(sessionId, selector) {
    const session = this.getSession(sessionId);

    try {
      const text = await session.page.textContent(selector);

      return {
        selector,
        text: text || '',
        status: 'success'
      };
    } catch (error) {
      logger.error(`getText failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Evaluate JavaScript in page
   */
  async evaluate(sessionId, script, args = []) {
    const session = this.getSession(sessionId);

    try {
      const result = await session.page.evaluate(script, ...args);

      return {
        result,
        status: 'success'
      };
    } catch (error) {
      logger.error(`Evaluation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(sessionId, options = {}) {
    const session = this.getSession(sessionId);

    try {
      const buffer = await session.page.screenshot({
        fullPage: options.fullPage || false,
        path: options.path
      });

      const screenshotId = `screenshot_${Date.now()}`;
      session.screenshots.push({
        id: screenshotId,
        timestamp: new Date(),
        url: session.url,
        buffer
      });

      logger.info(`Screenshot taken: ${screenshotId}`);

      return {
        screenshotId,
        url: session.url,
        status: 'success'
      };
    } catch (error) {
      logger.error(`Screenshot failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get page content
   */
  async getContent(sessionId) {
    const session = this.getSession(sessionId);

    try {
      const html = await session.page.content();
      const title = await session.page.title();

      return {
        html,
        title,
        url: session.url,
        status: 'success'
      };
    } catch (error) {
      logger.error(`getContent failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Wait for element
   */
  async waitForSelector(sessionId, selector, options = {}) {
    const session = this.getSession(sessionId);

    try {
      await session.page.waitForSelector(selector, {
        timeout: options.timeout || 5000,
        state: options.state || 'attached'
      });

      return {
        selector,
        status: 'found'
      };
    } catch (error) {
      logger.error(`waitForSelector failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get page metadata
   */
  async getMetadata(sessionId) {
    const session = this.getSession(sessionId);

    try {
      const title = await session.page.title();
      const url = session.page.url();
      const html = await session.page.content();

      return {
        title,
        url,
        htmlLength: html.length,
        screenshots: session.screenshots.length,
        status: 'success'
      };
    } catch (error) {
      logger.error(`getMetadata failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close session
   */
  async closeSession(sessionId) {
    const session = this.getSession(sessionId);

    try {
      await session.page.close();
      await session.context.close();
      await session.browser.close();

      this.sessions.delete(sessionId);
      logger.info(`Browser session closed: ${sessionId}`);

      return {
        sessionId,
        status: 'closed'
      };
    } catch (error) {
      logger.error(`Close session failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get session
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Browser session not found: ${sessionId}`);
    }
    return session;
  }

  /**
   * List all sessions
   */
  getSessions() {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      url: session.url,
      created: session.created,
      screenshots: session.screenshots.length
    }));
  }

  /**
   * Get screenshot
   */
  getScreenshot(sessionId, screenshotId) {
    const session = this.getSession(sessionId);
    const screenshot = session.screenshots.find(s => s.id === screenshotId);

    if (!screenshot) {
      throw new Error(`Screenshot not found: ${screenshotId}`);
    }

    return screenshot.buffer;
  }
}

// Singleton
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new BrowserAutomation();
  }
  return instance;
}

module.exports = { BrowserAutomation, getInstance };
