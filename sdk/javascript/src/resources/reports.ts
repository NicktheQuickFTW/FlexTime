import { AxiosInstance } from 'axios';
import { Report, ApiResponse } from '../types';

export interface GenerateReportDto {
  type: 'summary' | 'detailed' | 'project' | 'user';
  startDate: string;
  endDate: string;
  filters?: {
    userIds?: string[];
    projectIds?: string[];
    tags?: string[];
    billable?: boolean;
  };
  format?: 'json' | 'csv' | 'pdf';
}

export interface ReportFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class Reports {
  constructor(private client: AxiosInstance) {}

  async list(filters?: ReportFilters): Promise<ApiResponse<Report[]>> {
    const response = await this.client.get('/reports', { params: filters });
    return response.data;
  }

  async get(id: string): Promise<ApiResponse<Report>> {
    const response = await this.client.get(`/reports/${id}`);
    return response.data;
  }

  async generate(data: GenerateReportDto): Promise<ApiResponse<Report>> {
    const response = await this.client.post('/reports/generate', data);
    return response.data;
  }

  async download(id: string, format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await this.client.get(`/reports/${id}/download`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/reports/${id}`);
    return response.data;
  }

  async summary(startDate: string, endDate: string): Promise<ApiResponse<any>> {
    const response = await this.client.get('/reports/summary', {
      params: { startDate, endDate }
    });
    return response.data;
  }
}