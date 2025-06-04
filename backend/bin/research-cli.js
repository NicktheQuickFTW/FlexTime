#!/usr/bin/env node
/**
 * Research Orchestration CLI
 * 
 * Command-line interface for managing the research orchestration system
 */

require('dotenv').config();
const ResearchOrchestrationHubImproved = require('../src/services/researchOrchestrationHubImproved');
const PerplexityResearchService = require('../src/services/perplexityResearchService');
const ResearchDataRetentionPolicy = require('../src/services/researchDataRetentionPolicy');
const { program } = require('commander');

// Initialize the orchestration hub
let hub = null;

async function initHub(options = {}) {
  if (!hub) {
    hub = new ResearchOrchestrationHubImproved({
      autoStart: false,
      enableScheduling: options.scheduling !== false,
      enableValidation: options.validation !== false,
      enableMonitoring: options.monitoring !== false,
      useRedis: false
    });
    await hub.initialize();
  }
  return hub;
}

// Command definitions
program
  .name('research-cli')
  .description('CLI for Big 12 Research Orchestration System')
  .version('1.0.0');

// Status command
program
  .command('status')
  .description('Get system status and health check')
  .action(async () => {
    try {
      const hub = await initHub();
      const status = await hub.getSystemStatus();
      
      console.log('\n📊 Research Orchestration System Status');
      console.log('=====================================');
      console.log(`Orchestrator: ${status.orchestrator}`);
      console.log(`Timestamp: ${status.timestamp}`);
      console.log(`Active Operations: ${status.activeOperations}`);
      console.log(`Health: ${status.health.status}`);
      
      if (status.health.issues.length > 0) {
        console.log('\n⚠️  Health Issues:');
        status.health.issues.forEach(issue => {
          console.log(`   - ${issue.severity}: ${issue.message}`);
        });
      }
      
      console.log('\n📈 Metrics:');
      console.log(`   Researches: Total=${status.metrics.researches.total}, Success=${status.metrics.researches.successful}, Failed=${status.metrics.researches.failed}`);
      console.log(`   Validations: Total=${status.metrics.validations.total}, Passed=${status.metrics.validations.passed}, Failed=${status.metrics.validations.failed}`);
      
      if (status.agents.scheduler) {
        console.log('\n🗓️  Scheduler Status:');
        console.log(`   Scheduled Tasks: ${status.agents.scheduler.scheduled}`);
        console.log(`   Active Jobs: ${status.agents.scheduler.activeJobs}`);
        console.log(`   Queue: Waiting=${status.agents.scheduler.queue.waitingCount}, Active=${status.agents.scheduler.queue.activeCount}, Completed=${status.agents.scheduler.queue.completedCount}`);
      }
      
      await hub.stop();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Research command
program
  .command('research <type> <sport>')
  .description('Trigger immediate research for a sport')
  .option('-t, --team <team>', 'Specific team name')
  .option('-p, --priority <priority>', 'Priority level (1-5)', '2')
  .action(async (type, sport, options) => {
    try {
      const hub = await initHub({ scheduling: true });
      
      console.log(`\n🔬 Scheduling ${type} research for ${sport}...`);
      
      const job = await hub.scheduleImmediate({
        type,
        sport,
        team: options.team,
        priority: parseInt(options.priority),
        description: `Manual ${type} research for ${sport}`
      });
      
      console.log(`✅ Research scheduled: Job ID ${job.id}`);
      console.log(`   Type: ${type}`);
      console.log(`   Sport: ${sport}`);
      if (options.team) console.log(`   Team: ${options.team}`);
      console.log(`   Priority: ${options.priority}`);
      
      // Wait a bit for job to start processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const status = await hub.agents.scheduler.getStatus();
      console.log(`\n📊 Current Queue Status:`);
      console.log(`   Active: ${status.queue.activeCount}`);
      console.log(`   Waiting: ${status.queue.waitingCount}`);
      console.log(`   Completed: ${status.queue.completedCount}`);
      
      await hub.stop();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// History command
program
  .command('history')
  .description('View research history')
  .option('-s, --sport <sport>', 'Filter by sport')
  .option('-t, --type <type>', 'Filter by research type')
  .option('-d, --days <days>', 'Number of days to look back', '7')
  .option('-l, --limit <limit>', 'Maximum results', '10')
  .action(async (options) => {
    try {
      const hub = await initHub();
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(options.days));
      
      const history = await hub.getResearchHistory({
        sport: options.sport,
        type: options.type,
        startDate,
        limit: parseInt(options.limit)
      });
      
      console.log(`\n📜 Research History (Last ${options.days} days)`);
      console.log('=' .repeat(60));
      
      if (history.length === 0) {
        console.log('No research found matching criteria');
      } else {
        history.forEach((record, index) => {
          console.log(`\n${index + 1}. ${record.research_type} - ${record.sport}`);
          console.log(`   ID: ${record.research_id}`);
          console.log(`   Created: ${new Date(record.created_at).toLocaleString()}`);
          console.log(`   Validation: ${record.validation_status || 'pending'} (confidence: ${record.validation_confidence || 0})`);
        });
      }
      
      await hub.stop();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Retention command
program
  .command('retention')
  .description('View or manage data retention policies')
  .option('-r, --report', 'Generate retention policy report')
  .option('-m, --maintenance', 'Run data maintenance')
  .action(async (options) => {
    try {
      const hub = await initHub();
      
      if (options.report) {
        const report = await hub.getRetentionPolicyReport();
        
        console.log('\n📋 Data Retention Policy Report');
        console.log('=' .repeat(60));
        console.log(`Generated: ${report.timestamp}`);
        
        Object.entries(report.policies).forEach(([category, policy]) => {
          console.log(`\n${category.toUpperCase()}:`);
          console.log(`   Description: ${policy.description}`);
          console.log(`   Tables: ${policy.tables.join(', ')}`);
          if (policy.retention === 'permanent') {
            console.log(`   Retention: PERMANENT`);
          } else if (typeof policy.retention === 'object') {
            console.log(`   Retention:`);
            Object.entries(policy.retention).forEach(([table, days]) => {
              console.log(`      - ${table}: ${days} days`);
            });
          }
        });
        
        if (report.statistics) {
          console.log('\n📊 Current Data Statistics:');
          Object.entries(report.statistics).forEach(([category, tables]) => {
            console.log(`\n${category}:`);
            Object.entries(tables).forEach(([table, stats]) => {
              if (stats === 'N/A') {
                console.log(`   ${table}: Table not found`);
              } else if (typeof stats === 'number') {
                console.log(`   ${table}: ${stats} records`);
              } else {
                console.log(`   ${table}: ${stats.total} total, ${stats.eligibleForDeletion} eligible for deletion`);
              }
            });
          });
        }
      }
      
      if (options.maintenance) {
        console.log('\n🔧 Running data maintenance...');
        const results = await hub.performDataMaintenance();
        
        console.log('\n✅ Maintenance completed');
        console.log(`   Timestamp: ${results.timestamp}`);
        
        if (Object.keys(results.cleaned).length > 0) {
          console.log('\n🧹 Cleaned:');
          Object.entries(results.cleaned).forEach(([table, count]) => {
            console.log(`   ${table}: ${count} records`);
          });
        }
        
        if (Object.keys(results.archived).length > 0) {
          console.log('\n📦 Archived:');
          Object.entries(results.archived).forEach(([table, count]) => {
            console.log(`   ${table}: ${count} records`);
          });
        }
        
        if (results.errors.length > 0) {
          console.log('\n❌ Errors:');
          results.errors.forEach(error => {
            console.log(`   ${error.table}: ${error.error}`);
          });
        }
      }
      
      await hub.stop();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate <sport>')
  .description('Validate sport name')
  .action(async (sport) => {
    try {
      const perplexity = new PerplexityResearchService();
      const isValid = perplexity.validateSport(sport);
      
      if (isValid) {
        console.log(`✅ "${sport}" is a valid sport`);
      } else {
        console.log(`❌ "${sport}" is not a valid sport`);
        console.log('\nValid sports include:');
        console.log('  - football');
        console.log('  - men\'s basketball, women\'s basketball');
        console.log('  - baseball, softball');
        console.log('  - volleyball, women\'s volleyball');
        console.log('  - soccer, women\'s soccer');
        console.log('  - tennis, men\'s tennis, women\'s tennis');
        console.log('  - wrestling, gymnastics, lacrosse');
        console.log('  - swimming & diving, golf, track & field, cross country');
        console.log('  (with men\'s/women\'s prefixes where applicable)');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Event command
program
  .command('event <type>')
  .description('Trigger a research event')
  .option('-s, --sport <sport>', 'Sport name', 'football')
  .option('-t, --team <team>', 'Team name')
  .option('-d, --data <data>', 'Additional JSON data')
  .action(async (type, options) => {
    try {
      const hub = await initHub({ scheduling: true });
      
      let eventData = {
        sport: options.sport,
        team: options.team
      };
      
      if (options.data) {
        try {
          const additionalData = JSON.parse(options.data);
          eventData = { ...eventData, ...additionalData };
        } catch (e) {
          console.error('⚠️  Invalid JSON data provided');
        }
      }
      
      console.log(`\n📢 Triggering ${type} event...`);
      console.log(`   Data: ${JSON.stringify(eventData, null, 2)}`);
      
      await hub.triggerEvent(type, eventData);
      
      console.log('✅ Event triggered successfully');
      
      await hub.stop();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}