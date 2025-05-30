import { AxiosInstance } from 'axios';
import { Project, ApiResponse } from '../types';

export interface CreateProjectDto {
  name: string;
  description?: string;
  clientId?: string;
  color?: string;
  billable?: boolean;
  hourlyRate?: number;
  budget?: number;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  clientId?: string;
  color?: string;
  billable?: boolean;
  hourlyRate?: number;
  budget?: number;
  active?: boolean;
}

export interface ProjectFilters {
  active?: boolean;
  billable?: boolean;
  clientId?: string;
  page?: number;
  limit?: number;
}

export class Projects {
  constructor(private client: AxiosInstance) {}

  async list(filters?: ProjectFilters): Promise<ApiResponse<Project[]>> {
    const response = await this.client.get('/projects', { params: filters });
    return response.data;
  }

  async get(id: string): Promise<ApiResponse<Project>> {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  async create(data: CreateProjectDto): Promise<ApiResponse<Project>> {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  async update(id: string, data: UpdateProjectDto): Promise<ApiResponse<Project>> {
    const response = await this.client.patch(`/projects/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/projects/${id}`);
    return response.data;
  }

  async archive(id: string): Promise<ApiResponse<Project>> {
    const response = await this.client.post(`/projects/${id}/archive`);
    return response.data;
  }

  async unarchive(id: string): Promise<ApiResponse<Project>> {
    const response = await this.client.post(`/projects/${id}/unarchive`);
    return response.data;
  }
}