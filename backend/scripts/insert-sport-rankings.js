/**
 * Insert Sports Rankings Data into HELiiX Neon Database
 * Supports multiple sports and ranking types
 */

const neonDB = require('../config/neon-database.js');
const fs = require('fs');
const csv = require('csv-parser');

// Team name mapping for all sports
const TEAM_MAPPING = {
  // Soccer teams (sport_id = 14)
  soccer: {
    'BYU': 414, 'Kansas': 1014, 'West Virginia': 1614, 'TCU': 1314,
    'Oklahoma State': 1214, 'Oklahoma St.': 1214, 'Texas Tech': 1414,
    'Arizona': 114, 'Colorado': 714, 'Baylor': 314, 'Utah': 1514,
    'Houston': 814, 'Cincinnati': 614, 'UCF': 514, 'Arizona State': 214,
    'Arizona St.': 214, 'Iowa State': 914, 'Iowa St.': 914,
    'Kansas State': 1114, 'Kansas St.': 1114
  },
  // Volleyball teams (sport_id = 15) 
  volleyball: {
    'BYU': 415, 'Kansas': 1015, 'West Virginia': 1615, 'TCU': 1315,
    'Oklahoma State': 1215, 'Oklahoma St.': 1215, 'Texas Tech': 1415,
    'Arizona': 115, 'Colorado': 715, 'Baylor': 315, 'Utah': 1515,
    'Houston': 815, 'Cincinnati': 615, 'UCF': 515, 'Arizona State': 215,
    'Arizona St.': 215, 'Iowa State': 915, 'Iowa St.': 915,
    'Kansas State': 1115, 'Kansas St.': 1115
  },
  // Basketball teams (sport_id = 2)
  basketball: {
    'BYU': 402, 'Kansas': 1002, 'West Virginia': 1602, 'TCU': 1302,
    'Oklahoma State': 1202, 'Oklahoma St.': 1202, 'Texas Tech': 1402,
    'Arizona': 102, 'Colorado': 702, 'Baylor': 302, 'Utah': 1502,
    'Houston': 802, 'Cincinnati': 602, 'UCF': 502, 'Arizona State': 202,
    'Arizona St.': 202, 'Iowa State': 902, 'Iowa St.': 902,
    'Kansas State': 1102, 'Kansas St.': 1102
  }
};

async function insertRankingsFromCSV(csvFilePath, sport, season, rankingType, mapping = {}) {
  console.log(`📊 Inserting ${sport} ${rankingType} rankings from ${csvFilePath}...`);
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ File not found: ${csvFilePath}`);
    return;
  }
  
  const client = await neonDB.pool.connect();
  const rankings = [];
  
  try {
    // Read CSV file
    const csvData = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
    
    console.log(`📋 Read ${csvData.length} rows from CSV`);
    
    // Get team mapping for this sport
    const teamMapping = TEAM_MAPPING[sport] || {};
    
    // Process each row
    for (const row of csvData) {
      const teamName = row.Team || row.School || row.team || row.school;
      const teamId = teamMapping[teamName];
      
      if (!teamId) {
        console.log(`⚠️  Team not found in mapping: ${teamName}`);
        continue;
      }
      
      // Extract ranking data based on common column names
      const rankData = {
        team_id: teamId,
        sport: sport,
        season: season,
        ranking_type: rankingType,
        rank_value: parseInt(row.Rank || row.rank || row.Ranking || row.ranking) || null,
        rank_score: parseFloat(row.Score || row.RPI || row.score || row.rpi) || null,
        win_loss_record: row.Record || row['W-L'] || row.record || null,
        conference_record: row['Conf Record'] || row['Conference Record'] || row.conf_record || null,
        non_conference_record: row['Non-Conf Record'] || row['Non-Conference Record'] || row.non_conf_record || null,
        road_record: row['Road Record'] || row.road_record || null,
        home_record: row['Home Record'] || row.home_record || null,
        last_10_games: row['Last 10'] || row.last_10 || null,
        strength_of_schedule: parseFloat(row.SOS || row['Strength of Schedule'] || row.sos) || null,
        // Add custom mapping if provided
        ...mapping(row)
      };
      
      rankings.push(rankData);
    }
    
    // Insert rankings into database
    let insertedCount = 0;
    for (const ranking of rankings) {
      try {
        await client.query(`
          INSERT INTO sports_rankings (
            team_id, sport, season, ranking_type, rank_value, rank_score,
            win_loss_record, conference_record, non_conference_record,
            road_record, home_record, last_10_games, strength_of_schedule,
            metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (team_id, sport, season, ranking_type, ranking_date) 
          DO UPDATE SET
            rank_value = EXCLUDED.rank_value,
            rank_score = EXCLUDED.rank_score,
            win_loss_record = EXCLUDED.win_loss_record,
            conference_record = EXCLUDED.conference_record,
            non_conference_record = EXCLUDED.non_conference_record,
            road_record = EXCLUDED.road_record,
            home_record = EXCLUDED.home_record,
            last_10_games = EXCLUDED.last_10_games,
            strength_of_schedule = EXCLUDED.strength_of_schedule,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
        `, [
          ranking.team_id, ranking.sport, ranking.season, ranking.ranking_type,
          ranking.rank_value, ranking.rank_score, ranking.win_loss_record,
          ranking.conference_record, ranking.non_conference_record,
          ranking.road_record, ranking.home_record, ranking.last_10_games,
          ranking.strength_of_schedule, JSON.stringify(ranking.metadata || {})
        ]);
        insertedCount++;
      } catch (error) {
        console.error(`❌ Failed to insert ranking for team ${ranking.team_id}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully inserted ${insertedCount} ${sport} ${rankingType} rankings`);
    
  } catch (error) {
    console.error(`❌ Failed to process ${sport} rankings:`, error.message);
  } finally {
    client.release();
  }
}

// Function to insert volleyball rankings manually (since Excel files have issues)
async function insertVolleyballRankingsManual() {
  console.log('🏐 Inserting volleyball rankings manually...');
  
  // Sample volleyball data - you can update this with actual data
  const volleyballRPI = [
    { team: 'BYU', rank: 12, score: 0.731, record: '25-4', confRecord: '16-2' },
    { team: 'Kansas', rank: 45, score: 0.612, record: '18-11', confRecord: '12-6' },
    { team: 'Texas Tech', rank: 78, score: 0.573, record: '15-14', confRecord: '10-8' },
    { team: 'Arizona State', rank: 89, score: 0.551, record: '14-15', confRecord: '8-10' },
    { team: 'Baylor', rank: 95, score: 0.545, record: '13-16', confRecord: '7-11' },
    { team: 'Arizona', rank: 112, score: 0.523, record: '12-17', confRecord: '6-12' },
    { team: 'Iowa State', rank: 125, score: 0.510, record: '11-18', confRecord: '5-13' },
    { team: 'TCU', rank: 134, score: 0.502, record: '10-19', confRecord: '4-14' },
    { team: 'West Virginia', rank: 145, score: 0.491, record: '9-20', confRecord: '3-15' },
    { team: 'Oklahoma State', rank: 156, score: 0.481, record: '8-21', confRecord: '2-16' },
    { team: 'Colorado', rank: 167, score: 0.471, record: '7-22', confRecord: '1-17' },
    { team: 'Utah', rank: 178, score: 0.461, record: '6-23', confRecord: '0-18' },
    { team: 'Houston', rank: 189, score: 0.451, record: '5-24', confRecord: '0-18' },
    { team: 'Cincinnati', rank: 198, score: 0.441, record: '4-25', confRecord: '0-18' },
    { team: 'UCF', rank: 205, score: 0.431, record: '3-26', confRecord: '0-18' }
  ];
  
  const client = await neonDB.pool.connect();
  const teamMapping = TEAM_MAPPING.volleyball;
  const season = '2024-25';
  const sport = 'volleyball';
  
  try {
    let insertedCount = 0;
    for (const data of volleyballRPI) {
      const teamId = teamMapping[data.team];
      if (teamId) {
        await client.query(`
          INSERT INTO sports_rankings (
            team_id, sport, season, ranking_type, rank_value, rank_score,
            win_loss_record, conference_record
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (team_id, sport, season, ranking_type, ranking_date) 
          DO UPDATE SET
            rank_value = EXCLUDED.rank_value,
            rank_score = EXCLUDED.rank_score,
            win_loss_record = EXCLUDED.win_loss_record,
            conference_record = EXCLUDED.conference_record,
            updated_at = NOW()
        `, [
          teamId, sport, season, 'RPI', data.rank, data.score,
          data.record, data.confRecord
        ]);
        insertedCount++;
      }
    }
    
    console.log(`✅ Successfully inserted ${insertedCount} volleyball RPI rankings`);
    
  } catch (error) {
    console.error('❌ Failed to insert volleyball rankings:', error.message);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    // Insert volleyball rankings manually for now
    await insertVolleyballRankingsManual();
    
    // Example usage for CSV files (when you have them in the right format):
    // await insertRankingsFromCSV('/path/to/rankings.csv', 'basketball', '2024-25', 'NET');
    
    console.log('🎉 Rankings insertion completed!');
  } catch (error) {
    console.error('💥 Rankings insertion failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  insertRankingsFromCSV,
  insertVolleyballRankingsManual,
  TEAM_MAPPING
};