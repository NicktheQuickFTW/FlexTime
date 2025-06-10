// Jest setup file for travel optimization tests

// Mock external dependencies that might not be available during testing
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Global test utilities
global.mockTeam = (name, coords = { latitude: 40.0, longitude: -95.0 }) => ({
  school_name: name,
  ...coords
});

global.mockGame = (homeTeam, awayTeam, date = '2025-10-15') => ({
  home_team_id: homeTeam,
  away_team_id: awayTeam,
  game_date: date,
  sport: 'football'
});

global.mockContext = (overrides = {}) => ({
  getTeam: (id) => global.mockTeam(id),
  getSeasonTravelBudgetUsed: () => 2000000,
  getTravelPartySize: () => 110,
  getGamesInWeekend: () => [],
  getRosterSize: () => 85,
  sport: 'football',
  ...overrides
});