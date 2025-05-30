// Baseball Weather Constraints - Big 12 Conference
// Manages weather-related scheduling considerations

import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  ConstraintResult,
  ConstraintStatus,
  Schedule,
  Game,
  ConstraintParameters,
  ConstraintViolation,
  ConstraintSuggestion
} from '../../types';

export const weatherConstraints: UnifiedConstraint[] = [
  {
    id: 'baseball-weather-windows',
    name: 'Weather-Based Scheduling Windows',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 90,
    scope: {
      sports: ['Baseball'],
      conferences: ['Big 12']
    },
    parameters: {
      seasonStart: '2026-02-13', // Mid-February start
      conferenceStart: '2026-03-20', // Late March conference play
      seasonEnd: '2026-05-24',
      coldWeatherTeams: ['Kansas', 'Kansas State', 'Iowa State', 'Cincinnati', 'West Virginia', 'Colorado'],
      warmWeatherTeams: ['Arizona', 'Arizona State', 'Texas Tech', 'TCU', 'Baylor', 'Houston'],
      earlySeasonTempThreshold: 45, // Degrees F
      rainoutBuffer: 2, // Extra days for potential rainouts
      domeVenues: ['Houston'] // Teams with covered facilities
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      
      const baseballGames = schedule.games.filter(g => g.sport === 'Baseball');
      
      // Check early season games in cold weather locations
      const earlySeasonEnd = new Date(params.conferenceStart);
      const earlyGames = baseballGames.filter(g => g.date < earlySeasonEnd);
      
      earlyGames.forEach(game => {
        if (params.coldWeatherTeams.includes(game.homeTeamId) && 
            !params.domeVenues.includes(game.homeTeamId)) {
          const monthDay = `${game.date.getMonth() + 1}-${game.date.getDate()}`;
          
          // February games in cold locations are violations
          if (game.date.getMonth() === 1) { // February
            violations.push({
              type: 'cold_weather_early_game',
              severity: 'critical',
              affectedEntities: [game.id],
              description: `Game at ${game.homeTeamId} on ${monthDay} likely too cold`,
              possibleResolutions: ['Move to warm weather site or later date']
            });
          } else if (game.date.getMonth() === 2 && game.date.getDate() < 15) { // Early March
            violations.push({
              type: 'risky_cold_weather_game',
              severity: 'major',
              affectedEntities: [game.id],
              description: `Game at ${game.homeTeamId} on ${monthDay} has weather risk`,
              possibleResolutions: ['Consider alternate venue or date']
            });
          }
        }
      });
      
      // Check for proper early season scheduling
      const februaryGames = baseballGames.filter(g => g.date.getMonth() === 1);
      const warmVenueFebruaryGames = februaryGames.filter(g => 
        params.warmWeatherTeams.includes(g.homeTeamId) || 
        params.domeVenues.includes(g.homeTeamId)
      );
      
      const warmVenueRatio = februaryGames.length > 0 
        ? warmVenueFebruaryGames.length / februaryGames.length 
        : 1;
      
      if (warmVenueRatio < 0.8) {
        suggestions.push({
          type: 'insufficient_warm_venue_usage',
          priority: 'high',
          description: `Only ${(warmVenueRatio * 100).toFixed(0)}% of February games at warm venues`,
          implementation: 'Schedule more early games in warm weather locations',
          expectedImprovement: 15
        });
      }
      
      // Check season boundaries
      const tooEarlyGames = baseballGames.filter(g => 
        g.date < new Date(params.seasonStart)
      );
      
      const tooLateGames = baseballGames.filter(g => 
        g.date > new Date(params.seasonEnd) && g.type === 'conference'
      );
      
      if (tooEarlyGames.length > 0) {
        violations.push({
          type: 'season_start_violation',
          severity: 'critical',
          affectedEntities: tooEarlyGames.map(g => g.id),
          description: `${tooEarlyGames.length} games before season start`,
          possibleResolutions: ['Move games after February 13']
        });
      }
      
      if (tooLateGames.length > 0) {
        violations.push({
          type: 'season_end_violation',
          severity: 'major',
          affectedEntities: tooLateGames.map(g => g.id),
          description: `${tooLateGames.length} conference games after season end`,
          possibleResolutions: ['Complete conference play by May 24']
        });
      }
      
      return {
        constraintId: 'baseball-weather-windows',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Weather scheduling requirements satisfied'
          : `Found ${violations.length} weather-related violations`,
        violations,
        suggestions,
        details: {
          earlySeasonGames: earlyGames.length,
          warmVenueFebruaryRatio: (warmVenueRatio * 100).toFixed(1) + '%'
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures games are scheduled considering weather conditions',
      tags: ['baseball', 'weather', 'temporal', 'safety']
    },
    cacheable: false,
    priority: 90
  },

  {
    id: 'baseball-weather-flexibility',
    name: 'Weather Contingency Planning',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['Baseball'],
      conferences: ['Big 12']
    },
    parameters: {
      makeupWindowDays: 3, // Days available for makeup games
      doubleheaderSpacing: 7, // Min days between doubleheaders
      maxDoubleheadersPerTeam: 3,
      preferredMakeupDays: ['Monday', 'Thursday'],
      rainoutHighRiskMonths: [3, 4], // March, April
      snowRiskTeams: ['Kansas', 'Kansas State', 'Iowa State', 'Colorado']
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const baseballGames = schedule.games.filter(g => g.sport === 'Baseball');
      
      // Group games by team and date
      const teamSchedules = new Map<string, Game[]>();
      baseballGames.forEach(game => {
        [game.homeTeamId, game.awayTeamId].forEach(team => {
          if (!teamSchedules.has(team)) {
            teamSchedules.set(team, []);
          }
          teamSchedules.get(team)!.push(game);
        });
      });
      
      // Check makeup window availability
      teamSchedules.forEach((games, team) => {
        const sortedGames = games.sort((a, b) => a.date.getTime() - b.date.getTime());
        let insufficientBuffers = 0;
        
        // Look for back-to-back series without buffer days
        for (let i = 0; i < sortedGames.length - 1; i++) {
          const game1 = sortedGames[i];
          const game2 = sortedGames[i + 1];
          
          // If different series (different opponents or week)
          if (game1.homeTeamId !== game2.homeTeamId || 
              game1.awayTeamId !== game2.awayTeamId ||
              Math.abs(game1.date.getTime() - game2.date.getTime()) > 7 * 24 * 60 * 60 * 1000) {
            
            const daysBetween = Math.floor(
              (game2.date.getTime() - game1.date.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysBetween < params.makeupWindowDays) {
              insufficientBuffers++;
            }
          }
        }
        
        if (insufficientBuffers > 3) {
          score *= 0.95;
          suggestions.push({
            type: 'insufficient_makeup_windows',
            priority: 'medium',
            description: `${team} has limited makeup game opportunities`,
            implementation: 'Build in buffer days between series',
            expectedImprovement: 5
          });
        }
      });
      
      // Check high-risk period scheduling
      const highRiskGames = baseballGames.filter(game => {
        const isHighRiskMonth = params.rainoutHighRiskMonths.includes(game.date.getMonth() + 1);
        const isSnowRiskTeam = params.snowRiskTeams.includes(game.homeTeamId);
        return isHighRiskMonth && isSnowRiskTeam;
      });
      
      const highRiskRatio = highRiskGames.length / baseballGames.length;
      if (highRiskRatio > 0.2) {
        score *= 0.9;
        suggestions.push({
          type: 'excessive_weather_risk_games',
          priority: 'high',
          description: `${(highRiskRatio * 100).toFixed(0)}% of games have high weather risk`,
          implementation: 'Reduce games in cold locations during March/April',
          expectedImprovement: 10
        });
      }
      
      // Check doubleheader capacity
      const saturdayGames = baseballGames.filter(g => g.date.getDay() === 6);
      const potentialDoubleheaderDates = saturdayGames.length;
      
      if (potentialDoubleheaderDates < params.maxDoubleheadersPerTeam * 14) {
        score *= 0.95;
        suggestions.push({
          type: 'limited_doubleheader_capacity',
          priority: 'medium',
          description: 'Insufficient Saturday dates for potential doubleheaders',
          implementation: 'Ensure adequate Saturday availability',
          expectedImprovement: 5
        });
      }
      
      // Check makeup day availability
      const makeupDayGames = baseballGames.filter(g => 
        params.preferredMakeupDays.includes(getDayName(g.date.getDay()))
      );
      
      if (makeupDayGames.length > baseballGames.length * 0.3) {
        score *= 0.95;
        suggestions.push({
          type: 'overused_makeup_days',
          priority: 'low',
          description: 'Too many games on traditional makeup days',
          implementation: 'Reserve Mondays/Thursdays for makeups',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'baseball-weather-flexibility',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Weather flexibility score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          highRiskGames: highRiskGames.length,
          potentialDoubleheaderDates,
          makeupDayAvailability: makeupDayGames.length
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Ensures schedule has flexibility for weather-related changes',
      tags: ['baseball', 'weather', 'flexibility', 'contingency']
    },
    cacheable: true,
    priority: 80
  },

  {
    id: 'baseball-climate-optimization',
    name: 'Climate-Based Schedule Optimization',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 70,
    scope: {
      sports: ['Baseball'],
      conferences: ['Big 12']
    },
    parameters: {
      climateZones: {
        desert: ['Arizona', 'Arizona State'],
        southern: ['Texas Tech', 'TCU', 'Baylor', 'Houston'],
        midwest: ['Kansas', 'Kansas State', 'Oklahoma State', 'Iowa State'],
        mountain: ['Colorado', 'Utah', 'BYU'],
        eastern: ['Cincinnati', 'West Virginia'],
        coastal: ['UCF']
      },
      optimalTempRange: { min: 60, max: 85 },
      extremeHeatThreshold: 95,
      windFactorTeams: ['Kansas', 'Kansas State', 'Texas Tech', 'Oklahoma State']
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      const baseballGames = schedule.games.filter(g => g.sport === 'Baseball');
      
      // Analyze climate patterns
      const aprilMayGames = baseballGames.filter(g => 
        g.date.getMonth() === 3 || g.date.getMonth() === 4 // April or May
      );
      
      // Check desert team scheduling
      const desertHomeGames = aprilMayGames.filter(g => 
        params.climateZones.desert.includes(g.homeTeamId)
      );
      
      const afternoonDesertGames = desertHomeGames.filter(g => {
        const hour = parseInt(g.time.split(':')[0]);
        return hour >= 12 && hour < 18;
      });
      
      if (afternoonDesertGames.length > desertHomeGames.length * 0.3) {
        score *= 0.9;
        suggestions.push({
          type: 'excessive_heat_risk',
          priority: 'high',
          description: 'Too many afternoon games in desert locations during April/May',
          implementation: 'Schedule more evening games in hot climates',
          expectedImprovement: 10
        });
      }
      
      // Check wind-prone locations
      const windGames = baseballGames.filter(g => 
        params.windFactorTeams.includes(g.homeTeamId) &&
        (g.date.getMonth() === 2 || g.date.getMonth() === 3) // March or April
      );
      
      const afternoonWindGames = windGames.filter(g => {
        const hour = parseInt(g.time.split(':')[0]);
        return hour >= 14 && hour < 17; // Peak wind hours
      });
      
      if (afternoonWindGames.length > windGames.length * 0.4) {
        score *= 0.95;
        suggestions.push({
          type: 'excessive_wind_exposure',
          priority: 'medium',
          description: 'Many games during high-wind periods',
          implementation: 'Adjust game times in wind-prone locations',
          expectedImprovement: 5
        });
      }
      
      // Optimize travel between climate zones
      let extremeClimateChanges = 0;
      
      const teamGames = new Map<string, Game[]>();
      baseballGames.forEach(game => {
        [game.homeTeamId, game.awayTeamId].forEach(team => {
          if (!teamGames.has(team)) {
            teamGames.set(team, []);
          }
          teamGames.get(team)!.push(game);
        });
      });
      
      teamGames.forEach((games, team) => {
        const sortedGames = games.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        for (let i = 1; i < sortedGames.length; i++) {
          const prevGame = sortedGames[i - 1];
          const currGame = sortedGames[i];
          
          const prevLocation = prevGame.homeTeamId === team ? prevGame.homeTeamId : prevGame.awayTeamId;
          const currLocation = currGame.homeTeamId === team ? currGame.homeTeamId : currGame.awayTeamId;
          
          if (isExtremeClimateChange(prevLocation, currLocation, params.climateZones)) {
            extremeClimateChanges++;
          }
        }
      });
      
      if (extremeClimateChanges > baseballGames.length * 0.1) {
        score *= 0.95;
        suggestions.push({
          type: 'frequent_climate_changes',
          priority: 'low',
          description: 'Teams frequently travel between extreme climate zones',
          implementation: 'Group games by climate zones when possible',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'baseball-climate-optimization',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Climate optimization score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          desertAfternoonGames: afternoonDesertGames.length,
          windExposedGames: afternoonWindGames.length,
          extremeClimateChanges
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Optimizes schedule based on climate and weather patterns',
      tags: ['baseball', 'weather', 'climate', 'optimization']
    },
    cacheable: true,
    priority: 70
  }
];

// Helper functions
function getDayName(dayNumber: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayNumber];
}

function isExtremeClimateChange(
  location1: string, 
  location2: string, 
  climateZones: Record<string, string[]>
): boolean {
  let zone1 = '';
  let zone2 = '';
  
  for (const [zone, teams] of Object.entries(climateZones)) {
    if (teams.includes(location1)) zone1 = zone;
    if (teams.includes(location2)) zone2 = zone;
  }
  
  // Define extreme changes
  const extremeChanges = [
    ['desert', 'midwest'],
    ['desert', 'eastern'],
    ['southern', 'mountain'],
    ['coastal', 'mountain']
  ];
  
  return extremeChanges.some(([z1, z2]) => 
    (zone1 === z1 && zone2 === z2) || (zone1 === z2 && zone2 === z1)
  );
}

export function getWeatherConstraints(): UnifiedConstraint[] {
  return weatherConstraints;
}