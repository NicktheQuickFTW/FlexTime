#!/usr/bin/env node

/**
 * Generate 5-Year COMPASS Historical Data for All FlexTime Sports
 * 
 * Generates comprehensive COMPASS ratings (2020-2025) for all 12 FlexTime sports:
 * Baseball, Basketball, Football, Golf, Gymnastics, Lacrosse, Rowing, 
 * Soccer, Softball, Swimming, Tennis, Volleyball, Wrestling
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// FlexTime's 12 core sports for scheduling (based on built frontend pages)
const FLEXTIME_SPORTS = [
  'baseball',
  'mens-basketball',
  'womens-basketball',
  'football',
  'gymnastics',
  'lacrosse',
  'mens-tennis',
  'womens-tennis',
  'soccer',
  'softball',
  'volleyball',
  'wrestling'
];

const YEARS = ['2020', '2021', '2022', '2023', '2024', '2025'];

console.log('🎯 FlexTime COMPASS Historical Data Generation');
console.log('📊 Sports:', FLEXTIME_SPORTS.length);
console.log('📅 Years:', YEARS.join('-'));
console.log('🏫 Teams: 16 Big 12 institutions');
console.log('');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateSportCOMPASS(sport, index) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 [${index + 1}/${FLEXTIME_SPORTS.length}] Starting ${sport.toUpperCase()} COMPASS generation...`);
    
    const scriptPath = path.join(__dirname, 'run-unified-sport-pipeline-analysis.js');
    const process = spawn('node', [scriptPath, '--sport', sport, '--generate-compass-historical'], {
      stdio: 'pipe',
      cwd: path.dirname(__dirname)
    });
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Show progress for this sport
      if (text.includes('✅') || text.includes('complete')) {
        console.log(`   📈 ${sport}: ${text.trim()}`);
      }
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${sport.toUpperCase()} COMPASS generation completed successfully`);
        resolve({ sport, success: true, output });
      } else {
        console.log(`❌ ${sport.toUpperCase()} COMPASS generation failed (code: ${code})`);
        console.log(`Error: ${errorOutput}`);
        resolve({ sport, success: false, error: errorOutput });
      }
    });
    
    // Kill process after 15 minutes
    setTimeout(() => {
      console.log(`⏰ ${sport.toUpperCase()} taking too long, moving to next sport...`);
      process.kill();
      resolve({ sport, success: false, error: 'Timeout' });
    }, 15 * 60 * 1000);
  });
}

async function main() {
  const results = [];
  
  console.log('🚀 Starting sequential COMPASS generation for all sports...\n');
  
  // Process sports sequentially to avoid API rate limits
  for (let i = 0; i < FLEXTIME_SPORTS.length; i++) {
    const sport = FLEXTIME_SPORTS[i];
    
    try {
      const result = await generateSportCOMPASS(sport, i);
      results.push(result);
      
      // Brief delay between sports
      if (i < FLEXTIME_SPORTS.length - 1) {
        console.log(`⏳ Waiting 30s before next sport...\n`);
        await delay(30000);
      }
      
    } catch (error) {
      console.error(`💥 Error processing ${sport}:`, error.message);
      results.push({ sport, success: false, error: error.message });
    }
  }
  
  // Generate summary report
  console.log('\n📋 COMPASS Generation Summary:');
  console.log('═'.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${FLEXTIME_SPORTS.length}`);
  successful.forEach(r => console.log(`   ✓ ${r.sport}`));
  
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}/${FLEXTIME_SPORTS.length}`);
    failed.forEach(r => console.log(`   ✗ ${r.sport}: ${r.error}`));
  }
  
  // Save summary to file
  const summaryPath = path.join(__dirname, '..', 'data', 'research_results', `compass_generation_summary_${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    sports: FLEXTIME_SPORTS,
    years: YEARS,
    results: results,
    summary: {
      total: FLEXTIME_SPORTS.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / FLEXTIME_SPORTS.length * 100).toFixed(1) + '%'
    }
  }, null, 2));
  
  console.log(`\n📄 Summary saved to: ${summaryPath}`);
  console.log('🎯 COMPASS Historical Data Generation Complete!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSportCOMPASS, FLEXTIME_SPORTS };