#!/usr/bin/env node

/**
 * ML Implementation Verification Script
 * 
 * This script verifies the complete Machine Learning implementation by:
 * 1. Testing the direct ML components
 * 2. Testing the ML API endpoints
 * 3. Generating a final verification report
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { execSync } = require('child_process');

// Terminal colors for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Banner
console.log(`
${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   FlexTime ML Implementation Verification                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
`);

// Report data
const verificationReport = {
  timestamp: new Date().toISOString(),
  components: {
    patternExtractor: { verified: false, details: {} },
    gameOutcomeModel: { verified: false, details: {} },
    scheduleQualityModel: { verified: false, details: {} },
    teamPerformanceModel: { verified: false, details: {} },
    mlApi: { verified: false, details: {} }
  },
  files: {
    models: [],
    implementation: {
      python: [],
      javascript: []
    }
  },
  summary: {
    success: false,
    message: ''
  }
};

/**
 * Verify if Python files exist
 */
function verifyPythonFiles() {
  console.log(`\n${colors.bright}Verifying Python implementation files...${colors.reset}`);
  
  const pythonFiles = [
    'python/intelligence_engine/ml/pattern_extractor.py',
    'python/intelligence_engine/ml/predictive_model.py',
    'python/intelligence_engine/ml/test_ml.py',
    'python/intelligence_engine/ml/__init__.py',
    'python/intelligence_engine/api/ml_routes.py'
  ];
  
  let allFilesExist = true;
  
  pythonFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    
    if (fs.existsSync(fullPath)) {
      console.log(`${colors.green}✓${colors.reset} ${file}`);
      verificationReport.files.implementation.python.push(file);
    } else {
      console.log(`${colors.red}✗${colors.reset} ${file} (missing)`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

/**
 * Verify if JavaScript test files exist
 */
function verifyJavaScriptFiles() {
  console.log(`\n${colors.bright}Verifying JavaScript test files...${colors.reset}`);
  
  const jsFiles = [
    'scripts/test-ml-components.js',
    'scripts/test-ml-api.js'
  ];
  
  let allFilesExist = true;
  
  jsFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    
    if (fs.existsSync(fullPath)) {
      console.log(`${colors.green}✓${colors.reset} ${file}`);
      verificationReport.files.implementation.javascript.push(file);
    } else {
      console.log(`${colors.red}✗${colors.reset} ${file} (missing)`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

/**
 * Verify if model files exist
 */
function verifyModelFiles() {
  console.log(`\n${colors.bright}Verifying model files...${colors.reset}`);
  
  const modelDir = path.join(process.cwd(), 'python/intelligence_engine/ml/models');
  
  if (!fs.existsSync(modelDir)) {
    console.log(`${colors.red}✗${colors.reset} Models directory does not exist`);
    return false;
  }
  
  // Get all .pkl files
  const modelFiles = fs.readdirSync(modelDir).filter(file => file.endsWith('.pkl'));
  
  if (modelFiles.length === 0) {
    console.log(`${colors.yellow}⚠${colors.reset} No model files found`);
    return false;
  }
  
  modelFiles.forEach(file => {
    console.log(`${colors.green}✓${colors.reset} ${file}`);
    verificationReport.files.models.push(file);
  });
  
  // Check for specific models
  const requiredModels = ['game_outcome', 'schedule_quality', 'team_performance'];
  
  const missingModels = requiredModels.filter(model => 
    !modelFiles.some(file => file.startsWith(model))
  );
  
  if (missingModels.length > 0) {
    console.log(`${colors.yellow}⚠${colors.reset} Missing models: ${missingModels.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * Run the ML components test
 */
function runMlComponentsTest() {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.bright}Running ML components test...${colors.reset}`);
    
    const testPath = path.join(process.cwd(), 'scripts/test-ml-components.js');
    
    if (!fs.existsSync(testPath)) {
      console.log(`${colors.red}✗${colors.reset} Test script not found: ${testPath}`);
      reject(new Error('Test script not found'));
      return;
    }
    
    const testProcess = spawn('node', [testPath]);
    
    let output = '';
    
    testProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      
      // Print only summary lines to avoid cluttering the console
      const lines = dataStr.split('\n');
      lines.forEach(line => {
        if (line.includes('Summary') || line.includes('Success') || 
            line.includes('Passed') || line.includes('Failed') ||
            line.includes('Models Created')) {
          console.log(line);
        }
      });
    });
    
    testProcess.stderr.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      console.error(dataStr);
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}✓${colors.reset} ML components test passed`);
        
        // Parse results
        verificationReport.components.patternExtractor.verified = 
          output.includes('Pattern Extractor: Passed');
        verificationReport.components.gameOutcomeModel.verified = 
          output.includes('Game Outcome Model: Passed');
        verificationReport.components.scheduleQualityModel.verified = 
          output.includes('Schedule Quality Model: Passed');
        verificationReport.components.teamPerformanceModel.verified = 
          output.includes('Team Performance Model: Passed');
        
        resolve(true);
      } else {
        console.log(`${colors.red}✗${colors.reset} ML components test failed with code ${code}`);
        resolve(false);
      }
    });
  });
}

/**
 * Check if Python server is running
 */
function checkPythonServer() {
  try {
    // Try to use curl to check if the server is running
    execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/api/status');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Run the ML API test
 */
function runMlApiTest() {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.bright}Running ML API test...${colors.reset}`);
    
    // Check if server is running
    if (!checkPythonServer()) {
      console.log(`${colors.yellow}⚠${colors.reset} Python server not running. Skipping API test.`);
      resolve(false);
      return;
    }
    
    const testPath = path.join(process.cwd(), 'scripts/test-ml-api.js');
    
    if (!fs.existsSync(testPath)) {
      console.log(`${colors.red}✗${colors.reset} Test script not found: ${testPath}`);
      reject(new Error('Test script not found'));
      return;
    }
    
    const testProcess = spawn('node', [testPath]);
    
    let output = '';
    
    testProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      console.log(dataStr);
    });
    
    testProcess.stderr.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      console.error(dataStr);
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}✓${colors.reset} ML API test passed`);
        
        // Parse results
        verificationReport.components.mlApi.verified = 
          output.includes('All tests completed successfully');
        
        resolve(true);
      } else {
        console.log(`${colors.yellow}⚠${colors.reset} ML API test did not complete successfully. This is expected if the server is not running.`);
        resolve(false);
      }
    });
  });
}

/**
 * Generate final report
 */
function generateReport() {
  console.log(`\n${colors.bright}${colors.cyan}Generating verification report...${colors.reset}`);
  
  // Calculate overall success
  const requiredComponents = [
    'patternExtractor',
    'gameOutcomeModel',
    'scheduleQualityModel',
    'teamPerformanceModel'
  ];
  
  const implementationSuccess = requiredComponents.every(
    component => verificationReport.components[component].verified
  );
  
  // Set summary
  verificationReport.summary.success = implementationSuccess;
  verificationReport.summary.message = implementationSuccess
    ? 'Machine Learning components successfully implemented'
    : 'Some Machine Learning components could not be verified';
  
  // Add file counts
  verificationReport.summary.fileCount = {
    python: verificationReport.files.implementation.python.length,
    javascript: verificationReport.files.implementation.javascript.length,
    models: verificationReport.files.models.length
  };
  
  // Write report to file
  const reportPath = path.join(process.cwd(), 'ml-implementation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
  
  console.log(`${colors.green}✓${colors.reset} Report saved to: ${reportPath}`);
  
  // Display summary
  console.log(`
${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ML Implementation Verification Summary                   ║
║                                                            ║${colors.reset}`);

  console.log(`${colors.cyan}║   Pattern Extractor:${colors.reset} ${verificationReport.components.patternExtractor.verified ? colors.green + '✓ Verified' : colors.red + '✗ Not verified'}${colors.cyan}                         ║${colors.reset}`);
  console.log(`${colors.cyan}║   Game Outcome Model:${colors.reset} ${verificationReport.components.gameOutcomeModel.verified ? colors.green + '✓ Verified' : colors.red + '✗ Not verified'}${colors.cyan}                       ║${colors.reset}`);
  console.log(`${colors.cyan}║   Schedule Quality Model:${colors.reset} ${verificationReport.components.scheduleQualityModel.verified ? colors.green + '✓ Verified' : colors.red + '✗ Not verified'}${colors.cyan}                   ║${colors.reset}`);
  console.log(`${colors.cyan}║   Team Performance Model:${colors.reset} ${verificationReport.components.teamPerformanceModel.verified ? colors.green + '✓ Verified' : colors.red + '✗ Not verified'}${colors.cyan}                  ║${colors.reset}`);
  console.log(`${colors.cyan}║   ML API:${colors.reset} ${verificationReport.components.mlApi.verified ? colors.green + '✓ Verified' : colors.yellow + '⚠ Not tested (server required)'}${colors.cyan}           ║${colors.reset}`);
  console.log(`${colors.cyan}║                                                            ║${colors.reset}`);
  console.log(`${colors.cyan}║   Implementation Files:${colors.reset} ${colors.green}${verificationReport.summary.fileCount.python + verificationReport.summary.fileCount.javascript} files${colors.cyan}                           ║${colors.reset}`);
  console.log(`${colors.cyan}║   Model Files:${colors.reset} ${colors.green}${verificationReport.summary.fileCount.models} files${colors.cyan}                                    ║${colors.reset}`);
  console.log(`${colors.cyan}║                                                            ║${colors.reset}`);
  console.log(`${colors.cyan}║   Overall Status:${colors.reset} ${verificationReport.summary.success ? colors.green + '✓ IMPLEMENTATION COMPLETE' : colors.red + '✗ VERIFICATION INCOMPLETE'}${colors.cyan}         ║${colors.reset}`);
  console.log(`${colors.cyan}║                                                            ║${colors.reset}`);

  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}
`);
}

/**
 * Main verification flow
 */
async function verifyImplementation() {
  try {
    // Step 1: Verify files
    const pythonFilesVerified = verifyPythonFiles();
    const jsFilesVerified = verifyJavaScriptFiles();
    const modelFilesVerified = verifyModelFiles();
    
    // Step 2: Run ML components test
    const mlComponentsVerified = await runMlComponentsTest();
    
    // Step 3: Run ML API test (optional)
    await runMlApiTest();
    
    // Step 4: Generate report
    generateReport();
    
    // Exit with appropriate code
    process.exit(verificationReport.summary.success ? 0 : 1);
    
  } catch (error) {
    console.error(`${colors.red}Error during verification:${colors.reset}`, error);
    process.exit(1);
  }
}

// Start verification
verifyImplementation();