# Real-Time Constraint Monitoring System

A comprehensive monitoring system for tracking constraint satisfaction in real-time with WebSocket support, alerting, metrics collection, and a React-based dashboard.

## Components

### 1. RealTimeConstraintMonitor
The core monitoring engine that continuously checks constraint satisfaction and broadcasts updates via WebSocket.

**Features:**
- Configurable check intervals
- WebSocket server for real-time updates
- Event-driven architecture
- Constraint history tracking
- Performance monitoring
- Integration with AlertSystem and MetricsCollector

### 2. ConstraintDashboard
A React component that provides a real-time visualization of constraint status.

**Features:**
- Real-time WebSocket connection
- Interactive charts (satisfaction trends, violations, performance)
- Constraint status table with trend indicators
- Alert notifications
- Constraint history visualization
- Performance metrics display

### 3. AlertSystem
Manages alerts based on configurable rules and thresholds.

**Features:**
- Configurable alert rules
- Multiple severity levels (low, medium, high, critical)
- Cooldown periods to prevent alert spam
- Auto-resolution of alerts
- Webhook and email notifications support
- Alert history tracking

### 4. MetricsCollector
Collects and aggregates constraint satisfaction metrics over time.

**Features:**
- Snapshot storage with configurable retention
- Time-based aggregation (minute, hour, day, week)
- Constraint-specific metrics tracking
- Performance metrics collection
- Trend analysis
- Export functionality (JSON/CSV)

## Installation

```bash
npm install ws express react react-dom chart.js react-chartjs-2 uuid
```

## Basic Usage

```typescript
import { ConstraintEngine } from '../engine/ConstraintEngine';
import { RealTimeConstraintMonitor } from './RealTimeConstraintMonitor';

// Initialize the monitoring system
const engine = new ConstraintEngine({});
const monitor = new RealTimeConstraintMonitor(engine, {
  checkInterval: 5000,        // Check every 5 seconds
  enableWebSocket: true,      // Enable WebSocket server
  wsPort: 8080,              // WebSocket port
  enableAlerts: true,        // Enable alert system
  enableMetrics: true,       // Enable metrics collection
  violationThreshold: 20     // Alert at 20% violations
});

// Start monitoring
await monitor.start();
```

## WebSocket API

The monitoring system provides a WebSocket server for real-time updates.

### Client → Server Messages

```javascript
// Subscribe to specific constraint updates
ws.send(JSON.stringify({
  type: 'subscribe',
  constraintId: 'constraint-123'
}));

// Get constraint history
ws.send(JSON.stringify({
  type: 'getHistory',
  constraintId: 'constraint-123'
}));

// Force immediate check
ws.send(JSON.stringify({
  type: 'forceCheck'
}));
```

### Server → Client Messages

```javascript
// Monitoring snapshot
{
  type: 'snapshot',
  data: {
    timestamp: Date,
    overallSatisfaction: number,
    totalConstraints: number,
    satisfiedConstraints: number,
    violatedConstraints: number,
    criticalViolations: number,
    constraintStatuses: ConstraintStatus[],
    performanceMetrics: {...}
  }
}

// Alert notification
{
  type: 'alert',
  data: {
    id: string,
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    timestamp: Date,
    ...
  }
}
```

## REST API Endpoints

```typescript
// Get current snapshot
GET /api/monitoring/snapshot

// Get constraint history
GET /api/monitoring/constraints/:id/history

// Get metrics
GET /api/monitoring/metrics

// Get active alerts
GET /api/monitoring/alerts

// Acknowledge alert
POST /api/monitoring/alerts/:id/acknowledge
Body: { acknowledgedBy: string }

// Force constraint check
POST /api/monitoring/check

// Update monitoring options
PUT /api/monitoring/options
Body: { checkInterval?: number, violationThreshold?: number, ... }

// Get performance metrics
GET /api/monitoring/metrics/performance?duration=3600000

// Get constraint type analysis
GET /api/monitoring/metrics/analysis

// Export metrics
GET /api/monitoring/metrics/export?format=csv
```

## Custom Alert Rules

```typescript
const customRule = {
  id: 'custom-rule',
  name: 'Custom Alert Rule',
  description: 'Alert when specific conditions are met',
  enabled: true,
  conditions: [
    {
      type: 'threshold',
      metric: 'overallSatisfaction',
      operator: 'lt',
      value: 80
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
        url: 'https://api.example.com/alerts',
        headers: { 'Authorization': 'Bearer TOKEN' }
      }
    }
  ],
  cooldownMinutes: 10
};

monitor.alertSystem.addRule(customRule);
```

## React Dashboard Integration

```jsx
import { ConstraintDashboard } from './ConstraintDashboard';

function App() {
  return (
    <ConstraintDashboard 
      wsUrl="ws://localhost:8080"
      refreshInterval={5000}
      maxHistoryPoints={50}
    />
  );
}
```

## Events

The monitoring system emits various events:

```typescript
monitor.on('started', () => {
  console.log('Monitoring started');
});

monitor.on('check', (snapshot) => {
  console.log('Constraint check completed', snapshot);
});

monitor.on('alert', (alert) => {
  console.log('Alert triggered', alert);
});

monitor.on('error', (error) => {
  console.error('Monitoring error', error);
});
```

## Performance Considerations

1. **Check Interval**: Balance between real-time updates and system load
2. **Retention**: Configure appropriate retention periods for metrics
3. **WebSocket Clients**: Monitor connected clients and implement connection limits
4. **Alert Cooldowns**: Prevent alert fatigue with appropriate cooldown periods
5. **Memory Usage**: Monitor snapshot storage and implement cleanup strategies

## Advanced Features

### Pattern Detection
The system can detect patterns in constraint violations:
- Time-based patterns (violations at specific times)
- Trend analysis (improving/worsening satisfaction)
- Constraint type correlation

### Custom Metrics
Extend the MetricsCollector to track custom metrics:
```typescript
monitor.on('check', (snapshot) => {
  // Track custom metrics
  customMetricsTracker.record(snapshot);
});
```

### Integration with External Systems
- Webhook notifications for alerts
- Export metrics to monitoring platforms
- Integration with notification services (email, Slack, etc.)

## Troubleshooting

1. **WebSocket Connection Issues**
   - Check firewall settings
   - Verify port availability
   - Check CORS configuration

2. **High Memory Usage**
   - Reduce snapshot retention
   - Increase aggregation intervals
   - Implement more aggressive cleanup

3. **Alert Fatigue**
   - Increase cooldown periods
   - Adjust violation thresholds
   - Implement alert grouping

## License

MIT