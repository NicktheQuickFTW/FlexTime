import { AxiosInstance } from 'axios';
import { User, ApiResponse } from '../types';

export interface CreateUserDto {
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  timezone?: string;
}

export interface UpdateUserDto {
  name?: string;
  role?: 'admin' | 'user' | 'viewer';
  timezone?: string;
  active?: boolean;
}

export interface UserFilters {
  active?: boolean;
  role?: string;
  page?: number;
  limit?: number;
}

export class Users {
  constructor(private client: AxiosInstance) {}

  async list(filters?: UserFilters): Promise<ApiResponse<User[]>> {
    const response = await this.client.get('/users', { params: filters });
    return response.data;
  }

  async get(id: string): Promise<ApiResponse<User>> {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async me(): Promise<ApiResponse<User>> {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  async create(data: CreateUserDto): Promise<ApiResponse<User>> {
    const response = await this.client.post('/users', data);
    return response.data;
  }

  async update(id: string, data: UpdateUserDto): Promise<ApiResponse<User>> {
    const response = await this.client.patch(`/users/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  async deactivate(id: string): Promise<ApiResponse<User>> {
    const response = await this.client.post(`/users/${id}/deactivate`);
    return response.data;
  }

  async activate(id: string): Promise<ApiResponse<User>> {
    const response = await this.client.post(`/users/${id}/activate`);
    return response.data;
  }
}