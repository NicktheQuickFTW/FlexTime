// Mock Dashboard Analytics Service
// Provides mock data for the AdvancedAnalyticsDashboard component

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_activity: number;
  active_connections: number;
}

export interface SchedulingMetrics {
  total_schedules: number;
  completed_schedules: number;
  active_optimizations: number;
  constraint_violations: number;
  average_completion_time: number;
}

export interface GameAnalytics {
  total_games: number;
  games_this_week: number;
  upcoming_games: number;
  conflicts_resolved: number;
  travel_efficiency: number;
}

export interface AIInsights {
  optimization_score: number;
  prediction_accuracy: number;
  recommendations_generated: number;
  time_saved_hours: number;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

// Mock data generators
const generateRandomValue = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateChartData = (points: number = 20): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 60000)); // 1 minute intervals
    data.push({
      timestamp: timestamp.toISOString(),
      value: generateRandomValue(20, 95),
      label: timestamp.toLocaleTimeString()
    });
  }
  
  return data;
};

class DashboardAnalyticsService {
  async getSystemMetrics(): Promise<SystemMetrics> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      cpu_usage: generateRandomValue(15, 85),
      memory_usage: generateRandomValue(30, 75),
      disk_usage: generateRandomValue(25, 60),
      network_activity: generateRandomValue(10, 90),
      active_connections: generateRandomValue(50, 200)
    };
  }

  async getSchedulingMetrics(): Promise<SchedulingMetrics> {
    await new Promise(resolve => setTimeout(resolve, 120));
    
    return {
      total_schedules: generateRandomValue(450, 500),
      completed_schedules: generateRandomValue(420, 450),
      active_optimizations: generateRandomValue(2, 8),
      constraint_violations: generateRandomValue(0, 5),
      average_completion_time: generateRandomValue(2, 12)
    };
  }

  async getGameAnalytics(): Promise<GameAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 80));
    
    return {
      total_games: generateRandomValue(2800, 3200),
      games_this_week: generateRandomValue(45, 65),
      upcoming_games: generateRandomValue(120, 180),
      conflicts_resolved: generateRandomValue(15, 35),
      travel_efficiency: generateRandomValue(75, 95)
    };
  }

  async getAIInsights(): Promise<AIInsights> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return {
      optimization_score: generateRandomValue(85, 98),
      prediction_accuracy: generateRandomValue(88, 96),
      recommendations_generated: generateRandomValue(150, 250),
      time_saved_hours: generateRandomValue(450, 650)
    };
  }

  async getChartData(metric: string, timeframe: string = '24h'): Promise<ChartDataPoint[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const pointCount = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
    return generateChartData(pointCount);
  }

  // Additional utility methods
  async getRealtimeMetrics(): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      active_users: generateRandomValue(25, 75),
      schedules_processing: generateRandomValue(1, 5),
      system_health: generateRandomValue(90, 100)
    };
  }

  async getPerformanceMetrics(): Promise<any> {
    return {
      response_time: generateRandomValue(45, 120),
      throughput: generateRandomValue(850, 1200),
      error_rate: generateRandomValue(0, 2),
      uptime_percentage: generateRandomValue(99, 100)
    };
  }
}

// Export singleton instance
const dashboardAnalyticsService = new DashboardAnalyticsService();

export default dashboardAnalyticsService;
export { DashboardAnalyticsService };
export type {
  SystemMetrics,
  SchedulingMetrics, 
  GameAnalytics,
  AIInsights,
  ChartDataPoint
};