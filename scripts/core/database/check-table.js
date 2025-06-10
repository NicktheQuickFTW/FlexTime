const path = require('path');
const neonDB = require(path.join(__dirname, 'backend', 'src', 'config', 'neon-database'));

async function checkTable() {
  try {
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const client = await neonDB.pool.connect();
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      ORDER BY ordinal_position
    `);
    
    console.log('Existing teams table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error checking table structure:', error.message);
    process.exit(1);
  }
}

checkTable();