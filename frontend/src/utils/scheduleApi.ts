// Schedule API utilities for FT Builder
// Connects to Neon DB HELiiX backend

export interface Team {
  team_id: number; // Integer ID like 101 (Arizona Baseball), 508 (UCF Football), 1002 (Kansas Basketball)
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
  // COMPASS ratings (excluding from this simple builder)
  // compass_competitive?: number;
  // compass_operational?: number;
  // compass_market?: number;
  // compass_trajectory?: number;
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
  // Populated relations
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
  // Populated relations
  games?: Game[];
  metrics?: ScheduleMetrics;
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

// API Class for Schedule Management
export class ScheduleAPI {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005') {
    this.baseUrl = baseUrl;
  }

  // Public getter for debugging
  get apiBaseUrl(): string {
    return this.baseUrl;
  }

  // Team operations
  async getTeams(sport?: string, conference?: string): Promise<Team[]> {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (conference) params.append('conference', conference);
    
    const response = await fetch(`${this.baseUrl}/api/teams?${params}`);
    if (!response.ok) throw new Error('Failed to fetch teams');
    const data = await response.json();
    // Extract teams from the response (backend returns {success: true, teams: [...]}
    return data.teams || data;
  }

  async getTeam(id: number): Promise<Team> {
    const response = await fetch(`${this.baseUrl}/api/teams/${id}`);
    if (!response.ok) throw new Error('Failed to fetch team');
    return response.json();
  }

  // Venue operations
  async getVenues(sport?: string, schoolId?: number): Promise<Venue[]> {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (schoolId) params.append('school_id', schoolId.toString());
    
    const response = await fetch(`${this.baseUrl}/api/venues?${params}`);
    if (!response.ok) throw new Error('Failed to fetch venues');
    return response.json();
  }

  // Schedule operations
  async getSchedules(sport?: string, season?: string): Promise<Schedule[]> {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (season) params.append('season', season);
    
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules?${params}`);
    if (!response.ok) throw new Error('Failed to fetch schedules');
    return response.json();
  }

  async getSchedule(id: string): Promise<Schedule> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules/${id}`);
    if (!response.ok) throw new Error('Failed to fetch schedule');
    return response.json();
  }

  async createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule)
    });
    if (!response.ok) throw new Error('Failed to create schedule');
    return response.json();
  }

  async updateSchedule(id: string, schedule: Partial<Schedule>): Promise<Schedule> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule)
    });
    if (!response.ok) throw new Error('Failed to update schedule');
    return response.json();
  }

  async deleteSchedule(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete schedule');
  }

  // Schedule generation
  async generateSchedule(options: ScheduleGenerationOptions): Promise<Schedule> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!response.ok) throw new Error('Failed to generate schedule');
    const data = await response.json();
    // Extract schedule from the response (backend returns {success: true, schedule: {...}})
    return data.schedule || data;
  }

  // Schedule optimization
  async optimizeSchedule(id: string, constraints?: string[]): Promise<Schedule> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules/${id}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ constraints })
    });
    if (!response.ok) throw new Error('Failed to optimize schedule');
    return response.json();
  }

  // Schedule analysis
  async analyzeSchedule(id: string): Promise<ScheduleMetrics> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules/${id}/analyze`);
    if (!response.ok) throw new Error('Failed to analyze schedule');
    return response.json();
  }

  // Game operations
  async getGames(scheduleId: string): Promise<Game[]> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules/${scheduleId}/games`);
    if (!response.ok) throw new Error('Failed to fetch games');
    return response.json();
  }

  async createGame(scheduleId: string, game: Omit<Game, 'id' | 'schedule_id' | 'created_at' | 'updated_at'>): Promise<Game> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules/${scheduleId}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(game)
    });
    if (!response.ok) throw new Error('Failed to create game');
    return response.json();
  }

  async updateGame(gameId: string, game: Partial<Game>): Promise<Game> {
    const response = await fetch(`${this.baseUrl}/api/games/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(game)
    });
    if (!response.ok) throw new Error('Failed to update game');
    return response.json();
  }

  async deleteGame(gameId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/games/${gameId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete game');
  }

  // Constraint operations
  async getConstraints(sport?: string): Promise<Constraint[]> {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    
    const response = await fetch(`${this.baseUrl}/api/scheduling-service/constraints?${params}`);
    if (!response.ok) throw new Error('Failed to fetch constraints');
    const data = await response.json();
    // Extract constraints from the response (backend returns {success: true, constraints: [...]}
    return data.constraints || data;
  }

  async getConstraintViolations(scheduleId: string): Promise<ConstraintViolation[]> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules/${scheduleId}/violations`);
    if (!response.ok) throw new Error('Failed to fetch constraint violations');
    return response.json();
  }

  async validateGame(scheduleId: string, game: Partial<Game>): Promise<ConstraintViolation[]> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules/${scheduleId}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(game)
    });
    if (!response.ok) throw new Error('Failed to validate game');
    return response.json();
  }

  async autoFixViolation(violationId: string): Promise<Game | null> {
    const response = await fetch(`${this.baseUrl}/api/violations/${violationId}/fix`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to auto-fix violation');
    return response.json();
  }

  // Export operations
  async exportSchedule(id: string, format: 'csv' | 'pdf' | 'ics' | 'json' | 'xlsx'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/schedule/schedules/${id}/export?format=${format}`);
    if (!response.ok) throw new Error('Failed to export schedule');
    return response.blob();
  }

  // Sports and configuration
  async getSports(): Promise<Array<{ name: string; displayName: string; teams: number }>> {
    const response = await fetch(`${this.baseUrl}/api/sports`);
    if (!response.ok) throw new Error('Failed to fetch sports');
    return response.json();
  }

  async getSeasons(): Promise<Array<{ name: string; startDate: string; endDate: string }>> {
    const response = await fetch(`${this.baseUrl}/api/seasons`);
    if (!response.ok) throw new Error('Failed to fetch seasons');
    return response.json();
  }
}

// Default API instance
export const scheduleApi = new ScheduleAPI();

// Utility functions
export const formatGameTime = (game: Game): string => {
  const date = new Date(game.game_date);
  const time = game.game_time;
  return `${date.toLocaleDateString()} ${time}`;
};

export const getGameStatus = (game: Game): { color: string; label: string } => {
  const statusConfig = {
    scheduled: { color: 'text-blue-400', label: 'Scheduled' },
    confirmed: { color: 'text-green-400', label: 'Confirmed' },
    conflict: { color: 'text-red-400', label: 'Conflict' },
    tentative: { color: 'text-yellow-400', label: 'Tentative' },
    cancelled: { color: 'text-gray-400', label: 'Cancelled' }
  };
  return statusConfig[game.status] || statusConfig.scheduled;
};

export const calculateRestDays = (game1: Game, game2: Game): number => {
  const date1 = new Date(game1.game_date);
  const date2 = new Date(game2.game_date);
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
};

export const groupGamesByWeek = (games: Game[]): Record<string, Game[]> => {
  return games.reduce((groups, game) => {
    const date = new Date(game.game_date);
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!groups[weekKey]) groups[weekKey] = [];
    groups[weekKey].push(game);
    return groups;
  }, {} as Record<string, Game[]>);
};