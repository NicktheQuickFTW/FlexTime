/**
 * FlexTime Neon Database Connection
 * Establishes connection to Neon PostgreSQL database for schedule data
 */

// Database configuration from environment
const NEON_CONFIG = {
  connectionString: 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/flextime?sslmode=require',
  host: 'ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech',
  port: 5432,
  database: 'flextime',
  user: 'xii-os_owner',
  password: 'npg_4qYJFR0lneIg',
  ssl: true
};

// Since we're in a browser environment, we'll need to use a backend proxy for database operations
// This file sets up the client-side interface for database operations

class NeonDBClient {
  constructor() {
    // Use current host port for API or fallback to 3000 for backend
    const currentPort = window.location.port || '3006';
    this.baseUrl = `http://localhost:3000/api`; // Backend API endpoint for database operations (backend runs on 3000)
    this.cache = new Map();
    this.isConnected = false;
  }

  // Test database connection through backend
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/test`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        this.isConnected = true;
        console.log('✅ Connected to Neon Database');
        return true;
      } else {
        console.error('❌ Failed to connect to Neon Database');
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
      console.log('📊 Database tables initialized:', result);
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
      
      const url = `${this.baseUrl}/schedules?${params}`;
      console.log('🔍 Querying schedules:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const schedules = await response.json();
      console.log('📊 Schedules received:', {
        count: schedules?.length || 0,
        first: schedules?.[0],
        sport,
        season
      });
      
      // Cache the results
      this.cache.set(`schedules-${sport}-${season}`, schedules);
      return schedules || [];
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      return [];
    }
  }

  async createSchedule(scheduleData) {
    try {
      const response = await fetch(`${this.baseUrl}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      
      const newSchedule = await response.json();
      console.log('✅ Schedule created:', newSchedule.id);
      
      // Invalidate cache
      this.cache.clear();
      return newSchedule;
    } catch (error) {
      console.error('Failed to create schedule:', error);
      throw error;
    }
  }

  async updateSchedule(scheduleId, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const updatedSchedule = await response.json();
      console.log('✅ Schedule updated:', scheduleId);
      
      // Invalidate cache
      this.cache.clear();
      return updatedSchedule;
    } catch (error) {
      console.error('Failed to update schedule:', error);
      throw error;
    }
  }

  async saveSchedule(sport, season, games) {
    try {
      const scheduleData = {
        sport: sport,
        season: season,
        conference: 'big12',
        games: games,
        generatedAt: new Date().toISOString(),
        status: 'active'
      };

      const response = await fetch(`${this.baseUrl}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      
      const savedSchedule = await response.json();
      console.log('✅ Schedule saved:', savedSchedule.id || 'new schedule');
      
      // Invalidate cache
      this.cache.clear();
      return savedSchedule;
    } catch (error) {
      console.warn('Failed to save schedule to database:', error);
      // Don't throw - allow schedule generation to continue without DB save
      return { success: false, error: error.message };
    }
  }

  // Team Management
  async getTeams(conference = 'big12') {
    const cacheKey = `teams-${conference}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/teams?conference=${conference}`;
      console.log('🔍 Querying teams:', url);
      
      const response = await fetch(url);
      console.log('📡 Teams response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const teams = await response.json();
      console.log('👥 Teams received:', {
        count: teams?.length || 0,
        first: teams?.[0],
        conference
      });
      
      this.cache.set(cacheKey, teams);
      return teams || [];
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      return [];
    }
  }

  // Game Management
  async getGames(scheduleId) {
    try {
      const response = await fetch(`${this.baseUrl}/schedules/${scheduleId}/games`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch games:', error);
      return [];
    }
  }

  async createGame(scheduleId, gameData) {
    try {
      const response = await fetch(`${this.baseUrl}/schedules/${scheduleId}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  }

  async updateGame(gameId, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update game:', error);
      throw error;
    }
  }

  // COMPASS Analytics Integration
  async getCompassScores(scheduleId) {
    try {
      const response = await fetch(`${this.baseUrl}/compass/scores/${scheduleId}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch COMPASS scores:', error);
      return {};
    }
  }

  async calculateCompassScores(scheduleId) {
    try {
      const response = await fetch(`${this.baseUrl}/compass/calculate/${scheduleId}`, {
        method: 'POST'
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to calculate COMPASS scores:', error);
      throw error;
    }
  }

  // Constraint Management
  async getConstraints(sport) {
    try {
      const response = await fetch(`${this.baseUrl}/constraints?sport=${sport}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch constraints:', error);
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
      
      return await response.json();
    } catch (error) {
      console.error('Failed to validate schedule:', error);
      return { valid: false, conflicts: [] };
    }
  }

  // Agent Memory Management
  async saveAgentMemory(agentId, memoryData) {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryData)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to save agent memory:', error);
      throw error;
    }
  }

  async getAgentMemory(agentId) {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/memory`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch agent memory:', error);
      return [];
    }
  }

  // Analytics and Reporting
  async getScheduleMetrics(scheduleId) {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/metrics/${scheduleId}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch schedule metrics:', error);
      return {};
    }
  }

  async generateReport(scheduleId, format = 'json') {
    try {
      const response = await fetch(`${this.baseUrl}/reports/${scheduleId}?format=${format}`);
      
      if (format === 'pdf' || format === 'excel') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schedule_report.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        return { success: true, message: 'Report downloaded' };
      } else {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  }

  // Real-time Updates
  async subscribeToUpdates(scheduleId, callback) {
    // WebSocket connection for real-time updates
    const wsUrl = `ws://localhost:3000/ws/schedules/${scheduleId}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      callback(update);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return ws;
  }

  // Cache Management
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Database cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Initialize global database client
const neonDB = new NeonDBClient();

// Export for use in other modules
window.NeonDB = neonDB;

// Auto-test connection when loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔌 Initializing Neon Database connection...');
  
  // Test connection
  const connected = await neonDB.testConnection();
  
  if (connected) {
    console.log('🚀 Neon Database ready for FlexTime Schedule Builder');
    
    // Initialize tables if needed
    try {
      await neonDB.initializeTables();
    } catch (error) {
      console.warn('⚠️ Table initialization skipped (may already exist)');
    }
  } else {
    console.warn('⚠️ Running in offline mode - using demo data');
  }
});

// Database Schema for Reference
const FLEXTIME_SCHEMA = {
  schedules: {
    id: 'UUID PRIMARY KEY',
    sport: 'VARCHAR(50) NOT NULL',
    season: 'VARCHAR(20) NOT NULL',
    conference: 'VARCHAR(50) DEFAULT "big12"',
    status: 'VARCHAR(20) DEFAULT "draft"',
    created_at: 'TIMESTAMP DEFAULT NOW()',
    updated_at: 'TIMESTAMP DEFAULT NOW()',
    metadata: 'JSONB'
  },
  
  games: {
    id: 'UUID PRIMARY KEY',
    schedule_id: 'UUID REFERENCES schedules(id)',
    home_team_id: 'VARCHAR(50) NOT NULL',
    away_team_id: 'VARCHAR(50) NOT NULL',
    game_date: 'DATE NOT NULL',
    game_time: 'TIME',
    venue: 'VARCHAR(255)',
    tv_network: 'VARCHAR(100)',
    week: 'INTEGER',
    created_at: 'TIMESTAMP DEFAULT NOW()',
    updated_at: 'TIMESTAMP DEFAULT NOW()'
  },
  
  teams: {
    id: 'VARCHAR(50) PRIMARY KEY',
    name: 'VARCHAR(255) NOT NULL',
    abbreviation: 'VARCHAR(10) NOT NULL',
    conference: 'VARCHAR(50) DEFAULT "big12"',
    location: 'JSONB',
    colors: 'JSONB',
    venue_info: 'JSONB'
  },
  
  constraints: {
    id: 'UUID PRIMARY KEY',
    sport: 'VARCHAR(50) NOT NULL',
    constraint_type: 'VARCHAR(100) NOT NULL',
    description: 'TEXT',
    parameters: 'JSONB',
    is_active: 'BOOLEAN DEFAULT true'
  },
  
  compass_scores: {
    id: 'UUID PRIMARY KEY',
    schedule_id: 'UUID REFERENCES schedules(id)',
    team_id: 'VARCHAR(50) REFERENCES teams(id)',
    overall_score: 'DECIMAL(5,2)',
    performance_score: 'DECIMAL(5,2)',
    resources_score: 'DECIMAL(5,2)',
    balance_score: 'DECIMAL(5,2)',
    calculated_at: 'TIMESTAMP DEFAULT NOW()'
  },
  
  agent_memories: {
    id: 'UUID PRIMARY KEY',
    agent_id: 'VARCHAR(100) NOT NULL',
    memory_type: 'VARCHAR(50) NOT NULL',
    content: 'JSONB NOT NULL',
    relevance_score: 'DECIMAL(3,2) DEFAULT 1.0',
    created_at: 'TIMESTAMP DEFAULT NOW()',
    expires_at: 'TIMESTAMP'
  }
};

console.log('📊 FlexTime Neon Database Client loaded');
console.log('Connection String:', NEON_CONFIG.connectionString.replace(/:[^:]*@/, ':****@'));
console.log('Database Schema ready for:', Object.keys(FLEXTIME_SCHEMA).join(', '));