/**
 * Types for the Unified Scheduling Rules Architecture
 * 
 * FlexTime uses a 4-tier system:
 * 1. Parameters - Business rules (games per team, season structure)
 * 2. Constraints - Physical/logical restrictions (rest days, travel limits)
 * 3. Conflicts - Blackout dates (campus conflicts, graduations)
 * 4. Preferences - Team desires (preferred game times, home during exams)
 */

export type RuleType = 'parameters' | 'constraints' | 'conflicts' | 'preferences';

export interface SchedulingRule {
  id: string;
  type: RuleType;
  name: string;
  
  // Entity targeting
  sport_id?: number;
  school_id?: number;
  team_id?: number;
  venue_id?: number;
  
  // Rule definition (JSON schema)
  definition: Record<string, any>;
  
  // Priority/Weight (1-10, where 8-10 are critical)
  weight: number;
  
  // Status
  is_active: boolean;
  
  // Metadata
  description?: string;
  category?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Legacy constraint interface for backward compatibility
export interface Constraint {
  id: number;
  type: string;
  name: string;
  description?: string;
  priority: number;
  category: string;
  parameters: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Specific rule categories by type
export interface ParameterRule extends SchedulingRule {
  type: 'parameters';
  definition: {
    // Season Structure
    games_per_team?: number;
    conference_games?: number;
    non_conference_games?: number;
    
    // Home/Away Distribution
    home_games?: number;
    away_games?: number;
    home_game_distribution?: 'even' | 'front_loaded' | 'back_loaded';
    
    // Travel Configuration
    travel_partners?: string[];
    travel_pods?: string[];
    geographic_regions?: string[];
    
    // Format Rules
    series_format?: '1_game' | '2_game' | '3_game';
    weekend_structure?: 'friday_sunday' | 'saturday_monday' | 'flexible';
    bye_weeks?: number;
  };
}

export interface ConstraintRule extends SchedulingRule {
  type: 'constraints';
  definition: {
    // Rest Requirements
    minimum_rest_days?: number;
    maximum_games_per_week?: number;
    
    // Travel Limits
    maximum_travel_distance?: number;
    consecutive_away_limit?: number;
    
    // Venue Restrictions
    venue_availability?: {
      start_date: string;
      end_date: string;
      available: boolean;
    }[];
    capacity_requirements?: number;
    
    // Format Constraints
    back_to_back_prevention?: boolean;
    doubleheader_limits?: number;
  };
}

export interface ConflictRule extends SchedulingRule {
  type: 'conflicts';
  definition: {
    // Date ranges when entity cannot participate
    blackout_periods: {
      start_date: string;
      end_date: string;
      reason: string;
      source: 'campus_calendar' | 'religious_observance' | 'facility_conflict' | 'academic_restriction';
    }[];
    
    // Specific conflict types
    finals_week?: boolean;
    graduation_dates?: string[];
    spring_break?: { start_date: string; end_date: string };
    byu_sunday_restriction?: boolean;
    religious_holidays?: string[];
    venue_maintenance?: { start_date: string; end_date: string; reason: string }[];
    other_events?: { date: string; event: string }[];
    renovations?: { start_date: string; end_date: string; description: string }[];
    exam_periods?: { start_date: string; end_date: string; type: 'midterms' | 'finals' }[];
    class_schedules?: { day: string; start_time: string; end_time: string }[];
  };
}

export interface PreferenceRule extends SchedulingRule {
  type: 'preferences';
  definition: {
    // Scheduling Preferences
    preferred_game_times?: string[];
    preferred_days?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    
    // Home Game Timing
    home_during_exams?: boolean;
    rivalry_game_timing?: 'early_season' | 'mid_season' | 'late_season';
    
    // Travel Preferences
    minimize_long_trips?: boolean;
    avoid_red_eye_flights?: boolean;
    
    // Competition Timing
    peak_performance_periods?: { start_date: string; end_date: string }[];
    avoid_academic_stress?: boolean;
  };
}

// API response types
export interface SchedulingRulesResponse {
  parameters: ParameterRule[];
  constraints: ConstraintRule[];
  conflicts: ConflictRule[];
  preferences: PreferenceRule[];
}

// Rule validation types
export interface RuleValidationResult {
  isValid: boolean;
  violations: {
    type: 'error' | 'warning';
    message: string;
    field?: string;
  }[];
  score?: number;
}

// Conflict resolution types
export interface RuleConflict {
  id: string;
  type: 'hard' | 'soft';
  severity: 'high' | 'medium' | 'low';
  conflicting_rules: SchedulingRule[];
  description: string;
  resolution_options: {
    id: string;
    description: string;
    confidence: number;
    impact: string;
  }[];
}

export default SchedulingRule;