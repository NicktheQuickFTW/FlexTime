// TV Window Preferences - Big 12 Conference
// Manages television broadcast windows and media rights preferences

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

export const tvWindowPreferences: UnifiedConstraint[] = [
  {
    id: 'bb-tv-windows',
    name: 'Basketball TV Windows',
    type: ConstraintType.PREFERENCE,
    hardness: ConstraintHardness.SOFT,
    weight: 75,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      preferredWindows: {
        'Saturday': ['12:00', '14:00', '16:00', '18:00', '20:00'],
        'Sunday': ['12:00', '14:00', '16:00', '18:00'],
        'Monday': ['19:00', '21:00'],
        'Tuesday': ['19:00', '21:00'],
        'Wednesday': ['19:00', '21:00'],
        'Thursday': ['19:00', '21:00']
      },
      premiumWindows: {
        'Saturday': ['16:00', '18:00'], // ESPN/Fox primary windows
        'Sunday': ['14:00', '16:00']    // CBS Sports Network windows
      },
      avoidWindows: {
        'Friday': ['19:00', '21:00'], // High school football conflicts
        'Sunday': ['10:00', '11:00']  // Church services
      }
    },
    description: 'Optimizes game scheduling for television broadcast windows',
    
    evaluate: async (game: Game, context: any): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      
      const gameDate = new Date(game.date);
      const gameDay = gameDate.toLocaleDateString('en-US', { weekday: 'long' });
      const gameTime = game.time || '19:00';
      
      const preferredTimes = this.parameters.preferredWindows[gameDay] || [];
      const premiumTimes = this.parameters.premiumWindows[gameDay] || [];
      const avoidTimes = this.parameters.avoidWindows[gameDay] || [];
      
      let score = 0.5; // Base score
      
      if (premiumTimes.includes(gameTime)) {
        score = 1.0; // Premium TV window
        suggestions.push({
          type: 'tv_optimization',
          message: 'Game scheduled in premium TV window',
          impact: 'positive'
        });
      } else if (preferredTimes.includes(gameTime)) {
        score = 0.8; // Good TV window
      } else if (avoidTimes.includes(gameTime)) {
        score = 0.2; // Poor TV window
        violations.push({
          type: 'tv_window_conflict',
          severity: 'minor',
          message: `Game time ${gameTime} conflicts with preferred TV strategy`,
          suggestedFix: `Consider moving to preferred window: ${preferredTimes.join(', ')}`
        });
      }
      
      return {
        constraintId: 'bb-tv-windows',
        status: violations.length > 0 ? ConstraintStatus.WARNING : ConstraintStatus.SATISFIED,
        score,
        violations,
        suggestions,
        metadata: {
          gameDay,
          gameTime,
          tvWindowType: premiumTimes.includes(gameTime) ? 'premium' : 
                       preferredTimes.includes(gameTime) ? 'preferred' : 'standard'
        }
      };
    }
  }
];

export default tvWindowPreferences;