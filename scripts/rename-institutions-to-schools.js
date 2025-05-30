/**
 * Rename Institutions to Schools Script
 * 
 * This script:
 * 1. Renames the "institutions" table to "schools"
 * 2. Updates all references to "school_id" to "school_id" in all tables
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
      
      // If connection string is not found, try to construct it from individual variables
      if (!connectionString) {
        const host = process.env.NEON_DB_HOST;
        const user = process.env.NEON_DB_USER;
        const password = process.env.NEON_DB_PASSWORD;
        const database = process.env.NEON_DB_NAME;
        
        if (host && user && password && database) {
          connectionString = `postgresql://${user}:${password}@${host}/${database}?sslmode=prefer`;
          console.log('Constructed connection string from individual variables');
        }
      }
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

// Function to get all tables in the database
const getAllTables = async (client) => {
  const { rows } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  `);
  
  return rows.map(row => row.table_name);
};

// Function to check if a constraint exists
const constraintExists = async (client, constraintName) => {
  const { rows } = await client.query(`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND constraint_name = $1
  `, [constraintName]);
  
  return rows.length > 0;
};

// Function to check if an index exists
const indexExists = async (client, indexName) => {
  const { rows } = await client.query(`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname = $1
  `, [indexName]);
  
  return rows.length > 0;
};

// Function to get all foreign keys referencing the institutions table
const getForeignKeys = async (client) => {
  const { rows } = await client.query(`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM
      information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE
      tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'institutions'
  `);
  
  return rows;
};

// Function to get all columns in a table
const getTableColumns = async (client, tableName) => {
  const { rows } = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
  `, [tableName]);
  
  return rows;
};

// Function to rename the institutions table to schools
const renameInstitutionsToSchools = async (client) => {
  console.log('Renaming institutions table to schools...');
  
  // First, get all foreign keys referencing the institutions table
  const foreignKeys = await getForeignKeys(client);
  console.log(`Found ${foreignKeys.length} foreign key constraints referencing institutions table`);
  
  // Drop all foreign key constraints
  for (const fk of foreignKeys) {
    try {
      await client.query(`ALTER TABLE ${fk.table_name} DROP CONSTRAINT IF EXISTS ${fk.constraint_name}`);
      console.log(`Dropped foreign key constraint ${fk.constraint_name} from ${fk.table_name}`);
    } catch (error) {
      console.log(`Warning: Could not drop constraint ${fk.constraint_name}: ${error.message}`);
    }
  }
  
  // Rename the institutions table to schools
  await client.query('ALTER TABLE institutions RENAME TO schools');
  console.log('Renamed institutions table to schools');
  
  // Rename the primary key constraint if it exists
  if (await indexExists(client, 'institutions_pkey')) {
    await client.query('ALTER INDEX institutions_pkey RENAME TO schools_pkey');
    console.log('Renamed primary key constraint');
  } else {
    console.log('Primary key constraint not found, skipping rename');
  }
  
  // Rename the unique constraint on name if it exists
  if (await constraintExists(client, 'institutions_name_key')) {
    await client.query('ALTER TABLE schools RENAME CONSTRAINT institutions_name_key TO schools_name_key');
    console.log('Renamed unique constraint on name');
  } else {
    console.log('Unique constraint on name not found, skipping rename');
  }
  
  // Get all tables in the database
  const tables = await getAllTables(client);
  
  // For each table, check if it has an school_id column and rename it
  for (const table of tables) {
    try {
      const columns = await getTableColumns(client, table);
      
      for (const column of columns) {
        if (column.column_name === 'school_id') {
          await client.query(`ALTER TABLE ${table} RENAME COLUMN school_id TO school_id`);
          console.log(`Renamed school_id to school_id in ${table}`);
        }
      }
    } catch (error) {
      console.log(`Warning: Could not process table ${table}: ${error.message}`);
    }
  }
  
  // Recreate the foreign key constraints with the new names
  for (const fk of foreignKeys) {
    try {
      const newConstraintName = `${fk.table_name}_school_id_fkey`;
      const newColumnName = 'school_id';
      
      await client.query(`
        ALTER TABLE ${fk.table_name} 
        ADD CONSTRAINT ${newConstraintName} 
        FOREIGN KEY (${newColumnName}) 
        REFERENCES schools(school_id)
      `);
      
      console.log(`Recreated foreign key constraint ${newConstraintName} in ${fk.table_name}`);
    } catch (error) {
      console.log(`Warning: Could not recreate constraint for ${fk.table_name}: ${error.message}`);
    }
  }
  
  console.log('Completed renaming institutions to schools');
};

// Function to rename the name column in the teams table to team
const renameNameToTeamInTeamsTable = async (client) => {
  console.log('Renaming name column to team in teams table...');
  
  // Check if the teams table exists
  const { rows: tables } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'teams'
  `);
  
  if (tables.length === 0) {
    console.log('Teams table not found');
    return;
  }
  
  // Check if the name column exists in the teams table
  const { rows: columns } = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teams' 
    AND column_name = 'name'
  `);
  
  if (columns.length === 0) {
    console.log('Name column not found in teams table');
    return;
  }
  
  // Rename the name column to team
  await client.query('ALTER TABLE teams RENAME COLUMN name TO team');
  console.log('Renamed name column to team in teams table');
};

// Main function
const main = async () => {
  let client;
  
  try {
    client = await connectToDatabase();
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Rename institutions to schools
    await renameInstitutionsToSchools(client);
    
    // Rename name to team in teams table
    await renameNameToTeamInTeamsTable(client);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Database schema updated successfully');
    
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
    
  } catch (error) {
    console.error('Error updating database schema:', error);
    
    // Rollback the transaction in case of error
    if (client) {
      await client.query('ROLLBACK');
      console.log('Transaction rolled back due to error');
    }
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
