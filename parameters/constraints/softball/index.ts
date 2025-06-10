// Softball Constraints Index
// Aggregates all softball-specific constraints

import { UnifiedConstraint } from '../../types';
import { getSoftballConstraints } from './softballConstraints';

// Export individual constraint collections
export { getSoftballConstraints } from './softballConstraints';

// Get all softball constraints
export function getAllSoftballConstraints(): UnifiedConstraint[] {
  return getSoftballConstraints();
}

// Get high-priority softball constraints (weight >= 85)
export function getHighPrioritySoftballConstraints(): UnifiedConstraint[] {
  return getAllSoftballConstraints().filter(c => c.weight >= 85);
}

// Get hard softball constraints only
export function getHardSoftballConstraints(): UnifiedConstraint[] {
  return getAllSoftballConstraints().filter(c => c.hardness === 'hard');
}

// Softball constraint statistics
export function getSoftballConstraintStats() {
  const allConstraints = getAllSoftballConstraints();
  
  return {
    total: allConstraints.length,
    byHardness: {
      hard: allConstraints.filter(c => c.hardness === 'hard').length,
      soft: allConstraints.filter(c => c.hardness === 'soft').length,
      preference: allConstraints.filter(c => c.hardness === 'preference').length
    },
    byType: {
      temporal: allConstraints.filter(c => c.type === 'temporal').length,
      logical: allConstraints.filter(c => c.type === 'logical').length
    },
    averageWeight: allConstraints.reduce((sum, c) => sum + c.weight, 0) / allConstraints.length,
    criticalConstraints: allConstraints.filter(c => c.weight >= 90).map(c => c.id)
  };
}