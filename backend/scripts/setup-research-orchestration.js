#!/usr/bin/env node

/**
 * Setup Research Orchestration
 * 
 * Quick setup script to initialize the research orchestration system
 */

const { Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const config = require('../config/neon_db_config');

async function setup() {
  console.log(chalk.cyan('🚀 Setting up Research Orchestration System\n'));
  
  const sequelize = new Sequelize(config.connectionString, {
    dialectOptions: config.connection.dialectOptions,
    logging: false
  });
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log(chalk.green('✓ Database connection established'));
    
    // Create tracking tables
    console.log(chalk.cyan('\n📊 Creating research tracking tables...'));
    const sqlPath = path.join(__dirname, 'create-research-tracking-tables.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await sequelize.query(statement + ';');
        console.log(chalk.gray('✓ ' + statement.split('\n')[0].substring(0, 50) + '...'));
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(chalk.yellow('⚠ Table/view already exists, skipping...'));
        } else {
          throw error;
        }
      }
    }
    
    console.log(chalk.green('\n✓ All tracking tables created successfully'));
    
    // Check for required dependencies
    console.log(chalk.cyan('\n🔍 Checking dependencies...'));
    const dependencies = [
      'bull',
      'ioredis',
      'moment',
      'simple-statistics',
      'cli-table3',
      'commander',
      'ws'
    ];
    
    const packageJson = require('../package.json');
    const missing = dependencies.filter(dep => !packageJson.dependencies[dep]);
    
    if (missing.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Missing dependencies: ${missing.join(', ')}`));
      console.log(chalk.yellow('Run: npm install ' + missing.join(' ')));
    } else {
      console.log(chalk.green('✓ All dependencies installed'));
    }
    
    // Create data directories
    console.log(chalk.cyan('\n📁 Creating data directories...'));
    const dirs = [
      path.join(__dirname, '../../data/research_results'),
      path.join(__dirname, '../../data/research_cache'),
      path.join(__dirname, '../../data/research_logs')
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(chalk.green('✓ ' + dir));
      } catch (error) {
        console.log(chalk.yellow('⚠ ' + dir + ' (already exists)'));
      }
    }
    
    // Make CLI executable
    console.log(chalk.cyan('\n🔧 Setting up CLI...'));
    const cliPath = path.join(__dirname, 'research-orchestration-cli.js');
    try {
      await fs.chmod(cliPath, '755');
      console.log(chalk.green('✓ CLI script made executable'));
    } catch (error) {
      console.log(chalk.yellow('⚠ Could not set CLI permissions'));
    }
    
    // Setup instructions
    console.log(chalk.cyan('\n📋 Setup Complete!\n'));
    console.log(chalk.white('To use the Research Orchestration System:'));
    console.log(chalk.gray('\n1. Start Redis (required for job queue):'));
    console.log(chalk.white('   docker run -d -p 6379:6379 redis:alpine'));
    
    console.log(chalk.gray('\n2. Start the FlexTime backend:'));
    console.log(chalk.white('   npm start'));
    
    console.log(chalk.gray('\n3. Use the CLI to manage research:'));
    console.log(chalk.white('   ./scripts/research-orchestration-cli.js status'));
    console.log(chalk.white('   ./scripts/research-orchestration-cli.js start'));
    console.log(chalk.white('   ./scripts/research-orchestration-cli.js monitor'));
    
    console.log(chalk.gray('\n4. Or use the REST API:'));
    console.log(chalk.white('   GET  /api/research-orchestration/status'));
    console.log(chalk.white('   POST /api/research-orchestration/start'));
    console.log(chalk.white('   POST /api/research-orchestration/schedule'));
    
    console.log(chalk.gray('\n5. Schedule immediate research:'));
    console.log(chalk.white('   ./scripts/research-orchestration-cli.js schedule comprehensive -s basketball football'));
    
    console.log(chalk.gray('\n6. Trigger event-based research:'));
    console.log(chalk.white('   ./scripts/research-orchestration-cli.js trigger transfer_portal_update -s basketball -t Kansas'));
    
    console.log(chalk.green('\n✨ Research Orchestration System is ready to use!\n'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'), error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run setup
if (require.main === module) {
  setup().catch(console.error);
}

module.exports = setup;