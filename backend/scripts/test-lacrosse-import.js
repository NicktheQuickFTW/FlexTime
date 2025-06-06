/**
 * Test script for Lacrosse Schedule Import
 * 
 * Demonstrates importing the 2026 Big 12 Lacrosse schedule
 */

const ScheduleImporter = require('../services/scheduleImporter');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../lib/logger');

async function testLacrosseImport() {
  try {
    console.log('=== Testing Big 12 Lacrosse Schedule Import ===\n');
    
    // Read the lacrosse schedule file
    const filePath = '/Users/nickw/Desktop/Schedules/2026 LAX Schedule.csv';
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    console.log('File content preview:');
    console.log(fileContent.split('\n').slice(0, 3).join('\n'));
    console.log('...\n');
    
    // Import using Big 12 week-based matrix format
    const result = await ScheduleImporter.importSchedule(fileContent, 'big12-week-matrix', {
      sport_id: 13, // Lacrosse
      year: 2026
    });
    
    console.log(`✅ Successfully imported ${result.games_count} games\n`);
    
    // Display season summary
    console.log('Season Summary:');
    console.log(`- Start Date: ${result.season.start_date}`);
    console.log(`- End Date: ${result.season.end_date}`);
    console.log(`- Total Games: ${result.season.total_games}`);
    console.log(`- Teams: ${result.season.teams_count}`);
    console.log(`- Duration: ${result.season.weeks} weeks\n`);
    
    // Show all games organized by week
    console.log('Schedule by Week:');
    console.log('================');
    
    // Group games by week
    const gamesByWeek = {};
    result.games.forEach(game => {
      const week = game.week || 'Unknown';
      if (!gamesByWeek[week]) gamesByWeek[week] = [];
      gamesByWeek[week].push(game);
    });
    
    // Display each week
    Object.keys(gamesByWeek).sort().forEach(week => {
      console.log(`\n${week} (${gamesByWeek[week][0].date}):`);
      gamesByWeek[week].forEach(game => {
        const homeTeam = game.home_team?.school_name || 'Unknown';
        const awayTeam = game.away_team?.school_name || 'Unknown';
        console.log(`  ${awayTeam} @ ${homeTeam}`);
      });
    });
    
    // Analyze games per team
    console.log('\n\nGames per team:');
    console.log('===============');
    const gamesPerTeam = {};
    const homeGames = {};
    const awayGames = {};
    
    result.games.forEach(game => {
      const home = game.home_team?.school_name || game.home_team_name;
      const away = game.away_team?.school_name || game.away_team_name;
      
      if (home) {
        gamesPerTeam[home] = (gamesPerTeam[home] || 0) + 1;
        homeGames[home] = (homeGames[home] || 0) + 1;
      }
      if (away) {
        gamesPerTeam[away] = (gamesPerTeam[away] || 0) + 1;
        awayGames[away] = (awayGames[away] || 0) + 1;
      }
    });
    
    Object.entries(gamesPerTeam)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([team, count]) => {
        const home = homeGames[team] || 0;
        const away = awayGames[team] || 0;
        console.log(`  ${team}: ${count} games (${home} home, ${away} away)`);
      });
    
    // Check for missing teams or data issues
    console.log('\n\nData Quality Check:');
    console.log('==================');
    let missingTeams = 0;
    result.games.forEach(game => {
      if (!game.home_team || !game.away_team) {
        missingTeams++;
        console.log(`⚠️  Missing team data: ${game.home_team_name || game.home_team} vs ${game.away_team_name || game.away_team} on ${game.date}`);
      }
    });
    
    if (missingTeams === 0) {
      console.log('✅ All games have valid team data');
    } else {
      console.log(`⚠️  ${missingTeams} games have missing team data`);
      console.log('   This might be due to affiliate members not being in the database');
    }
    
    // Save the imported schedule
    const outputPath = path.join(__dirname, '../data/imported/lacrosse_2026.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n✅ Saved imported schedule to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    console.error(error.stack);
  }
}

// Execute test
if (require.main === module) {
  testLacrosseImport().catch(console.error);
}