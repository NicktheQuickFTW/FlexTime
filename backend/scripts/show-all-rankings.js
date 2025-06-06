/**
 * Show All Rankings Data in HELiiX Neon Database
 */

const neonDB = require('../config/neon-database.js');

async function showAllRankings() {
  console.log('🏆 All Sports Rankings in HELiiX Database\n');
  
  const client = await neonDB.pool.connect();
  
  try {
    // Get all rankings grouped by sport and ranking type
    const result = await client.query(`
      SELECT 
        sr.sport,
        sr.ranking_type,
        t.name as team_name,
        sr.rank_value,
        sr.rank_score,
        sr.win_loss_record,
        sr.conference_record,
        sr.ranking_date
      FROM sports_rankings sr
      JOIN teams t ON sr.team_id = t.team_id
      ORDER BY sr.sport, sr.ranking_type, sr.rank_value
    `);
    
    // Group results by sport and ranking type
    const grouped = {};
    result.rows.forEach(row => {
      if (!grouped[row.sport]) grouped[row.sport] = {};
      if (!grouped[row.sport][row.ranking_type]) grouped[row.sport][row.ranking_type] = [];
      grouped[row.sport][row.ranking_type].push(row);
    });
    
    // Display results
    Object.keys(grouped).forEach(sport => {
      console.log(`\n🏅 ${sport.toUpperCase()} RANKINGS`);
      console.log('='.repeat(50));
      
      Object.keys(grouped[sport]).forEach(rankingType => {
        console.log(`\n📊 ${rankingType} Rankings:`);
        console.log('-'.repeat(30));
        
        grouped[sport][rankingType].forEach((team, index) => {
          const scoreStr = team.rank_score ? ` (${team.rank_score})` : '';
          const recordStr = team.win_loss_record ? ` - ${team.win_loss_record}` : '';
          const confRecordStr = team.conference_record ? ` (Conf: ${team.conference_record})` : '';
          
          console.log(`${String(index + 1).padStart(3)}. ${team.team_name.padEnd(25)} Rank: ${String(team.rank_value).padStart(3)}${scoreStr}${recordStr}${confRecordStr}`);
        });
      });
    });
    
    // Summary statistics
    console.log('\n\n📈 SUMMARY STATISTICS');
    console.log('='.repeat(50));
    
    const summaryResult = await client.query(`
      SELECT 
        sport,
        ranking_type,
        COUNT(*) as team_count,
        MIN(rank_value) as best_rank,
        MAX(rank_value) as worst_rank,
        AVG(rank_value)::DECIMAL(5,1) as avg_rank
      FROM sports_rankings
      WHERE rank_value IS NOT NULL
      GROUP BY sport, ranking_type
      ORDER BY sport, ranking_type
    `);
    
    summaryResult.rows.forEach(row => {
      console.log(`${row.sport.toUpperCase()} ${row.ranking_type}: ${row.team_count} teams, Best: #${row.best_rank}, Worst: #${row.worst_rank}, Avg: #${row.avg_rank}`);
    });
    
    console.log(`\nTotal rankings stored: ${result.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error showing rankings:', error.message);
  } finally {
    client.release();
  }
}

async function main() {
  await showAllRankings();
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { showAllRankings };