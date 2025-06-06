#!/usr/bin/env node

/**
 * Migration Script: Restructure Utils Directories
 * 
 * This script:
 * 1. Renames /backend/utils/ to /backend/scripts/
 * 2. Renames /backend/src/utils/ to /backend/src/lib/
 * 3. Updates all import/require statements throughout the codebase
 * 
 * Run with: node scripts/migrate-utils-structure.js
 * Or with dry-run: node scripts/migrate-utils-structure.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = require('glob');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const rename = promisify(fs.rename);
const exists = promisify(fs.exists);

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const BACKUP = !process.argv.includes('--no-backup');

const BACKEND_ROOT = path.join(__dirname, '..');
const UTILS_DIR = path.join(BACKEND_ROOT, 'utils');
const SCRIPTS_DIR = path.join(BACKEND_ROOT, 'scripts');
const SRC_UTILS_DIR = path.join(BACKEND_ROOT, 'src', 'utils');
const SRC_LIB_DIR = path.join(BACKEND_ROOT, 'src', 'lib');

// Import path mappings
const PATH_MAPPINGS = [
  // Utils to Scripts mappings
  { from: /require\(['"]\.\.\/utils\//g, to: 'require(\'../scripts/' },
  { from: /require\(['"]\.\/utils\//g, to: 'require(\'./scripts/' },
  { from: /from ['"]\.\.\/utils\//g, to: 'from \'../scripts/' },
  { from: /from ['"]\.\/utils\//g, to: 'from \'./scripts/' },
  
  // Src/utils to lib mappings
  { from: /require\(['"]\.\.\/src\/utils\//g, to: 'require(\'../lib/' },
  { from: /require\(['"]\.\.\/\.\.\/src\/utils\//g, to: 'require(\'../../lib/' },
  { from: /require\(['"]\.\/src\/utils\//g, to: 'require(\'./lib/' },
  { from: /from ['"]\.\.\/src\/utils\//g, to: 'from \'../lib/' },
  { from: /from ['"]\.\.\/\.\.\/src\/utils\//g, to: 'from \'../../lib/' },
  { from: /from ['"]\.\/src\/utils\//g, to: 'from \'./lib/' },
  
  // Direct src/utils requires (from within src directory)
  { from: /require\(['"]\.\/utils\//g, to: 'require(\'./lib/' },
  { from: /require\(['"]\.\.\/utils\//g, to: 'require(\'../lib/' },
  { from: /from ['"]\.\/utils\//g, to: 'from \'./lib/' },
  { from: /from ['"]\.\.\/utils\//g, to: 'from \'../lib/' },
  
  // Handle imports from scripts that reference other scripts
  { from: /require\(['"]\.\.\/scripts\/(.+?)\.js['"]\)/g, to: 'require(\'../scripts/$1\')' },
  { from: /require\(['"]\.\/scripts\/(.+?)\.js['"]\)/g, to: 'require(\'./scripts/$1\')' },
];

// File patterns to search for imports
const FILE_PATTERNS = [
  '**/*.js',
  '**/*.ts',
  '**/*.jsx',
  '**/*.tsx',
  '**/*.mjs',
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/build/**',
  '!**/.next/**',
  '!**/coverage/**'
];

// Logging utilities
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warn: (msg) => console.warn(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  dryRun: (msg) => console.log(`\x1b[35m[DRY-RUN]\x1b[0m ${msg}`)
};

// Create backup of a file
async function backupFile(filePath) {
  if (!BACKUP || DRY_RUN) return;
  
  const backupPath = `${filePath}.backup`;
  try {
    await fs.promises.copyFile(filePath, backupPath);
    log.info(`Backed up: ${path.relative(BACKEND_ROOT, filePath)}`);
  } catch (error) {
    log.error(`Failed to backup ${filePath}: ${error.message}`);
  }
}

// Update imports in a single file
async function updateFileImports(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let updatedContent = content;
    let changesMade = false;
    
    // Apply all path mappings
    for (const mapping of PATH_MAPPINGS) {
      const originalContent = updatedContent;
      updatedContent = updatedContent.replace(mapping.from, mapping.to);
      if (originalContent !== updatedContent) {
        changesMade = true;
      }
    }
    
    if (changesMade) {
      const relativePath = path.relative(BACKEND_ROOT, filePath);
      
      if (DRY_RUN) {
        log.dryRun(`Would update imports in: ${relativePath}`);
        
        // Show a sample of changes
        const lines = content.split('\n');
        const updatedLines = updatedContent.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i] !== updatedLines[i]) {
            console.log(`  Line ${i + 1}:`);
            console.log(`    - ${lines[i].trim()}`);
            console.log(`    + ${updatedLines[i].trim()}`);
            break; // Just show first change as example
          }
        }
      } else {
        await backupFile(filePath);
        await writeFile(filePath, updatedContent);
        log.success(`Updated imports in: ${relativePath}`);
      }
      
      return 1;
    }
    
    return 0;
  } catch (error) {
    log.error(`Failed to process ${filePath}: ${error.message}`);
    return 0;
  }
}

// Find all files that need updating
async function findFilesToUpdate() {
  return new Promise((resolve, reject) => {
    glob(FILE_PATTERNS[0], {
      cwd: BACKEND_ROOT,
      ignore: FILE_PATTERNS.slice(1).filter(p => p.startsWith('!')).map(p => p.slice(1)),
      absolute: true
    }, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

// Rename directories
async function renameDirectories() {
  const operations = [
    { from: UTILS_DIR, to: SCRIPTS_DIR, desc: 'utils/ → scripts/' },
    { from: SRC_UTILS_DIR, to: SRC_LIB_DIR, desc: 'src/utils/ → src/lib/' }
  ];
  
  for (const op of operations) {
    try {
      const fromExists = await fs.promises.access(op.from).then(() => true).catch(() => false);
      const toExists = await fs.promises.access(op.to).then(() => true).catch(() => false);
      
      if (!fromExists) {
        log.warn(`Source directory doesn't exist: ${op.from}`);
        continue;
      }
      
      if (toExists) {
        log.warn(`Target directory already exists: ${op.to}`);
        continue;
      }
      
      if (DRY_RUN) {
        log.dryRun(`Would rename: ${op.desc}`);
      } else {
        await rename(op.from, op.to);
        log.success(`Renamed: ${op.desc}`);
      }
    } catch (error) {
      log.error(`Failed to rename ${op.desc}: ${error.message}`);
    }
  }
}

// Update package.json scripts that might reference utils/
async function updatePackageJsonScripts() {
  const packageJsonPath = path.join(BACKEND_ROOT, 'package.json');
  
  try {
    const content = await readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(content);
    
    let updated = false;
    
    if (packageJson.scripts) {
      for (const [key, value] of Object.entries(packageJson.scripts)) {
        if (typeof value === 'string' && value.includes('utils/')) {
          packageJson.scripts[key] = value.replace(/utils\//g, 'scripts/');
          updated = true;
          
          if (DRY_RUN) {
            log.dryRun(`Would update package.json script "${key}"`);
          }
        }
      }
    }
    
    if (updated && !DRY_RUN) {
      await backupFile(packageJsonPath);
      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      log.success('Updated package.json scripts');
    }
  } catch (error) {
    log.error(`Failed to update package.json: ${error.message}`);
  }
}

// Main migration function
async function migrate() {
  console.log('\n🔄 Starting FlexTime Utils Structure Migration');
  console.log('=============================================');
  
  if (DRY_RUN) {
    console.log('\n📋 Running in DRY-RUN mode - no changes will be made\n');
  }
  
  try {
    // Step 1: Find all files to update
    log.info('Finding files to update...');
    const files = await findFilesToUpdate();
    log.info(`Found ${files.length} files to check`);
    
    // Step 2: Update imports in all files
    log.info('\nUpdating import statements...');
    let updatedCount = 0;
    
    for (const file of files) {
      const result = await updateFileImports(file);
      updatedCount += result;
    }
    
    log.success(`Updated imports in ${updatedCount} files`);
    
    // Step 3: Update package.json scripts
    log.info('\nChecking package.json scripts...');
    await updatePackageJsonScripts();
    
    // Step 4: Rename directories
    log.info('\nRenaming directories...');
    await renameDirectories();
    
    // Summary
    console.log('\n✅ Migration Summary');
    console.log('===================');
    console.log(`Files checked: ${files.length}`);
    console.log(`Files updated: ${updatedCount}`);
    
    if (DRY_RUN) {
      console.log('\n📋 This was a dry run. To apply changes, run without --dry-run flag');
    } else if (BACKUP) {
      console.log('\n💾 Backup files created with .backup extension');
      console.log('To remove backups: find . -name "*.backup" -delete');
    }
    
    console.log('\n🎉 Migration completed successfully!\n');
    
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Check if glob is installed
try {
  require.resolve('glob');
} catch (e) {
  log.error('Missing required dependency: glob');
  console.log('\nPlease install it with: npm install --save-dev glob');
  console.log('or run: cd backend && npm install\n');
  process.exit(1);
}

// Run migration
if (require.main === module) {
  migrate();
}

module.exports = { migrate, updateFileImports };