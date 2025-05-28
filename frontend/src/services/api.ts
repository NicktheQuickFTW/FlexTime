import axios, { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse, Schedule, Game, Team, Venue, Constraint, ScheduleOptimizationResult } from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3004/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Fix TypeScript error by properly typing the data object
    const data = error.response?.data as { message?: string } || {};
    const message = data.message || error.message;
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// API service functions
export const ScheduleService = {
  // Get all schedules
  getSchedules: async (): Promise<ApiResponse<Schedule[]>> => {
    try {
      const response = await api.get<ApiResponse<Schedule[]>>('/schedules');
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Get a single schedule by ID
  getScheduleById: async (id: number): Promise<ApiResponse<Schedule>> => {
    try {
      const response = await api.get<ApiResponse<Schedule>>(`/schedules/${id}`);
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Create a new schedule
  createSchedule: async (schedule: Schedule): Promise<ApiResponse<Schedule>> => {
    try {
      const response = await api.post<ApiResponse<Schedule>>('/schedules', schedule);
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Update an existing schedule
  updateSchedule: async (id: number, schedule: Schedule): Promise<ApiResponse<Schedule>> => {
    try {
      const response = await api.put<ApiResponse<Schedule>>(`/schedules/${id}`, schedule);
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Delete a schedule
  deleteSchedule: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete<ApiResponse<void>>(`/schedules/${id}`);
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Generate a schedule
  generateSchedule: async (params: {
    sport_id: number;
    teams: number[];
    start_date: string;
    end_date: string;
    name: string;
    season: string;
    championship_id?: number;
    constraints?: Constraint[];
  }): Promise<ApiResponse<Schedule>> => {
    try {
      const response = await api.post<ApiResponse<Schedule>>('/schedules/generate', params);
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Optimize a schedule
  optimizeSchedule: async (id: number, params?: {
    optimizationType?: 'travel' | 'balance' | 'constraints';
    maxIterations?: number;
    timeLimit?: number;
  }): Promise<ApiResponse<ScheduleOptimizationResult>> => {
    try {
      const response = await api.post<ApiResponse<ScheduleOptimizationResult>>(
        `/schedules/${id}/optimize`, 
        params || {}
      );
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Get schedule metrics
  getScheduleMetrics: async (id: number): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get<ApiResponse<any>>(`/schedules/${id}/metrics`);
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Add a game to a schedule
  addGame: async (scheduleId: number, game: Game): Promise<ApiResponse<Game>> => {
    try {
      const response = await api.post<ApiResponse<Game>>(`/schedules/${scheduleId}/games`, game);
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Update a game in a schedule
  updateGame: async (scheduleId: number, gameId: number, game: Game): Promise<ApiResponse<Game>> => {
    try {
      const response = await api.put<ApiResponse<Game>>(
        `/schedules/${scheduleId}/games/${gameId}`, 
        game
      );
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Delete a game from a schedule
  deleteGame: async (scheduleId: number, gameId: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete<ApiResponse<void>>(
        `/schedules/${scheduleId}/games/${gameId}`
      );
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Add a constraint to a schedule
  addConstraint: async (scheduleId: number, constraint: Constraint): Promise<ApiResponse<Constraint>> => {
    try {
      const response = await api.post<ApiResponse<Constraint>>(
        `/schedules/${scheduleId}/constraints`, 
        constraint
      );
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Delete a constraint from a schedule
  deleteConstraint: async (scheduleId: number, constraintId: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete<ApiResponse<void>>(
        `/schedules/${scheduleId}/constraints/${constraintId}`
      );
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
};

export const TeamService = {
  // Get all teams
  getTeams: async (): Promise<ApiResponse<Team[]>> => {
    try {
      const response = await api.get<ApiResponse<Team[]>>('/teams');
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Get teams by championship ID
  getTeamsByChampionship: async (championshipId: number): Promise<ApiResponse<Team[]>> => {
    try {
      const response = await api.get<ApiResponse<Team[]>>(`/teams?championship_id=${championshipId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
};

export const VenueService = {
  // Get all venues
  getVenues: async (): Promise<ApiResponse<Venue[]>> => {
    try {
      const response = await api.get<ApiResponse<Venue[]>>('/venues');
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Create a new venue
  createVenue: async (venue: Venue): Promise<ApiResponse<Venue>> => {
    try {
      const response = await api.post<ApiResponse<Venue>>('/venues', venue);
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Update an existing venue
  updateVenue: async (id: number, venue: Venue): Promise<ApiResponse<Venue>> => {
    try {
      const response = await api.put<ApiResponse<Venue>>(`/venues/${id}`, venue);
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Add unavailable dates to a venue
  addUnavailableDates: async (
    venueId: number, 
    dates: string[]
  ): Promise<ApiResponse<Venue>> => {
    try {
      const response = await api.post<ApiResponse<Venue>>(
        `/venues/${venueId}/unavailable-dates`, 
        { dates }
      );
      return response.data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
};

// Create a services object for the default export
const services = {
  ScheduleService,
  TeamService,
  VenueService
};

export default services;
