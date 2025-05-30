// Main Constraints Index - Big 12 Conference
// Central export point for all constraint implementations

import { UnifiedConstraint } from '../types';

// Import all sport-specific constraints
import { getAllFootballConstraints } from './football';
import { getAllBasketballConstraints } from './basketball';
import { getAllBaseballConstraints } from './baseball';
import { getAllSoftballConstraints } from './softball';
import { getAllSharedConstraints } from './shared';

// Re-export all constraint modules
export * from './football';
export * from './basketball';
export * from './baseball';
export * from './softball';
export * from './shared';

// Main function to get all constraints in the system
export function getAllConstraints(): UnifiedConstraint[] {
  return [
    ...getAllFootballConstraints(),
    ...getAllBasketballConstraints(),
    ...getAllBaseballConstraints(),
    ...getAllSoftballConstraints(),
    ...getAllSharedConstraints()
  ];
}

// Get constraints for a specific sport
export function getConstraintsForSport(sport: string): UnifiedConstraint[] {
  const allConstraints: UnifiedConstraint[] = [];
  
  // Add sport-specific constraints
  switch (sport.toLowerCase()) {
    case 'football':
      allConstraints.push(...getAllFootballConstraints());
      break;
    case 'men\'s basketball':
    case 'women\'s basketball':
    case 'basketball':
      allConstraints.push(...getAllBasketballConstraints());
      break;
    case 'baseball':
      allConstraints.push(...getAllBaseballConstraints());
      break;
    case 'softball':
      allConstraints.push(...getAllSoftballConstraints());
      break;
  }
  
  // Add shared constraints that apply to this sport
  const sharedConstraints = getAllSharedConstraints().filter(c => 
    c.scope.sports.includes(sport) || c.scope.sports.includes('All')
  );
  
  allConstraints.push(...sharedConstraints);
  
  return allConstraints;
}

// Get constraints by type
export function getConstraintsByType(type: string): UnifiedConstraint[] {
  return getAllConstraints().filter(c => c.type === type);
}

// Get constraints by hardness
export function getConstraintsByHardness(hardness: string): UnifiedConstraint[] {
  return getAllConstraints().filter(c => c.hardness === hardness);
}

// Get constraints by weight range
export function getConstraintsByWeight(minWeight: number, maxWeight?: number): UnifiedConstraint[] {
  return getAllConstraints().filter(c => 
    c.weight >= minWeight && (maxWeight === undefined || c.weight <= maxWeight)
  );
}

// Get critical constraints (weight = 100)
export function getCriticalConstraints(): UnifiedConstraint[] {
  return getAllConstraints().filter(c => c.weight === 100);
}

// Get hard constraints
export function getHardConstraints(): UnifiedConstraint[] {
  return getAllConstraints().filter(c => c.hardness === 'hard');
}

// Get ML-enhanced constraints
export function getMLEnhancedConstraints(): UnifiedConstraint[] {
  return getAllConstraints().filter(c => 
    c.metadata.tags.includes('ml-enhanced') || 
    c.metadata.tags.includes('ml') ||
    c.metadata.description.toLowerCase().includes('machine learning')
  );
}

// Get cacheable constraints
export function getCacheableConstraints(): UnifiedConstraint[] {
  return getAllConstraints().filter(c => c.cacheable === true);
}

// Get constraints by tag
export function getConstraintsByTag(tag: string): UnifiedConstraint[] {
  return getAllConstraints().filter(c => 
    c.metadata.tags.includes(tag.toLowerCase())
  );
}

// Get constraint statistics
export function getConstraintSystemStats() {
  const allConstraints = getAllConstraints();
  
  // Group by various attributes
  const byType = allConstraints.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byHardness = allConstraints.reduce((acc, c) => {
    acc[c.hardness] = (acc[c.hardness] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const bySport = allConstraints.reduce((acc, c) => {
    c.scope.sports.forEach(sport => {
      acc[sport] = (acc[sport] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const weightDistribution = {
    critical: allConstraints.filter(c => c.weight === 100).length,
    high: allConstraints.filter(c => c.weight >= 90 && c.weight < 100).length,
    medium: allConstraints.filter(c => c.weight >= 70 && c.weight < 90).length,
    low: allConstraints.filter(c => c.weight < 70).length
  };
  
  return {
    totalConstraints: allConstraints.length,
    byType,
    byHardness,
    bySport,
    weightDistribution,
    averageWeight: allConstraints.reduce((sum, c) => sum + c.weight, 0) / allConstraints.length,
    cacheableCount: allConstraints.filter(c => c.cacheable).length,
    criticalConstraintIds: allConstraints.filter(c => c.weight === 100).map(c => c.id),
    sports: {
      football: getAllFootballConstraints().length,
      basketball: getAllBasketballConstraints().length,
      baseball: getAllBaseballConstraints().length,
      softball: getAllSoftballConstraints().length,
      shared: getAllSharedConstraints().length
    }
  };
}

// Constraint validation helper
export function validateConstraintCoverage(sports: string[]): {
  covered: string[];
  missing: string[];
  coverage: Record<string, number>;
} {
  const covered: string[] = [];
  const missing: string[] = [];
  const coverage: Record<string, number> = {};
  
  sports.forEach(sport => {
    const constraints = getConstraintsForSport(sport);
    coverage[sport] = constraints.length;
    
    if (constraints.length > 0) {
      covered.push(sport);
    } else {
      missing.push(sport);
    }
  });
  
  return { covered, missing, coverage };
}

// Export types for external use
export type { UnifiedConstraint } from '../types';
export { ConstraintType, ConstraintHardness, ConstraintStatus } from '../types';