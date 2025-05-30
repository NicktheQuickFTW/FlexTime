export interface FlextimeConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  tags?: string[];
  billable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId?: string;
  color?: string;
  billable?: boolean;
  hourlyRate?: number;
  budget?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  timezone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  type: 'summary' | 'detailed' | 'project' | 'user';
  startDate: string;
  endDate: string;
  filters?: Record<string, any>;
  data: Record<string, any>;
  generatedAt: string;
}

export interface CreateTimeEntryDto {
  projectId: string;
  description: string;
  startTime: string;
  endTime?: string;
  tags?: string[];
  billable?: boolean;
}

export interface UpdateTimeEntryDto {
  projectId?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  tags?: string[];
  billable?: boolean;
}

export interface TimeEntryFilters {
  userId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  billable?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
}