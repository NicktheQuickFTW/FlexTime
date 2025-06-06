#!/usr/bin/env node

/**
 * Preview Import Changes Script
 * 
 * This script analyzes the codebase and shows what import changes would be made
 * without actually modifying any files.
 * 
 * Run with: node scripts/preview-import-changes.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const BACKEND_ROOT = path.join(__dirname, '..');

// Patterns to find
const IMPORT_PATTERNS = [
  // Utils imports
  /require\(['"]([\.\/]+)utils\/([^'"]+)['"]\)/g,
  /from ['"]([\.\/]+)utils\/([^'"]+)['"]/g,
  
  // Src/utils imports
  /require\(['"]([\.\/]+)src\/utils\/([^'"]+)['"]\)/g,
  /from ['"]([\.\/]+)src\/utils\/([^'"]+)['"]/g,
];

// File extensions to check
const EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.mjs'];

// Directories to skip
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

// Results storage
const results = {
  utilsImports: [],      // Imports from /utils/
  srcUtilsImports: [],   // Imports from /src/utils/
  filesAffected: new Set(),
  totalImports: 0
};

// Recursively find all source files
async function* walkDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name)) {
        yield* walkDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS.includes(ext)) {
        yield fullPath;
      }
    }
  }
}

// Analyze a single file for imports
async function analyzeFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const relativePath = path.relative(BACKEND_ROOT, filePath);
    let fileHasImports = false;
    
    // Check each line
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Check for utils imports
      if (line.includes('utils/') && !line.includes('src/utils/')) {
        const matches = line.match(/require\(['"]([^'"]+)['"]\)|from ['"]([^'"]+)['"]/);
        if (matches) {
          const importPath = matches[1] || matches[2];
          if (importPath && importPath.includes('utils/')) {
            results.utilsImports.push({
              file: relativePath,
              line: index + 1,
              content: line.trim(),
              importPath
            });
            fileHasImports = true;
            results.totalImports++;
          }
        }
      }
      
      // Check for src/utils imports
      if (line.includes('src/utils/')) {
        const matches = line.match(/require\(['"]([^'"]+)['"]\)|from ['"]([^'"]+)['"]/);
        if (matches) {
          const importPath = matches[1] || matches[2];
          if (importPath && importPath.includes('src/utils/')) {
            results.srcUtilsImports.push({
              file: relativePath,
              line: index + 1,
              content: line.trim(),
              importPath
            });
            fileHasImports = true;
            results.totalImports++;
          }
        }
      }
    });
    
    if (fileHasImports) {
      results.filesAffected.add(relativePath);
    }
    
  } catch (error) {
    console.error(`Error analyzing ${filePath}: ${error.message}`);
  }
}

// Generate summary report
function generateReport() {
  console.log('\n📊 FlexTime Import Analysis Report');
  console.log('=====================================\n');
  
  console.log(`Total files analyzed: ${results.filesAffected.size}`);
  console.log(`Total imports to update: ${results.totalImports}\n`);
  
  // Utils imports (will become scripts/)
  if (results.utilsImports.length > 0) {
    console.log(`\n📁 Imports from /utils/ directory (${results.utilsImports.length} found)`);
    console.log('These will change: utils/ → scripts/\n');
    
    const byFile = {};
    results.utilsImports.forEach(imp => {
      if (!byFile[imp.file]) byFile[imp.file] = [];
      byFile[imp.file].push(imp);
    });
    
    Object.entries(byFile).slice(0, 5).forEach(([file, imports]) => {
      console.log(`  📄 ${file}`);
      imports.slice(0, 3).forEach(imp => {
        console.log(`     Line ${imp.line}: ${imp.content}`);
        console.log(`     → Will become: ${imp.content.replace(/utils\//, 'scripts/')}\n`);
      });
    });
    
    if (Object.keys(byFile).length > 5) {
      console.log(`  ... and ${Object.keys(byFile).length - 5} more files\n`);
    }
  }
  
  // Src/utils imports (will become lib/)
  if (results.srcUtilsImports.length > 0) {
    console.log(`\n📁 Imports from /src/utils/ directory (${results.srcUtilsImports.length} found)`);
    console.log('These will change: src/utils/ → lib/\n');
    
    const byFile = {};
    results.srcUtilsImports.forEach(imp => {
      if (!byFile[imp.file]) byFile[imp.file] = [];
      byFile[imp.file].push(imp);
    });
    
    Object.entries(byFile).slice(0, 5).forEach(([file, imports]) => {
      console.log(`  📄 ${file}`);
      imports.slice(0, 3).forEach(imp => {
        console.log(`     Line ${imp.line}: ${imp.content}`);
        const newContent = imp.content
          .replace(/\.\.\/src\/utils\//, '../lib/')
          .replace(/\.\/src\/utils\//, './lib/')
          .replace(/src\/utils\//, 'lib/');
        console.log(`     → Will become: ${newContent}\n`);
      });
    });
    
    if (Object.keys(byFile).length > 5) {
      console.log(`  ... and ${Object.keys(byFile).length - 5} more files\n`);
    }
  }
  
  // Summary of changes
  console.log('\n📋 Summary of Changes:');
  console.log('======================');
  console.log('1. /backend/utils/ → /backend/scripts/');
  console.log('2. /backend/src/utils/ → /backend/src/lib/');
  console.log('3. All import statements will be updated automatically\n');
  
  console.log('🔧 To apply these changes, run:');
  console.log('   node scripts/migrate-utils-structure.js\n');
  console.log('💡 To preview without making changes:');
  console.log('   node scripts/migrate-utils-structure.js --dry-run\n');
}

// Main function
async function main() {
  console.log('🔍 Analyzing FlexTime codebase for import statements...\n');
  
  try {
    let fileCount = 0;
    
    // Walk through all directories
    for await (const filePath of walkDirectory(BACKEND_ROOT)) {
      await analyzeFile(filePath);
      fileCount++;
      
      // Progress indicator
      if (fileCount % 50 === 0) {
        process.stdout.write(`\rAnalyzed ${fileCount} files...`);
      }
    }
    
    console.log(`\rAnalyzed ${fileCount} files total.`);
    
    // Generate report
    generateReport();
    
  } catch (error) {
    console.error('Error during analysis:', error);
    process.exit(1);
  }
}

// Run the analysis
if (require.main === module) {
  main();
}