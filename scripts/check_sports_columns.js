const { Client } = require('pg');

async function checkSportsColumns() {
  const connectionString = 'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=require';
  
  console.log('Checking sports table columns...');
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    
    // Get column information
    const columns = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'sports'
      ORDER BY ordinal_position;
    `);

    console.log('\nSports table columns:');
    console.table(columns.rows);
    
    // Get row count
    const count = await client.query('SELECT COUNT(*) FROM sports');
    console.log(`\nTotal rows in sports table: ${count.rows[0].count}`);
    
    // Get sample data
    if (count.rows[0].count > 0) {
      const sample = await client.query('SELECT * FROM sports LIMIT 3');
      console.log('\nSample data:');
      console.table(sample.rows);
    }
    
  } catch (error) {
    console.error('Error checking sports table:', error);
  } finally {
    await client.end();
  }
}

checkSportsColumns().catch(console.error);
