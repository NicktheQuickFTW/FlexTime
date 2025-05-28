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
      
      // Teams table
      await client.query(`
        CREATE TABLE IF NOT EXISTS teams (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          abbreviation VARCHAR(10) NOT NULL,
          conference VARCHAR(50) DEFAULT 'big12',
          location JSONB,
          colors JSONB,
          venue_info JSONB,
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
          home_team_id VARCHAR(50) REFERENCES teams(id),
          away_team_id VARCHAR(50) REFERENCES teams(id),
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
          team_id VARCHAR(50) REFERENCES teams(id),
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
    
    const big12Teams = [
      {
        id: 'arizona',
        name: 'Arizona',
        abbreviation: 'ARIZ',
        location: { lat: 32.2319, lng: -110.9501, city: 'Tucson, AZ' },
        colors: { primary: '#AB0520', secondary: '#0C234B' },
        venue_info: { name: 'Arizona Stadium', capacity: 50782 }
      },
      {
        id: 'arizona-state',
        name: 'Arizona State',
        abbreviation: 'ASU',
        location: { lat: 33.4242, lng: -111.9281, city: 'Tempe, AZ' },
        colors: { primary: '#8C1D40', secondary: '#FFC627' },
        venue_info: { name: 'Sun Devil Stadium', capacity: 53599 }
      },
      {
        id: 'baylor',
        name: 'Baylor',
        abbreviation: 'BAY',
        location: { lat: 31.5488, lng: -97.1131, city: 'Waco, TX' },
        colors: { primary: '#003015', secondary: '#FFB81C' },
        venue_info: { name: 'McLane Stadium', capacity: 45140 }
      },
      {
        id: 'byu',
        name: 'BYU',
        abbreviation: 'BYU',
        location: { lat: 40.2518, lng: -111.6493, city: 'Provo, UT' },
        colors: { primary: '#002E5D', secondary: '#FFFFFF' },
        venue_info: { name: 'LaVell Edwards Stadium', capacity: 63470 }
      },
      {
        id: 'cincinnati',
        name: 'Cincinnati',
        abbreviation: 'CIN',
        location: { lat: 39.1612, lng: -84.4569, city: 'Cincinnati, OH' },
        colors: { primary: '#E00122', secondary: '#000000' },
        venue_info: { name: 'Nippert Stadium', capacity: 40000 }
      },
      {
        id: 'colorado',
        name: 'Colorado',
        abbreviation: 'COL',
        location: { lat: 40.0150, lng: -105.2705, city: 'Boulder, CO' },
        colors: { primary: '#000000', secondary: '#CFB87C' },
        venue_info: { name: 'Folsom Field', capacity: 50183 }
      },
      {
        id: 'houston',
        name: 'Houston',
        abbreviation: 'HOU',
        location: { lat: 29.7604, lng: -95.3698, city: 'Houston, TX' },
        colors: { primary: '#C8102E', secondary: '#FFFFFF' },
        venue_info: { name: 'TDECU Stadium', capacity: 40000 }
      },
      {
        id: 'iowa-state',
        name: 'Iowa State',
        abbreviation: 'ISU',
        location: { lat: 42.0308, lng: -93.6319, city: 'Ames, IA' },
        colors: { primary: '#C8102E', secondary: '#F1BE48' },
        venue_info: { name: 'Jack Trice Stadium', capacity: 61500 }
      },
      {
        id: 'kansas',
        name: 'Kansas',
        abbreviation: 'KU',
        location: { lat: 38.9717, lng: -95.2353, city: 'Lawrence, KS' },
        colors: { primary: '#0051BA', secondary: '#E8000D' },
        venue_info: { name: 'Memorial Stadium', capacity: 47233 }
      },
      {
        id: 'kansas-state',
        name: 'Kansas State',
        abbreviation: 'KSU',
        location: { lat: 39.1836, lng: -96.5717, city: 'Manhattan, KS' },
        colors: { primary: '#512888', secondary: '#FFFFFF' },
        venue_info: { name: 'Bill Snyder Family Stadium', capacity: 50000 }
      },
      {
        id: 'oklahoma-state',
        name: 'Oklahoma State',
        abbreviation: 'OKST',
        location: { lat: 36.1156, lng: -97.0669, city: 'Stillwater, OK' },
        colors: { primary: '#FF7300', secondary: '#000000' },
        venue_info: { name: 'Boone Pickens Stadium', capacity: 60218 }
      },
      {
        id: 'tcu',
        name: 'TCU',
        abbreviation: 'TCU',
        location: { lat: 32.7573, lng: -97.2925, city: 'Fort Worth, TX' },
        colors: { primary: '#4D1979', secondary: '#A7A8AA' },
        venue_info: { name: 'Amon G. Carter Stadium', capacity: 47331 }
      },
      {
        id: 'texas-tech',
        name: 'Texas Tech',
        abbreviation: 'TTU',
        location: { lat: 33.5779, lng: -101.8552, city: 'Lubbock, TX' },
        colors: { primary: '#CC0000', secondary: '#000000' },
        venue_info: { name: 'Jones AT&T Stadium', capacity: 60454 }
      },
      {
        id: 'ucf',
        name: 'UCF',
        abbreviation: 'UCF',
        location: { lat: 28.6024, lng: -81.2001, city: 'Orlando, FL' },
        colors: { primary: '#000000', secondary: '#FFC904' },
        venue_info: { name: 'FBC Mortgage Stadium', capacity: 44206 }
      },
      {
        id: 'utah',
        name: 'Utah',
        abbreviation: 'UTAH',
        location: { lat: 40.7649, lng: -111.8421, city: 'Salt Lake City, UT' },
        colors: { primary: '#CC0000', secondary: '#FFFFFF' },
        venue_info: { name: 'Rice-Eccles Stadium', capacity: 51444 }
      },
      {
        id: 'west-virginia',
        name: 'West Virginia',
        abbreviation: 'WVU',
        location: { lat: 39.6295, lng: -79.9559, city: 'Morgantown, WV' },
        colors: { primary: '#002855', secondary: '#EAAA00' },
        venue_info: { name: 'Milan Puskar Stadium', capacity: 60000 }
      }
    ];

    const client = await this.pool.connect();
    
    try {
      for (const team of big12Teams) {
        await client.query(`
          INSERT INTO teams (id, name, abbreviation, conference, location, colors, venue_info)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            abbreviation = EXCLUDED.abbreviation,
            location = EXCLUDED.location,
            colors = EXCLUDED.colors,
            venue_info = EXCLUDED.venue_info,
            updated_at = NOW()
        `, [
          team.id,
          team.name,
          team.abbreviation,
          'big12',
          JSON.stringify(team.location),
          JSON.stringify(team.colors),
          JSON.stringify(team.venue_info)
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
        SELECT id, name, abbreviation, location, colors, venue_info
        FROM teams
        WHERE conference = 'big12'
        ORDER BY name
      `);
      
      return result.rows.map(row => ({
        ...row,
        location: typeof row.location === 'string' ? JSON.parse(row.location) : row.location,
        colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors,
        venue_info: typeof row.venue_info === 'string' ? JSON.parse(row.venue_info) : row.venue_info
      }));
    } catch (error) {
      console.error('Failed to fetch teams:', error);
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