// Schedule-related type definitions

export interface Team {
  id: string;
  name: string;
  conference: string;
  division?: string;
  homeVenue: string;
  alternateVenues?: string[];
  travelRestrictions?: TravelRestriction[];
}

export interface Venue {
  id: string;
  name: string;
  location: Location;
  capacity: number;
  sports: string[];
  availability?: VenueAvailability[];
  sharedBy?: string[]; // Team IDs that share this venue
}

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  timezone: string;
}

export interface TravelRestriction {
  type: 'max_distance' | 'no_fly_zone' | 'preferred_travel_day';
  value: any;
  description?: string;
}

export interface VenueAvailability {
  startDate: Date;
  endDate: Date;
  available: boolean;
  reason?: string;
}

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  venueId: string;
  date: Date;
  time: string;
  sport: string;
  type: 'conference' | 'non-conference' | 'championship' | 'tournament';
  week?: number;
  metadata?: GameMetadata;
}

export interface GameMetadata {
  tvNetwork?: string;
  rivalryGame?: boolean;
  requiredDate?: boolean;
  flexibleTime?: boolean;
  weatherSensitive?: boolean;
  specialEvent?: string;
}

export interface Schedule {
  id: string;
  sport: string;
  season: string;
  year: number;
  games: Game[];
  teams: Team[];
  venues: Venue[];
  constraints: string[]; // Constraint IDs applied to this schedule
  metadata?: ScheduleMetadata;
}

export interface ScheduleMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  author: string;
  notes?: string;
}

export interface ScheduleModification {
  id: string;
  type: 'add' | 'remove' | 'update' | 'swap';
  targetGame?: Game;
  newGame?: Game;
  swapWith?: Game;
  reason: string;
  timestamp: Date;
}

export interface ScheduleValidation {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: string;
  message: string;
  affectedGames: string[];
  constraint?: string;
}

export interface ValidationWarning {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}