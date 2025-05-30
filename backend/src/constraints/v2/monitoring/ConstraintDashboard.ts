import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ConstraintStatus {
  constraintId: string;
  name: string;
  type: string;
  satisfied: boolean;
  violations: any[];
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

interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  constraintId?: string;
  acknowledged: boolean;
}

interface DashboardProps {
  wsUrl?: string;
  refreshInterval?: number;
  maxHistoryPoints?: number;
}

export const ConstraintDashboard: React.FC<DashboardProps> = ({
  wsUrl = 'ws://localhost:8080',
  refreshInterval = 5000,
  maxHistoryPoints = 50
}) => {
  const [snapshot, setSnapshot] = useState<MonitoringSnapshot | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<MonitoringSnapshot[]>([]);
  const [selectedConstraint, setSelectedConstraint] = useState<string | null>(null);
  const [constraintHistory, setConstraintHistory] = useState<ConstraintStatus[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to constraint monitor');
      setConnectionStatus('connected');
    };

    ws.onclose = () => {
      console.log('Disconnected from constraint monitor');
      setConnectionStatus('disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [wsUrl]);

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'snapshot':
        const newSnapshot = message.data;
        setSnapshot(newSnapshot);
        setHistory(prev => {
          const updated = [...prev, newSnapshot];
          return updated.slice(-maxHistoryPoints);
        });
        break;
      case 'alert':
        setAlerts(prev => [message.data, ...prev].slice(0, 50));
        break;
      case 'history':
        if (message.constraintId === selectedConstraint) {
          setConstraintHistory(message.data);
        }
        break;
    }
  };

  const requestConstraintHistory = (constraintId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'getHistory',
        constraintId
      }));
    }
  };

  const forceCheck = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'forceCheck'
      }));
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  // Chart data preparation
  const satisfactionChartData = {
    labels: history.map(h => new Date(h.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Overall Satisfaction %',
        data: history.map(h => h.overallSatisfaction),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const violationsPieData = {
    labels: ['Satisfied', 'Violated', 'Critical'],
    datasets: [
      {
        data: [
          snapshot?.satisfiedConstraints || 0,
          (snapshot?.violatedConstraints || 0) - (snapshot?.criticalViolations || 0),
          snapshot?.criticalViolations || 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const performanceChartData = {
    labels: history.map(h => new Date(h.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Check Duration (ms)',
        data: history.map(h => h.performanceMetrics.checkDuration),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Memory Usage (MB)',
        data: history.map(h => h.performanceMetrics.memoryUsage / 1024 / 1024),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y1',
      }
    ]
  };

  const constraintSatisfactionData = {
    labels: history.slice(-10).map(h => new Date(h.timestamp).toLocaleTimeString()),
    datasets: constraintHistory.slice(0, 5).map((constraint, index) => ({
      label: constraint.name,
      data: history.slice(-10).map(h => {
        const status = h.constraintStatuses.find(s => s.constraintId === constraint.constraintId);
        return status?.satisfactionPercentage || 0;
      }),
      borderColor: `hsl(${index * 72}, 70%, 50%)`,
      backgroundColor: `hsla(${index * 72}, 70%, 50%, 0.2)`,
    }))
  };

  return (
    <div className="constraint-dashboard">
      <div className="dashboard-header">
        <h1>Constraint Monitoring Dashboard</h1>
        <div className="connection-status">
          <span className={`status-indicator ${connectionStatus}`}></span>
          {connectionStatus}
        </div>
        <button onClick={forceCheck} disabled={connectionStatus !== 'connected'}>
          Force Check
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Overall Satisfaction</h3>
          <div className="metric">
            {snapshot?.overallSatisfaction.toFixed(1)}%
          </div>
        </div>
        <div className="card">
          <h3>Total Constraints</h3>
          <div className="metric">{snapshot?.totalConstraints || 0}</div>
        </div>
        <div className="card">
          <h3>Violations</h3>
          <div className="metric violation">
            {snapshot?.violatedConstraints || 0}
          </div>
        </div>
        <div className="card">
          <h3>Critical</h3>
          <div className="metric critical">
            {snapshot?.criticalViolations || 0}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-container">
          <h3>Satisfaction Trend</h3>
          <Line data={satisfactionChartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100
              }
            }
          }} />
        </div>
        <div className="chart-container small">
          <h3>Constraint Status</h3>
          <Doughnut data={violationsPieData} options={{
            responsive: true,
            maintainAspectRatio: false
          }} />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="chart-container">
        <h3>Performance Metrics</h3>
        <Line data={performanceChartData} options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Duration (ms)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Memory (MB)'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          }
        }} />
      </div>

      {/* Constraint Details Table */}
      <div className="constraint-table">
        <h3>Constraint Details</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Satisfaction</th>
              <th>Violations</th>
              <th>Trend</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {snapshot?.constraintStatuses.map(constraint => (
              <tr key={constraint.constraintId} className={constraint.satisfied ? 'satisfied' : 'violated'}>
                <td>{constraint.name}</td>
                <td>{constraint.type}</td>
                <td>
                  <span className={`status ${constraint.satisfied ? 'satisfied' : 'violated'}`}>
                    {constraint.satisfied ? '✓' : '✗'}
                  </span>
                </td>
                <td>{constraint.satisfactionPercentage.toFixed(1)}%</td>
                <td>{constraint.violations.length}</td>
                <td>
                  <span className={`trend ${constraint.trend}`}>
                    {constraint.trend === 'improving' ? '↑' : 
                     constraint.trend === 'worsening' ? '↓' : '→'}
                  </span>
                </td>
                <td>
                  <button onClick={() => {
                    setSelectedConstraint(constraint.constraintId);
                    requestConstraintHistory(constraint.constraintId);
                  }}>
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alerts Section */}
      <div className="alerts-section">
        <h3>Recent Alerts</h3>
        <div className="alerts-list">
          {alerts.filter(a => !a.acknowledged).map(alert => (
            <div key={alert.id} className={`alert ${alert.severity}`}>
              <div className="alert-header">
                <span className="alert-severity">{alert.severity.toUpperCase()}</span>
                <span className="alert-time">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="alert-message">{alert.message}</div>
              <button onClick={() => acknowledgeAlert(alert.id)}>Acknowledge</button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Constraint Detail Modal */}
      {selectedConstraint && (
        <div className="modal-overlay" onClick={() => setSelectedConstraint(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Constraint History</h3>
            <div className="chart-container">
              <Line data={constraintSatisfactionData} options={{
                responsive: true,
                maintainAspectRatio: false
              }} />
            </div>
            <button onClick={() => setSelectedConstraint(null)}>Close</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .constraint-dashboard {
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ccc;
        }

        .status-indicator.connected {
          background: #4caf50;
        }

        .status-indicator.disconnected {
          background: #f44336;
        }

        .status-indicator.connecting {
          background: #ff9800;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
        }

        .metric {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }

        .metric.violation {
          color: #ff9800;
        }

        .metric.critical {
          color: #f44336;
        }

        .charts-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }

        .chart-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          height: 300px;
        }

        .chart-container.small {
          height: 300px;
        }

        .chart-container h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
        }

        .constraint-table {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .constraint-table h3 {
          margin: 0 0 15px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          font-weight: 600;
          color: #666;
          background: #f9f9f9;
        }

        tr.violated {
          background: #fff3e0;
        }

        .status {
          display: inline-block;
          width: 20px;
          height: 20px;
          text-align: center;
          border-radius: 50%;
          line-height: 20px;
        }

        .status.satisfied {
          background: #e8f5e9;
          color: #4caf50;
        }

        .status.violated {
          background: #ffebee;
          color: #f44336;
        }

        .trend {
          font-size: 18px;
          font-weight: bold;
        }

        .trend.improving {
          color: #4caf50;
        }

        .trend.worsening {
          color: #f44336;
        }

        .trend.stable {
          color: #666;
        }

        .alerts-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 400px;
          overflow-y: auto;
        }

        .alert {
          padding: 15px;
          border-radius: 4px;
          border-left: 4px solid;
        }

        .alert.low {
          background: #e3f2fd;
          border-color: #2196f3;
        }

        .alert.medium {
          background: #fff3e0;
          border-color: #ff9800;
        }

        .alert.high {
          background: #ffebee;
          border-color: #f44336;
        }

        .alert.critical {
          background: #ffcdd2;
          border-color: #d32f2f;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .alert-severity {
          font-weight: 600;
          font-size: 12px;
        }

        .alert-time {
          font-size: 12px;
          color: #666;
        }

        button {
          background: #2196f3;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        button:hover {
          background: #1976d2;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          width: 80%;
          max-width: 800px;
          max-height: 80vh;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};