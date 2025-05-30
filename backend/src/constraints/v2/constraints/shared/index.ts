// Shared Constraints Index
// Aggregates all constraints that apply across multiple sports

import { UnifiedConstraint } from '../../types';
import { getVenueSharingConstraints } from './venueSharingConstraints';
import { getBYUSundayConstraints } from './byuSundayConstraints';
import { getAcademicCalendarConstraints } from './academicCalendarConstraints';

// Export individual constraint collections
export { getVenueSharingConstraints } from './venueSharingConstraints';
export { getBYUSundayConstraints } from './byuSundayConstraints';
export { getAcademicCalendarConstraints } from './academicCalendarConstraints';

// Get all shared constraints
export function getAllSharedConstraints(): UnifiedConstraint[] {
  return [
    ...getVenueSharingConstraints(),
    ...getBYUSundayConstraints(),
    ...getAcademicCalendarConstraints()
  ];
}

// Get shared constraints by category
export function getSharedConstraintsByCategory(category: string): UnifiedConstraint[] {
  switch (category.toLowerCase()) {
    case 'venue':
    case 'facilities':
      return getVenueSharingConstraints();
    case 'byu':
    case 'sunday':
    case 'religious':
      return getBYUSundayConstraints();
    case 'academic':
    case 'calendar':
    case 'exams':
      return getAcademicCalendarConstraints();
    default:
      return [];
  }
}

// Get high-priority shared constraints (weight >= 90)
export function getHighPrioritySharedConstraints(): UnifiedConstraint[] {
  return getAllSharedConstraints().filter(c => c.weight >= 90);
}

// Get compliance constraints
export function getComplianceConstraints(): UnifiedConstraint[] {
  return getAllSharedConstraints().filter(c => c.type === 'compliance');
}

// Shared constraint statistics
export function getSharedConstraintStats() {
  const allConstraints = getAllSharedConstraints();
  
  return {
    total: allConstraints.length,
    byCategory: {
      venueSharing: getVenueSharingConstraints().length,
      byuSunday: getBYUSundayConstraints().length,
      academicCalendar: getAcademicCalendarConstraints().length
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
    complianceConstraints: allConstraints.filter(c => c.type === 'compliance').map(c => c.id),
    mustEnforce: allConstraints.filter(c => c.weight === 100).map(c => c.id)
  };
}

// Get constraints that affect specific team
export function getTeamSpecificConstraints(teamId: string): UnifiedConstraint[] {
  if (teamId === 'BYU') {
    return getBYUSundayConstraints();
  }
  return getAllSharedConstraints();
}