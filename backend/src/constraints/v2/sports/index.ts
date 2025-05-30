// Sport-Specific Constraints Index
// Version 2.0 - Aggregates all enhanced constraint implementations

import { UnifiedConstraint } from '../types';

// Import all sport-specific constraints
import { getFootballConstraints } from './EnhancedFootballConstraints';
import { getBasketballConstraints } from './EnhancedBasketballConstraints';
import { getBaseballSoftballConstraints } from './BaseballSoftballConstraints';
import { getVenueSharingConstraints } from './VenueSharingConstraints';
import { getGlobalConstraints } from './GlobalConstraints';

// Export individual constraint getters
export { 
  getFootballConstraints,
  getBasketballConstraints,
  getBaseballSoftballConstraints,
  getVenueSharingConstraints,
  getGlobalConstraints
};

// Export constraint collections by category
export const sportConstraints = {
  football: getFootballConstraints(),
  basketball: getBasketballConstraints(),
  baseballSoftball: getBaseballSoftballConstraints()
};

export const systemConstraints = {
  venueSharing: getVenueSharingConstraints(),
  global: getGlobalConstraints()
};

// Get all constraints for a specific sport
export function getConstraintsForSport(sport: string): UnifiedConstraint[] {
  const allConstraints: UnifiedConstraint[] = [];
  
  // Add sport-specific constraints
  switch (sport.toLowerCase()) {
    case 'football':
      allConstraints.push(...getFootballConstraints());
      break;
    case 'men\'s basketball':
    case 'women\'s basketball':
    case 'basketball':
      allConstraints.push(...getBasketballConstraints());
      break;
    case 'baseball':
    case 'softball':
      allConstraints.push(...getBaseballSoftballConstraints());
      break;
  }
  
  // Add system-wide constraints that apply to all sports
  allConstraints.push(...getVenueSharingConstraints());
  allConstraints.push(...getGlobalConstraints());
  
  // Filter to only constraints that apply to this sport
  return allConstraints.filter(constraint => 
    constraint.scope.sports.includes(sport) || 
    constraint.scope.sports.includes('All')
  );
}

// Get all constraints in the system
export function getAllConstraints(): UnifiedConstraint[] {
  return [
    ...getFootballConstraints(),
    ...getBasketballConstraints(),
    ...getBaseballSoftballConstraints(),
    ...getVenueSharingConstraints(),
    ...getGlobalConstraints()
  ];
}

// Get constraints by type
export function getConstraintsByType(type: string): UnifiedConstraint[] {
  return getAllConstraints().filter(c => c.type === type);
}

// Get constraints by hardness
export function getConstraintsByHardness(hardness: string): UnifiedConstraint[] {
  return getAllConstraints().filter(c => c.hardness === hardness);
}

// Get high-priority constraints (weight >= 90)
export function getHighPriorityConstraints(): UnifiedConstraint[] {
  return getAllConstraints().filter(c => c.weight >= 90);
}

// Get ML-enhanced constraints
export function getMLEnhancedConstraints(): UnifiedConstraint[] {
  return getAllConstraints().filter(c => 
    c.metadata.tags.includes('ml-enhanced') || 
    c.metadata.description.toLowerCase().includes('ml') ||
    c.metadata.description.toLowerCase().includes('machine learning')
  );
}

// Performance optimization: Get cacheable constraints
export function getCacheableConstraints(): UnifiedConstraint[] {
  return getAllConstraints().filter(c => c.cacheable === true);
}

// Performance optimization: Get parallelizable constraints
export function getParallelizableConstraints(): UnifiedConstraint[] {
  return getAllConstraints().filter(c => c.parallelizable === true);
}

// Constraint statistics
export function getConstraintStatistics() {
  const allConstraints = getAllConstraints();
  
  return {
    total: allConstraints.length,
    byType: {
      temporal: allConstraints.filter(c => c.type === 'temporal').length,
      spatial: allConstraints.filter(c => c.type === 'spatial').length,
      logical: allConstraints.filter(c => c.type === 'logical').length,
      performance: allConstraints.filter(c => c.type === 'performance').length,
      compliance: allConstraints.filter(c => c.type === 'compliance').length
    },
    byHardness: {
      hard: allConstraints.filter(c => c.hardness === 'hard').length,
      soft: allConstraints.filter(c => c.hardness === 'soft').length,
      preference: allConstraints.filter(c => c.hardness === 'preference').length
    },
    mlEnhanced: getMLEnhancedConstraints().length,
    cacheable: getCacheableConstraints().length,
    parallelizable: getParallelizableConstraints().length,
    averageWeight: allConstraints.reduce((sum, c) => sum + c.weight, 0) / allConstraints.length
  };
}

// Export all ML utilities for external use
export { FootballMLUtilities } from './EnhancedFootballConstraints';
export { BasketballMLUtilities } from './EnhancedBasketballConstraints';
export { BaseballSoftballMLUtilities } from './BaseballSoftballConstraints';
export { VenueSharingMLUtilities } from './VenueSharingConstraints';
export { GlobalConstraintMLUtilities } from './GlobalConstraints';