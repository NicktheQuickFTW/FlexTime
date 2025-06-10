// Global Cross-Sport Constraints with ML-enhanced optimization
// Version 2.0 - Handles conference-wide rules and cross-sport coordination

import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  ConstraintResult,
  ConstraintStatus,
  Schedule,
  Game,
  Team,
  ConstraintParameters,
  ConstraintViolation,
  ConstraintSuggestion
} from '../types';

// ML-enhanced global utilities
class GlobalConstraintMLUtilities {
  // Predict campus resource stress based on multiple concurrent events
  static predictCampusStress(
    sameDay: Game[],
    teamId: string,
    campusCapacity: number = 50000
  ): {
    stressLevel: number; // 0-1
    bottlenecks: string[];
    mitigation: string[];
  } {
    let stressLevel = 0;
    const bottlenecks: string[] = [];
    const mitigation: string[] = [];
    
    // Calculate expected attendance
    let totalAttendance = 0;
    const sportAttendance: Record<string, number> = {
      'Football': 0.85, // 85% of capacity
      'Men\'s Basketball': 0.75,
      'Women\'s Basketball': 0.45,
      'Baseball': 0.25,
      'Softball': 0.20,
      'Volleyball': 0.30,
      'Soccer': 0.20,
      'Wrestling': 0.25,
      'Gymnastics': 0.30,
      'Track': 0.15
    };
    
    for (const game of sameDay) {
      if (game.homeTeamId === teamId) {
        const expectedPct = sportAttendance[game.sport] || 0.2;
        totalAttendance += campusCapacity * expectedPct;
      }
    }
    
    // Calculate stress factors
    stressLevel = Math.min(totalAttendance / campusCapacity, 1.0);
    
    if (stressLevel > 0.8) {
      bottlenecks.push('Parking capacity exceeded');
      bottlenecks.push('Traffic congestion likely');
      mitigation.push('Implement shuttle services');
      mitigation.push('Stagger event start times');
    }
    
    if (stressLevel > 0.6) {
      bottlenecks.push('Concession strain');
      bottlenecks.push('Security coverage stretched');
      mitigation.push('Add temporary vendors');
      mitigation.push('Increase security staffing');
    }
    
    // Check for sport-specific conflicts
    const hasFootball = sameDay.some(g => g.sport === 'Football');
    const hasBasketball = sameDay.some(g => g.sport.includes('Basketball'));
    
    if (hasFootball && hasBasketball) {
      stressLevel = Math.min(stressLevel * 1.3, 1.0);
      bottlenecks.push('Major sports overlap');
      mitigation.push('Avoid scheduling basketball on football gamedays');
    }
    
    return { stressLevel, bottlenecks, mitigation };
  }

  // Analyze travel patterns across all sports
  static analyzeCrossSportTravel(
    games: Game[],
    teamId: string
  ): {
    weeklyMiles: Map<number, number>;
    peakWeeks: number[];
    suggestions: string[];
  } {
    const weeklyMiles = new Map<number, number>();
    const teamGames = games.filter(g => 
      g.homeTeamId === teamId || g.awayTeamId === teamId
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Group by week and calculate travel
    for (const game of teamGames) {
      const week = Math.floor(game.date.getTime() / (7 * 24 * 60 * 60 * 1000));
      
      if (game.awayTeamId === teamId) {
        // Simplified distance calculation
        const baseMiles = 300; // Average Big 12 trip
        const currentMiles = weeklyMiles.get(week) || 0;
        weeklyMiles.set(week, currentMiles + baseMiles);
      }
    }
    
    // Identify peak travel weeks
    const peakWeeks: number[] = [];
    const suggestions: string[] = [];
    
    for (const [week, miles] of weeklyMiles.entries()) {
      if (miles > 1000) {
        peakWeeks.push(week);
        suggestions.push(`Week ${week}: ${miles} miles across multiple sports`);
      }
    }
    
    // Check for back-to-back travel weekends
    const sortedWeeks = Array.from(weeklyMiles.keys()).sort((a, b) => a - b);
    for (let i = 1; i < sortedWeeks.length; i++) {
      const prevMiles = weeklyMiles.get(sortedWeeks[i-1]) || 0;
      const currMiles = weeklyMiles.get(sortedWeeks[i]) || 0;
      
      if (prevMiles > 600 && currMiles > 600) {
        suggestions.push(`Back-to-back heavy travel weeks: ${sortedWeeks[i-1]} and ${sortedWeeks[i]}`);
      }
    }
    
    return { weeklyMiles, peakWeeks, suggestions };
  }

  // Predict optimal exam period scheduling
  static analyzeExamPeriodImpact(
    games: Game[],
    examStart: Date,
    examEnd: Date
  ): {
    affectedGames: Game[];
    impactScore: number;
    recommendations: string[];
  } {
    const affectedGames = games.filter(g => 
      g.date >= examStart && g.date <= examEnd
    );
    
    let impactScore = 0;
    const recommendations: string[] = [];
    
    // Different sports have different academic impacts
    const academicImpact: Record<string, number> = {
      'Football': 0.3, // Lower during exam period (bowl season)
      'Basketball': 0.8, // High impact - regular season
      'Baseball': 0.9, // Very high - peak season
      'Softball': 0.9,
      'Track': 0.7,
      'Tennis': 0.7,
      'Golf': 0.6
    };
    
    for (const game of affectedGames) {
      const sportImpact = academicImpact[game.sport] || 0.5;
      impactScore += sportImpact;
      
      if (sportImpact > 0.7 && game.type === 'conference') {
        recommendations.push(
          `Consider moving ${game.sport} conference game on ${game.date.toDateString()}`
        );
      }
    }
    
    if (affectedGames.length > 10) {
      recommendations.push('High density of games during exam period');
      recommendations.push('Consider front-loading schedule before exams');
    }
    
    return {
      affectedGames,
      impactScore: impactScore / affectedGames.length,
      recommendations
    };
  }
}

// Global Cross-Sport Constraints
export const globalConstraints: UnifiedConstraint[] = [
  {
    id: 'global-byu-sunday',
    name: 'BYU Sunday Restriction - All Sports',
    type: ConstraintType.COMPLIANCE,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['All'],
      teams: ['BYU']
    },
    parameters: {
      allowedExceptions: [] // No exceptions
    },
    evaluation: (schedule: Schedule): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      
      // Check all BYU games across all sports
      const byuSundayGames = schedule.games.filter(game => 
        (game.homeTeamId === 'BYU' || game.awayTeamId === 'BYU') &&
        game.date.getDay() === 0 // Sunday
      );
      
      // Group by sport for better reporting
      const gamesBySport = new Map<string, Game[]>();
      for (const game of byuSundayGames) {
        if (!gamesBySport.has(game.sport)) {
          gamesBySport.set(game.sport, []);
        }
        gamesBySport.get(game.sport)!.push(game);
      }
      
      for (const [sport, games] of gamesBySport.entries()) {
        violations.push({
          type: 'sunday_games',
          severity: 'critical',
          affectedEntities: ['BYU', ...games.map(g => g.id)],
          description: `${games.length} ${sport} games scheduled on Sunday for BYU`,
          possibleResolutions: [
            'Move to Saturday',
            'Move to Friday evening',
            'Move to Monday (if allowed by sport)'
          ]
        });
      }
      
      return {
        constraintId: 'global-byu-sunday',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'BYU Sunday restriction satisfied across all sports'
          : `Found ${byuSundayGames.length} BYU games on Sundays across ${gamesBySport.size} sports`,
        violations,
        confidence: 1.0,
        details: {
          totalViolations: byuSundayGames.length,
          violationsBySport: Object.fromEntries(
            Array.from(gamesBySport.entries()).map(([sport, games]) => [sport, games.length])
          )
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures BYU does not compete in any sport on Sundays',
      tags: ['global', 'compliance', 'religious', 'byu']
    },
    cacheable: true,
    priority: 100
  },

  {
    id: 'global-campus-stress',
    name: 'Campus Resource and Infrastructure Management',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 75,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      maxSameDayMajorEvents: 2,
      majorSports: ['Football', 'Men\'s Basketball', 'Women\'s Basketball'],
      stressThreshold: 0.7,
      minimumTimeBetweenMajorEvents: 4 // hours
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      const startTime = Date.now();
      let score = 1.0;
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      
      // Analyze each campus
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const homeGames = schedule.games.filter(g => g.homeTeamId === team.id);
        
        // Group by date
        const gamesByDate = new Map<string, Game[]>();
        for (const game of homeGames) {
          const dateKey = game.date.toISOString().split('T')[0];
          if (!gamesByDate.has(dateKey)) {
            gamesByDate.set(dateKey, []);
          }
          gamesByDate.get(dateKey)!.push(game);
        }
        
        // Check each date for campus stress
        for (const [date, dayGames] of gamesByDate.entries()) {
          if (dayGames.length < 2) continue;
          
          const stressAnalysis = GlobalConstraintMLUtilities.predictCampusStress(
            dayGames,
            team.id
          );
          
          if (stressAnalysis.stressLevel > params.stressThreshold) {
            score *= (1 - stressAnalysis.stressLevel * 0.3);
            
            violations.push({
              type: 'campus_stress_exceeded',
              severity: stressAnalysis.stressLevel > 0.9 ? 'major' : 'minor',
              affectedEntities: [team.id, ...dayGames.map(g => g.id)],
              description: `${team.name} campus stress level ${(stressAnalysis.stressLevel * 100).toFixed(0)}% on ${date}`,
              possibleResolutions: stressAnalysis.mitigation
            });
          }
          
          // Check major sport conflicts
          const majorSportGames = dayGames.filter(g => 
            params.majorSports.includes(g.sport)
          );
          
          if (majorSportGames.length > params.maxSameDayMajorEvents) {
            score *= 0.7;
            violations.push({
              type: 'excessive_major_events',
              severity: 'major',
              affectedEntities: majorSportGames.map(g => g.id),
              description: `${majorSportGames.length} major sporting events on same day at ${team.name}`,
              possibleResolutions: ['Spread major events across different days']
            });
          }
          
          // Check timing conflicts for same-day events
          const sortedGames = dayGames.sort((a, b) => {
            const timeA = parseInt(a.time.replace(':', ''));
            const timeB = parseInt(b.time.replace(':', ''));
            return timeA - timeB;
          });
          
          for (let i = 1; i < sortedGames.length; i++) {
            const time1 = parseInt(sortedGames[i-1].time.replace(':', ''));
            const time2 = parseInt(sortedGames[i].time.replace(':', ''));
            const hoursDiff = (time2 - time1) / 100;
            
            if (hoursDiff < params.minimumTimeBetweenMajorEvents &&
                params.majorSports.includes(sortedGames[i-1].sport) &&
                params.majorSports.includes(sortedGames[i].sport)) {
              score *= 0.85;
              suggestions.push({
                type: 'tight_major_event_spacing',
                priority: 'medium',
                description: `${sortedGames[i-1].sport} and ${sortedGames[i].sport} only ${hoursDiff}h apart at ${team.name}`,
                implementation: 'Increase spacing to at least 4 hours',
                expectedImprovement: 10
              });
            }
          }
        }
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        constraintId: 'global-campus-stress',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : 
          score < 0.7 ? ConstraintStatus.VIOLATED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0,
        score,
        message: `Campus resource management score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions,
        executionTime,
        confidence: 0.85
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Manages campus-wide resource allocation and event spacing',
      tags: ['global', 'campus', 'resources', 'ml-enhanced']
    },
    cacheable: true,
    parallelizable: true,
    priority: 75
  },

  {
    id: 'global-travel-equity',
    name: 'Cross-Sport Travel Equity and Balance',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 70,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      maxWeeklyTravelMiles: 1500,
      travelEquityThreshold: 0.2, // 20% variance allowed
      restDaysAfterLongTrip: 2,
      longTripMiles: 1000
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      let score = 1.0;
      const suggestions: ConstraintSuggestion[] = [];
      const teamTravelStats = new Map<string, number>();
      
      // Calculate total travel for each team across all sports
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const travelAnalysis = GlobalConstraintMLUtilities.analyzeCrossSportTravel(
          schedule.games,
          team.id
        );
        
        // Calculate total miles
        const totalMiles = Array.from(travelAnalysis.weeklyMiles.values())
          .reduce((sum, miles) => sum + miles, 0);
        teamTravelStats.set(team.id, totalMiles);
        
        // Check peak weeks
        for (const [week, miles] of travelAnalysis.weeklyMiles.entries()) {
          if (miles > params.maxWeeklyTravelMiles) {
            score *= 0.9;
            suggestions.push({
              type: 'excessive_weekly_travel',
              priority: 'high',
              description: `${team.name} travels ${miles} miles in week ${week}`,
              implementation: 'Redistribute away games across different weeks',
              expectedImprovement: 12
            });
          }
        }
        
        // Add specific suggestions from analysis
        for (const suggestion of travelAnalysis.suggestions) {
          suggestions.push({
            type: 'travel_pattern_issue',
            priority: 'medium',
            description: `${team.name}: ${suggestion}`,
            implementation: 'Review and optimize travel scheduling',
            expectedImprovement: 8
          });
        }
      }
      
      // Check travel equity across conference
      const travelValues = Array.from(teamTravelStats.values());
      const avgTravel = travelValues.reduce((sum, val) => sum + val, 0) / travelValues.length;
      const maxDeviation = Math.max(...travelValues.map(val => 
        Math.abs(val - avgTravel) / avgTravel
      ));
      
      if (maxDeviation > params.travelEquityThreshold) {
        score *= 0.85;
        
        // Find teams with extreme travel
        const extremeTeams = Array.from(teamTravelStats.entries())
          .filter(([_, miles]) => Math.abs(miles - avgTravel) / avgTravel > params.travelEquityThreshold)
          .map(([teamId, miles]) => {
            const team = schedule.teams.find(t => t.id === teamId);
            return `${team?.name}: ${miles} miles (avg: ${avgTravel.toFixed(0)})`;
          });
        
        suggestions.push({
          type: 'travel_inequity',
          priority: 'medium',
          description: `Travel imbalance exceeds ${(params.travelEquityThreshold * 100)}% threshold`,
          implementation: `Balance travel load: ${extremeTeams.join(', ')}`,
          expectedImprovement: 15
        });
      }
      
      // Check for adequate rest after long trips
      for (const team of schedule.teams.filter(t => t.conference === 'Big 12')) {
        const teamGames = schedule.games
          .filter(g => g.homeTeamId === team.id || g.awayTeamId === team.id)
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        for (let i = 0; i < teamGames.length - 1; i++) {
          const game = teamGames[i];
          const nextGame = teamGames[i + 1];
          
          // Simple long trip detection (in production, use actual distances)
          const isLongTrip = game.awayTeamId === team.id && 
            !['Kansas', 'Kansas State'].includes(game.homeTeamId); // Example
          
          if (isLongTrip) {
            const daysBetween = (nextGame.date.getTime() - game.date.getTime()) / 
                               (1000 * 60 * 60 * 24);
            
            if (daysBetween < params.restDaysAfterLongTrip) {
              score *= 0.92;
              suggestions.push({
                type: 'insufficient_rest_after_travel',
                priority: 'medium',
                description: `${team.name} has only ${daysBetween.toFixed(0)} days rest after long trip`,
                implementation: 'Add rest days after trips over 1000 miles',
                expectedImprovement: 8
              });
            }
          }
        }
      }
      
      return {
        constraintId: 'global-travel-equity',
        status: score > 0.8 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.8,
        score,
        message: `Travel equity score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        confidence: 0.82,
        details: {
          averageTravelMiles: avgTravel,
          maxDeviation: (maxDeviation * 100).toFixed(1) + '%',
          teamStats: Object.fromEntries(teamTravelStats)
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures equitable travel distribution across all teams and sports',
      tags: ['global', 'travel', 'equity', 'cross-sport']
    },
    cacheable: true,
    parallelizable: true,
    priority: 70
  },

  {
    id: 'global-academic-calendar',
    name: 'Academic Calendar Compliance',
    type: ConstraintType.COMPLIANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      fallExamStart: '2025-12-08',
      fallExamEnd: '2025-12-15',
      springExamStart: '2026-05-04',
      springExamEnd: '2026-05-11',
      maxExamPeriodGames: 2, // Per team per sport
      readingDayBuffer: 2 // Days before exams
    },
    evaluation: async (schedule: Schedule, params: ConstraintParameters): Promise<ConstraintResult> => {
      let score = 1.0;
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      
      const examPeriods = [
        { start: new Date(params.fallExamStart), end: new Date(params.fallExamEnd), term: 'Fall' },
        { start: new Date(params.springExamStart), end: new Date(params.springExamEnd), term: 'Spring' }
      ];
      
      for (const period of examPeriods) {
        // Add reading day buffer
        const bufferStart = new Date(period.start);
        bufferStart.setDate(bufferStart.getDate() - params.readingDayBuffer);
        
        const examAnalysis = GlobalConstraintMLUtilities.analyzeExamPeriodImpact(
          schedule.games,
          bufferStart,
          period.end
        );
        
        if (examAnalysis.impactScore > 0.7) {
          score *= (1 - examAnalysis.impactScore * 0.3);
          suggestions.push({
            type: 'high_exam_period_activity',
            priority: 'high',
            description: `High athletic activity during ${period.term} exams (impact: ${(examAnalysis.impactScore * 100).toFixed(0)}%)`,
            implementation: 'Reduce games during exam periods',
            expectedImprovement: 20
          });
        }
        
        // Check each team's exam period schedule
        const teamExamGames = new Map<string, Map<string, number>>();
        
        for (const game of examAnalysis.affectedGames) {
          // Track home team
          if (!teamExamGames.has(game.homeTeamId)) {
            teamExamGames.set(game.homeTeamId, new Map());
          }
          const homeTeamSports = teamExamGames.get(game.homeTeamId)!;
          homeTeamSports.set(game.sport, (homeTeamSports.get(game.sport) || 0) + 1);
          
          // Track away team
          if (!teamExamGames.has(game.awayTeamId)) {
            teamExamGames.set(game.awayTeamId, new Map());
          }
          const awayTeamSports = teamExamGames.get(game.awayTeamId)!;
          awayTeamSports.set(game.sport, (awayTeamSports.get(game.sport) || 0) + 1);
        }
        
        // Check violations
        for (const [teamId, sports] of teamExamGames.entries()) {
          const team = schedule.teams.find(t => t.id === teamId);
          
          for (const [sport, count] of sports.entries()) {
            if (count > params.maxExamPeriodGames) {
              violations.push({
                type: 'excessive_exam_period_games',
                severity: 'major',
                affectedEntities: [teamId],
                description: `${team?.name} has ${count} ${sport} games during ${period.term} exams`,
                possibleResolutions: [
                  'Move games before exam period',
                  'Request academic accommodation'
                ]
              });
              score *= 0.8;
            }
          }
        }
        
        // Add recommendations from analysis
        for (const rec of examAnalysis.recommendations) {
          suggestions.push({
            type: 'exam_period_scheduling',
            priority: 'medium',
            description: rec,
            implementation: 'Coordinate with academic calendar',
            expectedImprovement: 10
          });
        }
      }
      
      // Check for graduation conflicts (typically early May)
      const graduationWindow = new Date('2026-05-08');
      const gradStart = new Date(graduationWindow);
      gradStart.setDate(gradStart.getDate() - 3);
      const gradEnd = new Date(graduationWindow);
      gradEnd.setDate(gradEnd.getDate() + 3);
      
      const graduationGames = schedule.games.filter(g => 
        g.date >= gradStart && g.date <= gradEnd &&
        g.type === 'conference' // Focus on conference games
      );
      
      if (graduationGames.length > 0) {
        suggestions.push({
          type: 'graduation_conflict',
          priority: 'low',
          description: `${graduationGames.length} conference games during graduation weekend`,
          implementation: 'Consider moving games to avoid graduation ceremonies',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'global-academic-calendar',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0,
        score,
        message: `Academic calendar compliance score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions,
        confidence: 0.9
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Ensures athletic schedules respect academic calendar priorities',
      tags: ['global', 'academic', 'compliance', 'student-athlete']
    },
    cacheable: true,
    parallelizable: true,
    priority: 80
  },

  {
    id: 'global-championship-coordination',
    name: 'Championship and Tournament Window Coordination',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 90,
    scope: {
      sports: ['All'],
      conferences: ['Big 12']
    },
    parameters: {
      championshipWindows: {
        'Football': { start: '2025-11-30', end: '2025-12-07' },
        'Men\'s Basketball': { start: '2026-03-08', end: '2026-03-15' },
        'Women\'s Basketball': { start: '2026-03-08', end: '2026-03-15' },
        'Baseball': { start: '2026-05-18', end: '2026-05-24' },
        'Softball': { start: '2026-05-05', end: '2026-05-10' },
        'Track': { start: '2026-05-11', end: '2026-05-16' },
        'Tennis': { start: '2026-04-20', end: '2026-04-26' },
        'Golf': { start: '2026-04-20', end: '2026-04-26' }
      },
      bufferDays: 3, // Days before championship
      ncaaBuffer: 7 // Days between conference and NCAA championships
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      
      // Check each sport's championship window
      for (const [sport, window] of Object.entries(params.championshipWindows)) {
        const windowStart = new Date(window.start);
        const windowEnd = new Date(window.end);
        const bufferDate = new Date(windowStart);
        bufferDate.setDate(bufferDate.getDate() - params.bufferDays);
        
        // Find regular season games that violate championship windows
        const lateGames = schedule.games.filter(g => 
          g.sport === sport &&
          g.type === 'conference' &&
          g.date >= bufferDate
        );
        
        if (lateGames.length > 0) {
          violations.push({
            type: 'championship_window_violation',
            severity: 'critical',
            affectedEntities: lateGames.map(g => g.id),
            description: `${lateGames.length} ${sport} games scheduled during championship window`,
            possibleResolutions: [
              `Move games before ${bufferDate.toDateString()}`,
              'Verify these are tournament games, not regular season'
            ]
          });
        }
        
        // Check for championship games
        const championshipGames = schedule.games.filter(g => 
          g.sport === sport &&
          g.type === 'championship'
        );
        
        if (championshipGames.length === 0 && sport !== 'Track' && sport !== 'Golf') {
          suggestions.push({
            type: 'missing_championship',
            priority: 'high',
            description: `No ${sport} championship games scheduled`,
            implementation: `Add championship games between ${window.start} and ${window.end}`,
            expectedImprovement: 0
          });
        }
      }
      
      // Check for overlapping championship events
      const allChampionshipGames = schedule.games.filter(g => 
        g.type === 'championship' || g.type === 'tournament'
      );
      
      // Group by date
      const champsByDate = new Map<string, Game[]>();
      for (const game of allChampionshipGames) {
        const dateKey = game.date.toISOString().split('T')[0];
        if (!champsByDate.has(dateKey)) {
          champsByDate.set(dateKey, []);
        }
        champsByDate.get(dateKey)!.push(game);
      }
      
      // Check for conflicts
      for (const [date, games] of champsByDate.entries()) {
        const sports = new Set(games.map(g => g.sport));
        
        if (sports.size > 2) {
          suggestions.push({
            type: 'championship_overlap',
            priority: 'medium',
            description: `${sports.size} different sport championships on ${date}`,
            implementation: 'Spread championships across different weekends',
            expectedImprovement: 10
          });
        }
        
        // Check venue conflicts for championships
        const venues = games.map(g => g.venueId);
        const duplicateVenues = venues.filter((v, i) => venues.indexOf(v) !== i);
        
        if (duplicateVenues.length > 0) {
          violations.push({
            type: 'championship_venue_conflict',
            severity: 'critical',
            affectedEntities: games.filter(g => duplicateVenues.includes(g.venueId)).map(g => g.id),
            description: 'Multiple championships at same venue on same date',
            possibleResolutions: ['Use different venues', 'Reschedule championships']
          });
        }
      }
      
      return {
        constraintId: 'global-championship-coordination',
        status: violations.length === 0 ? ConstraintStatus.SATISFIED : ConstraintStatus.VIOLATED,
        satisfied: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        message: violations.length === 0 
          ? 'Championship windows properly coordinated'
          : `Found ${violations.length} championship coordination violations`,
        violations,
        suggestions,
        confidence: 0.95
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      author: 'FlexTime System',
      description: 'Coordinates championship windows across all sports',
      tags: ['global', 'championship', 'temporal', 'coordination']
    },
    cacheable: true,
    priority: 90
  }
];

// Export helper function
export function getGlobalConstraints(): UnifiedConstraint[] {
  return globalConstraints;
}

// Export ML utilities
export { GlobalConstraintMLUtilities };

// Aggregate all constraints for easy import
export function getAllSportConstraints(): UnifiedConstraint[] {
  // This would import and combine all sport-specific constraints
  // In a real implementation, you'd import from the other files
  return globalConstraints;
}