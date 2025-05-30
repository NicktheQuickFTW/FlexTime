import axios, { AxiosInstance } from 'axios';
import { TimeEntries } from './resources/timeEntries';
import { Projects } from './resources/projects';
import { Users } from './resources/users';
import { Reports } from './resources/reports';
import { FlextimeConfig, ApiResponse } from './types';
import { FlextimeError } from './errors';

export class FlextimeClient {
  private client: AxiosInstance;
  
  public timeEntries: TimeEntries;
  public projects: Projects;
  public users: Users;
  public reports: Reports;

  constructor(config: FlextimeConfig) {
    this.validateConfig(config);
    
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.flextime.io/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-SDK-Version': '1.0.0',
        'X-SDK-Language': 'JavaScript'
      },
      timeout: config.timeout || 30000
    });

    this.setupInterceptors();
    
    // Initialize resources
    this.timeEntries = new TimeEntries(this.client);
    this.projects = new Projects(this.client);
    this.users = new Users(this.client);
    this.reports = new Reports(this.client);
  }

  private validateConfig(config: FlextimeConfig): void {
    if (!config.apiKey) {
      throw new FlextimeError('API key is required', 'INVALID_CONFIG');
    }
  }

  private setupInterceptors(): void {
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response) {
          const { status, data } = error.response;
          throw new FlextimeError(
            data.message || 'An error occurred',
            data.code || 'API_ERROR',
            status,
            data
          );
        } else if (error.request) {
          throw new FlextimeError(
            'No response received from server',
            'NETWORK_ERROR'
          );
        } else {
          throw new FlextimeError(
            error.message || 'Request setup failed',
            'REQUEST_ERROR'
          );
        }
      }
    );
  }

  async health(): Promise<ApiResponse<{ status: string }>> {
    const response = await this.client.get('/health');
    return response.data;
  }
}