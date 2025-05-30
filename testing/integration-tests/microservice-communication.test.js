/**
 * Microservice Communication Integration Tests
 * 
 * Tests inter-service communication, API contracts, and data flow
 * between microservices in the new architecture.
 */

const axios = require('axios');
const WebSocket = require('ws');
const Redis = require('ioredis');
const logger = require('../utilities/logger');
const config = require('../config/test.config');

describe('Microservice Communication Integration', () => {
  let redis;
  let apiGateway;
  let schedulerService;
  let teamService;
  let notificationService;

  beforeAll(async () => {
    logger.info('Setting up microservice communication tests');

    // Initialize service clients
    apiGateway = axios.create({
      baseURL: config.microservices.apiGateway.baseUrl,
      timeout: config.microservices.apiGateway.timeout
    });

    schedulerService = axios.create({
      baseURL: config.microservices.services.scheduler.baseUrl,
      timeout: config.microservices.services.scheduler.timeout
    });

    teamService = axios.create({
      baseURL: config.microservices.services.teamManagement.baseUrl,
      timeout: config.microservices.services.teamManagement.timeout
    });

    notificationService = axios.create({
      baseURL: config.microservices.services.notification.baseUrl,
      timeout: config.microservices.services.notification.timeout
    });

    // Initialize Redis for event testing
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      db: process.env.REDIS_DB || 1 // Use test database
    });

    // Verify all services are available
    await Promise.all([
      verifyServiceHealth(apiGateway, 'API Gateway'),
      verifyServiceHealth(schedulerService, 'Scheduler Service'),
      verifyServiceHealth(teamService, 'Team Service'),
      verifyServiceHealth(notificationService, 'Notification Service')
    ]);

    logger.info('Microservice communication test setup completed');
  });

  afterAll(async () => {
    if (redis) {
      await redis.disconnect();
    }
    logger.info('Microservice communication tests cleanup completed');
  });

  describe('API Gateway Integration', () => {
    test('API Gateway should route requests to scheduler service', async () => {
      const timer = logger.startTimer('api-gateway-scheduler-routing');

      try {
        logger.testStart('API Gateway Scheduler Routing');

        // Create a test schedule request through API Gateway
        const scheduleRequest = {
          sport: 'football',
          teams: [
            { id: 'team1', name: 'Team 1' },
            { id: 'team2', name: 'Team 2' }
          ],
          parameters: {
            algorithm: 'round_robin',
            season: '2025-26'
          }
        };

        const response = await apiGateway.post('/api/scheduler/schedules/generate', scheduleRequest);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('games');
        expect(response.headers).toHaveProperty('x-service-route');
        expect(response.headers['x-service-route']).toBe('scheduler-service');

        logger.testComplete('API Gateway Scheduler Routing', true, {
          scheduleId: response.data.id,
          routedService: response.headers['x-service-route']
        });

      } catch (error) {
        logger.testComplete('API Gateway Scheduler Routing', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });

    test('API Gateway should route requests to team service', async () => {
      const timer = logger.startTimer('api-gateway-team-routing');

      try {
        logger.testStart('API Gateway Team Routing');

        const response = await apiGateway.get('/api/teams');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBeTruthy();
        expect(response.headers).toHaveProperty('x-service-route');
        expect(response.headers['x-service-route']).toBe('team-service');

        logger.testComplete('API Gateway Team Routing', true, {
          teamCount: response.data.length,
          routedService: response.headers['x-service-route']
        });

      } catch (error) {
        logger.testComplete('API Gateway Team Routing', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });

    test('API Gateway should handle service failures gracefully', async () => {
      const timer = logger.startTimer('api-gateway-failure-handling');

      try {
        logger.testStart('API Gateway Failure Handling');

        // Try to access a non-existent endpoint
        try {
          await apiGateway.get('/api/non-existent-service/test');
          throw new Error('Expected request to fail');
        } catch (error) {
          expect(error.response.status).toBe(404);
          expect(error.response.data).toHaveProperty('error');
        }

        // Try to access a valid service with invalid data
        try {
          await apiGateway.post('/api/scheduler/schedules/generate', {
            invalid: 'data'
          });
        } catch (error) {
          expect(error.response.status).toBe(400);
          expect(error.response.data).toHaveProperty('error');
        }

        logger.testComplete('API Gateway Failure Handling', true);

      } catch (error) {
        logger.testComplete('API Gateway Failure Handling', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });
  });

  describe('Service-to-Service Communication', () => {
    test('Scheduler service should communicate with team service', async () => {
      const timer = logger.startTimer('scheduler-team-communication');

      try {
        logger.testStart('Scheduler-Team Service Communication');

        // First, ensure we have teams in the team service
        const teamsResponse = await teamService.get('/teams');
        expect(teamsResponse.status).toBe(200);
        const teams = teamsResponse.data.slice(0, 4); // Use first 4 teams

        // Now create a schedule that should trigger team service calls
        const scheduleRequest = {
          sport: 'basketball',
          teamIds: teams.map(t => t.id),
          parameters: {
            algorithm: 'round_robin',
            season: '2025-26'
          }
        };

        const scheduleResponse = await schedulerService.post('/schedules/generate', scheduleRequest);

        expect(scheduleResponse.status).toBe(200);
        expect(scheduleResponse.data).toHaveProperty('teams');
        expect(scheduleResponse.data.teams.length).toBe(teams.length);

        // Verify that team data was enriched by team service
        scheduleResponse.data.teams.forEach(team => {
          expect(team).toHaveProperty('name');
          expect(team).toHaveProperty('id');
        });

        logger.testComplete('Scheduler-Team Service Communication', true, {
          scheduleId: scheduleResponse.data.id,
          teamCount: scheduleResponse.data.teams.length
        });

      } catch (error) {
        logger.testComplete('Scheduler-Team Service Communication', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });

    test('Schedule generation should trigger notification service', async () => {
      const timer = logger.startTimer('schedule-notification-integration');

      try {
        logger.testStart('Schedule-Notification Integration');

        // Subscribe to notification events
        const notificationPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Notification timeout')), 10000);
          
          redis.subscribe('schedule.generated', (err) => {
            if (err) reject(err);
          });

          redis.on('message', (channel, message) => {
            if (channel === 'schedule.generated') {
              clearTimeout(timeout);
              resolve(JSON.parse(message));
            }
          });
        });

        // Generate a schedule
        const scheduleRequest = {
          sport: 'volleyball',
          teams: [
            { id: 'team1', name: 'Team 1' },
            { id: 'team2', name: 'Team 2' },
            { id: 'team3', name: 'Team 3' },
            { id: 'team4', name: 'Team 4' }
          ],
          parameters: {
            algorithm: 'round_robin',
            season: '2025-26'
          }
        };

        const scheduleResponse = await schedulerService.post('/schedules/generate', scheduleRequest);
        expect(scheduleResponse.status).toBe(200);

        // Wait for notification event
        const notification = await notificationPromise;
        
        expect(notification).toHaveProperty('scheduleId');
        expect(notification).toHaveProperty('eventType');
        expect(notification.eventType).toBe('schedule.generated');
        expect(notification.scheduleId).toBe(scheduleResponse.data.id);

        logger.testComplete('Schedule-Notification Integration', true, {
          scheduleId: scheduleResponse.data.id,
          notificationReceived: true
        });

      } catch (error) {
        logger.testComplete('Schedule-Notification Integration', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });
  });

  describe('Event-Driven Communication', () => {
    test('Team updates should propagate across services', async () => {
      const timer = logger.startTimer('team-update-propagation');

      try {
        logger.testStart('Team Update Propagation');

        // Subscribe to team update events
        const eventPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Event timeout')), 10000);
          
          redis.subscribe('team.updated', (err) => {
            if (err) reject(err);
          });

          redis.on('message', (channel, message) => {
            if (channel === 'team.updated') {
              clearTimeout(timeout);
              resolve(JSON.parse(message));
            }
          });
        });

        // Update a team
        const teamUpdate = {
          name: 'Updated Team Name',
          mascot: 'Updated Mascot'
        };

        // First create a team to update
        const createResponse = await teamService.post('/teams', {
          id: 'test-team-update',
          name: 'Test Team',
          mascot: 'Test Mascot',
          city: 'Test City',
          state: 'TS'
        });

        expect(createResponse.status).toBe(201);

        // Now update the team
        const updateResponse = await teamService.put(`/teams/${createResponse.data.id}`, teamUpdate);
        expect(updateResponse.status).toBe(200);

        // Wait for event propagation
        const event = await eventPromise;
        
        expect(event).toHaveProperty('teamId');
        expect(event).toHaveProperty('eventType');
        expect(event.eventType).toBe('team.updated');
        expect(event.teamId).toBe(createResponse.data.id);

        logger.testComplete('Team Update Propagation', true, {
          teamId: createResponse.data.id,
          eventReceived: true
        });

      } catch (error) {
        logger.testComplete('Team Update Propagation', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });

    test('Event ordering should be maintained', async () => {
      const timer = logger.startTimer('event-ordering-test');

      try {
        logger.testStart('Event Ordering Test');

        const events = [];
        const expectedEventCount = 3;

        // Subscribe to multiple event types
        const eventPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (events.length < expectedEventCount) {
              reject(new Error(`Only received ${events.length} of ${expectedEventCount} expected events`));
            }
          }, 15000);

          redis.psubscribe('schedule.*', (err) => {
            if (err) reject(err);
          });

          redis.on('pmessage', (pattern, channel, message) => {
            events.push({
              channel,
              data: JSON.parse(message),
              timestamp: Date.now()
            });

            if (events.length >= expectedEventCount) {
              clearTimeout(timeout);
              resolve(events);
            }
          });
        });

        // Trigger multiple events in sequence
        const scheduleRequest = {
          sport: 'soccer',
          teams: [
            { id: 'team1', name: 'Team 1' },
            { id: 'team2', name: 'Team 2' }
          ],
          parameters: {
            algorithm: 'round_robin',
            season: '2025-26'
          }
        };

        // Generate schedule (should trigger multiple events)
        const scheduleResponse = await schedulerService.post('/schedules/generate', scheduleRequest);
        expect(scheduleResponse.status).toBe(200);

        // Wait for all events
        const receivedEvents = await eventPromise;
        
        expect(receivedEvents.length).toBeGreaterThanOrEqual(expectedEventCount);
        
        // Verify events are in chronological order
        for (let i = 1; i < receivedEvents.length; i++) {
          expect(receivedEvents[i].timestamp).toBeGreaterThanOrEqual(receivedEvents[i - 1].timestamp);
        }

        logger.testComplete('Event Ordering Test', true, {
          eventsReceived: receivedEvents.length,
          eventsInOrder: true
        });

      } catch (error) {
        logger.testComplete('Event Ordering Test', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });
  });

  describe('Circuit Breaker and Resilience', () => {
    test('Circuit breaker should activate on service failures', async () => {
      const timer = logger.startTimer('circuit-breaker-test');

      try {
        logger.testStart('Circuit Breaker Test');

        // Simulate service failures by making requests to invalid endpoints
        const failureCount = 6; // Should exceed circuit breaker threshold
        const failures = [];

        for (let i = 0; i < failureCount; i++) {
          try {
            await schedulerService.get('/invalid-endpoint');
          } catch (error) {
            failures.push(error.response?.status || 'network_error');
          }
        }

        expect(failures.length).toBe(failureCount);

        // Subsequent request should be short-circuited
        const start = Date.now();
        try {
          await schedulerService.get('/another-invalid-endpoint');
        } catch (error) {
          const duration = Date.now() - start;
          
          // Circuit breaker should fail fast (much faster than normal timeout)
          expect(duration).toBeLessThan(1000);
          expect(error.message).toContain('circuit');
        }

        logger.testComplete('Circuit Breaker Test', true, {
          failureCount: failures.length,
          circuitActivated: true
        });

      } catch (error) {
        logger.testComplete('Circuit Breaker Test', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });

    test('Service should recover after circuit breaker timeout', async () => {
      const timer = logger.startTimer('circuit-breaker-recovery-test');

      try {
        logger.testStart('Circuit Breaker Recovery Test');

        // Wait for circuit breaker to reset (based on config)
        await new Promise(resolve => setTimeout(resolve, config.integration.circuitBreaker.resetTimeout));

        // Service should be available again
        const response = await schedulerService.get('/health');
        expect(response.status).toBe(200);

        logger.testComplete('Circuit Breaker Recovery Test', true, {
          serviceRecovered: true
        });

      } catch (error) {
        logger.testComplete('Circuit Breaker Recovery Test', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });
  });

  describe('Data Consistency', () => {
    test('Data should be consistent across service boundaries', async () => {
      const timer = logger.startTimer('data-consistency-test');

      try {
        logger.testStart('Data Consistency Test');

        // Create a team through team service
        const teamData = {
          id: 'consistency-test-team',
          name: 'Consistency Test Team',
          mascot: 'Test Mascot',
          city: 'Test City',
          state: 'TS'
        };

        const createResponse = await teamService.post('/teams', teamData);
        expect(createResponse.status).toBe(201);

        // Verify team appears in scheduler service
        const schedulerTeamsResponse = await schedulerService.get('/teams');
        const teamInScheduler = schedulerTeamsResponse.data.find(t => t.id === teamData.id);
        
        expect(teamInScheduler).toBeDefined();
        expect(teamInScheduler.name).toBe(teamData.name);

        // Update team through team service
        const updatedData = {
          name: 'Updated Consistency Test Team',
          mascot: 'Updated Test Mascot'
        };

        const updateResponse = await teamService.put(`/teams/${teamData.id}`, updatedData);
        expect(updateResponse.status).toBe(200);

        // Give time for eventual consistency
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify update propagated to scheduler service
        const updatedSchedulerTeamsResponse = await schedulerService.get('/teams');
        const updatedTeamInScheduler = updatedSchedulerTeamsResponse.data.find(t => t.id === teamData.id);
        
        expect(updatedTeamInScheduler).toBeDefined();
        expect(updatedTeamInScheduler.name).toBe(updatedData.name);

        logger.testComplete('Data Consistency Test', true, {
          teamId: teamData.id,
          dataConsistent: true
        });

      } catch (error) {
        logger.testComplete('Data Consistency Test', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });
  });
});

/**
 * Verify service health
 * @param {Object} serviceClient - Axios client for the service
 * @param {string} serviceName - Name of the service
 * @returns {Promise<boolean>} Health check result
 */
async function verifyServiceHealth(serviceClient, serviceName) {
  try {
    const response = await serviceClient.get('/health');
    if (response.status === 200) {
      logger.info(`${serviceName} is healthy`);
      return true;
    }
  } catch (error) {
    logger.error(`${serviceName} health check failed:`, error.message);
    throw new Error(`${serviceName} is not available for testing`);
  }
}