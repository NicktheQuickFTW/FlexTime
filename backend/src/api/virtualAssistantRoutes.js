/**
 * Virtual Assistant API Routes
 * 
 * This module provides API routes for the Virtual Assistant Service,
 * replacing the external ElevenLabs dependencies.
 */

const express = require('express');
const router = express.Router();
const VirtualAssistantService = require('../services/virtualAssistantService');
const logger = require("../../lib/logger");

// Create service instance
const virtualAssistantService = new VirtualAssistantService();

// Initialize service
(async () => {
  try {
    await virtualAssistantService.initialize();
    logger.info('Virtual Assistant Service initialized for API routes');
  } catch (error) {
    logger.error(`Failed to initialize Virtual Assistant Service for API routes: ${error.message}`);
  }
})();

// Status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'active',
    message: 'Virtual Assistant Service is active',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Documentation and recommendation routes
router.post('/resolve-library-id', async (req, res) => {
  try {
    const { libraryName } = req.body;
    
    if (!libraryName) {
      return res.status(400).json({
        success: false,
        error: 'libraryName is required'
      });
    }
    
    const result = await virtualAssistantService.resolveLibraryId(libraryName);
    res.json(result);
  } catch (error) {
    logger.error(`Error resolving library ID: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/get-library-docs', async (req, res) => {
  try {
    const { libraryId, tokens, topic } = req.body;
    
    if (!libraryId) {
      return res.status(400).json({
        success: false,
        error: 'libraryId is required'
      });
    }
    
    const result = await virtualAssistantService.getLibraryDocs(libraryId, { tokens, topic });
    res.json(result);
  } catch (error) {
    logger.error(`Error getting library docs: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/detect-patterns', async (req, res) => {
  try {
    const result = await virtualAssistantService.detectPatterns(req.body);
    res.json(result);
  } catch (error) {
    logger.error(`Error detecting patterns: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/generate-recommendations', async (req, res) => {
  try {
    const result = await virtualAssistantService.generateRecommendations(req.body);
    res.json(result);
  } catch (error) {
    logger.error(`Error generating recommendations: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Virtual Assistant routes
router.get('/voices', async (req, res) => {
  try {
    const result = await virtualAssistantService.getAvailableVoices();
    res.json(result);
  } catch (error) {
    logger.error(`Error getting available voices: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/models', async (req, res) => {
  try {
    const result = await virtualAssistantService.getAvailableModels();
    res.json(result);
  } catch (error) {
    logger.error(`Error getting available models: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/conversations', async (req, res) => {
  try {
    const result = await virtualAssistantService.startConversation(req.body);
    res.json(result);
  } catch (error) {
    logger.error(`Error starting conversation: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const result = await virtualAssistantService.addMessage(conversationId, req.body);
    res.json(result);
  } catch (error) {
    logger.error(`Error adding message: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/conversations/:conversationId/end', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const result = await virtualAssistantService.endConversation(conversationId);
    res.json(result);
  } catch (error) {
    logger.error(`Error ending conversation: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Shutdown handler for cleanup
process.on('SIGTERM', async () => {
  try {
    await virtualAssistantService.shutdown();
    logger.info('Virtual Assistant Service shut down gracefully');
  } catch (error) {
    logger.error(`Error shutting down Virtual Assistant Service: ${error.message}`);
  }
});

module.exports = router;