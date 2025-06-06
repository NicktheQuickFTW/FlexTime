/**
 * Analyze 2026 Women's Tennis Schedule
 * 
 * Parse and analyze the Women's Tennis schedule to understand format and constraints
 */

const fs = require('fs');
const csv = require('csv-parser');

// Big 12 Women's Tennis Teams (16 teams - all Big 12 members)
// Using actual column names from CSV
const TEAMS = [
  'ARIZ', 'ASU', 'BU', 'BYU', 'CIN', 'COL', 'UH', 'ISU',
  'KU', 'KSU', 'OSU', 'TCU', 'TTU', 'UCF', 'UTAH', 'WVU'
];

const TEAM_MAPPING = {
  'ARIZ': { id: 'arizona', name: 'Arizona' },
  'ASU': { id: 'arizona-state', name: 'Arizona State' },
  'BU': { id: 'baylor', name: 'Baylor' },
  'BYU': { id: 'byu', name: 'BYU' },
  'CIN': { id: 'cincinnati', name: 'Cincinnati' },
  'COL': { id: 'colorado', name: 'Colorado' },
  'UH': { id: 'houston', name: 'Houston' },
  'ISU': { id: 'iowa-state', name: 'Iowa State' },
  'KU': { id: 'kansas', name: 'Kansas' },
  'KSU': { id: 'kansas-state', name: 'Kansas State' },
  'OSU': { id: 'oklahoma-state', name: 'Oklahoma State' },
  'TCU': { id: 'tcu', name: 'TCU' },
  'TTU': { id: 'texas-tech', name: 'Texas Tech' },
  'UCF': { id: 'ucf', name: 'UCF' },
  'UTAH': { id: 'utah', name: 'Utah' },
  'WVU': { id: 'west-virginia', name: 'West Virginia' }
};

async function parseWomensTennisSchedule() {
  const scheduleFile = '/Users/nickw/Desktop/Schedules/WTN/2026 WTN Schedule.csv';
  const matches = [];
  const teamStats = {};
  const weeks = [];
  
  // Initialize team stats
  TEAMS.forEach(team => {
    teamStats[team] = {
      home: 0,
      away: 0,
      total: 0,
      opponents: new Set(),
      weeklySchedule: [],
      consecutiveAway: 0,
      maxConsecutiveAway: 0,
      consecutiveHome: 0,
      maxConsecutiveHome: 0
    };
  });

  return new Promise((resolve, reject) => {
    fs.createReadStream(scheduleFile)
      .pipe(csv())
      .on('data', (row) => {
        // Skip empty rows
        if (!row.Date || row.Date.trim() === '') return;
        
        const weekData = {
          date: row.Date,
          day: row.Day,
          weekNum: weeks.length + 1,
          matches: []
        };
        
        // Process each team's schedule for this week
        TEAMS.forEach(team => {
          const matchup = row[team];
          
          if (!matchup || matchup.trim() === '' || matchup === 'BYE') {
            // No match this week
            teamStats[team].weeklySchedule.push({ 
              week: weekData.weekNum, 
              type: 'bye',
              date: row.Date 
            });
          } else if (matchup.startsWith('at ') || matchup.startsWith('@')) {
            // Away match
            const homeTeam = matchup.replace(/^(at |@)/, '').trim();
            teamStats[team].away++;
            teamStats[team].total++;
            teamStats[team].opponents.add(homeTeam);
            teamStats[team].weeklySchedule.push({ 
              week: weekData.weekNum, 
              type: 'away',
              opponent: homeTeam,
              date: row.Date 
            });
            
            // Update consecutive tracking
            teamStats[team].consecutiveAway++;
            teamStats[team].consecutiveHome = 0;
            teamStats[team].maxConsecutiveAway = Math.max(
              teamStats[team].maxConsecutiveAway, 
              teamStats[team].consecutiveAway
            );
            
            // Only add if not already added (prevent duplicates)
            const matchKey = `${homeTeam}-${team}`;
            if (!weekData.matches.some(m => m.key === matchKey)) {
              weekData.matches.push({
                key: matchKey,
                home: homeTeam,
                away: team,
                date: row.Date
              });
              
              matches.push({
                date: row.Date,
                day: row.Day,
                week: weekData.weekNum,
                home_team: TEAM_MAPPING[homeTeam]?.id || homeTeam.toLowerCase(),
                away_team: TEAM_MAPPING[team].id,
                home_team_name: TEAM_MAPPING[homeTeam]?.name || homeTeam,
                away_team_name: TEAM_MAPPING[team].name
              });
            }
          } else {
            // Home match
            teamStats[team].home++;
            teamStats[team].total++;
            teamStats[team].opponents.add(matchup);
            teamStats[team].weeklySchedule.push({ 
              week: weekData.weekNum, 
              type: 'home',
              opponent: matchup,
              date: row.Date 
            });
            
            // Update consecutive tracking
            teamStats[team].consecutiveHome++;
            teamStats[team].consecutiveAway = 0;
            teamStats[team].maxConsecutiveHome = Math.max(
              teamStats[team].maxConsecutiveHome, 
              teamStats[team].consecutiveHome
            );
          }
        });
        
        weeks.push(weekData);
      })
      .on('end', () => {
        resolve({ matches, teamStats, weeks });
      })
      .on('error', reject);
  });
}

async function analyzeSchedule() {
  console.log('🎾 Analyzing 2026 Big 12 Women\'s Tennis Schedule');
  console.log('=================================================\n');
  
  const { matches, teamStats, weeks } = await parseWomensTennisSchedule();
  
  // Display basic statistics
  console.log('📊 Overall Statistics:');
  console.log('=====================');
  console.log(`Total teams: ${TEAMS.length}`);
  console.log(`Total matches: ${matches.length}`);
  console.log(`Season length: ${weeks.length} weeks`);
  console.log(`Schedule period: ${weeks[0].date} to ${weeks[weeks.length-1].date}\n`);
  
  // Team statistics
  console.log('📈 Team Statistics:');
  console.log('==================');
  console.log('Team  | Total | Home | Away | H/A Balance | Max Consec Away | Max Consec Home');
  console.log('------|-------|------|------|-------------|-----------------|----------------');
  
  let totalGamesPerTeam = null;
  let hasBalanceIssues = false;
  
  TEAMS.forEach(team => {
    const stats = teamStats[team];
    const balance = Math.abs(stats.home - stats.away);
    const balanceStr = balance <= 1 ? '✅' : `⚠️  ${balance}`;
    
    console.log(
      `${team.padEnd(5)} | ${stats.total.toString().padStart(5)} | ${stats.home.toString().padStart(4)} | ${stats.away.toString().padStart(4)} | ${balanceStr.padStart(11)} | ${stats.maxConsecutiveAway.toString().padStart(15)} | ${stats.maxConsecutiveHome.toString().padStart(15)}`
    );
    
    if (totalGamesPerTeam === null) {
      totalGamesPerTeam = stats.total;
    } else if (stats.total !== totalGamesPerTeam) {
      console.log(`⚠️  ${team} has different number of games: ${stats.total}`);
    }
    
    if (balance > 1) {
      hasBalanceIssues = true;
    }
  });
  
  // Matchup analysis
  console.log('\n🔄 Matchup Analysis:');
  console.log('===================');
  const uniqueMatchups = new Set();
  matches.forEach(match => {
    const teams = [match.home_team, match.away_team].sort();
    uniqueMatchups.add(`${teams[0]}-${teams[1]}`);
  });
  
  const possibleMatchups = (TEAMS.length * (TEAMS.length - 1)) / 2;
  console.log(`Unique matchups: ${uniqueMatchups.size}`);
  console.log(`Possible matchups (complete round-robin): ${possibleMatchups}`);
  console.log(`Coverage: ${((uniqueMatchups.size / possibleMatchups) * 100).toFixed(1)}%`);
  
  // Check if near round-robin
  const isNearRoundRobin = uniqueMatchups.size >= possibleMatchups * 0.45 && uniqueMatchups.size <= possibleMatchups * 0.55;
  console.log(`Format: ${isNearRoundRobin ? 'Near round-robin (~50% of matchups)' : 'Partial schedule'}`);
  
  // Weekly distribution
  console.log('\n📅 Weekly Distribution:');
  console.log('======================');
  console.log('Week | Date       | Day | Matches');
  console.log('-----|------------|-----|--------');
  weeks.forEach((week, idx) => {
    console.log(
      `${(idx + 1).toString().padStart(4)} | ${week.date.padEnd(10)} | ${(week.day || '').padEnd(3)} | ${week.matches.length.toString().padStart(7)}`
    );
  });
  
  // Day of week analysis
  console.log('\n📆 Day of Week Distribution:');
  console.log('============================');
  const dayCount = {};
  matches.forEach(match => {
    dayCount[match.day] = (dayCount[match.day] || 0) + 1;
  });
  Object.entries(dayCount).sort((a, b) => b[1] - a[1]).forEach(([day, count]) => {
    console.log(`${day || 'Unknown'}: ${count} matches (${((count/matches.length)*100).toFixed(1)}%)`);
  });
  
  // Home/Away pattern analysis
  console.log('\n🏠 Home/Away Patterns:');
  console.log('=====================');
  console.log(`Games per team: ${totalGamesPerTeam}`);
  console.log(`Expected balance: ${totalGamesPerTeam % 2 === 0 ? 'Perfect (even games)' : 'Offset by 1 (odd games)'}`);
  console.log(`Actual balance: ${hasBalanceIssues ? '⚠️  Some teams have imbalances > 1' : '✅ All teams balanced'}`);
  
  // Consecutive games analysis
  console.log('\n🔢 Consecutive Games Analysis:');
  console.log('=============================');
  let maxConsecAwayOverall = 0;
  let maxConsecHomeOverall = 0;
  let teamsWithHighConsecAway = [];
  let teamsWithHighConsecHome = [];
  
  TEAMS.forEach(team => {
    const stats = teamStats[team];
    if (stats.maxConsecutiveAway > maxConsecAwayOverall) {
      maxConsecAwayOverall = stats.maxConsecutiveAway;
    }
    if (stats.maxConsecutiveHome > maxConsecHomeOverall) {
      maxConsecHomeOverall = stats.maxConsecutiveHome;
    }
    if (stats.maxConsecutiveAway > 3) {
      teamsWithHighConsecAway.push(`${team} (${stats.maxConsecutiveAway})`);
    }
    if (stats.maxConsecutiveHome > 3) {
      teamsWithHighConsecHome.push(`${team} (${stats.maxConsecutiveHome})`);
    }
  });
  
  console.log(`Max consecutive away matches: ${maxConsecAwayOverall}`);
  console.log(`Max consecutive home matches: ${maxConsecHomeOverall}`);
  if (teamsWithHighConsecAway.length > 0) {
    console.log(`Teams with >3 consecutive away: ${teamsWithHighConsecAway.join(', ')}`);
  }
  if (teamsWithHighConsecHome.length > 0) {
    console.log(`Teams with >3 consecutive home: ${teamsWithHighConsecHome.join(', ')}`);
  }
  
  // Constraints summary
  console.log('\n🔒 Observed Constraints:');
  console.log('========================');
  console.log(`1. Near round-robin format (${uniqueMatchups.size} of ${possibleMatchups} possible matchups)`);
  console.log(`2. ${totalGamesPerTeam} matches per team`);
  console.log(`3. Home/away balance: ${totalGamesPerTeam % 2 === 0 ? `${totalGamesPerTeam/2}H/${totalGamesPerTeam/2}A` : `${Math.ceil(totalGamesPerTeam/2)}H/${Math.floor(totalGamesPerTeam/2)}A or vice versa`}`);
  console.log(`4. Season length: ${weeks.length} weeks`);
  console.log(`5. Primary days: ${Object.keys(dayCount).sort((a, b) => dayCount[b] - dayCount[a]).slice(0, 3).join(', ')}`);
  console.log(`6. Consecutive away/home limits: Generally ≤${Math.max(3, maxConsecAwayOverall)} away, ≤${Math.max(3, maxConsecHomeOverall)} home`);
  
  // Specific patterns
  console.log('\n🎯 Format Details:');
  console.log('==================');
  console.log(`- All 16 Big 12 members participate`);
  console.log(`- No affiliate teams`);
  console.log(`- Matches spread across ${weeks.length} weeks`);
  console.log(`- Multiple matches per team per week possible`);
  
  return { matches, teamStats, weeks };
}

// Run the analysis
if (require.main === module) {
  analyzeSchedule()
    .then(() => {
      console.log('\n✅ Women\'s Tennis schedule analysis complete!');
    })
    .catch(error => {
      console.error('Error analyzing schedule:', error);
      process.exit(1);
    });
}

module.exports = { parseWomensTennisSchedule, analyzeSchedule };