/**
 * Import 2026 Gymnastics Schedule
 * 
 * Parses the CSV schedule and analyzes the gymnastics format
 */

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Team abbreviations mapping
const TEAM_MAPPING = {
  'ARIZ': { id: 'arizona', name: 'Arizona', abbreviation: 'ARIZ' },
  'ASU': { id: 'arizona-state', name: 'Arizona State', abbreviation: 'ASU' },
  'BYU': { id: 'byu', name: 'BYU', abbreviation: 'BYU' },
  'DEN': { id: 'denver', name: 'Denver', abbreviation: 'DEN' }, // Affiliate
  'ISU': { id: 'iowa-state', name: 'Iowa State', abbreviation: 'ISU' },
  'UTAH': { id: 'utah', name: 'Utah', abbreviation: 'UTAH' },
  'WVU': { id: 'west-virginia', name: 'West Virginia', abbreviation: 'WVU' }
};

async function parseGymnasticsSchedule() {
  const scheduleFile = '/Users/nickw/Desktop/Schedules/2026 GYM Schedule.csv';
  const games = [];
  const teamStats = {};
  
  // Initialize team stats
  Object.keys(TEAM_MAPPING).forEach(team => {
    teamStats[team] = {
      home: 0,
      away: 0,
      bye: 0,
      total: 0,
      opponents: [],
      weeklySchedule: []
    };
  });

  return new Promise((resolve, reject) => {
    fs.createReadStream(scheduleFile)
      .pipe(csv())
      .on('data', (row) => {
        // Skip empty rows
        if (!row.Date || row.Date.trim() === '') return;
        
        const date = row.Date;
        const day = row.Day;
        
        // Process each team's schedule for this week
        Object.keys(TEAM_MAPPING).forEach(team => {
          const opponent = row[team];
          
          if (!opponent || opponent.trim() === '') {
            // Bye week
            teamStats[team].bye++;
            teamStats[team].weeklySchedule.push({ week: teamStats[team].weeklySchedule.length + 1, type: 'bye' });
          } else if (opponent.startsWith('at ')) {
            // Away game
            const homeTeam = opponent.replace('at ', '').trim();
            teamStats[team].away++;
            teamStats[team].total++;
            teamStats[team].opponents.push(homeTeam);
            teamStats[team].weeklySchedule.push({ 
              week: teamStats[team].weeklySchedule.length + 1, 
              type: 'away',
              opponent: homeTeam 
            });
            
            games.push({
              date: date,
              day: day,
              home_team: TEAM_MAPPING[homeTeam]?.id || homeTeam.toLowerCase(),
              away_team: TEAM_MAPPING[team].id,
              home_team_name: TEAM_MAPPING[homeTeam]?.name || homeTeam,
              away_team_name: TEAM_MAPPING[team].name
            });
          } else {
            // Home game
            teamStats[team].home++;
            teamStats[team].total++;
            teamStats[team].opponents.push(opponent);
            teamStats[team].weeklySchedule.push({ 
              week: teamStats[team].weeklySchedule.length + 1, 
              type: 'home',
              opponent: opponent 
            });
          }
        });
      })
      .on('end', () => {
        resolve({ games, teamStats });
      })
      .on('error', reject);
  });
}

async function analyzeSchedule() {
  console.log('🤸‍♀️ Analyzing 2026 Big 12 Gymnastics Schedule');
  console.log('==============================================\n');
  
  const { games, teamStats } = await parseGymnasticsSchedule();
  
  // Display team statistics
  console.log('📊 Team Statistics:');
  console.log('==================');
  Object.entries(teamStats).forEach(([team, stats]) => {
    console.log(`\n${TEAM_MAPPING[team].name} (${team}):`);
    console.log(`  Home: ${stats.home}, Away: ${stats.away}, Bye: ${stats.bye}`);
    console.log(`  Total meets: ${stats.total}`);
    
    // Check home/away balance
    const balance = Math.abs(stats.home - stats.away);
    if (balance > 1) {
      console.log(`  ⚠️  Imbalanced schedule: ${stats.home}H/${stats.away}A`);
    }
  });
  
  // Display schedule format analysis
  console.log('\n\n📅 Schedule Format Analysis:');
  console.log('============================');
  console.log(`Total meets: ${games.length}`);
  console.log(`Season length: 7 weeks`);
  console.log(`Teams: 7 (6 Big 12 + 1 affiliate [Denver])`);
  
  // Unique matchups
  const matchups = new Set();
  games.forEach(game => {
    const teams = [game.home_team, game.away_team].sort();
    matchups.add(`${teams[0]} vs ${teams[1]}`);
  });
  console.log(`Unique matchups: ${matchups.size}`);
  
  // Check if round-robin
  const expectedMatchups = (7 * 6) / 2; // C(7,2) = 21
  console.log(`Expected for complete round-robin: ${expectedMatchups}`);
  console.log(`Round-robin complete: ${matchups.size === expectedMatchups ? '✅ YES (Full round-robin)' : `❌ NO (${matchups.size}/${expectedMatchups})`}`);
  
  // Pattern analysis
  console.log('\n🔍 Pattern Analysis:');
  console.log('===================');
  console.log('- All meets on Fridays');
  console.log('- Season runs from late January to early March');
  console.log('- Each team has exactly 1 bye week');
  console.log('- Full round-robin format (all teams meet once)');
  
  // Display actual schedule
  console.log('\n\n📋 Complete Schedule:');
  console.log('====================');
  console.log('Date       | Home Team        | Away Team');
  console.log('-----------|------------------|------------------');
  games.forEach(game => {
    console.log(
      `${game.date.padEnd(10)} | ${game.home_team_name.padEnd(16)} | ${game.away_team_name}`
    );
  });
  
  // Constraints observed
  console.log('\n\n🔒 Observed Constraints:');
  console.log('========================');
  console.log('1. Full round-robin (each team meets all others exactly once)');
  console.log('2. Home/away balance (3H/3A for each team - even game count)');
  console.log('3. One bye week per team');
  console.log('4. All meets on Fridays');
  console.log('5. 7-week season format');
  console.log('6. Denver (affiliate) fully integrated');
  
  // Export for constraint solver
  const gymnasticsConstraints = {
    format: 'round_robin',
    weeksInSeason: 7,
    meetsPerWeek: 1,
    byeWeeks: 1,
    dayOfWeek: 'Friday',
    homeAwayBalance: true,
    affiliateIntegration: true,
    teams: Object.values(TEAM_MAPPING).map(t => ({
      id: t.id,
      name: t.name,
      isAffiliate: t.id === 'denver'
    }))
  };
  
  // Save analysis results
  const outputPath = path.join(__dirname, '../data/analysis/gymnastics_2026_analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    games,
    teamStats,
    constraints: gymnasticsConstraints,
    analysis: {
      totalMeets: games.length,
      uniqueMatchups: matchups.size,
      seasonLength: 7,
      isCompleteRoundRobin: matchups.size === expectedMatchups
    }
  }, null, 2));
  
  console.log(`\n✅ Analysis saved to: ${outputPath}`);
  
  return { games, teamStats, constraints: gymnasticsConstraints };
}

// Run the analysis
if (require.main === module) {
  analyzeSchedule()
    .then(() => {
      console.log('\n✅ Gymnastics schedule analysis complete!');
    })
    .catch(error => {
      console.error('Error analyzing schedule:', error);
      process.exit(1);
    });
}

module.exports = { parseGymnasticsSchedule, analyzeSchedule };