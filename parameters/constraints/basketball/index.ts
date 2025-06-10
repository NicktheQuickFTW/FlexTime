// Basketball Constraints Index
// Aggregates all basketball-specific constraints

import { UnifiedConstraint } from '../../types';
import { getConferencePlayConstraints } from './conferencePlayConstraints';
import { getTournamentConstraints } from './tournamentConstraints';
import { getTVSchedulingConstraints } from './tvSchedulingConstraints';

// Export individual constraint collections
export { getConferencePlayConstraints } from './conferencePlayConstraints';
export { getTournamentConstraints } from './tournamentConstraints';
export { getTVSchedulingConstraints } from './tvSchedulingConstraints';

// Get all basketball constraints
export function getAllBasketballConstraints(): UnifiedConstraint[] {
  return [
    ...getConferencePlayConstraints(),
    ...getTournamentConstraints(),
    ...getTVSchedulingConstraints()
  ];
}

// Get basketball constraints by category
export function getBasketballConstraintsByCategory(category: string): UnifiedConstraint[] {
  switch (category.toLowerCase()) {
    case 'conference':
    case 'conference-play':
      return getConferencePlayConstraints();
    case 'tournament':
    case 'postseason':
      return getTournamentConstraints();
    case 'tv':
    case 'media':
    case 'broadcast':
      return getTVSchedulingConstraints();
    default:
      return [];
  }
}

// Get constraints for specific basketball type
export function getConstraintsBySport(sport: string): UnifiedConstraint[] {
  return getAllBasketballConstraints().filter(c => 
    c.scope.sports.includes(sport) || 
    c.scope.sports.includes('Men\'s Basketball') || 
    c.scope.sports.includes('Women\'s Basketball')
  );
}

// Get high-priority basketball constraints (weight >= 90)
export function getHighPriorityBasketballConstraints(): UnifiedConstraint[] {
  return getAllBasketballConstraints().filter(c => c.weight >= 90);
}

// Get hard basketball constraints only
export function getHardBasketballConstraints(): UnifiedConstraint[] {
  return getAllBasketballConstraints().filter(c => c.hardness === 'hard');
}

// Basketball constraint statistics
export function getBasketballConstraintStats() {
  const allConstraints = getAllBasketballConstraints();
  
  return {
    total: allConstraints.length,
    byCategory: {
      conferencePlay: getConferencePlayConstraints().length,
      tournament: getTournamentConstraints().length,
      tvScheduling: getTVSchedulingConstraints().length
    },
    byHardness: {
      hard: allConstraints.filter(c => c.hardness === 'hard').length,
      soft: allConstraints.filter(c => c.hardness === 'soft').length,
      preference: allConstraints.filter(c => c.hardness === 'preference').length
    },
    byType: {
      temporal: allConstraints.filter(c => c.type === 'temporal').length,
      spatial: allConstraints.filter(c => c.type === 'spatial').length,
      logical: allConstraints.filter(c => c.type === 'logical').length,
      performance: allConstraints.filter(c => c.type === 'performance').length,
      compliance: allConstraints.filter(c => c.type === 'compliance').length
    },
    averageWeight: allConstraints.reduce((sum, c) => sum + c.weight, 0) / allConstraints.length,
    criticalConstraints: allConstraints.filter(c => c.weight === 100).map(c => c.id),
    applicableToMens: allConstraints.filter(c => 
      c.scope.sports.includes('Men\'s Basketball')
    ).length,
    applicableToWomens: allConstraints.filter(c => 
      c.scope.sports.includes('Women\'s Basketball')
    ).length
  };
}

// Get constraints that apply to both men's and women's basketball
export function getSharedBasketballConstraints(): UnifiedConstraint[] {
  return getAllBasketballConstraints().filter(c => 
    c.scope.sports.includes('Men\'s Basketball') && 
    c.scope.sports.includes('Women\'s Basketball')
  );
}