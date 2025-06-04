const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Health and Status
  async getHealth() {
    return this.request('/api/health')
  }

  async getStatus() {
    return this.request('/api/status')
  }

  async getMetrics() {
    return this.request('/api/metrics')
  }

  // Teams
  async getTeams() {
    return this.request('/api/teams')
  }

  async getTeam(id: string) {
    return this.request(`/api/teams/${id}`)
  }

  // Schedules
  async getSchedules() {
    return this.request('/api/schedules')
  }

  async getSchedule(id: string) {
    return this.request(`/api/schedules/${id}`)
  }

  async createSchedule(scheduleData: any) {
    return this.request('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    })
  }

  // Optimization
  async optimizeSchedule(constraintData: any) {
    return this.request('/api/optimize', {
      method: 'POST',
      body: JSON.stringify(constraintData),
    })
  }

  // Analytics
  async getAnalytics(sport?: string, timeframe?: string) {
    const params = new URLSearchParams()
    if (sport) params.append('sport', sport)
    if (timeframe) params.append('timeframe', timeframe)
    
    const query = params.toString()
    return this.request(`/api/analytics${query ? `?${query}` : ''}`)
  }

  // COMPASS Analytics
  async getCompassData(teamId?: string) {
    const endpoint = teamId ? `/api/compass/${teamId}` : '/api/compass'
    return this.request(endpoint)
  }

  // Constraints
  async getConstraints() {
    return this.request('/api/constraints')
  }

  async createConstraint(constraintData: any) {
    return this.request('/api/constraints', {
      method: 'POST',
      body: JSON.stringify(constraintData),
    })
  }

  async updateConstraint(id: string, constraintData: any) {
    return this.request(`/api/constraints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(constraintData),
    })
  }

  async deleteConstraint(id: string) {
    return this.request(`/api/constraints/${id}`, {
      method: 'DELETE',
    })
  }

  // Intelligence Engine
  async getIntelligenceStatus() {
    return this.request('/api/intelligence/status')
  }

  async triggerOptimization(params: any) {
    return this.request('/api/intelligence/optimize', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // Export functionality
  async exportSchedule(scheduleId: string, format: 'csv' | 'xlsx' | 'ics' | 'json' = 'csv') {
    return this.request(`/api/export/schedule/${scheduleId}?format=${format}`)
  }

  // Real-time updates
  async subscribeToUpdates(callback: (data: any) => void) {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll implement polling
    const pollInterval = 5000 // 5 seconds
    
    const poll = async () => {
      const response = await this.getStatus()
      if (response.success && response.data) {
        callback(response.data)
      }
    }

    const intervalId = setInterval(poll, pollInterval)
    
    // Return cleanup function
    return () => clearInterval(intervalId)
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Export types for TypeScript
export type { ApiResponse }
export default ApiService