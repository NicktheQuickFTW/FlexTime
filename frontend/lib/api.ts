/**
 * FlexTime System API Service
 * 
 * Lightweight API service for system monitoring and health checks.
 * Used by system components that need basic connectivity testing.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

interface SystemHealth {
  status: 'connected' | 'error' | 'checking';
  message: string;
  timestamp: string;
  data?: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Simple API service for system health monitoring
 */
class SystemApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check basic API connectivity
   */
  async checkConnection(): Promise<SystemHealth> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        status: 'connected',
        message: data.message || 'API connected successfully',
        timestamp: new Date().toISOString(),
        data,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get basic system status
   */
  async getSystemStatus(): Promise<SystemHealth> {
    return this.checkConnection();
  }

  /**
   * Test API responsiveness
   */
  async ping(): Promise<{ success: boolean; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      await fetch(`${this.baseUrl}/api/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      
      return {
        success: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
      };
    }
  }
}

// Default instance
export const apiService = new SystemApiService();

// Default export
export default apiService;