const { Pool } = require('pg');
require('dotenv').config();

async function checkSchema() {
  const connectionString = process.env.NEON_DB_CONNECTION_STRING || 'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=require';
  
  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sports'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('Sports table does not exist yet');
      return;
    }

    // Get column information
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'sports'
      ORDER BY ordinal_position;
    `);

    console.log('Current sports table columns:');
    console.table(columns.rows);

    // Get table constraints
    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'sports'::regclass;
    `);

    console.log('\nTable constraints:');
    console.table(constraints.rows);

  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema().catch(console.error);
