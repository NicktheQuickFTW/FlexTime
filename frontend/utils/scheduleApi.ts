// FlexTime Schedule API Utility
// Placeholder API for schedule builder functionality

export interface Team {
  id: string;
  name: string;
  sport: string;
  conference?: string;
}

export interface Game {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  venue?: string;
  time?: string;
}

export interface Constraint {
  id: string;
  type: string;
  description: string;
  weight: number;
  active: boolean;
}

export interface Schedule {
  id: string;
  name: string;
  sport: string;
  season: string;
  games: Game[];
  teams: Team[];
  constraints: Constraint[];
  generatedAt: string;
  optimizationScore?: number;
}

export interface ScheduleGenerationOptions {
  sport: string;
  season: string;
  teams: string[];
  constraints: Constraint[];
  preferences?: Record<string, any>;
}

// Mock API functions
export const scheduleApi = {
  async generateSchedule(options: ScheduleGenerationOptions): Promise<Schedule> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      id: `schedule-${Date.now()}`,
      name: `${options.sport} Schedule`,
      sport: options.sport,
      season: options.season,
      games: [],
      teams: [],
      constraints: options.constraints,
      generatedAt: new Date().toISOString(),
      optimizationScore: 0.85
    };
  },

  async saveSchedule(schedule: Schedule): Promise<void> {
    console.log('Schedule saved:', schedule.id);
  },

  async exportSchedule(scheduleId: string, format: string): Promise<Blob> {
    const data = JSON.stringify({ scheduleId, format }, null, 2);
    return new Blob([data], { type: 'application/json' });
  },

  async getConstraints(sport: string): Promise<Constraint[]> {
    // Return mock constraints for the sport
    return [
      {
        id: 'travel-distance',
        type: 'Travel Distance',
        description: 'Minimize total travel distance for teams',
        weight: 0.8,
        active: true
      },
      {
        id: 'rest-days',
        type: 'Rest Days',
        description: 'Ensure adequate rest between games',
        weight: 0.9,
        active: true
      },
      {
        id: 'venue-availability',
        type: 'Venue Availability',
        description: 'Respect venue booking constraints',
        weight: 1.0,
        active: true
      }
    ];
  },

  async getConstraintViolations(scheduleId: string): Promise<any[]> {
    // Return mock violations
    return [];
  }
};