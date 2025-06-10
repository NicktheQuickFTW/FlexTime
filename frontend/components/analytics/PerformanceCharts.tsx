import React from 'react';
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  Radar,
  RadarChart as RadarChartComponent,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Types
interface AnalyticsData {
  compassTrend: Array<{
    date: string;
    score: number;
    efficiency: number;
    satisfaction: number;
  }>;
  violations: Array<{
    constraint: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  sportPerformance: Array<{
    sport: string;
    games: number;
    satisfaction: number;
    efficiency: number;
    compliance: number;
  }>;
  teamMetrics: Array<{
    team: string;
    homeGames: number;
    awayGames: number;
    travelDistance: number;
    restDays: number;
  }>;
  venueUtilization: Array<{
    venue: string;
    utilization: number;
    capacity: number;
  }>;
  timeDistribution: Array<{
    timeSlot: string;
    games: number;
    preference: number;
  }>;
  conflictResolution: Array<{
    week: string;
    conflicts: number;
    resolved: number;
    pending: number;
  }>;
  optimizationMetrics: Array<{
    metric: string;
    current: number;
    target: number;
    improvement: number;
  }>;
}

interface PerformanceChartsProps {
  data: AnalyticsData;
  timeRange: 'week' | 'month' | 'season';
  metrics: string[];
  className?: string;
}

// Chart theme configuration
const chartTheme = {
  colors: {
    primary: 'var(--ft-cyber-cyan)',
    secondary: 'var(--ft-golden-hour)',
    tertiary: 'var(--ft-electric-blue)',
    quaternary: 'var(--ft-silver-mist)',
    success: 'var(--ft-success)',
    warning: 'var(--ft-warning)',
    error: 'var(--ft-error)',
    info: 'var(--ft-info)'
  },
  background: 'transparent',
  textColor: 'var(--ft-crystal-white)',
  gridColor: 'var(--ft-glass-border)',
  tooltipBg: 'var(--ft-glass-primary)'
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="ft-chart-tooltip">
        <div className="tooltip-header">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="tooltip-item" style={{ color: entry.color }}>
            <span className="tooltip-label">{entry.dataKey}:</span>
            <span className="tooltip-value">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Performance severity color mapping
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high': return chartTheme.colors.error;
    case 'medium': return chartTheme.colors.warning;
    case 'low': return chartTheme.colors.success;
    default: return chartTheme.colors.info;
  }
};

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ 
  data, 
  timeRange, 
  metrics, 
  className = '' 
}) => {
  return (
    <div className={`ft-performance-charts ${className}`}>
      <div className="ft-chart-grid">
        {/* COMPASS Score Trend */}
        <div className="ft-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">COMPASS Score Trend</h3>
            <div className="chart-subtitle">Performance metrics over {timeRange}</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.compassTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={chartTheme.gridColor}
                opacity={0.3}
              />
              <XAxis 
                dataKey="date" 
                stroke={chartTheme.colors.quaternary}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 100]}
                stroke={chartTheme.colors.quaternary}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: chartTheme.textColor }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke={chartTheme.colors.primary}
                strokeWidth={3}
                dot={{ fill: chartTheme.colors.primary, strokeWidth: 2, r: 6 }}
                activeDot={{ 
                  r: 8, 
                  stroke: chartTheme.colors.secondary, 
                  strokeWidth: 2,
                  fill: chartTheme.colors.primary
                }}
                name="COMPASS Score"
              />
              <Line 
                type="monotone" 
                dataKey="efficiency" 
                stroke={chartTheme.colors.tertiary}
                strokeWidth={2}
                dot={{ fill: chartTheme.colors.tertiary, strokeWidth: 2, r: 4 }}
                name="Efficiency"
              />
              <Line 
                type="monotone" 
                dataKey="satisfaction" 
                stroke={chartTheme.colors.secondary}
                strokeWidth={2}
                dot={{ fill: chartTheme.colors.secondary, strokeWidth: 2, r: 4 }}
                name="Satisfaction"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Constraint Violations */}
        <div className="ft-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Constraint Violations</h3>
            <div className="chart-subtitle">By constraint type and severity</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.violations} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
              <XAxis 
                dataKey="constraint" 
                stroke={chartTheme.colors.quaternary} 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke={chartTheme.colors.quaternary} 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill={chartTheme.colors.tertiary}
                radius={[4, 4, 0, 0]}
                name="Violations"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sport Performance Radar */}
        <div className="ft-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Sport Performance Overview</h3>
            <div className="chart-subtitle">Multi-dimensional performance metrics</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChartComponent data={data.sportPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <PolarGrid stroke={chartTheme.gridColor} opacity={0.3} />
              <PolarAngleAxis 
                dataKey="sport" 
                tick={{ fontSize: 12, fill: chartTheme.colors.quaternary }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: chartTheme.colors.quaternary }}
                tickCount={6}
              />
              <Tooltip content={<CustomTooltip />} />
              <Radar
                name="Satisfaction"
                dataKey="satisfaction"
                stroke={chartTheme.colors.primary}
                fill={chartTheme.colors.primary}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar
                name="Efficiency"
                dataKey="efficiency"
                stroke={chartTheme.colors.secondary}
                fill={chartTheme.colors.secondary}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar
                name="Compliance"
                dataKey="compliance"
                stroke={chartTheme.colors.tertiary}
                fill={chartTheme.colors.tertiary}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Legend wrapperStyle={{ color: chartTheme.textColor }} />
            </RadarChartComponent>
          </ResponsiveContainer>
        </div>

        {/* Team Travel Metrics */}
        <div className="ft-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Team Travel Analysis</h3>
            <div className="chart-subtitle">Home vs Away games and travel distance</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.teamMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
              <XAxis 
                dataKey="team" 
                stroke={chartTheme.colors.quaternary}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke={chartTheme.colors.quaternary} 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: chartTheme.textColor }} />
              <Area
                type="monotone"
                dataKey="homeGames"
                stackId="1"
                stroke={chartTheme.colors.success}
                fill={chartTheme.colors.success}
                fillOpacity={0.6}
                name="Home Games"
              />
              <Area
                type="monotone"
                dataKey="awayGames"
                stackId="1"
                stroke={chartTheme.colors.warning}
                fill={chartTheme.colors.warning}
                fillOpacity={0.6}
                name="Away Games"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Venue Utilization */}
        <div className="ft-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Venue Utilization</h3>
            <div className="chart-subtitle">Capacity vs actual usage</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={data.venueUtilization}
                dataKey="utilization"
                nameKey="venue"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                stroke="none"
              >
                {data.venueUtilization.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={Object.values(chartTheme.colors)[index % Object.values(chartTheme.colors).length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: chartTheme.textColor }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Time Distribution */}
        <div className="ft-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Game Time Distribution</h3>
            <div className="chart-subtitle">Preferred vs actual time slots</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.timeDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
              <XAxis 
                dataKey="timeSlot" 
                stroke={chartTheme.colors.quaternary}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke={chartTheme.colors.quaternary} 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: chartTheme.textColor }} />
              <Bar 
                dataKey="games" 
                fill={chartTheme.colors.primary}
                radius={[4, 4, 0, 0]}
                name="Scheduled Games"
              />
              <Bar 
                dataKey="preference" 
                fill={chartTheme.colors.secondary}
                radius={[4, 4, 0, 0]}
                name="Preference Score"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conflict Resolution Trend */}
        <div className="ft-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Conflict Resolution</h3>
            <div className="chart-subtitle">Weekly conflict detection and resolution</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.conflictResolution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
              <XAxis 
                dataKey="week" 
                stroke={chartTheme.colors.quaternary}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke={chartTheme.colors.quaternary} 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: chartTheme.textColor }} />
              <Bar 
                dataKey="conflicts" 
                fill={chartTheme.colors.error}
                radius={[4, 4, 0, 0]}
                name="Total Conflicts"
              />
              <Bar 
                dataKey="resolved" 
                fill={chartTheme.colors.success}
                radius={[4, 4, 0, 0]}
                name="Resolved"
              />
              <Bar 
                dataKey="pending" 
                fill={chartTheme.colors.warning}
                radius={[4, 4, 0, 0]}
                name="Pending"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Optimization Progress */}
        <div className="ft-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Optimization Progress</h3>
            <div className="chart-subtitle">Current vs target performance metrics</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={data.optimizationMetrics} 
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
              <XAxis 
                type="number"
                domain={[0, 100]}
                stroke={chartTheme.colors.quaternary}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="category"
                dataKey="metric" 
                stroke={chartTheme.colors.quaternary}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: chartTheme.textColor }} />
              <Bar 
                dataKey="current" 
                fill={chartTheme.colors.primary}
                radius={[0, 4, 4, 0]}
                name="Current"
              />
              <Bar 
                dataKey="target" 
                fill={chartTheme.colors.secondary}
                radius={[0, 4, 4, 0]}
                name="Target"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style jsx>{`
        .ft-performance-charts {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        .ft-chart-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 1.5rem;
          padding: 1rem;
        }

        .ft-chart-card {
          background: var(--ft-glass-primary);
          border: 1px solid var(--ft-glass-border);
          border-radius: var(--ft-radius-lg);
          padding: 1.5rem;
          backdrop-filter: blur(20px);
          box-shadow: var(--ft-shadow-glass);
          transition: all 0.3s ease;
        }

        .ft-chart-card:hover {
          background: var(--ft-glass-secondary);
          border-color: var(--ft-cyber-cyan);
          box-shadow: var(--ft-shadow-glow);
        }

        .chart-header {
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--ft-glass-border);
          padding-bottom: 0.75rem;
        }

        .chart-title {
          color: var(--ft-crystal-white);
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
          font-family: var(--ft-font-display);
        }

        .chart-subtitle {
          color: var(--ft-silver-mist);
          font-size: 0.875rem;
          margin: 0;
          opacity: 0.8;
        }

        .ft-chart-tooltip {
          background: var(--ft-glass-primary);
          border: 1px solid var(--ft-glass-border);
          border-radius: var(--ft-radius-md);
          padding: 0.75rem;
          backdrop-filter: blur(20px);
          box-shadow: var(--ft-shadow-glass);
          color: var(--ft-crystal-white);
          min-width: 160px;
        }

        .tooltip-header {
          font-weight: 600;
          margin-bottom: 0.5rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid var(--ft-glass-border);
          color: var(--ft-cyber-cyan);
        }

        .tooltip-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0.25rem 0;
          font-size: 0.875rem;
        }

        .tooltip-label {
          margin-right: 0.5rem;
          opacity: 0.9;
        }

        .tooltip-value {
          font-weight: 600;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .ft-chart-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
            padding: 0.5rem;
          }

          .ft-chart-card {
            padding: 1rem;
          }

          .chart-title {
            font-size: 1rem;
          }

          .chart-subtitle {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 1200px) {
          .ft-chart-grid {
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default PerformanceCharts;