#!/usr/bin/env node

/**
 * AI SDK Multi-Provider Test Script
 * Tests all installed AI providers with FlexTime environment configuration
 */

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { perplexity } from '@ai-sdk/perplexity';
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testPrompt = "Briefly explain Big 12 Conference sports scheduling challenges in 2 sentences.";

async function testProvider(providerName, model, prompt) {
  try {
    console.log(`\n🧪 Testing ${providerName}...`);
    
    const { text } = await generateText({
      model: model,
      prompt: prompt,
      maxTokens: 100
    });
    
    console.log(`✅ ${providerName} Success:`);
    console.log(`   Response: ${text.substring(0, 150)}...`);
    return true;
  } catch (error) {
    console.log(`❌ ${providerName} Failed:`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🔥 FlexTime AI SDK Multi-Provider Test\n');
  console.log('Testing providers with Big 12 scheduling context...');
  
  const results = [];
  
  // Test Anthropic (Claude)
  if (process.env.ANTHROPIC_API_KEY) {
    const success = await testProvider(
      'Anthropic (Claude)', 
      anthropic('claude-3-5-sonnet-20241022'), 
      testPrompt
    );
    results.push({ provider: 'Anthropic', success });
  } else {
    console.log('\n⚠️ Anthropic: ANTHROPIC_API_KEY not found');
    results.push({ provider: 'Anthropic', success: false });
  }
  
  // Test OpenAI
  if (process.env.OPENAI_API_KEY) {
    const success = await testProvider(
      'OpenAI (GPT)', 
      openai('gpt-4o-mini'), 
      testPrompt
    );
    results.push({ provider: 'OpenAI', success });
  } else {
    console.log('\n⚠️ OpenAI: OPENAI_API_KEY not found');
    results.push({ provider: 'OpenAI', success: false });
  }
  
  // Test Google (Gemini)
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const success = await testProvider(
      'Google (Gemini)', 
      google('gemini-1.5-flash'), 
      testPrompt
    );
    results.push({ provider: 'Google', success });
  } else {
    console.log('\n⚠️ Google: GOOGLE_GENERATIVE_AI_API_KEY not found');
    results.push({ provider: 'Google', success: false });
  }
  
  // Test Perplexity
  if (process.env.PERPLEXITY_API_KEY) {
    const success = await testProvider(
      'Perplexity (Sonar)', 
      perplexity('sonar-pro'), 
      testPrompt
    );
    results.push({ provider: 'Perplexity', success });
  } else {
    console.log('\n⚠️ Perplexity: PERPLEXITY_API_KEY not found');
    results.push({ provider: 'Perplexity', success: false });
  }
  
  // Test xAI (Grok)
  if (process.env.XAI_API_KEY) {
    const success = await testProvider(
      'xAI (Grok)', 
      xai('grok-2'), 
      testPrompt
    );
    results.push({ provider: 'xAI', success });
  } else {
    console.log('\n⚠️ xAI: XAI_API_KEY not found');
    results.push({ provider: 'xAI', success: false });
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.provider}`);
  });
  
  console.log(`\n🎯 Success Rate: ${successful}/${total} providers working`);
  
  if (successful === total) {
    console.log('🚀 All AI providers ready for FlexTime integration!');
  } else {
    console.log('⚠️ Some providers need attention. Check API keys and network connectivity.');
  }
}

// Run the tests
runTests().catch(console.error);