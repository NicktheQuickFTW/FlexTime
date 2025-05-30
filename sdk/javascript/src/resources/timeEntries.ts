import { AxiosInstance } from 'axios';
import { 
  TimeEntry, 
  CreateTimeEntryDto, 
  UpdateTimeEntryDto, 
  TimeEntryFilters,
  ApiResponse 
} from '../types';

export class TimeEntries {
  constructor(private client: AxiosInstance) {}

  async list(filters?: TimeEntryFilters): Promise<ApiResponse<TimeEntry[]>> {
    const response = await this.client.get('/time-entries', { params: filters });
    return response.data;
  }

  async get(id: string): Promise<ApiResponse<TimeEntry>> {
    const response = await this.client.get(`/time-entries/${id}`);
    return response.data;
  }

  async create(data: CreateTimeEntryDto): Promise<ApiResponse<TimeEntry>> {
    const response = await this.client.post('/time-entries', data);
    return response.data;
  }

  async update(id: string, data: UpdateTimeEntryDto): Promise<ApiResponse<TimeEntry>> {
    const response = await this.client.patch(`/time-entries/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/time-entries/${id}`);
    return response.data;
  }

  async start(projectId: string, description: string): Promise<ApiResponse<TimeEntry>> {
    const response = await this.client.post('/time-entries/start', {
      projectId,
      description,
      startTime: new Date().toISOString()
    });
    return response.data;
  }

  async stop(id: string): Promise<ApiResponse<TimeEntry>> {
    const response = await this.client.post(`/time-entries/${id}/stop`, {
      endTime: new Date().toISOString()
    });
    return response.data;
  }

  async current(): Promise<ApiResponse<TimeEntry | null>> {
    const response = await this.client.get('/time-entries/current');
    return response.data;
  }
}