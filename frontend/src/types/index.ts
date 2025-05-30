// Type definitions for the FlexTime Scheduling System UI

export enum SportType {
  FOOTBALL = 'Football',
  MENS_BASKETBALL = 'Men\'s Basketball',
  WOMENS_BASKETBALL = 'Women\'s Basketball',
  BASEBALL = 'Baseball',
  SOFTBALL = 'Softball',
  VOLLEYBALL = 'Volleyball',
  SOCCER = 'Soccer',
  MENS_TENNIS = 'Men\'s Tennis',
  WOMENS_TENNIS = 'Women\'s Tennis',
  GOLF = 'Golf',
  SWIMMING = 'Swimming',
  TRACK = 'Track',
  CROSS_COUNTRY = 'Cross Country',
  WRESTLING = 'Wrestling',
  GYMNASTICS = 'Gymnastics'
}

export enum ConstraintType {
  REST_DAYS = 'RestDays',
  MAX_CONSECUTIVE_AWAY = 'MaxConsecutiveAway',
  MAX_CONSECUTIVE_HOME = 'MaxConsecutiveHome',
  VENUE_UNAVAILABILITY = 'VenueUnavailability',
  TEAM_UNAVAILABILITY = 'TeamUnavailability',
  REQUIRED_MATCHUP = 'RequiredMatchup',
  AVOID_BACK_TO_BACK = 'AvoidBackToBack'
}

export enum ConstraintCategory {
  TEAM = 'Team',
  VENUE = 'Venue',
  SCHEDULE = 'Schedule'
}

export interface Location {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
  city: string;
  state: string;
  zipCode?: string;
}

export interface Venue {
  venue_id?: number;
  name: string;
  capacity: number;
  location: Location;
  unavailableDates?: string[];
}

export interface Institution {
  school_id?: number;
  name: string;
  abbreviation: string;
  mascot?: string;
  primary_color?: string;
  secondary_color?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface Team {
  team_id?: number;
  name: string;
  code?: string;
  institution: Institution;
  championship_id?: number;
  division?: string;
  seed?: number;
  status?: 'registered' | 'confirmed' | 'withdrawn' | 'disqualified';
  homeVenues?: Venue[];
}

export interface Game {
  game_id?: number;
  schedule_id?: number;
  home_team_id: number;
  away_team_id: number;
  venue_id?: number;
  date?: string;
  time?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  homeTeam?: Team;
  awayTeam?: Team;
  venue?: Venue;
}

export interface Constraint {
  constraint_id?: number;
  schedule_id?: number;
  type: ConstraintType;
  category: ConstraintCategory;
  priority: number;
  parameters: Record<string, any>;
  teams?: Team[];
}

export interface Schedule {
  schedule_id?: number;
  name: string;
  sport_id: number;
  championship_id?: number;
  season: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'archived';
  created_by?: number;
  updated_by?: number;
  metadata?: Record<string, any>;
  games?: Game[];
  teams?: Team[];
  constraints?: Constraint[];
}

export interface ScheduleOptimizationResult {
  schedule: Schedule;
  metrics: {
    totalTravelDistance: number;
    averageTravelDistance: number;
    maxTravelDistance: number;
    homeAwayBalance: number;
    constraintViolations: number;
  };
}

export interface Conflict {
  type: 'schedule' | 'venue' | 'team' | 'travel';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  constraint?: Constraint;
  gameId?: string;
  affectedGames?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
