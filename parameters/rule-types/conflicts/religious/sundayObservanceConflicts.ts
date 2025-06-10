// Sunday Observance Conflicts - Big 12 Conference
// Manages religious observance conflicts for BYU and other institutions

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

export const sundayObservanceConflicts: UnifiedConstraint[] = [
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
      applicableTimeZones: ['Mountain', 'Pacific', 'Central', 'Eastern']
    },
    description: 'BYU cannot compete on Sundays due to religious observance',
    
    evaluate: async (game: Game, context: any): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      
      // Check if BYU is participating in this game
      const byuParticipating = game.homeTeamId === 'byu' || game.awayTeamId === 'byu';
      
      if (byuParticipating) {
        const gameDate = new Date(game.date);
        const gameDay = gameDate.getDay(); // 0 = Sunday
        
        if (gameDay === 0) { // Sunday
          violations.push({
            type: 'religious_observance_conflict',
            severity: 'critical',
            message: 'BYU cannot compete on Sundays due to religious observance',
            suggestedFix: 'Reschedule to Saturday or Monday'
          });
        }
      }
      
      return {
        constraintId: 'byu-sunday-restriction',
        status: violations.length > 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.SATISFIED,
        score: violations.length > 0 ? 0 : 1,
        violations,
        suggestions: [],
        metadata: {
          byuParticipating,
          gameDay: new Date(game.date).getDay()
        }
      };
    }
  }
];

export default sundayObservanceConflicts;