/**
 * Reorder Institutions Script
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
    'SELECT school_id, name, abbreviation, mascot, primary_color FROM institutions ORDER BY name'
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
  
  // Get all team references to institutions
  const { rows: teams } = await client.query('SELECT team_id, school_id FROM teams');
  
  // Get all venue references to institutions
  const { rows: venues } = await client.query('SELECT venue_id, school_id FROM venues');
  
  // Temporarily disable foreign key constraints
  await client.query('SET session_replication_role = replica');
  
  // Create a backup of the institutions table
  await client.query('CREATE TABLE institutions_backup AS SELECT * FROM institutions');
  console.log('Created backup of institutions table');
  
  // Create a new institutions table with the new IDs
  await client.query(`
    CREATE TABLE institutions_new (
      school_id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE,
      abbreviation VARCHAR(10),
      mascot VARCHAR(50),
      primary_color VARCHAR(7),
      secondary_color VARCHAR(7),
      city VARCHAR(100),
      state VARCHAR(2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Insert Big 12 institutions first with IDs 1-16
  for (let i = 0; i < big12.length; i++) {
    const inst = big12[i];
    const newId = i + 1;
    
    await client.query(`
      INSERT INTO institutions_new (
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
      INSERT INTO institutions_new (
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
  
  // Update teams to reference the new institution IDs
  for (const team of teams) {
    const oldId = team.school_id;
    const newId = idMapping.get(oldId);
    
    if (newId) {
      await client.query('UPDATE teams SET school_id = $1 WHERE team_id = $2', [newId, team.team_id]);
      console.log(`Updated team ID ${team.team_id} to reference institution ID ${newId}`);
    } else {
      console.log(`Warning: No mapping found for institution ID ${oldId} referenced by team ID ${team.team_id}`);
    }
  }
  
  // Update venues to reference the new institution IDs
  for (const venue of venues) {
    const oldId = venue.school_id;
    const newId = idMapping.get(oldId);
    
    if (newId) {
      await client.query('UPDATE venues SET school_id = $1 WHERE venue_id = $2', [newId, venue.venue_id]);
      console.log(`Updated venue ID ${venue.venue_id} to reference institution ID ${newId}`);
    } else {
      console.log(`Warning: No mapping found for institution ID ${oldId} referenced by venue ID ${venue.venue_id}`);
    }
  }
  
  // Replace the old institutions table with the new one
  await client.query('DROP TABLE institutions');
  await client.query('ALTER TABLE institutions_new RENAME TO institutions');
  
  // Re-enable foreign key constraints
  await client.query('SET session_replication_role = default');
  
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
