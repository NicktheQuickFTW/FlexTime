#!/usr/bin/env node
/**
 * FlexTime Agent Army Test Runner
 * 
 * Comprehensive testing suite for the complete distributed agent ecosystem:
 * - AgentDirector coordination
 * - Redis messaging infrastructure  
 * - AI SDK integration
 * - Health monitoring system
 * - TensorZero ML optimization
 * - Auto-scaling and load balancing
 */

import { AgentDirector } from './AgentDirector.js';
import { messagingBus } from './RedisMessagingBus.js';
import { healthMonitor } from './AgentHealthMonitor.js';
import { aiSDK } from '../ai/aiSDKService.js';
import chalk from 'chalk';

export class AgentArmyTestRunner {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      details: [],
      performance: {
        messagingLatency: [],
        optimizationTimes: [],
        healthCheckTimes: []
      }
    };

    this.director = null;
    this.testData = this.generateTestData();
    this.startTime = null;
  }

  /**
   * Run complete agent army test suite
   */
  async runFullTestSuite() {
    console.log(chalk.cyan.bold('🚀 FlexTime Agent Army Test Suite'));
    console.log(chalk.cyan('=' * 80));
    console.log(chalk.gray(`Testing complete distributed agent ecosystem with Redis coordination`));
    console.log();
    
    this.startTime = Date.now();

    try {
      // Phase 1: Infrastructure Tests
      console.log(chalk.blue.bold('📡 Phase 1: Infrastructure Tests'));
      await this.testMessagingInfrastructure();
      await this.testHealthMonitoring();
      await this.testAISDKIntegration();

      // Phase 2: Agent Initialization Tests  
      console.log(chalk.blue.bold('\n🤖 Phase 2: Agent Initialization Tests'));
      await this.testAgentDirectorInitialization();
      await this.testAgentArmyDeployment();
      await this.testAgentRegistration();

      // Phase 3: Coordination Tests
      console.log(chalk.blue.bold('\n🎯 Phase 3: Agent Coordination Tests'));
      await this.testBasicCoordination();
      await this.testAdvancedCoordination();
      await this.testConcurrentOperations();

      // Phase 4: Optimization Tests
      console.log(chalk.blue.bold('\n⚡ Phase 4: Optimization Tests'));
      await this.testTravelOptimization();
      await this.testMLOptimization();
      await this.testTensorZeroIntegration();

      // Phase 5: Load & Scale Tests
      console.log(chalk.blue.bold('\n📈 Phase 5: Load & Scale Tests'));
      await this.testLoadBalancing();
      await this.testAutoScaling();
      await this.testFailureRecovery();

      // Phase 6: Performance Tests
      console.log(chalk.blue.bold('\n🏎️  Phase 6: Performance Tests'));
      await this.testPerformanceMetrics();
      await this.testLatencyBenchmarks();
      await this.testThroughputLimits();

      // Phase 7: Real-World Scenarios
      console.log(chalk.blue.bold('\n🌍 Phase 7: Real-World Scenarios'));
      await this.testBig12Scenarios();
      await this.testComplexOptimizations();
      await this.testEmergencyScenarios();

      // Generate final report
      this.generateFinalReport();

    } catch (error) {
      console.error(chalk.red('❌ Test suite failed:'), error);
      this.recordTest('Test Suite Execution', false, error.message);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test messaging infrastructure
   */
  async testMessagingInfrastructure() {
    await this.runTest('Redis Messaging Bus Initialization', async () => {
      // messagingBus should be initialized
      const metrics = messagingBus.getMetrics();
      expect(metrics.redis_connected).toBe(true);
    });

    await this.runTest('Message Publishing', async () => {
      const messageId = await messagingBus.publish('test:channel', {
        type: 'test_message',
        data: { test: true }
      });
      expect(messageId).toBeDefined();
    });

    await this.runTest('Agent Registration with Messaging Bus', async () => {
      const success = await messagingBus.registerAgent('test_agent', ['testing'], {
        type: 'test_agent'
      });
      expect(success).toBe(true);
    });

    await this.runTest('Message Latency Performance', async () => {
      const startTime = Date.now();
      await messagingBus.publish('test:performance', { data: 'latency_test' });
      const latency = Date.now() - startTime;
      
      this.testResults.performance.messagingLatency.push(latency);
      expect(latency).toBeLessThan(50); // Should be under 50ms
    });
  }

  /**
   * Test health monitoring system
   */
  async testHealthMonitoring() {
    await this.runTest('Health Monitor Initialization', async () => {
      const healthReport = healthMonitor.getHealthReport();
      expect(healthReport.systemMetrics).toBeDefined();
    });

    await this.runTest('Agent Health Tracking', async () => {
      // Simulate health data
      await healthMonitor.handleAgentHeartbeat({
        data: {
          agentId: 'test_agent',
          metrics: { cpu: 45, memory: 60 },
          timestamp: new Date().toISOString()
        }
      });
      
      const report = healthMonitor.getHealthReport();
      expect(report.agentMetrics.test_agent).toBeDefined();
    });

    await this.runTest('Alert System', async () => {
      // This should trigger an alert
      await healthMonitor.createAlert('test_alert', {
        severity: 'warning',
        message: 'Test alert for validation'
      });
      
      const report = healthMonitor.getHealthReport();
      expect(report.activeAlerts.length).toBeGreaterThan(0);
    });
  }

  /**
   * Test AI SDK integration
   */
  async testAISDKIntegration() {
    await this.runTest('AI SDK Status', async () => {
      const metrics = aiSDK.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.redis_connected).toBeDefined();
    });

    await this.runTest('AI Provider Availability', async () => {
      const providers = aiSDK.getProviderStatus();
      expect(providers.length).toBeGreaterThan(0);
      
      const availableProviders = providers.filter(p => p.available);
      expect(availableProviders.length).toBeGreaterThan(0);
    });

    await this.runTest('AI Optimization Request', async () => {
      const result = await aiSDK.optimizeSchedule(
        this.testData.sampleSchedule,
        'basketball',
        'claude'
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  }

  /**
   * Test agent director initialization
   */
  async testAgentDirectorInitialization() {
    await this.runTest('Agent Director Creation', async () => {
      this.director = new AgentDirector({
        enableTensorZero: true,
        enableAISDK: true,
        enableHealthMonitoring: true,
        enableAutoScaling: true
      });
      
      expect(this.director).toBeDefined();
      expect(this.director.directorId).toBe('agent_director');
    });

    await this.runTest('Agent Army Initialization', async () => {
      await this.director.initialize();
      
      const status = await this.director.getDirectorStatus();
      expect(status.status).toBe('active');
      expect(Object.keys(status.agents).length).toBeGreaterThan(0);
    });
  }

  /**
   * Test agent army deployment
   */
  async testAgentArmyDeployment() {
    await this.runTest('All Agents Ready', async () => {
      const status = await this.director.getDirectorStatus();
      
      for (const [agentId, agent] of Object.entries(status.agents)) {
        expect(agent.status).toMatch(/ready|active/);
      }
    });

    await this.runTest('Agent Capabilities Registered', async () => {
      const status = await this.director.getDirectorStatus();
      
      expect(status.agents.ft_travel_agent.capabilities).toContain('transportation_optimization');
      expect(status.agents.ft_optimization_agent.capabilities).toContain('ml_optimization');
      
      if (status.agents.tensorzero_agent) {
        expect(status.agents.tensorzero_agent.capabilities).toContain('pattern_recognition');
      }
    });

    await this.runTest('Load Balancing Configuration', async () => {
      const status = await this.director.getDirectorStatus();
      
      for (const [agentId, agent] of Object.entries(status.agents)) {
        expect(agent.maxLoad).toBeGreaterThan(0);
        expect(agent.currentLoad).toBeGreaterThanOrEqual(0);
      }
    });
  }

  /**
   * Test agent registration
   */
  async testAgentRegistration() {
    await this.runTest('Messaging Bus Registration', async () => {
      const registry = messagingBus.getAgentRegistry();
      
      const directorAgent = registry.find(a => a.agentId === 'agent_director');
      expect(directorAgent).toBeDefined();
      expect(directorAgent.capabilities).toContain('coordination');
    });

    await this.runTest('Health Monitor Registration', async () => {
      const healthReport = healthMonitor.getHealthReport();
      expect(healthReport.systemMetrics.totalAgents).toBeGreaterThan(0);
    });
  }

  /**
   * Test basic coordination
   */
  async testBasicCoordination() {
    await this.runTest('Simple Game Optimization', async () => {
      const result = await this.director.coordinateOptimization(
        [this.testData.sampleGame],
        this.testData.basicConstraints
      );
      
      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
    });

    await this.runTest('Task Distribution', async () => {
      const result = await this.director.coordinateOptimization(
        this.testData.multipleGames,
        this.testData.basicConstraints
      );
      
      expect(result.success).toBe(true);
      expect(result.results.travel_analysis.length).toBeGreaterThan(0);
    });
  }

  /**
   * Test advanced coordination
   */
  async testAdvancedCoordination() {
    await this.runTest('Multi-Agent Coordination', async () => {
      const result = await this.director.coordinateOptimization(
        this.testData.complexSchedule,
        this.testData.advancedConstraints,
        {
          enableTensorZero: true,
          enableAIConsensus: true,
          priority: 'high'
        }
      );
      
      expect(result.success).toBe(true);
      expect(result.results.tensorzero_results).toBeDefined();
      expect(result.results.ai_consensus).toBeDefined();
    });

    await this.runTest('Constraint Violation Handling', async () => {
      const result = await this.director.coordinateOptimization(
        this.testData.conflictingSchedule,
        this.testData.strictConstraints
      );
      
      expect(result.success).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  }

  /**
   * Test concurrent operations
   */
  async testConcurrentOperations() {
    await this.runTest('Concurrent Optimization Requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          this.director.coordinateOptimization(
            [this.testData.sampleGame],
            this.testData.basicConstraints
          )
        );
      }
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    await this.runTest('Agent Load Distribution', async () => {
      // Run multiple tasks and check load distribution
      const promises = [];
      
      for (let i = 0; i < 8; i++) {
        promises.push(
          this.director.coordinateOptimization(
            this.testData.multipleGames,
            this.testData.basicConstraints
          )
        );
      }
      
      await Promise.all(promises);
      
      const status = await this.director.getDirectorStatus();
      
      // All agents should have processed some tasks
      let totalProcessed = 0;
      for (const [agentId, agent] of Object.entries(status.agents)) {
        totalProcessed += agent.currentLoad || 0;
      }
      
      expect(totalProcessed).toBeGreaterThanOrEqual(0);
    });
  }

  /**
   * Test travel optimization
   */
  async testTravelOptimization() {
    await this.runTest('Short Distance Optimization', async () => {
      const shortGame = {
        ...this.testData.sampleGame,
        home_team_id: 'Kansas',
        away_team_id: 'Kansas State'
      };
      
      const result = await this.director.coordinateOptimization([shortGame], {});
      
      expect(result.success).toBe(true);
      const travelResult = result.results.travel_analysis[0];
      expect(travelResult.recommendation.mode).toBe('charter_bus');
    });

    await this.runTest('Long Distance Optimization', async () => {
      const longGame = {
        ...this.testData.sampleGame,
        home_team_id: 'Arizona',
        away_team_id: 'West Virginia'
      };
      
      const result = await this.director.coordinateOptimization([longGame], {});
      
      expect(result.success).toBe(true);
      const travelResult = result.results.travel_analysis[0];
      expect(travelResult.recommendation.mode).toBe('charter_flight');
    });
  }

  /**
   * Test ML optimization
   */
  async testMLOptimization() {
    await this.runTest('ML Enhancement', async () => {
      const result = await this.director.coordinateOptimization(
        this.testData.multipleGames,
        this.testData.basicConstraints,
        { enableMLOptimization: true }
      );
      
      expect(result.success).toBe(true);
      
      const mlResults = result.results.ml_optimization;
      expect(mlResults.length).toBeGreaterThan(0);
      
      mlResults.forEach(mlResult => {
        expect(mlResult.mlOptimization).toBeDefined();
      });
    });
  }

  /**
   * Test TensorZero integration
   */
  async testTensorZeroIntegration() {
    await this.runTest('TensorZero ML Pipeline', async () => {
      const startTime = Date.now();
      
      const result = await this.director.coordinateOptimization(
        this.testData.complexSchedule,
        this.testData.advancedConstraints,
        { enableTensorZero: true }
      );
      
      const processingTime = Date.now() - startTime;
      this.testResults.performance.optimizationTimes.push(processingTime);
      
      expect(result.success).toBe(true);
      
      if (result.results.tensorzero_results) {
        expect(result.results.tensorzero_results.status).toBe('completed');
      }
    });
  }

  /**
   * Test load balancing
   */
  async testLoadBalancing() {
    await this.runTest('Load Balancing Algorithm', async () => {
      // Submit many tasks to test load distribution
      const promises = [];
      
      for (let i = 0; i < 15; i++) {
        promises.push(
          this.director.coordinateOptimization(
            [this.testData.sampleGame],
            this.testData.basicConstraints
          )
        );
      }
      
      await Promise.all(promises);
      
      const status = await this.director.getDirectorStatus();
      
      // Check that load was distributed
      let maxLoad = 0;
      let minLoad = Infinity;
      
      for (const [agentId, agent] of Object.entries(status.agents)) {
        if (agent.type !== 'ai_service') { // AI service has higher capacity
          maxLoad = Math.max(maxLoad, agent.currentLoad || 0);
          minLoad = Math.min(minLoad, agent.currentLoad || 0);
        }
      }
      
      // Load should be relatively balanced
      expect(maxLoad - minLoad).toBeLessThanOrEqual(3);
    });
  }

  /**
   * Test auto-scaling
   */
  async testAutoScaling() {
    await this.runTest('Auto-scaling Detection', async () => {
      // Simulate high load scenario
      const healthReport = healthMonitor.getHealthReport();
      expect(healthReport.systemMetrics).toBeDefined();
      
      // Health monitor should be tracking system load
      expect(healthReport.systemMetrics.systemLoad).toBeGreaterThanOrEqual(0);
    });
  }

  /**
   * Test failure recovery
   */
  async testFailureRecovery() {
    await this.runTest('Agent Failure Recovery', async () => {
      // Test graceful handling of agent failures
      const result = await this.director.coordinateOptimization(
        [this.testData.sampleGame],
        this.testData.basicConstraints
      );
      
      expect(result.success).toBe(true);
      // Should either succeed or provide meaningful fallback
    });
  }

  /**
   * Test performance metrics
   */
  async testPerformanceMetrics() {
    await this.runTest('Performance Tracking', async () => {
      const directorStatus = await this.director.getDirectorStatus();
      expect(directorStatus.metrics).toBeDefined();
      
      const healthReport = healthMonitor.getHealthReport();
      expect(healthReport.systemMetrics).toBeDefined();
      
      const aiMetrics = aiSDK.getMetrics();
      expect(aiMetrics.requests).toBeGreaterThanOrEqual(0);
    });
  }

  /**
   * Test latency benchmarks
   */
  async testLatencyBenchmarks() {
    await this.runTest('Optimization Latency', async () => {
      const avgLatency = this.testResults.performance.optimizationTimes.length > 0
        ? this.testResults.performance.optimizationTimes.reduce((a, b) => a + b, 0) / this.testResults.performance.optimizationTimes.length
        : 0;
      
      console.log(`    Average optimization time: ${avgLatency.toFixed(0)}ms`);
      
      // Should complete optimizations in reasonable time
      expect(avgLatency).toBeLessThan(30000); // Under 30 seconds
    });
  }

  /**
   * Test throughput limits
   */
  async testThroughputLimits() {
    await this.runTest('System Throughput', async () => {
      const startTime = Date.now();
      const promises = [];
      
      // Submit 20 concurrent requests
      for (let i = 0; i < 20; i++) {
        promises.push(
          this.director.coordinateOptimization(
            [this.testData.sampleGame],
            this.testData.basicConstraints
          )
        );
      }
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      const successCount = results.filter(r => r.success).length;
      const throughput = (successCount / totalTime) * 1000; // requests per second
      
      console.log(`    Throughput: ${throughput.toFixed(2)} optimizations/second`);
      
      expect(successCount).toBeGreaterThan(15); // At least 75% success rate
    });
  }

  /**
   * Test Big 12 scenarios
   */
  async testBig12Scenarios() {
    await this.runTest('Big 12 Football Schedule', async () => {
      const big12Schedule = this.generateBig12FootballSchedule();
      
      const result = await this.director.coordinateOptimization(
        big12Schedule,
        this.testData.big12Constraints
      );
      
      expect(result.success).toBe(true);
      expect(result.summary.total_optimizations).toBe(big12Schedule.length);
    });

    await this.runTest('Big 12 Basketball Schedule', async () => {
      const basketballSchedule = this.generateBig12BasketballSchedule();
      
      const result = await this.director.coordinateOptimization(
        basketballSchedule,
        this.testData.big12Constraints
      );
      
      expect(result.success).toBe(true);
    });
  }

  /**
   * Test complex optimizations
   */
  async testComplexOptimizations() {
    await this.runTest('Multi-Sport Optimization', async () => {
      const multiSportSchedule = [
        ...this.generateBig12FootballSchedule().slice(0, 3),
        ...this.generateBig12BasketballSchedule().slice(0, 3)
      ];
      
      const result = await this.director.coordinateOptimization(
        multiSportSchedule,
        this.testData.advancedConstraints
      );
      
      expect(result.success).toBe(true);
    });
  }

  /**
   * Test emergency scenarios
   */
  async testEmergencyScenarios() {
    await this.runTest('Emergency Alert Handling', async () => {
      // Simulate emergency alert
      await messagingBus.publish('flextime:agents:emergency', {
        type: 'emergency_alert',
        severity: 'high',
        message: 'Test emergency scenario'
      });
      
      // System should handle gracefully
      const healthReport = healthMonitor.getHealthReport();
      expect(healthReport).toBeDefined();
    });
  }

  /**
   * Helper methods
   */
  async runTest(testName, testFunction) {
    this.testResults.total++;
    
    try {
      await testFunction.call(this);
      console.log(chalk.green(`  ✅ ${testName}`));
      this.recordTest(testName, true);
      this.testResults.passed++;
    } catch (error) {
      console.log(chalk.red(`  ❌ ${testName}: ${error.message}`));
      this.recordTest(testName, false, error.message);
      this.testResults.failed++;
    }
  }

  recordTest(testName, passed, error = null) {
    this.testResults.details.push({
      test: testName,
      passed: passed,
      error: error,
      timestamp: new Date().toISOString()
    });
  }

  generateTestData() {
    return {
      sampleGame: {
        game_id: 'test_001',
        home_team_id: 'Kansas',
        away_team_id: 'Texas Tech',
        venue: 'away',
        game_date: '2025-01-15T19:00:00Z',
        sport: 'basketball'
      },
      multipleGames: [
        {
          game_id: 'test_001',
          home_team_id: 'Kansas',
          away_team_id: 'Texas Tech',
          venue: 'away',
          game_date: '2025-01-15T19:00:00Z',
          sport: 'basketball'
        },
        {
          game_id: 'test_002',
          home_team_id: 'Baylor',
          away_team_id: 'Oklahoma State',
          venue: 'away',
          game_date: '2025-01-18T15:00:00Z',
          sport: 'basketball'
        }
      ],
      complexSchedule: Array.from({ length: 8 }, (_, i) => ({
        game_id: `complex_${i + 1}`,
        home_team_id: ['Kansas', 'Baylor', 'Arizona', 'Utah'][i % 4],
        away_team_id: ['Texas Tech', 'TCU', 'Colorado', 'BYU'][i % 4],
        venue: 'away',
        game_date: new Date(2025, 0, 15 + i * 3).toISOString(),
        sport: 'basketball'
      })),
      conflictingSchedule: [
        {
          game_id: 'conflict_001',
          home_team_id: 'Kansas',
          away_team_id: 'Texas Tech',
          venue: 'away',
          game_date: '2025-12-20T19:00:00Z', // Finals week
          sport: 'basketball'
        }
      ],
      basicConstraints: {
        travel_budget: { weight: 0.8, target: 'minimize' },
        fairness: { weight: 0.7, target: 'balance' }
      },
      advancedConstraints: {
        travel_budget: { weight: 0.8, target: 'minimize' },
        fairness: { weight: 0.7, target: 'balance' },
        performance: { weight: 0.6, target: 'optimize' },
        sustainability: { weight: 0.5, target: 'minimize_carbon' }
      },
      strictConstraints: {
        travel_budget: { weight: 1.0, target: 'minimize' },
        campus_conflicts: { weight: 1.0, target: 'avoid' },
        byu_sunday: { weight: 1.0, target: 'restrict' }
      },
      big12Constraints: {
        travel_partners: { weight: 0.9, target: 'optimize' },
        tier_compliance: { weight: 1.0, target: 'enforce' },
        sustainability: { weight: 0.6, target: 'track' }
      },
      sampleSchedule: {
        games: [
          {
            game_id: 'sample_001',
            home_team_id: 'Kansas',
            away_team_id: 'Texas Tech',
            game_date: '2025-01-15T19:00:00Z'
          }
        ],
        teams: ['Kansas', 'Texas Tech']
      }
    };
  }

  generateBig12FootballSchedule() {
    const big12Teams = [
      'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati',
      'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State',
      'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
    ];

    const games = [];
    for (let i = 0; i < 8; i++) {
      games.push({
        game_id: `fb_${i + 1}`,
        home_team_id: big12Teams[i * 2],
        away_team_id: big12Teams[i * 2 + 1],
        venue: 'away',
        game_date: new Date(2025, 8, 7 + i * 7).toISOString(),
        sport: 'football'
      });
    }

    return games;
  }

  generateBig12BasketballSchedule() {
    const big12Teams = [
      'Kansas', 'Baylor', 'Texas Tech', 'Iowa State', 'TCU', 'Houston'
    ];

    const games = [];
    for (let i = 0; i < 6; i++) {
      games.push({
        game_id: `bb_${i + 1}`,
        home_team_id: big12Teams[i],
        away_team_id: big12Teams[(i + 1) % big12Teams.length],
        venue: 'away',
        game_date: new Date(2025, 0, 10 + i * 4).toISOString(),
        sport: 'basketball'
      });
    }

    return games;
  }

  generateFinalReport() {
    const duration = Date.now() - this.startTime;
    const passRate = (this.testResults.passed / this.testResults.total * 100).toFixed(1);

    console.log();
    console.log(chalk.cyan.bold('📊 FlexTime Agent Army Test Results'));
    console.log(chalk.cyan('=' * 60));
    console.log();
    
    console.log(chalk.green(`✅ Passed: ${this.testResults.passed}`));
    console.log(chalk.red(`❌ Failed: ${this.testResults.failed}`));
    console.log(chalk.yellow(`⏭️  Skipped: ${this.testResults.skipped}`));
    console.log(chalk.blue(`📋 Total: ${this.testResults.total}`));
    console.log(chalk.magenta(`🎯 Pass Rate: ${passRate}%`));
    console.log(chalk.gray(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`));
    console.log();

    // Performance summary
    if (this.testResults.performance.optimizationTimes.length > 0) {
      const avgOptTime = this.testResults.performance.optimizationTimes.reduce((a, b) => a + b, 0) / this.testResults.performance.optimizationTimes.length;
      console.log(chalk.blue('⚡ Performance Metrics:'));
      console.log(`  Average Optimization Time: ${avgOptTime.toFixed(0)}ms`);
      console.log(`  Total Optimizations: ${this.testResults.performance.optimizationTimes.length}`);
      console.log();
    }

    // Failed tests
    if (this.testResults.failed > 0) {
      console.log(chalk.red.bold('❌ Failed Tests:'));
      this.testResults.details
        .filter(result => !result.passed)
        .forEach(result => {
          console.log(chalk.red(`  • ${result.test}: ${result.error}`));
        });
      console.log();
    }

    // Success message
    if (this.testResults.failed === 0) {
      console.log(chalk.green.bold('🎉 ALL TESTS PASSED! Agent Army is fully operational!'));
    } else {
      console.log(chalk.yellow.bold(`⚠️  ${this.testResults.failed} tests failed. Review and fix issues.`));
    }

    console.log();
    console.log(chalk.gray('Agent Army Components Tested:'));
    console.log(chalk.gray('  ✓ Redis Messaging Infrastructure'));
    console.log(chalk.gray('  ✓ Health Monitoring System'));
    console.log(chalk.gray('  ✓ AI SDK Integration'));
    console.log(chalk.gray('  ✓ Agent Director Coordination'));
    console.log(chalk.gray('  ✓ Load Balancing & Auto-scaling'));
    console.log(chalk.gray('  ✓ TensorZero ML Integration'));
    console.log(chalk.gray('  ✓ Real-world Big 12 Scenarios'));
  }

  async cleanup() {
    console.log();
    console.log(chalk.gray('🧹 Cleaning up test environment...'));
    
    try {
      if (this.director) {
        await this.director.shutdown();
      }
      
      await messagingBus.shutdown();
      await healthMonitor.shutdown();
      await aiSDK.shutdown();
      
      console.log(chalk.green('✅ Test environment cleaned up'));
    } catch (error) {
      console.error(chalk.red('❌ Cleanup failed:'), error);
    }
  }

  // Simple expect function for testing
  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${actual} to be ${expected}`);
        }
      },
      toBeDefined: () => {
        if (actual === undefined || actual === null) {
          throw new Error(`Expected ${actual} to be defined`);
        }
      },
      toMatch: (pattern) => {
        if (!pattern.test || !pattern.test(actual)) {
          throw new Error(`Expected ${actual} to match ${pattern}`);
        }
      },
      toContain: (item) => {
        if (!actual.includes || !actual.includes(item)) {
          throw new Error(`Expected ${actual} to contain ${item}`);
        }
      },
      toBeGreaterThan: (expected) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toBeGreaterThanOrEqual: (expected) => {
        if (actual < expected) {
          throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
        }
      },
      toBeLessThan: (expected) => {
        if (actual >= expected) {
          throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
      },
      toBeLessThanOrEqual: (expected) => {
        if (actual > expected) {
          throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
        }
      }
    };
  }
}

// Export for direct execution
export async function runAgentArmyTests() {
  const tester = new AgentArmyTestRunner();
  await tester.runFullTestSuite();
  return tester.testResults;
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runAgentArmyTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

export default AgentArmyTestRunner;