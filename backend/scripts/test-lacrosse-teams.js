/**
 * Test script to verify lacrosse teams are properly loaded
 */

const Big12DataService = require('../services/big12DataService');

console.log('=== Testing Lacrosse Teams ===\n');

// Get all lacrosse teams
const lacrosseTeams = Big12DataService.getTeams({ sport_id: 13 });

console.log(`Found ${lacrosseTeams.length} lacrosse teams:\n`);

lacrosseTeams.forEach(team => {
  console.log(`Team ID: ${team.team_id}`);
  console.log(`Name: ${team.name}`);
  console.log(`School: ${team.school_name} (${team.school_abbreviation})`);
  console.log(`School ID: ${team.school_id}`);
  console.log(`Conference Status: ${team.conference_status || 'full_member'}`);
  console.log('---');
});

// Test finding teams by name
console.log('\nTesting team lookup by name:');
const testNames = ['Cincinnati', 'Florida', 'UC Davis', 'San Diego State', 'Arizona State', 'Colorado'];

testNames.forEach(name => {
  const found = lacrosseTeams.find(t => 
    t.school_name === name || 
    t.school_short === name ||
    t.school_name.includes(name)
  );
  console.log(`${name}: ${found ? 'FOUND ✓' : 'NOT FOUND ✗'}`);
});

// Test abbreviation lookup
console.log('\nTesting abbreviation lookup:');
const testAbbrevs = ['CIN', 'UF', 'FLA', 'UCD', 'SDSU', 'ASU', 'COL'];

testAbbrevs.forEach(abbrev => {
  const found = lacrosseTeams.find(t => t.school_abbreviation === abbrev);
  console.log(`${abbrev}: ${found ? `FOUND ✓ (${found.school_name})` : 'NOT FOUND ✗'}`);
});