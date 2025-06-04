// COMPASS Analytics Dashboard - Future Enhancement (Planned for Q1 2026)
// This component is currently disabled as COMPASS ratings are planned for future implementation

import React from 'react';

// Placeholder component for future COMPASS implementation
const COMPASSAnalyticsDashboard: React.FC = () => {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(0, 191, 255, 0.15)'
    }}>
      <h3 style={{ color: '#00bfff', marginBottom: '1rem' }}>
        🔮 COMPASS Analytics Dashboard
      </h3>
      <p style={{ color: '#a0aec0', marginBottom: '1rem' }}>
        Advanced predictive projections and competitive positioning
      </p>
      <p style={{ color: '#718096', fontSize: '0.9rem' }}>
        This feature is planned for Q1 2026 and will include:
      </p>
      <ul style={{ 
        color: '#718096', 
        fontSize: '0.9rem', 
        textAlign: 'left', 
        maxWidth: '400px', 
        margin: '1rem auto',
        paddingLeft: '1rem'
      }}>
        <li>Dynamic COMPASS ratings for real-time competitive positioning</li>
        <li>Predictive projections for championship probability</li>
        <li>Multi-dimensional team assessment framework</li>
        <li>Head-to-head matchup predictions</li>
      </ul>
    </div>
  );
};

export default COMPASSAnalyticsDashboard;

/* ORIGINAL IMPLEMENTATION - COMMENTED OUT FOR FUTURE USE

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
         XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Line, Legend } from 'recharts';
import { useThemeContext } from '../../contexts/ThemeContext';
import './COMPASSAnalyticsDashboard.css';

// Types
interface COMPASSScore {
  overall: number;
  competitiveness: number;
  optimization: number;
  minTravelDistance: number;
  playerWelfare: number;
  attendance: number;
  scheduleFairness: number;
  specialEvents: number;
}

interface ScheduleMetrics {
  date: string;
  score: number;
  games: number;
  conflicts: number;
  travelMiles: number;
}

interface TeamMetrics {
  team: string;
  homeGames: number;
  awayGames: number;
  avgTravelDistance: number;
  restDays: number;
  backToBackGames: number;
}

interface COMPASSAnalyticsDashboardProps {
  scheduleId?: string;
  compassScore: COMPASSScore;
  scheduleMetrics: ScheduleMetrics[];
  teamMetrics: TeamMetrics[];
  onRefresh?: () => void;
}

// COMPASS Score Meter Component
const COMPASSScoreMeter: React.FC<{ score: COMPASSScore }> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);
  
  useEffect(() => {
    // Animate score count up
    const target = score.overall;
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setDisplayScore(Math.round(current));
    }, 16);
    
    return () => clearInterval(timer);
  }, [score.overall]);
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--ft-success, #00ff88)';
    if (score >= 75) return 'var(--ft-cyber-cyan)';
    if (score >= 60) return 'var(--ft-golden-hour)';
    return 'var(--ft-error, #ff4444)';
  };
  
  const meterStyle = {
    '--score': displayScore,
    '--score-color': getScoreColor(displayScore)
  } as React.CSSProperties;
  
  return (
    <motion.div 
      className="ft-compass-meter"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="ft-compass-circle" style={meterStyle}>
        <div className="ft-compass-inner">
          <motion.div 
            className="ft-compass-score"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {displayScore}
          </motion.div>
          <div className="ft-compass-label">COMPASS Score</div>
        </div>
      </div>
      
      <div className="ft-compass-breakdown">
        {Object.entries(score).filter(([key]) => key !== 'overall').map(([key, value], index) => (
          <motion.div 
            key={key}
            className="ft-metric-item"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <span className="ft-metric-label">{formatMetricName(key)}</span>
            <div className="ft-metric-bar">
              <motion.div 
                className="ft-metric-fill"
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1, delay: 0.5 + (0.1 * index) }}
                style={{ background: getScoreColor(value) }}
              />
            </div>
            <span className="ft-metric-value">{value}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Performance Chart Component
const PerformanceChart: React.FC<{ data: ScheduleMetrics[] }> = ({ data }) => {
  const { theme } = useThemeContext();
  const isDark = theme.mode === 'dark';
  
  const chartColors = {
    score: 'var(--ft-cyber-cyan)',
    games: 'var(--ft-golden-hour)',
    conflicts: 'var(--ft-error, #ff4444)',
    grid: isDark ? 'var(--ft-glass-border)' : 'rgba(0, 0, 0, 0.1)',
    text: isDark ? 'var(--ft-silver-mist)' : 'var(--ft-space-navy)'
  };
  
  return (
    <div className="ft-performance-chart">
      <h3 className="ft-chart-title">Schedule Performance Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.score} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={chartColors.score} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis dataKey="date" stroke={chartColors.text} fontSize={12} />
          <YAxis stroke={chartColors.text} fontSize={12} />
          <Tooltip 
            contentStyle={{
              background: 'var(--ft-glass-primary)',
              border: '1px solid var(--ft-glass-border)',
              borderRadius: 'var(--ft-radius-lg)',
              backdropFilter: 'blur(20px)'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke={chartColors.score}
            fillOpacity={1}
            fill="url(#scoreGradient)"
            strokeWidth={3}
          />
          <Line 
            type="monotone" 
            dataKey="games" 
            stroke={chartColors.games}
            strokeWidth={2}
            dot={{ fill: chartColors.games, r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Team Balance Radar Chart
const TeamBalanceChart: React.FC<{ data: TeamMetrics[] }> = ({ data }) => {
  const { theme } = useThemeContext();
  const isDark = theme.mode === 'dark';
  
  // Transform data for radar chart
  const radarData = data.slice(0, 6).map(team => ({
    team: team.team,
    homeGames: (team.homeGames / (team.homeGames + team.awayGames)) * 100,
    travelEfficiency: Math.max(0, 100 - (team.avgTravelDistance / 50)),
    restQuality: Math.max(0, 100 - (team.backToBackGames * 20)),
    fairness: 85 + Math.random() * 15 // Simulated fairness score
  }));
  
  return (
    <div className="ft-team-balance-chart">
      <h3 className="ft-chart-title">Team Balance Analysis</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid 
            stroke={isDark ? 'var(--ft-glass-border)' : 'rgba(0, 0, 0, 0.1)'} 
          />
          <PolarAngleAxis 
            dataKey="team" 
            stroke={isDark ? 'var(--ft-silver-mist)' : 'var(--ft-space-navy)'} 
            fontSize={12}
          />
          <PolarRadiusAxis 
            domain={[0, 100]} 
            stroke={isDark ? 'var(--ft-silver-mist)' : 'var(--ft-space-navy)'} 
            fontSize={10}
          />
          <Radar 
            name="Home Games %" 
            dataKey="homeGames" 
            stroke="var(--ft-cyber-cyan)" 
            fill="var(--ft-cyber-cyan)" 
            fillOpacity={0.6} 
          />
          <Radar 
            name="Travel Efficiency" 
            dataKey="travelEfficiency" 
            stroke="var(--ft-golden-hour)" 
            fill="var(--ft-golden-hour)" 
            fillOpacity={0.6} 
          />
          <Radar 
            name="Rest Quality" 
            dataKey="restQuality" 
            stroke="var(--ft-success, #00ff88)" 
            fill="var(--ft-success, #00ff88)" 
            fillOpacity={0.6} 
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Main COMPASS Analytics Dashboard
export const COMPASSAnalyticsDashboard: React.FC<COMPASSAnalyticsDashboardProps> = ({
  scheduleId,
  compassScore,
  scheduleMetrics,
  teamMetrics,
  onRefresh
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'performance' | 'teams'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRefresh = async () => {
    setIsLoading(true);
    await onRefresh?.();
    setTimeout(() => setIsLoading(false), 1000);
  };
  
  return (
    <div className={`ft-compass-dashboard ${isLoading ? 'ft-loading' : ''}`}>
      {/* Dashboard Header */}
      <div className="ft-dashboard-header">
        <h2 className="ft-dashboard-title">COMPASS Analytics</h2>
        <div className="ft-dashboard-controls">
          <div className="ft-view-tabs">
            <button 
              className={`ft-tab ${activeView === 'overview' ? 'ft-tab-active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              Overview
            </button>
            <button 
              className={`ft-tab ${activeView === 'performance' ? 'ft-tab-active' : ''}`}
              onClick={() => setActiveView('performance')}
            >
              Performance
            </button>
            <button 
              className={`ft-tab ${activeView === 'teams' ? 'ft-tab-active' : ''}`}
              onClick={() => setActiveView('teams')}
            >
              Teams
            </button>
          </div>
          <button className="ft-btn-refresh" onClick={handleRefresh}>
            <span className="ft-refresh-icon">↻</span>
            Refresh
          </button>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <AnimatePresence mode="wait">
        {activeView === 'overview' && (
          <motion.div
            key="overview"
            className="ft-dashboard-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="ft-dashboard-grid">
              <div className="ft-dashboard-section ft-score-section">
                <COMPASSScoreMeter score={compassScore} />
              </div>
              
              <div className="ft-dashboard-section ft-stats-section">
                <h3 className="ft-section-title">Quick Stats</h3>
                <div className="ft-stats-grid">
                  <StatCard 
                    label="Total Games" 
                    value={scheduleMetrics.reduce((sum, m) => sum + m.games, 0)} 
                    icon="🏆"
                  />
                  <StatCard 
                    label="Active Conflicts" 
                    value={scheduleMetrics[scheduleMetrics.length - 1]?.conflicts || 0} 
                    icon="⚠️"
                    variant="warning"
                  />
                  <StatCard 
                    label="Avg Travel" 
                    value={`${Math.round(teamMetrics.reduce((sum, t) => sum + t.avgTravelDistance, 0) / teamMetrics.length)} mi`} 
                    icon="✈️"
                  />
                  <StatCard 
                    label="Schedule Health" 
                    value="Good" 
                    icon="💚"
                    variant="success"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {activeView === 'performance' && (
          <motion.div
            key="performance"
            className="ft-dashboard-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PerformanceChart data={scheduleMetrics} />
            <div className="ft-metrics-insights">
              <InsightCard 
                title="Performance Trend"
                description="Schedule optimization has improved by 15% over the last iteration"
                type="positive"
              />
              <InsightCard 
                title="Conflict Resolution"
                description="3 venue conflicts resolved, 2 pending review"
                type="neutral"
              />
            </div>
          </motion.div>
        )}
        
        {activeView === 'teams' && (
          <motion.div
            key="teams"
            className="ft-dashboard-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TeamBalanceChart data={teamMetrics} />
            <TeamMetricsTable data={teamMetrics} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}> = ({ label, value, icon, variant = 'default' }) => (
  <motion.div 
    className={`ft-stat-card ft-stat-${variant}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <div className="ft-stat-icon">{icon}</div>
    <div className="ft-stat-content">
      <div className="ft-stat-value">{value}</div>
      <div className="ft-stat-label">{label}</div>
    </div>
  </motion.div>
);

const InsightCard: React.FC<{
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
}> = ({ title, description, type }) => (
  <div className={`ft-insight-card ft-insight-${type}`}>
    <h4 className="ft-insight-title">{title}</h4>
    <p className="ft-insight-description">{description}</p>
  </div>
);

const TeamMetricsTable: React.FC<{ data: TeamMetrics[] }> = ({ data }) => (
  <div className="ft-team-metrics-table">
    <h3 className="ft-section-title">Team Metrics Details</h3>
    <div className="ft-table-container">
      <table className="ft-metrics-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Home</th>
            <th>Away</th>
            <th>Avg Travel</th>
            <th>Rest Days</th>
            <th>Back-to-Back</th>
          </tr>
        </thead>
        <tbody>
          {data.map((team, index) => (
            <motion.tr 
              key={team.team}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <td className="ft-team-name-cell">{team.team}</td>
              <td>{team.homeGames}</td>
              <td>{team.awayGames}</td>
              <td>{team.avgTravelDistance} mi</td>
              <td>{team.restDays}</td>
              <td className={team.backToBackGames > 2 ? 'ft-warning' : ''}>{team.backToBackGames}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Utility Functions
const formatMetricName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

export default COMPASSAnalyticsDashboard;

// Export types for external use
export type { COMPASSScore, ScheduleMetrics, TeamMetrics };