/**
 * Big 12 Conference API Data Connector
 * Handles real-time and batch data ingestion from Big 12 systems
 */

const axios = require('axios');
const Redis = require('redis');
const { EventEmitter } = require('events');

class Big12APIConnector extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.redis = Redis.createClient(config.redis);
    this.rateLimiter = this.createRateLimiter();
    this.isConnected = false;
  }

  async connect() {
    try {
      await this.redis.connect();
      this.isConnected = true;
      this.emit('connected');
      console.log('Big 12 API Connector: Connected successfully');
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  async fetchTeamData(sport, season) {
    if (!this.isConnected) {
      throw new Error('Connector not connected');
    }

    await this.rateLimiter.checkLimit();

    try {
      const response = await axios.get(`${this.config.endpoint}/teams`, {
        params: { sport, season },
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const data = this.validateTeamData(response.data);
      await this.cacheData(`teams:${sport}:${season}`, data);
      
      this.emit('dataReceived', {
        type: 'teams',
        sport,
        season,
        count: data.length
      });

      return data;
    } catch (error) {
      this.emit('error', {
        operation: 'fetchTeamData',
        sport,
        season,
        error: error.message
      });
      throw error;
    }
  }

  async fetchScheduleUpdates(since = null) {
    const params = since ? { since } : {};
    
    try {
      const response = await axios.get(`${this.config.endpoint}/schedules/updates`, {
        params,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      const updates = response.data.map(update => ({
        ...update,
        ingested_at: new Date().toISOString(),
        source: 'big12_api'
      }));

      for (const update of updates) {
        await this.processScheduleUpdate(update);
      }

      return updates;
    } catch (error) {
      this.emit('error', {
        operation: 'fetchScheduleUpdates',
        error: error.message
      });
      throw error;
    }
  }

  async processScheduleUpdate(update) {
    // Validate update structure
    const validatedUpdate = this.validateScheduleUpdate(update);
    
    // Queue for processing
    await this.redis.lPush('schedule_updates', JSON.stringify(validatedUpdate));
    
    // Emit event for real-time processors
    this.emit('scheduleUpdate', validatedUpdate);
  }

  validateTeamData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Team data must be an array');
    }

    return data.map(team => {
      if (!team.id || !team.name || !team.conference) {
        throw new Error('Invalid team data structure');
      }
      
      return {
        id: team.id,
        name: team.name,
        short_name: team.short_name || team.name,
        conference: team.conference,
        division: team.division,
        venue_id: team.venue_id,
        contact_info: team.contact_info || {},
        metadata: {
          ingested_at: new Date().toISOString(),
          source: 'big12_api'
        }
      };
    });
  }

  validateScheduleUpdate(update) {
    const required = ['game_id', 'home_team', 'away_team', 'date', 'venue'];
    
    for (const field of required) {
      if (!update[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return {
      game_id: update.game_id,
      home_team: update.home_team,
      away_team: update.away_team,
      date: new Date(update.date).toISOString(),
      venue: update.venue,
      sport: update.sport,
      season: update.season,
      status: update.status || 'scheduled',
      constraints: update.constraints || [],
      metadata: {
        ...update.metadata,
        validated_at: new Date().toISOString()
      }
    };
  }

  async cacheData(key, data) {
    const ttl = 3600; // 1 hour
    await this.redis.setEx(key, ttl, JSON.stringify(data));
  }

  createRateLimiter() {
    const { requests_per_minute, burst_limit } = this.config.rate_limit;
    let tokens = burst_limit;
    const refillRate = requests_per_minute / 60000; // tokens per ms

    setInterval(() => {
      tokens = Math.min(burst_limit, tokens + refillRate * 1000);
    }, 1000);

    return {
      async checkLimit() {
        if (tokens < 1) {
          throw new Error('Rate limit exceeded');
        }
        tokens--;
      }
    };
  }

  async startPeriodicSync(interval = 300000) { // 5 minutes
    this.syncInterval = setInterval(async () => {
      try {
        await this.fetchScheduleUpdates();
      } catch (error) {
        this.emit('error', {
          operation: 'periodicSync',
          error: error.message
        });
      }
    }, interval);
  }

  async disconnect() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.isConnected) {
      await this.redis.disconnect();
      this.isConnected = false;
      this.emit('disconnected');
    }
  }
}

module.exports = Big12APIConnector;