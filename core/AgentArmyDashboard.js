/**
 * FlexTime Agent Army Status Dashboard
 * 
 * Real-time monitoring and management interface for the complete agent ecosystem
 * Provides comprehensive visibility into agent health, performance, and coordination
 */

import { messagingBus } from './RedisMessagingBus.js';
import { healthMonitor } from './AgentHealthMonitor.js';
import { aiSDK } from '../ai/aiSDKService.js';
import chalk from 'chalk';

export class AgentArmyDashboard {
  constructor() {
    this.serviceId = 'agent_army_dashboard';
    this.isRunning = false;
    this.refreshInterval = null;
    this.displayData = {
      agents: new Map(),
      systemMetrics: {},
      recentActivity: [],
      alerts: [],
      performance: {},
      lastUpdate: null
    };

    this.config = {
      refreshRate: 5000,        // 5 seconds
      maxActivityHistory: 50,   // Keep last 50 activities
      maxAlertHistory: 20       // Keep last 20 alerts
    };
  }

  /**
   * Start the dashboard
   */
  async start() {
    if (this.isRunning) return;

    console.log(chalk.cyan.bold('🚀 Starting FlexTime Agent Army Dashboard'));
    console.log(chalk.gray('=' * 80));
    
    this.isRunning = true;
    
    try {
      // Initial data collection
      await this.collectDashboardData();
      
      // Display initial dashboard
      this.displayDashboard();
      
      // Start auto-refresh
      this.startAutoRefresh();
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log(chalk.green('\n✅ Dashboard started successfully'));
      console.log(chalk.gray(`Press Ctrl+C to stop monitoring\n`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to start dashboard:'), error);
      this.isRunning = false;
    }
  }

  /**
   * Stop the dashboard
   */
  async stop() {
    this.isRunning = false;
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    console.log(chalk.yellow('\n👋 Dashboard stopped'));
  }

  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    this.refreshInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.collectDashboardData();
        this.displayDashboard();
      }
    }, this.config.refreshRate);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for messaging bus events
    messagingBus.on('message', (message) => {
      this.addRecentActivity({
        type: 'message',
        source: message.from || 'unknown',
        description: `${message.type} message`,
        timestamp: new Date().toISOString()
      });
    });

    // Listen for health monitor alerts
    healthMonitor.on('alert', (alert) => {
      this.displayData.alerts.unshift({
        ...alert,
        displayTime: new Date().toLocaleTimeString()
      });
      
      // Keep only recent alerts
      if (this.displayData.alerts.length > this.config.maxAlertHistory) {
        this.displayData.alerts = this.displayData.alerts.slice(0, this.config.maxAlertHistory);
      }
    });

    // Listen for agent status changes
    messagingBus.on('agent_status_update', (data) => {
      this.addRecentActivity({
        type: 'status_change',
        source: data.agentId,
        description: `Status: ${data.newStatus}`,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Collect all dashboard data
   */
  async collectDashboardData() {
    try {
      // Collect messaging bus data
      const messagingMetrics = messagingBus.getMetrics();
      const agentRegistry = messagingBus.getAgentRegistry();
      
      // Collect health monitoring data
      const healthReport = healthMonitor.getHealthReport();
      
      // Collect AI SDK data
      const aiMetrics = aiSDK.getMetrics();
      const aiProviders = aiSDK.getProviderStatus();
      
      // Update display data
      this.displayData.systemMetrics = {
        messaging: messagingMetrics,
        health: healthReport.systemMetrics,
        ai: aiMetrics
      };
      
      this.displayData.agents.clear();
      agentRegistry.forEach(agent => {
        this.displayData.agents.set(agent.agentId, {
          ...agent,
          healthMetrics: healthReport.agentMetrics[agent.agentId] || {},
          displayStatus: this.getDisplayStatus(agent)
        });
      });
      
      this.displayData.performance = {
        messaging: {
          latency: messagingMetrics.averageLatency,
          throughput: messagingMetrics.messagesPublished + messagingMetrics.messagesConsumed,
          errorRate: (messagingMetrics.messageFailures / (messagingMetrics.messagesPublished || 1)) * 100
        },
        ai: {
          cacheHitRate: aiMetrics.cacheHitRate,
          errorRate: aiMetrics.errorRate,
          responseTime: aiMetrics.averageResponseTime,
          providers: aiProviders.filter(p => p.available).length
        },
        system: {
          uptime: Date.now() - healthReport.systemMetrics.lastUpdated ? 0 : Date.now(),
          totalRequests: healthReport.systemMetrics.totalRequests,
          activeAgents: healthReport.systemMetrics.activeAgents
        }
      };
      
      this.displayData.lastUpdate = new Date().toLocaleTimeString();

    } catch (error) {
      console.error(chalk.red('❌ Failed to collect dashboard data:'), error);
    }
  }

  /**
   * Display the complete dashboard
   */
  displayDashboard() {
    // Clear screen
    console.clear();
    
    // Header
    this.displayHeader();
    
    // System overview
    this.displaySystemOverview();
    
    // Agent status
    this.displayAgentStatus();
    
    // Performance metrics
    this.displayPerformanceMetrics();
    
    // Recent activity
    this.displayRecentActivity();
    
    // Active alerts
    this.displayActiveAlerts();
    
    // Footer
    this.displayFooter();
  }

  /**
   * Display header
   */
  displayHeader() {
    const title = '🤖 FlexTime Agent Army Dashboard';
    const subtitle = 'Real-time monitoring of distributed scheduling optimization agents';
    
    console.log(chalk.cyan.bold(title));
    console.log(chalk.gray(subtitle));
    console.log(chalk.gray('─'.repeat(80)));
    console.log();
  }

  /**
   * Display system overview
   */
  displaySystemOverview() {
    const metrics = this.displayData.systemMetrics;
    
    console.log(chalk.blue.bold('📊 System Overview'));
    console.log();
    
    // Messaging system status
    const messagingStatus = metrics.messaging?.redis_connected ? 
      chalk.green('🟢 Connected') : chalk.red('🔴 Disconnected');
    console.log(`Redis Messaging:  ${messagingStatus}`);
    
    // AI SDK status
    const aiStatus = metrics.ai?.redis_connected ? 
      chalk.green('🟢 Connected') : chalk.red('🔴 Disconnected');
    console.log(`AI SDK Service:   ${aiStatus}`);
    
    // Health monitoring
    const healthStatus = metrics.health ? 
      chalk.green('🟢 Active') : chalk.yellow('🟡 Limited');
    console.log(`Health Monitor:   ${healthStatus}`);
    
    // System load
    const systemLoad = metrics.health?.systemLoad || 0;
    const loadColor = systemLoad > 80 ? chalk.red : systemLoad > 60 ? chalk.yellow : chalk.green;
    console.log(`System Load:      ${loadColor(systemLoad.toFixed(1) + '%')}`);
    
    console.log();
  }

  /**
   * Display agent status
   */
  displayAgentStatus() {
    console.log(chalk.blue.bold('🤖 Agent Status'));
    console.log();
    
    if (this.displayData.agents.size === 0) {
      console.log(chalk.yellow('  No agents registered'));
      console.log();
      return;
    }
    
    // Header
    console.log(chalk.gray('Agent ID'.padEnd(20) + 'Status'.padEnd(12) + 'Load'.padEnd(12) + 'Capabilities'));
    console.log(chalk.gray('─'.repeat(80)));
    
    // Agent rows
    for (const [agentId, agent] of this.displayData.agents) {
      const displayId = agentId.length > 18 ? agentId.substring(0, 15) + '...' : agentId;
      const status = this.getColoredStatus(agent.displayStatus);
      const load = `${agent.currentLoad || 0}/${agent.maxLoad || 0}`;
      const capabilities = agent.capabilities?.slice(0, 3).join(', ') || 'none';
      
      console.log(
        `${displayId.padEnd(20)}${status.padEnd(20)}${load.padEnd(12)}${capabilities}`
      );
    }
    
    console.log();
  }

  /**
   * Display performance metrics
   */
  displayPerformanceMetrics() {
    console.log(chalk.blue.bold('⚡ Performance Metrics'));
    console.log();
    
    const perf = this.displayData.performance;
    
    // Messaging performance
    console.log(chalk.cyan('Messaging:'));
    console.log(`  Latency:     ${(perf.messaging?.latency || 0).toFixed(1)}ms`);
    console.log(`  Throughput:  ${perf.messaging?.throughput || 0} msg/min`);
    console.log(`  Error Rate:  ${(perf.messaging?.errorRate || 0).toFixed(1)}%`);
    console.log();
    
    // AI performance
    console.log(chalk.cyan('AI Services:'));
    console.log(`  Cache Hit:   ${(perf.ai?.cacheHitRate || 0).toFixed(1)}%`);
    console.log(`  Response:    ${(perf.ai?.responseTime || 0).toFixed(1)}ms`);
    console.log(`  Providers:   ${perf.ai?.providers || 0} available`);
    console.log(`  Error Rate:  ${(perf.ai?.errorRate || 0).toFixed(1)}%`);
    console.log();
  }

  /**
   * Display recent activity
   */
  displayRecentActivity() {
    console.log(chalk.blue.bold('📋 Recent Activity'));
    console.log();
    
    if (this.displayData.recentActivity.length === 0) {
      console.log(chalk.gray('  No recent activity'));
      console.log();
      return;
    }
    
    const recentActivities = this.displayData.recentActivity.slice(0, 8);
    
    recentActivities.forEach(activity => {
      const time = new Date(activity.timestamp).toLocaleTimeString();
      const typeColor = this.getActivityColor(activity.type);
      
      console.log(`  ${chalk.gray(time)} ${typeColor(activity.type.padEnd(12))} ${activity.source.padEnd(15)} ${activity.description}`);
    });
    
    console.log();
  }

  /**
   * Display active alerts
   */
  displayActiveAlerts() {
    console.log(chalk.blue.bold('🚨 Active Alerts'));
    console.log();
    
    const activeAlerts = this.displayData.alerts.filter(a => a.status === 'active').slice(0, 5);
    
    if (activeAlerts.length === 0) {
      console.log(chalk.green('  No active alerts - All systems healthy'));
      console.log();
      return;
    }
    
    activeAlerts.forEach(alert => {
      const severityColor = this.getSeverityColor(alert.severity);
      console.log(`  ${severityColor(alert.severity.toUpperCase().padEnd(8))} ${alert.displayTime} ${alert.message}`);
    });
    
    console.log();
  }

  /**
   * Display footer
   */
  displayFooter() {
    console.log(chalk.gray('─'.repeat(80)));
    console.log(chalk.gray(`Last Updated: ${this.displayData.lastUpdate} | Refresh Rate: ${this.config.refreshRate/1000}s | Press Ctrl+C to exit`));
  }

  /**
   * Helper methods
   */
  getDisplayStatus(agent) {
    if (agent.isStale) return 'stale';
    if (!agent.status) return 'unknown';
    return agent.status;
  }

  getColoredStatus(status) {
    switch (status) {
      case 'active':
      case 'ready':
        return chalk.green('🟢 Ready');
      case 'busy':
        return chalk.yellow('🟡 Busy');
      case 'stale':
        return chalk.red('🔴 Stale');
      case 'error':
      case 'failed':
        return chalk.red('🔴 Error');
      default:
        return chalk.gray('⚪ Unknown');
    }
  }

  getActivityColor(type) {
    switch (type) {
      case 'message':
        return chalk.blue;
      case 'status_change':
        return chalk.yellow;
      case 'optimization':
        return chalk.green;
      case 'error':
        return chalk.red;
      default:
        return chalk.gray;
    }
  }

  getSeverityColor(severity) {
    switch (severity) {
      case 'critical':
        return chalk.red.bold;
      case 'error':
        return chalk.red;
      case 'warning':
        return chalk.yellow;
      case 'info':
        return chalk.blue;
      default:
        return chalk.gray;
    }
  }

  addRecentActivity(activity) {
    this.displayData.recentActivity.unshift(activity);
    
    // Keep only recent activities
    if (this.displayData.recentActivity.length > this.config.maxActivityHistory) {
      this.displayData.recentActivity = this.displayData.recentActivity.slice(0, this.config.maxActivityHistory);
    }
  }

  /**
   * Generate detailed status report
   */
  generateStatusReport() {
    const report = {
      timestamp: new Date().toISOString(),
      system: {
        status: 'operational',
        uptime: this.displayData.performance.system?.uptime || 0,
        totalAgents: this.displayData.agents.size,
        activeAgents: Array.from(this.displayData.agents.values()).filter(a => a.displayStatus === 'active').length,
        systemLoad: this.displayData.systemMetrics.health?.systemLoad || 0
      },
      agents: Array.from(this.displayData.agents.entries()).map(([id, agent]) => ({
        agentId: id,
        status: agent.displayStatus,
        capabilities: agent.capabilities,
        currentLoad: agent.currentLoad,
        maxLoad: agent.maxLoad,
        lastSeen: agent.lastSeen,
        healthScore: agent.healthMetrics?.healthScore || 0
      })),
      performance: this.displayData.performance,
      alerts: this.displayData.alerts.filter(a => a.status === 'active'),
      messaging: {
        connected: this.displayData.systemMetrics.messaging?.redis_connected || false,
        messagesPublished: this.displayData.systemMetrics.messaging?.messagesPublished || 0,
        messagesConsumed: this.displayData.systemMetrics.messaging?.messagesConsumed || 0,
        activeConnections: this.displayData.systemMetrics.messaging?.activeAgents || 0
      },
      ai: {
        connected: this.displayData.systemMetrics.ai?.redis_connected || false,
        requests: this.displayData.systemMetrics.ai?.requests || 0,
        cacheHitRate: this.displayData.systemMetrics.ai?.cacheHitRate || 0,
        errorRate: this.displayData.systemMetrics.ai?.errorRate || 0,
        providers: aiSDK.getProviderStatus()
      }
    };

    return report;
  }

  /**
   * Run dashboard in interactive mode
   */
  async runInteractive() {
    await this.start();
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n\n🛑 Shutting down dashboard...'));
      await this.stop();
      process.exit(0);
    });
    
    // Keep the process running
    return new Promise(() => {}); // Never resolves, keeps running until Ctrl+C
  }

  /**
   * Run dashboard for a specific duration
   */
  async runForDuration(durationMs) {
    await this.start();
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        await this.stop();
        resolve(this.generateStatusReport());
      }, durationMs);
    });
  }

  /**
   * Run single dashboard snapshot
   */
  async runSnapshot() {
    await this.collectDashboardData();
    this.displayDashboard();
    return this.generateStatusReport();
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const dashboard = new AgentArmyDashboard();
  
  const mode = process.argv[2] || 'interactive';
  
  switch (mode) {
    case 'interactive':
      dashboard.runInteractive().catch(console.error);
      break;
      
    case 'snapshot':
      dashboard.runSnapshot().then(report => {
        console.log('\n📄 Status Report Generated');
        console.log(JSON.stringify(report, null, 2));
      }).catch(console.error);
      break;
      
    case 'test':
      const duration = parseInt(process.argv[3]) || 30000; // 30 seconds default
      dashboard.runForDuration(duration).then(report => {
        console.log(`\n📊 Test completed after ${duration/1000} seconds`);
        console.log('Final Status:', report.system.status);
        console.log('Active Agents:', report.system.activeAgents);
        console.log('Total Alerts:', report.alerts.length);
      }).catch(console.error);
      break;
      
    default:
      console.log('Usage: node AgentArmyDashboard.js [interactive|snapshot|test] [duration_ms]');
      process.exit(1);
  }
}

export default AgentArmyDashboard;