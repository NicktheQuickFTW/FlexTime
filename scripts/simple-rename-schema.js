/**
 * Simple Rename Schema Script
 * 
 * This script:
 * 1. Renames the "institutions" table to "schools"
 * 2. Updates all references to "school_id" to "school_id" in teams and venues tables
 * 3. Renames the "name" column in the teams table to "team"
 */

const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

// Load environment variables from .env file
const dotenvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
  console.log(`Loaded environment variables from ${dotenvPath}`);
} else {
  require('dotenv').config();
  console.log('Loaded environment variables from default location');
}

// Database connection
const connectToDatabase = async () => {
  try {
    // Check if we're running in Docker environment
    const isDockerEnvironment = process.env.POSTGRES_URI && process.env.POSTGRES_URI.includes('@postgres:');
    
    let connectionString;
    if (isDockerEnvironment) {
      console.log('Using Docker PostgreSQL connection');
      connectionString = process.env.POSTGRES_URI;
    } else {
      console.log('Using Neon DB connection');
      connectionString = process.env.NEON_DB_CONNECTION_STRING;
      console.log(`Connection string: ${connectionString ? 'Found' : 'Not found'}`);
    }
    
    if (!connectionString) {
      throw new Error('No database connection string available. Please check your environment variables.');
    }
    
    const client = new Client({ connectionString });
    await client.connect();
    console.log('Connected to database successfully');
    return client;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  let client;
  
  try {
    client = await connectToDatabase();
    
    // Execute each statement individually to avoid transaction issues
    
    // 1. Drop foreign key constraints
    console.log('Dropping foreign key constraints...');
    try {
      await client.query('ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_school_id_fkey');
      console.log('Dropped teams_school_id_fkey constraint');
    } catch (error) {
      console.log(`Warning: ${error.message}`);
    }
    
    try {
      await client.query('ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_school_id_fkey');
      console.log('Dropped venues_school_id_fkey constraint');
    } catch (error) {
      console.log(`Warning: ${error.message}`);
    }
    
    // 2. Rename institutions table to schools
    console.log('Renaming institutions table to schools...');
    try {
      await client.query('ALTER TABLE institutions RENAME TO schools');
      console.log('Renamed institutions table to schools');
    } catch (error) {
      console.log(`Warning: ${error.message}`);
    }
    
    // 3. Rename school_id columns to school_id
    console.log('Renaming school_id columns to school_id...');
    try {
      await client.query('ALTER TABLE teams RENAME COLUMN school_id TO school_id');
      console.log('Renamed school_id to school_id in teams table');
    } catch (error) {
      console.log(`Warning: ${error.message}`);
    }
    
    try {
      await client.query('ALTER TABLE venues RENAME COLUMN school_id TO school_id');
      console.log('Renamed school_id to school_id in venues table');
    } catch (error) {
      console.log(`Warning: ${error.message}`);
    }
    
    // 4. Rename name column to team in teams table
    console.log('Renaming name column to team in teams table...');
    try {
      await client.query('ALTER TABLE teams RENAME COLUMN name TO team');
      console.log('Renamed name column to team in teams table');
    } catch (error) {
      console.log(`Warning: ${error.message}`);
    }
    
    // 5. Recreate foreign key constraints
    console.log('Recreating foreign key constraints...');
    try {
      await client.query(`
        ALTER TABLE teams 
        ADD CONSTRAINT teams_school_id_fkey 
        FOREIGN KEY (school_id) 
        REFERENCES schools(school_id)
      `);
      console.log('Recreated teams_school_id_fkey constraint');
    } catch (error) {
      console.log(`Warning: ${error.message}`);
    }
    
    try {
      await client.query(`
        ALTER TABLE venues 
        ADD CONSTRAINT venues_school_id_fkey 
        FOREIGN KEY (school_id) 
        REFERENCES schools(school_id)
      `);
      console.log('Recreated venues_school_id_fkey constraint');
    } catch (error) {
      console.log(`Warning: ${error.message}`);
    }
    
    // Show the updated tables
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\nUpdated tables:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Show the columns in the schools table
    const { rows: schoolColumns } = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'schools'
      ORDER BY ordinal_position
    `);
    
    console.log('\nColumns in schools table:');
    schoolColumns.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type})`);
    });
    
    // Show the columns in the teams table
    const { rows: teamColumns } = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'teams'
      ORDER BY ordinal_position
    `);
    
    console.log('\nColumns in teams table:');
    teamColumns.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type})`);
    });
    
    console.log('\nDatabase schema updated successfully');
    
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    if (client) {
      await client.end();
      console.log('Database connection closed');
    }
  }
};

// Run the script
main()
  .then(() => console.log('Database schema update completed'))
  .catch(err => console.error('Script failed:', err));
