const fs = require('fs');
const { Pool } = require('pg');
const path = require('path');

// Database connection string
const connectionString = 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require';

async function generateScheduleMatrix() {
  try {
    // Read the schedule JSON data
    const schedulePath = path.join(__dirname, 'test-results/schedule-Football-2025-05-08.json');
    const scheduleData = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    
    // Connect to database to get team names
    const pool = new Pool({ connectionString });
    
    // Get all football teams
    const teamsResult = await pool.query('SELECT team_id, name FROM teams WHERE sport_id = 8');
    const teams = teamsResult.rows;
    
    // Create a mapping of ID to name
    const idToNameMap = {};
    teams.forEach(team => {
      idToNameMap[team.team_id] = team.name;
    });
    
    // Get all the venues
    const venueResult = await pool.query('SELECT venue_id, name FROM venues');
    const venues = venueResult.rows;
    
    // Create venue ID to name mapping
    const venueIdToNameMap = {};
    venues.forEach(venue => {
      venueIdToNameMap[venue.venue_id] = venue.name;
    });
    
    console.log('Schedule for Big 12 Football 2025-2026 Season');
    console.log('========================================\n');
    
    // Print the games
    console.log('GAMES LIST:');
    const games = scheduleData.games || [];
    games.forEach((game, index) => {
      const homeTeam = idToNameMap[game.homeTeam] || `Team ID ${game.homeTeam}`;
      const awayTeam = idToNameMap[game.awayTeam] || `Team ID ${game.awayTeam}`;
      const venue = venueIdToNameMap[game.venue] || `Venue ID ${game.venue}`;
      console.log(`Game ${index + 1}: ${homeTeam} vs ${awayTeam} on ${game.date} at ${venue}`);
    });
    
    console.log('\nSCHEDULE MATRIX:');
    console.log('(Row: Home Team, Column: Away Team)\n');
    
    // Create a matrix of all teams against each other
    const teamIds = Object.keys(idToNameMap).map(id => parseInt(id));
    teamIds.sort((a, b) => a - b); // Sort IDs numerically
    
    // Create matrix headers
    const matrix = [];
    const headerRow = ['Team'];
    
    // Add team names as column headers
    teamIds.forEach(id => {
      headerRow.push(idToNameMap[id] || `Team ${id}`);
    });
    matrix.push(headerRow);
    
    // Fill matrix with game dates
    teamIds.forEach(homeId => {
      const row = [idToNameMap[homeId] || `Team ${homeId}`];
      
      teamIds.forEach(awayId => {
        if (homeId === awayId) {
          row.push('X'); // Diagonal element (team doesn't play against itself)
        } else {
          // Find games between these teams
          const homeVsAwayGames = games.filter(g => 
            g.homeTeam === homeId && g.awayTeam === awayId);
          
          if (homeVsAwayGames.length > 0) {
            row.push(homeVsAwayGames.map(g => g.date).join(', '));
          } else {
            row.push(''); // No game scheduled
          }
        }
      });
      
      matrix.push(row);
    });
    
    // Calculate column widths for proper alignment
    const colWidths = [];
    for (let col = 0; col < matrix[0].length; col++) {
      const colValues = matrix.map(row => String(row[col] || ''));
      const maxWidth = Math.max(...colValues.map(val => val.length));
      colWidths[col] = maxWidth + 2; // Add padding
    }
    
    // Print header with proper alignment
    console.log(matrix[0].map((val, i) => String(val).padEnd(colWidths[i])).join('| '));
    
    // Print separator
    console.log(colWidths.map(w => '-'.repeat(w)).join('+-'));
    
    // Print rows
    for (let i = 1; i < matrix.length; i++) {
      console.log(matrix[i].map((val, j) => String(val).padEnd(colWidths[j])).join('| '));
    }
    
    // Generate CSV output
    const csvPath = path.join(__dirname, 'test-results/schedule-Football-2025-05-08.csv');
    let csvContent = '';
    
    // Add header row
    csvContent += matrix[0].join(',') + '\n';
    
    // Add data rows
    for (let i = 1; i < matrix.length; i++) {
      csvContent += matrix[i].map(val => {
        // If the value contains a comma, wrap it in quotes
        return val.includes(',') ? `"${val}"` : val;
      }).join(',') + '\n';
    }
    
    // Write CSV file
    fs.writeFileSync(csvPath, csvContent);
    console.log(`\nCSV file saved to: ${csvPath}`);
    
    // Generate a games list CSV
    const gamesListPath = path.join(__dirname, 'test-results/games-list-Football-2025-05-08.csv');
    let gamesListContent = 'Game Number,Home Team,Away Team,Date,Venue\n';
    
    games.forEach((game, index) => {
      const homeTeam = idToNameMap[game.homeTeam] || `Team ID ${game.homeTeam}`;
      const awayTeam = idToNameMap[game.awayTeam] || `Team ID ${game.awayTeam}`;
      const venue = venueIdToNameMap[game.venue] || `Venue ID ${game.venue}`;
      gamesListContent += `${index + 1},"${homeTeam}","${awayTeam}",${game.date},"${venue}"\n`;
    });
    
    // Write games list CSV file
    fs.writeFileSync(gamesListPath, gamesListContent);
    console.log(`Games list CSV saved to: ${gamesListPath}`);
    
    await pool.end();
  } catch (error) {
    console.error('Error generating schedule matrix:', error);
  }
}

generateScheduleMatrix();
