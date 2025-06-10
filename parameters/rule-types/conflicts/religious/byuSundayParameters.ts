// BYU Sunday Constraints - Big 12 Conference
// Manages BYU's religious observance requirements

import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  ConstraintResult,
  ConstraintStatus,
  Schedule,
  Game,
  ConstraintParameters,
  ConstraintViolation
} from '../../types';

export const byuSundayConstraints: UnifiedConstraint[] = [
  {
    id: 'byu-sunday-restriction',
    name: 'BYU Sunday Play Restriction',
    type: ConstraintType.COMPLIANCE,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      restrictedTeam: 'BYU',
      restrictedDay: 0, // Sunday
      exceptions: [], // No exceptions
      affectedSports: ['All']
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Find all BYU games on Sunday
      const sundayGames = schedule.games.filter(game => 
        game.date.getDay() === params.restrictedDay &&
        (game.homeTeamId === params.restrictedTeam || game.awayTeamId === params.restrictedTeam)
      );
      
      if (sundayGames.length > 0) {
        sundayGames.forEach(game => {
          violations.push({
            type: 'sunday_play_violation',
            severity: 'critical',
            affectedEntities: [game.id, params.restrictedTeam],
            description: `${params.restrictedTeam} scheduled to play ${game.sport} on Sunday`,
            possibleResolutions: ['Move game to Saturday or Monday']
          });
        });
      }
      
      return {
        constraintId: 'byu-sunday-restriction',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'BYU Sunday restriction satisfied'
          : `Found ${violations.length} Sunday game violations`,
        violations,
        details: {
          sundayGamesFound: sundayGames.length,
          affectedSports: [...new Set(sundayGames.map(g => g.sport))]
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Enforces BYU\'s religious observance policy against Sunday competition',
      tags: ['byu', 'sunday', 'religious', 'compliance']
    },
    cacheable: true,
    priority: 100
  },

  {
    id: 'byu-travel-sunday',
    name: 'BYU Sunday Travel Restriction',
    type: ConstraintType.COMPLIANCE,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      restrictedTeam: 'BYU',
      noTravelStartDay: 6, // Saturday after 6 PM
      noTravelEndDay: 1, // Monday morning
      saturdayTravelCutoff: '18:00',
      mondayTravelEarliest: '06:00',
      minTravelTime: 3 // Hours for flights
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Check games that would require Sunday travel
      schedule.games.forEach(game => {
        if (game.homeTeamId === params.restrictedTeam || game.awayTeamId === params.restrictedTeam) {
          const dayOfWeek = game.date.getDay();
          
          // Check Saturday evening games for away team
          if (dayOfWeek === 6 && game.awayTeamId === params.restrictedTeam) {
            const gameHour = parseInt(game.time.split(':')[0]);
            if (gameHour >= 18) { // 6 PM or later
              violations.push({
                type: 'saturday_late_away_game',
                severity: 'critical',
                affectedEntities: [game.id, params.restrictedTeam],
                description: `${params.restrictedTeam} away game at ${game.time} Saturday requires Sunday travel`,
                possibleResolutions: ['Schedule earlier Saturday game or move to Friday']
              });
            }
          }
          
          // Check Monday morning games requiring Sunday travel
          if (dayOfWeek === 1 && game.awayTeamId === params.restrictedTeam) {
            const gameHour = parseInt(game.time.split(':')[0]);
            if (gameHour < 15) { // Before 3 PM Monday
              violations.push({
                type: 'monday_early_away_game',
                severity: 'critical',
                affectedEntities: [game.id, params.restrictedTeam],
                description: `${params.restrictedTeam} Monday ${game.time} away game requires Sunday travel`,
                possibleResolutions: ['Schedule later Monday or move to Tuesday']
              });
            }
          }
          
          // Check Sunday home games requiring opponent travel
          if (dayOfWeek === 0 && game.homeTeamId === params.restrictedTeam) {
            violations.push({
              type: 'sunday_home_game',
              severity: 'critical',
              affectedEntities: [game.id],
              description: `Cannot host at ${params.restrictedTeam} on Sunday`,
              possibleResolutions: ['Move to Saturday or Monday']
            });
          }
        }
      });
      
      return {
        constraintId: 'byu-travel-sunday',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'BYU Sunday travel restriction satisfied'
          : `Found ${violations.length} Sunday travel violations`,
        violations
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Prevents scheduling that would require BYU to travel on Sunday',
      tags: ['byu', 'sunday', 'travel', 'compliance']
    },
    cacheable: true,
    priority: 95
  },

  {
    id: 'byu-series-adjustment',
    name: 'BYU Baseball/Softball Series Adjustment',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.HARD,
    weight: 90,
    scope: {
      sports: ['Baseball', 'Softball'],
      conferences: ['Big 12']
    },
    parameters: {
      restrictedTeam: 'BYU',
      standardSeriesPattern: ['Friday', 'Saturday', 'Sunday'],
      byuHomePattern: ['Thursday', 'Friday', 'Saturday'],
      byuAwayPattern: ['Friday', 'Saturday', 'Saturday'], // Doubleheader Saturday
      allowThursdayStart: true,
      requireDoubleheader: true
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Group baseball/softball games into series
      const seriesMap = new Map<string, Game[]>();
      
      schedule.games
        .filter(g => (g.sport === 'Baseball' || g.sport === 'Softball') &&
                     (g.homeTeamId === params.restrictedTeam || g.awayTeamId === params.restrictedTeam))
        .forEach(game => {
          const weekStart = getWeekStart(game.date);
          const seriesKey = `${[game.homeTeamId, game.awayTeamId].sort().join('-')}_${weekStart}_${game.sport}`;
          
          if (!seriesMap.has(seriesKey)) {
            seriesMap.set(seriesKey, []);
          }
          seriesMap.get(seriesKey)!.push(game);
        });
      
      // Validate each series
      seriesMap.forEach((games, seriesKey) => {
        const sortedGames = games.sort((a, b) => a.date.getTime() - b.date.getTime());
        const isByuHome = sortedGames[0].homeTeamId === params.restrictedTeam;
        
        // Check for Sunday games
        const sundayGames = sortedGames.filter(g => g.date.getDay() === 0);
        if (sundayGames.length > 0) {
          violations.push({
            type: 'byu_series_sunday_game',
            severity: 'critical',
            affectedEntities: sundayGames.map(g => g.id),
            description: `${params.restrictedTeam} series includes Sunday game`,
            possibleResolutions: ['Adjust to Thursday-Saturday or Friday-Saturday doubleheader']
          });
        }
        
        // Verify proper series pattern
        if (isByuHome) {
          // Home series should be Thu-Fri-Sat
          const days = sortedGames.map(g => g.date.getDay());
          const expectedDays = [4, 5, 6]; // Thursday, Friday, Saturday
          
          if (!arraysEqual(days, expectedDays)) {
            violations.push({
              type: 'incorrect_byu_home_pattern',
              severity: 'major',
              affectedEntities: sortedGames.map(g => g.id),
              description: `${params.restrictedTeam} home series not on Thu-Fri-Sat`,
              possibleResolutions: ['Adjust to Thursday-Saturday pattern']
            });
          }
        } else {
          // Away series should have Saturday doubleheader
          const saturdayGames = sortedGames.filter(g => g.date.getDay() === 6);
          if (saturdayGames.length < 2) {
            violations.push({
              type: 'missing_saturday_doubleheader',
              severity: 'major',
              affectedEntities: sortedGames.map(g => g.id),
              description: `${params.restrictedTeam} away series missing Saturday doubleheader`,
              possibleResolutions: ['Schedule Saturday doubleheader to avoid Sunday play']
            });
          }
        }
      });
      
      return {
        constraintId: 'byu-series-adjustment',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'BYU series adjustments properly implemented'
          : `Found ${violations.length} series pattern violations`,
        violations
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Adjusts baseball/softball series to accommodate BYU Sunday restriction',
      tags: ['byu', 'baseball', 'softball', 'series', 'sunday']
    },
    cacheable: true,
    priority: 90
  }
];

// Helper functions
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

export function getBYUSundayConstraints(): UnifiedConstraint[] {
  return byuSundayConstraints;
}