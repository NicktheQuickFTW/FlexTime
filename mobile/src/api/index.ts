export { default as apiClient } from './client';
export * from './constraints';
export * from './schedules';

// Re-export for convenience
import { constraintsApi } from './constraints';
import { schedulesApi } from './schedules';

export const api = {
  constraints: constraintsApi,
  schedules: schedulesApi,
};