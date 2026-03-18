const express = require('express');
const router = express.Router();
const { getInstance } = require('../../services/browser-automation');
const logger = require('../../lib/logger');

const browserService = getInstance();

/**
 * Create a new browser session
 * POST /api/browser/sessions
 */
router.post('/sessions', async (req, res) => {
  try {
    const { sessionId, options } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'sessionId is required'
      });
    }

    const result = await browserService.createSession(sessionId, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Create session error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * List all browser sessions
 * GET /api/browser/sessions
 */
router.get('/sessions', (req, res) => {
  try {
    const sessions = browserService.getSessions();

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error(`List sessions error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Navigate to URL
 * POST /api/browser/sessions/:sessionId/navigate
 */
router.post('/sessions/:sessionId/navigate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { url, options } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'url is required'
      });
    }

    const result = await browserService.navigate(sessionId, url, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Navigate error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Click element
 * POST /api/browser/sessions/:sessionId/click
 */
router.post('/sessions/:sessionId/click', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { selector, options } = req.body;

    if (!selector) {
      return res.status(400).json({
        error: 'selector is required'
      });
    }

    const result = await browserService.click(sessionId, selector, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Click error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Fill form input
 * POST /api/browser/sessions/:sessionId/fill
 */
router.post('/sessions/:sessionId/fill', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { selector, text, options } = req.body;

    if (!selector || text === undefined) {
      return res.status(400).json({
        error: 'selector and text are required'
      });
    }

    const result = await browserService.fill(sessionId, selector, text, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Fill error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Get text content
 * POST /api/browser/sessions/:sessionId/text
 */
router.post('/sessions/:sessionId/text', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { selector } = req.body;

    if (!selector) {
      return res.status(400).json({
        error: 'selector is required'
      });
    }

    const result = await browserService.getText(sessionId, selector);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`getText error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Evaluate JavaScript in page
 * POST /api/browser/sessions/:sessionId/evaluate
 */
router.post('/sessions/:sessionId/evaluate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { script, args } = req.body;

    if (!script) {
      return res.status(400).json({
        error: 'script is required'
      });
    }

    const result = await browserService.evaluate(sessionId, script, args);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Evaluate error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Take screenshot
 * POST /api/browser/sessions/:sessionId/screenshot
 */
router.post('/sessions/:sessionId/screenshot', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { options } = req.body;

    const result = await browserService.screenshot(sessionId, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Screenshot error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Get screenshot image
 * GET /api/browser/sessions/:sessionId/screenshot/:screenshotId
 */
router.get('/sessions/:sessionId/screenshot/:screenshotId', (req, res) => {
  try {
    const { sessionId, screenshotId } = req.params;

    const buffer = browserService.getScreenshot(sessionId, screenshotId);

    res.type('image/png');
    res.send(buffer);
  } catch (error) {
    logger.error(`Get screenshot error: ${error.message}`);
    res.status(404).json({
      error: error.message
    });
  }
});

/**
 * Get page content
 * GET /api/browser/sessions/:sessionId/content
 */
router.get('/sessions/:sessionId/content', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await browserService.getContent(sessionId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get content error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Wait for selector
 * POST /api/browser/sessions/:sessionId/wait
 */
router.post('/sessions/:sessionId/wait', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { selector, options } = req.body;

    if (!selector) {
      return res.status(400).json({
        error: 'selector is required'
      });
    }

    const result = await browserService.waitForSelector(sessionId, selector, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Wait error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Get page metadata
 * GET /api/browser/sessions/:sessionId/metadata
 */
router.get('/sessions/:sessionId/metadata', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await browserService.getMetadata(sessionId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get metadata error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Close session
 * DELETE /api/browser/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await browserService.closeSession(sessionId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Close session error: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
