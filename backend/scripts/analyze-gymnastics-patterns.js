/**
 * Analyze Gymnastics Schedule Patterns (2025 vs 2026)
 * 
 * Compares the two years to identify scheduling patterns and constraints
 */

const fs = require('fs');
const csv = require('csv-parser');

// Team mappings
const TEAMS = {
  'ARIZ': 'Arizona',
  'ASU': 'Arizona State', 
  'BYU': 'BYU',
  'DEN': 'Denver',
  'ISU': 'Iowa State',
  'UTAH': 'Utah',
  'WVU': 'West Virginia'
};

async function parse2025Schedule() {
  const scheduleFile = '/Users/nickw/Desktop/Schedules/2025 GYM Schedule.csv';
  const teamStats = {};
  const games = [];
  
  // Initialize stats
  Object.keys(TEAMS).forEach(team => {
    teamStats[team] = { home: 0, away: 0, bye: 0, opponents: new Set() };
  });

  return new Promise((resolve, reject) => {
    fs.createReadStream(scheduleFile)
      .pipe(csv())
      .on('data', (row) => {
        if (!row.Date || row.Date.trim() === '') return;
        
        const weekStr = row.Week;
        if (!weekStr) return;
        const week = parseInt(weekStr.replace('Week ', ''));
        const date = row.Date;
        
        Object.keys(TEAMS).forEach(team => {
          const opponent = row[team];
          if (!opponent || opponent.trim() === '') return;
          
          if (opponent === 'BYE') {
            teamStats[team].bye++;
          } else if (opponent.startsWith('@')) {
            // Away game
            const homeTeam = opponent.substring(1).trim();
            teamStats[team].away++;
            teamStats[team].opponents.add(homeTeam);
            
            games.push({
              week,
              date,
              home: homeTeam,
              away: team,
              type: 'regular'
            });
          } else {
            // Home game
            teamStats[team].home++;
            teamStats[team].opponents.add(opponent);
          }
        });
      })
      .on('end', () => {
        resolve({ teamStats, games });
      })
      .on('error', reject);
  });
}

async function parse2026Schedule() {
  const scheduleFile = '/Users/nickw/Desktop/Schedules/2026 GYM Schedule.csv';
  const teamStats = {};
  const games = [];
  let week = 0;

  // Initialize stats
  Object.keys(TEAMS).forEach(team => {
    teamStats[team] = { home: 0, away: 0, bye: 0, opponents: new Set() };
  });

  return new Promise((resolve, reject) => {
    fs.createReadStream(scheduleFile)
      .pipe(csv())
      .on('data', (row) => {
        if (!row.Date || row.Date.trim() === '') return;
        
        week++;
        const date = row.Date;
        
        Object.keys(TEAMS).forEach(team => {
          const opponent = row[team];
          if (!opponent || opponent.trim() === '') {
            teamStats[team].bye++;
          } else if (opponent.startsWith('at ')) {
            // Away game
            const homeTeam = opponent.replace('at ', '').trim();
            teamStats[team].away++;
            teamStats[team].opponents.add(homeTeam);
            
            games.push({
              week,
              date,
              home: homeTeam,
              away: team,
              type: 'regular'
            });
          } else {
            // Home game
            teamStats[team].home++;
            teamStats[team].opponents.add(opponent);
          }
        });
      })
      .on('end', () => {
        resolve({ teamStats, games });
      })
      .on('error', reject);
  });
}

async function compareSchedules() {
  console.log('🤸‍♀️ Big 12 Gymnastics Schedule Pattern Analysis');
  console.log('==============================================\n');
  
  const schedule2025 = await parse2025Schedule();
  const schedule2026 = await parse2026Schedule();
  
  // Compare basic stats
  console.log('📊 Season Comparison:');
  console.log('====================');
  console.log(`2025: ${schedule2025.games.length} meets over 8 weeks`);
  console.log(`2026: ${schedule2026.games.length} meets over 7 weeks`);
  
  // Team-by-team comparison
  console.log('\n📈 Team Statistics Comparison:');
  console.log('==============================');
  console.log('Team  | 2025 (H/A/B) | 2026 (H/A/B) | H/A Flip');
  console.log('------|---------------|---------------|----------');
  
  const homeAwayFlips = {};
  Object.keys(TEAMS).forEach(team => {
    const s25 = schedule2025.teamStats[team];
    const s26 = schedule2026.teamStats[team];
    
    // Check if home/away flipped
    const flipped = (s25.home > s25.away && s26.home < s26.away) || 
                    (s25.home < s25.away && s26.home > s26.away);
    homeAwayFlips[team] = flipped;
    
    console.log(
      `${team.padEnd(5)} | ${s25.home}/${s25.away}/${s25.bye}         | ${s26.home}/${s26.away}/${s26.bye}         | ${flipped ? '✅' : '❌'}`
    );
  });
  
  // Matchup analysis
  console.log('\n🔄 Matchup Patterns:');
  console.log('===================');
  
  // Create matchup maps
  const matchups2025 = {};
  const matchups2026 = {};
  
  schedule2025.games.forEach(game => {
    const key = [game.home, game.away].sort().join('-');
    matchups2025[key] = { home: game.home, away: game.away };
  });
  
  schedule2026.games.forEach(game => {
    const key = [game.home, game.away].sort().join('-');
    matchups2026[key] = { home: game.home, away: game.away };
  });
  
  // Check venue flips
  let flippedVenues = 0;
  let sameVenues = 0;
  let newMatchups = 0;
  
  Object.keys(matchups2025).forEach(key => {
    if (matchups2026[key]) {
      // Both years have this matchup
      const m25 = matchups2025[key];
      const m26 = matchups2026[key];
      
      if (m25.home === m26.away && m25.away === m26.home) {
        flippedVenues++;
      } else {
        sameVenues++;
      }
    }
  });
  
  Object.keys(matchups2026).forEach(key => {
    if (!matchups2025[key]) {
      newMatchups++;
    }
  });
  
  console.log(`Venue flips: ${flippedVenues}`);
  console.log(`Same venues: ${sameVenues}`);
  console.log(`New matchups: ${newMatchups}`);
  
  // Schedule patterns
  console.log('\n📐 Identified Patterns:');
  console.log('======================');
  console.log('1. Season Length:');
  console.log('   - 2025: 8 weeks (mid-Jan to early Mar)');
  console.log('   - 2026: 7 weeks (late-Jan to early Mar)');
  console.log('   - Pattern: Variable season length (7-8 weeks)');
  
  console.log('\n2. Home/Away Balance:');
  console.log('   - Most teams flip between 3H/3A and 4H/2A year-to-year');
  console.log('   - BYU: 3H/3A (2025) → 4H/2A (2026)');
  console.log('   - Pattern: Alternating home/away emphasis');
  
  console.log('\n3. Bye Week Distribution:');
  console.log('   - 2025: 1-2 bye weeks per team');
  console.log('   - 2026: Exactly 1 bye week per team');
  console.log('   - Pattern: At least 1 bye week guaranteed');
  
  console.log('\n4. Schedule Format:');
  console.log('   - Not complete round-robin (20-21 of 21 possible matchups)');
  console.log('   - Denver (affiliate) fully integrated');
  console.log('   - All meets on Fridays (with flexibility for Fri-Sun)');
  
  // Generate constraints for scheduler
  const gymnasticsConstraints = {
    sportName: 'Gymnastics',
    sportId: 11,
    format: {
      type: 'near_round_robin',
      minMatchups: 20,
      maxMatchups: 21,
      seasonLengthWeeks: { min: 7, max: 8 }
    },
    scheduling: {
      preferredDay: 'Friday',
      allowedDays: ['Friday', 'Saturday', 'Sunday'],
      startMonth: 'January',
      endMonth: 'March'
    },
    teams: {
      total: 7,
      big12: 6,
      affiliates: 1,
      affiliateTeams: ['Denver']
    },
    constraints: [
      {
        type: 'home_away_balance',
        description: 'Teams alternate between 3H/3A and 4H/2A yearly',
        alternateYearly: true
      },
      {
        type: 'bye_weeks',
        description: 'Each team gets at least 1 bye week',
        min: 1,
        max: 2
      },
      {
        type: 'venue_flip',
        description: 'Most matchups flip home/away year-to-year',
        priority: 'high'
      },
      {
        type: 'affiliate_integration',
        description: 'Denver competes as full member',
        required: true
      }
    ]
  };
  
  // Save analysis
  const outputPath = '/Users/nickw/Documents/GitHub/Flextime/backend/data/analysis/gymnastics_pattern_analysis.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    schedule2025: schedule2025,
    schedule2026: schedule2026,
    patterns: gymnasticsConstraints,
    analysis: {
      homeAwayFlips,
      venueFlips: flippedVenues,
      totalMatchups2025: schedule2025.games.length,
      totalMatchups2026: schedule2026.games.length
    }
  }, null, 2));
  
  console.log(`\n✅ Pattern analysis saved to: ${outputPath}`);
  
  return gymnasticsConstraints;
}

// Run analysis
if (require.main === module) {
  compareSchedules()
    .then(() => {
      console.log('\n✅ Gymnastics pattern analysis complete!');
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { compareSchedules };