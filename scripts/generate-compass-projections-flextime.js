#!/usr/bin/env node

/**
 * Generate COMPASS Projections for FlexTime Sports (2025-26, 2026-27)
 * 
 * Creates forward-looking COMPASS projections for the 12 FlexTime sports only.
 * Uses actual 2024-25 results as baseline for accurate projections.
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

const PROJECTION_YEARS = ['2025-26', '2026-27'];

console.log('🔮 FlexTime COMPASS Projections Generation');
console.log('📊 Sports (FlexTime Only):', FLEXTIME_SPORTS.length);
console.log('📅 Projection Years:', PROJECTION_YEARS.join(', '));
console.log('🏫 Teams: 16 Big 12 institutions');
console.log('📌 Note: Using actual 2024-25 results as baseline');
console.log('');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve));
}

async function generateSportProjections(sport, index) {
  return new Promise((resolve, reject) => {
    console.log(`🔮 [${index + 1}/${FLEXTIME_SPORTS.length}] Generating ${sport.toUpperCase()} projections...`);
    
    const scriptPath = path.join(__dirname, 'run-unified-sport-pipeline-analysis.js');
    const process = spawn('node', [
      scriptPath, 
      '--sport', sport, 
      '--generate-projections',
      '--years', '2025-2026,2026-2027',
      '--baseline', '2024-25'
    ], {
      stdio: 'pipe',
      cwd: path.dirname(__dirname)
    });
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Show meaningful progress
      if (text.includes('✅') || text.includes('projection') || text.includes('complete')) {
        console.log(`   🎯 ${sport}: ${text.trim()}`);
      }
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${sport.toUpperCase()} projections completed successfully`);
        resolve({ sport, success: true, output });
      } else {
        console.log(`❌ ${sport.toUpperCase()} projections failed (code: ${code})`);
        if (errorOutput) console.log(`Error: ${errorOutput}`);
        resolve({ sport, success: false, error: errorOutput || 'Unknown error' });
      }
    });
    
    // Timeout after 10 minutes per sport
    setTimeout(() => {
      console.log(`⏰ ${sport.toUpperCase()} projections taking too long, moving to next...`);
      process.kill();
      resolve({ sport, success: false, error: 'Timeout' });
    }, 10 * 60 * 1000);
  });
}

async function validateBaselineData() {
  console.log('🔍 Validating 2024-25 baseline data...');
  
  const researchResultsPath = path.join(__dirname, '..', 'data', 'research_results');
  const baselineFiles = fs.readdirSync(researchResultsPath)
    .filter(file => file.includes('2025') && file.includes('.json'));
  
  const validBaselines = {};
  
  for (const sport of FLEXTIME_SPORTS) {
    const sportFiles = baselineFiles.filter(file => 
      file.toLowerCase().includes(sport.toLowerCase())
    );
    
    if (sportFiles.length > 0) {
      validBaselines[sport] = sportFiles[0];
      console.log(`   ✓ ${sport}: ${sportFiles[0]}`);
    } else {
      console.log(`   ⚠️  ${sport}: No baseline data found`);
    }
  }
  
  console.log(`📊 Baseline data available for ${Object.keys(validBaselines).length}/${FLEXTIME_SPORTS.length} sports\n`);
  
  return validBaselines;
}

async function main() {
  const baselineData = await validateBaselineData();
  const results = [];
  
  console.log('🚀 Starting COMPASS projections for FlexTime sports...\n');
  
  // Process sports sequentially to manage API usage
  for (let i = 0; i < FLEXTIME_SPORTS.length; i++) {
    const sport = FLEXTIME_SPORTS[i];
    
    try {
      // Check if we have baseline data for better projections
      if (!baselineData[sport]) {
        console.log(`⚠️  ${sport}: Creating projections without baseline data`);
      }
      
      const result = await generateSportProjections(sport, i);
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
  console.log('\n📋 COMPASS Projections Summary:');
  console.log('═'.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${FLEXTIME_SPORTS.length}`);
  successful.forEach(r => console.log(`   ✓ ${r.sport}`));
  
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}/${FLEXTIME_SPORTS.length}`);
    failed.forEach(r => console.log(`   ✗ ${r.sport}: ${r.error}`));
  }
  
  // Save summary
  const summaryPath = path.join(__dirname, '..', 'data', 'research_results', `compass_projections_flextime_${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    projectionType: 'FlexTime Sports Only',
    sports: FLEXTIME_SPORTS,
    projectionYears: PROJECTION_YEARS,
    baselineYear: '2024-25',
    results: results,
    summary: {
      total: FLEXTIME_SPORTS.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / FLEXTIME_SPORTS.length * 100).toFixed(1) + '%'
    },
    nextSteps: [
      'Validate projections against recruiting data',
      'Integrate into scheduling constraint system',
      'Update hardcoded COMPASS data in BIG12_COMPLETE_DATA.js'
    ]
  }, null, 2));
  
  console.log(`\n📄 Projections summary saved to: ${summaryPath}`);
  console.log('🔮 COMPASS Projections Generation Complete!');
  console.log('\n🎯 Next Steps:');
  console.log('   1. Review projection accuracy vs current recruiting data');
  console.log('   2. Update scheduling system with new 2025-26 projections');
  console.log('   3. Replace outdated 2024-25 "projected" data with actual results');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSportProjections, FLEXTIME_SPORTS };