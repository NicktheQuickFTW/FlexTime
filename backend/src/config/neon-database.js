/**
 * FlexTime Neon Database Connection
 * Direct connection to Neon PostgreSQL database for schedule management
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Neon Database Configuration
const NEON_CONFIG = {
  connectionString: process.env.NEON_DB_CONNECTION_STRING || 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require',
  host: process.env.NEON_DB_HOST || 'ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech',
  port: parseInt(process.env.NEON_DB_PORT) || 5432,
  database: 'HELiiX',
  user: process.env.NEON_DB_USER || 'xii-os_owner',
  password: process.env.NEON_DB_PASSWORD || 'npg_4qYJFR0lneIg',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

class NeonDatabase {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      console.log('🔌 Connecting to Neon Database...');
      console.log(`Host: ${NEON_CONFIG.host}`);
      console.log(`Database: ${NEON_CONFIG.database}`);
      console.log(`User: ${NEON_CONFIG.user}`);
      
      this.pool = new Pool(NEON_CONFIG);
      
      // Test the connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
      client.release();
      
      console.log('✅ Connected to Neon Database successfully!');
      console.log(`Server time: ${result.rows[0].current_time}`);
      console.log(`PostgreSQL version: ${result.rows[0].postgres_version}`);
      
      this.isConnected = true;
      
      // Initialize tables
      await this.initializeTables();
      
    } catch (error) {
      console.error('❌ Failed to connect to Neon Database:', error.message);
      this.isConnected = false;
    }
  }

  async initializeTables() {
    console.log('📊 Initializing FlexTime database tables...');
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create extension for UUID generation
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      
      // Teams table - Drop and recreate to ensure correct schema
      await client.query('DROP TABLE IF EXISTS teams CASCADE');
      await client.query(`
        CREATE TABLE teams (
          team_id INTEGER PRIMARY KEY,
          school_id INTEGER NOT NULL,
          sport_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          abbreviation VARCHAR(10) NOT NULL,
          sport VARCHAR(50) NOT NULL,
          conference VARCHAR(50) DEFAULT 'big12',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Schedules table
      await client.query(`
        CREATE TABLE IF NOT EXISTS schedules (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          sport VARCHAR(50) NOT NULL,
          season VARCHAR(20) NOT NULL,
          conference VARCHAR(50) DEFAULT 'big12',
          status VARCHAR(20) DEFAULT 'draft',
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Games table
      await client.query(`
        CREATE TABLE IF NOT EXISTS games (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
          home_team_id INTEGER REFERENCES teams(team_id),
          away_team_id INTEGER REFERENCES teams(team_id),
          game_date DATE NOT NULL,
          game_time TIME,
          venue VARCHAR(255),
          tv_network VARCHAR(100),
          week INTEGER,
          status VARCHAR(20) DEFAULT 'scheduled',
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Constraints table
      await client.query(`
        CREATE TABLE IF NOT EXISTS constraints (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          sport VARCHAR(50) NOT NULL,
          constraint_type VARCHAR(100) NOT NULL,
          description TEXT,
          parameters JSONB,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // COMPASS scores table
      await client.query(`
        CREATE TABLE IF NOT EXISTS compass_scores (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
          team_id INTEGER REFERENCES teams(team_id),
          overall_score DECIMAL(5,2),
          performance_score DECIMAL(5,2),
          resources_score DECIMAL(5,2),
          balance_score DECIMAL(5,2),
          calculated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Agent memories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS agent_memories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          agent_id VARCHAR(100) NOT NULL,
          memory_type VARCHAR(50) NOT NULL,
          content JSONB NOT NULL,
          relevance_score DECIMAL(3,2) DEFAULT 1.0,
          created_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP
        )
      `);
      
      // Schedule metrics table
      await client.query(`
        CREATE TABLE IF NOT EXISTS schedule_metrics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
          travel_efficiency DECIMAL(5,2),
          home_away_balance DECIMAL(5,2),
          conflict_count INTEGER DEFAULT 0,
          revenue_potential DECIMAL(5,2),
          fan_satisfaction DECIMAL(5,2),
          tv_optimization DECIMAL(5,2),
          calculated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await client.query('COMMIT');
      console.log('✅ Database tables initialized successfully');
      
      // Insert Big 12 teams if they don't exist
      await this.insertBig12Teams();
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to initialize tables:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async insertBig12Teams() {
    console.log('🏟️ Inserting Big 12 Conference teams...');
    
    // School mapping: school_id -> school info
    const schools = [
      { school_id: 1, name: 'Arizona', abbreviation: 'ARIZ', location: { lat: 32.2319, lng: -110.9501, city: 'Tucson, AZ' }, colors: { primary: '#AB0520', secondary: '#0C234B' } },
      { school_id: 2, name: 'Arizona State', abbreviation: 'ASU', location: { lat: 33.4242, lng: -111.9281, city: 'Tempe, AZ' }, colors: { primary: '#8C1D40', secondary: '#FFC627' } },
      { school_id: 3, name: 'Baylor', abbreviation: 'BAY', location: { lat: 31.5488, lng: -97.1131, city: 'Waco, TX' }, colors: { primary: '#003015', secondary: '#FFB81C' } },
      { school_id: 4, name: 'BYU', abbreviation: 'BYU', location: { lat: 40.2518, lng: -111.6493, city: 'Provo, UT' }, colors: { primary: '#002E5D', secondary: '#FFFFFF' } },
      { school_id: 5, name: 'UCF', abbreviation: 'UCF', location: { lat: 28.6024, lng: -81.2001, city: 'Orlando, FL' }, colors: { primary: '#000000', secondary: '#FFC904' } },
      { school_id: 6, name: 'Cincinnati', abbreviation: 'CIN', location: { lat: 39.1612, lng: -84.4569, city: 'Cincinnati, OH' }, colors: { primary: '#E00122', secondary: '#000000' } },
      { school_id: 7, name: 'Colorado', abbreviation: 'COL', location: { lat: 40.015, lng: -105.2705, city: 'Boulder, CO' }, colors: { primary: '#000000', secondary: '#CFB87C' } },
      { school_id: 8, name: 'Houston', abbreviation: 'HOU', location: { lat: 29.7604, lng: -95.3698, city: 'Houston, TX' }, colors: { primary: '#C8102E', secondary: '#FFFFFF' } },
      { school_id: 9, name: 'Iowa State', abbreviation: 'ISU', location: { lat: 42.0308, lng: -93.6319, city: 'Ames, IA' }, colors: { primary: '#C8102E', secondary: '#F1BE48' } },
      { school_id: 10, name: 'Kansas', abbreviation: 'KU', location: { lat: 38.9717, lng: -95.2353, city: 'Lawrence, KS' }, colors: { primary: '#0051BA', secondary: '#E8000D' } },
      { school_id: 11, name: 'Kansas State', abbreviation: 'KSU', location: { lat: 39.1836, lng: -96.5717, city: 'Manhattan, KS' }, colors: { primary: '#512888', secondary: '#FFFFFF' } },
      { school_id: 12, name: 'Oklahoma State', abbreviation: 'OKST', location: { lat: 36.1156, lng: -97.0669, city: 'Stillwater, OK' }, colors: { primary: '#FF7300', secondary: '#000000' } },
      { school_id: 13, name: 'TCU', abbreviation: 'TCU', location: { lat: 32.7573, lng: -97.2925, city: 'Fort Worth, TX' }, colors: { primary: '#4D1979', secondary: '#A7A8AA' } },
      { school_id: 14, name: 'Texas Tech', abbreviation: 'TTU', location: { lat: 33.5779, lng: -101.8552, city: 'Lubbock, TX' }, colors: { primary: '#CC0000', secondary: '#000000' } },
      { school_id: 15, name: 'Utah', abbreviation: 'UTAH', location: { lat: 40.7649, lng: -111.8421, city: 'Salt Lake City, UT' }, colors: { primary: '#CC0000', secondary: '#FFFFFF' } },
      { school_id: 16, name: 'West Virginia', abbreviation: 'WVU', location: { lat: 39.6295, lng: -79.9559, city: 'Morgantown, WV' }, colors: { primary: '#002855', secondary: '#EAAA00' } },
      // Affiliate Schools
      { school_id: 17, name: 'Denver', abbreviation: 'DU', location: { lat: 39.6762, lng: -104.9619, city: 'Denver, CO' }, colors: { primary: '#862633', secondary: '#F2A900' } },
      { school_id: 19, name: 'Oklahoma', abbreviation: 'OU', location: { lat: 35.2051, lng: -97.4440, city: 'Norman, OK' }, colors: { primary: '#841617', secondary: '#FDF5E6' } },
      { school_id: 25, name: 'Air Force', abbreviation: 'AF', location: { lat: 38.9956, lng: -104.8617, city: 'Colorado Springs, CO' }, colors: { primary: '#003087', secondary: '#8A8B8C' } },
      { school_id: 26, name: 'Cal Baptist', abbreviation: 'CBU', location: { lat: 33.9425, lng: -117.3616, city: 'Riverside, CA' }, colors: { primary: '#003DA5', secondary: '#FFB81C' } },
      { school_id: 27, name: 'Missouri', abbreviation: 'MIZZ', location: { lat: 38.9517, lng: -92.3341, city: 'Columbia, MO' }, colors: { primary: '#F1B82D', secondary: '#000000' } },
      { school_id: 28, name: 'North Dakota State', abbreviation: 'NDSU', location: { lat: 46.8772, lng: -96.7898, city: 'Fargo, ND' }, colors: { primary: '#003F2B', secondary: '#F0DC00' } },
      { school_id: 29, name: 'Northern Colorado', abbreviation: 'UNCO', location: { lat: 40.4014, lng: -104.6914, city: 'Greeley, CO' }, colors: { primary: '#003087', secondary: '#F0DC00' } },
      { school_id: 30, name: 'Northern Iowa', abbreviation: 'UNI', location: { lat: 42.5078, lng: -92.4453, city: 'Cedar Falls, IA' }, colors: { primary: '#663399', secondary: '#FFB81C' } },
      { school_id: 31, name: 'South Dakota State', abbreviation: 'SDSU_WR', location: { lat: 44.3106, lng: -96.7969, city: 'Brookings, SD' }, colors: { primary: '#003DA5', secondary: '#F1B82D' } },
      { school_id: 32, name: 'Utah Valley', abbreviation: 'UVU', location: { lat: 40.2969, lng: -111.7148, city: 'Orem, UT' }, colors: { primary: '#005447', secondary: '#FFFFFF' } },
      { school_id: 33, name: 'Wyoming', abbreviation: 'WYO', location: { lat: 41.3114, lng: -105.5911, city: 'Laramie, WY' }, colors: { primary: '#492F24', secondary: '#FFC425' } }
    ];

    // Sports mapping with actual participating schools (from Sport Sponsorship 6.3.csv - Official Big 12 data)
    const sportsParticipation = {
      1: { name: 'Baseball', schools: [1,2,3,4,5,6,8,10,11,12,13,14,15,16] }, // 14 teams
      2: { name: 'Men\'s Basketball', schools: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] }, // 16 teams
      3: { name: 'Women\'s Basketball', schools: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] }, // 16 teams  
      8: { name: 'Football', schools: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] }, // 16 teams
      11: { name: 'Gymnastics', schools: [1,2,4,9,15,16,17] }, // 7 teams (6 Legacy + Denver affiliate)
      12: { name: 'Lacrosse', schools: [2,6,7] }, // 3 teams (Legacy members only, affiliates managed separately)
      14: { name: 'Soccer', schools: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] }, // 16 teams
      15: { name: 'Softball', schools: [1,2,3,4,5,8,9,10,12,14,15] }, // 11 teams
      18: { name: 'Men\'s Tennis', schools: [1,2,3,4,5,12,13,14,15] }, // 9 teams
      19: { name: 'Women\'s Tennis', schools: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] }, // 16 teams
      24: { name: 'Volleyball', schools: [1,2,3,4,5,6,7,8,9,10,11,13,14,15,16] }, // 15 teams (no Oklahoma State)
      25: { name: 'Wrestling', schools: [2,9,12,16,25,26,27,28,29,30,19,31,32,33] } // 14 teams (4 Legacy + 10 affiliates)
    };

    const teams = [];
    
    // Generate teams only for schools that actually participate in each sport
    for (const [sport_id, sportInfo] of Object.entries(sportsParticipation)) {
      const sportIdNum = parseInt(sport_id);
      
      for (const school_id of sportInfo.schools) {
        const school = schools.find(s => s.school_id === school_id);
        if (school) {
          const team_id = school.school_id * 100 + sportIdNum;
          teams.push({
            team_id,
            school_id: school.school_id,
            sport_id: sportIdNum,
            name: `${school.name} ${sportInfo.name}`,
            abbreviation: school.abbreviation,
            sport: sportInfo.name.toLowerCase().replace(/[^a-z]/g, '')
          });
        }
      }
    }

    const client = await this.pool.connect();
    
    try {
      for (const team of teams) {
        await client.query(`
          INSERT INTO teams (team_id, school_id, sport_id, name, abbreviation, sport, conference)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (team_id) DO UPDATE SET
            name = EXCLUDED.name,
            abbreviation = EXCLUDED.abbreviation,
            sport = EXCLUDED.sport,
            updated_at = NOW()
        `, [
          team.team_id,
          team.school_id,
          team.sport_id,
          team.name,
          team.abbreviation,
          team.sport,
          'big12'
        ]);
      }
      
      console.log('✅ Big 12 teams inserted/updated successfully');
      
    } catch (error) {
      console.error('❌ Failed to insert Big 12 teams:', error.message);
    } finally {
      client.release();
    }
  }

  // Test database connection
  async testConnection() {
    if (!this.isConnected) {
      return { connected: false, error: 'Not connected to database' };
    }

    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT COUNT(*) as team_count FROM teams WHERE conference = $1', ['big12']);
      client.release();
      
      return {
        connected: true,
        timestamp: new Date().toISOString(),
        teamCount: parseInt(result.rows[0].team_count),
        database: NEON_CONFIG.database,
        host: NEON_CONFIG.host
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // Get all Big 12 teams
  async getTeams() {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT team_id, school_id, sport_id, name, abbreviation, sport, conference
        FROM teams
        WHERE conference = 'big12'
        ORDER BY name
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      return [];
    } finally {
      client.release();
    }
  }

  async getSchools() {
    const client = await this.pool.connect();
    
    try {
      // Try to get Big 12 schools specifically first
      const big12SchoolNames = [
        'Arizona', 'Arizona State', 'Baylor', 'BYU', 'UCF', 'Cincinnati', 
        'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
        'Oklahoma State', 'TCU', 'Texas Tech', 'Utah', 'West Virginia'
      ];
      
      const result = await client.query(`
        SELECT school_id, school, short_display, primary_color, secondary_color, 
               mascot, location, website, conference_id,
               schedule_display, school_abbreviation, preferred_school_name,
               created_at, updated_at
        FROM schools
        WHERE school = ANY($1)
        ORDER BY school
      `, [big12SchoolNames]);
      
      // If we found Big 12 schools in the database, return them
      if (result.rows && result.rows.length > 0) {
        console.log(`Found ${result.rows.length} Big 12 schools in database`);
        
        const schools = result.rows.map(row => ({
          school_id: row.school_id,
          school: row.school,
          short_display: row.short_display || row.school,
          primary_color: row.primary_color,
          secondary_color: row.secondary_color,
          mascot: row.mascot,
          location: row.location,
          website: row.website,
          // Provide fallback values for fields that don't exist in DB
          founded_year: null, // Not available in current schema
          enrollment: null, // Not available in current schema
          conference: 'big12', // Default to big12 since that's what we're filtering for
          division: 'FBS', // Default value
          city: row.location ? row.location.split(',')[0] : null, // Extract city from location
          state: row.location ? row.location.split(',')[1]?.trim() : null, // Extract state from location
          // Additional fields from actual schema
          conference_id: row.conference_id,
          schedule_display: row.schedule_display,
          school_abbreviation: row.school_abbreviation,
          preferred_school_name: row.preferred_school_name
        }));
        
        return schools;
      } else {
        // No Big 12 schools found in database, return empty array to trigger fallback
        console.log('No Big 12 schools found in database, returning empty array for fallback');
        return [];
      }
      
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      return [];
    } finally {
      client.release();
    }
  }

  // Create a new schedule
  async createSchedule(scheduleData) {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO schedules (sport, season, conference, status, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        scheduleData.sport,
        scheduleData.season,
        scheduleData.conference || 'big12',
        scheduleData.status || 'draft',
        JSON.stringify(scheduleData.metadata || {})
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Failed to create schedule:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get schedules
  async getSchedules(filters = {}) {
    const client = await this.pool.connect();
    
    try {
      let query = 'SELECT * FROM schedules WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (filters.sport) {
        paramCount++;
        query += ` AND sport = $${paramCount}`;
        params.push(filters.sport);
      }
      
      if (filters.season) {
        paramCount++;
        query += ` AND season = $${paramCount}`;
        params.push(filters.season);
      }
      
      if (filters.conference) {
        paramCount++;
        query += ` AND conference = $${paramCount}`;
        params.push(filters.conference);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      return [];
    } finally {
      client.release();
    }
  }

  // Close the database connection
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Neon Database connection closed');
    }
  }
}

// Create and export database instance
const neonDB = new NeonDatabase();

module.exports = neonDB;

// Test connection on startup
setTimeout(async () => {
  if (neonDB.isConnected) {
    const status = await neonDB.testConnection();
    console.log('🚀 Neon Database Status:', status);
  }
}, 2000);