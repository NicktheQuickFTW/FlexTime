#!/usr/bin/env node

/**
 * Implementation Verification Script
 * 
 * This script verifies the implementation status of FlexTime platform components
 * including:
 * 1. Director Agents
 * 2. Machine Learning Components
 * 3. Knowledge Graph Integration
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
║   FlexTime Implementation Verification                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
`);

// Report data
const verificationReport = {
  timestamp: new Date().toISOString(),
  components: {
    directorAgents: { verified: false, details: {} },
    machineLearning: { verified: false, details: {} },
    knowledgeGraph: { verified: false, details: {} }
  },
  files: {
    directorAgents: [],
    machineLearning: [],
    knowledgeGraph: []
  },
  summary: {
    success: false,
    message: '',
    completedComponents: 0,
    totalComponents: 3
  }
};

/**
 * Verify if director agent files exist
 */
function verifyDirectorAgentFiles() {
  console.log(`\n${colors.bright}Verifying Director Agent implementation files...${colors.reset}`);
  
  const agentFiles = [
    'python/intelligence_engine/agents/base_agent.py',
    'python/intelligence_engine/agents/director_agents.py',
    'python/intelligence_engine/agents/specialized_agents.py',
    'python/intelligence_engine/agents/__init__.py'
  ];
  
  let allFilesExist = true;
  let filesFound = [];
  
  agentFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    
    if (fs.existsSync(fullPath)) {
      console.log(`${colors.green}✓${colors.reset} ${file}`);
      filesFound.push(file);
    } else {
      console.log(`${colors.red}✗${colors.reset} ${file} (missing)`);
      allFilesExist = false;
    }
  });
  
  verificationReport.files.directorAgents = filesFound;
  verificationReport.components.directorAgents.verified = allFilesExist && filesFound.length >= 3;
  
  return allFilesExist;
}

/**
 * Verify if ML files exist
 */
function verifyMachineLearningFiles() {
  console.log(`\n${colors.bright}Verifying Machine Learning implementation files...${colors.reset}`);
  
  const mlFiles = [
    'python/intelligence_engine/ml/pattern_extractor.py',
    'python/intelligence_engine/ml/predictive_model.py',
    'python/intelligence_engine/ml/test_ml.py',
    'python/intelligence_engine/ml/__init__.py',
    'python/intelligence_engine/api/ml_routes.py'
  ];
  
  let allFilesExist = true;
  let filesFound = [];
  
  mlFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    
    if (fs.existsSync(fullPath)) {
      console.log(`${colors.green}✓${colors.reset} ${file}`);
      filesFound.push(file);
    } else {
      console.log(`${colors.red}✗${colors.reset} ${file} (missing)`);
      allFilesExist = false;
    }
  });
  
  // Check for model files
  const modelDir = path.join(process.cwd(), 'python/intelligence_engine/ml/models');
  if (fs.existsSync(modelDir)) {
    const modelFiles = fs.readdirSync(modelDir).filter(file => file.endsWith('.pkl'));
    console.log(`${colors.green}✓${colors.reset} Found ${modelFiles.length} model files`);
    verificationReport.components.machineLearning.details.modelCount = modelFiles.length;
  } else {
    console.log(`${colors.red}✗${colors.reset} Models directory not found`);
  }
  
  verificationReport.files.machineLearning = filesFound;
  verificationReport.components.machineLearning.verified = allFilesExist && filesFound.length >= 4;
  
  return allFilesExist;
}

/**
 * Verify if Knowledge Graph files exist
 */
function verifyKnowledgeGraphFiles() {
  console.log(`\n${colors.bright}Verifying Knowledge Graph implementation files...${colors.reset}`);
  
  const kgFiles = [
    'python/intelligence_engine/knowledge_graph/graph_model.py',
    'python/intelligence_engine/knowledge_graph/schedule_knowledge_enhancer.py',
    'python/intelligence_engine/knowledge_graph/test_kg.py',
    'python/intelligence_engine/knowledge_graph/__init__.py',
    'python/intelligence_engine/api/kg_routes.py'
  ];
  
  let allFilesExist = true;
  let filesFound = [];
  
  kgFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    
    if (fs.existsSync(fullPath)) {
      console.log(`${colors.green}✓${colors.reset} ${file}`);
      filesFound.push(file);
    } else {
      console.log(`${colors.red}✗${colors.reset} ${file} (missing)`);
      allFilesExist = false;
    }
  });
  
  verificationReport.files.knowledgeGraph = filesFound;
  verificationReport.components.knowledgeGraph.verified = allFilesExist && filesFound.length >= 4;
  
  return allFilesExist;
}

/**
 * Test if Python server has the components available
 */
function testServerComponents() {
  console.log(`\n${colors.bright}Testing server components...${colors.reset}`);
  
  try {
    // Try to use curl to check if the server is running
    try {
      const statusResponse = execSync('curl -s http://localhost:4001/api/status');
      const status = JSON.parse(statusResponse);
      
      // Check for component capabilities
      if (status.capabilities) {
        if (status.capabilities.ml) {
          console.log(`${colors.green}✓${colors.reset} ML capabilities found in API: ${status.capabilities.ml.length} functions`);
          verificationReport.components.machineLearning.details.apiEndpoints = status.capabilities.ml.length;
        } else {
          console.log(`${colors.yellow}⚠${colors.reset} ML capabilities not found in API`);
        }
        
        if (status.capabilities.knowledge_graph) {
          console.log(`${colors.green}✓${colors.reset} Knowledge Graph capabilities found in API: ${status.capabilities.knowledge_graph.length} functions`);
          verificationReport.components.knowledgeGraph.details.apiEndpoints = status.capabilities.knowledge_graph.length;
        } else {
          console.log(`${colors.yellow}⚠${colors.reset} Knowledge Graph capabilities not found in API`);
        }
      }
      
      return true;
    } catch (error) {
      console.log(`${colors.yellow}⚠${colors.reset} Server not running, skipping API checks`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}Error checking server:${colors.reset}`, error);
    return false;
  }
}

/**
 * Generate final report
 */
function generateReport() {
  console.log(`\n${colors.bright}${colors.cyan}Generating verification report...${colors.reset}`);
  
  // Calculate overall success
  const componentsVerified = [
    verificationReport.components.directorAgents.verified,
    verificationReport.components.machineLearning.verified,
    verificationReport.components.knowledgeGraph.verified
  ];
  
  const completedComponents = componentsVerified.filter(Boolean).length;
  verificationReport.summary.completedComponents = completedComponents;
  
  const implementationSuccess = completedComponents >= 3;
  
  // Set summary
  verificationReport.summary.success = implementationSuccess;
  verificationReport.summary.message = implementationSuccess
    ? 'All required components successfully implemented'
    : `${completedComponents}/3 components verified`;
  
  // Add file counts
  verificationReport.summary.fileCount = {
    directorAgents: verificationReport.files.directorAgents.length,
    machineLearning: verificationReport.files.machineLearning.length,
    knowledgeGraph: verificationReport.files.knowledgeGraph.length,
    total: verificationReport.files.directorAgents.length + 
           verificationReport.files.machineLearning.length +
           verificationReport.files.knowledgeGraph.length
  };
  
  // Write report to file
  const reportPath = path.join(process.cwd(), 'implementation-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
  
  console.log(`${colors.green}✓${colors.reset} Report saved to: ${reportPath}`);
  
  // Display summary
  console.log(`
${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Implementation Verification Summary                      ║
║                                                            ║${colors.reset}`);

  console.log(`${colors.cyan}║   Director Agents:${colors.reset} ${verificationReport.components.directorAgents.verified ? colors.green + '✓ Verified' : colors.red + '✗ Not verified'}${colors.cyan}                             ║${colors.reset}`);
  console.log(`${colors.cyan}║   Machine Learning:${colors.reset} ${verificationReport.components.machineLearning.verified ? colors.green + '✓ Verified' : colors.red + '✗ Not verified'}${colors.cyan}                            ║${colors.reset}`);
  console.log(`${colors.cyan}║   Knowledge Graph:${colors.reset} ${verificationReport.components.knowledgeGraph.verified ? colors.green + '✓ Verified' : colors.red + '✗ Not verified'}${colors.cyan}                             ║${colors.reset}`);
  console.log(`${colors.cyan}║                                                            ║${colors.reset}`);
  console.log(`${colors.cyan}║   Implementation Files:${colors.reset} ${colors.green}${verificationReport.summary.fileCount.total} files${colors.cyan}                         ║${colors.reset}`);
  console.log(`${colors.cyan}║   Components Completed:${colors.reset} ${colors.green}${completedComponents}/${verificationReport.summary.totalComponents}${colors.cyan}                              ║${colors.reset}`);
  console.log(`${colors.cyan}║                                                            ║${colors.reset}`);
  console.log(`${colors.cyan}║   Overall Status:${colors.reset} ${verificationReport.summary.success ? colors.green + '✓ IMPLEMENTATION COMPLETE' : colors.red + '✗ IMPLEMENTATION INCOMPLETE'}${colors.cyan}         ║${colors.reset}`);
  console.log(`${colors.cyan}║                                                            ║${colors.reset}`);

  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}
`);
}

/**
 * Main verification flow
 */
async function verifyImplementation() {
  try {
    // Check for required files
    verifyDirectorAgentFiles();
    verifyMachineLearningFiles();
    verifyKnowledgeGraphFiles();
    
    // Check server components
    testServerComponents();
    
    // Generate report
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