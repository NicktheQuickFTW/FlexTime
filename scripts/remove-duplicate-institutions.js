/**
 * Remove Duplicate Institutions Script
 * 
 * This script:
 * 1. Identifies duplicate institutions based on similar names
 * 2. Keeps the entry with the most complete information
 * 3. Updates all team references to point to the kept institution
 * 4. Deletes the duplicate institution entries
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

// Specific duplicate mappings based on the screenshot
const duplicateSets = [
  // UCF duplicates
  {
    name: 'UCF',
    ids: [3, 38],  // IDs 3 (University of Central Florida) and 38 (UCF)
    keepId: 38     // Keep the one with abbreviation UCFL
  },
  // Arizona duplicates
  {
    name: 'Arizona',
    ids: [4, 30],  // IDs 4 (University of Arizona) and 30 (Arizona)
    keepId: 30     // Keep the one with abbreviation ARIZ
  },
  // Arizona State duplicates
  {
    name: 'Arizona State',
    ids: [5, 32],  // IDs 5 (Arizona State University) and 32 (Arizona State)
    keepId: 32     // Keep the one with abbreviation AZST
  }
];

// Function to calculate completeness score for an institution
const getCompletenessScore = (institution) => {
  let score = 0;
  
  // Add points for each non-null field
  if (institution.name) score += 1;
  if (institution.abbreviation) score += 2;  // Abbreviation is important
  if (institution.mascot) score += 2;        // Mascot is important
  if (institution.primary_color) score += 1;
  if (institution.secondary_color) score += 1;
  if (institution.city) score += 1;
  if (institution.state) score += 1;
  
  return score;
};

// Function to merge information from duplicate institutions
const mergeInstitutionInfo = (keeper, duplicate) => {
  const merged = { ...keeper };
  
  // Only use information from the duplicate if the keeper doesn't have it
  if (!merged.mascot && duplicate.mascot) merged.mascot = duplicate.mascot;
  if (!merged.primary_color && duplicate.primary_color) merged.primary_color = duplicate.primary_color;
  if (!merged.secondary_color && duplicate.secondary_color) merged.secondary_color = duplicate.secondary_color;
  if (!merged.city && duplicate.city) merged.city = duplicate.city;
  if (!merged.state && duplicate.state) merged.state = duplicate.state;
  
  return merged;
};

// Function to handle specific duplicate sets
const handleDuplicateSets = async (client) => {
  console.log('Handling specific duplicate sets...');
  
  for (const duplicateSet of duplicateSets) {
    console.log(`\nProcessing duplicate set for: ${duplicateSet.name}`);
    
    // Get all institutions in this set
    const { rows: institutions } = await client.query(
      'SELECT * FROM institutions WHERE school_id = ANY($1)',
      [duplicateSet.ids]
    );
    
    if (institutions.length < 2) {
      console.log(`Warning: Could not find all institutions in set ${duplicateSet.name}`);
      continue;
    }
    
    // Find the institution to keep
    const keepInstitution = institutions.find(i => i.school_id === duplicateSet.keepId);
    if (!keepInstitution) {
      console.log(`Warning: Could not find institution with ID ${duplicateSet.keepId} to keep`);
      continue;
    }
    
    // Get the duplicates to remove
    const duplicatesToRemove = institutions.filter(i => i.school_id !== duplicateSet.keepId);
    
    console.log(`Keeping institution: ${keepInstitution.name} (ID: ${keepInstitution.school_id}, Abbreviation: ${keepInstitution.abbreviation})`);
    
    // Merge information from duplicates into the keeper
    let updatedInstitution = { ...keepInstitution };
    for (const duplicate of duplicatesToRemove) {
      console.log(`Processing duplicate: ${duplicate.name} (ID: ${duplicate.school_id}, Abbreviation: ${duplicate.abbreviation})`);
      updatedInstitution = mergeInstitutionInfo(updatedInstitution, duplicate);
    }
    
    // Update the keeper with merged information if needed
    if (JSON.stringify(updatedInstitution) !== JSON.stringify(keepInstitution)) {
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      // Build the update query dynamically based on what needs to be updated
      for (const [key, value] of Object.entries(updatedInstitution)) {
        if (key !== 'school_id' && value !== keepInstitution[key]) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      }
      
      if (updateFields.length > 0) {
        updateValues.push(keepInstitution.school_id);
        await client.query(
          `UPDATE institutions SET ${updateFields.join(', ')}, updated_at = NOW() WHERE school_id = $${paramIndex}`,
          updateValues
        );
        console.log(`Updated institution ID ${keepInstitution.school_id} with merged information`);
      }
    }
    
    // Update references to the duplicates
    for (const duplicate of duplicatesToRemove) {
      // Update teams
      const { rowCount: teamCount } = await client.query(
        'UPDATE teams SET school_id = $1, updated_at = NOW() WHERE school_id = $2',
        [keepInstitution.school_id, duplicate.school_id]
      );
      console.log(`Updated ${teamCount} teams from institution ID ${duplicate.school_id} to ${keepInstitution.school_id}`);
      
      // Update venues
      const { rowCount: venueCount } = await client.query(
        'UPDATE venues SET school_id = $1, updated_at = NOW() WHERE school_id = $2',
        [keepInstitution.school_id, duplicate.school_id]
      );
      console.log(`Updated ${venueCount} venues from institution ID ${duplicate.school_id} to ${keepInstitution.school_id}`);
      
      // Delete the duplicate
      await client.query('DELETE FROM institutions WHERE school_id = $1', [duplicate.school_id]);
      console.log(`Deleted institution ID ${duplicate.school_id}`);
    }
  }
  
  console.log('\nCompleted handling of specific duplicate sets');
};

// Function to find and handle additional duplicates
const findAndHandleAdditionalDuplicates = async (client) => {
  console.log('\nFinding additional duplicates by similar names...');
  
  // Find institutions with similar names (case insensitive)
  const duplicatesQuery = `
    SELECT 
      LOWER(name) as lower_name,
      array_agg(school_id ORDER BY school_id) as school_ids,
      array_agg(name ORDER BY school_id) as institution_names
    FROM 
      institutions
    GROUP BY 
      LOWER(name)
    HAVING 
      COUNT(*) > 1
  `;
  
  const { rows: duplicates } = await client.query(duplicatesQuery);
  
  if (duplicates.length === 0) {
    console.log('No additional duplicates found');
    return;
  }
  
  console.log(`Found ${duplicates.length} additional duplicate sets`);
  
  // Process each duplicate set
  for (const duplicate of duplicates) {
    console.log(`\nProcessing duplicates for: ${duplicate.lower_name}`);
    console.log(`Institution IDs: ${duplicate.school_ids.join(', ')}`);
    console.log(`Institution Names: ${duplicate.institution_names.join(', ')}`);
    
    // Get all institutions in this set
    const { rows: institutions } = await client.query(
      'SELECT * FROM institutions WHERE school_id = ANY($1)',
      [duplicate.school_ids]
    );
    
    // Calculate completeness score for each institution
    const scoredInstitutions = institutions.map(inst => ({
      ...inst,
      score: getCompletenessScore(inst)
    }));
    
    // Sort by score (highest first)
    scoredInstitutions.sort((a, b) => b.score - a.score);
    
    // Keep the institution with the highest score
    const keepInstitution = scoredInstitutions[0];
    const duplicatesToRemove = scoredInstitutions.slice(1);
    
    console.log(`Keeping institution with highest score: ${keepInstitution.name} (ID: ${keepInstitution.school_id}, Score: ${keepInstitution.score})`);
    
    // Merge information from duplicates into the keeper
    let updatedInstitution = { ...keepInstitution };
    for (const duplicate of duplicatesToRemove) {
      console.log(`Processing duplicate: ${duplicate.name} (ID: ${duplicate.school_id}, Score: ${duplicate.score})`);
      updatedInstitution = mergeInstitutionInfo(updatedInstitution, duplicate);
    }
    
    // Update the keeper with merged information if needed
    if (JSON.stringify(updatedInstitution) !== JSON.stringify(keepInstitution)) {
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      // Build the update query dynamically based on what needs to be updated
      for (const [key, value] of Object.entries(updatedInstitution)) {
        if (key !== 'school_id' && key !== 'score' && value !== keepInstitution[key]) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      }
      
      if (updateFields.length > 0) {
        updateValues.push(keepInstitution.school_id);
        await client.query(
          `UPDATE institutions SET ${updateFields.join(', ')}, updated_at = NOW() WHERE school_id = $${paramIndex}`,
          updateValues
        );
        console.log(`Updated institution ID ${keepInstitution.school_id} with merged information`);
      }
    }
    
    // Update references to the duplicates
    for (const duplicate of duplicatesToRemove) {
      // Update teams
      const { rowCount: teamCount } = await client.query(
        'UPDATE teams SET school_id = $1, updated_at = NOW() WHERE school_id = $2',
        [keepInstitution.school_id, duplicate.school_id]
      );
      console.log(`Updated ${teamCount} teams from institution ID ${duplicate.school_id} to ${keepInstitution.school_id}`);
      
      // Update venues
      const { rowCount: venueCount } = await client.query(
        'UPDATE venues SET school_id = $1, updated_at = NOW() WHERE school_id = $2',
        [keepInstitution.school_id, duplicate.school_id]
      );
      console.log(`Updated ${venueCount} venues from institution ID ${duplicate.school_id} to ${keepInstitution.school_id}`);
      
      // Delete the duplicate
      await client.query('DELETE FROM institutions WHERE school_id = $1', [duplicate.school_id]);
      console.log(`Deleted institution ID ${duplicate.school_id}`);
    }
  }
  
  console.log('\nCompleted handling of additional duplicates');
};

// Main function
const removeDuplicateInstitutions = async () => {
  let client;
  
  try {
    client = await connectToDatabase();
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Handle specific duplicate sets first
    await handleDuplicateSets(client);
    
    // Then find and handle any additional duplicates
    await findAndHandleAdditionalDuplicates(client);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Show the final list of institutions
    const { rows: finalInstitutions } = await client.query(
      'SELECT school_id, name, abbreviation, mascot, primary_color FROM institutions ORDER BY name'
    );
    
    console.log('\nFinal list of institutions:');
    finalInstitutions.forEach(inst => {
      console.log(`ID: ${inst.school_id}, Name: ${inst.name}, Abbreviation: ${inst.abbreviation}, Mascot: ${inst.mascot}, Color: ${inst.primary_color}`);
    });
    
    console.log(`\nTotal institutions after removing duplicates: ${finalInstitutions.length}`);
    
  } catch (error) {
    console.error('Error removing duplicate institutions:', error);
    
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
removeDuplicateInstitutions()
  .then(() => console.log('Duplicate institution removal completed'))
  .catch(err => console.error('Script failed:', err));
