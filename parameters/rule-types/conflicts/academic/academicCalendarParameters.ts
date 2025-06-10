// Academic Calendar Constraints - Big 12 Conference
// Manages scheduling around academic calendars and exam periods

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

export const academicCalendarConstraints: UnifiedConstraint[] = [
  {
    id: 'academic-exam-periods',
    name: 'Final Exam Period Restrictions',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      fallExamPeriods: {
        start: '2025-12-08',
        end: '2025-12-15'
      },
      springExamPeriods: {
        start: '2026-05-04',
        end: '2026-05-11'
      },
      exemptSports: ['Football'], // Championship/bowl season
      allowedDuringExams: {
        'Men\'s Basketball': 2, // Limited games allowed
        'Women\'s Basketball': 2,
        'Other': 0
      }
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Check fall exam period
      const fallExamGames = schedule.games.filter(game => 
        game.date >= new Date(params.fallExamPeriods.start) &&
        game.date <= new Date(params.fallExamPeriods.end) &&
        !params.exemptSports.includes(game.sport)
      );
      
      // Check spring exam period
      const springExamGames = schedule.games.filter(game => 
        game.date >= new Date(params.springExamPeriods.start) &&
        game.date <= new Date(params.springExamPeriods.end) &&
        !params.exemptSports.includes(game.sport)
      );
      
      // Count games by sport during exam periods
      const examGamesBySport = new Map<string, number>();
      [...fallExamGames, ...springExamGames].forEach(game => {
        examGamesBySport.set(game.sport, (examGamesBySport.get(game.sport) || 0) + 1);
      });
      
      // Check violations
      examGamesBySport.forEach((count, sport) => {
        const allowed = params.allowedDuringExams[sport] || params.allowedDuringExams['Other'];
        
        if (count > allowed) {
          const excessGames = [...fallExamGames, ...springExamGames]
            .filter(g => g.sport === sport)
            .slice(allowed);
          
          violations.push({
            type: 'exam_period_violation',
            severity: 'critical',
            affectedEntities: excessGames.map(g => g.id),
            description: `${sport} has ${count} games during exam periods (allowed: ${allowed})`,
            possibleResolutions: ['Move games outside exam periods']
          });
        }
      });
      
      return {
        constraintId: 'academic-exam-periods',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Exam period restrictions satisfied'
          : `Found ${violations.length} exam period violations`,
        violations,
        details: {
          fallExamGames: fallExamGames.length,
          springExamGames: springExamGames.length,
          examGamesBySport: Object.fromEntries(examGamesBySport)
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Restricts games during final exam periods',
      tags: ['academic', 'exams', 'temporal', 'compliance']
    },
    cacheable: true,
    priority: 95
  },

  {
    id: 'academic-break-scheduling',
    name: 'Academic Break Scheduling',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      thanksgivingBreak: {
        start: '2025-11-26',
        end: '2025-11-30'
      },
      winterBreak: {
        start: '2025-12-20',
        end: '2026-01-12'
      },
      springBreak: {
        start: '2026-03-14',
        end: '2026-03-22'
      },
      breakSchedulingRules: {
        'Football': 'rivalry-games-preferred',
        'Basketball': 'tournaments-allowed',
        'Baseball': 'neutral-site-preferred',
        'Softball': 'neutral-site-preferred'
      }
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Analyze games during breaks
      const breakPeriods = [
        { name: 'Thanksgiving', ...params.thanksgivingBreak },
        { name: 'Winter', ...params.winterBreak },
        { name: 'Spring', ...params.springBreak }
      ];
      
      breakPeriods.forEach(period => {
        const breakGames = schedule.games.filter(game => 
          game.date >= new Date(period.start) &&
          game.date <= new Date(period.end)
        );
        
        // Check home games during breaks (students away)
        const homeGames = breakGames.filter(g => g.type === 'conference');
        
        if (period.name === 'Winter' && homeGames.length > 0) {
          const basketballGames = homeGames.filter(g => 
            g.sport.includes('Basketball')
          );
          
          if (basketballGames.length > 4) {
            score *= 0.9;
            suggestions.push({
              type: 'excessive_winter_break_games',
              priority: 'medium',
              description: 'Many basketball games during winter break',
              implementation: 'Consider tournament format or neutral sites',
              expectedImprovement: 10
            });
          }
        }
        
        if (period.name === 'Spring') {
          const baseballSoftball = breakGames.filter(g => 
            g.sport === 'Baseball' || g.sport === 'Softball'
          );
          
          const neutralSiteGames = baseballSoftball.filter(g => 
            g.neutral === true
          );
          
          const neutralRatio = baseballSoftball.length > 0 
            ? neutralSiteGames.length / baseballSoftball.length 
            : 1;
          
          if (neutralRatio < 0.5) {
            score *= 0.95;
            suggestions.push({
              type: 'low_spring_break_neutral',
              priority: 'low',
              description: 'Few neutral site games during spring break',
              implementation: 'Schedule spring break tournaments',
              expectedImprovement: 5
            });
          }
        }
      });
      
      // Check Thanksgiving football
      const thanksgivingWeekend = schedule.games.filter(game => 
        game.sport === 'Football' &&
        game.date >= new Date('2025-11-28') &&
        game.date <= new Date('2025-11-29')
      );
      
      const rivalryGames = thanksgivingWeekend.filter(g => 
        isRivalryGame(g.homeTeamId, g.awayTeamId)
      );
      
      if (thanksgivingWeekend.length > 0 && rivalryGames.length === 0) {
        score *= 0.95;
        suggestions.push({
          type: 'no_thanksgiving_rivalry',
          priority: 'medium',
          description: 'No rivalry games scheduled for Thanksgiving weekend',
          implementation: 'Schedule traditional rivalries on Thanksgiving',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'academic-break-scheduling',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Academic break scheduling score: ${(score * 100).toFixed(1)}%`,
        suggestions
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Optimizes scheduling during academic breaks',
      tags: ['academic', 'breaks', 'holidays', 'optimization']
    },
    cacheable: true,
    priority: 80
  },

  {
    id: 'academic-weekday-limits',
    name: 'Weekday Academic Limits',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.SOFT,
    weight: 75,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      weekdayStartTime: '17:00', // 5 PM earliest for classes
      preferredStartTime: '18:00', // 6 PM preferred
      maxWeekdayGamesPerWeek: {
        'Football': 1,
        'Basketball': 2,
        'Other': 3
      },
      travelDayRestrictions: {
        maxClassDaysMissed: 2,
        preferredTravelDays: ['Thursday', 'Friday']
      }
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Check weekday game times
      const weekdayGames = schedule.games.filter(game => {
        const day = game.date.getDay();
        return day >= 1 && day <= 5; // Monday-Friday
      });
      
      const earlyWeekdayGames = weekdayGames.filter(game => {
        const hour = parseInt(game.time.split(':')[0]);
        return hour < parseInt(params.weekdayStartTime.split(':')[0]);
      });
      
      if (earlyWeekdayGames.length > 0) {
        score *= 0.8;
        suggestions.push({
          type: 'early_weekday_games',
          priority: 'high',
          description: `${earlyWeekdayGames.length} weekday games before ${params.weekdayStartTime}`,
          implementation: 'Move weekday games to evening slots',
          expectedImprovement: 20
        });
      }
      
      // Check weekday game frequency by team
      const teamWeekdayGames = new Map<string, Map<number, number>>();
      
      weekdayGames.forEach(game => {
        const weekNum = getWeekNumber(game.date);
        
        [game.homeTeamId, game.awayTeamId].forEach(team => {
          if (!teamWeekdayGames.has(team)) {
            teamWeekdayGames.set(team, new Map());
          }
          const weekMap = teamWeekdayGames.get(team)!;
          weekMap.set(weekNum, (weekMap.get(weekNum) || 0) + 1);
        });
      });
      
      // Check for excessive weekday games
      let excessiveWeeks = 0;
      teamWeekdayGames.forEach((weekMap, team) => {
        weekMap.forEach((count, week) => {
          const sport = getTeamSport(team, schedule);
          const limit = params.maxWeekdayGamesPerWeek[sport] || 
                       params.maxWeekdayGamesPerWeek['Other'];
          
          if (count > limit) {
            excessiveWeeks++;
          }
        });
      });
      
      if (excessiveWeeks > 5) {
        score *= 0.9;
        suggestions.push({
          type: 'excessive_weekday_concentration',
          priority: 'medium',
          description: 'Multiple teams have too many weekday games in single weeks',
          implementation: 'Spread weekday games across different weeks',
          expectedImprovement: 10
        });
      }
      
      // Check travel impact on classes
      const longTravelGames = schedule.games.filter(game => {
        const isLongTravel = isLongDistanceGame(game);
        const day = game.date.getDay();
        return isLongTravel && day >= 1 && day <= 4; // Mon-Thu
      });
      
      if (longTravelGames.length > schedule.games.length * 0.1) {
        score *= 0.95;
        suggestions.push({
          type: 'weekday_travel_impact',
          priority: 'medium',
          description: 'Many long-distance trips during class days',
          implementation: 'Schedule long trips for weekends',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'academic-weekday-limits',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Weekday academic limits score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          weekdayGames: weekdayGames.length,
          earlyGames: earlyWeekdayGames.length,
          longTravelWeekdayGames: longTravelGames.length
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Manages weekday scheduling to minimize academic impact',
      tags: ['academic', 'weekday', 'classes', 'student-athlete']
    },
    cacheable: true,
    priority: 75
  }
];

// Helper functions
function isRivalryGame(team1: string, team2: string): boolean {
  const rivalries = [
    ['Kansas', 'Kansas State'],
    ['Arizona', 'Arizona State'],
    ['Utah', 'BYU'],
    ['Texas Tech', 'TCU'],
    ['Cincinnati', 'West Virginia']
  ];
  
  return rivalries.some(([t1, t2]) => 
    (team1 === t1 && team2 === t2) || (team1 === t2 && team2 === t1)
  );
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getTeamSport(team: string, schedule: Schedule): string {
  const teamGame = schedule.games.find(g => 
    g.homeTeamId === team || g.awayTeamId === team
  );
  return teamGame ? teamGame.sport : 'Other';
}

function isLongDistanceGame(game: Game): boolean {
  // Placeholder - would calculate actual distance
  const longDistancePairs = [
    ['Cincinnati', 'Arizona'],
    ['West Virginia', 'Arizona State'],
    ['UCF', 'Utah'],
    ['UCF', 'BYU']
  ];
  
  return longDistancePairs.some(([t1, t2]) => 
    (game.homeTeamId === t1 && game.awayTeamId === t2) ||
    (game.homeTeamId === t2 && game.awayTeamId === t1)
  );
}

export function getAcademicCalendarConstraints(): UnifiedConstraint[] {
  return academicCalendarConstraints;
}