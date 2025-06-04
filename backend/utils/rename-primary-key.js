/**
 * Rename Primary Key Script
 * 
 * This script:
 * 1. Renames the "institution_id" column to "school_id" in the schools table
 * 2. Recreates the foreign key constraints in the teams and venues tables
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
    
    // Check if the schools table has a primary key constraint
    const { rows: pkConstraints } = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'schools'
      AND constraint_type = 'PRIMARY KEY'
    `);
    
    // Drop the primary key constraint if it exists
    if (pkConstraints.length > 0) {
      const pkConstraintName = pkConstraints[0].constraint_name;
      console.log(`Dropping primary key constraint ${pkConstraintName}...`);
      await client.query(`ALTER TABLE schools DROP CONSTRAINT ${pkConstraintName}`);
      console.log(`Dropped primary key constraint ${pkConstraintName}`);
    }
    
    // Rename the institution_id column to school_id
    console.log('Renaming institution_id column to school_id in schools table...');
    await client.query('ALTER TABLE schools RENAME COLUMN institution_id TO school_id');
    console.log('Renamed institution_id to school_id in schools table');
    
    // Add the primary key constraint back
    console.log('Adding primary key constraint...');
    await client.query('ALTER TABLE schools ADD PRIMARY KEY (school_id)');
    console.log('Added primary key constraint');
    
    // Recreate the foreign key constraints
    console.log('Recreating foreign key constraints...');
    
    // Check if teams table has a foreign key constraint
    const { rows: teamsFKs } = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'teams'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%school_id%'
    `);
    
    // Drop the existing foreign key constraint if it exists
    if (teamsFKs.length > 0) {
      const fkConstraintName = teamsFKs[0].constraint_name;
      console.log(`Dropping foreign key constraint ${fkConstraintName} from teams table...`);
      await client.query(`ALTER TABLE teams DROP CONSTRAINT ${fkConstraintName}`);
      console.log(`Dropped foreign key constraint ${fkConstraintName}`);
    }
    
    // Create the foreign key constraint for teams
    console.log('Creating foreign key constraint for teams table...');
    await client.query(`
      ALTER TABLE teams 
      ADD CONSTRAINT teams_school_id_fkey 
      FOREIGN KEY (school_id) 
      REFERENCES schools(school_id)
    `);
    console.log('Created foreign key constraint for teams table');
    
    // Check if venues table has a foreign key constraint
    const { rows: venuesFKs } = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'venues'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%school_id%'
    `);
    
    // Drop the existing foreign key constraint if it exists
    if (venuesFKs.length > 0) {
      const fkConstraintName = venuesFKs[0].constraint_name;
      console.log(`Dropping foreign key constraint ${fkConstraintName} from venues table...`);
      await client.query(`ALTER TABLE venues DROP CONSTRAINT ${fkConstraintName}`);
      console.log(`Dropped foreign key constraint ${fkConstraintName}`);
    }
    
    // Create the foreign key constraint for venues
    console.log('Creating foreign key constraint for venues table...');
    await client.query(`
      ALTER TABLE venues 
      ADD CONSTRAINT venues_school_id_fkey 
      FOREIGN KEY (school_id) 
      REFERENCES schools(school_id)
    `);
    console.log('Created foreign key constraint for venues table');
    
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
    
    // Show the constraints on the schools table
    const { rows: schoolConstraints } = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'schools'
      ORDER BY constraint_name
    `);
    
    console.log('\nConstraints on schools table:');
    schoolConstraints.forEach(constraint => {
      console.log(`- ${constraint.constraint_name} (${constraint.constraint_type})`);
    });
    
    // Show the foreign key constraints referencing the schools table
    const { rows: fkConstraints } = await client.query(`
      SELECT tc.table_name, tc.constraint_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND kcu.table_schema = 'public'
      AND tc.table_schema = 'public'
      AND kcu.referenced_table_name = 'schools'
      ORDER BY tc.table_name, tc.constraint_name
    `);
    
    console.log('\nForeign key constraints referencing schools table:');
    fkConstraints.forEach(constraint => {
      console.log(`- ${constraint.table_name}.${constraint.column_name} (${constraint.constraint_name})`);
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
  .then(() => console.log('Primary key rename completed'))
  .catch(err => console.error('Script failed:', err));
