import { EventEmitter } from 'events';
import { WebSocket, WebSocketServer } from 'ws';
import { 
  Constraint, 
  ConstraintViolation, 
  ConstraintSatisfactionResult,
  Schedule,
  Assignment
} from '../types';
import { ConstraintEngine } from '../engine/ConstraintEngine';
import { MetricsCollector } from './MetricsCollector';
import { AlertSystem } from './AlertSystem';

interface MonitoringOptions {
  checkInterval?: number; // milliseconds
  enableWebSocket?: boolean;
  wsPort?: number;
  enableAlerts?: boolean;
  enableMetrics?: boolean;
  violationThreshold?: number; // percentage
}

interface ConstraintStatus {
  constraintId: string;
  name: string;
  type: string;
  satisfied: boolean;
  violations: ConstraintViolation[];
  satisfactionPercentage: number;
  lastChecked: Date;
  trend: 'improving' | 'worsening' | 'stable';
}

interface MonitoringSnapshot {
  timestamp: Date;
  overallSatisfaction: number;
  totalConstraints: number;
  satisfiedConstraints: number;
  violatedConstraints: number;
  criticalViolations: number;
  constraintStatuses: ConstraintStatus[];
  performanceMetrics: {
    checkDuration: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export class RealTimeConstraintMonitor extends EventEmitter {
  private engine: ConstraintEngine;
  private metricsCollector: MetricsCollector;
  private alertSystem: AlertSystem;
  private wsServer?: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private monitoringInterval?: NodeJS.Timer;
  private options: Required<MonitoringOptions>;
  private lastSnapshot?: MonitoringSnapshot;
  private constraintHistory: Map<string, ConstraintStatus[]> = new Map();

  constructor(
    engine: ConstraintEngine,
    options: MonitoringOptions = {}
  ) {
    super();
    this.engine = engine;
    this.options = {
      checkInterval: options.checkInterval || 5000, // 5 seconds default
      enableWebSocket: options.enableWebSocket !== false,
      wsPort: options.wsPort || 8080,
      enableAlerts: options.enableAlerts !== false,
      enableMetrics: options.enableMetrics !== false,
      violationThreshold: options.violationThreshold || 20 // 20% violations trigger alert
    };

    this.metricsCollector = new MetricsCollector();
    this.alertSystem = new AlertSystem({
      violationThreshold: this.options.violationThreshold
    });

    this.setupAlertHandlers();
  }

  async start(): Promise<void> {
    console.log('Starting Real-Time Constraint Monitor...');

    // Start WebSocket server if enabled
    if (this.options.enableWebSocket) {
      this.startWebSocketServer();
    }

    // Start monitoring loop
    this.startMonitoring();

    // Initial check
    await this.checkConstraints();

    this.emit('started');
  }

  stop(): void {
    console.log('Stopping Real-Time Constraint Monitor...');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.wsServer) {
      this.clients.forEach(client => client.close());
      this.wsServer.close();
    }

    this.emit('stopped');
  }

  private startWebSocketServer(): void {
    this.wsServer = new WebSocketServer({ port: this.options.wsPort });

    this.wsServer.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      // Send current snapshot to new client
      if (this.lastSnapshot) {
        ws.send(JSON.stringify({
          type: 'snapshot',
          data: this.lastSnapshot
        }));
      }

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Handle client messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Invalid message from client:', error);
        }
      });
    });

    console.log(`WebSocket server started on port ${this.options.wsPort}`);
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'subscribe':
        // Client wants to subscribe to specific constraint updates
        ws.send(JSON.stringify({
          type: 'subscribed',
          constraintId: message.constraintId
        }));
        break;
      case 'getHistory':
        // Send constraint history
        const history = this.constraintHistory.get(message.constraintId) || [];
        ws.send(JSON.stringify({
          type: 'history',
          constraintId: message.constraintId,
          data: history
        }));
        break;
      case 'forceCheck':
        // Force an immediate constraint check
        this.checkConstraints();
        break;
    }
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.checkConstraints();
    }, this.options.checkInterval);
  }

  private async checkConstraints(): Promise<void> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      // Get current schedule from engine
      const schedule = await this.engine.getCurrentSchedule();
      const constraints = await this.engine.getConstraints();

      const snapshot = await this.createSnapshot(schedule, constraints);
      this.lastSnapshot = snapshot;

      // Update metrics
      if (this.options.enableMetrics) {
        this.metricsCollector.recordSnapshot(snapshot);
      }

      // Check for alerts
      if (this.options.enableAlerts) {
        this.alertSystem.checkSnapshot(snapshot);
      }

      // Broadcast to WebSocket clients
      this.broadcastSnapshot(snapshot);

      // Emit events
      this.emit('check', snapshot);

      // Update constraint history
      this.updateConstraintHistory(snapshot.constraintStatuses);

    } catch (error) {
      console.error('Error checking constraints:', error);
      this.emit('error', error);
    }
  }

  private async createSnapshot(
    schedule: Schedule,
    constraints: Constraint[]
  ): Promise<MonitoringSnapshot> {
    const startTime = Date.now();
    const constraintStatuses: ConstraintStatus[] = [];
    let satisfiedCount = 0;
    let criticalViolations = 0;

    for (const constraint of constraints) {
      const result = await this.engine.checkConstraint(constraint, schedule);
      const satisfied = result.violations.length === 0;
      
      if (satisfied) {
        satisfiedCount++;
      }

      // Check if violations are critical
      const criticalCount = result.violations.filter(v => v.severity === 'critical').length;
      criticalViolations += criticalCount;

      // Determine trend
      const trend = this.calculateTrend(constraint.id, satisfied);

      constraintStatuses.push({
        constraintId: constraint.id,
        name: constraint.name,
        type: constraint.type,
        satisfied,
        violations: result.violations,
        satisfactionPercentage: this.calculateSatisfactionPercentage(result, schedule),
        lastChecked: new Date(),
        trend
      });
    }

    const checkDuration = Date.now() - startTime;
    const memoryUsage = process.memoryUsage().heapUsed;
    const cpuUsage = process.cpuUsage().user / 1000000; // Convert to seconds

    return {
      timestamp: new Date(),
      overallSatisfaction: (satisfiedCount / constraints.length) * 100,
      totalConstraints: constraints.length,
      satisfiedConstraints: satisfiedCount,
      violatedConstraints: constraints.length - satisfiedCount,
      criticalViolations,
      constraintStatuses,
      performanceMetrics: {
        checkDuration,
        memoryUsage,
        cpuUsage
      }
    };
  }

  private calculateSatisfactionPercentage(
    result: ConstraintSatisfactionResult,
    schedule: Schedule
  ): number {
    if (result.violations.length === 0) return 100;

    // Calculate based on affected assignments vs total assignments
    const affectedAssignments = new Set(
      result.violations.map(v => v.affectedAssignments).flat()
    );
    const totalAssignments = schedule.assignments.length;

    if (totalAssignments === 0) return 100;

    return ((totalAssignments - affectedAssignments.size) / totalAssignments) * 100;
  }

  private calculateTrend(
    constraintId: string,
    currentlySatisfied: boolean
  ): 'improving' | 'worsening' | 'stable' {
    const history = this.constraintHistory.get(constraintId) || [];
    
    if (history.length < 2) return 'stable';

    const recentHistory = history.slice(-5); // Last 5 checks
    const satisfiedCount = recentHistory.filter(h => h.satisfied).length;
    const previousSatisfiedCount = recentHistory.slice(0, -1).filter(h => h.satisfied).length;

    if (currentlySatisfied && !recentHistory[recentHistory.length - 1]?.satisfied) {
      return 'improving';
    } else if (!currentlySatisfied && recentHistory[recentHistory.length - 1]?.satisfied) {
      return 'worsening';
    }

    return 'stable';
  }

  private updateConstraintHistory(statuses: ConstraintStatus[]): void {
    for (const status of statuses) {
      const history = this.constraintHistory.get(status.constraintId) || [];
      history.push(status);

      // Keep only last 100 entries
      if (history.length > 100) {
        history.shift();
      }

      this.constraintHistory.set(status.constraintId, history);
    }
  }

  private broadcastSnapshot(snapshot: MonitoringSnapshot): void {
    const message = JSON.stringify({
      type: 'snapshot',
      data: snapshot
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private setupAlertHandlers(): void {
    this.alertSystem.on('alert', (alert) => {
      console.log('Constraint Alert:', alert);
      
      // Broadcast alert to WebSocket clients
      const message = JSON.stringify({
        type: 'alert',
        data: alert
      });

      this.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });

      // Emit alert event
      this.emit('alert', alert);
    });
  }

  // Public API methods

  async getSnapshot(): Promise<MonitoringSnapshot | undefined> {
    return this.lastSnapshot;
  }

  async getConstraintHistory(constraintId: string): Promise<ConstraintStatus[]> {
    return this.constraintHistory.get(constraintId) || [];
  }

  async getMetrics(): Promise<any> {
    if (!this.options.enableMetrics) {
      throw new Error('Metrics collection is disabled');
    }
    return this.metricsCollector.getMetrics();
  }

  async getAlerts(): Promise<any[]> {
    if (!this.options.enableAlerts) {
      throw new Error('Alert system is disabled');
    }
    return this.alertSystem.getActiveAlerts();
  }

  // Force an immediate constraint check
  async forceCheck(): Promise<MonitoringSnapshot> {
    await this.checkConstraints();
    return this.lastSnapshot!;
  }

  // Update monitoring options
  updateOptions(options: Partial<MonitoringOptions>): void {
    this.options = { ...this.options, ...options };

    // Restart monitoring if interval changed
    if (options.checkInterval && this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.startMonitoring();
    }

    // Update alert threshold
    if (options.violationThreshold !== undefined) {
      this.alertSystem.updateThreshold(options.violationThreshold);
    }
  }
}