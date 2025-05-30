import apiClient from './client';
import { Schedule, ScheduleEvaluation } from '@/types';

export const schedulesApi = {
  // Get all schedules
  getSchedules: async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiClient.get<Schedule[]>('/schedules', { params });
  },

  // Get single schedule
  getSchedule: async (id: string) => {
    return apiClient.get<Schedule>(`/schedules/${id}`);
  },

  // Create new schedule
  createSchedule: async (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'conflicts'>) => {
    return apiClient.post<Schedule>('/schedules', schedule);
  },

  // Update schedule
  updateSchedule: async (id: string, updates: Partial<Schedule>) => {
    return apiClient.put<Schedule>(`/schedules/${id}`, updates);
  },

  // Delete schedule
  deleteSchedule: async (id: string) => {
    return apiClient.delete(`/schedules/${id}`);
  },

  // Evaluate schedule against constraints
  evaluateSchedule: async (scheduleId: string) => {
    return apiClient.post<ScheduleEvaluation>(`/schedules/${scheduleId}/evaluate`);
  },

  // Get evaluation history
  getEvaluationHistory: async (scheduleId: string) => {
    return apiClient.get<ScheduleEvaluation[]>(`/schedules/${scheduleId}/evaluations`);
  },

  // Export schedule
  exportSchedule: async (scheduleId: string, format: 'pdf' | 'excel' | 'csv') => {
    return apiClient.get(`/schedules/${scheduleId}/export`, {
      params: { format },
      responseType: 'blob',
    });
  },
};