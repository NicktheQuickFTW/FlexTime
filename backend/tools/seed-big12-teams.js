#!/usr/bin/env node
/**
 * Seed Big 12 Teams Database
 * 
 * This script populates the HELiiX database with Big 12 conference teams data.
 * Run this script to ensure the Big 12 teams are available for scheduling.
 */

const { seedBig12Teams } = require('../data/big12-teams-seed');
const logger = require('../agents/utils/logger');

// Set log level
logger.setLogLevel('info');

// Run the seed function
logger.info('Starting Big 12 Teams database seed...');

seedBig12Teams()
  .then(() => {
    logger.info('Big 12 Teams database seed completed successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Big 12 Teams database seed failed: ${error.message}`);
    process.exit(1);
  });
