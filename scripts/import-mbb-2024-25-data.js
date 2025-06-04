/**
 * Import Men's Basketball 2024-25 Season Data
 * Extracts data from team sheet images and populates database tables
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: process.env.NEON_DB_USER,
  host: process.env.NEON_DB_HOST,
  database: process.env.NEON_DB_NAME,
  password: process.env.NEON_DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Big 12 team mapping
const BIG12_TEAMS = {
  'ASU': { name: 'Arizona State', team_id: 1 },
  'BU': { name: 'Baylor', team_id: 2 },
  'BYU': { name: 'BYU', team_id: 3 },
  'CU': { name: 'Colorado', team_id: 4 },
  'ISU': { name: 'Iowa State', team_id: 5 },
  'KSU': { name: 'Kansas State', team_id: 6 },
  'KU': { name: 'Kansas', team_id: 7 },
  'OSU': { name: 'Oklahoma State', team_id: 8 },
  'TCU': { name: 'TCU', team_id: 9 },
  'TTU': { name: 'Texas Tech', team_id: 10 },
  'UC': { name: 'Cincinnati', team_id: 11 },
  'UCF': { name: 'UCF', team_id: 12 },
  'UH': { name: 'Houston', team_id: 13 },
  'UU': { name: 'Utah', team_id: 14 },
  'UofA': { name: 'Arizona', team_id: 15 },
  'WVU': { name: 'West Virginia', team_id: 16 }
};

// Men's Basketball sport_id (assuming it's 2)
const MBB_SPORT_ID = 2;
const SEASON_YEAR = '2024-25';

/**
 * Complete Big 12 Men's Basketball 2024-25 Season Data
 * Extracted from all 16 team sheet images
 */
function parseRecord(recordStr) {
  const [wins, losses] = recordStr.split('-').map(Number);
  return { wins, losses };
}

const RAW_TEAM_DATA = {
  ASU: {
    netRanking: 75, overallRecord: "13-20", conferenceRecord: "4-16", divisionIRecord: "13-20", nonConferenceRecord: "9-2",
    homeRecord: "5-9", awayRecord: "3-8", neutralRecord: "5-3", roadRecord: "3-8", netSOS: 9, rpiSOS: 21, nonConfSOS: 14,
    kpi: 82, sor: 81, pom: 70, bpi: 77, tRank: 65, averageNetWins: 120, averageNetLosses: 36,
    q1Record: "4-14", q2Record: "3-5", q3Record: "2-1", q4Record: "4-0",
    q1NonConf: "2-2", q2NonConf: "2-0", q3NonConf: "1-0", q4NonConf: "4-0"
  },
  BU: {
    netRanking: 31, overallRecord: "19-15", conferenceRecord: "10-10", divisionIRecord: "19-15", nonConferenceRecord: "7-3",
    homeRecord: "12-3", awayRecord: "3-9", neutralRecord: "4-3", roadRecord: "3-9", netSOS: 8, rpiSOS: 17, nonConfSOS: 25,
    kpi: 52, sor: 40, pom: 29, bpi: 19, tRank: 27, averageNetWins: 107, averageNetLosses: 22,
    q1Record: "6-13", q2Record: "7-1", q3Record: "1-1", q4Record: "5-0",
    q1NonConf: "2-3", q2NonConf: "0-0", q3NonConf: "0-0", q4NonConf: "5-0"
  },
  BYU: {
    netRanking: 26, overallRecord: "26-10", conferenceRecord: "14-6", divisionIRecord: "26-10", nonConferenceRecord: "9-2",
    homeRecord: "15-2", awayRecord: "6-5", neutralRecord: "5-3", roadRecord: "6-5", netSOS: 45, rpiSOS: 69, nonConfSOS: 245,
    kpi: 30, sor: 19, pom: 24, bpi: 24, tRank: 14, averageNetWins: 119, averageNetLosses: 35,
    q1Record: "10-8", q2Record: "6-2", q3Record: "4-0", q4Record: "6-0",
    q1NonConf: "0-1", q2NonConf: "0-1", q3NonConf: "3-0", q4NonConf: "6-0"
  },
  CU: {
    netRanking: 87, overallRecord: "14-21", conferenceRecord: "3-17", divisionIRecord: "14-21", nonConferenceRecord: "9-2",
    homeRecord: "11-7", awayRecord: "0-10", neutralRecord: "3-4", roadRecord: "0-10", netSOS: 24, rpiSOS: 53, nonConfSOS: 209,
    kpi: 101, sor: 91, pom: 81, bpi: 82, tRank: 81, averageNetWins: 154, averageNetLosses: 39,
    q1Record: "2-15", q2Record: "4-6", q3Record: "3-0", q4Record: "5-0",
    q1NonConf: "1-2", q2NonConf: "1-0", q3NonConf: "2-0", q4NonConf: "5-0"
  },
  ISU: {
    netRanking: 12, overallRecord: "25-10", conferenceRecord: "13-7", divisionIRecord: "25-10", nonConferenceRecord: "10-1",
    homeRecord: "15-2", awayRecord: "6-5", neutralRecord: "4-3", roadRecord: "6-5", netSOS: 36, rpiSOS: 55, nonConfSOS: 138,
    kpi: 23, sor: 15, pom: 10, bpi: 7, tRank: 8, averageNetWins: 111, averageNetLosses: 32,
    q1Record: "10-8", q2Record: "7-2", q3Record: "3-0", q4Record: "5-0",
    q1NonConf: "2-1", q2NonConf: "2-0", q3NonConf: "1-0", q4NonConf: "5-0"
  },
  KSU: {
    netRanking: 76, overallRecord: "16-17", conferenceRecord: "9-11", divisionIRecord: "16-17", nonConferenceRecord: "6-5",
    homeRecord: "10-6", awayRecord: "3-9", neutralRecord: "3-2", roadRecord: "3-9", netSOS: 32, rpiSOS: 62, nonConfSOS: 165,
    kpi: 74, sor: 72, pom: 67, bpi: 63, tRank: 57, averageNetWins: 131, averageNetLosses: 51,
    q1Record: "5-10", q2Record: "3-6", q3Record: "3-1", q4Record: "5-0",
    q1NonConf: "0-1", q2NonConf: "0-3", q3NonConf: "1-1", q4NonConf: "5-0"
  },
  KU: {
    netRanking: 19, overallRecord: "21-13", conferenceRecord: "11-9", divisionIRecord: "21-13", nonConferenceRecord: "9-2",
    homeRecord: "14-3", awayRecord: "4-8", neutralRecord: "3-2", roadRecord: "4-8", netSOS: 12, rpiSOS: 11, nonConfSOS: 12,
    kpi: 24, sor: 26, pom: 21, bpi: 14, tRank: 20, averageNetWins: 90, averageNetLosses: 29,
    q1Record: "6-12", q2Record: "7-1", q3Record: "5-0", q4Record: "3-0",
    q1NonConf: "2-2", q2NonConf: "1-0", q3NonConf: "3-0", q4NonConf: "3-0"
  },
  OSU: {
    netRanking: 92, overallRecord: "17-18", conferenceRecord: "7-13", divisionIRecord: "17-18", nonConferenceRecord: "8-3",
    homeRecord: "13-4", awayRecord: "3-10", neutralRecord: "1-4", roadRecord: "3-10", netSOS: 44, rpiSOS: 94, nonConfSOS: 309,
    kpi: 112, sor: 76, pom: 100, bpi: 103, tRank: 87, averageNetWins: 153, averageNetLosses: 44,
    q1Record: "2-14", q2Record: "5-3", q3Record: "4-1", q4Record: "6-0",
    q1NonConf: "0-1", q2NonConf: "0-1", q3NonConf: "2-1", q4NonConf: "6-0"
  },
  TCU: {
    netRanking: 78, overallRecord: "16-16", conferenceRecord: "9-11", divisionIRecord: "16-16", nonConferenceRecord: "7-4",
    homeRecord: "14-3", awayRecord: "2-9", neutralRecord: "0-4", roadRecord: "2-9", netSOS: 30, rpiSOS: 38, nonConfSOS: 58,
    kpi: 70, sor: 68, pom: 86, bpi: 67, tRank: 74, averageNetWins: 118, averageNetLosses: 41,
    q1Record: "4-12", q2Record: "4-4", q3Record: "3-0", q4Record: "5-0",
    q1NonConf: "0-3", q2NonConf: "1-1", q3NonConf: "1-0", q4NonConf: "5-0"
  },
  TTU: {
    netRanking: 8, overallRecord: "28-9", conferenceRecord: "15-5", divisionIRecord: "28-9", nonConferenceRecord: "9-2",
    homeRecord: "15-3", awayRecord: "8-2", neutralRecord: "5-4", roadRecord: "8-2", netSOS: 47, rpiSOS: 32, nonConfSOS: 75,
    kpi: 21, sor: 9, pom: 7, bpi: 3, tRank: 7, averageNetWins: 107, averageNetLosses: 31,
    q1Record: "11-6", q2Record: "4-3", q3Record: "7-0", q4Record: "6-0",
    q1NonConf: "0-1", q2NonConf: "0-1", q3NonConf: "3-0", q4NonConf: "6-0"
  },
  UC: {
    netRanking: 49, overallRecord: "19-16", conferenceRecord: "7-13", divisionIRecord: "19-16", nonConferenceRecord: "10-1",
    homeRecord: "12-5", awayRecord: "4-9", neutralRecord: "3-2", roadRecord: "4-9", netSOS: 48, rpiSOS: 76, nonConfSOS: 217,
    kpi: 66, sor: 59, pom: 55, bpi: 40, tRank: 44, averageNetWins: 150, averageNetLosses: 41,
    q1Record: "3-12", q2Record: "7-4", q3Record: "3-0", q4Record: "6-0",
    q1NonConf: "0-1", q2NonConf: "3-0", q3NonConf: "1-0", q4NonConf: "6-0"
  },
  UCF: {
    netRanking: 68, overallRecord: "20-17", conferenceRecord: "7-13", divisionIRecord: "20-17", nonConferenceRecord: "9-2",
    homeRecord: "13-5", awayRecord: "2-8", neutralRecord: "5-4", roadRecord: "2-8", netSOS: 41, rpiSOS: 49, nonConfSOS: 90,
    kpi: 75, sor: 65, pom: 68, bpi: 64, tRank: 69, averageNetWins: 120, averageNetLosses: 38,
    q1Record: "4-11", q2Record: "5-6", q3Record: "6-0", q4Record: "5-0",
    q1NonConf: "1-1", q2NonConf: "0-1", q3NonConf: "3-0", q4NonConf: "5-0"
  },
  UH: {
    netRanking: 2, overallRecord: "35-5", conferenceRecord: "19-1", divisionIRecord: "35-5", nonConferenceRecord: "8-3",
    homeRecord: "16-1", awayRecord: "10-0", neutralRecord: "9-4", roadRecord: "10-0", netSOS: 25, rpiSOS: 8, nonConfSOS: 8,
    kpi: 4, sor: 3, pom: 3, bpi: 2, tRank: 1, averageNetWins: 79, averageNetLosses: 15,
    q1Record: "18-4", q2Record: "6-1", q3Record: "5-0", q4Record: "6-0",
    q1NonConf: "0-2", q2NonConf: "0-1", q3NonConf: "3-0", q4NonConf: "5-0"
  },
  UU: {
    netRanking: 72, overallRecord: "16-17", conferenceRecord: "8-12", divisionIRecord: "16-17", nonConferenceRecord: "8-3",
    homeRecord: "15-4", awayRecord: "1-9", neutralRecord: "0-4", roadRecord: "1-9", netSOS: 50, rpiSOS: 113, nonConfSOS: 331,
    kpi: 96, sor: 75, pom: 76, bpi: 61, tRank: 67, averageNetWins: 176, averageNetLosses: 40,
    q1Record: "2-12", q2Record: "4-5", q3Record: "2-0", q4Record: "8-0",
    q1NonConf: "0-2", q2NonConf: "0-1", q3NonConf: "0-0", q4NonConf: "8-0"
  },
  UofA: {
    netRanking: 10, overallRecord: "24-13", conferenceRecord: "14-6", divisionIRecord: "24-13", nonConferenceRecord: "6-5",
    homeRecord: "13-3", awayRecord: "6-5", neutralRecord: "5-5", roadRecord: "6-5", netSOS: 4, rpiSOS: 10, nonConfSOS: 27,
    kpi: 25, sor: 20, pom: 14, bpi: 9, tRank: 9, averageNetWins: 97, averageNetLosses: 27,
    q1Record: "11-12", q2Record: "5-1", q3Record: "4-0", q4Record: "4-0",
    q1NonConf: "0-4", q2NonConf: "0-1", q3NonConf: "2-0", q4NonConf: "4-0"
  },
  WVU: {
    netRanking: 50, overallRecord: "19-13", conferenceRecord: "10-10", divisionIRecord: "19-13", nonConferenceRecord: "9-2",
    homeRecord: "13-4", awayRecord: "4-7", neutralRecord: "2-2", roadRecord: "4-7", netSOS: 26, rpiSOS: 27, nonConfSOS: 73,
    kpi: 48, sor: 42, pom: 53, bpi: 51, tRank: 34, averageNetWins: 118, averageNetLosses: 39,
    q1Record: "6-10", q2Record: "4-3", q3Record: "4-0", q4Record: "5-0",
    q1NonConf: "2-2", q2NonConf: "0-0", q3NonConf: "2-0", q4NonConf: "5-0"
  }
};

// Convert raw data to normalized format
const TEAM_DATA = {};
Object.keys(RAW_TEAM_DATA).forEach(teamCode => {
  const raw = RAW_TEAM_DATA[teamCode];
  TEAM_DATA[teamCode] = {
    netRanking: raw.netRanking,
    record: parseRecord(raw.overallRecord),
    conferenceRecord: parseRecord(raw.conferenceRecord),
    div1Record: parseRecord(raw.divisionIRecord),
    nonConfRecord: parseRecord(raw.nonConferenceRecord),
    roadRecord: parseRecord(raw.roadRecord),
    homeRecord: parseRecord(raw.homeRecord),
    awayRecord: parseRecord(raw.awayRecord),
    neutralRecord: parseRecord(raw.neutralRecord),
    metrics: {
      netSos: raw.netSOS,
      rpiSos: raw.rpiSOS,
      nonConfSos: raw.nonConfSOS,
      kpi: raw.kpi,
      sor: raw.sor,
      pom: raw.pom,
      bpi: raw.bpi,
      tRank: raw.tRank,
      avgNetWins: raw.averageNetWins,
      avgNetLosses: raw.averageNetLosses
    },
    quadrants: {
      q1: { ...parseRecord(raw.q1Record), ...parseRecord(raw.q1NonConf, 'nc') },
      q2: { ...parseRecord(raw.q2Record), ...parseRecord(raw.q2NonConf, 'nc') },
      q3: { ...parseRecord(raw.q3Record), ...parseRecord(raw.q3NonConf, 'nc') },
      q4: { ...parseRecord(raw.q4Record), ...parseRecord(raw.q4NonConf, 'nc') }
    }
  };
  
  // Add non-conference wins/losses to quadrant data
  const q1nc = parseRecord(raw.q1NonConf);
  const q2nc = parseRecord(raw.q2NonConf);
  const q3nc = parseRecord(raw.q3NonConf);
  const q4nc = parseRecord(raw.q4NonConf);
  
  TEAM_DATA[teamCode].quadrants.q1.ncWins = q1nc.wins;
  TEAM_DATA[teamCode].quadrants.q1.ncLosses = q1nc.losses;
  TEAM_DATA[teamCode].quadrants.q2.ncWins = q2nc.wins;
  TEAM_DATA[teamCode].quadrants.q2.ncLosses = q2nc.losses;
  TEAM_DATA[teamCode].quadrants.q3.ncWins = q3nc.wins;
  TEAM_DATA[teamCode].quadrants.q3.ncLosses = q3nc.losses;
  TEAM_DATA[teamCode].quadrants.q4.ncWins = q4nc.wins;
  TEAM_DATA[teamCode].quadrants.q4.ncLosses = q4nc.losses;
});

/**
 * Insert season records for a team
 */
async function insertSeasonRecord(client, teamCode, data) {
  const team = BIG12_TEAMS[teamCode];
  if (!team) {
    console.log(`Unknown team code: ${teamCode}`);
    return;
  }

  const query = `
    INSERT INTO season_records (
      team_id, sport_id, season_year,
      overall_wins, overall_losses,
      conference_wins, conference_losses,
      div1_wins, div1_losses,
      non_conf_wins, non_conf_losses,
      home_wins, home_losses,
      away_wins, away_losses,
      neutral_wins, neutral_losses,
      road_wins, road_losses
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    ON CONFLICT (team_id, sport_id, season_year) 
    DO UPDATE SET
      overall_wins = EXCLUDED.overall_wins,
      overall_losses = EXCLUDED.overall_losses,
      conference_wins = EXCLUDED.conference_wins,
      conference_losses = EXCLUDED.conference_losses,
      div1_wins = EXCLUDED.div1_wins,
      div1_losses = EXCLUDED.div1_losses,
      non_conf_wins = EXCLUDED.non_conf_wins,
      non_conf_losses = EXCLUDED.non_conf_losses,
      home_wins = EXCLUDED.home_wins,
      home_losses = EXCLUDED.home_losses,
      away_wins = EXCLUDED.away_wins,
      away_losses = EXCLUDED.away_losses,
      neutral_wins = EXCLUDED.neutral_wins,
      neutral_losses = EXCLUDED.neutral_losses,
      road_wins = EXCLUDED.road_wins,
      road_losses = EXCLUDED.road_losses,
      updated_at = CURRENT_TIMESTAMP
  `;

  const values = [
    team.team_id, MBB_SPORT_ID, SEASON_YEAR,
    data.record.wins, data.record.losses,
    data.conferenceRecord.wins, data.conferenceRecord.losses,
    data.div1Record.wins, data.div1Record.losses,
    data.nonConfRecord.wins, data.nonConfRecord.losses,
    data.homeRecord.wins, data.homeRecord.losses,
    data.awayRecord.wins, data.awayRecord.losses,
    data.neutralRecord.wins, data.neutralRecord.losses,
    data.roadRecord.wins, data.roadRecord.losses
  ];

  await client.query(query, values);
  console.log(`✓ Inserted season record for ${team.name}`);
}

/**
 * Insert team metrics and rankings
 */
async function insertTeamMetrics(client, teamCode, data) {
  const team = BIG12_TEAMS[teamCode];
  if (!team) return;

  const query = `
    INSERT INTO team_metrics (
      team_id, sport_id, season_year,
      net_ranking, net_sos, rpi_sos, non_conf_sos,
      kpi_ranking, sor_ranking, pom_ranking, bpi_ranking, t_rank,
      avg_net_wins, avg_net_losses,
      quadrant_1_wins, quadrant_1_losses,
      quadrant_2_wins, quadrant_2_losses,
      quadrant_3_wins, quadrant_3_losses,
      quadrant_4_wins, quadrant_4_losses,
      quad_1_nc_wins, quad_1_nc_losses,
      quad_2_nc_wins, quad_2_nc_losses,
      quad_3_nc_wins, quad_3_nc_losses,
      quad_4_nc_wins, quad_4_nc_losses
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
    ON CONFLICT (team_id, sport_id, season_year)
    DO UPDATE SET
      net_ranking = EXCLUDED.net_ranking,
      net_sos = EXCLUDED.net_sos,
      rpi_sos = EXCLUDED.rpi_sos,
      non_conf_sos = EXCLUDED.non_conf_sos,
      kpi_ranking = EXCLUDED.kpi_ranking,
      sor_ranking = EXCLUDED.sor_ranking,
      pom_ranking = EXCLUDED.pom_ranking,
      bpi_ranking = EXCLUDED.bpi_ranking,
      t_rank = EXCLUDED.t_rank,
      avg_net_wins = EXCLUDED.avg_net_wins,
      avg_net_losses = EXCLUDED.avg_net_losses,
      quadrant_1_wins = EXCLUDED.quadrant_1_wins,
      quadrant_1_losses = EXCLUDED.quadrant_1_losses,
      quadrant_2_wins = EXCLUDED.quadrant_2_wins,
      quadrant_2_losses = EXCLUDED.quadrant_2_losses,
      quadrant_3_wins = EXCLUDED.quadrant_3_wins,
      quadrant_3_losses = EXCLUDED.quadrant_3_losses,
      quadrant_4_wins = EXCLUDED.quadrant_4_wins,
      quadrant_4_losses = EXCLUDED.quadrant_4_losses,
      quad_1_nc_wins = EXCLUDED.quad_1_nc_wins,
      quad_1_nc_losses = EXCLUDED.quad_1_nc_losses,
      quad_2_nc_wins = EXCLUDED.quad_2_nc_wins,
      quad_2_nc_losses = EXCLUDED.quad_2_nc_losses,
      quad_3_nc_wins = EXCLUDED.quad_3_nc_wins,
      quad_3_nc_losses = EXCLUDED.quad_3_nc_losses,
      quad_4_nc_wins = EXCLUDED.quad_4_nc_wins,
      quad_4_nc_losses = EXCLUDED.quad_4_nc_losses,
      updated_at = CURRENT_TIMESTAMP
  `;

  const values = [
    team.team_id, MBB_SPORT_ID, SEASON_YEAR,
    data.netRanking, data.metrics.netSos, data.metrics.rpiSos, data.metrics.nonConfSos,
    data.metrics.kpi, data.metrics.sor, data.metrics.pom, data.metrics.bpi, data.metrics.tRank,
    data.metrics.avgNetWins, data.metrics.avgNetLosses,
    data.quadrants.q1.wins, data.quadrants.q1.losses,
    data.quadrants.q2.wins, data.quadrants.q2.losses,
    data.quadrants.q3.wins, data.quadrants.q3.losses,
    data.quadrants.q4.wins, data.quadrants.q4.losses,
    data.quadrants.q1.ncWins, data.quadrants.q1.ncLosses,
    data.quadrants.q2.ncWins, data.quadrants.q2.ncLosses,
    data.quadrants.q3.ncWins, data.quadrants.q3.ncLosses,
    data.quadrants.q4.ncWins, data.quadrants.q4.ncLosses
  ];

  await client.query(query, values);
  console.log(`✓ Inserted team metrics for ${team.name}`);
}

/**
 * Main import function
 */
async function importMBBData() {
  const client = await pool.connect();
  
  try {
    console.log('Starting Men\'s Basketball 2024-25 data import...\n');

    console.log('Skipping table creation (assuming tables exist)\n');

    // Import data for each team
    for (const [teamCode, data] of Object.entries(TEAM_DATA)) {
      console.log(`Importing data for ${BIG12_TEAMS[teamCode]?.name}...`);
      
      await insertSeasonRecord(client, teamCode, data);
      await insertTeamMetrics(client, teamCode, data);
      
      console.log('');
    }

    // Verify import
    const recordCount = await client.query(
      'SELECT COUNT(*) FROM season_records WHERE season_year = $1',
      [SEASON_YEAR]
    );
    
    const metricsCount = await client.query(
      'SELECT COUNT(*) FROM team_metrics WHERE season_year = $1',
      [SEASON_YEAR]
    );

    console.log('\n📊 Import Summary:');
    console.log(`Season Records: ${recordCount.rows[0].count}`);
    console.log(`Team Metrics: ${metricsCount.rows[0].count}`);
    console.log('\n✅ Men\'s Basketball 2024-25 data import completed successfully!');

  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Query functions for data verification
 */
async function verifyImport() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Verifying imported data...\n');

    // Sample team performance summary
    const summary = await client.query(`
      SELECT * FROM team_performance_summary 
      WHERE season_year = $1 
      ORDER BY net_ranking ASC 
      LIMIT 5
    `, [SEASON_YEAR]);

    console.log('Top 5 NET ranked teams:');
    summary.rows.forEach(row => {
      console.log(`${row.team_id}: NET #${row.net_ranking}, Record: ${row.overall_record}, Quad 1: ${row.quad_1_record}`);
    });

    // Quadrant analysis
    const quadAnalysis = await client.query(`
      SELECT team_id, quad_1_win_pct, quad_2_win_pct, total_quality_wins, bad_losses_q4
      FROM quadrant_analysis 
      WHERE season_year = $1
      ORDER BY total_quality_wins DESC
      LIMIT 5
    `, [SEASON_YEAR]);

    console.log('\nTop quality win teams:');
    quadAnalysis.rows.forEach(row => {
      console.log(`Team ${row.team_id}: Q1 Win%: ${row.quad_1_win_pct}%, Q2 Win%: ${row.quad_2_win_pct}%, Quality Wins: ${row.total_quality_wins}`);
    });

  } catch (error) {
    console.error('Error verifying data:', error);
  } finally {
    client.release();
  }
}

// Export functions for use in other scripts
module.exports = {
  importMBBData,
  verifyImport,
  BIG12_TEAMS,
  TEAM_DATA
};

// Run import if script is executed directly
if (require.main === module) {
  importMBBData()
    .then(() => verifyImport())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}