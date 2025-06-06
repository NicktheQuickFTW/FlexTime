/**
 * Verify Rankings Data in HELiiX Neon Database
 */

const neonDB = require('../config/neon-database.js');

async function verifyRankingsData() {
  console.log('🔍 Verifying rankings data in HELiiX Database...');
  
  const client = await neonDB.pool.connect();
  
  try {
    // Check soccer rankings
    const soccerResult = await client.query(`
      SELECT t.name, sr.ranking_type, sr.rank_value, sr.rank_score, sr.win_loss_record
      FROM sports_rankings sr
      JOIN teams t ON sr.team_id = t.team_id
      WHERE sr.sport = 'soccer' AND sr.season = '2024-25'
      ORDER BY sr.ranking_type, sr.rank_value
    `);
    
    console.log(`Total soccer rankings: ${soccerResult.rows.length}`);
    
    // Group by ranking type
    const byType = {};
    soccerResult.rows.forEach(row => {
      if (!byType[row.ranking_type]) byType[row.ranking_type] = [];
      byType[row.ranking_type].push(row);
    });
    
    Object.keys(byType).forEach(type => {
      console.log(`\n${type} Rankings (Top 10):`);
      byType[type].slice(0, 10).forEach((row, i) => {
        console.log(`  ${i+1}. ${row.name} - Rank: ${row.rank_value}, Score: ${row.rank_score || 'N/A'}, Record: ${row.win_loss_record || 'N/A'}`);
      });
    });
    
    // Check tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%ranking%'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Rankings-related tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Get table row counts
    for (const table of tablesResult.rows) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      console.log(`    └─ ${countResult.rows[0].count} rows`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  } finally {
    client.release();
  }
}

async function main() {
  await verifyRankingsData();
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { verifyRankingsData };