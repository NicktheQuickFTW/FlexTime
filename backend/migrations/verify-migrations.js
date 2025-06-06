const { Pool } = require('pg');
const db = new Pool({ connectionString: process.env.NEON_DB_CONNECTION_STRING });

async function verifyMigrations() {
  console.log('=== MIGRATION VERIFICATION ===\n');
  
  // Check schemas
  const schemas = await db.query(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('team_availability', 'venue_management', 'constraint_validation', 'schedule_generation', 'shared_data') ORDER BY schema_name"
  );
  console.log('✅ Created Schemas:');
  schemas.rows.forEach(s => console.log('   -', s.schema_name));
  
  // Check new tables in each schema
  console.log('\n✅ Tables Created:');
  
  const venueTables = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'venue_management' ORDER BY table_name"
  );
  console.log('\n   venue_management:');
  venueTables.rows.forEach(t => console.log('     -', t.table_name));
  
  const constraintTables = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'constraint_validation' ORDER BY table_name"
  );
  console.log('\n   constraint_validation:');
  constraintTables.rows.forEach(t => console.log('     -', t.table_name));
  
  const scheduleTables = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'schedule_generation' ORDER BY table_name"
  );
  console.log('\n   schedule_generation:');
  scheduleTables.rows.forEach(t => console.log('     -', t.table_name));
  
  // Check data migration
  console.log('\n✅ Data Migration Status:');
  
  const venueCount = await db.query('SELECT COUNT(*) FROM venue_management.venues');
  console.log('   - Venues copied:', venueCount.rows[0].count);
  
  const constraintCount = await db.query('SELECT COUNT(*) FROM constraint_validation.constraints');
  console.log('   - Constraints copied:', constraintCount.rows[0].count);
  
  const categoryCount = await db.query('SELECT COUNT(*) FROM constraint_validation.constraint_categories');
  console.log('   - Constraint categories created:', categoryCount.rows[0].count);
  
  // Check functions
  console.log('\n✅ API Functions Created:');
  const functions = await db.query(
    "SELECT routine_schema, routine_name FROM information_schema.routines WHERE routine_schema IN ('venue_management', 'constraint_validation', 'schedule_generation') AND routine_type = 'FUNCTION' ORDER BY routine_schema, routine_name"
  );
  functions.rows.forEach(f => console.log('   -', f.routine_schema + '.' + f.routine_name + '()'));
  
  await db.end();
}

verifyMigrations().catch(console.error);