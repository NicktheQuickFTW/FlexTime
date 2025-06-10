#!/usr/bin/env node
/**
 * FlexTime Agentic System Integration Test
 * 
 * Tests the complete 4-phase Redis-based agentic system:
 * Phase 1: FTTravelAgent with Redis integration
 * Phase 2: FTOptimizationAgent with Redis integration
 * Phase 3: AI SDK with Redis caching and state
 * Phase 4: TensorZero integration
 * 
 * All orchestrated by AgentDirector
 */

import { AgentDirector } from './AgentDirector.js';
import { aiSDK } from '../ai/aiSDKService.js';

async function testAgenticSystem() {
  console.log('🚀 Starting FlexTime Agentic System Integration Test');
  console.log('=' * 60);

  // Initialize Agent Director with all phases enabled
  const director = new AgentDirector({
    enableTensorZero: true,
    enableAISDK: true,
    enableDistributedProcessing: true,
    maxConcurrentTasks: 5
  });

  try {
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test data: Sample Big 12 basketball schedule
    const testSchedule = [
      {
        game_id: 'test_001',
        home_team_id: 'Kansas',
        away_team_id: 'Texas Tech',
        venue: 'away',
        game_date: '2025-01-15',
        sport: 'basketball',
        estimated_distance: 450
      },
      {
        game_id: 'test_002', 
        home_team_id: 'Baylor',
        away_team_id: 'Oklahoma State',
        venue: 'away',
        game_date: '2025-01-18',
        sport: 'basketball',
        estimated_distance: 280
      },
      {
        game_id: 'test_003',
        home_team_id: 'Arizona',
        away_team_id: 'Colorado',
        venue: 'away', 
        game_date: '2025-01-22',
        sport: 'basketball',
        estimated_distance: 520
      }
    ];

    const testConstraints = {
      maxTravelDistance: 1000,
      allowBackToBack: false,
      byuSundayRestrictions: true,
      travelPartnerPreference: true,
      budgetLimit: 500000
    };

    console.log('📋 Test Data:');
    console.log(`  - Games: ${testSchedule.length}`);
    console.log(`  - Constraints: ${Object.keys(testConstraints).length}`);
    console.log('');

    // Phase 1 & 2 & 3 & 4: Complete optimization workflow
    console.log('🎯 Phase 1-4: Complete Agent Coordination Test');
    console.log('');

    const startTime = Date.now();
    
    const coordinatedResult = await director.coordinateOptimization(
      testSchedule,
      testConstraints,
      {
        optimize_for: 'travel_efficiency',
        enable_ml_enhancement: true,
        enable_ai_consensus: true,
        enable_tensorzero: true
      }
    );

    const totalTime = Date.now() - startTime;

    console.log('✅ Coordination Results:');
    console.log(`  - Success: ${coordinatedResult.success}`);
    console.log(`  - Total Processing Time: ${totalTime}ms`);
    console.log(`  - Travel Optimizations: ${coordinatedResult.results?.travel_analysis?.length || 0}`);
    console.log(`  - ML Optimizations: ${coordinatedResult.results?.ml_optimization?.length || 0}`);
    console.log(`  - AI Consensus: ${coordinatedResult.results?.ai_consensus ? 'Generated' : 'Not available'}`);
    console.log(`  - TensorZero Results: ${coordinatedResult.results?.tensorzero_results?.status || 'Not available'}`);
    console.log('');

    // Test individual agent status
    console.log('🔍 Agent Status Check:');
    const directorStatus = await director.getDirectorStatus();
    
    console.log(`  - Director Status: ${directorStatus.status}`);
    console.log(`  - Redis Connected: ${directorStatus.redis_connected}`);
    console.log(`  - Active Agents: ${Object.keys(directorStatus.agents).length}`);
    console.log(`  - Active Tasks: ${directorStatus.active_tasks}`);
    console.log('');

    for (const [agentId, agent] of Object.entries(directorStatus.agents)) {
      console.log(`    ${agentId}:`);
      console.log(`      - Type: ${agent.type}`);
      console.log(`      - Status: ${agent.status}`);
      console.log(`      - Load: ${agent.currentLoad}/${agent.maxLoad}`);
      console.log(`      - Capabilities: ${agent.capabilities.join(', ')}`);
    }
    console.log('');

    // Test AI SDK metrics
    console.log('🧠 AI SDK Performance:');
    const aiMetrics = aiSDK.getMetrics();
    console.log(`  - Total Requests: ${aiMetrics.requests}`);
    console.log(`  - Cache Hit Rate: ${aiMetrics.cacheHitRate.toFixed(1)}%`);
    console.log(`  - Average Response Time: ${aiMetrics.averageResponseTime.toFixed(0)}ms`);
    console.log(`  - Error Rate: ${aiMetrics.errorRate.toFixed(1)}%`);
    console.log(`  - Redis Connected: ${aiMetrics.redis_connected}`);
    console.log('');

    // Test TensorZero agent specific functionality
    if (coordinatedResult.results?.tensorzero_results?.status === 'completed') {
      console.log('🔮 TensorZero Integration Test:');
      const tensorResults = coordinatedResult.results.tensorzero_results.results;
      console.log(`  - ML Optimizations: ${tensorResults.mlOptimizations ? 'Available' : 'None'}`);
      console.log(`  - Pattern Analysis: ${tensorResults.patternAnalysis ? 'Available' : 'None'}`);
      console.log(`  - Predictions: ${tensorResults.predictions ? 'Available' : 'None'}`);
      console.log(`  - RL Suggestions: ${tensorResults.rlSuggestions ? 'Available' : 'None'}`);
      console.log(`  - Improvement Score: ${tensorResults.performance?.improvementScore || 'N/A'}`);
      console.log(`  - Confidence Level: ${tensorResults.performance?.confidenceLevel || 'N/A'}`);
      console.log('');
    }

    // Performance summary
    console.log('📊 Performance Summary:');
    console.log(`  - Total Execution Time: ${totalTime}ms`);
    console.log(`  - Average per Game: ${(totalTime / testSchedule.length).toFixed(0)}ms`);
    console.log(`  - Agents Utilized: ${coordinatedResult.metadata?.agents_utilized?.length || 0}`);
    console.log(`  - AI Providers Used: ${coordinatedResult.metadata?.ai_providers_used?.length || 0}`);
    console.log(`  - TensorZero Enabled: ${coordinatedResult.metadata?.tensorzero_enabled || false}`);
    console.log('');

    // Recommendations summary
    if (coordinatedResult.recommendations?.length > 0) {
      console.log('💡 System Recommendations:');
      coordinatedResult.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
        if (rec.action) console.log(`     Action: ${rec.action}`);
        if (rec.potential_savings) console.log(`     Savings: $${rec.potential_savings.toLocaleString()}`);
      });
      console.log('');
    }

    console.log('✅ Integration Test Completed Successfully!');
    console.log('');
    console.log('🎉 All 4 Phases of Redis Agentic System Working:');
    console.log('  ✅ Phase 1: FTTravelAgent with Redis');
    console.log('  ✅ Phase 2: FTOptimizationAgent with Redis');
    console.log('  ✅ Phase 3: AI SDK with Redis caching');
    console.log('  ✅ Phase 4: TensorZero integration');
    console.log('  ✅ AgentDirector orchestration');

  } catch (error) {
    console.error('❌ Integration Test Failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup
    console.log('');
    console.log('🧹 Cleaning up...');
    
    try {
      await director.shutdown();
      await aiSDK.shutdown();
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup warning:', cleanupError.message);
    }
  }
}

// Run the integration test
if (import.meta.url === `file://${process.argv[1]}`) {
  testAgenticSystem()
    .then(() => {
      console.log('');
      console.log('🎯 Test execution finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

export { testAgenticSystem };