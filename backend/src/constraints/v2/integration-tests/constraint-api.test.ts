import request from 'supertest';
import express, { Application } from 'express';
import { constraintRoutes } from '../api/constraintRoutes';
import { ConstraintEngine } from '../core/ConstraintEngine';
import { ConstraintCache } from '../engines/ConstraintCache';
import { UnifiedConstraint, ScheduleSlot } from '../types';
import { StandardTemplates } from '../templates/StandardTemplates';

// Mock dependencies
jest.mock('../core/ConstraintEngine');
jest.mock('../engines/ConstraintCache');

describe('Constraint API Integration Tests', () => {
  let app: Application;
  let mockEngine: jest.Mocked<ConstraintEngine>;
  let mockCache: jest.Mocked<ConstraintCache>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/constraints', constraintRoutes);

    // Reset mocks
    mockEngine = new ConstraintEngine() as jest.Mocked<ConstraintEngine>;
    mockCache = new ConstraintCache() as jest.Mocked<ConstraintCache>;
  });

  describe('POST /api/constraints/evaluate', () => {
    test('should evaluate constraints for a schedule slot', async () => {
      const mockSlot: ScheduleSlot = {
        id: 'slot-1',
        date: new Date('2025-01-15'),
        time: '14:00',
        duration: 180,
        venue: 'Stadium A',
        sport: 'football',
        gameId: 'game-1',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        conference: 'Big 12',
        tvInfo: {
          network: 'ESPN',
          startTime: '14:00',
          duration: 180
        },
        requiredResources: ['Field', 'Lights'],
        constraints: ['venue-availability', 'team-rest']
      };

      const mockResults = [
        {
          constraintId: 'venue-availability',
          result: {
            valid: true,
            score: 1.0,
            violations: [],
            suggestions: []
          },
          evaluationTime: 25
        },
        {
          constraintId: 'team-rest',
          result: {
            valid: false,
            score: 0.3,
            violations: ['Team A played less than 5 days ago'],
            suggestions: ['Move game to next weekend']
          },
          evaluationTime: 35
        }
      ];

      mockEngine.evaluateSlot.mockResolvedValue({
        slot: mockSlot,
        overallValid: false,
        overallScore: 0.65,
        results: mockResults,
        totalTime: 60
      });

      const response = await request(app)
        .post('/api/constraints/evaluate')
        .send({ slot: mockSlot })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          slot: expect.objectContaining({ id: 'slot-1' }),
          overallValid: false,
          overallScore: 0.65,
          results: expect.arrayContaining([
            expect.objectContaining({ constraintId: 'venue-availability' }),
            expect.objectContaining({ constraintId: 'team-rest' })
          ])
        }
      });
    });

    test('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/constraints/evaluate')
        .send({ slot: { id: 'invalid' } }) // Missing required fields
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('validation')
      });
    });

    test('should handle engine errors gracefully', async () => {
      mockEngine.evaluateSlot.mockRejectedValue(
        new Error('Engine failure')
      );

      const response = await request(app)
        .post('/api/constraints/evaluate')
        .send({ 
          slot: {
            id: 'slot-1',
            date: new Date(),
            time: '14:00',
            duration: 180,
            venue: 'Stadium',
            sport: 'football'
          }
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Engine failure'
      });
    });
  });

  describe('POST /api/constraints/evaluate-batch', () => {
    test('should evaluate multiple slots in batch', async () => {
      const slots = [
        {
          id: 'slot-1',
          date: new Date('2025-01-15'),
          time: '14:00',
          duration: 180,
          venue: 'Stadium A',
          sport: 'football'
        },
        {
          id: 'slot-2',
          date: new Date('2025-01-16'),
          time: '19:00',
          duration: 180,
          venue: 'Stadium B',
          sport: 'football'
        }
      ];

      mockEngine.evaluateBatch.mockResolvedValue([
        {
          slot: slots[0],
          overallValid: true,
          overallScore: 0.9,
          results: [],
          totalTime: 50
        },
        {
          slot: slots[1],
          overallValid: false,
          overallScore: 0.4,
          results: [],
          totalTime: 45
        }
      ]);

      const response = await request(app)
        .post('/api/constraints/evaluate-batch')
        .send({ slots })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].overallValid).toBe(true);
      expect(response.body.data[1].overallValid).toBe(false);
    });

    test('should handle empty batch', async () => {
      const response = await request(app)
        .post('/api/constraints/evaluate-batch')
        .send({ slots: [] })
        .expect(400);

      expect(response.body.error).toContain('empty');
    });
  });

  describe('GET /api/constraints', () => {
    test('should list all available constraints', async () => {
      const mockConstraints = [
        {
          id: 'venue-availability',
          type: 'venue',
          sport: 'football',
          name: 'Venue Availability',
          priority: 'required',
          metadata: {
            description: 'Ensures venue is available',
            tags: ['venue', 'scheduling']
          }
        },
        {
          id: 'team-rest',
          type: 'team',
          sport: 'football',
          name: 'Team Rest Period',
          priority: 'high',
          metadata: {
            description: 'Ensures adequate rest between games',
            tags: ['team', 'health']
          }
        }
      ];

      mockEngine.getAllConstraints.mockReturnValue(mockConstraints);

      const response = await request(app)
        .get('/api/constraints')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].id).toBe('venue-availability');
    });

    test('should filter constraints by sport', async () => {
      const allConstraints = [
        { id: 'football-1', sport: 'football', type: 'venue' },
        { id: 'basketball-1', sport: 'basketball', type: 'venue' },
        { id: 'football-2', sport: 'football', type: 'team' }
      ];

      mockEngine.getAllConstraints.mockReturnValue(allConstraints);

      const response = await request(app)
        .get('/api/constraints?sport=football')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(c => c.sport === 'football')).toBe(true);
    });

    test('should filter constraints by type', async () => {
      const allConstraints = [
        { id: 'c1', type: 'venue', sport: 'football' },
        { id: 'c2', type: 'team', sport: 'football' },
        { id: 'c3', type: 'venue', sport: 'basketball' }
      ];

      mockEngine.getAllConstraints.mockReturnValue(allConstraints);

      const response = await request(app)
        .get('/api/constraints?type=venue')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(c => c.type === 'venue')).toBe(true);
    });
  });

  describe('GET /api/constraints/:id', () => {
    test('should get constraint by ID', async () => {
      const mockConstraint = {
        id: 'venue-availability',
        type: 'venue',
        sport: 'football',
        name: 'Venue Availability',
        version: '1.0.0',
        priority: 'required',
        metadata: {
          author: 'system',
          description: 'Ensures venue is available',
          tags: ['venue', 'scheduling'],
          created: new Date(),
          updated: new Date()
        }
      };

      mockEngine.getConstraint.mockReturnValue(mockConstraint);

      const response = await request(app)
        .get('/api/constraints/venue-availability')
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: 'venue-availability',
        name: 'Venue Availability'
      });
    });

    test('should return 404 for non-existent constraint', async () => {
      mockEngine.getConstraint.mockReturnValue(null);

      const response = await request(app)
        .get('/api/constraints/non-existent')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/constraints', () => {
    test('should create new constraint', async () => {
      const newConstraint = {
        id: 'custom-venue-check',
        type: 'venue',
        sport: 'football',
        name: 'Custom Venue Check',
        priority: 'medium',
        evaluate: 'function(slot) { return { valid: true, score: 1 }; }',
        metadata: {
          description: 'Custom venue validation',
          tags: ['custom', 'venue']
        }
      };

      mockEngine.addConstraint.mockImplementation((constraint) => {
        return constraint;
      });

      const response = await request(app)
        .post('/api/constraints')
        .send(newConstraint)
        .expect(201);

      expect(response.body.data.id).toBe('custom-venue-check');
      expect(mockEngine.addConstraint).toHaveBeenCalled();
    });

    test('should validate constraint data', async () => {
      const invalidConstraint = {
        // Missing required fields
        type: 'venue'
      };

      const response = await request(app)
        .post('/api/constraints')
        .send(invalidConstraint)
        .expect(400);

      expect(response.body.error).toContain('validation');
    });
  });

  describe('PUT /api/constraints/:id', () => {
    test('should update existing constraint', async () => {
      const updates = {
        priority: 'high',
        metadata: {
          description: 'Updated description',
          tags: ['updated']
        }
      };

      mockEngine.updateConstraint.mockResolvedValue({
        id: 'venue-availability',
        ...updates
      });

      const response = await request(app)
        .put('/api/constraints/venue-availability')
        .send(updates)
        .expect(200);

      expect(response.body.data.priority).toBe('high');
      expect(mockEngine.updateConstraint).toHaveBeenCalledWith(
        'venue-availability',
        updates
      );
    });
  });

  describe('DELETE /api/constraints/:id', () => {
    test('should delete constraint', async () => {
      mockEngine.removeConstraint.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/constraints/custom-constraint')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockEngine.removeConstraint).toHaveBeenCalledWith('custom-constraint');
    });

    test('should prevent deletion of system constraints', async () => {
      const response = await request(app)
        .delete('/api/constraints/venue-availability')
        .expect(403);

      expect(response.body.error).toContain('system constraint');
    });
  });

  describe('GET /api/constraints/templates', () => {
    test('should list available templates', async () => {
      const response = await request(app)
        .get('/api/constraints/templates')
        .expect(200);

      expect(response.body.data).toContain('venue_availability');
      expect(response.body.data).toContain('team_rest_days');
      expect(response.body.data).toContain('broadcast_windows');
    });
  });

  describe('POST /api/constraints/from-template', () => {
    test('should create constraint from template', async () => {
      const templateRequest = {
        templateId: 'venue_availability',
        parameters: {
          venueId: 'stadium-a',
          sport: 'football'
        }
      };

      mockEngine.addConstraint.mockImplementation((constraint) => constraint);

      const response = await request(app)
        .post('/api/constraints/from-template')
        .send(templateRequest)
        .expect(201);

      expect(response.body.data.id).toContain('venue-availability');
      expect(mockEngine.addConstraint).toHaveBeenCalled();
    });
  });

  describe('GET /api/constraints/performance', () => {
    test('should return performance metrics', async () => {
      const mockMetrics = {
        totalEvaluations: 1000,
        averageEvaluationTime: 45.5,
        constraintStats: [
          {
            constraintId: 'venue-availability',
            evaluationCount: 500,
            averageTime: 30,
            successRate: 0.95
          },
          {
            constraintId: 'team-rest',
            evaluationCount: 500,
            averageTime: 61,
            successRate: 0.82
          }
        ]
      };

      mockEngine.getPerformanceMetrics.mockReturnValue(mockMetrics);

      const response = await request(app)
        .get('/api/constraints/performance')
        .expect(200);

      expect(response.body.data).toMatchObject(mockMetrics);
    });
  });

  describe('POST /api/constraints/validate', () => {
    test('should validate constraint configuration', async () => {
      const constraintConfig = {
        id: 'test-constraint',
        type: 'venue',
        sport: 'football',
        evaluate: 'function(slot) { return { valid: true }; }'
      };

      const response = await request(app)
        .post('/api/constraints/validate')
        .send(constraintConfig)
        .expect(200);

      expect(response.body).toMatchObject({
        valid: true,
        issues: []
      });
    });

    test('should detect invalid configurations', async () => {
      const invalidConfig = {
        id: 'test-constraint',
        type: 'invalid-type',
        evaluate: 'not a function'
      };

      const response = await request(app)
        .post('/api/constraints/validate')
        .send(invalidConfig)
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.issues).toContain(
        expect.stringContaining('type')
      );
    });
  });

  describe('Caching Integration', () => {
    test('should use cache for repeated evaluations', async () => {
      const slot = {
        id: 'slot-1',
        date: new Date(),
        time: '14:00',
        duration: 180,
        venue: 'Stadium',
        sport: 'football'
      };

      // First call - cache miss
      mockCache.get.mockResolvedValue(null);
      mockEngine.evaluateSlot.mockResolvedValue({
        slot,
        overallValid: true,
        overallScore: 0.9,
        results: [],
        totalTime: 50
      });

      await request(app)
        .post('/api/constraints/evaluate')
        .send({ slot })
        .expect(200);

      expect(mockCache.get).toHaveBeenCalled();
      expect(mockEngine.evaluateSlot).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();

      // Second call - cache hit
      mockCache.get.mockResolvedValue({
        overallValid: true,
        overallScore: 0.9,
        results: [],
        totalTime: 5 // Cached response is faster
      });
      mockEngine.evaluateSlot.mockClear();

      const response = await request(app)
        .post('/api/constraints/evaluate')
        .send({ slot })
        .expect(200);

      expect(mockCache.get).toHaveBeenCalled();
      expect(mockEngine.evaluateSlot).not.toHaveBeenCalled();
      expect(response.body.data.totalTime).toBe(5);
    });
  });
});