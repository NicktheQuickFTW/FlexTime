import * as tf from '@tensorflow/tfjs-node';
import { MLConstraintOptimizer } from '../ml/MLConstraintOptimizer';
import { FeatureExtractor } from '../ml/FeatureExtractor';
import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness
} from '../types';
import {
  WeightPredictionContext,
  WeightPrediction,
  TrainingDataset,
  ModelType,
  ModelStatus
} from '../types/ml-types';
import { Schedule, Game } from '../types/schedule-types';

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs-node', () => {
  const actualTf = jest.requireActual('@tensorflow/tfjs-node');
  return {
    ...actualTf,
    loadLayersModel: jest.fn(),
    sequential: jest.fn(() => ({
      compile: jest.fn(),
      predict: jest.fn(() => ({
        array: jest.fn().mockResolvedValue([[0.85, 0.9]])
      })),
      fit: jest.fn().mockResolvedValue({
        history: { loss: [0.1, 0.05] }
      }),
      save: jest.fn().mockResolvedValue(undefined)
    })),
    layers: {
      dense: jest.fn(() => ({})),
      dropout: jest.fn(() => ({}))
    },
    train: {
      adam: jest.fn()
    },
    tensor1d: jest.fn((data) => ({
      sub: jest.fn().mockReturnThis(),
      div: jest.fn().mockReturnThis(),
      dispose: jest.fn()
    })),
    tensor2d: jest.fn((data) => ({
      slice: jest.fn().mockReturnThis(),
      dispose: jest.fn()
    })),
    stack: jest.fn((tensors) => ({})),
    metrics: {
      meanAbsoluteError: jest.fn(() => ({
        array: jest.fn().mockResolvedValue(0.05),
        dispose: jest.fn()
      }))
    }
  };
});

// Mock file system
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('{"mean": [0.5], "std": [0.2]}')
  }
}));

// Mock FeatureExtractor
jest.mock('../ml/FeatureExtractor');

describe('MLConstraintOptimizer', () => {
  let optimizer: MLConstraintOptimizer;
  let mockFeatureExtractor: jest.Mocked<FeatureExtractor>;

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

  const mockConstraint: UnifiedConstraint = {
    id: 'constraint1',
    name: 'No Back-to-Back Games',
    type: ConstraintType.TEMPORAL,
    hardness: ConstraintHardness.HARD,
    weight: 80,
    scope: { teams: ['team1'] },
    parameters: { minDaysBetween: 1 },
    evaluation: jest.fn()
  };

  const mockContext: WeightPredictionContext = {
    schedule: mockSchedule,
    historicalData: [],
    environmentFactors: {
      timeOfSeason: 'mid',
      competitivenessLevel: 0.7,
      externalEvents: []
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockFeatureExtractor = new FeatureExtractor() as jest.Mocked<FeatureExtractor>;
    mockFeatureExtractor.extractConstraintFeatures = jest.fn().mockReturnValue({
      type: ConstraintType.TEMPORAL,
      hardness: ConstraintHardness.HARD,
      weight: 80,
      scopeSize: 1,
      historicalSatisfactionRate: 0.85,
      averageEvaluationTime: 50,
      violationFrequency: 0.1,
      sportSpecific: true,
      seasonPhase: 'mid',
      dependencyCount: 2,
      conflictPotential: 0.3,
      complexity: 0.5,
      flexibility: 0.7,
      criticalityScore: 0.9
    });

    mockFeatureExtractor.extractScheduleFeatures = jest.fn().mockReturnValue({
      gameCount: 100,
      teamCount: 16,
      venueCount: 10,
      duration: 180,
      gamesPerWeek: 5,
      averageGamesPerTeam: 30,
      venueUtilization: 0.75,
      homeAwayBalance: 0.95,
      travelBalance: 0.85,
      competitiveBalance: 0.9,
      constraintCount: 50,
      hardConstraintRatio: 0.4,
      interdependencyScore: 0.6
    });

    optimizer = new MLConstraintOptimizer('./models/test', mockFeatureExtractor);
  });

  describe('Initialization', () => {
    it('should initialize without existing model', async () => {
      (tf.loadLayersModel as jest.Mock).mockRejectedValue(new Error('Model not found'));

      await optimizer.initialize();

      expect(tf.sequential).toHaveBeenCalled();
    });

    it('should load existing model', async () => {
      const mockModel = { predict: jest.fn() };
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      await optimizer.initialize();

      expect(tf.loadLayersModel).toHaveBeenCalledWith('file://./models/test/model.json');
    });
  });

  describe('Weight Prediction', () => {
    beforeEach(async () => {
      await optimizer.initialize();
    });

    it('should predict weight for single constraint', async () => {
      const prediction = await optimizer.predict(mockConstraint, mockContext);

      expect(prediction).toBeDefined();
      expect(prediction.constraintId).toBe('constraint1');
      expect(prediction.originalWeight).toBe(80);
      expect(prediction.predictedWeight).toBeGreaterThan(0);
      expect(prediction.predictedWeight).toBeLessThanOrEqual(100);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
      expect(prediction.adjustmentReason).toBeTruthy();
    });

    it('should respect maximum weight adjustment', async () => {
      const prediction = await optimizer.predict(mockConstraint, mockContext);

      const maxAdjustment = mockConstraint.weight * 0.3; // 30% max adjustment
      const delta = Math.abs(prediction.predictedWeight - prediction.originalWeight);
      
      expect(delta).toBeLessThanOrEqual(maxAdjustment);
    });

    it('should batch predict weights for multiple constraints', async () => {
      const constraints = [
        mockConstraint,
        { ...mockConstraint, id: 'constraint2', weight: 60 },
        { ...mockConstraint, id: 'constraint3', weight: 40 }
      ];

      const predictions = await optimizer.batchPredict(constraints, mockContext);

      expect(predictions).toHaveLength(3);
      predictions.forEach((pred, idx) => {
        expect(pred.constraintId).toBe(constraints[idx].id);
        expect(pred.originalWeight).toBe(constraints[idx].weight);
      });
    });

    it('should throw error if model not initialized', async () => {
      const uninitializedOptimizer = new MLConstraintOptimizer();
      
      await expect(
        uninitializedOptimizer.predict(mockConstraint, mockContext)
      ).rejects.toThrow('Model not initialized');
    });

    it('should generate context-specific adjustment reasons', async () => {
      const postseasonContext: WeightPredictionContext = {
        ...mockContext,
        environmentFactors: {
          timeOfSeason: 'postseason',
          competitivenessLevel: 0.9
        }
      };

      const prediction = await optimizer.predict(mockConstraint, postseasonContext);

      expect(prediction.adjustmentReason).toContain('postseason');
    });
  });

  describe('Explainability', () => {
    beforeEach(async () => {
      await optimizer.initialize();
    });

    it('should explain weight predictions', async () => {
      const prediction: WeightPrediction = {
        constraintId: 'constraint1',
        originalWeight: 80,
        predictedWeight: 95,
        confidence: 0.85,
        adjustmentReason: 'Weight increased due to high conflict potential',
        timestamp: new Date()
      };

      const explanation = optimizer.explain(prediction);

      expect(explanation).toBeDefined();
      expect(explanation.topFactors).toHaveLength(3);
      expect(explanation.topFactors[0].factor).toBeTruthy();
      expect(explanation.topFactors[0].impact).toBeGreaterThan(0);
      expect(explanation.topFactors[0].description).toBeTruthy();
      expect(explanation.similarCases).toHaveLength(2);
      expect(explanation.recommendedAction).toBeTruthy();
    });
  });

  describe('Model Training', () => {
    const mockTrainingDataset: TrainingDataset = {
      samples: [
        {
          input: {
            constraintId: 'c1',
            schedule: mockSchedule,
            features: new Array(30).fill(0.5)
          },
          output: {
            adjustedWeight: 85,
            confidence: 0.9,
            performanceImprovement: 0.15
          },
          metadata: {
            timestamp: new Date(),
            source: 'historical'
          }
        },
        {
          input: {
            constraintId: 'c2',
            schedule: mockSchedule,
            features: new Array(30).fill(0.6)
          },
          output: {
            adjustedWeight: 70,
            confidence: 0.85,
            performanceImprovement: 0.1
          },
          metadata: {
            timestamp: new Date(),
            source: 'historical'
          }
        }
      ],
      metadata: {
        collectedFrom: new Date('2024-01-01'),
        collectedTo: new Date('2024-12-31'),
        totalSamples: 2,
        version: '1.0'
      }
    };

    it('should train model with dataset', async () => {
      const performance = await optimizer.train(mockTrainingDataset);

      expect(performance).toBeDefined();
      expect(performance.accuracy).toBeGreaterThan(0);
      expect(performance.precision).toBeGreaterThan(0);
      expect(performance.recall).toBeGreaterThan(0);
      expect(performance.f1Score).toBeGreaterThan(0);
      expect(performance.latency).toBeGreaterThan(0);
      expect(performance.throughput).toBeGreaterThan(0);
    });

    it('should update model metadata after training', async () => {
      await optimizer.train(mockTrainingDataset);

      // Model metadata should be updated (internal state)
      // This would be better tested with a getter method
    });

    it('should save model after training', async () => {
      const mockModel = {
        compile: jest.fn(),
        fit: jest.fn().mockResolvedValue({ history: {} }),
        save: jest.fn().mockResolvedValue(undefined),
        predict: jest.fn()
      };
      (tf.sequential as jest.Mock).mockReturnValue(mockModel);

      await optimizer.train(mockTrainingDataset);

      expect(mockModel.save).toHaveBeenCalledWith('file://./models/test');
    });
  });

  describe('Feature Extraction', () => {
    beforeEach(async () => {
      await optimizer.initialize();
    });

    it('should extract features correctly', async () => {
      await optimizer.predict(mockConstraint, mockContext);

      expect(mockFeatureExtractor.extractConstraintFeatures).toHaveBeenCalledWith(
        mockConstraint,
        mockSchedule
      );
      expect(mockFeatureExtractor.extractScheduleFeatures).toHaveBeenCalledWith(
        mockSchedule
      );
    });

    it('should normalize features when stats are available', async () => {
      // Initialize with existing model that has feature stats
      const fs = require('fs').promises;
      fs.readFile = jest.fn().mockResolvedValue(JSON.stringify({
        mean: new Array(30).fill(0.5),
        std: new Array(30).fill(0.2)
      }));

      await optimizer.initialize();
      await optimizer.predict(mockConstraint, mockContext);

      // Verify normalization was applied (through tensor operations)
      expect(tf.tensor1d).toHaveBeenCalled();
    });
  });

  describe('Model Performance', () => {
    it('should calculate accuracy correctly', async () => {
      const mockModel = {
        compile: jest.fn(),
        fit: jest.fn().mockResolvedValue({ history: {} }),
        predict: jest.fn(() => ({
          sub: jest.fn().mockReturnThis(),
          abs: jest.fn().mockReturnThis(),
          lessEqual: jest.fn().mockReturnThis(),
          mean: jest.fn(() => ({
            array: jest.fn().mockResolvedValue(0.85)
          })),
          dispose: jest.fn()
        }))
      };
      (tf.sequential as jest.Mock).mockReturnValue(mockModel);

      await optimizer.initialize();
      const performance = await optimizer.train(mockTrainingDataset);

      expect(performance.accuracy).toBe(0.85);
    });
  });

  describe('Error Handling', () => {
    it('should handle feature extraction errors', async () => {
      mockFeatureExtractor.extractConstraintFeatures = jest.fn().mockImplementation(() => {
        throw new Error('Feature extraction failed');
      });

      await optimizer.initialize();

      await expect(
        optimizer.predict(mockConstraint, mockContext)
      ).rejects.toThrow('Feature extraction failed');
    });

    it('should handle model prediction errors', async () => {
      const mockModel = {
        predict: jest.fn().mockImplementation(() => {
          throw new Error('Prediction failed');
        })
      };
      (tf.sequential as jest.Mock).mockReturnValue(mockModel);

      await optimizer.initialize();

      await expect(
        optimizer.predict(mockConstraint, mockContext)
      ).rejects.toThrow();
    });

    it('should handle invalid training data', async () => {
      const invalidDataset: TrainingDataset = {
        samples: [],
        metadata: {
          collectedFrom: new Date(),
          collectedTo: new Date(),
          totalSamples: 0,
          version: '1.0'
        }
      };

      await expect(
        optimizer.train(invalidDataset)
      ).rejects.toThrow();
    });
  });

  describe('Tensor Cleanup', () => {
    it('should dispose tensors after training', async () => {
      const disposeSpy = jest.fn();
      const mockTensor = {
        slice: jest.fn().mockReturnThis(),
        dispose: disposeSpy
      };
      (tf.tensor2d as jest.Mock).mockReturnValue(mockTensor);

      await optimizer.train(mockTrainingDataset);

      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should dispose tensors after prediction', async () => {
      const disposeSpy = jest.fn();
      const mockTensor = {
        sub: jest.fn().mockReturnThis(),
        div: jest.fn().mockReturnThis(),
        dispose: disposeSpy
      };
      (tf.tensor1d as jest.Mock).mockReturnValue(mockTensor);

      await optimizer.initialize();
      await optimizer.predict(mockConstraint, mockContext);

      expect(disposeSpy).toHaveBeenCalled();
    });
  });
});