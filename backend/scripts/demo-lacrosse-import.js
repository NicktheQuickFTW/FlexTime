/**
 * Demo script to test importing a lacrosse schedule with affiliate teams
 */

const fs = require('fs');
const path = require('path');
const Big12DataService = require('../services/big12DataService');
const ScheduleImporter = require('../services/scheduleImporter');

// Sample lacrosse schedule data (2026 season)
// Note: Using SD for San Diego State (not SDSU) based on BIG12_COMPLETE_DATA.js
const lacrosseScheduleCSV = `WEEK,DATE,Cincinnati,Colorado,Arizona State,Florida,San Diego State,UC Davis
1,Feb 7-8,@Colorado,Cincinnati,,,,
,,"@ UC Davis",,@San Diego State,,Arizona State,Cincinnati
2,Feb 14-15,Florida,@Arizona State,Colorado,@Cincinnati,UC Davis,@San Diego State
3,Feb 21-22,San Diego State,UC Davis,@Florida,Arizona State,@Cincinnati,@Colorado
4,Feb 28-Mar 1,,Florida,UC Davis,@Colorado,@Arizona State,@Arizona State
,,Arizona State,San Diego State,Cincinnati,,Colorado,@Florida
5,Mar 7-8,@UC Davis,,,San Diego State,Cincinnati,Cincinnati
,,Colorado,@Florida,@Cincinnati,Colorado,@UC Davis,
6,Mar 14-15,@Arizona State,@Cincinnati,Cincinnati,UC Davis,Florida,@Florida
,,,,,,,@San Diego State
7,Mar 21-22,@San Diego State,@UC Davis,Colorado,Arizona State,Cincinnati,Colorado
8,Mar 28-29,,,Florida,@Arizona State,@Colorado,San Diego State
,,UC Davis,Arizona State,@San Diego State,Cincinnati,@Florida,@Cincinnati
9,Apr 4-5,@Florida,,,@UC Davis,Arizona State,Florida
,,,@San Diego State,UC Davis,@Colorado,Colorado,@Arizona State`;

async function testLacrosseImport() {
  console.log('=== Testing Lacrosse Schedule Import ===\n');
  
  // Get all lacrosse teams
  const lacrosseTeams = Big12DataService.getTeams({ sport_id: 13 });
  console.log(`Found ${lacrosseTeams.length} lacrosse teams:`);
  lacrosseTeams.forEach(team => {
    console.log(`- ${team.school_abbreviation}: ${team.school_name} (${team.conference_status || 'full_member'})`);
  });
  
  // Create importer
  const importer = new ScheduleImporter();
  
  // Parse the schedule
  console.log('\n=== Parsing Schedule ===');
  const result = await importer.parseSchedule(lacrosseScheduleCSV, 'big12-week-matrix', {
    sport_id: 13,
    season: '2026'
  });
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(err => console.log(`- ${err}`));
  }
  
  console.log(`\nSuccessfully parsed ${result.games.length} games`);
  
  // Show first 10 games
  console.log('\nFirst 10 games:');
  result.games.slice(0, 10).forEach((game, idx) => {
    const homeTeam = Big12DataService.getTeamById(game.home_team_id);
    const awayTeam = Big12DataService.getTeamById(game.away_team_id);
    
    console.log(`${idx + 1}. ${game.date} - ${awayTeam.school_abbreviation} @ ${homeTeam.school_abbreviation}`);
  });
  
  // Verify all teams have games
  console.log('\n=== Game Count by Team ===');
  const teamGameCounts = {};
  lacrosseTeams.forEach(team => {
    teamGameCounts[team.team_id] = { 
      team: team.school_abbreviation, 
      home: 0, 
      away: 0, 
      total: 0 
    };
  });
  
  result.games.forEach(game => {
    if (teamGameCounts[game.home_team_id]) {
      teamGameCounts[game.home_team_id].home++;
      teamGameCounts[game.home_team_id].total++;
    }
    if (teamGameCounts[game.away_team_id]) {
      teamGameCounts[game.away_team_id].away++;
      teamGameCounts[game.away_team_id].total++;
    }
  });
  
  Object.values(teamGameCounts).forEach(count => {
    console.log(`${count.team}: ${count.total} games (${count.home} home, ${count.away} away)`);
  });
  
  // Save the imported schedule
  const outputDir = path.join(__dirname, '../data/exports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, 'lacrosse_2026_imported.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nSchedule saved to: ${outputPath}`);
}

// Run the test
testLacrosseImport().catch(console.error);