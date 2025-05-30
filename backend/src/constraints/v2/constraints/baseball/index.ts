// Baseball Constraints Index
// Aggregates all baseball-specific constraints

import { UnifiedConstraint } from '../../types';
import { getSeriesConstraints } from './seriesConstraints';
import { getWeatherConstraints } from './weatherConstraints';

// Export individual constraint collections
export { getSeriesConstraints } from './seriesConstraints';
export { getWeatherConstraints } from './weatherConstraints';

// Get all baseball constraints
export function getAllBaseballConstraints(): UnifiedConstraint[] {
  return [
    ...getSeriesConstraints(),
    ...getWeatherConstraints()
  ];
}

// Get baseball constraints by category
export function getBaseballConstraintsByCategory(category: string): UnifiedConstraint[] {
  switch (category.toLowerCase()) {
    case 'series':
    case 'structure':
      return getSeriesConstraints();
    case 'weather':
    case 'climate':
      return getWeatherConstraints();
    default:
      return [];
  }
}

// Get high-priority baseball constraints (weight >= 85)
export function getHighPriorityBaseballConstraints(): UnifiedConstraint[] {
  return getAllBaseballConstraints().filter(c => c.weight >= 85);
}

// Get hard baseball constraints only
export function getHardBaseballConstraints(): UnifiedConstraint[] {
  return getAllBaseballConstraints().filter(c => c.hardness === 'hard');
}

// Baseball constraint statistics
export function getBaseballConstraintStats() {
  const allConstraints = getAllBaseballConstraints();
  
  return {
    total: allConstraints.length,
    byCategory: {
      series: getSeriesConstraints().length,
      weather: getWeatherConstraints().length
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
      performance: allConstraints.filter(c => c.type === 'performance').length
    },
    averageWeight: allConstraints.reduce((sum, c) => sum + c.weight, 0) / allConstraints.length,
    weatherCritical: allConstraints.filter(c => 
      c.metadata.tags.includes('weather') && c.weight >= 90
    ).map(c => c.id)
  };
}

// Get weather-sensitive constraints
export function getWeatherSensitiveConstraints(): UnifiedConstraint[] {
  return getAllBaseballConstraints().filter(c => 
    c.metadata.tags.includes('weather') || 
    c.metadata.tags.includes('climate')
  );
}