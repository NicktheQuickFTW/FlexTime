/**
 * Knowledge Graph API for FlexTime
 * 
 * This module provides REST API endpoints for accessing Knowledge Graph capabilities,
 * enabling front-end applications to utilize enhanced data analysis and insights.
 */

const express = require('express');
const router = express.Router();
const logger = require('../scripts/logger');

/**
 * Initialize Knowledge Graph API routes
 * 
 * @param {Object} dependencies - API dependencies
 * @returns {Object} Express router with configured routes
 */
function initializeRoutes(dependencies) {
  const { knowledgeGraphAgent, conflictExplanation } = dependencies;
  
  if (!knowledgeGraphAgent) {
    logger.error('Knowledge Graph Agent is required for Knowledge Graph API');
    throw new Error('Knowledge Graph Agent is required for API initialization');
  }
  
  /**
   * @route GET /api/knowledge-graph/health
   * @description Check the health status of the Knowledge Graph service
   * @access Public
   */
  router.get('/health', async (req, res) => {
    try {
      const status = {
        service: 'knowledge-graph',
        status: 'ok',
        timestamp: new Date().toISOString(),
        enabled: knowledgeGraphAgent.config.enabled
      };
      
      return res.json(status);
    } catch (error) {
      logger.error(`Health check failed: ${error.message}`);
      return res.status(500).json({
        error: 'Health check failed',
        message: error.message
      });
    }
  });
  
  /**
   * @route POST /api/knowledge-graph/entities
   * @description Add an entity to the knowledge graph
   * @access Private
   */
  router.post('/entities', async (req, res) => {
    try {
      const { entityType, entityData } = req.body;
      
      if (!entityType) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'entityType is required'
        });
      }
      
      if (!entityData) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'entityData is required'
        });
      }
      
      const entity = await knowledgeGraphAgent.addEntity(entityType, entityData);
      
      return res.status(201).json({
        success: true,
        entity
      });
    } catch (error) {
      logger.error(`Failed to add entity: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to add entity',
        message: error.message
      });
    }
  });
  
  /**
   * @route POST /api/knowledge-graph/relationships
   * @description Add a relationship between entities in the knowledge graph
   * @access Private
   */
  router.post('/relationships', async (req, res) => {
    try {
      const { sourceId, relationshipType, targetId, properties } = req.body;
      
      if (!sourceId || !relationshipType || !targetId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'sourceId, relationshipType, and targetId are required'
        });
      }
      
      const relationship = await knowledgeGraphAgent.addRelationship(
        sourceId,
        relationshipType,
        targetId,
        properties || {}
      );
      
      return res.status(201).json({
        success: true,
        relationship
      });
    } catch (error) {
      logger.error(`Failed to add relationship: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to add relationship',
        message: error.message
      });
    }
  });
  
  /**
   * @route POST /api/knowledge-graph/query
   * @description Query the knowledge graph
   * @access Private
   */
  router.post('/query', async (req, res) => {
    try {
      const { query, options } = req.body;
      
      if (!query) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'query is required'
        });
      }
      
      const results = await knowledgeGraphAgent.query(query, options || {});
      
      return res.json({
        success: true,
        results
      });
    } catch (error) {
      logger.error(`Failed to query knowledge graph: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to query knowledge graph',
        message: error.message
      });
    }
  });
  
  /**
   * @route POST /api/knowledge-graph/import-schedule
   * @description Import a schedule into the knowledge graph
   * @access Private
   */
  router.post('/import-schedule', async (req, res) => {
    try {
      const { schedule, options } = req.body;
      
      if (!schedule) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'schedule is required'
        });
      }
      
      const importResults = await knowledgeGraphAgent.importSchedule(schedule, options || {});
      
      return res.json({
        success: true,
        results: importResults
      });
    } catch (error) {
      logger.error(`Failed to import schedule: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to import schedule',
        message: error.message
      });
    }
  });
  
  /**
   * @route GET /api/knowledge-graph/schedule/:scheduleId/conflicts
   * @description Find conflicts in a schedule using knowledge graph analysis
   * @access Private
   */
  router.get('/schedule/:scheduleId/conflicts', async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const options = req.query || {};
      
      const conflicts = await knowledgeGraphAgent.findConflicts(scheduleId, options);
      
      return res.json({
        success: true,
        scheduleId,
        conflicts
      });
    } catch (error) {
      logger.error(`Failed to find conflicts: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to find conflicts',
        message: error.message
      });
    }
  });
  
  /**
   * @route GET /api/knowledge-graph/schedule/:scheduleId/insights
   * @description Generate insights about a schedule using the knowledge graph
   * @access Private
   */
  router.get('/schedule/:scheduleId/insights', async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const options = req.query || {};
      
      const insights = await knowledgeGraphAgent.generateScheduleInsights(scheduleId, options);
      
      return res.json({
        success: true,
        scheduleId,
        insights
      });
    } catch (error) {
      logger.error(`Failed to generate schedule insights: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to generate schedule insights',
        message: error.message
      });
    }
  });
  
  /**
   * @route POST /api/knowledge-graph/conflicts/explain
   * @description Generate a detailed explanation for a conflict using the knowledge graph
   * @access Private
   */
  router.post('/conflicts/explain', async (req, res) => {
    try {
      const { conflict, context } = req.body;
      
      if (!conflict) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'conflict is required'
        });
      }
      
      // Ensure conflict explanation module is available
      if (!conflictExplanation) {
        return res.status(500).json({
          error: 'Service unavailable',
          message: 'Conflict explanation service is not available'
        });
      }
      
      const explanation = await conflictExplanation.explainConflict(conflict, context || {});
      
      return res.json({
        success: true,
        explanation
      });
    } catch (error) {
      logger.error(`Failed to explain conflict: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to explain conflict',
        message: error.message
      });
    }
  });
  
  /**
   * @route POST /api/knowledge-graph/analyze-relationships
   * @description Analyze relationships between scheduling entities
   * @access Private
   */
  router.post('/analyze-relationships', async (req, res) => {
    try {
      const { parameters } = req.body;
      
      if (!parameters) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'parameters is required'
        });
      }
      
      const analysis = await knowledgeGraphAgent.analyzeRelationships(parameters);
      
      return res.json({
        success: true,
        analysis
      });
    } catch (error) {
      logger.error(`Failed to analyze relationships: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to analyze relationships',
        message: error.message
      });
    }
  });
  
  return router;
}

module.exports = {
  initializeRoutes
};
