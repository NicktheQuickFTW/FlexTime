/**
 * Run the School Data RAG Agent
 * 
 * This script runs the School Data RAG Agent with real data from the database
 * or a specified data source.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { program } = require('commander');
const SchoolDataAgent = require('../agents/rag/school_data_agent');
const logger = require('../scripts/logger');

// Parse command line arguments
program
  .option('-d, --data-source <source>', 'Data source (db, file, or mock)', 'mock')
  .option('-q, --query <query>', 'Query to run against the agent')
  .option('-s, --school <schoolId>', 'Specific school ID to query')
  .option('-o, --output <file>', 'Output file path for results')
  .option('-v, --verbose', 'Enable verbose logging')
  .parse(process.argv);

const options = program.opts();

// Create output directory
const outputDir = path.join(__dirname, '../results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Set up output file path
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = options.output || path.join(outputDir, `rag-results-${timestamp}.json`);

// Configure schools
async function getSchools() {
  if (options.dataSource === 'db') {
    // In a real implementation, this would load schools from the database
    const db = require('../models/db');
    const schools = await db.models.School.findAll();
    return schools.map(school => ({
      id: school.id,
      name: school.name
    }));
  } else if (options.dataSource === 'file') {
    // Load schools from file
    const filePath = path.join(__dirname, '../data/schools.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data.schools || [];
    } else {
      logger.warn(`Schools file not found: ${filePath}`);
      return getDefaultSchools();
    }
  } else {
    // Use default mock schools
    return getDefaultSchools();
  }
}

// Default schools for testing
function getDefaultSchools() {
  return [
    { id: 'school_1', name: 'University of Texas' },
    { id: 'school_2', name: 'University of Oklahoma' },
    { id: 'school_3', name: 'Texas Tech University' },
    { id: 'school_4', name: 'Baylor University' },
    { id: 'school_5', name: 'TCU' },
    { id: 'school_6', name: 'West Virginia University' },
    { id: 'school_7', name: 'Iowa State University' },
    { id: 'school_8', name: 'Kansas State University' },
    { id: 'school_9', name: 'University of Kansas' },
    { id: 'school_10', name: 'Oklahoma State University' },
    { id: 'school_11', name: 'University of Cincinnati' },
    { id: 'school_12', name: 'University of Houston' },
    { id: 'school_13', name: 'UCF' },
    { id: 'school_14', name: 'BYU' },
    { id: 'school_15', name: 'Arizona' },
    { id: 'school_16', name: 'Arizona State' },
    { id: 'school_17', name: 'Colorado' },
    { id: 'school_18', name: 'Utah' }
  ];
}

// The data types to load for each school
const dataTypes = [
  'team_info',
  'schedule',
  'venue_availability',
  'constraints',
  'preferences'
];

// Default queries if none provided
const defaultQueries = [
  'What are the conference schedules for all Big 12 schools?',
  'Which schools have venue conflicts in November and December?',
  'What are the scheduling constraints for Oklahoma and Texas?',
  'How many consecutive away games do schools prefer to have at maximum?',
  'Which schools have final exam conflicts in December?'
];

/**
 * Run the School Data RAG Agent
 */
async function runSchoolDataAgent() {
  console.log('=== FlexTime School Data RAG Agent ===\n');
  
  // Initialize agent
  const agent = new SchoolDataAgent({
    dataDirectory: path.join(__dirname, '../data/school_data'),
    cacheExpiration: 60 * 60 * 1000, // 1 hour
    searchResultLimit: 15
  });
  
  // Load schools
  const schools = await getSchools();
  console.log(`Initializing agent with ${schools.length} schools...`);
  await agent.initialize(schools);
  
  // Load data for each school
  for (const school of schools) {
    console.log(`\nLoading data for ${school.name}:`);
    
    for (const dataType of dataTypes) {
      const success = await agent.updateSchoolData(school.id, dataType, options.dataSource);
      console.log(`  - ${dataType}: ${success ? 'Success' : 'Failed'}`);
    }
  }
  
  // Run queries
  console.log('\n=== Running Queries ===\n');
  
  const results = [];
  const queries = options.query ? [options.query] : defaultQueries;
  const targetSchools = options.school ? [options.school] : null;
  
  for (const query of queries) {
    console.log(`Query: "${query}"`);
    
    try {
      const result = await agent.query(query, targetSchools);
      
      // Log response
      console.log(`\nResponse:\n${result.response}\n`);
      console.log(`Sources: ${result.sources.length} relevant documents found`);
      
      // Add to results
      results.push({
        query,
        targetSchools,
        response: result.response,
        sourceCount: result.sources.length,
        sources: result.sources.map(s => ({
          school: s.schoolName,
          dataType: s.dataType,
          relevance: s.relevance
        }))
      });
      
      console.log('\n---\n');
    } catch (error) {
      console.error(`Error with query "${query}": ${error.message}`);
      
      // Add failed query to results
      results.push({
        query,
        targetSchools,
        error: error.message
      });
    }
  }
  
  // Save results to file
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  
  console.log(`\nResults saved to: ${outputFile}`);
  console.log('\n=== School Data RAG Agent Complete ===');
  
  return results;
}

// Run the agent
runSchoolDataAgent().catch(error => {
  console.error('Error running School Data RAG Agent:', error);
  process.exit(1);
});