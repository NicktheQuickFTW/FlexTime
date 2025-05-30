/**
 * Jest Configuration for Functional Equivalence Tests
 */

module.exports = {
  displayName: 'Functional Equivalence Tests',
  testMatch: [
    '<rootDir>/functional-equivalence/**/*.test.js',
    '<rootDir>/functional-equivalence/**/*.spec.js'
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/functional-equivalence/setup.js'
  ],
  collectCoverageFrom: [
    'functional-equivalence/**/*.js',
    '!functional-equivalence/**/*.test.js',
    '!functional-equivalence/**/*.spec.js',
    '!functional-equivalence/setup.js'
  ],
  coverageDirectory: '<rootDir>/reports/coverage/functional-equivalence',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  verbose: true,
  bail: false,
  maxWorkers: 4,
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/reports/html',
        filename: 'functional-equivalence-report.html',
        expand: true
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/reports/junit',
        outputName: 'functional-equivalence-results.xml'
      }
    ]
  ],
  globals: {
    TEST_TYPE: 'functional-equivalence'
  }
};