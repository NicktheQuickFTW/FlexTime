# Load Testing Suite

This directory contains comprehensive load testing scenarios for the Flextime scheduling system using K6 and JMeter.

## Test Types

### K6 Tests
- **baseline-test.js**: Standard load testing for normal traffic patterns
- **spike-test.js**: Sudden traffic spike testing
- **stress-test.js**: High load sustained testing  
- **soak-test.js**: Long-duration stability testing
- **volume-test.js**: Database and data volume testing

### JMeter Tests
- **flextime-baseline.jmx**: GUI-based baseline load test
- **flextime-api-suite.jmx**: Comprehensive API testing
- **flextime-concurrent-users.jmx**: Concurrent user simulation
- **flextime-database-load.jmx**: Database performance testing

## Scenarios
Each test scenario includes:
- Ramp-up patterns
- Load profiles  
- Success criteria
- Performance thresholds
- Environment configurations

## Test Data
- User profiles and authentication data
- Schedule generation payloads
- Institution and team data
- Sport-specific test scenarios

## Execution
Use the automation scripts in `automation/` to run tests consistently across environments.

## Reporting
Results are automatically collected and reported in the `reports/` directory with trend analysis and threshold validation.