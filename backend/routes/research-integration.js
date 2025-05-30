/**
 * Research Integration API Routes
 * 
 * Provides REST API endpoints for managing research-to-COMPASS integration
 */

const express = require('express');
const router = express.Router();
const ResearchCompassIntegration = require('../services/researchCompassIntegration');

// Initialize integration service
let integrationService = null;

const initializeService = async (req) => {
  if (!integrationService) {
    integrationService = new ResearchCompassIntegration(req.app.get('sequelize'));
    await integrationService.initialize();
  }
  return integrationService;
};

/**
 * GET /api/research-integration/status
 * Get integration service status
 */
router.get('/status', async (req, res) => {
  try {
    const service = await initializeService(req);
    
    res.json({
      status: 'active',
      inputDirectory: service.inputDir,
      outputDirectory: service.outputDir,
      stats: service.stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting integration status:', error);
    res.status(500).json({ 
      error: 'Failed to get integration status',
      message: error.message 
    });
  }
});

/**
 * POST /api/research-integration/process
 * Trigger processing of all research files
 */
router.post('/process', async (req, res) => {
  try {
    const service = await initializeService(req);
    
    console.log('🔄 API triggered research processing...');
    
    // Process all files
    await service.processAllResearchFiles();
    
    res.json({
      success: true,
      message: 'Research files processed successfully',
      stats: service.stats,
      processedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing research files:', error);
    res.status(500).json({ 
      error: 'Failed to process research files',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/research-integration/process-file
 * Process a specific research file
 */
router.post('/process-file', async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ 
        error: 'Filename is required' 
      });
    }
    
    const service = await initializeService(req);
    
    console.log(`🔄 API triggered processing of file: ${filename}`);
    
    // Process specific file
    await service.processResearchFile(filename);
    
    res.json({
      success: true,
      message: `File ${filename} processed successfully`,
      stats: service.stats,
      processedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`Error processing file ${req.body.filename}:`, error);
    res.status(500).json({ 
      error: 'Failed to process research file',
      message: error.message,
      filename: req.body.filename
    });
  }
});

/**
 * GET /api/research-integration/files
 * List available research files
 */
router.get('/files', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const service = await initializeService(req);
    
    // Get files from input directory
    const files = await fs.readdir(service.inputDir);
    const researchFiles = files.filter(file => 
      file.endsWith('.json') && 
      (file.includes('research') || file.includes('analysis'))
    );
    
    // Get file stats
    const fileStats = [];
    for (const file of researchFiles) {
      const filePath = require('path').join(service.inputDir, file);
      const stats = await fs.stat(filePath);
      fileStats.push({
        filename: file,
        size: stats.size,
        lastModified: stats.mtime,
        created: stats.birthtime
      });
    }
    
    res.json({
      files: fileStats,
      totalFiles: fileStats.length,
      inputDirectory: service.inputDir
    });
    
  } catch (error) {
    console.error('Error listing research files:', error);
    res.status(500).json({ 
      error: 'Failed to list research files',
      message: error.message 
    });
  }
});

/**
 * GET /api/research-integration/processed
 * List processed files and results
 */
router.get('/processed', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const service = await initializeService(req);
    
    const processedDir = path.join(service.outputDir, 'processed');
    
    try {
      const files = await fs.readdir(processedDir);
      const processedFiles = files.filter(file => file.endsWith('.json'));
      
      const fileStats = [];
      for (const file of processedFiles) {
        const filePath = path.join(processedDir, file);
        const stats = await fs.stat(filePath);
        
        // Read file content for summary
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        fileStats.push({
          filename: file,
          size: stats.size,
          lastModified: stats.mtime,
          sport: data.sport,
          teamsCount: data.teams?.length || 0,
          processedAt: data.processedAt
        });
      }
      
      res.json({
        processedFiles: fileStats,
        totalFiles: fileStats.length,
        outputDirectory: processedDir
      });
      
    } catch (dirError) {
      // Directory doesn't exist yet
      res.json({
        processedFiles: [],
        totalFiles: 0,
        outputDirectory: processedDir,
        note: 'No processed files yet'
      });
    }
    
  } catch (error) {
    console.error('Error listing processed files:', error);
    res.status(500).json({ 
      error: 'Failed to list processed files',
      message: error.message 
    });
  }
});

/**
 * GET /api/research-integration/compass-ratings
 * Get COMPASS ratings from database
 */
router.get('/compass-ratings', async (req, res) => {
  try {
    const service = await initializeService(req);
    const { sport, team } = req.query;
    
    // Build query conditions
    const whereConditions = {};
    if (sport) whereConditions.sport = sport;
    if (team) {
      // Find team ID first
      const teamRecord = await service.Team.findOne({
        where: { name: { [req.app.get('sequelize').Sequelize.Op.iLike]: `%${team}%` } }
      });
      if (teamRecord) {
        whereConditions.team_id = teamRecord.team_id;
      }
    }
    
    // Get COMPASS ratings with team information
    const ratings = await service.models.TeamRating.findAll({
      where: whereConditions,
      include: [{
        model: service.Team,
        as: 'team',
        attributes: ['name', 'conference', 'division']
      }],
      order: [['raw_rating', 'DESC']],
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    });
    
    res.json({
      ratings: ratings.map(rating => ({
        teamName: rating.team?.name || 'Unknown',
        sport: rating.sport,
        compassRating: rating.raw_rating,
        normalizedRating: rating.normalized_rating,
        percentile: rating.percentile,
        tier: rating.tier,
        components: rating.rating_components,
        confidence: rating.prediction_confidence,
        lastUpdated: rating.last_updated
      })),
      totalRatings: ratings.length,
      filters: { sport, team }
    });
    
  } catch (error) {
    console.error('Error getting COMPASS ratings:', error);
    res.status(500).json({ 
      error: 'Failed to get COMPASS ratings',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/research-integration/reset
 * Reset integration data (development only)
 */
router.delete('/reset', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      error: 'Reset not allowed in production' 
    });
  }
  
  try {
    const service = await initializeService(req);
    
    // Clear COMPASS ratings
    await service.models.TeamRating.destroy({ where: {} });
    
    // Reset stats
    service.stats = {
      filesProcessed: 0,
      teamsUpdated: 0,
      ratingsCreated: 0,
      errors: []
    };
    
    res.json({
      success: true,
      message: 'Integration data reset successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error resetting integration data:', error);
    res.status(500).json({ 
      error: 'Failed to reset integration data',
      message: error.message 
    });
  }
});

module.exports = router;