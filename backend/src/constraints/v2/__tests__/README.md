# Flextime Constraint System v2 Test Suite

This directory contains comprehensive tests for the Flextime constraint system v2.

## Test Coverage

### 1. Constraint Engine Tests (`constraint-engine.test.ts`)
- Engine configuration and initialization
- Constraint evaluation with various scenarios
- Incremental evaluation capabilities
- Constraint grouping strategies
- Cache management and warming
- Performance monitoring
- Score calculation and suggestion generation

### 2. Conflict Resolution Tests (`conflict-resolver.test.ts`)
- Smart conflict resolution with ML-based strategy selection
- Strategy selection for different conflict types
- Resolution validation and application
- Feature extraction and scoring
- Error handling and recovery
- Configuration options

### 3. ML Optimizer Tests (`ml-optimizer.test.ts`)
- Model initialization and loading
- Weight prediction for single and batch constraints
- Model training with datasets
- Feature extraction and normalization
- Explainability features
- Performance metrics calculation
- Tensor management and cleanup

### 4. Template System Tests (`template-system.test.ts`)
- Template registration and validation
- Constraint creation from templates
- Template variations and cloning
- Evaluator generation from templates
- Import/export functionality
- Template search and retrieval

### 5. Migration Tests (`migration.test.ts`)
- Legacy constraint migration
- Type and hardness mapping
- Parameter migration
- ID preservation options
- Backup creation
- Validation and error handling
- Migration statistics and reporting

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test constraint-engine.test.ts
```

### Run with coverage
```bash
npm test -- --coverage
```

### Run in watch mode
```bash
npm test -- --watch
```

### Run with verbose output
```bash
npm test -- --verbose
```

## Test Configuration

Tests are configured using:
- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Global test setup and utilities

### Custom Matchers

The test suite includes custom Jest matchers:
- `toBeWithinRange(floor, ceiling)` - Check if a number is within a range
- `toBeValidConstraint()` - Validate constraint structure

### Global Test Utilities

Helper functions available in all tests:
- `createMockSchedule(overrides)` - Create a mock schedule
- `createMockGame(overrides)` - Create a mock game
- `createMockConstraint(overrides)` - Create a mock constraint

## Coverage Requirements

The test suite enforces minimum coverage thresholds:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Mock Strategy

### Mocked Dependencies
- File system operations (`fs/promises`)
- TensorFlow.js for ML tests
- External services and APIs

### Mock Best Practices
1. Mocks are cleared between tests
2. Original implementations are restored after each test
3. Mock implementations match expected interfaces

## Test Organization

Each test file follows this structure:
1. Import statements and mock setup
2. Test fixtures and constants
3. `beforeEach` setup
4. Grouped test suites using `describe`
5. Individual test cases using `it`
6. Cleanup in `afterEach` if needed

## Writing New Tests

When adding new tests:
1. Follow the existing naming convention
2. Group related tests using `describe`
3. Use meaningful test descriptions
4. Include both positive and negative test cases
5. Test error conditions and edge cases
6. Mock external dependencies appropriately
7. Clean up resources (tensors, timers, etc.)

## Performance Considerations

- Tests have a 30-second timeout
- Slow tests (>5 seconds) are logged as warnings
- Use `beforeAll` for expensive setup operations
- Dispose of TensorFlow tensors to prevent memory leaks

## Debugging Tests

### Enable console output
```bash
DEBUG=true npm test
```

### Run single test
```javascript
it.only('should test specific functionality', () => {
  // test code
});
```

### Skip test
```javascript
it.skip('should skip this test', () => {
  // test code
});
```

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:
- Exit with non-zero code on failure
- Generate coverage reports in multiple formats
- Support parallel test execution
- Provide detailed error messages

## Maintenance

### Updating Mocks
When implementation changes:
1. Update mock return values
2. Verify mock method signatures
3. Check for new dependencies to mock

### Adding Test Cases
For new features:
1. Add tests before implementation (TDD)
2. Cover happy path and error cases
3. Test integration points
4. Verify performance characteristics