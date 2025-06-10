module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/testing', '<rootDir>/core', '<rootDir>/parameters'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'json'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/testing/setup.js'],
  testTimeout: 10000,
  verbose: true
};