#!/usr/bin/env node

/**
 * Update Teams Table with COMPASS Data
 * 
 * This script updates the teams table with initial COMPASS ratings and
 * fills in any empty columns for the 10 FlexTime sports.
 * 
 * The 10 FlexTime sports are:
 * 1. Football (FB)
 * 2. Men's Basketball (MBB)
 * 3. Women's Basketball (WBB)
 * 4. Baseball (BSB)
 * 5. Softball (SB)
 * 6. Women's Soccer (WSOC)
 * 7. Wrestling (WRES)
 * 8. Women's Volleyball (WVB)
 * 9. Men's Tennis (MTN)
 * 10. Women's Tennis (WTN)
 */

const { Pool } = require('pg');
const heliiXConfig = require('../config/neon_db_config');
const { BIG12_SCHOOLS, SCHOOL_COLORS } = require('../constants/schoolBranding');

// Sport code mappings for the 10 FlexTime sports
const FLEXTIME_SPORTS = [
  { code: 'football', abbrev: 'FB', name: 'Football', gender: 'Men\'s' },
  { code: 'mens-basketball', abbrev: 'MBB', name: 'Men\'s Basketball', gender: 'Men\'s' },
  { code: 'womens-basketball', abbrev: 'WBB', name: 'Women\'s Basketball', gender: 'Women\'s' },
  { code: 'baseball', abbrev: 'BSB', name: 'Baseball', gender: 'Men\'s' },
  { code: 'softball', abbrev: 'SB', name: 'Softball', gender: 'Women\'s' },
  { code: 'soccer', abbrev: 'WSOC', name: 'Women\'s Soccer', gender: 'Women\'s' },
  { code: 'wrestling', abbrev: 'WRES', name: 'Wrestling', gender: 'Men\'s' },
  { code: 'volleyball', abbrev: 'WVB', name: 'Women\'s Volleyball', gender: 'Women\'s' },
  { code: 'mens-tennis', abbrev: 'MTN', name: 'Men\'s Tennis', gender: 'Men\'s' },
  { code: 'womens-tennis', abbrev: 'WTN', name: 'Women\'s Tennis', gender: 'Women\'s' }
];

// Big 12 team codes and their full names with location data
const BIG12_TEAM_CODES = {
  'ARIZ': { name: 'University of Arizona', displayName: 'Arizona', city: 'Tucson', state: 'AZ' },
  'ASU': { name: 'Arizona State University', displayName: 'Arizona State', city: 'Tempe', state: 'AZ' },
  'BAY': { name: 'Baylor University', displayName: 'Baylor', city: 'Waco', state: 'TX' },
  'BYU': { name: 'Brigham Young University', displayName: 'BYU', city: 'Provo', state: 'UT' },
  'UCF': { name: 'University of Central Florida', displayName: 'UCF', city: 'Orlando', state: 'FL' },
  'CIN': { name: 'University of Cincinnati', displayName: 'Cincinnati', city: 'Cincinnati', state: 'OH' },
  'COLO': { name: 'University of Colorado', displayName: 'Colorado', city: 'Boulder', state: 'CO' },
  'HOU': { name: 'University of Houston', displayName: 'Houston', city: 'Houston', state: 'TX' },
  'ISU': { name: 'Iowa State University', displayName: 'Iowa State', city: 'Ames', state: 'IA' },
  'KU': { name: 'University of Kansas', displayName: 'Kansas', city: 'Lawrence', state: 'KS' },
  'KSU': { name: 'Kansas State University', displayName: 'Kansas State', city: 'Manhattan', state: 'KS' },
  'OSU': { name: 'Oklahoma State University', displayName: 'Oklahoma State', city: 'Stillwater', state: 'OK' },
  'TCU': { name: 'Texas Christian University', displayName: 'TCU', city: 'Fort Worth', state: 'TX' },
  'TTU': { name: 'Texas Tech University', displayName: 'Texas Tech', city: 'Lubbock', state: 'TX' },
  'UTAH': { name: 'University of Utah', displayName: 'Utah', city: 'Salt Lake City', state: 'UT' },
  'WVU': { name: 'West Virginia University', displayName: 'West Virginia', city: 'Morgantown', state: 'WV' }
};

// Sport-specific venue names
// Note: Not all teams participate in all sports:
// - Wrestling: Only ASU, ISU, OSU, WVU
// - Baseball: 14 teams (no Colorado or Iowa State)
// - Softball: 11 teams
// - Men's Tennis: 9 teams  
// - Women's Tennis: 11 teams
const SPORT_VENUES = {
  'football': {
    'ARIZ': 'Arizona Stadium',
    'ASU': 'Mountain America Stadium',
    'BAY': 'McLane Stadium',
    'BYU': 'LaVell Edwards Stadium',
    'UCF': 'FBC Mortgage Stadium',
    'CIN': 'Nippert Stadium',
    'COLO': 'Folsom Field',
    'HOU': 'TDECU Stadium',
    'ISU': 'Jack Trice Stadium',
    'KU': 'David Booth Kansas Memorial Stadium',
    'KSU': 'Bill Snyder Family Stadium',
    'OSU': 'Boone Pickens Stadium',
    'TCU': 'Amon G. Carter Stadium',
    'TTU': 'Jones AT&T Stadium',
    'UTAH': 'Rice-Eccles Stadium',
    'WVU': 'Milan Puskar Stadium'
  },
  'basketball': {
    'ARIZ': 'McKale Center',
    'ASU': 'Desert Financial Arena',
    'BAY': 'Foster Pavilion',
    'BYU': 'Marriott Center',
    'UCF': 'Addition Financial Arena',
    'CIN': 'Fifth Third Arena',
    'COLO': 'CU Events Center',
    'HOU': 'Fertitta Center',
    'ISU': 'Hilton Coliseum',
    'KU': 'Allen Fieldhouse',
    'KSU': 'Bramlage Coliseum',
    'OSU': 'Gallagher-Iba Arena',
    'TCU': 'Ed and Rae Schollmaier Arena',
    'TTU': 'United Supermarkets Arena',
    'UTAH': 'Jon M. Huntsman Center',
    'WVU': 'WVU Coliseum'
  },
  'baseball': {
    'ARIZ': 'Hi Corbett Field',
    'ASU': 'Phoenix Municipal Stadium',
    'BAY': 'Baylor Ballpark',
    'BYU': 'Larry H. Miller Field',
    'UCF': 'John Euliano Park',
    'CIN': 'UC Baseball Stadium',
    'HOU': 'Schroeder Park',
    'KU': 'Hoglund Ballpark',
    'KSU': 'Tointon Family Stadium',
    'OSU': 'O\'Brate Stadium',
    'TCU': 'Lupton Stadium',
    'TTU': 'Dan Law Field at Rip Griffin Park',
    'UTAH': 'Smith\'s Ballpark',
    'WVU': 'Monongalia County Ballpark'
    // Note: Colorado and Iowa State don't have baseball
  },
  'softball': {
    'ARIZ': 'Hillenbrand Stadium',
    'ASU': 'Alberta B. Farrington Softball Stadium',
    'BAY': 'Getterman Stadium',
    'BYU': 'Gail Miller Field',
    'UCF': 'UCF Softball Complex',
    'HOU': 'Cougar Softball Stadium',
    'ISU': 'Cyclone Sports Complex',
    'KU': 'Arrocha Ballpark',
    'OSU': 'Cowgirl Stadium',
    'TTU': 'Rocky Johnson Field',
    'UTAH': 'Dumke Family Softball Stadium'
  },
  'soccer': {
    'ARIZ': 'Mulcahy Soccer Stadium',
    'ASU': 'Sun Devil Soccer Stadium',
    'BAY': 'Betty Lou Mays Soccer Field',
    'BYU': 'South Field',
    'UCF': 'UCF Soccer Complex',
    'CIN': 'Gettler Stadium',
    'COLO': 'Prentup Field',
    'HOU': 'Carl Lewis International Complex',
    'ISU': 'Cyclone Sports Complex',
    'KU': 'Rock Chalk Park',
    'KSU': 'Buser Family Park',
    'OSU': 'Neal Patterson Stadium',
    'TCU': 'Garvey-Rosenthal Soccer Stadium',
    'TTU': 'John Walker Soccer Complex',
    'UTAH': 'Ute Field',
    'WVU': 'Dick Dlesk Soccer Stadium'
  },
  'wrestling': {
    'ASU': 'Desert Financial Arena',
    'ISU': 'Hilton Coliseum',
    'OSU': 'Gallagher-Iba Arena',
    'WVU': 'WVU Coliseum'
  },
  'volleyball': {
    'ARIZ': 'McKale Center',
    'ASU': 'Desert Financial Arena',
    'BAY': 'Ferrell Center',
    'BYU': 'Smith Fieldhouse',
    'UCF': 'The Venue',
    'CIN': 'Fifth Third Arena',
    'COLO': 'CU Events Center',
    'HOU': 'Fertitta Center',
    'ISU': 'Hilton Coliseum',
    'KU': 'Horejsi Family Volleyball Arena',
    'KSU': 'Ahearn Field House',
    'TCU': 'University Recreation Center',
    'TTU': 'United Supermarkets Arena',
    'UTAH': 'Jon M. Huntsman Center',
    'WVU': 'WVU Coliseum'
  },
  'tennis': {
    'ARIZ': 'LaNelle Robson Tennis Center',
    'ASU': 'Whiteman Tennis Center',
    'BAY': 'Hurd Tennis Center',
    'BYU': 'BYU Tennis Courts',
    'UCF': 'UCF Tennis Complex',
    'OSU': 'Greenwood Tennis Center',
    'TCU': 'Friedman Tennis Center',
    'TTU': 'McLeod Tennis Center',
    'UTAH': 'George S. Eccles Tennis Center'
  }
};

// Generate random COMPASS ratings
function generateCompassRatings() {
  return {
    overall: Math.floor(Math.random() * 31) + 60, // 60-90
    competitive: Math.floor(Math.random() * 31) + 60,
    organizational: Math.floor(Math.random() * 31) + 60,
    momentum: Math.floor(Math.random() * 31) + 60,
    personnel: Math.floor(Math.random() * 31) + 60,
    analytics: Math.floor(Math.random() * 31) + 60,
    strategic: Math.floor(Math.random() * 31) + 60,
    support: Math.floor(Math.random() * 31) + 60
  };
}

// Generate placeholder coach names
function generateCoachName(teamCode, sport, isHead = true) {
  const firstNames = ['John', 'Mike', 'David', 'Chris', 'Tom', 'Jim', 'Bob', 'Steve', 'Mark', 'Bill',
                      'Sarah', 'Lisa', 'Jennifer', 'Michelle', 'Amy', 'Karen', 'Laura', 'Emily', 'Susan', 'Jessica'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
}

// Generate assistant coaches array
function generateAssistantCoaches() {
  const count = Math.floor(Math.random() * 3) + 2; // 2-4 assistants
  const coaches = [];
  
  for (let i = 0; i < count; i++) {
    coaches.push({
      name: generateCoachName('', '', false),
      role: i === 0 ? 'Associate Head Coach' : `Assistant Coach`,
      specialization: ['Offense', 'Defense', 'Recruiting', 'Player Development'][Math.floor(Math.random() * 4)]
    });
  }
  
  return coaches;
}

// Get sport-appropriate season records
function getSeasonRecord(sport) {
  switch (sport) {
    case 'football':
      return {
        wins: Math.floor(Math.random() * 10) + 3,
        losses: Math.floor(Math.random() * 8) + 2
      };
    case 'basketball':
    case 'baseball':
    case 'softball':
      return {
        wins: Math.floor(Math.random() * 20) + 10,
        losses: Math.floor(Math.random() * 15) + 5
      };
    case 'soccer':
    case 'volleyball':
      return {
        wins: Math.floor(Math.random() * 15) + 8,
        losses: Math.floor(Math.random() * 10) + 3
      };
    case 'wrestling':
      return {
        wins: Math.floor(Math.random() * 15) + 5,
        losses: Math.floor(Math.random() * 10) + 2
      };
    case 'tennis':
      return {
        wins: Math.floor(Math.random() * 20) + 8,
        losses: Math.floor(Math.random() * 12) + 3
      };
    default:
      return { wins: 0, losses: 0 };
  }
}

async function updateTeamsData() {
  const pool = new Pool({
    connectionString: heliiXConfig.connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to HELiiX database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully\n');

    // First, ensure all schools exist in the teams table
    console.log('📝 Ensuring all Big 12 schools exist in teams table...');
    for (const [teamCode, teamInfo] of Object.entries(BIG12_TEAM_CODES)) {
      const schoolData = BIG12_SCHOOLS[teamInfo.name.replace(/ /g, '_').toUpperCase()];
      const colors = SCHOOL_COLORS[teamInfo.name.toLowerCase()];
      
      await client.query(`
        INSERT INTO teams (
          team_code, team_name, institution_name, city, state,
          mascot, primary_color, secondary_color, conference,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (team_code) DO UPDATE SET
          mascot = COALESCE(teams.mascot, EXCLUDED.mascot),
          primary_color = COALESCE(teams.primary_color, EXCLUDED.primary_color),
          secondary_color = COALESCE(teams.secondary_color, EXCLUDED.secondary_color),
          updated_at = CURRENT_TIMESTAMP
      `, [
        teamCode,
        `${teamInfo.displayName} ${schoolData?.mascot || ''}`.trim(),
        teamInfo.name,
        teamInfo.city,
        teamInfo.state,
        schoolData?.mascot || '',
        colors?.primary || '#000000',
        colors?.secondary || '#FFFFFF',
        'Big 12'
      ]);
    }
    console.log('✅ All schools added/updated\n');

    // Get all teams and sports
    const teamsResult = await client.query('SELECT team_id, team_code, institution_name FROM teams WHERE conference = $1', ['Big 12']);
    const sportsResult = await client.query('SELECT sport_id, code, sport_name FROM sports WHERE code = ANY($1)', [FLEXTIME_SPORTS.map(s => s.code)]);
    
    const teams = teamsResult.rows;
    const sports = sportsResult.rows;
    
    console.log(`Found ${teams.length} Big 12 teams and ${sports.length} FlexTime sports\n`);

    let totalUpdates = 0;
    const updateSummary = [];

    // For each sport and team combination
    for (const sport of sports) {
      console.log(`\n🏀 Processing ${sport.sport_name}...`);
      let sportUpdates = 0;
      
      for (const team of teams) {
        // Skip teams that don't have this sport
        const sportKey = sport.code.includes('basketball') ? 'basketball' : 
                        sport.code.includes('tennis') ? 'tennis' : 
                        sport.code;
        
        if (!SPORT_VENUES[sportKey] || !SPORT_VENUES[sportKey][team.team_code]) {
          continue;
        }

        // Generate COMPASS ratings
        const compass = generateCompassRatings();
        const seasonRecord = getSeasonRecord(sportKey);
        
        // Check if team profile exists
        const existingProfile = await client.query(
          'SELECT profile_id FROM team_profiles WHERE team_id = $1 AND sport_id = $2 AND season_year = $3',
          [team.team_id, sport.sport_id, '2024-25']
        );

        if (existingProfile.rows.length === 0) {
          // Insert new profile
          await client.query(`
            INSERT INTO team_profiles (
              team_id, sport_id, season_year,
              compass_overall_rating, competitive_rating, organizational_rating,
              momentum_rating, personnel_rating, analytics_rating,
              strategic_rating, support_rating,
              data_source, confidence_score, notes,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            team.team_id, sport.sport_id, '2024-25',
            compass.overall, compass.competitive, compass.organizational,
            compass.momentum, compass.personnel, compass.analytics,
            compass.strategic, compass.support,
            'Initial Script Generation', 0.75, 'Placeholder data for development',
          ]);
          
          sportUpdates++;
        }

        // Update team details if missing
        await client.query(`
          UPDATE teams SET
            head_coach = COALESCE(head_coach, $2),
            assistant_coaches = COALESCE(assistant_coaches, $3::jsonb),
            home_venue = COALESCE(home_venue, $4),
            conference_rank = COALESCE(conference_rank, $5),
            national_rank = COALESCE(national_rank, $6),
            season_wins = COALESCE(season_wins, $7),
            season_losses = COALESCE(season_losses, $8),
            championship_wins = COALESCE(championship_wins, $9),
            facility_quality = COALESCE(facility_quality, $10),
            updated_at = CURRENT_TIMESTAMP
          WHERE team_id = $1
        `, [
          team.team_id,
          generateCoachName(team.team_code, sport.code),
          JSON.stringify(generateAssistantCoaches()),
          SPORT_VENUES[sportKey][team.team_code],
          Math.floor(Math.random() * 16) + 1,
          Math.floor(Math.random() * 100) + 1,
          seasonRecord.wins,
          seasonRecord.losses,
          Math.floor(Math.random() * 6),
          Math.floor(Math.random() * 36) + 60
        ]);

        // Add coaching staff if not exists
        const coachExists = await client.query(
          'SELECT coach_id FROM coaching_staff WHERE team_id = $1 AND sport_id = $2 AND position = $3 AND status = $4',
          [team.team_id, sport.sport_id, 'Head Coach', 'Active']
        );

        if (coachExists.rows.length === 0) {
          const coachName = generateCoachName(team.team_code, sport.code);
          const [firstName, lastName] = coachName.split(' ');
          
          await client.query(`
            INSERT INTO coaching_staff (
              team_id, sport_id, first_name, last_name, position,
              hire_date, years_experience, status,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            team.team_id, sport.sport_id, firstName, lastName, 'Head Coach',
            new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
            Math.floor(Math.random() * 20) + 5,
            'Active'
          ]);
        }

        // Add facilities if not exists
        const facilityExists = await client.query(
          'SELECT facility_id FROM facilities WHERE team_id = $1 AND sport_id = $2',
          [team.team_id, sport.sport_id]
        );

        if (facilityExists.rows.length === 0) {
          await client.query(`
            INSERT INTO facilities (
              team_id, sport_id, facility_name, facility_type,
              capacity, built_year, facility_rating, recruiting_impact_rating,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            team.team_id, sport.sport_id,
            SPORT_VENUES[sportKey][team.team_code],
            sportKey === 'football' ? 'Stadium' : 
            sportKey === 'basketball' || sportKey === 'volleyball' ? 'Arena' : 
            sportKey === 'baseball' || sportKey === 'softball' ? 'Ballpark' : 'Field',
            sportKey === 'football' ? Math.floor(Math.random() * 40000) + 25000 :
            sportKey === 'basketball' ? Math.floor(Math.random() * 10000) + 5000 :
            Math.floor(Math.random() * 5000) + 1000,
            1950 + Math.floor(Math.random() * 50),
            (Math.random() * 3 + 7).toFixed(2),
            (Math.random() * 2 + 8).toFixed(2)
          ]);
        }

        // Add performance metrics if not exists
        const metricsExist = await client.query(
          'SELECT metric_id FROM performance_metrics WHERE team_id = $1 AND sport_id = $2 AND season_year = $3',
          [team.team_id, sport.sport_id, '2024-25']
        );

        if (metricsExist.rows.length === 0) {
          await client.query(`
            INSERT INTO performance_metrics (
              team_id, sport_id, season_year,
              wins, losses, conference_wins, conference_losses,
              conference_standing, postseason_berth,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            team.team_id, sport.sport_id, '2024-25',
            seasonRecord.wins, seasonRecord.losses,
            Math.floor(seasonRecord.wins * 0.6), Math.floor(seasonRecord.losses * 0.6),
            Math.floor(Math.random() * 16) + 1,
            Math.random() > 0.5
          ]);
        }
      }
      
      console.log(`  ✓ Updated ${sportUpdates} team profiles for ${sport.sport_name}`);
      updateSummary.push({ sport: sport.sport_name, updates: sportUpdates });
      totalUpdates += sportUpdates;
    }

    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY REPORT');
    console.log('='.repeat(60));
    console.log(`Total Updates: ${totalUpdates}`);
    console.log('\nBy Sport:');
    updateSummary.forEach(item => {
      console.log(`  ${item.sport}: ${item.updates} profiles`);
    });
    console.log('\nAll team profiles, facilities, coaching staff, and performance metrics have been initialized.');
    console.log('='.repeat(60));

    client.release();
  } catch (error) {
    console.error('❌ Error updating teams data:', error);
  } finally {
    await pool.end();
  }
}

// Run the update
if (require.main === module) {
  updateTeamsData().catch(console.error);
}

module.exports = { updateTeamsData };