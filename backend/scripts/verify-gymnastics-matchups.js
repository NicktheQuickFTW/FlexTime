const csv = require('csv-parser');
const fs = require('fs');

async function countUniqueMatchups() {
  const games = [];
  const matchups = new Set();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('/Users/nickw/Desktop/Schedules/GYM/2026 GYM Schedule.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (!row.Date || row.Date.trim() === '') return;
        
        const teams = ['ARIZ', 'ASU', 'BYU', 'DEN', 'ISU', 'UTAH', 'WVU'];
        
        teams.forEach(team => {
          const opponent = row[team];
          if (!opponent || opponent.trim() === '') return;
          
          if (opponent.startsWith('at ')) {
            const homeTeam = opponent.replace('at ', '').trim();
            const matchup = [team, homeTeam].sort().join('-');
            matchups.add(matchup);
            games.push({ home: homeTeam, away: team });
          } else {
            const matchup = [team, opponent].sort().join('-');
            matchups.add(matchup);
            games.push({ home: team, away: opponent });
          }
        });
      })
      .on('end', () => {
        console.log('2026 Gymnastics Schedule Analysis:');
        console.log('==================================');
        console.log('Unique matchups found:', matchups.size);
        console.log('Total games:', games.length / 2); // Divide by 2 because each game is counted twice
        console.log('\nAll matchups:');
        [...matchups].sort().forEach(m => console.log('  -', m));
        
        console.log('\nMissing matchup (if any):');
        
        // Check which matchup is missing
        const allTeams = ['ARIZ', 'ASU', 'BYU', 'DEN', 'ISU', 'UTAH', 'WVU'];
        let missing = false;
        for (let i = 0; i < allTeams.length; i++) {
          for (let j = i + 1; j < allTeams.length; j++) {
            const matchup = [allTeams[i], allTeams[j]].sort().join('-');
            if (!matchups.has(matchup)) {
              console.log('  Missing:', matchup);
              missing = true;
            }
          }
        }
        
        if (!missing) {
          console.log('  None - Full round-robin complete!');
        }
        
        // Verify it's 21 matchups for 7 teams
        const expected = (7 * 6) / 2;
        console.log(`\nExpected matchups for 7 teams: ${expected}`);
        console.log(`Actual matchups: ${matchups.size}`);
        console.log(`Status: ${matchups.size === expected ? '✅ Full round-robin' : '❌ Not full round-robin'}`);
        
        resolve();
      })
      .on('error', reject);
  });
}

countUniqueMatchups().catch(console.error);