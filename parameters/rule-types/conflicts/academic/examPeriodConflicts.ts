// Exam Period Conflicts - Big 12 Conference
// Manages scheduling blackouts during academic exam periods

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

export const examPeriodConflicts: UnifiedConstraint[] = [
  {
    id: 'academic-exam-periods',
    name: 'Final Exam Period Restrictions',
    type: ConstraintType.COMPLIANCE,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    description: 'Prevents scheduling conflicts during final exam periods',
    
    evaluate: async (game: Game, context: any): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      
      // Get exam period dates for the participating schools
      const homeSchoolExamPeriod = getExamPeriod(game.homeTeamId, context.season);
      const awaySchoolExamPeriod = getExamPeriod(game.awayTeamId, context.season);
      
      const gameDate = new Date(game.date);
      
      // Check if game conflicts with home school exam period
      if (homeSchoolExamPeriod && isDateInPeriod(gameDate, homeSchoolExamPeriod)) {
        violations.push({
          type: 'exam_period_conflict',
          severity: 'critical',
          message: `Game conflicts with ${game.homeTeamId} final exam period (${homeSchoolExamPeriod.start} - ${homeSchoolExamPeriod.end})`,
          suggestedFix: 'Reschedule outside exam period'
        });
      }
      
      // Check if game conflicts with away school exam period
      if (awaySchoolExamPeriod && isDateInPeriod(gameDate, awaySchoolExamPeriod)) {
        violations.push({
          type: 'exam_period_conflict',
          severity: 'critical',
          message: `Game conflicts with ${game.awayTeamId} final exam period (${awaySchoolExamPeriod.start} - ${awaySchoolExamPeriod.end})`,
          suggestedFix: 'Reschedule outside exam period'
        });
      }
      
      return {
        constraintId: 'academic-exam-periods',
        status: violations.length > 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.SATISFIED,
        score: violations.length > 0 ? 0 : 1,
        violations,
        suggestions,
        metadata: {
          homeExamPeriod: homeSchoolExamPeriod,
          awayExamPeriod: awaySchoolExamPeriod
        }
      };
    },
    
    parameters: {
      examPeriods: {
        // Spring 2026 Final Exam Periods by School
        'arizona': { start: '2026-05-04', end: '2026-05-08' },
        'arizona-state': { start: '2026-05-04', end: '2026-05-08' },
        'baylor': { start: '2026-05-04', end: '2026-05-07' },
        'byu': { start: '2026-04-20', end: '2026-04-24' },
        'cincinnati': { start: '2026-04-27', end: '2026-05-01' },
        'colorado': { start: '2026-05-04', end: '2026-05-08' },
        'houston': { start: '2026-05-04', end: '2026-05-08' },
        'iowa-state': { start: '2026-05-04', end: '2026-05-08' },
        'kansas': { start: '2026-05-11', end: '2026-05-15' },
        'kansas-state': { start: '2026-05-11', end: '2026-05-15' },
        'oklahoma-state': { start: '2026-05-04', end: '2026-05-08' },
        'tcu': { start: '2026-05-04', end: '2026-05-08' },
        'texas-tech': { start: '2026-05-04', end: '2026-05-08' },
        'ucf': { start: '2026-04-27', end: '2026-05-01' },
        'utah': { start: '2026-04-27', end: '2026-05-01' },
        'west-virginia': { start: '2026-05-04', end: '2026-05-08' }
      }
    }
  }
];

// Helper functions
function getExamPeriod(teamId: string, season: number) {
  const examPeriods = examPeriodConflicts[0].parameters.examPeriods;
  return examPeriods[teamId] || null;
}

function isDateInPeriod(date: Date, period: { start: string; end: string }): boolean {
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);
  return date >= startDate && date <= endDate;
}

export default examPeriodConflicts;