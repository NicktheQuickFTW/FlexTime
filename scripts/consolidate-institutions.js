/**
 * Consolidate Institutions Script
 * 
 * This script:
 * 1. Identifies duplicate institutions (e.g., "Arizona" and "University of Arizona")
 * 2. Consolidates them by keeping the first entry with the best information
 * 3. Updates all team references to point to the consolidated institution
 * 4. Deletes the duplicate institution entries
 * 5. Ensures all institution names use the short form (e.g., "Arizona" not "University of Arizona")
 */

require('dotenv').config();
const { Client } = require('pg');

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
    }
    
    if (!connectionString) {
      throw new Error('No database connection string available');
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

// Mapping of full names to short names
const institutionNameMap = {
  'University of Arizona': 'Arizona',
  'Arizona State University': 'Arizona State',
  'Baylor University': 'Baylor',
  'Brigham Young University': 'BYU',
  'University of Cincinnati': 'Cincinnati',
  'University of Colorado': 'Colorado',
  'University of Houston': 'Houston',
  'Iowa State University': 'Iowa State',
  'University of Kansas': 'Kansas',
  'Kansas State University': 'K-State',
  'Oklahoma State University': 'Oklahoma State',
  'Texas Christian University': 'TCU',
  'Texas Tech University': 'Texas Tech',
  'University of Central Florida': 'UCF',
  'University of Utah': 'Utah',
  'West Virginia University': 'West Virginia',
  'University of Oklahoma': 'Oklahoma',
  'University of Missouri': 'Missouri',
  'University of California, Davis': 'UC Davis',
  'California Baptist University': 'California Baptist',
  'University of Northern Colorado': 'Northern Colorado',
  'University of Northern Iowa': 'Northern Iowa',
  'North Dakota State University': 'North Dakota State',
  'South Dakota State University': 'South Dakota State',
  'University of Wyoming': 'Wyoming',
  'Utah Valley University': 'Utah Valley',
  'United States Air Force Academy': 'Air Force',
  'University of Denver': 'Denver',
  'San Diego State University': 'San Diego State',
  'University of Florida': 'Florida',
  'University of Tulsa': 'Tulsa',
  'Old Dominion University': 'Old Dominion',
  'Fresno State University': 'Fresno State'
};

// Specific duplicate mappings based on the screenshot
// Maps school_id of duplicate to the school_id to keep
const specificDuplicateMappings = {
  // UCF duplicates - keep ID 38 (UCF with abbreviation UCFL)
  '3': '38',  // University of Central Florida -> UCF
  
  // Arizona duplicates - keep ID 30 (Arizona with abbreviation ARIZ)
  '4': '30',  // University of Arizona -> Arizona
  
  // Arizona State duplicates - keep ID 32 (Arizona State with abbreviation AZST)
  '5': '32',  // Arizona State University -> Arizona State
};

// Function to standardize institution names
const standardizeInstitutionNames = async (client) => {
  console.log('Standardizing institution names...');
  
  // Get all institutions
  const { rows: institutions } = await client.query('SELECT school_id, name FROM institutions');
  
  let updatedCount = 0;
  
  for (const institution of institutions) {
    const currentName = institution.name;
    let shortName = institutionNameMap[currentName];
    
    // If we don't have a mapping but the name contains "University of" or similar patterns
    if (!shortName) {
      if (currentName.startsWith('University of ')) {
        shortName = currentName.replace('University of ', '');
      } else if (currentName.endsWith(' University')) {
        shortName = currentName.replace(' University', '');
      } else {
        // Keep the current name if no mapping found
        shortName = currentName;
      }
    }
    
    // Update the institution name if different
    if (shortName !== currentName) {
      await client.query(
        'UPDATE institutions SET name = $1, updated_at = NOW() WHERE school_id = $2',
        [shortName, institution.school_id]
      );
      console.log(`Updated institution name: "${currentName}" → "${shortName}"`);
      updatedCount++;
    }
  }
  
  console.log(`Standardized ${updatedCount} institution names`);
};

// Function to handle specific duplicates based on the screenshot
const handleSpecificDuplicates = async (client) => {
  console.log('Handling specific duplicate institutions...');
  
  for (const [duplicateId, keepId] of Object.entries(specificDuplicateMappings)) {
    console.log(`Processing specific duplicate: ID ${duplicateId} -> ID ${keepId}`);
    
    // Get information about both institutions
    const { rows: institutions } = await client.query(
      'SELECT school_id, name, abbreviation, mascot, primary_color FROM institutions WHERE school_id IN ($1, $2)',
      [duplicateId, keepId]
    );
    
    if (institutions.length !== 2) {
      console.log(`Warning: Could not find both institutions with IDs ${duplicateId} and ${keepId}`);
      continue;
    }
    
    const duplicate = institutions.find(i => i.school_id.toString() === duplicateId);
    const keep = institutions.find(i => i.school_id.toString() === keepId);
    
    console.log(`Consolidating: "${duplicate.name}" (ID: ${duplicate.school_id}) -> "${keep.name}" (ID: ${keep.school_id})`);
    
    // Update the kept institution with any missing information from the duplicate
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    // Only update if the kept institution is missing information
    if (!keep.mascot && duplicate.mascot) {
      updateFields.push(`mascot = $${paramIndex}`);
      updateValues.push(duplicate.mascot);
      paramIndex++;
    }
    
    if (!keep.primary_color && duplicate.primary_color) {
      updateFields.push(`primary_color = $${paramIndex}`);
      updateValues.push(duplicate.primary_color);
      paramIndex++;
    }
    
    // Update the kept institution if needed
    if (updateFields.length > 0) {
      updateValues.push(keep.school_id);
      await client.query(
        `UPDATE institutions SET ${updateFields.join(', ')}, updated_at = NOW() WHERE school_id = $${paramIndex}`,
        updateValues
      );
      console.log(`Updated institution ID ${keep.school_id} with information from ID ${duplicate.school_id}`);
    }
    
    // Update teams to reference the kept institution
    const { rowCount: teamCount } = await client.query(
      'UPDATE teams SET school_id = $1, updated_at = NOW() WHERE school_id = $2',
      [keep.school_id, duplicate.school_id]
    );
    console.log(`Updated ${teamCount} teams from institution ID ${duplicate.school_id} to ${keep.school_id}`);
    
    // Update venues to reference the kept institution
    const { rowCount: venueCount } = await client.query(
      'UPDATE venues SET school_id = $1, updated_at = NOW() WHERE school_id = $2',
      [keep.school_id, duplicate.school_id]
    );
    console.log(`Updated ${venueCount} venues from institution ID ${duplicate.school_id} to ${keep.school_id}`);
    
    // Delete the duplicate institution
    await client.query('DELETE FROM institutions WHERE school_id = $1', [duplicate.school_id]);
    console.log(`Deleted institution ID ${duplicate.school_id}`);
  }
  
  console.log('Completed handling of specific duplicate institutions');
};

// Function to find and consolidate remaining duplicate institutions
const consolidateDuplicateInstitutions = async (client) => {
  console.log('Finding remaining duplicate institutions...');
  
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
    console.log('No additional duplicate institutions found');
    return;
  }
  
  console.log(`Found ${duplicates.length} sets of additional duplicate institutions`);
  
  // Process each set of duplicates
  for (const duplicate of duplicates) {
    console.log(`\nProcessing duplicates for: ${duplicate.lower_name}`);
    console.log(`Institution IDs: ${duplicate.school_ids.join(', ')}`);
    console.log(`Institution Names: ${duplicate.institution_names.join(', ')}`);
    
    // Keep the first (oldest) institution ID and remove others
    const keepId = duplicate.school_ids[0];
    const removeIds = duplicate.school_ids.slice(1);
    
    console.log(`Keeping institution ID: ${keepId}`);
    console.log(`Removing institution IDs: ${removeIds.join(', ')}`);
    
    // Update teams to reference the kept institution
    for (const removeId of removeIds) {
      const { rowCount } = await client.query(
        'UPDATE teams SET school_id = $1, updated_at = NOW() WHERE school_id = $2',
        [keepId, removeId]
      );
      console.log(`Updated ${rowCount} teams from institution ID ${removeId} to ${keepId}`);
      
      // Update venues to reference the kept institution
      const { rowCount: venueRowCount } = await client.query(
        'UPDATE venues SET school_id = $1, updated_at = NOW() WHERE school_id = $2',
        [keepId, removeId]
      );
      console.log(`Updated ${venueRowCount} venues from institution ID ${removeId} to ${keepId}`);
      
      // Delete the duplicate institution
      await client.query('DELETE FROM institutions WHERE school_id = $1', [removeId]);
      console.log(`Deleted institution ID ${removeId}`);
    }
  }
  
  console.log('\nCompleted consolidation of duplicate institutions');
};

// Main function
const consolidateInstitutions = async () => {
  let client;
  
  try {
    client = await connectToDatabase();
    
    // Start a transaction
    await client.query('BEGIN');
    
    // First standardize all institution names
    await standardizeInstitutionNames(client);
    
    // Handle specific duplicates based on the screenshot
    await handleSpecificDuplicates(client);
    
    // Then find and consolidate any remaining duplicates
    await consolidateDuplicateInstitutions(client);
    
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
    
    console.log(`\nTotal institutions after consolidation: ${finalInstitutions.length}`);
    
  } catch (error) {
    console.error('Error consolidating institutions:', error);
    
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
consolidateInstitutions()
  .then(() => console.log('Institution consolidation completed'))
  .catch(err => console.error('Script failed:', err));
