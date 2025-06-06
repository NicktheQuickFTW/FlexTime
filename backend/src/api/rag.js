/**
 * RAG API Routes
 * 
 * These routes provide access to the School Data RAG Agent
 */

const express = require('express');
const router = express.Router();
const SchoolDataAgent = require('../agents/rag/school_data_agent');
const logger = require("../../lib/logger");

// Initialize the agent
let agentInstance = null;

// Get the global agent instance (lazy initialization)
async function getAgent() {
  if (!agentInstance) {
    logger.info('Initializing School Data RAG Agent for API use');
    
    // Create agent instance
    agentInstance = new SchoolDataAgent();
    
    // Load schools from file or database
    // In a real app, you'd connect to your database here
    const schools = [
      { id: 'school_1', name: 'University of Texas' },
      { id: 'school_2', name: 'University of Oklahoma' },
      { id: 'school_3', name: 'Texas Tech University' },
      { id: 'school_4', name: 'Baylor University' }
    ];
    
    // Initialize agent with schools
    await agentInstance.initialize(schools);
    
    // Load mock data for testing
    for (const school of schools) {
      for (const dataType of ['team_info', 'schedule', 'constraints', 'preferences']) {
        await agentInstance.updateSchoolData(school.id, dataType, 'mock');
      }
    }
    
    logger.info('School Data RAG Agent initialized with test data');
  }
  
  return agentInstance;
}

/**
 * @api {get} /api/rag/schools Get all schools
 * @apiName GetSchools
 * @apiGroup RAG
 * @apiDescription Get all schools available in the RAG agent
 */
router.get('/schools', async (req, res) => {
  try {
    const agent = await getAgent();
    const schools = agent.getSchools();
    
    res.json({
      success: true,
      data: schools
    });
  } catch (error) {
    logger.error(`Error getting schools: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @api {get} /api/rag/schools/:schoolId Get school
 * @apiName GetSchool
 * @apiGroup RAG
 * @apiDescription Get a specific school by ID
 */
router.get('/schools/:schoolId', async (req, res) => {
  try {
    const agent = await getAgent();
    const school = agent.getSchool(req.params.schoolId);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }
    
    res.json({
      success: true,
      data: school
    });
  } catch (error) {
    logger.error(`Error getting school: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @api {get} /api/rag/data/:schoolId/:dataType Get school data
 * @apiName GetSchoolData
 * @apiGroup RAG
 * @apiDescription Get raw data for a specific school and data type
 */
router.get('/data/:schoolId/:dataType', async (req, res) => {
  try {
    const agent = await getAgent();
    const data = agent.getRawData(req.params.schoolId, req.params.dataType);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Data not found'
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error(`Error getting school data: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @api {post} /api/rag/query Query data
 * @apiName QueryData
 * @apiGroup RAG
 * @apiDescription Query data across all schools or specific schools
 * @apiBody {String} query The query to run
 * @apiBody {Array} [schoolIds] Optional array of school IDs to query
 * @apiBody {String} [dataType] Optional data type to query
 */
router.post('/query', async (req, res) => {
  try {
    const { query, schoolIds, dataType } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    const agent = await getAgent();
    const result = await agent.query(query, schoolIds, dataType);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error querying data: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @api {post} /api/rag/data/:schoolId/:dataType Update school data
 * @apiName UpdateSchoolData
 * @apiGroup RAG
 * @apiDescription Update data for a specific school and data type
 * @apiBody {Object} data The data to update
 */
router.post('/data/:schoolId/:dataType', async (req, res) => {
  try {
    const { schoolId, dataType } = req.params;
    const data = req.body.data;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required'
      });
    }
    
    const agent = await getAgent();
    
    // Save data to temporary file
    const fs = require('fs');
    const path = require('path');
    const tempDir = path.join(__dirname, '../temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, `${schoolId}_${dataType}_${Date.now()}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(data));
    
    // Update school data
    const success = await agent.updateSchoolData(schoolId, dataType, `file://${tempFile}`);
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update school data'
      });
    }
    
    res.json({
      success: true,
      message: `Updated ${dataType} data for ${schoolId}`
    });
  } catch (error) {
    logger.error(`Error updating school data: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;