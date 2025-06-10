/**
 * Example usage of the UCDL Constraint Migration Tools
 * 
 * This file demonstrates how to use the migration tools to convert
 * legacy constraints to the UCDL format.
 */

import {
  ConstraintMigrator,
  MigrationReport
} from './index';
import * as path from 'path';

// Example 1: Migrate a single constraint object
async function migrateSingleConstraintExample() {
  console.log('=== Example 1: Migrating a single constraint ===\n');
  
  const migrator = new ConstraintMigrator({
    validateOutput: true,
    preserveMetadata: true,
    logLevel: 'verbose'
  });
  
  // Legacy constraint object
  const legacyConstraint = {
    name: 'Minimum Rest Days',
    description: 'Teams must have at least 2 days between games',
    type: 'HARD',
    category: 'REST',
    parameters: {
      minDays: 2
    },
    weight: 1.0,
    isHard: true
  };
  
  const result = await migrator.migrateSingleConstraint(legacyConstraint, 'object');
  
  if (result.success) {
    console.log('✅ Migration successful!');
    console.log('Migrated constraint:', JSON.stringify(result.migratedConstraint, null, 2));
  } else {
    console.log('❌ Migration failed!');
    console.log('Errors:', result.errors);
  }
  
  console.log('\n');
}

// Example 2: Migrate constraints from a file
async function migrateFileExample() {
  console.log('=== Example 2: Migrating constraints from a file ===\n');
  
  const migrator = new ConstraintMigrator({
    validateOutput: true,
    generateBackup: true,
    batchSize: 50,
    logLevel: 'normal'
  });
  
  // Example file path (adjust to your actual file)
  const filePath = path.join(__dirname, '../../../sports/enhanced-basketball-constraints.js');
  
  try {
    const results = await migrator.migrateFromFile(filePath);
    
    console.log(`Processed ${results.length} constraints`);
    console.log(`Successful: ${results.filter(r => r.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.success).length}`);
    
    // Show first few results
    results.slice(0, 3).forEach((result, index) => {
      console.log(`\nConstraint ${index + 1}: ${result.constraintId}`);
      console.log(`  Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
      if (result.warnings && result.warnings.length > 0) {
        console.log(`  Warnings: ${result.warnings.join(', ')}`);
      }
    });
  } catch (error) {
    console.error('Error migrating file:', error);
  }
  
  console.log('\n');
}

// Example 3: Migrate an entire directory
async function migrateDirectoryExample() {
  console.log('=== Example 3: Migrating all constraints in a directory ===\n');
  
  const migrator = new ConstraintMigrator({
    validateOutput: true,
    generateBackup: true,
    dryRun: false, // Set to true to test without making changes
    logLevel: 'normal'
  });
  
  const dirPath = path.join(__dirname, '../../../sports');
  
  try {
    const results = await migrator.migrateDirectory(dirPath, /\.js$/);
    
    console.log(`Processed ${results.size} files`);
    
    // Summary by file
    for (const [filePath, fileResults] of results) {
      const filename = path.basename(filePath);
      const successful = fileResults.filter(r => r.success).length;
      const failed = fileResults.filter(r => !r.success).length;
      
      console.log(`\n${filename}:`);
      console.log(`  Total: ${fileResults.length}`);
      console.log(`  Success: ${successful}`);
      console.log(`  Failed: ${failed}`);
    }
    
    // Generate report
    const report = migrator.getReport();
    await report.save(path.join(__dirname, 'migration-report.html'));
    console.log('\n📊 Report saved to migration-report.html');
    
  } catch (error) {
    console.error('Error migrating directory:', error);
  }
  
  console.log('\n');
}

// Example 4: Custom constraint class migration
async function migrateCustomClassExample() {
  console.log('=== Example 4: Migrating a custom constraint class ===\n');
  
  const migrator = new ConstraintMigrator({
    validateOutput: true,
    preserveMetadata: true
  });
  
  // Example constraint class as string
  const constraintClassCode = `
    class MaxConsecutiveAwayConstraint extends Constraint {
      constructor(id, maxGames, isHard = false, weight = 1.0) {
        super(
          id,
          \`Maximum \${maxGames} Consecutive Away Games\`,
          \`Teams should not play more than \${maxGames} consecutive away games\`,
          isHard ? ConstraintType.HARD : ConstraintType.SOFT,
          ConstraintCategory.TRAVEL,
          { maxGames },
          weight
        );
      }
      
      evaluate(schedule) {
        // Evaluation logic here
      }
    }
  `;
  
  const result = await migrator.migrateSingleConstraint(constraintClassCode, 'class');
  
  if (result.success) {
    console.log('✅ Class migration successful!');
    console.log('Constraint name:', result.migratedConstraint?.name);
    console.log('Constraint type:', result.migratedConstraint?.type);
    console.log('Constraint category:', result.migratedConstraint?.category);
  } else {
    console.log('❌ Class migration failed!');
    console.log('Errors:', result.errors);
  }
  
  console.log('\n');
}

// Example 5: Batch validation of migrated constraints
async function validateMigratedConstraintsExample() {
  console.log('=== Example 5: Validating migrated constraints ===\n');
  
  const migrator = new ConstraintMigrator({
    validateOutput: true
  });
  
  // Multiple constraints to migrate and validate
  const constraints = [
    {
      name: 'Home Game Balance',
      type: 'SOFT',
      category: 'COMPETITIVE',
      weight: 0.8
    },
    {
      name: 'Championship Date Fixed',
      type: 'HARD',
      category: 'TEMPORAL',
      parameters: {
        date: '2025-03-15'
      }
    },
    {
      name: 'TV Broadcast Slot',
      type: 'FLEXIBLE',
      category: 'BROADCAST',
      parameters: {
        preferredTime: '19:00',
        network: 'ESPN'
      }
    }
  ];
  
  console.log('Migrating and validating batch...\n');
  
  for (const constraint of constraints) {
    const result = await migrator.migrateSingleConstraint(constraint);
    
    console.log(`${constraint.name}:`);
    console.log(`  Migration: ${result.success ? '✅' : '❌'}`);
    
    if (result.warnings && result.warnings.length > 0) {
      console.log(`  ⚠️  Warnings:`);
      result.warnings.forEach(w => console.log(`     - ${w}`));
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log(`  ❌ Errors:`);
      result.errors.forEach(e => console.log(`     - ${e}`));
    }
    
    console.log('');
  }
}

// Example 6: Generate comprehensive migration report
async function generateReportExample() {
  console.log('=== Example 6: Generating migration report ===\n');
  
  const migrator = new ConstraintMigrator({
    validateOutput: true,
    logLevel: 'quiet'
  });
  
  // Simulate migrating multiple constraints
  const testConstraints = Array.from({ length: 20 }, (_, i) => ({
    id: `constraint_${i}`,
    name: `Test Constraint ${i}`,
    type: i % 3 === 0 ? 'HARD' : 'SOFT',
    category: ['TEMPORAL', 'SPATIAL', 'COMPETITIVE'][i % 3],
    weight: Math.random() * 5,
    parameters: {
      value: i,
      enabled: i % 2 === 0
    }
  }));
  
  // Migrate all constraints
  for (const constraint of testConstraints) {
    await migrator.migrateSingleConstraint(constraint);
  }
  
  // Get and finalize report
  const report = migrator.getReport();
  report.finalize();
  
  // Save report in different formats
  await report.save('migration-report.json');
  await report.save('migration-report.md');
  await report.save('migration-report.html');
  
  console.log('📊 Reports generated:');
  console.log('  - migration-report.json (detailed data)');
  console.log('  - migration-report.md (readable summary)');
  console.log('  - migration-report.html (interactive report)');
  
  console.log('\n');
}

// Main function to run all examples
async function main() {
  console.log('🚀 UCDL Constraint Migration Tool Examples\n');
  
  try {
    await migrateSingleConstraintExample();
    await migrateCustomClassExample();
    await validateMigratedConstraintsExample();
    await generateReportExample();
    
    // Uncomment these to test with real files
    // await migrateFileExample();
    // await migrateDirectoryExample();
    
    console.log('✅ All examples completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}

export {
  migrateSingleConstraintExample,
  migrateFileExample,
  migrateDirectoryExample,
  migrateCustomClassExample,
  validateMigratedConstraintsExample,
  generateReportExample
};