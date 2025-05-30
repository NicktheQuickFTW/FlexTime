// Jest setup file for constraint system v2 tests

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toBeValidConstraint(received) {
    const requiredFields = ['id', 'name', 'type', 'hardness', 'weight', 'scope', 'parameters', 'evaluation'];
    const missingFields = requiredFields.filter(field => !(field in received));
    
    if (missingFields.length === 0) {
      return {
        message: () => `expected constraint to be invalid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected valid constraint but missing fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
  },
});

// Global test utilities
global.createMockSchedule = (overrides = {}) => ({
  id: 'test-schedule',
  games: [],
  teams: [],
  venues: [],
  constraints: [],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0',
  },
  ...overrides,
});

global.createMockGame = (overrides = {}) => ({
  id: `game-${Math.random().toString(36).substr(2, 9)}`,
  homeTeamId: 'team1',
  awayTeamId: 'team2',
  date: new Date(),
  time: '19:00',
  venueId: 'venue1',
  sport: 'basketball',
  ...overrides,
});

global.createMockConstraint = (overrides = {}) => ({
  id: `constraint-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Constraint',
  type: 'TEMPORAL',
  hardness: 'SOFT',
  weight: 50,
  scope: {},
  parameters: {},
  evaluation: jest.fn().mockResolvedValue({
    constraintId: 'test',
    status: 'satisfied',
    score: 1.0,
    violations: [],
    suggestions: [],
  }),
  ...overrides,
});

// Performance tracking for slow tests
let testStartTime;

beforeEach(() => {
  testStartTime = Date.now();
});

afterEach(() => {
  const testEndTime = Date.now();
  const duration = testEndTime - testStartTime;
  
  if (duration > 5000) {
    console.warn(`Slow test detected: ${expect.getState().currentTestName} took ${duration}ms`);
  }
});

// Cleanup after all tests
afterAll(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});