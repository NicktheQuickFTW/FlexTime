/**
 * Unified Parameter Service
 * Single source of truth for all scheduling parameters, constraints, conflicts, and preferences
 */

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

class UnifiedParameterService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
    
    // Cache for performance
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  /**
   * Load all scheduling data for a sport and season
   */
  async loadSchedulingData(sportId, seasonYear = new Date().getFullYear()) {
    const cacheKey = `${sportId}-${seasonYear}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - this.cacheTimeout) {
      console.log(chalk.gray(`Cache hit for ${cacheKey}`));
      return cached.data;
    }
    
    console.log(chalk.blue(`Loading scheduling data for sport ${sportId}, season ${seasonYear}`));
    
    try {
      // Load all data in parallel
      const [parameters, constraints, conflicts, preferences] = await Promise.all([
        this.loadParameters(sportId, seasonYear),
        this.loadConstraints(sportId),
        this.loadConflicts(sportId, seasonYear),
        this.loadPreferences(sportId, seasonYear)
      ]);
      
      const data = {
        sportId,
        seasonYear,
        parameters,
        constraints: {
          hard: constraints.filter(c => c.is_hard),
          soft: constraints.filter(c => !c.is_hard)
        },
        conflicts,
        preferences
      };
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      console.log(chalk.green(`Loaded: ${parameters.length} parameters, ${constraints.length} constraints, ${conflicts.length} conflicts, ${preferences.length} preferences`));
      
      return data;
      
    } catch (error) {
      console.error(chalk.red('Failed to load scheduling data:'), error);
      throw error;
    }
  }
  
  /**
   * Load scheduling parameters (business rules)
   */
  async loadParameters(sportId, seasonYear) {
    const { data, error } = await this.supabase
      .from('scheduling_parameters')
      .select('*')
      .eq('season_year', seasonYear)
      .or(`sport_id.eq.${sportId},sport_id.is.null`)
      .order('team_id', { ascending: false, nullsLast: true })
      .order('school_id', { ascending: false, nullsLast: true })
      .order('sport_id', { ascending: false, nullsLast: true });
    
    if (error) throw error;
    
    // Convert to key-value map for easier access
    const parameters = {};
    for (const param of data) {
      parameters[param.parameter_key] = param.parameter_value;
    }
    
    return parameters;
  }
  
  /**
   * Load constraints (scheduling restrictions)
   */
  async loadConstraints(sportId) {
    const { data, error } = await this.supabase
      .from('constraints_new')
      .select('*')
      .eq('is_active', true)
      .or(`sport_id.eq.${sportId},sport_id.is.null`)
      .order('weight', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Load conflicts for a date range
   */
  async loadConflicts(sportId, seasonYear) {
    // Determine season date range based on sport
    const { startDate, endDate } = this.getSeasonDateRange(sportId, seasonYear);
    
    const { data, error } = await this.supabase
      .from('conflicts')
      .select('*')
      .or(`sport_id.eq.${sportId},sport_id.is.null`)
      .gte('end_date', startDate)
      .lte('start_date', endDate);
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Load team preferences
   */
  async loadPreferences(sportId, seasonYear) {
    const { data, error } = await this.supabase
      .from('team_preferences')
      .select('*')
      .eq('season_year', seasonYear)
      .or(`sport_id.eq.${sportId},sport_id.is.null`)
      .order('weight', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Check if a team can play on a specific date
   */
  async canTeamPlayOnDate(teamId, date) {
    const schoolId = Math.floor(teamId / 100);
    const sportId = teamId % 100;
    
    // Check for conflicts
    const { data: conflicts, error } = await this.supabase
      .from('conflicts')
      .select('*')
      .or(`team_id.eq.${teamId},school_id.eq.${schoolId}.team_id.is.null`)
      .lte('start_date', date)
      .gte('end_date', date);
    
    if (error) throw error;
    
    // Special handling for BYU Sundays
    if (schoolId === 4) { // BYU
      const dayOfWeek = new Date(date).getDay();
      if (dayOfWeek === 0) { // Sunday
        return {
          canPlay: false,
          reason: 'BYU does not compete on Sundays',
          conflict: { type: 'religious_observance', is_absolute: true }
        };
      }
    }
    
    if (conflicts && conflicts.length > 0) {
      const conflict = conflicts[0];
      return {
        canPlay: false,
        reason: conflict.reason,
        conflict: conflict
      };
    }
    
    return {
      canPlay: true,
      reason: null,
      conflict: null
    };
  }
  
  /**
   * Evaluate constraints for a schedule
   */
  async evaluateSchedule(schedule, sportId) {
    const data = await this.loadSchedulingData(sportId, schedule.seasonYear);
    const results = {
      satisfied: [],
      violated: [],
      totalScore: 0,
      hardConstraintsSatisfied: true
    };
    
    // Evaluate each constraint
    for (const constraint of [...data.constraints.hard, ...data.constraints.soft]) {
      const result = await this.evaluateConstraint(constraint, schedule);
      
      if (result.satisfied) {
        results.satisfied.push(result);
      } else {
        results.violated.push(result);
        if (constraint.is_hard) {
          results.hardConstraintsSatisfied = false;
        }
      }
      
      results.totalScore += result.score * (constraint.weight / 100);
    }
    
    return results;
  }
  
  /**
   * Evaluate a single constraint
   */
  async evaluateConstraint(constraint, schedule) {
    // This would be expanded with actual constraint evaluation logic
    // For now, return a mock result
    return {
      constraintId: constraint.id,
      constraintName: constraint.name,
      satisfied: true,
      score: 1.0,
      violations: []
    };
  }
  
  /**
   * Get season date range for a sport
   */
  getSeasonDateRange(sportId, year) {
    // Sport-specific season ranges
    const seasonRanges = {
      1: { start: `${year}-02-01`, end: `${year}-06-30` },     // Baseball
      2: { start: `${year-1}-11-01`, end: `${year}-03-31` },   // Men's Basketball
      3: { start: `${year-1}-11-01`, end: `${year}-03-31` },   // Women's Basketball
      8: { start: `${year}-08-15`, end: `${year}-12-31` },     // Football
      14: { start: `${year}-08-01`, end: `${year}-11-30` },    // Soccer
      15: { start: `${year}-02-01`, end: `${year}-05-31` },    // Softball
      18: { start: `${year}-01-15`, end: `${year}-05-31` },    // Men's Tennis
      19: { start: `${year}-01-15`, end: `${year}-05-31` },    // Women's Tennis
      24: { start: `${year}-08-15`, end: `${year}-11-30` },    // Volleyball
      25: { start: `${year-1}-11-01`, end: `${year}-03-31` }   // Wrestling
    };
    
    const range = seasonRanges[sportId] || { 
      start: `${year}-01-01`, 
      end: `${year}-12-31` 
    };
    
    return {
      startDate: range.start,
      endDate: range.end
    };
  }
  
  /**
   * Get team display name
   */
  async getTeamDisplayName(teamId) {
    const { data, error } = await this.supabase
      .rpc('get_team_display_name', { p_team_id: teamId });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log(chalk.yellow('Cache cleared'));
  }
}

export default UnifiedParameterService;