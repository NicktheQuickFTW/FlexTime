const { Pool } = require('pg');
const db = new Pool({ connectionString: process.env.NEON_DB_CONNECTION_STRING });

async function analyzeTables() {
  console.log('=== DATABASE SCHEMA ANALYSIS ===\n');
  
  // Get all tables
  const tables = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  console.log('Tables needed for migrations:');
  const relevantTables = ['venues', 'venue_unavailability', 'constraints', 'schedules', 'games', 'teams', 'sports', 'institutions'];
  
  for (const tableName of relevantTables) {
    const exists = tables.rows.find(t => t.table_name === tableName);
    console.log(`  ${exists ? '✓' : '✗'} ${tableName}`);
  }
  
  console.log('\n--- VENUES TABLE ---');
  const venues = await db.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'venues' 
    ORDER BY ordinal_position
  `);
  venues.rows.forEach(c => {
    console.log(`  ${c.column_name}: ${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}${c.column_default ? ' DEFAULT ' + c.column_default : ''}`);
  });
  
  console.log('\n--- CONSTRAINTS TABLE ---');
  const constraints = await db.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'constraints' 
    ORDER BY ordinal_position
  `);
  constraints.rows.forEach(c => {
    console.log(`  ${c.column_name}: ${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}${c.column_default ? ' DEFAULT ' + c.column_default : ''}`);
  });
  
  console.log('\n--- CONSTRAINTS PRIMARY KEY ---');
  const constraintsPK = await db.query(`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'constraints' 
    AND tc.constraint_type = 'PRIMARY KEY'
  `);
  console.log('  Primary key:', constraintsPK.rows.map(r => r.column_name).join(', ') || 'None');
  
  console.log('\n--- SCHEDULES TABLE ---');
  const schedules = await db.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'schedules' 
    ORDER BY ordinal_position
  `);
  schedules.rows.forEach(c => {
    console.log(`  ${c.column_name}: ${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
  });
  
  console.log('\n--- GAMES TABLE (if exists) ---');
  const games = await db.query(`
    SELECT column_name, data_type
    FROM information_schema.columns 
    WHERE table_name = 'games' 
    ORDER BY ordinal_position
    LIMIT 10
  `);
  if (games.rows.length > 0) {
    games.rows.forEach(c => {
      console.log(`  ${c.column_name}: ${c.data_type}`);
    });
  } else {
    console.log('  Table does not exist');
  }
  
  console.log('\n--- VENUE_UNAVAILABILITY TABLE ---');
  const venueUnavail = await db.query(`
    SELECT column_name, data_type
    FROM information_schema.columns 
    WHERE table_name = 'venue_unavailability' 
    ORDER BY ordinal_position
  `);
  if (venueUnavail.rows.length > 0) {
    venueUnavail.rows.forEach(c => {
      console.log(`  ${c.column_name}: ${c.data_type}`);
    });
  } else {
    console.log('  Table does not exist');
  }
  
  await db.end();
}

analyzeTables().catch(console.error);