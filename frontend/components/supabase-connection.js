/**
 * FlexTime Supabase Database Connection
 * Establishes connection to Supabase PostgreSQL database for schedule data
 */

// Supabase configuration from environment
const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfzgnvcwakjxtdsaedfq.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmemdudmN3YWtqeHRkc2FlZGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzQ3NTgsImV4cCI6MjA2MjE1MDc1OH0.I-zHEy0Z6mJtxY79qBippcB-BG96bPHAfDcWzm8JjYI',
  projectRef: 'vfzgnvcwakjxtdsaedfq'
};

// Since we're in a browser environment, we'll use the backend API for database operations
// This file sets up the client-side interface for database operations

class SupabaseDBClient {
  constructor() {
    // Backend API endpoint for database operations (backend runs on 3005, frontend on 3000)
    this.baseUrl = `http://localhost:3005/api`;
    this.cache = new Map();
    this.isConnected = false;
  }

  // Test database connection through backend
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        this.isConnected = true;
        console.log('✅ Connected to Supabase Database');
        return true;
      } else {
        console.error('❌ Failed to connect to Supabase Database');
        return false;
      }
    } catch (error) {
      console.error('❌ Database connection error:', error);
      return false;
    }
  }

  // Create necessary tables for FlexTime scheduling
  async initializeTables() {
    try {
      const response = await fetch(`${this.baseUrl}/initialize`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 Supabase tables initialized:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to initialize tables:', error);
      throw error;
    }
  }

  // Schedule Management Operations
  async getSchedules(sport = null, season = null) {
    try {
      const params = new URLSearchParams();
      if (sport) params.append('sport', sport);
      if (season) params.append('season', season);
      
      const url = `${this.baseUrl}/schedule/schedules?${params}`;
      console.log('🔍 Querying schedules from Supabase:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const schedules = result.data || result.schedules || result;
      console.log('📊 Schedules received from Supabase:', {
        count: schedules?.length || 0,
        first: schedules?.[0],
        sport,
        season
      });
      
      // Cache the results
      this.cache.set(`schedules-${sport}-${season}`, schedules);
      return schedules || [];
    } catch (error) {
      console.error('Failed to fetch schedules from Supabase:', error);
      return [];
    }
  }

  async createSchedule(scheduleData) {
    try {
      const response = await fetch(`${this.baseUrl}/schedule/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      
      const result = await response.json();
      const newSchedule = result.data || result.schedule || result;
      console.log('✅ Schedule created in Supabase:', newSchedule.id);
      
      // Invalidate cache
      this.cache.clear();
      return newSchedule;
    } catch (error) {
      console.error('Failed to create schedule in Supabase:', error);
      throw error;
    }
  }

  async updateSchedule(scheduleId, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/schedule/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const result = await response.json();
      const updatedSchedule = result.data || result.schedule || result;
      console.log('✅ Schedule updated in Supabase:', scheduleId);
      
      // Invalidate cache
      this.cache.clear();
      return updatedSchedule;
    } catch (error) {
      console.error('Failed to update schedule in Supabase:', error);
      throw error;
    }
  }

  async saveSchedule(sport, season, games) {
    try {
      const scheduleData = {
        sport: sport,
        season: season,
        conference: 'Big 12',
        games: games,
        created_at: new Date().toISOString(),
        status: 'draft'
      };

      const response = await fetch(`${this.baseUrl}/schedule/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      
      const result = await response.json();
      const savedSchedule = result.data || result.schedule || result;
      console.log('✅ Schedule saved to Supabase:', savedSchedule.id || 'new schedule');
      
      // Invalidate cache
      this.cache.clear();
      return savedSchedule;
    } catch (error) {
      console.warn('Failed to save schedule to Supabase:', error);
      // Don't throw - allow schedule generation to continue without DB save
      return { success: false, error: error.message };
    }
  }

  // Team Management
  async getTeams(conference = 'Big 12') {
    const cacheKey = `teams-${conference}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/teams?conference=${encodeURIComponent(conference)}`;
      console.log('🔍 Querying teams from Supabase:', url);
      
      const response = await fetch(url);
      console.log('📡 Teams response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const teams = result.teams || result.data || result;
      console.log('👥 Teams received from Supabase:', {
        count: teams?.length || 0,
        first: teams?.[0],
        conference
      });
      
      this.cache.set(cacheKey, teams);
      return teams || [];
    } catch (error) {
      console.error('Failed to fetch teams from Supabase:', error);
      return [];
    }
  }

  // Game Management
  async getGames(scheduleId) {
    try {
      const response = await fetch(`${this.baseUrl}/schedule/schedules/${scheduleId}/games`);
      const result = await response.json();
      return result.data || result.games || result;
    } catch (error) {
      console.error('Failed to fetch games from Supabase:', error);
      return [];
    }
  }

  async createGame(scheduleId, gameData) {
    try {
      const response = await fetch(`${this.baseUrl}/schedule/schedules/${scheduleId}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      
      const result = await response.json();
      return result.data || result.game || result;
    } catch (error) {
      console.error('Failed to create game in Supabase:', error);
      throw error;
    }
  }

  async updateGame(gameId, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/schedule/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const result = await response.json();
      return result.data || result.game || result;
    } catch (error) {
      console.error('Failed to update game in Supabase:', error);
      throw error;
    }
  }

  // COMPASS Analytics Integration
  async getCompassScores(scheduleId) {
    try {
      const response = await fetch(`${this.baseUrl}/compass/scores/${scheduleId}`);
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to fetch COMPASS scores from Supabase:', error);
      return {};
    }
  }

  async calculateCompassScores(scheduleId) {
    try {
      const response = await fetch(`${this.baseUrl}/compass/calculate/${scheduleId}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to calculate COMPASS scores in Supabase:', error);
      throw error;
    }
  }

  // Constraint Management
  async getConstraints(sport) {
    try {
      const response = await fetch(`${this.baseUrl}/scheduling-service/constraints${sport ? `/${sport}` : ''}`);
      const result = await response.json();
      return result.constraints || result.data || result;
    } catch (error) {
      console.error('Failed to fetch constraints from Supabase:', error);
      return [];
    }
  }

  async validateSchedule(scheduleData) {
    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to validate schedule in Supabase:', error);
      return { valid: false, conflicts: [] };
    }
  }

  // Sports Management
  async getSports() {
    try {
      const response = await fetch(`${this.baseUrl}/sports`);
      const result = await response.json();
      return result.sports || result.data || result;
    } catch (error) {
      console.error('Failed to fetch sports from Supabase:', error);
      return [];
    }
  }

  // Schools Management
  async getSchools(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await fetch(`${this.baseUrl}/schools?${params}`);
      const result = await response.json();
      return result.schools || result.data || result;
    } catch (error) {
      console.error('Failed to fetch schools from Supabase:', error);
      return [];
    }
  }

  // Cache Management
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Supabase cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Initialize global database client
const supabaseDB = new SupabaseDBClient();

// Export for use in other modules
window.SupabaseDB = supabaseDB;

// Auto-test connection when loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔌 Initializing Supabase Database connection...');
  
  // Test connection
  const connected = await supabaseDB.testConnection();
  
  if (connected) {
    console.log('🚀 Supabase Database ready for FlexTime FT Builder');
    
    // Initialize tables if needed
    try {
      await supabaseDB.initializeTables();
    } catch (error) {
      console.warn('⚠️ Table initialization skipped (may already exist)');
    }
  } else {
    console.warn('⚠️ Running in offline mode - using demo data');
  }
});

// Database Schema for Reference (Supabase compatible)
const FLEXTIME_SUPABASE_SCHEMA = {
  schedules: {
    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    sport: 'VARCHAR(50) NOT NULL',
    season: 'VARCHAR(20) NOT NULL',
    conference: 'VARCHAR(50) DEFAULT \'Big 12\'',
    status: 'VARCHAR(20) DEFAULT \'draft\'',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    metadata: 'JSONB'
  },
  
  games: {
    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    schedule_id: 'UUID REFERENCES schedules(id)',
    home_team_id: 'VARCHAR(50) NOT NULL',
    away_team_id: 'VARCHAR(50) NOT NULL',
    game_date: 'DATE NOT NULL',
    game_time: 'TIME',
    venue_id: 'INTEGER',
    venue_name: 'VARCHAR(255)',
    broadcast_network: 'VARCHAR(100)',
    week: 'INTEGER',
    status: 'VARCHAR(20) DEFAULT \'scheduled\'',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
  },
  
  teams: {
    team_id: 'INTEGER PRIMARY KEY',
    name: 'VARCHAR(255) NOT NULL',
    short_name: 'VARCHAR(50)',
    school_id: 'INTEGER NOT NULL',
    sport: 'VARCHAR(50) NOT NULL',
    conference: 'VARCHAR(50) DEFAULT \'Big 12\'',
    logo: 'VARCHAR(255)',
    primary_color: 'VARCHAR(7)',
    secondary_color: 'VARCHAR(7)',
    venue: 'VARCHAR(255)',
    capacity: 'INTEGER',
    coach: 'VARCHAR(255)',
    abbreviation: 'VARCHAR(10)'
  },
  
  schools: {
    id: 'INTEGER PRIMARY KEY',
    name: 'VARCHAR(255) NOT NULL',
    short_name: 'VARCHAR(50)',
    conference_status: 'VARCHAR(50)',
    location: 'JSONB',
    timezone: 'VARCHAR(50)',
    colors: 'JSONB',
    logo: 'VARCHAR(255)'
  },
  
  sports: {
    id: 'INTEGER PRIMARY KEY',
    name: 'VARCHAR(100) NOT NULL',
    conference: 'VARCHAR(50)',
    gender: 'VARCHAR(1)',
    season: 'VARCHAR(20)',
    active: 'BOOLEAN DEFAULT true'
  },
  
  venues: {
    id: 'INTEGER PRIMARY KEY',
    name: 'VARCHAR(255) NOT NULL',
    school_id: 'INTEGER REFERENCES schools(id)',
    sport: 'VARCHAR(50) NOT NULL',
    capacity: 'INTEGER',
    location: 'VARCHAR(255)',
    timezone: 'VARCHAR(50)',
    surface_type: 'VARCHAR(50)',
    indoor: 'BOOLEAN DEFAULT false',
    notes: 'TEXT'
  },
  
  constraints: {
    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    name: 'VARCHAR(255) NOT NULL',
    type: 'VARCHAR(20) CHECK (type IN (\'hard\', \'soft\'))',
    category: 'VARCHAR(50)',
    description: 'TEXT',
    weight: 'DECIMAL(3,2) DEFAULT 1.0',
    active: 'BOOLEAN DEFAULT true',
    sport_specific: 'VARCHAR(50)[]',
    parameters: 'JSONB'
  },
  
  compass_scores: {
    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    schedule_id: 'UUID REFERENCES schedules(id)',
    team_id: 'INTEGER REFERENCES teams(team_id)',
    overall_score: 'DECIMAL(5,2)',
    performance_score: 'DECIMAL(5,2)',
    resources_score: 'DECIMAL(5,2)',
    balance_score: 'DECIMAL(5,2)',
    calculated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
  }
};

console.log('📊 FlexTime Supabase Database Client loaded');
console.log('Supabase URL:', SUPABASE_CONFIG.url);
console.log('Project Ref:', SUPABASE_CONFIG.projectRef);
console.log('Database Schema ready for:', Object.keys(FLEXTIME_SUPABASE_SCHEMA).join(', '));