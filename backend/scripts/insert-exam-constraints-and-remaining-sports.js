/**
 * Insert Final Exam Constraints and Remaining Sports Rankings into HELiiX Neon Database
 */

const neonDB = require('../config/neon-database.js');
const fs = require('fs');
const csv = require('csv-parser');

// Team mappings for lacrosse and baseball
const TEAM_MAPPING = {
  // Baseball (sport_id = 1)
  'baseball': {
    'Arizona': 101, 'Arizona State': 201, 'Arizona St.': 201, 'BYU': 401,
    'Baylor': 301, 'Cincinnati': 601, 'Houston': 801, 'Iowa State': 901,
    'Iowa St.': 901, 'Kansas': 1001, 'Kansas State': 1101, 'Kansas St.': 1101,
    'Oklahoma State': 1201, 'Oklahoma St.': 1201, 'TCU': 1301,
    'Texas Tech': 1401, 'UCF': 501, 'Utah': 1501, 'West Virginia': 1601
  },
  // Lacrosse - need to check which teams have lacrosse programs
  'lacrosse': {
    'Arizona State': 216, 'Arizona St.': 216, 'Cincinnati': 616, 'Colorado': 716
    // Big 12 only has a few lacrosse teams
  }
};

async function insertFinalExamConstraints() {
  console.log('📅 Inserting Final Exam Constraints...');
  
  const csvData = await readCSV('/Users/nickw/Downloads/2025-26 Big 12 Final Exam Schedules - Formatted.csv');
  const client = await neonDB.pool.connect();
  
  try {
    // Get school to team mapping
    const schoolTeamMapping = {
      'Arizona': { fall: 'December 12-18, 2025', spring: 'May 8-14, 2026' },
      'Arizona State': { fall: 'December 8-13, 2025', spring: 'May 4-9, 2026' },
      'Baylor': { fall: 'December 12-17, 2025', spring: 'May 8-13, 2026' },
      'BYU': { fall: 'December 13-18, 2025', spring: 'April 17-20, 2026' },
      'UCF': { fall: 'December 1-6, 2025', spring: 'April 29-May 5, 2026' },
      'Cincinnati': { fall: 'December 6-12, 2025', spring: 'April 25-30, 2026' },
      'Colorado': { fall: 'December 8-12, 2025', spring: 'May 3-7, 2026' },
      'Houston': { fall: 'December 9-15, 2025', spring: 'May 6-12, 2026' },
      'Iowa State': { fall: 'December 15-18, 2025', spring: 'May 11-14, 2026' },
      'Kansas': { fall: 'December 8-12, 2025', spring: 'May 11-15, 2026' },
      'Kansas State': { fall: 'December 15-19, 2025', spring: 'May 11-15, 2026' },
      'Oklahoma State': { fall: 'December 8-12, 2025', spring: 'May 4-8, 2026' },
      'TCU': { fall: 'December 8-12, 2025', spring: 'April 30-May 1, 2026' },
      'Texas Tech': { fall: 'December 5-10, 2025', spring: 'May 8-12, 2026' },
      'Utah': { fall: 'December 8-12, 2025', spring: 'April 23-29, 2026' },
      'West Virginia': { fall: 'December 15-19, 2025', spring: 'May 4-8, 2026' }
    };
    
    let insertedCount = 0;
    for (const [school, examPeriods] of Object.entries(schoolTeamMapping)) {
      // Insert constraint for fall finals
      await client.query(`
        INSERT INTO constraints (
          sport, constraint_type, description, parameters, is_active
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'all-sports',
        'final-exam-period',
        `${school} Fall 2025 Final Exam Period - Soft Constraint`,
        JSON.stringify({
          school: school,
          semester: 'Fall 2025',
          period: examPeriods.fall,
          constraint_strength: 'soft',
          description: 'Teams should avoid scheduling games during final exam periods when possible'
        }),
        true
      ]);
      
      // Insert constraint for spring finals
      await client.query(`
        INSERT INTO constraints (
          sport, constraint_type, description, parameters, is_active
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'all-sports',
        'final-exam-period',
        `${school} Spring 2026 Final Exam Period - Soft Constraint`,
        JSON.stringify({
          school: school,
          semester: 'Spring 2026',
          period: examPeriods.spring,
          constraint_strength: 'soft',
          description: 'Teams should avoid scheduling games during final exam periods when possible'
        }),
        true
      ]);
      
      insertedCount += 2;
    }
    
    console.log(`✅ Successfully inserted ${insertedCount} final exam constraints`);
    
  } catch (error) {
    console.error('❌ Failed to insert final exam constraints:', error.message);
  } finally {
    client.release();
  }
}

async function insertLacrosseConferenceRankings() {
  console.log('🥍 Inserting Lacrosse Conference Rankings...');
  
  const csvData = await readCSV('/Users/nickw/Downloads/NCAA Lacrosse Conference Non-Conference Rankings 2025.csv');
  const client = await neonDB.pool.connect();
  const season = '2025';
  const sport = 'lacrosse';
  
  try {
    // Find Big 12 conference data
    const big12Data = csvData.find(row => (row.Conference || row['﻿Conference']) === 'Big 12');
    
    if (big12Data) {
      await client.query(`
        INSERT INTO sports_rankings (
          team_id, sport, season, ranking_type, rank_value,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (team_id, sport, season, ranking_type, ranking_date) 
        DO UPDATE SET
          rank_value = EXCLUDED.rank_value,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `, [
        null, // Conference-level ranking
        sport, season, 'Conference Non-Conference', parseInt(big12Data['Non Conf. RPI']),
        JSON.stringify({
          conference: 'Big 12',
          numTeams: big12Data['# Teams'],
          nonConfRecord: big12Data['Non Conf Record'],
          opponentSuccess: big12Data['Opponent Success'],
          opponentSOS: big12Data['Opponent SOS'],
          nonConfRPI: big12Data['Non Conf. RPI']
        })
      ]);
      
      console.log(`✅ Successfully inserted Big 12 Lacrosse Conference ranking: #${big12Data['Non Conf. RPI']}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to insert Lacrosse conference rankings:', error.message);
  } finally {
    client.release();
  }
}

async function insertBaseballConferenceRankings() {
  console.log('⚾ Inserting Baseball Conference Rankings...');
  
  const csvData = await readCSV('/Users/nickw/Downloads/NCAA Baseball Conference Non-Conference Rankings 2025.csv');
  const client = await neonDB.pool.connect();
  const season = '2025';
  const sport = 'baseball';
  
  try {
    // Find Big 12 conference data
    const big12Data = csvData.find(row => (row.Conference || row['﻿Conference']) === 'Big 12');
    
    if (big12Data) {
      await client.query(`
        INSERT INTO sports_rankings (
          team_id, sport, season, ranking_type, rank_value,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (team_id, sport, season, ranking_type, ranking_date) 
        DO UPDATE SET
          rank_value = EXCLUDED.rank_value,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `, [
        null, // Conference-level ranking
        sport, season, 'Conference Non-Conference', parseInt(big12Data['Adj. Non-Conf RPI']),
        JSON.stringify({
          conference: 'Big 12',
          numTeams: big12Data['# Teams'],
          nonDivWL: big12Data['Non-Div WL'],
          nonConfRecord: big12Data['Non-Conf Record'],
          ncSOS: big12Data['NC SOS'],
          opponentSOS: big12Data['Opponent SOS'],
          nonConfRPI: big12Data['Non-Conf RPI'],
          adjNonConfRPI: big12Data['Adj. Non-Conf RPI']
        })
      ]);
      
      console.log(`✅ Successfully inserted Big 12 Baseball Conference ranking: #${big12Data['Adj. Non-Conf RPI']}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to insert Baseball conference rankings:', error.message);
  } finally {
    client.release();
  }
}

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function main() {
  try {
    await insertFinalExamConstraints();
    await insertLacrosseConferenceRankings();
    await insertBaseballConferenceRankings();
    
    console.log('🎉 All final exam constraints and remaining sports rankings inserted successfully!');
  } catch (error) {
    console.error('💥 Insertion failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  insertFinalExamConstraints,
  insertLacrosseConferenceRankings,
  insertBaseballConferenceRankings
};