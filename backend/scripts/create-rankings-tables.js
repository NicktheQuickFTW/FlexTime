/**
 * Create Rankings Tables for HELiiX Neon Database
 * Stores various sports rankings data for Big 12 teams
 */

const neonDB = require('../config/neon-database.js');

async function createRankingsTables() {
  console.log('🏆 Creating rankings tables in HELiiX Neon Database...');
  
  const client = await neonDB.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Sports Rankings table - stores various ranking systems
    await client.query(`
      CREATE TABLE IF NOT EXISTS sports_rankings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id INTEGER REFERENCES teams(team_id),
        sport VARCHAR(50) NOT NULL,
        season VARCHAR(20) NOT NULL,
        ranking_type VARCHAR(100) NOT NULL, -- 'RPI', 'NET', 'AP', 'Coaches', 'Non-Conference', etc.
        rank_value INTEGER,
        rank_score DECIMAL(8,5), -- actual numerical score/value
        win_loss_record VARCHAR(20),
        conference_record VARCHAR(20),
        non_conference_record VARCHAR(20),
        road_record VARCHAR(20),
        home_record VARCHAR(20),
        neutral_record VARCHAR(20),
        last_10_games VARCHAR(20),
        strength_of_schedule DECIMAL(8,5),
        conference_sos DECIMAL(8,5),
        non_conference_sos DECIMAL(8,5),
        rpi_1_25 VARCHAR(20), -- Record vs RPI 1-25
        rpi_26_50 VARCHAR(20), -- Record vs RPI 26-50
        rpi_51_100 VARCHAR(20), -- Record vs RPI 51-100
        rpi_101_plus VARCHAR(20), -- Record vs RPI 101+
        vs_top_100 VARCHAR(20),
        vs_below_150 VARCHAR(20),
        opponent_success INTEGER,
        bonus_points INTEGER,
        penalty_points INTEGER,
        schedule_adjustment INTEGER,
        metadata JSONB, -- for additional ranking-specific data
        ranking_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(team_id, sport, season, ranking_type, ranking_date)
      )
    `);
    
    // Rankings History table - tracks historical changes
    await client.query(`
      CREATE TABLE IF NOT EXISTS rankings_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id INTEGER REFERENCES teams(team_id),
        sport VARCHAR(50) NOT NULL,
        season VARCHAR(20) NOT NULL,
        ranking_type VARCHAR(100) NOT NULL,
        previous_rank INTEGER,
        new_rank INTEGER,
        rank_change INTEGER, -- positive = improved, negative = dropped
        change_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Team Performance Metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_performance_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id INTEGER REFERENCES teams(team_id),
        sport VARCHAR(50) NOT NULL,
        season VARCHAR(20) NOT NULL,
        games_played INTEGER,
        wins INTEGER,
        losses INTEGER,
        ties INTEGER DEFAULT 0,
        win_percentage DECIMAL(5,3),
        points_for DECIMAL(8,2),
        points_against DECIMAL(8,2),
        point_differential DECIMAL(8,2),
        home_wins INTEGER DEFAULT 0,
        home_losses INTEGER DEFAULT 0,
        away_wins INTEGER DEFAULT 0,
        away_losses INTEGER DEFAULT 0,
        neutral_wins INTEGER DEFAULT 0,
        neutral_losses INTEGER DEFAULT 0,
        conference_wins INTEGER DEFAULT 0,
        conference_losses INTEGER DEFAULT 0,
        non_conference_wins INTEGER DEFAULT 0,
        non_conference_losses INTEGER DEFAULT 0,
        streak_type VARCHAR(10), -- 'W' or 'L'
        streak_count INTEGER DEFAULT 0,
        calculated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(team_id, sport, season)
      )
    `);
    
    // Weekly Rankings Snapshot table
    await client.query(`
      CREATE TABLE IF NOT EXISTS weekly_rankings_snapshot (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        week_ending_date DATE NOT NULL,
        sport VARCHAR(50) NOT NULL,
        season VARCHAR(20) NOT NULL,
        ranking_type VARCHAR(100) NOT NULL,
        rankings_data JSONB NOT NULL, -- Complete rankings for that week
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(week_ending_date, sport, season, ranking_type)
      )
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sports_rankings_team_sport_season 
      ON sports_rankings(team_id, sport, season);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sports_rankings_ranking_type 
      ON sports_rankings(ranking_type, sport, season);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sports_rankings_rank_value 
      ON sports_rankings(rank_value) WHERE rank_value IS NOT NULL;
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rankings_history_team_date 
      ON rankings_history(team_id, change_date);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_team_performance_metrics_team_sport 
      ON team_performance_metrics(team_id, sport, season);
    `);
    
    await client.query('COMMIT');
    console.log('✅ Rankings tables created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to create rankings tables:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function insertSoccerRankings() {
  console.log('⚽ Inserting soccer rankings data...');
  
  const client = await neonDB.pool.connect();
  
  try {
    // Soccer Non-Conference Rankings data
    const nonConfRankings = [
      { team: 'BYU', rank: 11, record: '2-4-2', opponentSuccess: 2, opponentSOS: 12, nonConfRPI: 11, bonus: 3, penalty: 1 },
      { team: 'Kansas', rank: 25, record: '2-2-3', opponentSuccess: 13, opponentSOS: 60, nonConfRPI: 23, bonus: 3, penalty: 1 },
      { team: 'West Virginia', rank: 26, record: '4-2-2', opponentSuccess: 24, opponentSOS: 45, nonConfRPI: 28, bonus: 3, penalty: 0 },
      { team: 'TCU', rank: 29, record: '6-3', opponentSuccess: 91, opponentSOS: 8, nonConfRPI: 27, bonus: 3, penalty: 0 },
      { team: 'Oklahoma State', rank: 34, record: '7-1-1', opponentSuccess: 44, opponentSOS: 50, nonConfRPI: 34, bonus: 1, penalty: 0 },
      { team: 'Texas Tech', rank: 47, record: '6-3', opponentSuccess: 146, opponentSOS: 15, nonConfRPI: 45, bonus: 1, penalty: 0 },
      { team: 'Arizona', rank: 50, record: '5-1-1', opponentSuccess: 68, opponentSOS: 73, nonConfRPI: 53, bonus: 3, penalty: 0 },
      { team: 'Colorado', rank: 64, record: '7-2', opponentSuccess: 155, opponentSOS: 7, nonConfRPI: 66, bonus: 2, penalty: 0 },
      { team: 'Baylor', rank: 73, record: '5-2-1', opponentSuccess: 48, opponentSOS: 23, nonConfRPI: 72, bonus: 2, penalty: 0 },
      { team: 'Utah', rank: 93, record: '3-2-2', opponentSuccess: 90, opponentSOS: 52, nonConfRPI: 95, bonus: 1, penalty: 0 },
      { team: 'Houston', rank: 133, record: '3-2-1', opponentSuccess: 21, opponentSOS: 176, nonConfRPI: 135, bonus: 1, penalty: 1 },
      { team: 'Cincinnati', rank: 137, record: '4-2-1', opponentSuccess: 80, opponentSOS: 82, nonConfRPI: 139, bonus: 1, penalty: 0 },
      { team: 'UCF', rank: 150, record: '2-1-2', opponentSuccess: 101, opponentSOS: 19, nonConfRPI: 159, bonus: 1, penalty: 0 },
      { team: 'Arizona State', rank: 192, record: '5-0-2', opponentSuccess: 206, opponentSOS: 292, nonConfRPI: 191, bonus: 1, penalty: 2 },
      { team: 'Iowa State', rank: 289, record: '2-4-2', opponentSuccess: 243, opponentSOS: 183, nonConfRPI: 290, bonus: 0, penalty: 3 },
      { team: 'Kansas State', rank: 305, record: '3-3-1', opponentSuccess: 246, opponentSOS: 256, nonConfRPI: 309, bonus: 0, penalty: 2 }
    ];
    
    // Soccer RPI Rankings data
    const rpiRankings = [
      { team: 'TCU', rank: 17, score: 0.61861, record: '17-4-2', confRecord: '11-1-2', roadRecord: '7-2-1', last10: '8-2' },
      { team: 'West Virginia', rank: 28, score: 0.59051, record: '12-5-3', confRecord: '8-3-1', roadRecord: '4-3-2', last10: '5-3-2' },
      { team: 'Oklahoma State', rank: 32, score: 0.58783, record: '14-5-3', confRecord: '7-4-2', roadRecord: '6-1-2', last10: '6-3-1' },
      { team: 'Kansas', rank: 33, score: 0.58766, record: '12-6-4', confRecord: '10-4-1', roadRecord: '6-3-1', last10: '8-1-1' },
      { team: 'BYU', rank: 34, score: 0.58713, record: '9-7-5', confRecord: '7-3-3', roadRecord: '2-4-3', last10: '5-3-2' },
      { team: 'Texas Tech', rank: 41, score: 0.58322, record: '15-5-2', confRecord: '9-2-2', roadRecord: '5-3-1', last10: '6-3-1' },
      { team: 'Colorado', rank: 50, score: 0.56893, record: '12-5-5', confRecord: '5-3-5', roadRecord: '5-2-2', last10: '2-4-4' },
      { team: 'Arizona', rank: 62, score: 0.55546, record: '11-6-2', confRecord: '6-5-1', roadRecord: '4-4-1', last10: '5-4-1' },
      { team: 'Baylor', rank: 70, score: 0.54789, record: '8-8-5', confRecord: '3-6-4', roadRecord: '2-4-3', last10: '2-4-4' },
      { team: 'Utah', rank: 92, score: 0.53342, record: '8-6-5', confRecord: '5-4-3', roadRecord: '2-3-2', last10: '4-3-3' },
      { team: 'Cincinnati', rank: 138, score: 0.49859, record: '6-9-4', confRecord: '2-7-3', roadRecord: '1-5-2', last10: '2-5-3' },
      { team: 'Arizona State', rank: 145, score: 0.49661, record: '8-8-3', confRecord: '3-8-1', roadRecord: '2-3-1', last10: '2-7-1' },
      { team: 'UCF', rank: 150, score: 0.49381, record: '3-6-6', confRecord: '1-5-4', roadRecord: '1-3-3', last10: '1-5-4' },
      { team: 'Houston', rank: 153, score: 0.49118, record: '4-12-1', confRecord: '1-10', roadRecord: '2-7', last10: '1-9' },
      { team: 'Iowa State', rank: 219, score: 0.45781, record: '3-9-6', confRecord: '1-5-4', roadRecord: '1-4-2', last10: '0-6-4' },
      { team: 'Kansas State', rank: 263, score: 0.43496, record: '3-12-3', confRecord: '0-9-2', roadRecord: '1-6-2', last10: '0-8-2' }
    ];
    
    // Map team names to database team IDs (for soccer teams)
    const teamNameToId = {
      'BYU': 414,
      'Kansas': 1014,
      'West Virginia': 1614,
      'TCU': 1314,
      'Oklahoma State': 1214,
      'Oklahoma St.': 1214,
      'Texas Tech': 1414,
      'Arizona': 114,
      'Colorado': 714,
      'Baylor': 314,
      'Utah': 1514,
      'Houston': 814,
      'Cincinnati': 614,
      'UCF': 514,
      'Arizona State': 214,
      'Arizona St.': 214,
      'Iowa State': 914,
      'Iowa St.': 914,
      'Kansas State': 1114,
      'Kansas St.': 1114
    };
    
    const season = '2024-25';
    const sport = 'soccer';
    
    // Insert Non-Conference Rankings
    for (const data of nonConfRankings) {
      const teamId = teamNameToId[data.team];
      if (teamId) {
        await client.query(`
          INSERT INTO sports_rankings (
            team_id, sport, season, ranking_type, rank_value, 
            non_conference_record, opponent_success, non_conference_sos, 
            bonus_points, penalty_points, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (team_id, sport, season, ranking_type, ranking_date) 
          DO UPDATE SET
            rank_value = EXCLUDED.rank_value,
            non_conference_record = EXCLUDED.non_conference_record,
            opponent_success = EXCLUDED.opponent_success,
            non_conference_sos = EXCLUDED.non_conference_sos,
            bonus_points = EXCLUDED.bonus_points,
            penalty_points = EXCLUDED.penalty_points,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
        `, [
          teamId, sport, season, 'Non-Conference', data.rank,
          data.record, data.opponentSuccess, data.opponentSOS,
          data.bonus, data.penalty, JSON.stringify({ nonConfRPI: data.nonConfRPI })
        ]);
      }
    }
    
    // Insert RPI Rankings
    for (const data of rpiRankings) {
      const teamId = teamNameToId[data.team];
      if (teamId) {
        await client.query(`
          INSERT INTO sports_rankings (
            team_id, sport, season, ranking_type, rank_value, rank_score,
            win_loss_record, conference_record, road_record, last_10_games
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (team_id, sport, season, ranking_type, ranking_date) 
          DO UPDATE SET
            rank_value = EXCLUDED.rank_value,
            rank_score = EXCLUDED.rank_score,
            win_loss_record = EXCLUDED.win_loss_record,
            conference_record = EXCLUDED.conference_record,
            road_record = EXCLUDED.road_record,
            last_10_games = EXCLUDED.last_10_games,
            updated_at = NOW()
        `, [
          teamId, sport, season, 'RPI', data.rank, data.score,
          data.record, data.confRecord, data.roadRecord, data.last10
        ]);
      }
    }
    
    console.log('✅ Soccer rankings data inserted successfully');
    
  } catch (error) {
    console.error('❌ Failed to insert soccer rankings:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  try {
    await createRankingsTables();
    await insertSoccerRankings();
    console.log('🎉 Rankings tables and data setup completed successfully!');
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  createRankingsTables,
  insertSoccerRankings
};