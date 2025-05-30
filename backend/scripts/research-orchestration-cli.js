#!/usr/bin/env node

/**
 * Research Orchestration CLI
 * 
 * Command-line interface for managing the research orchestration system
 */

const { Command } = require('commander');
const axios = require('axios');
const chalk = require('chalk');
const Table = require('cli-table3');
const moment = require('moment');
const WebSocket = require('ws');

const program = new Command();
const API_BASE_URL = process.env.API_URL || 'http://localhost:3005/api/research-orchestration';

// Helper functions
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

const formatDate = (date) => moment(date).format('YYYY-MM-DD HH:mm:ss');
const formatDuration = (ms) => moment.duration(ms).humanize();

// Status command
program
  .command('status')
  .description('Show current orchestration system status')
  .action(async () => {
    try {
      const response = await api.get('/status');
      const { orchestration, feedback } = response.data;
      
      console.log(chalk.cyan('\n🎯 Research Orchestration Status\n'));
      
      // System overview
      console.log(chalk.yellow('System Overview:'));
      console.log(`  Status: ${chalk.green(orchestration.orchestrator)}`);
      console.log(`  Active Operations: ${orchestration.activeOperations}`);
      console.log(`  Health: ${orchestration.health.status === 'healthy' ? chalk.green('✓ Healthy') : chalk.red('✗ ' + orchestration.health.status)}`);
      
      // Metrics
      console.log(chalk.yellow('\nMetrics:'));
      const metricsTable = new Table({
        head: ['Metric', 'Total', 'Successful', 'Failed', 'Success Rate'],
        colWidths: [20, 10, 15, 10, 15]
      });
      
      metricsTable.push(
        ['Researches', 
         orchestration.metrics.researches.total,
         orchestration.metrics.researches.successful,
         orchestration.metrics.researches.failed,
         `${((orchestration.metrics.researches.successful / orchestration.metrics.researches.total || 0) * 100).toFixed(1)}%`
        ],
        ['Validations',
         orchestration.metrics.validations.total,
         orchestration.metrics.validations.passed,
         orchestration.metrics.validations.failed,
         `${((orchestration.metrics.validations.passed / orchestration.metrics.validations.total || 0) * 100).toFixed(1)}%`
        ]
      );
      
      console.log(metricsTable.toString());
      
      // Scheduler status
      if (orchestration.agents.scheduler) {
        console.log(chalk.yellow('\nScheduler Status:'));
        console.log(`  Scheduled Jobs: ${orchestration.agents.scheduler.scheduled}`);
        console.log(`  Queue: ${JSON.stringify(orchestration.agents.scheduler.queue)}`);
        console.log(`  API Usage: ${orchestration.agents.scheduler.apiUsage.lastMinute}/min, ${orchestration.agents.scheduler.apiUsage.lastHour}/hr`);
      }
      
      // Feedback insights
      if (feedback.insights.length > 0) {
        console.log(chalk.yellow('\nFeedback Insights:'));
        feedback.insights.forEach(insight => {
          console.log(`  • ${insight.message || JSON.stringify(insight)}`);
        });
      }
      
    } catch (error) {
      console.error(chalk.red('Error getting status:'), error.message);
    }
  });

// Start command
program
  .command('start')
  .description('Start the research orchestration system')
  .action(async () => {
    try {
      console.log(chalk.cyan('Starting research orchestration...'));
      const response = await api.post('/start');
      console.log(chalk.green('✓ ' + response.data.message));
    } catch (error) {
      console.error(chalk.red('Error starting orchestration:'), error.message);
    }
  });

// Stop command
program
  .command('stop')
  .description('Stop the research orchestration system')
  .action(async () => {
    try {
      console.log(chalk.cyan('Stopping research orchestration...'));
      const response = await api.post('/stop');
      console.log(chalk.green('✓ ' + response.data.message));
    } catch (error) {
      console.error(chalk.red('Error stopping orchestration:'), error.message);
    }
  });

// Schedule command
program
  .command('schedule <type>')
  .description('Schedule immediate research')
  .option('-s, --sports <sports...>', 'Sports to research (space-separated)')
  .option('-t, --teams <teams...>', 'Specific teams to research')
  .option('-p, --priority <number>', 'Priority level (1-5)', '2')
  .action(async (type, options) => {
    try {
      const validTypes = ['comprehensive', 'transfer_portal', 'recruiting', 'compass_ratings'];
      if (!validTypes.includes(type)) {
        console.error(chalk.red(`Invalid type. Must be one of: ${validTypes.join(', ')}`));
        return;
      }
      
      const payload = {
        type,
        sports: options.sports || ['all'],
        teams: options.teams,
        priority: parseInt(options.priority)
      };
      
      console.log(chalk.cyan('Scheduling research...'));
      console.log(chalk.gray(JSON.stringify(payload, null, 2)));
      
      const response = await api.post('/schedule', payload);
      console.log(chalk.green('✓ Research scheduled successfully'));
      
    } catch (error) {
      console.error(chalk.red('Error scheduling research:'), error.message);
    }
  });

// Trigger event command
program
  .command('trigger <event>')
  .description('Trigger an event-driven research')
  .option('-s, --sport <sport>', 'Sport')
  .option('-t, --team <team>', 'Team')
  .option('-d, --data <json>', 'Additional data (JSON string)')
  .action(async (event, options) => {
    try {
      const validEvents = [
        'transfer_portal_update',
        'coaching_change',
        'game_completed',
        'recruiting_update'
      ];
      
      if (!validEvents.includes(event)) {
        console.error(chalk.red(`Invalid event. Must be one of: ${validEvents.join(', ')}`));
        return;
      }
      
      const data = {
        sport: options.sport,
        team: options.team,
        ...(options.data ? JSON.parse(options.data) : {})
      };
      
      console.log(chalk.cyan(`Triggering ${event}...`));
      const response = await api.post('/trigger-event', { event, data });
      console.log(chalk.green('✓ ' + response.data.message));
      
    } catch (error) {
      console.error(chalk.red('Error triggering event:'), error.message);
    }
  });

// History command
program
  .command('history')
  .description('View research history')
  .option('-s, --sport <sport>', 'Filter by sport')
  .option('-t, --type <type>', 'Filter by type')
  .option('-l, --limit <number>', 'Limit results', '20')
  .action(async (options) => {
    try {
      const response = await api.get('/history', { params: options });
      const { history } = response.data;
      
      if (history.length === 0) {
        console.log(chalk.yellow('No research history found'));
        return;
      }
      
      console.log(chalk.cyan(`\n📜 Research History (${history.length} records)\n`));
      
      const table = new Table({
        head: ['Date', 'Type', 'Sport', 'Team', 'Status', 'Confidence'],
        colWidths: [20, 15, 12, 20, 12, 12]
      });
      
      history.forEach(record => {
        table.push([
          formatDate(record.created_at),
          record.research_type || 'N/A',
          record.sport || 'N/A',
          record.team_name || 'All',
          record.status || 'completed',
          record.research_confidence ? `${(record.research_confidence * 100).toFixed(0)}%` : 'N/A'
        ]);
      });
      
      console.log(table.toString());
      
    } catch (error) {
      console.error(chalk.red('Error getting history:'), error.message);
    }
  });

// Clear command
program
  .command('clear')
  .description('Clear research data (respects retention policies)')
  .option('-s, --sport <sport>', 'Clear data for specific sport')
  .option('-t, --type <type>', 'Clear specific type of research')
  .option('-o, --older-than <days>', 'Clear data older than N days')
  .option('--table <table>', 'Specific table to clear (default: comprehensive_research_data)')
  .option('-f, --force', 'Force deletion (override retention policy)')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (options) => {
    try {
      if (!options.yes) {
        const filters = [];
        if (options.sport) filters.push(`sport: ${options.sport}`);
        if (options.type) filters.push(`type: ${options.type}`);
        if (options.olderThan) filters.push(`older than ${options.olderThan} days`);
        if (options.table) filters.push(`table: ${options.table}`);
        
        console.log(chalk.yellow(`\n⚠️  This will delete research data with filters: ${filters.join(', ')}`));
        if (options.force) {
          console.log(chalk.red('⚠️  FORCE MODE: Retention policies will be overridden!'));
        }
        console.log(chalk.yellow('Use --yes flag to confirm\n'));
        return;
      }
      
      const payload = {
        sport: options.sport,
        type: options.type,
        olderThan: options.olderThan ? moment().subtract(options.olderThan, 'days').toISOString() : undefined,
        tableName: options.table,
        force: options.force,
        confirm: true
      };
      
      console.log(chalk.cyan('Clearing research data...'));
      const response = await api.delete('/clear', { data: payload });
      console.log(chalk.green(`✓ Deleted ${response.data.deleted} records from ${response.data.table}`));
      
      if (response.data.policy) {
        console.log(chalk.gray(`Policy: ${JSON.stringify(response.data.policy)}`));
      }
      
    } catch (error) {
      console.error(chalk.red('Error clearing data:'), error.message);
    }
  });

// Retention policy command
program
  .command('retention-policy')
  .description('View data retention policies and statistics')
  .action(async () => {
    try {
      const response = await api.get('/retention-policy');
      const { report } = response.data;
      
      console.log(chalk.cyan('\n📋 Data Retention Policies\n'));
      
      // Display policies
      Object.entries(report.policies).forEach(([category, policy]) => {
        console.log(chalk.yellow(`${category.toUpperCase()}:`));
        console.log(`  Description: ${policy.description}`);
        console.log(`  Tables: ${policy.tables.join(', ')}`);
        
        if (policy.retention === 'permanent') {
          console.log(`  Retention: ${chalk.green('PERMANENT - Never deleted')}`);
        } else if (typeof policy.retention === 'object') {
          console.log('  Retention periods:');
          Object.entries(policy.retention).forEach(([table, days]) => {
            console.log(`    ${table}: ${days} days`);
          });
        }
        console.log();
      });
      
      // Display statistics if available
      if (report.statistics) {
        console.log(chalk.yellow('CURRENT DATA STATISTICS:'));
        
        // Permanent data
        if (report.statistics.permanent) {
          console.log(chalk.green('\nPermanent Data (never deleted):'));
          const permTable = new Table({
            head: ['Table', 'Record Count'],
            colWidths: [40, 20]
          });
          
          Object.entries(report.statistics.permanent).forEach(([table, count]) => {
            permTable.push([table, count]);
          });
          
          console.log(permTable.toString());
        }
        
        // Other categories
        ['semiPermanent', 'temporary', 'cache'].forEach(category => {
          if (report.statistics[category] && Object.keys(report.statistics[category]).length > 0) {
            console.log(chalk.yellow(`\n${category.replace(/([A-Z])/g, ' $1').trim()} Data:`));
            
            const catTable = new Table({
              head: ['Table', 'Total', 'Eligible for Deletion', 'Retention (days)'],
              colWidths: [30, 10, 20, 15]
            });
            
            Object.entries(report.statistics[category]).forEach(([table, stats]) => {
              if (stats !== 'N/A') {
                catTable.push([
                  table,
                  stats.total,
                  stats.eligibleForDeletion,
                  stats.retentionDays
                ]);
              }
            });
            
            console.log(catTable.toString());
          }
        });
      }
      
      // Display special rules
      console.log(chalk.yellow('\nSPECIAL RULES:'));
      Object.entries(report.specialRules).forEach(([rule, enabled]) => {
        console.log(`  ${rule}: ${enabled ? chalk.green('✓ Enabled') : chalk.red('✗ Disabled')}`);
      });
      
    } catch (error) {
      console.error(chalk.red('Error getting retention policy:'), error.message);
    }
  });

// Maintenance command
program
  .command('maintenance')
  .description('Perform data maintenance based on retention policies')
  .action(async () => {
    try {
      console.log(chalk.cyan('🔧 Performing data maintenance...\n'));
      
      const response = await api.post('/maintenance');
      const { results } = response.data;
      
      console.log(chalk.green('✓ Maintenance completed\n'));
      
      // Display cleaned records
      if (Object.keys(results.cleaned).length > 0) {
        console.log(chalk.yellow('Cleaned Records:'));
        Object.entries(results.cleaned).forEach(([table, count]) => {
          console.log(`  ${table}: ${count} records deleted`);
        });
      }
      
      // Display archived records
      if (Object.keys(results.archived).length > 0) {
        console.log(chalk.yellow('\nArchived Records:'));
        Object.entries(results.archived).forEach(([table, count]) => {
          console.log(`  ${table}: ${count} records archived`);
        });
      }
      
      // Display errors
      if (results.errors.length > 0) {
        console.log(chalk.red('\nErrors:'));
        results.errors.forEach(err => {
          console.log(`  ${err.table}: ${err.error}`);
        });
      }
      
      // Summary
      const totalCleaned = Object.values(results.cleaned).reduce((sum, count) => sum + count, 0);
      const totalArchived = Object.values(results.archived).reduce((sum, count) => sum + count, 0);
      
      console.log(chalk.cyan(`\nSummary: ${totalCleaned} records cleaned, ${totalArchived} records archived`));
      
    } catch (error) {
      console.error(chalk.red('Error performing maintenance:'), error.message);
    }
  });

// Monitor command
program
  .command('monitor')
  .description('Monitor orchestration system in real-time')
  .action(() => {
    console.log(chalk.cyan('📡 Connecting to orchestration monitor...\n'));
    
    const wsUrl = API_BASE_URL.replace('http', 'ws') + '/monitor';
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log(chalk.green('✓ Connected to monitoring stream'));
      console.log(chalk.gray('Press Ctrl+C to exit\n'));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        const timestamp = chalk.gray(`[${moment().format('HH:mm:ss')}]`);
        
        switch (message.type) {
          case 'status_update':
            console.log(`${timestamp} ${chalk.blue('STATUS')} Active: ${message.data.activeOperations}, Health: ${message.data.health.status}`);
            break;
            
          case 'research_completed':
            console.log(`${timestamp} ${chalk.green('COMPLETED')} ${message.data.operation.type} for ${message.data.operation.sport} (${formatDuration(message.data.operation.duration)})`);
            break;
            
          case 'research_failed':
            console.log(`${timestamp} ${chalk.red('FAILED')} ${message.data.operation.type}: ${message.data.error.message}`);
            break;
            
          case 'health_alert':
            console.log(`${timestamp} ${chalk.yellow('ALERT')} ${message.data.issues.map(i => i.message).join(', ')}`);
            break;
            
          case 'feedback_analysis':
            console.log(`${timestamp} ${chalk.magenta('FEEDBACK')} Accuracy: ${(message.data.metrics.accuracy.current * 100).toFixed(1)}%, Recommendations: ${message.data.recommendations.length}`);
            break;
            
          case 'system_adjusted':
            console.log(`${timestamp} ${chalk.cyan('ADJUSTED')} ${message.data.adjustments.map(a => a.type).join(', ')}`);
            break;
        }
      } catch (error) {
        console.error(chalk.red('Monitor error:'), error.message);
      }
    });
    
    ws.on('error', (error) => {
      console.error(chalk.red('WebSocket error:'), error.message);
    });
    
    ws.on('close', () => {
      console.log(chalk.yellow('\n📡 Monitoring connection closed'));
      process.exit(0);
    });
    
    // Keep connection alive
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  });

// Insights command
program
  .command('insights')
  .description('View feedback agent insights and recommendations')
  .action(async () => {
    try {
      const response = await api.get('/feedback/insights');
      const { insights, metrics, recommendations } = response.data;
      
      console.log(chalk.cyan('\n🔍 Research System Insights\n'));
      
      // Performance metrics
      console.log(chalk.yellow('Performance Metrics:'));
      console.log(`  Accuracy: ${chalk.green((metrics.accuracy.current * 100).toFixed(1) + '%')} (target: ${(metrics.accuracy.target * 100)}%)`);
      console.log(`  Completeness: ${chalk.green((metrics.completeness.current * 100).toFixed(1) + '%')} (target: ${(metrics.completeness.target * 100)}%)`);
      console.log(`  Timeliness: ${chalk.green((metrics.timeliness.current * 100).toFixed(1) + '%')} (target: ${(metrics.timeliness.target * 100)}%)`);
      console.log(`  API Efficiency: ${chalk.green((metrics.apiEfficiency.current * 100).toFixed(1) + '%')} (target: ${(metrics.apiEfficiency.target * 100)}%)`);
      
      // Insights
      if (insights.length > 0) {
        console.log(chalk.yellow('\nKey Insights:'));
        insights.forEach((insight, i) => {
          console.log(`  ${i + 1}. ${insight.message || JSON.stringify(insight)}`);
        });
      }
      
      // Recommendations
      if (recommendations && recommendations.length > 0) {
        console.log(chalk.yellow('\nRecommendations:'));
        recommendations.forEach((rec, i) => {
          console.log(`  ${i + 1}. [${rec.severity}] ${rec.message}`);
        });
      }
      
    } catch (error) {
      console.error(chalk.red('Error getting insights:'), error.message);
    }
  });

// Parse command-line arguments
program
  .name('research-orchestration')
  .description('CLI for managing FlexTime research orchestration')
  .version('1.0.0');

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}