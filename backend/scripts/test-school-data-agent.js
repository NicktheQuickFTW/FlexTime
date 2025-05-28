/**
 * Test script for the School Data RAG Agent
 * 
 * Demonstrates the capabilities of the School Data RAG Agent by initializing 
 * it with test schools, loading mock data, and running test queries.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const SchoolDataAgent = require('../agents/rag/school_data_agent');

// Create output directory for test results
const outputDir = path.join(__dirname, '../test-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Test schools
const testSchools = [
  { id: 'school_1', name: 'Central University' },
  { id: 'school_2', name: 'State College' },
  { id: 'school_3', name: 'Tech Institute' },
  { id: 'school_4', name: 'City University' }
];

// Test data types
const dataTypes = [
  'team_info',
  'schedule',
  'venue_availability',
  'constraints',
  'preferences'
];

// Test queries
const testQueries = [
  'What are the scheduling constraints for Central University?',
  'When is Memorial Arena unavailable?',
  'How many consecutive away games does State College prefer?',
  'What is the capacity of Tech Institute\'s primary venue?',
  'When do City University and Central University play each other?',
  'What are the preferred game days across all schools?',
  'Which schools have final exam conflicts in December?',
  'What are the venue requirements for all schools?'
];

/**
 * Run the School Data RAG Agent test
 */
async function runSchoolDataAgentTest() {
  console.log('=== School Data RAG Agent Test ===\n');
  
  // Initialize agent
  const agent = new SchoolDataAgent({
    dataDirectory: path.join(__dirname, '../test-data/school_data'),
    cacheExpiration: 10 * 60 * 1000, // 10 minutes
    searchResultLimit: 10
  });
  
  console.log(`Initializing agent with ${testSchools.length} schools...`);
  await agent.initialize(testSchools);
  
  // Load mock data for each school
  for (const school of testSchools) {
    console.log(`\nLoading data for ${school.name}:`);
    
    for (const dataType of dataTypes) {
      const success = await agent.updateSchoolData(school.id, dataType, 'mock');
      console.log(`  - ${dataType}: ${success ? 'Success' : 'Failed'}`);
    }
  }
  
  // Run test queries
  console.log('\n=== Running Test Queries ===\n');
  
  const results = [];
  
  for (const query of testQueries) {
    console.log(`Query: "${query}"`);
    
    try {
      const result = await agent.query(query);
      
      // Log brief response
      console.log(`Response: ${result.response.split('\n')[0]}...`);
      console.log(`Sources: ${result.sources.length} relevant documents found`);
      
      // Add to results
      results.push({
        query,
        response: result.response,
        sourceCount: result.sources.length,
        topSource: result.sources.length > 0 ? {
          school: result.sources[0].schoolName,
          dataType: result.sources[0].dataType,
          relevance: result.sources[0].relevance
        } : null
      });
      
      console.log('\n---\n');
    } catch (error) {
      console.error(`Error with query "${query}": ${error.message}`);
      
      // Add failed query to results
      results.push({
        query,
        error: error.message
      });
    }
  }
  
  // Test specific school queries
  console.log('\n=== Running School-Specific Queries ===\n');
  
  const schoolSpecificQueries = [
    { query: 'What is the schedule for Central University?', schoolIds: ['school_1'] },
    { query: 'What are the venue constraints for Tech Institute?', schoolIds: ['school_3'] },
    { query: 'Compare the constraints between State College and City University', schoolIds: ['school_2', 'school_4'] }
  ];
  
  for (const { query, schoolIds } of schoolSpecificQueries) {
    console.log(`Query: "${query}" (Schools: ${schoolIds.map(id => agent.getSchool(id).name).join(', ')})`);
    
    try {
      const result = await agent.query(query, schoolIds);
      
      // Log brief response
      console.log(`Response: ${result.response.split('\n')[0]}...`);
      console.log(`Sources: ${result.sources.length} relevant documents found`);
      
      // Add to results
      results.push({
        query,
        schoolIds,
        response: result.response,
        sourceCount: result.sources.length,
        topSource: result.sources.length > 0 ? {
          school: result.sources[0].schoolName,
          dataType: result.sources[0].dataType,
          relevance: result.sources[0].relevance
        } : null
      });
      
      console.log('\n---\n');
    } catch (error) {
      console.error(`Error with query "${query}": ${error.message}`);
      
      // Add failed query to results
      results.push({
        query,
        schoolIds,
        error: error.message
      });
    }
  }
  
  // Save results to file
  const outputFile = path.join(outputDir, `school-data-rag-test-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  
  console.log(`\nTest results saved to: ${outputFile}`);
  console.log('\n=== School Data RAG Agent Test Complete ===');
}

// Run the test
runSchoolDataAgentTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});