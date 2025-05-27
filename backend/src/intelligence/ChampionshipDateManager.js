/**
 * ChampionshipDateManager.js
 * Handles championship date calculations and ensures scheduling constraints are met
 * Part of the FlexTime scheduling platform's ML workflow
 */
const { Pool } = require('pg');
const luxon = require('luxon');
const { DateTime, Interval, Duration } = luxon;

/**
 * ChampionshipDateManager
 * 
 * Manages championship date calculations and constraints for scheduling
 * Uses formulas and NCAA tournament dates to determine conference championship windows
 */
class ChampionshipDateManager {
  constructor(config) {
    this.dbPool = new Pool(config.database);
    this.formulaCache = new Map(); // Cache for championship formulas
    this.ncaaDatesCache = new Map(); // Cache for NCAA tournament dates
  }

  /**
   * Initialize the Championship Date Manager
   * @param {Object} config - Configuration including database connection
   */
  async initialize() {
    try {
      console.log('Initializing Championship Date Manager');
      // Test database connection
      await this.dbPool.query('SELECT NOW()');
      console.log('Database connection successful for Championship Date Manager');
      
      // Load championship formulas
      await this.loadChampionshipFormulas();
      
      // Load NCAA tournament dates
      await this.loadNcaaDates();
      
      return true;
    } catch (error) {
      console.error('Error initializing Championship Date Manager:', error);
      return false;
    }
  }

  /**
   * Load championship formulas for all sports into cache
   */
  async loadChampionshipFormulas() {
    try {
      const formulaQuery = `
        SELECT sport_id, formula_type, formula_value, notes 
        FROM championship_formulas
      `;
      const formulaResult = await this.dbPool.query(formulaQuery);
      
      // Clear current cache
      this.formulaCache.clear();
      
      // Store formulas in cache by sport ID
      for (const formula of formulaResult.rows) {
        const parsedValue = typeof formula.formula_value === 'string' 
          ? JSON.parse(formula.formula_value) 
          : formula.formula_value;
          
        this.formulaCache.set(formula.sport_id, {
          formulaType: formula.formula_type,
          formulaValue: parsedValue,
          notes: formula.notes
        });
      }
      
      console.log(`Loaded ${this.formulaCache.size} championship formulas into cache`);
      return true;
    } catch (error) {
      console.error('Error loading championship formulas:', error);
      return false;
    }
  }
  
  /**
   * Load NCAA tournament dates for a specific season into cache
   */
  /**
   * Load NCAA regular season dates for a specific season into cache
   */
  async loadNcaaRegularSeasonDates(season) {
    try {
      const regularSeasonQuery = `
        SELECT sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes 
        FROM ncaa_regular_season_dates 
        WHERE season = $1
      `;
      const regularSeasonResult = await this.dbPool.query(regularSeasonQuery, [season]);
      
      // Create a cache key for this season
      const cacheKey = `${season}_regular`;
      
      // Initialize season cache if not exists
      if (!this.ncaaDatesCache.has(cacheKey)) {
        this.ncaaDatesCache.set(cacheKey, new Map());
      }
      
      // Get the cache for this season's regular dates
      const seasonCache = this.ncaaDatesCache.get(cacheKey);
      
      // Store NCAA regular season dates in cache by sport ID
      for (const dateInfo of regularSeasonResult.rows) {
        seasonCache.set(dateInfo.sport_id, {
          firstPracticeDate: dateInfo.first_practice_date ? DateTime.fromJSDate(new Date(dateInfo.first_practice_date)) : null,
          firstContestDate: dateInfo.first_contest_date ? DateTime.fromJSDate(new Date(dateInfo.first_contest_date)) : null,
          regularSeasonEndDate: dateInfo.regular_season_end_date ? DateTime.fromJSDate(new Date(dateInfo.regular_season_end_date)) : null,
          notes: dateInfo.notes
        });
      }
      
      console.log(`Loaded NCAA regular season dates for ${seasonCache.size} sports in ${season} season`);
      return true;
    } catch (error) {
      console.error(`Error loading NCAA regular season dates for ${season}:`, error);
      return false;
    }
  }
  
  /**
   * Load NCAA tournament dates for a specific season into cache
   */
  async loadNcaaDates(season) {
    try {
      const ncaaQuery = `
        SELECT sport_id, season, start_date, end_date, event_type, notes 
        FROM ncaa_tournament_dates 
        WHERE season = $1
      `;
      const ncaaResult = await this.dbPool.query(ncaaQuery, [season]);
      
      // Create a cache key for this season
      const cacheKey = season;
      
      // Initialize season cache if not exists
      if (!this.ncaaDatesCache.has(cacheKey)) {
        this.ncaaDatesCache.set(cacheKey, new Map());
      }
      
      // Get the cache for this season
      const seasonCache = this.ncaaDatesCache.get(cacheKey);
      
      // Store NCAA dates in cache by sport ID
      for (const ncaaDate of ncaaResult.rows) {
        seasonCache.set(ncaaDate.sport_id, {
          startDate: DateTime.fromJSDate(new Date(ncaaDate.start_date)),
          endDate: DateTime.fromJSDate(new Date(ncaaDate.end_date)),
          eventType: ncaaDate.event_type,
          notes: ncaaDate.notes
        });
      }
      
      console.log(`Loaded NCAA dates for ${seasonCache.size} sports in ${season} season`);
      return true;
    } catch (error) {
      console.error(`Error loading NCAA dates for ${season}:`, error);
      return false;
    }
  }

  /**
   * Calculate championship dates for a specific sport and season
   * @param {number} sportId - Sport ID
   * @param {string} season - Season (e.g., "2025-2026")
   * @returns {Object} Championship date information
   */
  async calculateChampionshipDates(sportId, season) {
    try {
      // Ensure formulas are loaded
      if (this.formulaCache.size === 0) {
        await this.loadChampionshipFormulas();
      }
      
      // Ensure NCAA dates are loaded for this season
      if (!this.ncaaDatesCache.has(season)) {
        await this.loadNcaaDates(season);
      }
      
      // Get the formula for this sport
      const formula = this.formulaCache.get(parseInt(sportId));
      if (!formula) {
        console.log(`No championship formula found for sport ID ${sportId}`);
        return null;
      }
      
      let championshipDate = null;

      // Calculate championship date based on formula type
      if (formula.formulaType === 'fixed_date') {
        // Formula with specific date
        if (formula.formulaValue.fixed_date) {
          championshipDate = DateTime.fromISO(formula.formulaValue.fixed_date);
        }
      } else if (formula.formulaType === 'relative_to_ncaa') {
        // Formula relative to NCAA tournament dates
        const seasonCache = this.ncaaDatesCache.get(season);
        if (!seasonCache || !seasonCache.has(parseInt(sportId))) {
          console.log(`No NCAA dates found for sport ID ${sportId}, season ${season}`);
          return null;
        }
        
        // Get NCAA date information
        const ncaaInfo = seasonCache.get(parseInt(sportId));
        const ncaaStartDate = ncaaInfo.startDate;
        
        // Calculate championship date based on weeks before NCAA
        if (formula.formulaValue.weeks_before && formula.formulaValue.day_of_week) {
          const targetDayOfWeek = {
            'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
            'Friday': 5, 'Saturday': 6, 'Sunday': 7
          }[formula.formulaValue.day_of_week];

          // Start with NCAA date and go back by specified weeks
          let proposedDate = ncaaStartDate.minus({ weeks: formula.formulaValue.weeks_before });
          
          // Find the target day of the week
          const daysToAdjust = (proposedDate.weekday <= targetDayOfWeek) 
            ? targetDayOfWeek - proposedDate.weekday
            : 7 - (proposedDate.weekday - targetDayOfWeek);
          
          championshipDate = proposedDate.plus({ days: daysToAdjust });
        }
      }

      if (!championshipDate) {
        console.log(`Unable to calculate championship date for sport ID ${sportId}`);
        return null;
      }

      return {
        sportId,
        season,
        championshipDate: championshipDate.toISODate(),
        championshipDateTime: championshipDate.toISO(),
        calculationMethod: formula.formulaType,
        formulaDetails: formula.formulaValue
      };
    } catch (error) {
      console.error('Error calculating championship dates:', error);
      throw error;
    }
  }

  /**
   * Calculate regular season window based on championship date and NCAA tournament
   */
  /**
   * Get NCAA regular season dates for a specific sport and season
   */
  async getNcaaRegularSeasonDates(sportId, season) {
    try {
      // Ensure NCAA regular season dates are loaded for this season
      const regularSeasonCacheKey = `${season}_regular`;
      if (!this.ncaaDatesCache.has(regularSeasonCacheKey)) {
        await this.loadNcaaRegularSeasonDates(season);
      }
      
      // Get the cache for this season's regular dates
      const seasonCache = this.ncaaDatesCache.get(regularSeasonCacheKey);
      
      // Return the NCAA regular season dates for this sport
      if (seasonCache && seasonCache.has(parseInt(sportId))) {
        return seasonCache.get(parseInt(sportId));
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting NCAA regular season dates for sport ${sportId}, season ${season}:`, error);
      return null;
    }
  }
  
  /**
   * Calculate regular season window based on championship date and NCAA tournament
   * Uses NCAA official dates when available, falls back to reasonable defaults when not
   */
  async calculateRegularSeasonWindow(sportId, season, championshipDate) {
    try {
      // Convert championship date string to DateTime if needed
      const champDate = typeof championshipDate === 'string' 
        ? DateTime.fromISO(championshipDate)
        : championshipDate;
      
      // First, try to get official NCAA dates
      const ncaaRegularSeasonDates = await this.getNcaaRegularSeasonDates(sportId, season);
      
      // Get sport specific information to determine season window
      const sportsQuery = `
        SELECT 
          name, 
          typical_season_length_weeks,
          typical_season_start_month
        FROM sports 
        WHERE sport_id = $1
      `;
      const sportResult = await this.dbPool.query(sportsQuery, [sportId]);
      
      if (sportResult.rows.length === 0) {
        throw new Error(`Sport with ID ${sportId} not found`);
      }
      
      const sportInfo = sportResult.rows[0];
      const sportName = sportInfo.name;
      
      // Default values if sport-specific ones are not available
      const defaultSeasonLength = sportInfo.typical_season_length_weeks || 12; // 12 weeks
      const defaultStartMonth = sportInfo.typical_season_start_month || 9; // September
      
      // Get season year from season string (e.g., "2025-26" -> 2025)
      const seasonStartYear = parseInt(season.split('-')[0]);
      
      let seasonStart, seasonEnd;
      
      // If we have official NCAA dates, use them
      if (ncaaRegularSeasonDates) {
        // Use first contest date for season start if available
        if (ncaaRegularSeasonDates.firstContestDate) {
          seasonStart = ncaaRegularSeasonDates.firstContestDate;
        }
        
        // Use regular season end date or 1 week before championship, whichever is earlier
        if (ncaaRegularSeasonDates.regularSeasonEndDate) {
          const oneWeekBeforeChamp = champDate.minus({ days: 7 });
          if (oneWeekBeforeChamp < ncaaRegularSeasonDates.regularSeasonEndDate) {
            seasonEnd = oneWeekBeforeChamp;
          } else {
            seasonEnd = ncaaRegularSeasonDates.regularSeasonEndDate;
          }
        } else {
          seasonEnd = champDate.minus({ days: 7 });
        }
        
        // If we have both start and end dates from NCAA, we're done
        if (seasonStart && seasonEnd) {
          return {
            startDate: seasonStart.toISODate(),
            endDate: seasonEnd.toISODate(),
            lengthInDays: seasonEnd.diff(seasonStart, 'days').days,
            sportName,
            source: 'NCAA official dates'
          };
        }
      }
      
      // Sport-specific seasonality
      switch (sportId.toString()) {
        case '8': // Football
          // Football typically starts in late August/early September
          seasonStart = DateTime.local(seasonStartYear, 8, 25);
          // End a week before championship
          seasonEnd = champDate.minus({ days: 7 });
          break;
          
        case '1': // Men's Basketball
        case '2': // Women's Basketball
          // Basketball typically starts in early November
          seasonStart = DateTime.local(seasonStartYear, 11, 5);
          // End a week before championship
          seasonEnd = champDate.minus({ days: 7 });
          break;
          
        case '19': // Softball
        case '20': // Baseball
          // Spring sports typically start in February
          seasonStart = DateTime.local(seasonStartYear + 1, 2, 15);
          // End a week before championship
          seasonEnd = champDate.minus({ days: 7 });
          break;
          
        case '17': // Men's Soccer
        case '18': // Women's Soccer
          // Soccer typically starts in late August
          seasonStart = DateTime.local(seasonStartYear, 8, 20);
          // End a week before championship
          seasonEnd = champDate.minus({ days: 7 });
          break;
          
        case '28': // Women's Volleyball
          // Volleyball typically starts in late August
          seasonStart = DateTime.local(seasonStartYear, 8, 25);
          // End a week before championship
          seasonEnd = champDate.minus({ days: 7 });
          break;
          
        default:
          // For other sports, calculate based on championship date and season length
          // Start N weeks before championship date
          seasonStart = champDate.minus({ weeks: defaultSeasonLength });
          // End a week before championship
          seasonEnd = champDate.minus({ days: 7 });
      }
      
      return {
        startDate: seasonStart.toISODate(),
        endDate: seasonEnd.toISODate(),
        lengthInDays: seasonEnd.diff(seasonStart, 'days').days,
        sportName
      };
    } catch (error) {
      console.error('Error calculating regular season window:', error);
      throw error;
    }
  }

  /**
   * Get complete championship constraints including blackout dates and scheduling windows
   */
  async getChampionshipConstraints(sportId, season) {
    try {
      const championshipInfo = await this.calculateChampionshipDates(sportId, season);
      
      if (!championshipInfo) {
        return null;
      }
      
      // Calculate regular season window
      const regularSeasonWindow = await this.calculateRegularSeasonWindow(
        sportId, 
        season, 
        championshipInfo.championshipDate
      );
      
      // Get NCAA tournament date info for blackout calculations
      if (!this.ncaaDatesCache.has(season)) {
        await this.loadNcaaDates(season);
      }
      
      const seasonCache = this.ncaaDatesCache.get(season);
      const ncaaDateInfo = seasonCache?.get(parseInt(sportId));
      
      // Create blackout dates array
      const blackoutDates = [championshipInfo.championshipDate];
      
      // Add NCAA tournament dates to blackout period if available
      if (ncaaDateInfo) {
        // Calculate all dates in the NCAA tournament period
        const ncaaStartDate = ncaaDateInfo.startDate;
        const ncaaEndDate = ncaaDateInfo.endDate;
        
        // Create an interval for the NCAA tournament
        const ncaaInterval = Interval.fromDateTimes(ncaaStartDate, ncaaEndDate.plus({ days: 1 }));
        
        // Walk through each day in the interval
        let currentDate = ncaaStartDate;
        while (currentDate < ncaaEndDate.plus({ days: 1 })) {
          blackoutDates.push(currentDate.toISODate());
          currentDate = currentDate.plus({ days: 1 });
        }
      }
      
      // Get NCAA regular season dates
      const ncaaRegularSeasonDates = await this.getNcaaRegularSeasonDates(sportId, season);
      
      // Create constraints object
      const constraints = {
        sportId,
        season,
        championshipDate: championshipInfo.championshipDate,
        calculationMethod: championshipInfo.calculationMethod,
        blackoutDates, // Games cannot be scheduled on championship day or during NCAA tournament
        schedulingWindows: {
          regularSeason: regularSeasonWindow
        }
      };
      
      // Add NCAA dates if available
      if (ncaaRegularSeasonDates) {
        constraints.ncaaDates = {
          firstPractice: ncaaRegularSeasonDates.firstPracticeDate ? ncaaRegularSeasonDates.firstPracticeDate.toISODate() : null,
          firstContest: ncaaRegularSeasonDates.firstContestDate ? ncaaRegularSeasonDates.firstContestDate.toISODate() : null,
          regularSeasonEnd: ncaaRegularSeasonDates.regularSeasonEndDate ? ncaaRegularSeasonDates.regularSeasonEndDate.toISODate() : null
        };
      }
      
      return constraints;
    } catch (error) {
      console.error('Error getting championship constraints:', error);
      return { hasChampionship: false };
    }
  }
}

module.exports = ChampionshipDateManager;
