import { ConstraintEngine } from '../engine/ConstraintEngine';
import { RealTimeConstraintMonitor } from './RealTimeConstraintMonitor';
import { AlertRule } from './AlertSystem';
import express from 'express';
import { createServer } from 'http';

// Example usage of the Real-Time Constraint Monitoring System

async function setupMonitoring() {
  // Initialize your constraint engine
  const engine = new ConstraintEngine({
    // your engine configuration
  });

  // Create the real-time monitor
  const monitor = new RealTimeConstraintMonitor(engine, {
    checkInterval: 5000, // Check every 5 seconds
    enableWebSocket: true,
    wsPort: 8080,
    enableAlerts: true,
    enableMetrics: true,
    violationThreshold: 20 // Alert when 20% of constraints are violated
  });

  // Listen for monitoring events
  monitor.on('started', () => {
    console.log('Constraint monitoring started');
  });

  monitor.on('check', (snapshot) => {
    console.log(`Constraint check completed: ${snapshot.overallSatisfaction.toFixed(1)}% satisfaction`);
  });

  monitor.on('alert', (alert) => {
    console.log(`ALERT [${alert.severity}]: ${alert.message}`);
    
    // Send notifications (email, Slack, etc.)
    if (alert.severity === 'critical') {
      // notificationService.sendCriticalAlert(alert);
    }
  });

  monitor.on('error', (error) => {
    console.error('Monitoring error:', error);
  });

  // Add custom alert rules
  const customRule: AlertRule = {
    id: 'business-hours-violation',
    name: 'Business Hours Constraint Violations',
    description: 'Alert when business hours constraints are frequently violated',
    enabled: true,
    conditions: [
      {
        type: 'threshold',
        metric: 'constraintTypeViolationRate.businessHours',
        operator: 'gt',
        value: 10 // 10% violation rate
      }
    ],
    actions: [
      {
        type: 'emit',
        config: { severity: 'high' }
      },
      {
        type: 'webhook',
        config: {
          url: 'https://api.example.com/webhooks/constraints',
          headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
        }
      }
    ],
    cooldownMinutes: 15
  };

  monitor.alertSystem.addRule(customRule);

  // Start monitoring
  await monitor.start();

  // Set up REST API endpoints
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // Get current monitoring snapshot
  app.get('/api/monitoring/snapshot', async (req, res) => {
    const snapshot = await monitor.getSnapshot();
    res.json(snapshot);
  });

  // Get constraint history
  app.get('/api/monitoring/constraints/:id/history', async (req, res) => {
    const history = await monitor.getConstraintHistory(req.params.id);
    res.json(history);
  });

  // Get metrics
  app.get('/api/monitoring/metrics', async (req, res) => {
    try {
      const metrics = await monitor.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get active alerts
  app.get('/api/monitoring/alerts', async (req, res) => {
    try {
      const alerts = await monitor.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Acknowledge alert
  app.post('/api/monitoring/alerts/:id/acknowledge', async (req, res) => {
    const { acknowledgedBy } = req.body;
    const success = monitor.alertSystem.acknowledgeAlert(req.params.id, acknowledgedBy);
    res.json({ success });
  });

  // Force constraint check
  app.post('/api/monitoring/check', async (req, res) => {
    const snapshot = await monitor.forceCheck();
    res.json(snapshot);
  });

  // Update monitoring options
  app.put('/api/monitoring/options', (req, res) => {
    monitor.updateOptions(req.body);
    res.json({ success: true });
  });

  // Get metrics for specific time period
  app.get('/api/monitoring/metrics/performance', (req, res) => {
    const duration = parseInt(req.query.duration as string) || 3600000; // 1 hour default
    const metrics = monitor.metricsCollector.getPerformanceMetrics(duration);
    res.json(metrics);
  });

  // Get constraint type analysis
  app.get('/api/monitoring/metrics/analysis', (req, res) => {
    const analysis = monitor.metricsCollector.getConstraintTypeAnalysis();
    res.json(analysis);
  });

  // Export metrics
  app.get('/api/monitoring/metrics/export', (req, res) => {
    const format = req.query.format as 'json' | 'csv' || 'json';
    const data = monitor.metricsCollector.exportMetrics(format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=constraint-metrics.csv');
    }
    
    res.send(data);
  });

  server.listen(3000, () => {
    console.log('Monitoring API server running on port 3000');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down monitoring system...');
    monitor.stop();
    server.close();
    process.exit(0);
  });
}

// React component usage example
function MonitoringDashboardApp() {
  return (
    <div className="App">
      <h1>Constraint Monitoring System</h1>
      {/* The ConstraintDashboard component handles WebSocket connection automatically */}
      <ConstraintDashboard 
        wsUrl="ws://localhost:8080"
        refreshInterval={5000}
        maxHistoryPoints={50}
      />
    </div>
  );
}

// Advanced monitoring setup with custom handlers
async function advancedMonitoringSetup() {
  const engine = new ConstraintEngine({});
  const monitor = new RealTimeConstraintMonitor(engine, {
    checkInterval: 2000,
    enableWebSocket: true,
    wsPort: 8080,
    violationThreshold: 15
  });

  // Custom metric tracking
  const customMetrics = new Map<string, number[]>();

  monitor.on('check', (snapshot) => {
    // Track custom metrics
    for (const status of snapshot.constraintStatuses) {
      const key = `${status.type}_satisfaction`;
      const values = customMetrics.get(key) || [];
      values.push(status.satisfactionPercentage);
      
      // Keep last 100 values
      if (values.length > 100) values.shift();
      customMetrics.set(key, values);
    }

    // Check for patterns
    const businessHoursSatisfaction = customMetrics.get('businessHours_satisfaction');
    if (businessHoursSatisfaction && businessHoursSatisfaction.length >= 10) {
      const recent = businessHoursSatisfaction.slice(-10);
      const average = recent.reduce((a, b) => a + b, 0) / recent.length;
      
      if (average < 80) {
        console.warn('Business hours constraints showing poor satisfaction:', average.toFixed(1) + '%');
      }
    }
  });

  // Pattern detection for recurring violations
  const violationPatterns = new Map<string, Date[]>();

  monitor.on('alert', (alert) => {
    if (alert.constraintId) {
      const timestamps = violationPatterns.get(alert.constraintId) || [];
      timestamps.push(alert.timestamp);
      
      // Keep last 20 violations
      if (timestamps.length > 20) timestamps.shift();
      violationPatterns.set(alert.constraintId, timestamps);

      // Check for patterns (e.g., violations at same time of day)
      if (timestamps.length >= 5) {
        const hours = timestamps.map(t => t.getHours());
        const hourCounts = new Map<number, number>();
        
        for (const hour of hours) {
          hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        }

        // Find most common hour
        let maxCount = 0;
        let commonHour = 0;
        for (const [hour, count] of hourCounts) {
          if (count > maxCount) {
            maxCount = count;
            commonHour = hour;
          }
        }

        if (maxCount >= 3) {
          console.log(`Pattern detected: Constraint ${alert.constraintId} frequently violates at ${commonHour}:00`);
        }
      }
    }
  });

  await monitor.start();

  return monitor;
}

// Export setup functions
export { setupMonitoring, advancedMonitoringSetup };