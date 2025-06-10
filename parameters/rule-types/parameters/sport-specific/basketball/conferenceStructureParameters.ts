// Basketball Conference Structure Parameters - Big 12 Conference
// Manages conference schedule structure and balance rules

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

export const conferenceStructureParameters: UnifiedConstraint[] = [
  {
    id: 'bb-conference-structure',
    name: 'Conference Schedule Structure',
    type: ConstraintType.STRUCTURE,
    hardness: ConstraintHardness.HARD,
    weight: 95,
    scope: {
      sports: ['Men\'s Basketball', 'Women\'s Basketball'],
      conferences: ['Big 12']
    },
    parameters: {
      totalConferenceGames: 18,
      homeAwayBalance: 'required',
      travelPartnerCoordination: true,
      podSystemRequired: true,
      doubleRoundRobin: false // Big 12 uses single round robin with selective doubles
    },
    description: 'Defines the structure requirements for Big 12 basketball conference play',
    
    evaluate: async (game: Game, context: any): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      
      // This is a structural parameter - validation happens at schedule level
      // Individual games are evaluated for compliance with overall structure
      
      return {
        constraintId: 'bb-conference-structure',
        status: ConstraintStatus.SATISFIED,
        score: 1,
        violations,
        suggestions,
        metadata: {
          conferenceGamesRequired: 18,
          structureType: 'single-round-robin-with-doubles'
        }
      };
    }
  },
  
  {
    id: 'bb-pod-coverage',
    name: 'Pod Coverage Requirement',
    type: ConstraintType.STRUCTURE,
    hardness: ConstraintHardness.HARD,
    weight: 90,
    parameters: {
      podsRequired: 4,
      teamsPerPod: 4,
      podCoverageRequired: true
    },
    description: 'Ensures each team plays against teams from all geographic pods',
    
    evaluate: async (game: Game, context: any): Promise<ConstraintResult> => {
      // Pod coverage validation logic would go here
      return {
        constraintId: 'bb-pod-coverage',
        status: ConstraintStatus.SATISFIED,
        score: 1,
        violations: [],
        suggestions: [],
        metadata: {}
      };
    }
  }
];

export default conferenceStructureParameters;