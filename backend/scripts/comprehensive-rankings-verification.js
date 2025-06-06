/**
 * Comprehensive Verification of All Rankings and Constraints in HELiiX Database
 */

const neonDB = require('../config/neon-database.js');

async function showComprehensiveRankingsReport() {
  console.log('🏆 COMPREHENSIVE SPORTS RANKINGS & CONSTRAINTS REPORT');
  console.log('='.repeat(70));
  
  const client = await neonDB.pool.connect();
  
  try {
    // 1. Rankings Summary by Sport
    console.log('\n📊 RANKINGS SUMMARY BY SPORT');
    console.log('-'.repeat(50));
    
    const sportsSummary = await client.query(`
      SELECT 
        sport,
        ranking_type,
        COUNT(*) as team_count,
        MIN(rank_value) as best_rank,
        MAX(rank_value) as worst_rank,
        AVG(rank_value)::DECIMAL(5,1) as avg_rank,
        season
      FROM sports_rankings
      WHERE rank_value IS NOT NULL
      GROUP BY sport, ranking_type, season
      ORDER BY sport, ranking_type
    `);
    
    sportsSummary.rows.forEach(row => {
      console.log(`${row.sport.toUpperCase().padEnd(20)} ${row.ranking_type.padEnd(15)} ${row.season}: ${String(row.team_count).padStart(2)} teams, Best: #${String(row.best_rank).padStart(3)}, Worst: #${String(row.worst_rank).padStart(3)}, Avg: #${row.avg_rank}`);
    });
    
    // 2. Conference Rankings
    console.log('\n🏅 BIG 12 CONFERENCE RANKINGS');
    console.log('-'.repeat(50));
    
    const confRankings = await client.query(`
      SELECT 
        sport,
        ranking_type,
        rank_value,
        metadata,
        season
      FROM sports_rankings
      WHERE team_id IS NULL AND rank_value IS NOT NULL
      ORDER BY sport, season
    `);
    
    confRankings.rows.forEach(row => {
      const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
      console.log(`${row.sport.toUpperCase().padEnd(15)} ${row.season}: Conference Rank #${row.rank_value} (${meta.numTeams || 'N/A'} teams)`);
    });
    
    // 3. Top Individual Team Rankings
    console.log('\n🥇 TOP BIG 12 TEAM RANKINGS BY SPORT');
    console.log('-'.repeat(50));
    
    const topRankings = await client.query(`
      SELECT DISTINCT ON (sr.sport, sr.ranking_type)
        sr.sport,
        sr.ranking_type,
        t.name as team_name,
        sr.rank_value,
        sr.rank_score,
        sr.win_loss_record,
        sr.season
      FROM sports_rankings sr
      JOIN teams t ON sr.team_id = t.team_id
      WHERE sr.rank_value IS NOT NULL
      ORDER BY sr.sport, sr.ranking_type, sr.rank_value ASC
    `);
    
    topRankings.rows.forEach(row => {
      const scoreStr = row.rank_score ? ` (${row.rank_score})` : '';
      const recordStr = row.win_loss_record ? ` - ${row.win_loss_record}` : '';
      console.log(`${row.sport.toUpperCase().padEnd(15)} ${row.ranking_type.padEnd(15)} #${String(row.rank_value).padStart(3)} ${row.team_name}${scoreStr}${recordStr}`);
    });
    
    // 4. Final Exam Constraints
    console.log('\n📅 FINAL EXAM CONSTRAINTS (2025-26)');
    console.log('-'.repeat(50));
    
    const examConstraints = await client.query(`
      SELECT 
        description,
        parameters,
        is_active
      FROM constraints
      WHERE constraint_type = 'final-exam-period'
      ORDER BY description
    `);
    
    const constraintsBySemester = { 'Fall 2025': [], 'Spring 2026': [] };
    examConstraints.rows.forEach(row => {
      const params = typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters;
      constraintsBySemester[params.semester].push({
        school: params.school,
        period: params.period,
        active: row.is_active
      });
    });
    
    Object.entries(constraintsBySemester).forEach(([semester, constraints]) => {
      console.log(`\n${semester} Final Exams:`);
      constraints.forEach(c => {
        const status = c.active ? '✅' : '❌';
        console.log(`  ${status} ${c.school.padEnd(15)} ${c.period}`);
      });
    });
    
    // 5. Database Statistics
    console.log('\n📈 DATABASE STATISTICS');
    console.log('-'.repeat(50));
    
    const totalRankings = await client.query('SELECT COUNT(*) as count FROM sports_rankings');
    const totalConstraints = await client.query('SELECT COUNT(*) as count FROM constraints');
    const totalTeams = await client.query('SELECT COUNT(DISTINCT team_id) as count FROM sports_rankings WHERE team_id IS NOT NULL');
    const sportsCount = await client.query('SELECT COUNT(DISTINCT sport) as count FROM sports_rankings');
    
    console.log(`Total Rankings Stored: ${totalRankings.rows[0].count}`);
    console.log(`Total Constraints: ${totalConstraints.rows[0].count}`);
    console.log(`Teams with Rankings: ${totalTeams.rows[0].count}`);
    console.log(`Sports Covered: ${sportsCount.rows[0].count}`);
    
    // 6. Most Recent Rankings by Sport
    console.log('\n🕒 MOST RECENT RANKINGS BY SPORT');
    console.log('-'.repeat(50));
    
    const recentRankings = await client.query(`
      SELECT 
        sport,
        ranking_type,
        COUNT(*) as teams_ranked,
        MAX(ranking_date) as latest_date,
        season
      FROM sports_rankings
      WHERE team_id IS NOT NULL
      GROUP BY sport, ranking_type, season
      ORDER BY sport, ranking_type
    `);
    
    recentRankings.rows.forEach(row => {
      console.log(`${row.sport.toUpperCase().padEnd(15)} ${row.ranking_type.padEnd(15)} ${row.season}: ${String(row.teams_ranked).padStart(2)} teams (${row.latest_date.toDateString()})`);
    });
    
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
  } finally {
    client.release();
  }
}

async function main() {
  await showComprehensiveRankingsReport();
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { showComprehensiveRankingsReport };