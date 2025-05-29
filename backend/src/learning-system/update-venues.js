/**
 * update-venues.js
 * 
 * Script to update venue information for Big 12 Conference teams
 * and add venue unavailability dates for scheduling constraints
 */

const { Pool } = require('pg');
const fs = require('fs');

// Database connection string
const connectionString = 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require';
const pool = new Pool({ connectionString });

// Venue data by team
const venueDataByTeam = {
  // Arizona Wildcats
  'Arizona Wildcats': {
    name: 'Arizona Stadium',
    city: 'Tucson',
    state: 'AZ',
    capacity: 50782,
    surface_type: 'FieldTurf',
    is_indoor: false,
    year_opened: 1929,
    latitude: 32.2297,
    longitude: -110.9478,
    description: 'Home of the Arizona Wildcats football team',
    timezone: 'America/Phoenix'
  },
  // Arizona State Sun Devils
  'Arizona State Sun Devils': {
    name: 'Mountain America Stadium',
    city: 'Tempe',
    state: 'AZ',
    capacity: 53599,
    surface_type: 'Natural Grass',
    is_indoor: false,
    year_opened: 1958,
    latitude: 33.4255,
    longitude: -111.9325,
    description: 'Home of the Arizona State Sun Devils football team',
    timezone: 'America/Phoenix'
  },
  // Baylor Bears
  'Baylor Bears': {
    name: 'McLane Stadium',
    city: 'Waco',
    state: 'TX',
    capacity: 45140,
    surface_type: 'Natural Grass',
    is_indoor: false,
    year_opened: 2014,
    latitude: 31.5592,
    longitude: -97.1153,
    description: 'Home of the Baylor Bears football team',
    timezone: 'America/Chicago'
  },
  // BYU Cougars
  'BYU Cougars': {
    name: 'LaVell Edwards Stadium',
    city: 'Provo',
    state: 'UT',
    capacity: 63470,
    surface_type: 'Natural Grass',
    is_indoor: false,
    year_opened: 1964,
    latitude: 40.2574,
    longitude: -111.6548,
    description: 'Home of the BYU Cougars football team',
    timezone: 'America/Denver'
  },
  // Cincinnati Bearcats
  'Cincinnati Bearcats': {
    name: 'Nippert Stadium',
    city: 'Cincinnati',
    state: 'OH',
    capacity: 40000,
    surface_type: 'UBU Sports Speed Series S5-M',
    is_indoor: false,
    year_opened: 1924,
    latitude: 39.1311,
    longitude: -84.5167,
    description: 'Home of the Cincinnati Bearcats football team',
    timezone: 'America/New_York'
  },
  // Colorado Buffaloes
  'Colorado Buffaloes': {
    name: 'Folsom Field',
    city: 'Boulder',
    state: 'CO',
    capacity: 50183,
    surface_type: 'Natural Grass',
    is_indoor: false,
    year_opened: 1924,
    latitude: 40.0076,
    longitude: -105.2674,
    description: 'Home of the Colorado Buffaloes football team',
    timezone: 'America/Denver'
  },
  // Houston Cougars
  'Houston Cougars': {
    name: 'TDECU Stadium',
    city: 'Houston',
    state: 'TX',
    capacity: 40000,
    surface_type: 'Astroturf 3D60',
    is_indoor: false,
    year_opened: 2014,
    latitude: 29.7216,
    longitude: -95.3409,
    description: 'Home of the Houston Cougars football team',
    timezone: 'America/Chicago'
  },
  // Iowa State Cyclones
  'Iowa State Cyclones': {
    name: 'Jack Trice Stadium',
    city: 'Ames',
    state: 'IA',
    capacity: 61500,
    surface_type: 'Natural Grass',
    is_indoor: false,
    year_opened: 1975,
    latitude: 42.0145,
    longitude: -93.6360,
    description: 'Home of the Iowa State Cyclones football team',
    timezone: 'America/Chicago'
  },
  // Kansas Jayhawks
  'Kansas Jayhawks': {
    name: 'David Booth Kansas Memorial Stadium',
    city: 'Lawrence',
    state: 'KS',
    capacity: 47233,
    surface_type: 'FieldTurf Revolution',
    is_indoor: false,
    year_opened: 1921,
    latitude: 38.9708,
    longitude: -95.2454,
    description: 'Home of the Kansas Jayhawks football team',
    timezone: 'America/Chicago'
  },
  // Kansas State Wildcats
  'Kansas State Wildcats': {
    name: 'Bill Snyder Family Stadium',
    city: 'Manhattan',
    state: 'KS',
    capacity: 52000,
    surface_type: 'AstroTurf 3D3',
    is_indoor: false,
    year_opened: 1968,
    latitude: 39.2019,
    longitude: -96.5967,
    description: 'Home of the Kansas State Wildcats football team',
    timezone: 'America/Chicago'
  },
  // Oklahoma State Cowboys
  'Oklahoma State Cowboys': {
    name: 'Boone Pickens Stadium',
    city: 'Stillwater',
    state: 'OK',
    capacity: 55509,
    surface_type: 'AstroTurf 3D60',
    is_indoor: false,
    year_opened: 1920,
    latitude: 36.1269,
    longitude: -97.0651,
    description: 'Home of the Oklahoma State Cowboys football team',
    timezone: 'America/Chicago'
  },
  // TCU Horned Frogs
  'TCU Horned Frogs': {
    name: 'Amon G. Carter Stadium',
    city: 'Fort Worth',
    state: 'TX',
    capacity: 47000,
    surface_type: 'Natural Grass',
    is_indoor: false,
    year_opened: 1930,
    latitude: 32.7100,
    longitude: -97.3690,
    description: 'Home of the TCU Horned Frogs football team',
    timezone: 'America/Chicago'
  },
  // Texas Tech Red Raiders
  'Texas Tech Red Raiders': {
    name: 'Jones AT&T Stadium',
    city: 'Lubbock',
    state: 'TX',
    capacity: 60454,
    surface_type: 'FieldTurf Revolution',
    is_indoor: false,
    year_opened: 1947,
    latitude: 33.5906,
    longitude: -101.8716,
    description: 'Home of the Texas Tech Red Raiders football team',
    timezone: 'America/Chicago'
  },
  // UCF Knights
  'UCF Knights': {
    name: 'FBC Mortgage Stadium',
    city: 'Orlando',
    state: 'FL',
    capacity: 45040,
    surface_type: 'Natural Grass',
    is_indoor: false,
    year_opened: 2007,
    latitude: 28.6077,
    longitude: -81.1911,
    description: 'Home of the UCF Knights football team',
    timezone: 'America/New_York'
  },
  // Utah Utes
  'Utah Utes': {
    name: 'Rice-Eccles Stadium',
    city: 'Salt Lake City',
    state: 'UT',
    capacity: 51444,
    surface_type: 'FieldTurf',
    is_indoor: false,
    year_opened: 1998,
    latitude: 40.7606,
    longitude: -111.8486,
    description: 'Home of the Utah Utes football team',
    timezone: 'America/Denver'
  },
  // West Virginia Mountaineers
  'West Virginia Mountaineers': {
    name: 'Milan Puskar Stadium',
    city: 'Morgantown',
    state: 'WV',
    capacity: 60000,
    surface_type: 'FieldTurf',
    is_indoor: false,
    year_opened: 1980,
    latitude: 39.6487,
    longitude: -79.9539,
    description: 'Home of the West Virginia Mountaineers football team',
    timezone: 'America/New_York'
  }
};

// Venue unavailability data for testing
const venueUnavailabilityData = [
  {
    venueName: 'Arizona Stadium',
    startDate: '2025-07-15',
    endDate: '2025-08-15',
    reason: 'Summer renovations'
  },
  {
    venueName: 'McLane Stadium',
    startDate: '2025-10-25',
    endDate: '2025-10-26',
    reason: 'Luke Combs Concert'
  },
  {
    venueName: 'Jack Trice Stadium',
    startDate: '2025-09-13',
    endDate: '2025-09-14',
    reason: 'University event'
  },
  {
    venueName: 'Milan Puskar Stadium',
    startDate: '2025-11-20',
    endDate: '2025-11-22',
    reason: 'Field maintenance'
  }
];

/**
 * Add new columns to venues table for enhanced attributes
 */
async function addVenueColumns() {
  try {
    console.log('Adding new columns to venues table if needed...');
    
    // Check for existing columns before adding
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'venues'
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    
    // Add new columns if they don't exist
    if (!existingColumns.includes('surface_type')) {
      await pool.query(`ALTER TABLE venues ADD COLUMN surface_type VARCHAR(50)`);
    }
    
    if (!existingColumns.includes('is_indoor')) {
      await pool.query(`ALTER TABLE venues ADD COLUMN is_indoor BOOLEAN DEFAULT FALSE`);
    }
    
    if (!existingColumns.includes('year_opened')) {
      await pool.query(`ALTER TABLE venues ADD COLUMN year_opened INTEGER`);
    }
    
    if (!existingColumns.includes('location_latitude')) {
      await pool.query(`ALTER TABLE venues ADD COLUMN location_latitude DECIMAL(10, 6)`);
    }
    
    if (!existingColumns.includes('location_longitude')) {
      await pool.query(`ALTER TABLE venues ADD COLUMN location_longitude DECIMAL(10, 6)`);
    }
    
    if (!existingColumns.includes('description')) {
      await pool.query(`ALTER TABLE venues ADD COLUMN description TEXT`);
    }
    
    if (!existingColumns.includes('timezone')) {
      await pool.query(`ALTER TABLE venues ADD COLUMN timezone VARCHAR(50) DEFAULT 'America/Chicago'`);
    }
    
    console.log('Venue table columns updated successfully');
  } catch (error) {
    console.error('Error adding venue columns:', error);
    throw error;
  }
}

/**
 * Create venue unavailability table
 */
async function createVenueUnavailabilityTable() {
  try {
    console.log('Creating venue_unavailability table if not exists...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS venue_unavailability (
        unavailability_id SERIAL PRIMARY KEY,
        venue_id INTEGER REFERENCES venues(venue_id),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('Venue unavailability table created or already exists');
  } catch (error) {
    console.error('Error creating venue unavailability table:', error);
    throw error;
  }
}

/**
 * Update venues for all football teams
 */
async function updateFootballVenues() {
  try {
    console.log('Starting venue updates for football teams...');
    
    // Get all football teams
    const teamsResult = await pool.query('SELECT team_id, name FROM teams WHERE sport_id = 8');
    const teams = teamsResult.rows;
    
    console.log(`Found ${teams.length} football teams to update venues for`);
    
    // Update each team's venue
    for (const team of teams) {
      console.log(`Processing venue for ${team.name}...`);
      
      // Skip if team name not in venue data
      if (!venueDataByTeam[team.name]) {
        console.log(`No venue data available for ${team.name}, skipping`);
        continue;
      }
      
      // Get venue data for this team
      const venueData = venueDataByTeam[team.name];
      
      // Check if venue exists for this team
      const venueResult = await pool.query(
        'SELECT venue_id FROM venues WHERE team_id = $1',
        [team.team_id]
      );
      
      if (venueResult.rows.length === 0) {
        // Create new venue
        await pool.query(`
          INSERT INTO venues (
            name, city, state, capacity, team_id, 
            surface_type, is_indoor, year_opened, 
            location_latitude, location_longitude, 
            description, timezone,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, 
            $6, $7, $8, 
            $9, $10, 
            $11, $12,
            NOW(), NOW()
          )
        `, [
          venueData.name,
          venueData.city,
          venueData.state,
          venueData.capacity,
          team.team_id,
          venueData.surface_type,
          venueData.is_indoor,
          venueData.year_opened,
          venueData.latitude,
          venueData.longitude,
          venueData.description,
          venueData.timezone
        ]);
        
        console.log(`Created new venue for ${team.name}: ${venueData.name}`);
      } else {
        // Update existing venue
        const venueId = venueResult.rows[0].venue_id;
        
        await pool.query(`
          UPDATE venues SET
            name = $1,
            city = $2,
            state = $3,
            capacity = $4,
            surface_type = $5,
            is_indoor = $6,
            year_opened = $7,
            location_latitude = $8,
            location_longitude = $9,
            description = $10,
            timezone = $11,
            updated_at = NOW()
          WHERE venue_id = $12
        `, [
          venueData.name,
          venueData.city,
          venueData.state,
          venueData.capacity,
          venueData.surface_type,
          venueData.is_indoor,
          venueData.year_opened,
          venueData.latitude,
          venueData.longitude,
          venueData.description,
          venueData.timezone,
          venueId
        ]);
        
        console.log(`Updated venue for ${team.name}: ${venueData.name} (ID: ${venueId})`);
      }
    }
    
    console.log('All football venues updated successfully');
  } catch (error) {
    console.error('Error updating football venues:', error);
    throw error;
  }
}

/**
 * Add sample venue unavailability data
 */
async function addVenueUnavailabilityData() {
  try {
    console.log('Adding sample venue unavailability data...');
    
    // Clear existing data
    await pool.query('DELETE FROM venue_unavailability');
    
    // Add unavailability for each venue in the list
    for (const unavailability of venueUnavailabilityData) {
      // Find venue ID by name
      const venueResult = await pool.query(
        'SELECT venue_id FROM venues WHERE name = $1',
        [unavailability.venueName]
      );
      
      if (venueResult.rows.length > 0) {
        const venueId = venueResult.rows[0].venue_id;
        
        // Add unavailability record
        await pool.query(`
          INSERT INTO venue_unavailability (
            venue_id, start_date, end_date, reason, 
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4,
            NOW(), NOW()
          )
        `, [
          venueId,
          unavailability.startDate,
          unavailability.endDate,
          unavailability.reason
        ]);
        
        console.log(`Added unavailability for ${unavailability.venueName}: ${unavailability.startDate} to ${unavailability.endDate}`);
      } else {
        console.log(`Venue not found: ${unavailability.venueName}, skipping unavailability`);
      }
    }
    
    console.log('Sample venue unavailability data added successfully');
  } catch (error) {
    console.error('Error adding venue unavailability data:', error);
    throw error;
  }
}

/**
 * Run all venue updates
 */
async function runVenueUpdates() {
  try {
    console.log('==== Starting Venue Updates ====');
    
    // 1. Add new columns to venues table
    await addVenueColumns();
    
    // 2. Create venue unavailability table
    await createVenueUnavailabilityTable();
    
    // 3. Update football venues
    await updateFootballVenues();
    
    // 4. Add sample venue unavailability data
    await addVenueUnavailabilityData();
    
    console.log('==== Venue Updates Completed Successfully ====');
  } catch (error) {
    console.error('Error during venue updates:', error);
  } finally {
    // Close DB connection
    await pool.end();
  }
}

// Run the update script
runVenueUpdates();
