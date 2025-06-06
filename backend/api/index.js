/**
 * FlexTime API Router
 * 
 * This module bootstraps and initializes all API routes for the FlexTime application.
 */

const express = require('express');
const logger = require('../scripts/logger');
const scheduleRoutes = require('./schedule_api');
const teamRoutes = require('./team_api');
const venueRoutes = require('./venue_api');
const constraintRoutes = require('./constraint_api');
const reportRoutes = require('./report_api');
const adminRoutes = require('./admin_api');
const knowledgeGraphRoutes = require('./knowledge_graph_api');
// C7 Enhanced Routes removed
// const c7EnhancedRoutes = require('./c7_enhanced_api_routes');

/**
 * Initialize the API router
 * 
 * @param {Object} app - Express application
 * @param {Object} agents - Agent instances
 * @returns {express.Router} Router instance
 */
function initializeApi(app, agents) {
  logger.info('Initializing FlexTime API');
  
  // Apply global middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Initialize all route modules
  scheduleRoutes.initializeRoutes(app, agents);
  teamRoutes.initializeRoutes(app, agents);
  venueRoutes.initializeRoutes(app, agents);
  constraintRoutes.initializeRoutes(app, agents);
  reportRoutes.initializeRoutes(app, agents);
  adminRoutes.initializeRoutes(app, agents);
  
  // Initialize Knowledge Graph API
  knowledgeGraphRoutes.initializeRoutes(app, agents);
  
  // Context7 Enhanced API routes removed
  // c7EnhancedRoutes.initializeRoutes(app, agents);
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      version: process.env.VERSION || '1.0.0',
      timestamp: new Date().toISOString()
    });
  });
  
  logger.info('FlexTime API initialization complete');
  return app;
}

module.exports = { initializeApi };
