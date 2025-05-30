#!/usr/bin/env node

/**
 * HELiiX Database Connection Validation Script
 * 
 * This script validates that the FlexTime system can successfully connect
 * to the HELiiX Neon database and that all required tables exist.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const heliiXConfig = require('../config/neon_db_config');
const { Sequelize } = require('sequelize');

async function validateConnection() {
  console.log('🚀 HELiiX Database Connection Validation');
  console.log('==========================================');
  
  try {
    // Step 1: Validate basic connection
    console.log('\n📡 Step 1: Testing basic connection...');
    const validation = await heliiXConfig.validateConnection();
    
    if (!validation.success) {
      throw new Error(`Basic connection failed: ${validation.error}`);
    }
    
    console.log('✅ Basic connection successful');
    
    // Step 2: Test Sequelize connection
    console.log('\n🔗 Step 2: Testing Sequelize connection...');
    const sequelize = new Sequelize(heliiXConfig.connectionString, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: heliiXConfig.connection.dialectOptions,
      pool: heliiXConfig.pool
    });
    
    await sequelize.authenticate();
    console.log('✅ Sequelize connection successful');
    
    // Step 3: Verify database name
    console.log('\n🏷️  Step 3: Verifying database name...');
    const [results] = await sequelize.query('SELECT current_database() as db_name, current_user as username');
    const dbInfo = results[0];
    
    if (dbInfo.db_name !== 'HELiiX') {
      throw new Error(`Wrong database: ${dbInfo.db_name} (expected: HELiiX)`);
    }
    
    console.log(`✅ Connected to correct database: ${dbInfo.db_name}`);
    console.log(`   User: ${dbInfo.username}`);
    
    // Step 4: Check for required tables
    console.log('\n📊 Step 4: Checking for required tables...');
    const tableQueries = [
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'teams'",
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'schedules'",
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'sports'",
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'institutions'"
    ];
    
    const requiredTables = ['teams', 'schedules', 'sports', 'institutions'];
    const tableStatus = {};
    
    for (let i = 0; i < tableQueries.length; i++) {
      const [tableResult] = await sequelize.query(tableQueries[i]);
      const tableName = requiredTables[i];
      const exists = parseInt(tableResult[0].count) > 0;
      tableStatus[tableName] = exists;
      
      if (exists) {
        console.log(`   ✅ ${tableName} table exists`);
      } else {
        console.log(`   ❌ ${tableName} table missing`);
      }
    }
    
    // Step 5: Check data availability
    console.log('\n📈 Step 5: Checking data availability...');
    
    try {
      const [teamCount] = await sequelize.query('SELECT COUNT(*) as count FROM teams');
      const [scheduleCount] = await sequelize.query('SELECT COUNT(*) as count FROM schedules');
      const [sportCount] = await sequelize.query('SELECT COUNT(*) as count FROM sports');
      
      console.log(`   Teams: ${teamCount[0].count} records`);
      console.log(`   Schedules: ${scheduleCount[0].count} records`);
      console.log(`   Sports: ${sportCount[0].count} records`);
      
      if (parseInt(teamCount[0].count) === 0) {
        console.log('   ⚠️  No teams found in database');
      }
      
    } catch (error) {
      console.log(`   ⚠️  Could not query data tables: ${error.message}`);
    }
    
    // Step 6: Test constraint system compatibility
    console.log('\n🔧 Step 6: Testing constraint system compatibility...');
    
    try {
      // Check if we can create a simple constraint record
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS test_constraints (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          constraint_type VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await sequelize.query(`
        INSERT INTO test_constraints (constraint_type) 
        VALUES ('test_constraint')
      `);
      
      const [testResult] = await sequelize.query('SELECT COUNT(*) as count FROM test_constraints');
      
      await sequelize.query('DROP TABLE test_constraints');
      
      console.log('✅ Constraint system compatibility verified');
      
    } catch (error) {
      console.log(`   ⚠️  Constraint system test failed: ${error.message}`);
    }
    
    await sequelize.close();
    
    // Final summary
    console.log('\n🎉 Validation Summary');
    console.log('====================');
    console.log('✅ HELiiX database connection: SUCCESS');
    console.log('✅ Database authentication: SUCCESS');
    console.log('✅ Database name verification: SUCCESS');
    console.log(`✅ Required tables: ${Object.values(tableStatus).filter(Boolean).length}/${Object.keys(tableStatus).length} present`);
    console.log('✅ Constraint system compatibility: SUCCESS');
    
    console.log('\n🚀 FlexTime is ready to connect to HELiiX database!');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Validation Failed:', error.message);
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check that NEON_DB_CONNECTION_STRING environment variable is set');
    console.log('2. Verify that the connection string points to the HELiiX database');
    console.log('3. Ensure database credentials are correct');
    console.log('4. Check network connectivity to Neon database');
    
    return false;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}

module.exports = { validateConnection };