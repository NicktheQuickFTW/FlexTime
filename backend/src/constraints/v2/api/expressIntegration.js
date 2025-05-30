/**
 * Express Integration for Constraint Management API v2
 * 
 * This file provides the bridge between the TypeScript constraint API
 * and the existing JavaScript Express backend.
 */

// Import the compiled TypeScript API
const { createConstraintAPI } = require('./index');

/**
 * Register the constraint management API with an Express app
 * @param {Object} app - Express application instance
 * @param {string} basePath - Base path for the API (default: /api/v2/constraints)
 */
function registerConstraintAPI(app, basePath = '/api/v2/constraints') {
  try {
    // Create the constraint API router
    const constraintAPI = createConstraintAPI();
    
    // Mount the API at the specified base path
    app.use(basePath, constraintAPI);
    
    console.log(`✅ Constraint Management API v2 registered at ${basePath}`);
    
    // Log available endpoints
    console.log('Available endpoints:');
    console.log(`  GET    ${basePath}/health`);
    console.log(`  GET    ${basePath}/docs`);
    console.log(`  GET    ${basePath}/constraints`);
    console.log(`  POST   ${basePath}/constraints`);
    console.log(`  GET    ${basePath}/constraints/:id`);
    console.log(`  PUT    ${basePath}/constraints/:id`);
    console.log(`  DELETE ${basePath}/constraints/:id`);
    console.log(`  POST   ${basePath}/constraints/evaluate`);
    console.log(`  POST   ${basePath}/constraints/bulk`);
    console.log(`  GET    ${basePath}/templates`);
    console.log(`  GET    ${basePath}/export`);
    console.log(`  POST   ${basePath}/import`);
    
  } catch (error) {
    console.error('❌ Failed to register Constraint Management API:', error);
    throw error;
  }
}

/**
 * Create a standalone Express app with the constraint API
 * Useful for testing or running as a microservice
 */
function createStandaloneApp() {
  const express = require('express');
  const app = express();
  
  // Register the constraint API
  registerConstraintAPI(app);
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'FlexTime Constraint Management API',
      version: '2.0',
      documentation: '/api/v2/constraints/docs'
    });
  });
  
  return app;
}

/**
 * Middleware to check if constraint API is available
 */
function constraintAPICheck(req, res, next) {
  req.hasConstraintAPI = true;
  req.constraintAPIVersion = '2.0';
  next();
}

module.exports = {
  registerConstraintAPI,
  createStandaloneApp,
  constraintAPICheck
};