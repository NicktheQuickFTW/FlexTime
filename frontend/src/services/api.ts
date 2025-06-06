/**
 * FlexTime Unified API Service
 * 
 * Single source of truth for all API communication with the FlexTime backend.
 * Replaces multiple fragmented API files with one clean, type-safe service.
 * 
 * Backend endpoints (from backend analysis):
 * - /api/scheduling-service/* - Teams, constraints, optimization
 * - /api/schedule/* - Schedule CRUD operations
 * - /api/export/* - Export functionality
 * - /api/metrics/* - System metrics
 */

// Types (unified from scheduleApi.ts and enhanced)
export interface Team {
  team_id: number;
  name: string;
  shortName: string;
  school_id: number;
  sport: string;
  conference: string;
  division?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  venue?: string;
  capacity?: number;
  coach?: string;
  abbreviation?: string;
  sport_id?: number;
}

export interface Schedule {
  id?: string;
  name: string;
  sport: string;
  season: string;
  conference: string;
  status: 'draft' | 'published' | 'optimizing' | 'archived';
  description?: string;
  start_date: string;
  end_date: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  games?: Game[];
  metrics?: ScheduleMetrics;
}

export interface Game {
  id: string;
  schedule_id: string;
  home_team_id: number;
  away_team_id: number;
  game_date: string;
  game_time: string;
  venue_id?: number;
  venue_name?: string;
  status: 'scheduled' | 'confirmed' | 'conflict' | 'tentative' | 'cancelled';
  broadcast_network?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  homeTeam?: Team;
  awayTeam?: Team;
  venue?: Venue;
  constraints?: ConstraintViolation[];
}

export interface Venue {
  id: number;
  name: string;
  school_id: number;
  sport: string;
  capacity: number;
  location: string;
  timezone: string;
  surface_type?: string;
  indoor: boolean;
  setup_time_minutes?: number;
  teardown_time_minutes?: number;
  notes?: string;
}

export interface Constraint {
  id: string;
  name: string;
  type: 'hard' | 'soft';
  category: 'travel' | 'rest' | 'venue' | 'broadcast' | 'academic' | 'competitive';
  description: string;
  weight: number;
  active: boolean;
  sport_specific?: string[];
  parameters?: Record<string, any>;
  sportType?: string;
  isActive?: boolean;
}

export interface ConstraintViolation {
  id: string;
  constraint_id: string;
  game_id?: string;
  schedule_id: string;
  type: 'error' | 'warning' | 'info';
  severity: number;
  message: string;
  description?: string;
  suggestion?: string;
  autoFixable: boolean;
  constraint?: Constraint;
}

export interface ScheduleMetrics {
  totalGames: number;
  totalTeams: number;
  conflicts: number;
  averageRestDays: number;
  optimizationScore: number;
  balanceScore: number;
  travelDistance: number;
  constraintViolations: {
    hard: number;
    soft: number;
    total: number;
  };
}

export interface ScheduleGenerationOptions {
  sport: string;
  season: string;
  teams: number[];
  algorithm: 'round_robin' | 'partial_round_robin' | 'agent_optimized' | 'custom';
  constraints: string[];
  startDate: string;
  endDate: string;
  gameFormat?: 'single' | 'series';
  restDays?: number;
  homeAwayBalance?: boolean;
  avoidBackToBack?: boolean;
  respectAcademicCalendar?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  teams?: T;
  constraints?: T;
  schedule?: T;
  count?: number;
}

// API Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
};

// Utility function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Unified FlexTime API Service
 * 
 * Provides a clean, type-safe interface to all FlexTime backend services.
 * Handles errors, retries, and response normalization automatically.
 */
export class FlexTimeAPI {
  private baseURL: string;

  constructor(baseURL: string = API_CONFIG.baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * Generic request method with error handling and retries
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = API_CONFIG.retries
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        if (attempt === retries) {
          throw new Error(`Failed to fetch ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Wait before retry
        await delay(API_CONFIG.retryDelay * (attempt + 1));
      }
    }

    throw new Error(`Failed to fetch ${endpoint} after ${retries} retries`);
  }

  // ===================
  // TEAM OPERATIONS
  // ===================

  /**
   * Get all teams or filter by sport/conference
   */
  async getTeams(sport?: string, conference?: string): Promise<Team[]> {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (conference) params.append('conference', conference);
    
    const response = await this.request<ApiResponse<Team[]>>(
      `/api/scheduling-service/teams?${params}`
    );
    
    // Handle different response formats from backend
    return response.teams || response.data || response as unknown as Team[];
  }

  /**
   * Get teams by conference
   */
  async getTeamsByConference(conference: string): Promise<Team[]> {
    const response = await this.request<ApiResponse<Team[]>>(
      `/api/scheduling-service/teams/${conference}`
    );
    
    return response.teams || response.data || response as unknown as Team[];
  }

  /**
   * Get a specific team by ID
   */
  async getTeam(id: number): Promise<Team> {
    const response = await this.request<ApiResponse<Team>>(
      `/api/scheduling-service/teams/${id}`
    );
    
    return response.data || response as unknown as Team;
  }

  // ===================
  // VENUE OPERATIONS
  // ===================

  /**
   * Get all venues or filter by parameters
   */
  async getVenues(filters?: { school_id?: number; sport_id?: number; venue_type?: number }): Promise<Venue[]> {
    const params = new URLSearchParams();
    if (filters?.school_id) params.append('school_id', filters.school_id.toString());
    if (filters?.sport_id) params.append('sport_id', filters.sport_id.toString());
    if (filters?.venue_type) params.append('venue_type', filters.venue_type.toString());
    
    const response = await this.request<ApiResponse<Venue[]>>(
      `/api/venues?${params}`
    );
    
    return response.data || response as unknown as Venue[];
  }

  /**
   * Get a specific venue by ID
   */
  async getVenue(id: number): Promise<Venue> {
    const response = await this.request<ApiResponse<Venue>>(
      `/api/venues/${id}`
    );
    
    return response.data || response as unknown as Venue;
  }

  // ===================
  // SPORT OPERATIONS
  // ===================

  /**
   * Get all sports
   */
  async getSports(): Promise<Record<string, any>> {
    const response = await this.request<ApiResponse<Record<string, any>>>(
      `/api/sports`
    );
    
    return response.data || response as unknown as Record<string, any>;
  }

  /**
   * Get a specific sport by ID
   */
  async getSport(id: number): Promise<any> {
    const sports = await this.getSports();
    return sports[id] || null;
  }

  // ===================
  // SCHOOL OPERATIONS
  // ===================

  /**
   * Get all schools with optional filters
   */
  async getSchools(filters?: { conference_status?: string }): Promise<Record<string, any>> {
    const params = new URLSearchParams();
    if (filters?.conference_status) params.append('conference_status', filters.conference_status);
    
    const response = await this.request<ApiResponse<Record<string, any>>>(
      `/api/schools?${params}`
    );
    
    return response.data || response as unknown as Record<string, any>;
  }

  /**
   * Get a specific school by ID
   */
  async getSchool(id: number): Promise<any> {
    const schools = await this.getSchools();
    return schools[id] || null;
  }

  // ===================
  // SCHEDULE OPERATIONS
  // ===================

  /**
   * Get all schedules or filter by sport/season
   */
  async getSchedules(sport?: string, season?: string): Promise<Schedule[]> {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (season) params.append('season', season);
    
    const response = await this.request<ApiResponse<Schedule[]>>(
      `/api/schedule/schedules?${params}`
    );
    
    return response.data || response as unknown as Schedule[];
  }

  /**
   * Get a specific schedule by ID
   */
  async getSchedule(id: string): Promise<Schedule> {
    const response = await this.request<ApiResponse<Schedule>>(
      `/api/schedule/schedules/${id}`
    );
    
    return response.data || response as unknown as Schedule;
  }

  /**
   * Create a new schedule
   */
  async createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule> {
    const response = await this.request<ApiResponse<Schedule>>(
      `/api/schedule/schedules`,
      {
        method: 'POST',
        body: JSON.stringify(schedule),
      }
    );
    
    return response.data || response.schedule || response as unknown as Schedule;
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(id: string, schedule: Partial<Schedule>): Promise<Schedule> {
    const response = await this.request<ApiResponse<Schedule>>(
      `/api/schedule/schedules/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(schedule),
      }
    );
    
    return response.data || response.schedule || response as unknown as Schedule;
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(id: string): Promise<void> {
    await this.request<void>(`/api/schedule/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Generate a new schedule using AI
   */
  async generateSchedule(options: ScheduleGenerationOptions): Promise<Schedule> {
    const response = await this.request<ApiResponse<Schedule>>(
      `/api/schedule/schedules/generate`,
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    );
    
    return response.data || response.schedule || response as unknown as Schedule;
  }

  /**
   * Optimize an existing schedule
   */
  async optimizeSchedule(id: string, constraints?: string[]): Promise<Schedule> {
    const response = await this.request<ApiResponse<Schedule>>(
      `/api/schedule/schedules/${id}/optimize`,
      {
        method: 'POST',
        body: JSON.stringify({ constraints }),
      }
    );
    
    return response.data || response.schedule || response as unknown as Schedule;
  }

  /**
   * Get schedule performance metrics
   */
  async getScheduleMetrics(id: string): Promise<ScheduleMetrics> {
    const response = await this.request<ApiResponse<ScheduleMetrics>>(
      `/api/schedule/schedules/${id}/metrics`
    );
    
    return response.data || response as unknown as ScheduleMetrics;
  }

  // ===================
  // CONSTRAINT OPERATIONS
  // ===================

  /**
   * Get all constraints or filter by sport
   */
  async getConstraints(sport?: string): Promise<Constraint[]> {
    const endpoint = sport 
      ? `/api/scheduling-service/constraints/${sport}`
      : `/api/scheduling-service/constraints`;
    
    const response = await this.request<ApiResponse<Constraint[]>>(endpoint);
    
    return response.constraints || response.data || response as unknown as Constraint[];
  }

  /**
   * Get constraint violations for a schedule
   */
  async getConstraintViolations(scheduleId: string): Promise<ConstraintViolation[]> {
    const response = await this.request<ApiResponse<ConstraintViolation[]>>(
      `/api/scheduling-service/schedules/${scheduleId}/conflicts`
    );
    
    return response.data || response as unknown as ConstraintViolation[];
  }

  /**
   * Auto-fix a constraint violation
   */
  async autoFixViolation(violationId: string): Promise<Game | null> {
    const response = await this.request<ApiResponse<Game>>(
      `/api/scheduling-service/violations/${violationId}/fix`,
      { method: 'POST' }
    );
    
    return response.data || null;
  }

  // ===================
  // GAME OPERATIONS
  // ===================

  /**
   * Get games for a schedule
   */
  async getGames(scheduleId: string): Promise<Game[]> {
    const response = await this.request<ApiResponse<Game[]>>(
      `/api/schedule/schedules/${scheduleId}/games`
    );
    
    return response.data || response as unknown as Game[];
  }

  /**
   * Create a new game
   */
  async createGame(scheduleId: string, game: Omit<Game, 'id' | 'schedule_id' | 'created_at' | 'updated_at'>): Promise<Game> {
    const response = await this.request<ApiResponse<Game>>(
      `/api/schedule/schedules/${scheduleId}/games`,
      {
        method: 'POST',
        body: JSON.stringify(game),
      }
    );
    
    return response.data || response as unknown as Game;
  }

  /**
   * Update a game
   */
  async updateGame(gameId: string, game: Partial<Game>): Promise<Game> {
    const response = await this.request<ApiResponse<Game>>(
      `/api/schedule/games/${gameId}`,
      {
        method: 'PUT',
        body: JSON.stringify(game),
      }
    );
    
    return response.data || response as unknown as Game;
  }

  /**
   * Delete a game
   */
  async deleteGame(gameId: string): Promise<void> {
    await this.request<void>(`/api/schedule/games/${gameId}`, {
      method: 'DELETE',
    });
  }

  // ===================
  // EXPORT OPERATIONS
  // ===================

  /**
   * Export schedule in various formats
   */
  async exportSchedule(id: string, format: 'csv' | 'pdf' | 'ics' | 'json' | 'xlsx'): Promise<Blob> {
    const response = await fetch(
      `${this.baseURL}/api/export/schedules/${id}?format=${format}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to export schedule: ${response.statusText}`);
    }
    
    return response.blob();
  }

  // ===================
  // SYSTEM OPERATIONS
  // ===================

  /**
   * Get API status
   */
  async getStatus(): Promise<{ status: string; message: string; version: string }> {
    return this.request<{ status: string; message: string; version: string }>('/api/status');
  }

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<any> {
    return this.request<any>('/api/metrics');
  }

  /**
   * Submit feedback
   */
  async submitFeedback(feedback: {
    type: string;
    message: string;
    scheduleId?: string;
    rating?: number;
  }): Promise<void> {
    await this.request<void>('/api/scheduling-service/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }
}

// Default API instance
export const api = new FlexTimeAPI();

// Legacy exports for compatibility
export const ScheduleService = {
  getSchedules: () => api.getSchedules(),
  getScheduleById: (id: number) => api.getSchedule(id.toString()),
  createSchedule: (schedule: Schedule) => api.createSchedule(schedule),
  updateSchedule: (id: number, schedule: Schedule) => api.updateSchedule(id.toString(), schedule),
  deleteSchedule: (id: number) => api.deleteSchedule(id.toString()),
  generateSchedule: (params: any) => api.generateSchedule(params),
  optimizeSchedule: (id: number, params?: any) => api.optimizeSchedule(id.toString(), params?.constraints),
  getScheduleMetrics: (id: number) => api.getScheduleMetrics(id.toString()),
  addGame: (scheduleId: number, game: Game) => api.createGame(scheduleId.toString(), game),
  updateGame: (scheduleId: number, gameId: number, game: Game) => api.updateGame(gameId.toString(), game),
  deleteGame: (scheduleId: number, gameId: number) => api.deleteGame(gameId.toString()),
  addConstraint: async () => { throw new Error('Not implemented'); },
  deleteConstraint: async () => { throw new Error('Not implemented'); },
};

export const TeamService = {
  getTeams: () => api.getTeams(),
  getTeamsByChampionship: (championshipId: number) => api.getTeamsByConference(championshipId.toString()),
};

export const VenueService = {
  getVenues: () => api.getVenues(),
  getVenueById: (id: number) => api.getVenue(id),
  createVenue: async () => { throw new Error('Venue create endpoint not yet implemented'); },
  updateVenue: async () => { throw new Error('Venue update endpoint not yet implemented'); },
  addUnavailableDates: async () => { throw new Error('Venue unavailable dates endpoint not yet implemented'); },
};

// FlexTime API instance for compatibility
export const flexTimeAPI = {
  // Teams
  getTeams: (filters?: { sport_id?: number; school_id?: number }) => api.getTeams(
    filters?.sport_id?.toString(),
    undefined
  ),
  getTeamById: (id: number) => api.getTeam(id),
  
  // Venues
  getVenues: (filters?: { school_id?: number; sport_id?: number; venue_type?: number }) => api.getVenues(filters),
  getVenueById: (id: number) => api.getVenue(id),
  
  // Sports
  getSports: () => api.getSports(),
  getSportById: (id: number) => api.getSport(id),
  
  // Schools
  getSchools: (filters?: { conference_status?: string }) => api.getSchools(filters),
  getSchoolById: (id: number) => api.getSchool(id),
  
  // Schedules
  createSchedule: async (scheduleData: any) => {
    // Ensure team_ids are calculated correctly
    const Big12DataService = {
      calculateTeamId: (schoolId: number, sportId: number) => {
        return schoolId * 100 + sportId;
      }
    };
    
    if (scheduleData.teams) {
      scheduleData.teams = scheduleData.teams.map((team: any) => ({
        ...team,
        team_id: team.team_id || Big12DataService.calculateTeamId(team.school_id, team.sport_id)
      }));
    }
    
    return api.createSchedule(scheduleData);
  },
  getSchedules: () => api.getSchedules(),
  getScheduleById: (id: string) => api.getSchedule(id),
};

// Default export
export default api;