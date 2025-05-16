import { ScheduleConflict, ResolutionOption, OptimizationResult, ScheduleOptimizationService } from './scheduleOptimizationService';
import { Schedule } from '../types';

/**
 * AI Service - provides AI capabilities for schedule management
 * 
 * NOTE: This service is now a wrapper around the ScheduleOptimizationService
 * to maintain backward compatibility while removing external dependencies.
 */
export const AIService = {
  /**
   * Detect conflicts in a schedule
   * @param scheduleId The ID of the schedule to check for conflicts
   * @returns Promise with an array of schedule conflicts
   */
  detectConflicts: async (scheduleId: number): Promise<ScheduleConflict[]> => {
    return ScheduleOptimizationService.detectConflicts(scheduleId);
  },

  /**
   * Get AI-generated resolution options for a specific conflict
   * @param scheduleId The ID of the schedule containing the conflict
   * @param conflictId The ID of the conflict to resolve
   * @returns Promise with an array of resolution options
   */
  getResolutionOptions: async (scheduleId: number, conflictId: string): Promise<ResolutionOption[]> => {
    return ScheduleOptimizationService.getResolutionOptions(scheduleId, conflictId);
  },

  /**
   * Apply a resolution option to fix a conflict
   * @param scheduleId The ID of the schedule to modify
   * @param conflictId The ID of the conflict being resolved
   * @param resolutionId The ID of the resolution option to apply
   * @returns Promise with the updated schedule
   */
  applyResolution: async (scheduleId: number, conflictId: string, resolutionId: string): Promise<Schedule> => {
    return ScheduleOptimizationService.applyResolution(scheduleId, conflictId, resolutionId);
  },

  /**
   * Run AI optimization on a schedule to improve it based on various metrics
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
    return ScheduleOptimizationService.optimizeSchedule(scheduleId, optimizationParams);
  },

  /**
   * Get AI-generated insights about a schedule
   * @param scheduleId The ID of the schedule to analyze
   * @returns Promise with insights data
   */
  getScheduleInsights: async (scheduleId: number): Promise<any> => {
    return ScheduleOptimizationService.getScheduleInsights(scheduleId);
  }
};

// Re-export the types for backward compatibility
export type { ScheduleConflict, ResolutionOption, OptimizationResult };

export default AIService;
