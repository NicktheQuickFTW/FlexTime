/**
 * Jest Configuration for Integration Tests
 */

module.exports = {
  displayName: 'Integration Tests',
  testMatch: [
    '<rootDir>/integration-tests/**/*.test.js',
    '<rootDir>/integration-tests/**/*.spec.js'
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/integration-tests/setup.js'
  ],
  collectCoverageFrom: [
    'integration-tests/**/*.js',
    '!integration-tests/**/*.test.js',
    '!integration-tests/**/*.spec.js',
    '!integration-tests/setup.js'
  ],
  coverageDirectory: '<rootDir>/reports/coverage/integration-tests',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 45000,
  verbose: true,
  bail: false,
  maxWorkers: 2,
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/reports/html',
        filename: 'integration-test-report.html',
        expand: true
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/reports/junit',
        outputName: 'integration-test-results.xml'
      }
    ]
  ],
  globals: {
    TEST_TYPE: 'integration'
  }
};