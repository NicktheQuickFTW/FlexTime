/**
 * Insert Basketball and Softball Rankings Data into HELiiX Neon Database
 */

const neonDB = require('../config/neon-database.js');
const fs = require('fs');
const csv = require('csv-parser');

// Team mappings for basketball and softball
const TEAM_MAPPING = {
  // Women's Basketball (sport_id = 3)
  'womens-basketball': {
    'TCU': 1303, 'Kansas State': 1103, 'Kansas St.': 1103, 'West Virginia': 1603,
    'Baylor': 303, 'Utah': 1503, 'Oklahoma State': 1203, 'Oklahoma St.': 1203,
    'Iowa State': 903, 'Iowa St.': 903, 'Colorado': 703, 'Arizona': 103,
    'Texas Tech': 1403, 'Kansas': 1003, 'BYU': 403, 'Cincinnati': 603,
    'UCF': 503, 'Arizona State': 203, 'Arizona St.': 203, 'Houston': 803
  },
  // Men's Basketball (sport_id = 2)
  'mens-basketball': {
    'Houston': 802, 'Texas Tech': 1402, 'Arizona': 102, 'Iowa State': 902,
    'Iowa St.': 902, 'Kansas': 1002, 'BYU': 402, 'Baylor': 302,
    'Cincinnati': 602, 'West Virginia': 1602, 'UCF': 502, 'Utah': 1502,
    'Arizona State': 202, 'Arizona St.': 202, 'Kansas State': 1102,
    'Kansas St.': 1102, 'TCU': 1302, 'Colorado': 702, 'Oklahoma State': 1202,
    'Oklahoma St.': 1202
  },
  // Softball (sport_id = 15)
  'softball': {
    'Arizona': 115, 'Arizona State': 215, 'Arizona St.': 215, 'BYU': 415,
    'Baylor': 315, 'Houston': 815, 'Iowa State': 915, 'Iowa St.': 915,
    'Kansas': 1015, 'Oklahoma State': 1215, 'Oklahoma St.': 1215,
    'Texas Tech': 1415, 'UCF': 515, 'Utah': 1515
  }
};

async function insertWomensBasketballRankings() {
  console.log('🏀 Inserting Women\'s Basketball NET Rankings...');
  
  const csvData = await readCSV('/Users/nickw/Downloads/NCAA WBB Rankings 2024-25.csv');
  const client = await neonDB.pool.connect();
  const teamMapping = TEAM_MAPPING['womens-basketball'];
  const season = '2024-25';
  const sport = 'womens-basketball';
  
  try {
    let insertedCount = 0;
    for (const row of csvData) {
      // Clean team name (remove (AQ) suffix and handle BOM)
      const teamName = (row.Team || row['﻿Team'] || '').replace(/\(AQ\)$/, '').trim();
      const teamId = teamMapping[teamName];
      
      if (!teamId) {
        console.log(`⚠️  WBB Team not found: ${teamName}`);
        continue;
      }
      
      await client.query(`
        INSERT INTO sports_rankings (
          team_id, sport, season, ranking_type, rank_value, 
          win_loss_record, conference_record, non_conference_record,
          road_record, last_10_games, strength_of_schedule,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (team_id, sport, season, ranking_type, ranking_date) 
        DO UPDATE SET
          rank_value = EXCLUDED.rank_value,
          win_loss_record = EXCLUDED.win_loss_record,
          conference_record = EXCLUDED.conference_record,
          non_conference_record = EXCLUDED.non_conference_record,
          road_record = EXCLUDED.road_record,
          last_10_games = EXCLUDED.last_10_games,
          strength_of_schedule = EXCLUDED.strength_of_schedule,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `, [
        teamId, sport, season, 'NET', parseInt(row['NET Rank']),
        row.DivIWL, row.ConfRecord, row['Non-ConfRecord'],
        row.RoadWL, row.Last10Games, parseFloat(row.NETSOS),
        JSON.stringify({
          prevNET: row.PrevNET,
          avgOppNETRank: row.AvgOppNETRank,
          netNonConfSOS: row.NetNonConfSOS,
          q1: row.Q1,
          q2: row.Q2,
          q3: row.Q3,
          q4: row.Q4,
          vsTop100: row.vsTOP100
        })
      ]);
      insertedCount++;
    }
    
    console.log(`✅ Successfully inserted ${insertedCount} Women's Basketball NET rankings`);
    
  } catch (error) {
    console.error('❌ Failed to insert Women\'s Basketball rankings:', error.message);
  } finally {
    client.release();
  }
}

async function insertMensBasketballRankings() {
  console.log('🏀 Inserting Men\'s Basketball NET Rankings...');
  
  const csvData = await readCSV('/Users/nickw/Downloads/NCAA MBB Rankings 2024-25.xlsx.csv');
  const client = await neonDB.pool.connect();
  const teamMapping = TEAM_MAPPING['mens-basketball'];
  const season = '2024-25';
  const sport = 'mens-basketball';
  
  try {
    let insertedCount = 0;
    for (const row of csvData) {
      // Clean team name (remove (AQ) suffix and handle BOM)
      const teamName = (row.Team || row['﻿Team'] || '').replace(/\(AQ\)$/, '').trim();
      const teamId = teamMapping[teamName];
      
      if (!teamId) {
        console.log(`⚠️  MBB Team not found: ${teamName}`);
        continue;
      }
      
      await client.query(`
        INSERT INTO sports_rankings (
          team_id, sport, season, ranking_type, rank_value, 
          win_loss_record, conference_record, non_conference_record,
          road_record, strength_of_schedule, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (team_id, sport, season, ranking_type, ranking_date) 
        DO UPDATE SET
          rank_value = EXCLUDED.rank_value,
          win_loss_record = EXCLUDED.win_loss_record,
          conference_record = EXCLUDED.conference_record,
          non_conference_record = EXCLUDED.non_conference_record,
          road_record = EXCLUDED.road_record,
          strength_of_schedule = EXCLUDED.strength_of_schedule,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `, [
        teamId, sport, season, 'NET', parseInt(row['NET Rank']),
        row.WL, row.ConfWL, row.NCWL,
        row.RoadWL, parseFloat(row.NETSOS),
        JSON.stringify({
          prevNET: row.PrevNET,
          avgOppNETRank: row.AvgOppNETRank,
          avgOppNET: row.AvgOppNET,
          confSOS: row.ConfSOS,
          netNCSOS: row.NETNCSOS,
          wabRk: row.WABRk,
          wab: row.WAB,
          ncWABRk: row.NCWABRk,
          ncWAB: row.NCWAB,
          q1: row.Q1,
          q2: row.Q2,
          q3: row.Q3,
          q4: row.Q4
        })
      ]);
      insertedCount++;
    }
    
    console.log(`✅ Successfully inserted ${insertedCount} Men's Basketball NET rankings`);
    
  } catch (error) {
    console.error('❌ Failed to insert Men\'s Basketball rankings:', error.message);
  } finally {
    client.release();
  }
}

async function insertSoftballConferenceRankings() {
  console.log('🥎 Inserting Softball Conference Non-Conference Rankings...');
  
  const csvData = await readCSV('/Users/nickw/Downloads/NCAA Softball Conference Non-Conference Rankings 2025.csv');
  const client = await neonDB.pool.connect();
  const season = '2025';
  const sport = 'softball';
  
  try {
    // Find Big 12 conference data
    const big12Data = csvData.find(row => row.Conference === 'Big 12');
    
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
        null, // Conference-level ranking, no specific team
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
      
      console.log(`✅ Successfully inserted Big 12 Softball Conference ranking: #${big12Data['Adj. Non-Conf RPI']}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to insert Softball conference rankings:', error.message);
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
    await insertWomensBasketballRankings();
    await insertMensBasketballRankings();
    await insertSoftballConferenceRankings();
    
    console.log('🎉 All basketball and softball rankings inserted successfully!');
  } catch (error) {
    console.error('💥 Rankings insertion failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  insertWomensBasketballRankings,
  insertMensBasketballRankings,
  insertSoftballConferenceRankings
};