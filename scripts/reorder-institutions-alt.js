/**
 * Reorder Institutions Script (Alternative Approach)
 * 
 * This script:
 * 1. Orders institutions alphabetically
 * 2. Assigns IDs 1-16 to the first 16 institutions (main institutions)
 * 3. Assigns IDs 17+ to the remaining institutions (affiliate institutions)
 * 4. Updates all references to the institutions
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

// Big 12 institutions (these will be assigned IDs 1-16)
const big12Institutions = [
  'Arizona',
  'Arizona State',
  'Baylor',
  'BYU',
  'Cincinnati',
  'Colorado',
  'Houston',
  'Iowa State',
  'Kansas',
  'K-State',
  'Oklahoma State',
  'TCU',
  'Texas Tech',
  'UCF',
  'Utah',
  'West Virginia'
];

// Function to reorder institutions
const reorderInstitutions = async (client) => {
  console.log('Reordering institutions...');
  
  // Get all institutions
  const { rows: allInstitutions } = await client.query(
    'SELECT * FROM institutions ORDER BY name'
  );
  
  console.log(`Found ${allInstitutions.length} institutions to reorder`);
  
  // Separate Big 12 and affiliate institutions
  const big12 = [];
  const affiliates = [];
  
  for (const institution of allInstitutions) {
    if (big12Institutions.includes(institution.name)) {
      big12.push(institution);
    } else {
      affiliates.push(institution);
    }
  }
  
  // Sort both arrays alphabetically by name
  big12.sort((a, b) => a.name.localeCompare(b.name));
  affiliates.sort((a, b) => a.name.localeCompare(b.name));
  
  console.log(`Found ${big12.length} Big 12 institutions and ${affiliates.length} affiliate institutions`);
  
  // Create a mapping of old IDs to new IDs
  const idMapping = new Map();
  
  // Assign IDs 1-16 to Big 12 institutions
  for (let i = 0; i < big12.length; i++) {
    idMapping.set(big12[i].school_id, i + 1);
  }
  
  // Assign IDs 17+ to affiliate institutions
  for (let i = 0; i < affiliates.length; i++) {
    idMapping.set(affiliates[i].school_id, i + 17);
  }
  
  // Log the ID mappings
  console.log('\nID mappings:');
  for (const [oldId, newId] of idMapping) {
    console.log(`Mapping institution ID ${oldId} to ${newId}`);
  }
  
  // Export the current data to a JSON file
  console.log('Exporting current data to JSON...');
  
  // Get all teams
  const { rows: teams } = await client.query('SELECT * FROM teams');
  
  // Get all venues
  const { rows: venues } = await client.query('SELECT * FROM venues');
  
  // Create a temporary table for institutions with new IDs
  await client.query(`
    CREATE TEMPORARY TABLE temp_institutions (
      school_id INTEGER,
      name VARCHAR(100),
      abbreviation VARCHAR(10),
      mascot VARCHAR(50),
      primary_color VARCHAR(7),
      secondary_color VARCHAR(7),
      city VARCHAR(100),
      state VARCHAR(2),
      created_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE
    )
  `);
  
  // Insert Big 12 institutions first with IDs 1-16
  for (let i = 0; i < big12.length; i++) {
    const inst = big12[i];
    const newId = i + 1;
    
    await client.query(`
      INSERT INTO temp_institutions (
        school_id, name, abbreviation, mascot, primary_color, secondary_color, city, state, created_at, updated_at
      ) 
      SELECT 
        $1, name, abbreviation, mascot, primary_color, secondary_color, city, state, created_at, updated_at
      FROM 
        institutions
      WHERE 
        school_id = $2
    `, [newId, inst.school_id]);
    
    console.log(`Inserted ${inst.name} with new ID ${newId}`);
  }
  
  // Insert affiliate institutions with IDs 17+
  for (let i = 0; i < affiliates.length; i++) {
    const inst = affiliates[i];
    const newId = i + 17;
    
    await client.query(`
      INSERT INTO temp_institutions (
        school_id, name, abbreviation, mascot, primary_color, secondary_color, city, state, created_at, updated_at
      ) 
      SELECT 
        $1, name, abbreviation, mascot, primary_color, secondary_color, city, state, created_at, updated_at
      FROM 
        institutions
      WHERE 
        school_id = $2
    `, [newId, inst.school_id]);
    
    console.log(`Inserted ${inst.name} with new ID ${newId}`);
  }
  
  // Create temporary tables for teams and venues with updated institution IDs
  await client.query(`
    CREATE TEMPORARY TABLE temp_teams AS 
    SELECT * FROM teams
  `);
  
  await client.query(`
    CREATE TEMPORARY TABLE temp_venues AS 
    SELECT * FROM venues
  `);
  
  // Update institution IDs in the temporary tables
  for (const [oldId, newId] of idMapping) {
    await client.query(
      'UPDATE temp_teams SET school_id = $1 WHERE school_id = $2',
      [newId, oldId]
    );
    
    await client.query(
      'UPDATE temp_venues SET school_id = $1 WHERE school_id = $2',
      [newId, oldId]
    );
  }
  
  // Generate SQL to recreate the database with the new institution IDs
  console.log('Generating SQL to recreate the database...');
  
  // SQL for dropping constraints
  const dropConstraintsSQL = `
    -- Drop foreign key constraints
    ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_school_id_fkey;
    ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_school_id_fkey;
    
    -- Drop primary key constraints
    ALTER TABLE institutions DROP CONSTRAINT IF EXISTS institutions_pkey;
    ALTER TABLE institutions DROP CONSTRAINT IF EXISTS institutions_name_key;
  `;
  
  // SQL for recreating the institutions table
  const recreateInstitutionsSQL = `
    -- Truncate the institutions table
    TRUNCATE TABLE institutions;
    
    -- Insert the reordered institutions
    INSERT INTO institutions (
      school_id, name, abbreviation, mascot, primary_color, secondary_color, city, state, created_at, updated_at
    )
    SELECT 
      school_id, name, abbreviation, mascot, primary_color, secondary_color, city, state, created_at, updated_at
    FROM 
      temp_institutions
    ORDER BY 
      school_id;
  `;
  
  // SQL for updating teams and venues
  const updateReferencesSQL = `
    -- Update teams
    UPDATE teams t
    SET school_id = tt.school_id
    FROM temp_teams tt
    WHERE t.team_id = tt.team_id;
    
    -- Update venues
    UPDATE venues v
    SET school_id = tv.school_id
    FROM temp_venues tv
    WHERE v.venue_id = tv.venue_id;
  `;
  
  // SQL for recreating constraints
  const recreateConstraintsSQL = `
    -- Recreate primary key constraints
    ALTER TABLE institutions ADD PRIMARY KEY (school_id);
    ALTER TABLE institutions ADD CONSTRAINT institutions_name_key UNIQUE (name);
    
    -- Recreate foreign key constraints
    ALTER TABLE teams ADD CONSTRAINT teams_school_id_fkey 
      FOREIGN KEY (school_id) REFERENCES institutions(school_id);
    ALTER TABLE venues ADD CONSTRAINT venues_school_id_fkey 
      FOREIGN KEY (school_id) REFERENCES institutions(school_id);
  `;
  
  // Execute the SQL statements
  console.log('Executing SQL to reorder institutions...');
  
  // Drop constraints
  await client.query(dropConstraintsSQL);
  console.log('Dropped constraints');
  
  // Recreate the institutions table
  await client.query(recreateInstitutionsSQL);
  console.log('Recreated institutions table with reordered data');
  
  // Update references
  await client.query(updateReferencesSQL);
  console.log('Updated references in teams and venues tables');
  
  // Recreate constraints
  await client.query(recreateConstraintsSQL);
  console.log('Recreated constraints');
  
  console.log('Institutions reordered successfully');
};

// Main function
const main = async () => {
  let client;
  
  try {
    client = await connectToDatabase();
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Reorder institutions
    await reorderInstitutions(client);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Show the final list of institutions
    const { rows: finalInstitutions } = await client.query(
      'SELECT school_id, name, abbreviation, mascot, primary_color FROM institutions ORDER BY school_id'
    );
    
    console.log('\nFinal list of institutions:');
    console.log('\nBig 12 Institutions (IDs 1-16):');
    finalInstitutions.filter(inst => inst.school_id <= 16).forEach(inst => {
      console.log(`ID: ${inst.school_id}, Name: ${inst.name}, Abbreviation: ${inst.abbreviation}, Mascot: ${inst.mascot}`);
    });
    
    console.log('\nAffiliate Institutions (IDs 17+):');
    finalInstitutions.filter(inst => inst.school_id > 16).forEach(inst => {
      console.log(`ID: ${inst.school_id}, Name: ${inst.name}, Abbreviation: ${inst.abbreviation}, Mascot: ${inst.mascot}`);
    });
    
  } catch (error) {
    console.error('Error reordering institutions:', error);
    
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
  .then(() => console.log('Institution reordering completed'))
  .catch(err => console.error('Script failed:', err));
