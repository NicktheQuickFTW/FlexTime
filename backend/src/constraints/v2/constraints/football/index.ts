// Football Constraints Index
// Aggregates all football-specific constraints

import { UnifiedConstraint } from '../../types';
import { getMediaRightsConstraints } from './mediaRightsConstraints';
import { getTravelConstraints } from './travelConstraints';
import { getChampionshipConstraints } from './championshipConstraints';

// Export individual constraint collections
export { getMediaRightsConstraints } from './mediaRightsConstraints';
export { getTravelConstraints } from './travelConstraints';
export { getChampionshipConstraints } from './championshipConstraints';

// Get all football constraints
export function getAllFootballConstraints(): UnifiedConstraint[] {
  return [
    ...getMediaRightsConstraints(),
    ...getTravelConstraints(),
    ...getChampionshipConstraints()
  ];
}

// Get football constraints by category
export function getFootballConstraintsByCategory(category: string): UnifiedConstraint[] {
  switch (category.toLowerCase()) {
    case 'media':
    case 'tv':
    case 'broadcast':
      return getMediaRightsConstraints();
    case 'travel':
    case 'distance':
      return getTravelConstraints();
    case 'championship':
    case 'postseason':
      return getChampionshipConstraints();
    default:
      return [];
  }
}

// Get high-priority football constraints (weight >= 90)
export function getHighPriorityFootballConstraints(): UnifiedConstraint[] {
  return getAllFootballConstraints().filter(c => c.weight >= 90);
}

// Get hard football constraints only
export function getHardFootballConstraints(): UnifiedConstraint[] {
  return getAllFootballConstraints().filter(c => c.hardness === 'hard');
}

// Football constraint statistics
export function getFootballConstraintStats() {
  const allConstraints = getAllFootballConstraints();
  
  return {
    total: allConstraints.length,
    byCategory: {
      mediaRights: getMediaRightsConstraints().length,
      travel: getTravelConstraints().length,
      championship: getChampionshipConstraints().length
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
    criticalConstraints: allConstraints.filter(c => c.weight === 100).map(c => c.id)
  };
}