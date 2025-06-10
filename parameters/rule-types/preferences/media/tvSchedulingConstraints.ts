// Basketball TV Scheduling Constraints - Big 12 Conference
// Manages television windows and broadcast requirements

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

export const tvSchedulingConstraints: UnifiedConstraint[] = [
  {
    id: 'bb-tv-windows',
    name: 'Basketball TV Windows',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 85,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      saturdayWindows: {
        noon: { networks: ['ESPN', 'ESPN2'], slots: 2 },
        afternoon: { networks: ['CBS', 'FOX'], slots: 2 },
        primetime: { networks: ['ESPN', 'ESPN2'], slots: 2 }
      },
      weekdayWindows: {
        early: { time: '18:00', networks: ['ESPNU', 'FS1'], slots: 1 },
        main: { time: '19:00', networks: ['ESPN', 'ESPN2'], slots: 2 },
        late: { time: '21:00', networks: ['ESPN', 'ESPN2'], slots: 2 }
      },
      bigMondayGames: 4, // ESPN Big Monday featured games
      superTuesdayGames: 4, // ESPN+ featured games
      maxGamesPerDay: 8,
      minDaysBetweenTVGames: 2 // For individual teams
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Group games by date and time
      const gamesByDateTime = new Map<string, Game[]>();
      const teamTVGameDates = new Map<string, Date[]>();
      
      const basketballGames = schedule.games.filter(g => 
        (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
        g.type === 'conference'
      );
      
      basketballGames.forEach(game => {
        const dateTimeKey = `${game.date.toISOString().split('T')[0]}-${game.time}`;
        if (!gamesByDateTime.has(dateTimeKey)) {
          gamesByDateTime.set(dateTimeKey, []);
        }
        gamesByDateTime.get(dateTimeKey)!.push(game);
        
        // Track TV games per team (assuming primetime games are TV games)
        const hour = parseInt(game.time.split(':')[0]);
        if (hour >= 18) {
          [game.homeTeamId, game.awayTeamId].forEach(teamId => {
            if (!teamTVGameDates.has(teamId)) {
              teamTVGameDates.set(teamId, []);
            }
            teamTVGameDates.get(teamId)!.push(game.date);
          });
        }
      });
      
      // Check for TV window conflicts
      gamesByDateTime.forEach((games, dateTime) => {
        const [date, time] = dateTime.split('-');
        const dayOfWeek = new Date(date).getDay();
        
        let maxSlots = 0;
        if (dayOfWeek === 6) { // Saturday
          const window = Object.values(params.saturdayWindows).find(w => 
            w.slots > 0 && isTimeInWindow(time, dayOfWeek)
          );
          if (window) maxSlots = window.slots;
        } else if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekday
          const window = Object.values(params.weekdayWindows).find(w => 
            w.time === time
          );
          if (window) maxSlots = window.slots;
        }
        
        if (games.length > maxSlots && maxSlots > 0) {
          score *= 0.9;
          violations.push({
            type: 'tv_window_overflow',
            severity: 'major',
            affectedEntities: games.map(g => g.id),
            description: `${games.length} games at ${time} exceeds ${maxSlots} TV slots`,
            possibleResolutions: ['Redistribute games to other time slots']
          });
        }
      });
      
      // Check daily game limits
      const gamesByDate = new Map<string, number>();
      basketballGames.forEach(game => {
        const dateStr = game.date.toISOString().split('T')[0];
        gamesByDate.set(dateStr, (gamesByDate.get(dateStr) || 0) + 1);
      });
      
      gamesByDate.forEach((count, date) => {
        if (count > params.maxGamesPerDay) {
          score *= 0.95;
          violations.push({
            type: 'excessive_daily_games',
            severity: 'major',
            affectedEntities: [],
            description: `${count} games on ${date} exceeds daily limit of ${params.maxGamesPerDay}`,
            possibleResolutions: ['Spread games across more days']
          });
        }
      });
      
      // Check team TV game spacing
      teamTVGameDates.forEach((dates, teamId) => {
        const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
        
        for (let i = 1; i < sortedDates.length; i++) {
          const daysBetween = Math.floor(
            (sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysBetween < params.minDaysBetweenTVGames) {
            score *= 0.95;
            suggestions.push({
              type: 'insufficient_tv_spacing',
              priority: 'medium',
              description: `${teamId} has TV games only ${daysBetween} days apart`,
              implementation: 'Space out TV appearances for team rest',
              expectedImprovement: 5
            });
          }
        }
      });
      
      // Check Big Monday/Super Tuesday distribution
      const mondayGames = basketballGames.filter(g => 
        g.date.getDay() === 1 && isPrimetimeGame(g)
      );
      
      const tuesdayGames = basketballGames.filter(g => 
        g.date.getDay() === 2 && isPrimetimeGame(g)
      );
      
      if (mondayGames.length < params.bigMondayGames) {
        score *= 0.95;
        suggestions.push({
          type: 'insufficient_big_monday',
          priority: 'medium',
          description: `Only ${mondayGames.length} Big Monday games scheduled`,
          implementation: 'Add more marquee Monday matchups',
          expectedImprovement: 5
        });
      }
      
      if (tuesdayGames.length < params.superTuesdayGames) {
        score *= 0.95;
        suggestions.push({
          type: 'insufficient_super_tuesday',
          priority: 'medium',
          description: `Only ${tuesdayGames.length} Super Tuesday games scheduled`,
          implementation: 'Add more featured Tuesday games',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'bb-tv-windows',
        status: violations.length === 0 && score > 0.85 ? ConstraintStatus.SATISFIED : 
                violations.length > 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: violations.length === 0 && score > 0.85,
        score,
        message: `TV scheduling score: ${(score * 100).toFixed(1)}%`,
        violations,
        suggestions,
        details: {
          totalTVGames: teamTVGameDates.size,
          bigMondayGames: mondayGames.length,
          superTuesdayGames: tuesdayGames.length
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Manages TV windows and broadcast scheduling requirements',
      tags: ['basketball', 'tv', 'media', 'broadcast']
    },
    cacheable: true,
    priority: 85
  },

  {
    id: 'bb-doubleheader-coordination',
    name: 'Basketball Doubleheader Coordination',
    type: ConstraintType.LOGICAL,
    hardness: ConstraintHardness.SOFT,
    weight: 80,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      minTimeBetweenGames: 30, // Minutes
      idealTimeBetweenGames: 45,
      maxSameDayGames: 2, // Men's and women's
      preferredDoubleheaderDays: ['Saturday', 'Sunday'],
      venueFlipTime: 60 // Minutes needed to flip venue between games
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Find potential doubleheaders
      const gamesByDateVenue = new Map<string, Game[]>();
      
      schedule.games
        .filter(g => g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball')
        .forEach(game => {
          const key = `${game.date.toISOString().split('T')[0]}-${game.venueId}`;
          if (!gamesByDateVenue.has(key)) {
            gamesByDateVenue.set(key, []);
          }
          gamesByDateVenue.get(key)!.push(game);
        });
      
      // Analyze doubleheaders
      let goodDoubleheaders = 0;
      let problematicDoubleheaders = 0;
      
      gamesByDateVenue.forEach((games, key) => {
        if (games.length === 2) {
          const [date, venue] = key.split('-');
          const dayOfWeek = new Date(date).getDay();
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
          
          // Check if it's men's and women's games
          const hasMens = games.some(g => g.sport === 'Men\'s Basketball');
          const hasWomens = games.some(g => g.sport === 'Women\'s Basketball');
          
          if (hasMens && hasWomens) {
            // Sort games by time
            const sortedGames = games.sort((a, b) => {
              const timeA = parseInt(a.time.replace(':', ''));
              const timeB = parseInt(b.time.replace(':', ''));
              return timeA - timeB;
            });
            
            // Calculate time between games
            const time1 = parseInt(sortedGames[0].time.replace(':', ''));
            const time2 = parseInt(sortedGames[1].time.replace(':', ''));
            const minutesBetween = ((time2 - time1) / 100) * 60 - 120; // Assuming 2-hour games
            
            if (minutesBetween < params.minTimeBetweenGames) {
              score *= 0.9;
              problematicDoubleheaders++;
              suggestions.push({
                type: 'insufficient_doubleheader_gap',
                priority: 'high',
                description: `Only ${minutesBetween} minutes between games at ${venue}`,
                implementation: 'Increase time between doubleheader games',
                expectedImprovement: 10
              });
            } else if (minutesBetween >= params.idealTimeBetweenGames) {
              goodDoubleheaders++;
            }
            
            // Check preferred days
            if (!params.preferredDoubleheaderDays.includes(dayName)) {
              score *= 0.98;
              suggestions.push({
                type: 'non_preferred_doubleheader_day',
                priority: 'low',
                description: `Doubleheader on ${dayName} instead of weekend`,
                implementation: 'Move doubleheaders to weekends when possible',
                expectedImprovement: 2
              });
            }
          }
        } else if (games.length > params.maxSameDayGames) {
          score *= 0.85;
          problematicDoubleheaders++;
          suggestions.push({
            type: 'excessive_venue_games',
            priority: 'high',
            description: `${games.length} games at same venue on same day`,
            implementation: 'Limit to maximum 2 games per venue per day',
            expectedImprovement: 15
          });
        }
      });
      
      // Check for coordinated marketing opportunities
      const doubleheaderRatio = goodDoubleheaders / (goodDoubleheaders + problematicDoubleheaders || 1);
      if (doubleheaderRatio < 0.7 && goodDoubleheaders > 0) {
        score *= 0.95;
        suggestions.push({
          type: 'poor_doubleheader_coordination',
          priority: 'medium',
          description: 'Doubleheaders not well coordinated for fan experience',
          implementation: 'Optimize doubleheader scheduling for marketing',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'bb-doubleheader-coordination',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Doubleheader coordination score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          goodDoubleheaders,
          problematicDoubleheaders,
          totalDoubleheaderOpportunities: gamesByDateVenue.size
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Coordinates men\'s and women\'s basketball doubleheaders',
      tags: ['basketball', 'doubleheader', 'coordination', 'fan-experience']
    },
    cacheable: true,
    priority: 80
  },

  {
    id: 'bb-marquee-matchup-distribution',
    name: 'Marquee Matchup Distribution',
    type: ConstraintType.PERFORMANCE,
    hardness: ConstraintHardness.SOFT,
    weight: 75,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      marqueeTeams: {
        mens: ['Kansas', 'Baylor', 'Houston', 'Texas Tech'],
        womens: ['Baylor', 'Iowa State', 'Kansas State', 'Texas Tech']
      },
      marqueeWindowPreference: {
        saturday: 0.4,
        weekdayPrimetime: 0.4,
        other: 0.2
      },
      minWeeksBetweenMarqueeGames: 2,
      sweepsMonthGames: 4 // February sweeps period
    },
    evaluation: (schedule: Schedule, params: ConstraintParameters): ConstraintResult => {
      const suggestions: ConstraintSuggestion[] = [];
      let score = 1.0;
      
      // Identify marquee matchups
      const marqueeGames: Game[] = [];
      
      schedule.games
        .filter(g => (g.sport === 'Men\'s Basketball' || g.sport === 'Women\'s Basketball') &&
                     g.type === 'conference')
        .forEach(game => {
          const sportMarqueeTeams = game.sport === 'Men\'s Basketball' 
            ? params.marqueeTeams.mens 
            : params.marqueeTeams.womens;
          
          if (sportMarqueeTeams.includes(game.homeTeamId) && 
              sportMarqueeTeams.includes(game.awayTeamId)) {
            marqueeGames.push(game);
          }
        });
      
      // Check distribution across TV windows
      let saturdayMarquee = 0;
      let primetimeMarquee = 0;
      let otherMarquee = 0;
      
      marqueeGames.forEach(game => {
        const dayOfWeek = game.date.getDay();
        const hour = parseInt(game.time.split(':')[0]);
        
        if (dayOfWeek === 6) {
          saturdayMarquee++;
        } else if (hour >= 19) {
          primetimeMarquee++;
        } else {
          otherMarquee++;
        }
      });
      
      const total = marqueeGames.length || 1;
      const saturdayRatio = saturdayMarquee / total;
      const primetimeRatio = primetimeMarquee / total;
      const otherRatio = otherMarquee / total;
      
      // Check against preferences
      if (Math.abs(saturdayRatio - params.marqueeWindowPreference.saturday) > 0.15) {
        score *= 0.95;
        suggestions.push({
          type: 'marquee_saturday_imbalance',
          priority: 'medium',
          description: `${(saturdayRatio * 100).toFixed(0)}% of marquee games on Saturday`,
          implementation: 'Adjust marquee game distribution',
          expectedImprovement: 5
        });
      }
      
      // Check spacing of marquee games
      const sortedMarqueeGames = marqueeGames.sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      );
      
      let poorlySpaced = 0;
      for (let i = 1; i < sortedMarqueeGames.length; i++) {
        const weeksBetween = Math.floor(
          (sortedMarqueeGames[i].date.getTime() - sortedMarqueeGames[i-1].date.getTime()) / 
          (1000 * 60 * 60 * 24 * 7)
        );
        
        if (weeksBetween < params.minWeeksBetweenMarqueeGames) {
          poorlySpaced++;
        }
      }
      
      if (poorlySpaced > marqueeGames.length * 0.2) {
        score *= 0.9;
        suggestions.push({
          type: 'marquee_game_clustering',
          priority: 'medium',
          description: 'Marquee games clustered too closely together',
          implementation: 'Spread marquee matchups throughout season',
          expectedImprovement: 10
        });
      }
      
      // Check February sweeps
      const februaryMarquee = marqueeGames.filter(g => 
        g.date.getMonth() === 1 // February
      ).length;
      
      if (februaryMarquee < params.sweepsMonthGames) {
        score *= 0.95;
        suggestions.push({
          type: 'insufficient_sweeps_games',
          priority: 'medium',
          description: `Only ${februaryMarquee} marquee games during February sweeps`,
          implementation: 'Schedule more marquee games in February',
          expectedImprovement: 5
        });
      }
      
      return {
        constraintId: 'bb-marquee-matchup-distribution',
        status: score > 0.85 ? ConstraintStatus.SATISFIED : ConstraintStatus.PARTIALLY_SATISFIED,
        satisfied: score > 0.85,
        score,
        message: `Marquee matchup distribution score: ${(score * 100).toFixed(1)}%`,
        suggestions,
        details: {
          totalMarqueeGames: marqueeGames.length,
          saturdayPercentage: (saturdayRatio * 100).toFixed(1),
          primetimePercentage: (primetimeRatio * 100).toFixed(1),
          februaryMarqueeGames: februaryMarquee
        }
      };
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'FlexTime System',
      description: 'Optimizes distribution of high-profile matchups for TV ratings',
      tags: ['basketball', 'tv', 'marquee', 'ratings']
    },
    cacheable: true,
    priority: 75
  }
];

// Helper functions
function isTimeInWindow(time: string, dayOfWeek: number): boolean {
  const hour = parseInt(time.split(':')[0]);
  
  if (dayOfWeek === 6) { // Saturday
    return (hour === 12) || (hour >= 14 && hour <= 16) || (hour >= 19);
  } else {
    return hour >= 18 && hour <= 21;
  }
}

function isPrimetimeGame(game: Game): boolean {
  const hour = parseInt(game.time.split(':')[0]);
  return hour >= 19 && hour <= 21;
}

export function getTVSchedulingConstraints(): UnifiedConstraint[] {
  return tvSchedulingConstraints;
}