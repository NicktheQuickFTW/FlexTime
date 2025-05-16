import axios from 'axios';
import { Schedule } from '../types';

// Types for optimization-related data
export interface ScheduleConflict {
  id: string;
  type: 'venue' | 'team' | 'official' | 'time' | 'resource';
  description: string;
  severity: 'high' | 'medium' | 'low';
  affectedItems: string[];
}

export interface ResolutionOption {
  id: string;
  description: string;
  confidence: number; // 0-100
  changes: {
    itemId: string;
    field: string;
    oldValue: string;
    newValue: string;
  }[];
}

export interface OptimizationResult {
  optimizedSchedule: Schedule;
  improvements: {
    category: string;
    metric: string;
    oldValue: number;
    newValue: number;
    percentChange: number;
  }[];
}

// Base URL for the backend API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/scheduling-service';

/**
 * Service for schedule optimization and conflict resolution
 * Uses the integrated backend scheduling service
 */
export const ScheduleOptimizationService = {
  /**
   * Detect conflicts in a schedule
   * @param scheduleId The ID of the schedule to check for conflicts
   * @returns Promise with an array of schedule conflicts
   */
  detectConflicts: async (scheduleId: number): Promise<ScheduleConflict[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/schedules/${scheduleId}/conflicts`);
      return response.data;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      throw error;
    }
  },

  /**
   * Get resolution options for a specific conflict
   * @param scheduleId The ID of the schedule containing the conflict
   * @param conflictId The ID of the conflict to resolve
   * @returns Promise with an array of resolution options
   */
  getResolutionOptions: async (scheduleId: number, conflictId: string): Promise<ResolutionOption[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/schedules/${scheduleId}/conflicts/${conflictId}/resolutions`);
      return response.data;
    } catch (error) {
      console.error('Error getting resolution options:', error);
      throw error;
    }
  },

  /**
   * Apply a resolution option to fix a conflict
   * @param scheduleId The ID of the schedule to modify
   * @param conflictId The ID of the conflict being resolved
   * @param resolutionId The ID of the resolution option to apply
   * @returns Promise with the updated schedule
   */
  applyResolution: async (scheduleId: number, conflictId: string, resolutionId: string): Promise<Schedule> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/schedules/${scheduleId}/conflicts/${conflictId}/apply`, {
        resolutionId
      });
      return response.data;
    } catch (error) {
      console.error('Error applying resolution:', error);
      throw error;
    }
  },

  /**
   * Run optimization on a schedule to improve it based on various metrics
   * @param scheduleId The ID of the schedule to optimize
   * @param optimizationParams Parameters to guide the optimization process
   * @returns Promise with optimization results
   */
  optimizeSchedule: async (
    scheduleId: number, 
    optimizationParams: {
      priorities: { [key: string]: number }, // e.g., { "travelDistance": 0.8, "restTime": 0.9 }
      constraints: { [key: string]: any }
    }
  ): Promise<OptimizationResult> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/optimize`, {
        scheduleId,
        ...optimizationParams
      });
      return response.data;
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      throw error;
    }
  },

  /**
   * Get insights about a schedule
   * @param scheduleId The ID of the schedule to analyze
   * @returns Promise with insights data
   */
  getScheduleInsights: async (scheduleId: number): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/learning/insights?scheduleId=${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting schedule insights:', error);
      throw error;
    }
  }
};

export default ScheduleOptimizationService;