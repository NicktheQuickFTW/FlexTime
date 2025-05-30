import { SmartConflictResolver, ResolverConfig } from '../resolvers/SmartConflictResolver';
import { ConflictAnalyzer } from '../resolvers/ConflictAnalyzer';
import { ResolutionStrategies } from '../resolvers/ResolutionStrategies';
import { ResolutionHistory } from '../resolvers/ResolutionHistory';
import {
  Conflict,
  ConflictType,
  Resolution,
  ResolutionStrategy,
  ConflictAnalysis,
  RiskAssessment
} from '../types/conflict-types';
import { Schedule, Game } from '../types/schedule-types';

// Mock dependencies
jest.mock('../resolvers/ConflictAnalyzer');
jest.mock('../resolvers/ResolutionStrategies');
jest.mock('../resolvers/ResolutionHistory');

describe('SmartConflictResolver', () => {
  let resolver: SmartConflictResolver;
  let mockAnalyzer: jest.Mocked<ConflictAnalyzer>;
  let mockStrategies: jest.Mocked<ResolutionStrategies>;
  let mockHistory: jest.Mocked<ResolutionHistory>;

  // Test fixtures
  const mockSchedule: Schedule = {
    id: 'test-schedule',
    games: [
      {
        id: 'game1',
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        date: new Date('2025-01-15'),
        time: '19:00',
        venueId: 'venue1',
        sport: 'basketball'
      },
      {
        id: 'game2',
        homeTeamId: 'team1',
        awayTeamId: 'team3',
        date: new Date('2025-01-15'),
        time: '19:00',
        venueId: 'venue1',
        sport: 'basketball'
      }
    ] as Game[],
    teams: [],
    venues: [],
    constraints: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0'
    }
  };

  const mockConflict: Conflict = {
    id: 'conflict1',
    type: ConflictType.VENUE_DOUBLE_BOOKING,
    severity: 'critical',
    affectedGames: ['game1', 'game2'],
    affectedTeams: ['team1', 'team2', 'team3'],
    description: 'Venue double-booked for two games',
    metadata: {
      cascadeRisk: 0.8,
      historicalFrequency: 0.3,
      conflictScore: 0.9
    }
  };

  const mockAnalysis: ConflictAnalysis = {
    conflictId: 'conflict1',
    patterns: [],
    impactScore: 0.8,
    affectedConstraints: [],
    cascadeRisk: 0.8,
    riskAssessment: {
      complianceRisk: false,
      reputationalRisk: true,
      operationalRisk: true,
      financialRisk: false
    } as RiskAssessment,
    suggestedResolutions: [ResolutionStrategy.TIME_SHIFT, ResolutionStrategy.VENUE_SWAP]
  };

  const mockResolution: Resolution = {
    id: 'resolution1',
    conflictId: 'conflict1',
    strategy: ResolutionStrategy.TIME_SHIFT,
    modifications: [
      {
        targetGameId: 'game2',
        field: 'time',
        originalValue: '19:00',
        newValue: '21:00'
      }
    ],
    feasibility: 0.85,
    impact: {
      gamesModified: 1,
      teamsAffected: ['team1', 'team3'],
      cascadeEffect: 0.2,
      competitiveBalance: 0.1
    },
    status: 'proposed',
    recommendationScore: 0.9,
    createdAt: new Date(),
    appliedAt: null
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    mockAnalyzer = new ConflictAnalyzer() as jest.Mocked<ConflictAnalyzer>;
    mockAnalyzer.analyzeConflict = jest.fn().mockResolvedValue(mockAnalysis);
    mockAnalyzer.detectConflicts = jest.fn().mockResolvedValue([]);

    mockStrategies = new ResolutionStrategies() as jest.Mocked<ResolutionStrategies>;
    mockStrategies.generateResolution = jest.fn().mockResolvedValue(mockResolution);

    mockHistory = new ResolutionHistory() as jest.Mocked<ResolutionHistory>;
    mockHistory.getSuccessRate = jest.fn().mockResolvedValue(0.75);
    mockHistory.recordResolution = jest.fn().mockResolvedValue(undefined);

    resolver = new SmartConflictResolver();
  });

  describe('Conflict Resolution', () => {
    it('should resolve single conflict successfully', async () => {
      const resolutions = await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      expect(resolutions.size).toBe(1);
      expect(resolutions.get('conflict1')).toBeDefined();
      expect(resolutions.get('conflict1')?.strategy).toBe(ResolutionStrategy.TIME_SHIFT);
      expect(mockAnalyzer.analyzeConflict).toHaveBeenCalledWith(mockConflict, mockSchedule);
    });

    it('should handle multiple conflicts in priority order', async () => {
      const criticalConflict: Conflict = {
        ...mockConflict,
        id: 'critical',
        severity: 'critical',
        metadata: { cascadeRisk: 0.9 }
      };

      const majorConflict: Conflict = {
        ...mockConflict,
        id: 'major',
        severity: 'major',
        metadata: { cascadeRisk: 0.5 }
      };

      const minorConflict: Conflict = {
        ...mockConflict,
        id: 'minor',
        severity: 'minor',
        metadata: { cascadeRisk: 0.2 }
      };

      const conflicts = [minorConflict, criticalConflict, majorConflict];
      const resolutions = await resolver.resolveConflicts(mockSchedule, conflicts);

      // Verify conflicts were processed in severity order
      const callOrder = mockAnalyzer.analyzeConflict.mock.calls.map(call => call[0].id);
      expect(callOrder).toEqual(['critical', 'major', 'minor']);
    });

    it('should skip low-confidence resolutions', async () => {
      const lowConfidenceResolution: Resolution = {
        ...mockResolution,
        feasibility: 0.5 // Below threshold
      };

      mockStrategies.generateResolution = jest.fn().mockResolvedValue(lowConfidenceResolution);

      const resolutions = await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      expect(resolutions.size).toBe(0);
    });

    it('should handle resolution generation failures', async () => {
      mockStrategies.generateResolution = jest.fn()
        .mockRejectedValueOnce(new Error('Strategy failed'))
        .mockResolvedValueOnce(mockResolution);

      const resolutions = await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      // Should try alternative strategies
      expect(mockStrategies.generateResolution).toHaveBeenCalledTimes(2);
    });

    it('should update learning model when enabled', async () => {
      const resolver = new SmartConflictResolver({ enableLearning: true });
      
      await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      expect(mockHistory.recordResolution).toHaveBeenCalled();
    });

    it('should not update learning model when disabled', async () => {
      const resolver = new SmartConflictResolver({ enableLearning: false });
      
      await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      expect(mockHistory.recordResolution).not.toHaveBeenCalled();
    });
  });

  describe('Strategy Selection', () => {
    it('should select appropriate strategies for venue conflicts', async () => {
      const venueConflict: Conflict = {
        ...mockConflict,
        type: ConflictType.VENUE_DOUBLE_BOOKING
      };

      await resolver.resolveConflicts(mockSchedule, [venueConflict]);

      // Verify appropriate strategies were considered
      const generatedStrategy = mockStrategies.generateResolution.mock.calls[0][0];
      expect([
        ResolutionStrategy.TIME_SHIFT,
        ResolutionStrategy.VENUE_SWAP,
        ResolutionStrategy.ALTERNATIVE_VENUE,
        ResolutionStrategy.DATE_SWAP
      ]).toContain(generatedStrategy);
    });

    it('should select appropriate strategies for travel conflicts', async () => {
      const travelConflict: Conflict = {
        ...mockConflict,
        type: ConflictType.TRAVEL_BURDEN
      };

      await resolver.resolveConflicts(mockSchedule, [travelConflict]);

      const generatedStrategy = mockStrategies.generateResolution.mock.calls[0][0];
      expect([
        ResolutionStrategy.GAME_SWAP,
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.SPLIT_DOUBLEHEADER
      ]).toContain(generatedStrategy);
    });

    it('should fall back to manual override for unknown conflict types', async () => {
      const unknownConflict: Conflict = {
        ...mockConflict,
        type: 'UNKNOWN' as ConflictType
      };

      await resolver.resolveConflicts(mockSchedule, [unknownConflict]);

      const generatedStrategy = mockStrategies.generateResolution.mock.calls[0][0];
      expect(generatedStrategy).toBe(ResolutionStrategy.MANUAL_OVERRIDE);
    });
  });

  describe('Resolution Validation', () => {
    it('should validate resolutions before accepting', async () => {
      mockAnalyzer.detectConflicts = jest.fn().mockResolvedValue([]);

      const resolutions = await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      expect(resolutions.size).toBe(1);
      expect(mockAnalyzer.detectConflicts).toHaveBeenCalled();
    });

    it('should reject resolutions that create critical conflicts', async () => {
      const newCriticalConflict: Conflict = {
        ...mockConflict,
        id: 'new-conflict',
        severity: 'critical'
      };

      mockAnalyzer.detectConflicts = jest.fn().mockResolvedValue([newCriticalConflict]);

      const resolutions = await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      expect(resolutions.size).toBe(0);
    });

    it('should accept resolutions with minor new conflicts', async () => {
      const newMinorConflict: Conflict = {
        ...mockConflict,
        id: 'new-conflict',
        severity: 'minor',
        metadata: { conflictScore: 0.3 }
      };

      mockAnalyzer.detectConflicts = jest.fn().mockResolvedValue([newMinorConflict]);

      const resolutions = await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      expect(resolutions.size).toBe(1);
    });
  });

  describe('Feature Extraction and Scoring', () => {
    it('should extract and use features for ML scoring', async () => {
      const historicalSuccess = 0.8;
      mockHistory.getSuccessRate = jest.fn().mockResolvedValue(historicalSuccess);

      await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      expect(mockHistory.getSuccessRate).toHaveBeenCalledWith(
        mockConflict.type,
        expect.any(String)
      );
    });

    it('should prioritize high-severity conflicts', async () => {
      const conflicts: Conflict[] = [
        { ...mockConflict, id: 'c1', severity: 'minor' },
        { ...mockConflict, id: 'c2', severity: 'critical' },
        { ...mockConflict, id: 'c3', severity: 'major' }
      ];

      await resolver.resolveConflicts(mockSchedule, conflicts);

      const analyzeCalls = mockAnalyzer.analyzeConflict.mock.calls;
      expect(analyzeCalls[0][0].id).toBe('c2'); // Critical first
      expect(analyzeCalls[1][0].id).toBe('c3'); // Then major
      expect(analyzeCalls[2][0].id).toBe('c1'); // Then minor
    });
  });

  describe('Error Handling', () => {
    it('should handle analysis errors gracefully', async () => {
      mockAnalyzer.analyzeConflict = jest.fn().mockRejectedValue(new Error('Analysis failed'));

      const resolutions = await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      expect(resolutions.size).toBe(0);
    });

    it('should handle resolution generation errors', async () => {
      mockStrategies.generateResolution = jest.fn().mockResolvedValue(null);

      const resolutions = await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      expect(resolutions.size).toBe(0);
    });

    it('should continue processing after individual conflict failures', async () => {
      const conflict1: Conflict = { ...mockConflict, id: 'conflict1' };
      const conflict2: Conflict = { ...mockConflict, id: 'conflict2' };

      mockAnalyzer.analyzeConflict = jest.fn()
        .mockRejectedValueOnce(new Error('Analysis failed'))
        .mockResolvedValueOnce(mockAnalysis);

      const resolutions = await resolver.resolveConflicts(mockSchedule, [conflict1, conflict2]);

      expect(resolutions.size).toBe(1);
      expect(resolutions.has('conflict2')).toBe(true);
    });
  });

  describe('Configuration Options', () => {
    it('should respect max resolution attempts', async () => {
      const resolver = new SmartConflictResolver({
        maxResolutionAttempts: 3
      });

      // Mock all strategies to fail validation
      mockStrategies.generateResolution = jest.fn().mockResolvedValue(mockResolution);
      mockAnalyzer.detectConflicts = jest.fn().mockResolvedValue([
        { ...mockConflict, severity: 'critical' }
      ]);

      await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      // Should try multiple strategies but respect the limit
      expect(mockStrategies.generateResolution.mock.calls.length).toBeLessThanOrEqual(4); // 4 strategies for venue conflicts
    });

    it('should use custom confidence threshold', async () => {
      const resolver = new SmartConflictResolver({
        confidenceThreshold: 0.9
      });

      const lowConfidenceResolution: Resolution = {
        ...mockResolution,
        feasibility: 0.85 // Below custom threshold
      };

      mockStrategies.generateResolution = jest.fn().mockResolvedValue(lowConfidenceResolution);

      const resolutions = await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      expect(resolutions.size).toBe(0);
    });
  });

  describe('Schedule Modification', () => {
    it('should apply accepted resolutions to schedule', async () => {
      const acceptedResolution: Resolution = {
        ...mockResolution,
        status: 'accepted'
      };

      mockStrategies.generateResolution = jest.fn().mockResolvedValue(acceptedResolution);

      await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      // Verify schedule was modified
      const modifiedGame = mockSchedule.games.find(g => g.id === 'game2');
      expect(modifiedGame?.time).toBe('21:00');
    });

    it('should not apply proposed resolutions to schedule', async () => {
      const proposedResolution: Resolution = {
        ...mockResolution,
        status: 'proposed'
      };

      mockStrategies.generateResolution = jest.fn().mockResolvedValue(proposedResolution);

      const originalTime = mockSchedule.games[1].time;
      await resolver.resolveConflicts(mockSchedule, [mockConflict]);

      // Verify schedule was not modified
      expect(mockSchedule.games[1].time).toBe(originalTime);
    });
  });
});