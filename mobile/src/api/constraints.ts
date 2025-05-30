import apiClient from './client';
import { Constraint, ConstraintConflict } from '@/types';

export const constraintsApi = {
  // Get all constraints
  getConstraints: async (params?: {
    type?: 'hard' | 'soft';
    category?: string;
    active?: boolean;
  }) => {
    return apiClient.get<Constraint[]>('/constraints', { params });
  },

  // Get single constraint
  getConstraint: async (id: string) => {
    return apiClient.get<Constraint>(`/constraints/${id}`);
  },

  // Create new constraint
  createConstraint: async (constraint: Omit<Constraint, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiClient.post<Constraint>('/constraints', constraint);
  },

  // Update constraint
  updateConstraint: async (id: string, updates: Partial<Constraint>) => {
    return apiClient.put<Constraint>(`/constraints/${id}`, updates);
  },

  // Delete constraint
  deleteConstraint: async (id: string) => {
    return apiClient.delete(`/constraints/${id}`);
  },

  // Toggle constraint active status
  toggleConstraintStatus: async (id: string) => {
    return apiClient.post<Constraint>(`/constraints/${id}/toggle`);
  },

  // Check for conflicts
  checkConflicts: async (constraintIds?: string[]) => {
    return apiClient.post<ConstraintConflict[]>('/constraints/conflicts', { constraintIds });
  },

  // Get conflict history
  getConflictHistory: async (params?: {
    resolved?: boolean;
    severity?: string;
    limit?: number;
  }) => {
    return apiClient.get<ConstraintConflict[]>('/constraints/conflicts/history', { params });
  },

  // Resolve conflict
  resolveConflict: async (conflictId: string, resolution: string) => {
    return apiClient.post<ConstraintConflict>(`/constraints/conflicts/${conflictId}/resolve`, {
      resolution,
    });
  },
};