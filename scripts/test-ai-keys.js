#!/usr/bin/env node
/**
 * AI API Keys Test Script
 * 
 * Tests all AI provider API keys to ensure they're working
 * and can successfully make requests to each service.
 */

require('dotenv').config();
const { openai } = require('@ai-sdk/openai');
const { anthropic } = require('@ai-sdk/anthropic');
const { xai } = require('@ai-sdk/xai');
const { google } = require('@ai-sdk/google');
const { perplexity } = require('@ai-sdk/perplexity');
const { generateText } = require('ai');
const logger = require('../utils/logger');

class AIKeyTester {
  constructor() {
    this.results = {
      openai: { status: 'untested', error: null, response: null },
      anthropic: { status: 'untested', error: null, response: null },
      xai: { status: 'untested', error: null, response: null },
      google: { status: 'untested', error: null, response: null },
      perplexity: { status: 'untested', error: null, response: null }
    };
  }

  /**
   * Test a simple prompt with each provider
   */
  async testProvider(providerName, modelInstance, testPrompt = "Say 'Hello' in one word.") {
    console.log(`\n🧪 Testing ${providerName.toUpperCase()}...`);
    
    try {
      const startTime = Date.now();
      
      const result = await generateText({
        model: modelInstance,
        prompt: testPrompt,
        maxTokens: 10,
        temperature: 0.1
      });

      const duration = Date.now() - startTime;
      
      this.results[providerName] = {
        status: 'success',
        error: null,
        response: result.text.trim(),
        duration: `${duration}ms`,
        tokensUsed: result.usage?.totalTokens || 'unknown'
      };

      console.log(`✅ ${providerName}: SUCCESS`);
      console.log(`   Response: "${result.text.trim()}"`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Tokens: ${result.usage?.totalTokens || 'unknown'}`);

    } catch (error) {
      this.results[providerName] = {
        status: 'failed',
        error: error.message,
        response: null
      };

      console.log(`❌ ${providerName}: FAILED`);
      console.log(`   Error: ${error.message}`);
      
      // Log specific error types and debug info
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        console.log(`   🔑 Likely invalid API key`);
      } else if (error.message.includes('403') || error.message.includes('forbidden')) {
        console.log(`   🚫 API key lacks permissions`);
      } else if (error.message.includes('429')) {
        console.log(`   ⏰ Rate limit exceeded`);
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
        console.log(`   🌐 Network connectivity issue`);
      } else if (error.message.includes('invalid x-api-key')) {
        console.log(`   🔑 Anthropic API key format issue - check key starts with 'sk-ant-api03-'`);
      } else if (error.message.includes('Not Found')) {
        console.log(`   📍 API endpoint not found - check provider setup`);
      }
      
      // Debug: Log full error for troubleshooting
      console.log(`   🐛 Full error: ${error.message}`);
      if (error.cause) {
        console.log(`   🔗 Cause: ${error.cause}`);
      }
    }
  }

  /**
   * Check if API keys are configured and return available providers
   */
  checkEnvironmentVariables() {
    console.log('🔍 Checking environment variables...\n');
    
    const allKeys = {
      'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
      'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY,
      'XAI_API_KEY': process.env.XAI_API_KEY,
      'GOOGLE_GENERATIVE_AI_API_KEY': process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      'PERPLEXITY_API_KEY': process.env.PERPLEXITY_API_KEY
    };

    const availableProviders = [];
    let configuredCount = 0;

    Object.entries(allKeys).forEach(([keyName, keyValue]) => {
      if (keyValue && keyValue.trim() && keyValue !== 'your-api-key-here') {
        console.log(`✅ ${keyName}: configured (${keyValue.substring(0, 8)}...)`);
        configuredCount++;
        
        // Map to provider names
        if (keyName === 'OPENAI_API_KEY') availableProviders.push('openai');
        if (keyName === 'ANTHROPIC_API_KEY') availableProviders.push('anthropic');
        if (keyName === 'XAI_API_KEY') availableProviders.push('xai');
        if (keyName === 'GOOGLE_GENERATIVE_AI_API_KEY') availableProviders.push('google');
        if (keyName === 'PERPLEXITY_API_KEY') availableProviders.push('perplexity');
      } else {
        console.log(`❌ ${keyName}: missing or not configured`);
      }
    });

    if (configuredCount < Object.keys(allKeys).length) {
      console.log(`\n⚠️  ${configuredCount}/${Object.keys(allKeys).length} API keys configured. Testing available providers...\n`);
    } else {
      console.log('\n✅ All API keys configured!\n');
    }

    return availableProviders;
  }

  /**
   * Test FlexTime-specific sports scheduling prompt
   */
  async testSportsSchedulingPrompt(providerName, modelInstance) {
    const sportsPrompt = `Analyze this Big 12 basketball scheduling conflict: "Kansas and K-State both have away games on the same weekend." Suggest one solution in 10 words or less.`;
    
    console.log(`\n🏀 Testing ${providerName.toUpperCase()} with sports scheduling prompt...`);
    
    try {
      const result = await generateText({
        model: modelInstance,
        prompt: sportsPrompt,
        maxTokens: 30,
        temperature: 0.3
      });

      console.log(`✅ Sports scheduling response: "${result.text.trim()}"`);
      return result.text.trim();

    } catch (error) {
      console.log(`❌ Sports scheduling test failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 FlexTime AI Provider Key Testing\n');
    console.log('=' .repeat(50));
    
    // Check environment variables and get available providers
    const availableProviders = this.checkEnvironmentVariables();
    
    if (availableProviders.length === 0) {
      console.log('\n❌ No API keys configured. Please check your .env file.');
      return this.results;
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🧪 STARTING API KEY TESTS');
    console.log('=' .repeat(50));

    // Define all possible tests
    const allTests = {
      'openai': ['openai', openai('gpt-3.5-turbo')],
      'anthropic': ['anthropic', anthropic('claude-3-5-haiku-20241022')],
      'xai': ['xai', xai('grok-beta')],
      'google': ['google', google('gemini-1.5-flash')],
      'perplexity': ['perplexity', perplexity('llama-3.1-sonar-large-128k-online')]
    };

    // Run tests only for available providers
    for (const providerName of availableProviders) {
      if (allTests[providerName]) {
        const [name, modelInstance] = allTests[providerName];
        await this.testProvider(name, modelInstance);
        
        // If basic test passed, try sports scheduling test
        if (this.results[name].status === 'success') {
          await this.testSportsSchedulingPrompt(name, modelInstance);
        }
        
        // Add delay between requests to be respectful
        await this.sleep(1000);
      }
    }

    // Generate summary
    this.generateSummary();
    
    return this.results;
  }

  /**
   * Generate test summary
   */
  generateSummary() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(50));

    const successful = Object.values(this.results).filter(r => r.status === 'success').length;
    const failed = Object.values(this.results).filter(r => r.status === 'failed').length;
    const total = Object.keys(this.results).length;

    console.log(`\n✅ Successful: ${successful}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    
    if (successful === total) {
      console.log('\n🎉 ALL AI PROVIDERS ARE WORKING! 🎉');
      console.log('Your FlexTime backend has access to all AI capabilities.');
    } else if (successful > 0) {
      console.log('\n⚠️  PARTIAL SUCCESS');
      console.log('Some providers are working. Check failed providers above.');
    } else {
      console.log('\n💥 ALL TESTS FAILED');
      console.log('Please check your API keys and network connection.');
    }

    // Recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    Object.entries(this.results).forEach(([provider, result]) => {
      if (result.status === 'success') {
        console.log(`✅ ${provider}: Ready for FlexTime scheduling AI`);
      } else {
        console.log(`❌ ${provider}: ${result.error}`);
        if (result.error?.includes('401')) {
          console.log(`   💡 Fix: Check your ${provider.toUpperCase()}_API_KEY in .env file`);
        }
      }
    });

    // Save results to file
    this.saveResultsToFile();
  }

  /**
   * Save test results to file
   */
  async saveResultsToFile() {
    const fs = require('fs').promises;
    const path = require('path');
    
    const resultsFile = path.join(__dirname, '../logs/ai-key-test-results.json');
    
    try {
      // Ensure logs directory exists
      await fs.mkdir(path.dirname(resultsFile), { recursive: true });
      
      const testResults = {
        timestamp: new Date().toISOString(),
        summary: {
          total: Object.keys(this.results).length,
          successful: Object.values(this.results).filter(r => r.status === 'success').length,
          failed: Object.values(this.results).filter(r => r.status === 'failed').length
        },
        results: this.results
      };
      
      await fs.writeFile(resultsFile, JSON.stringify(testResults, null, 2));
      console.log(`\n💾 Results saved to: ${resultsFile}`);
      
    } catch (error) {
      console.log(`\n⚠️  Could not save results to file: ${error.message}`);
    }
  }

  /**
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new AIKeyTester();
  
  tester.runAllTests()
    .then(() => {
      console.log('\n✨ Testing complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error during testing:', error);
      process.exit(1);
    });
}

module.exports = AIKeyTester;