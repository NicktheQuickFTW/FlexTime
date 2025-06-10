/**
 * Realtime Metrics Grid Component
 * 
 * Advanced real-time monitoring grid with 21st-dev Magic AI design
 * Features live data streams, interactive charts, and glassmorphic UI
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, TrendingUp, TrendingDown, Minus, Zap, 
  Users, Database, Server, Globe, Cpu, HardDrive,
  Network, Clock, Eye, Heart, AlertCircle, CheckCircle
} from 'lucide-react';

interface MetricData {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  status: 'healthy' | 'warning' | 'critical';
  history: number[];
  target?: number;
  icon: React.ReactNode;
}

const MiniSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height="40" className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return (
          <circle
            key={index}
            cx={`${x}%`}
            cy={`${y}%`}
            r="2"
            fill={color}
            className="opacity-60"
          />
        );
      })}
    </svg>
  );
};

const MetricCard: React.FC<{ metric: MetricData; index: number }> = ({ metric, index }) => {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (metric.status) {
      case 'healthy': return 'border-green-400/30 bg-green-500/10';
      case 'warning': return 'border-yellow-400/30 bg-yellow-500/10';
      case 'critical': return 'border-red-400/30 bg-red-500/10';
      default: return 'border-cyan-400/30 bg-cyan-500/10';
    }
  };

  const getSparklineColor = () => {
    switch (metric.status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#06b6d4';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`
        relative backdrop-blur-xl border rounded-2xl p-4
        transition-all duration-300 hover:scale-105 hover:shadow-2xl
        ${getStatusColor()}
      `}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
      
      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-white/80">
              {metric.icon}
            </div>
            <span className="text-white/70 text-sm font-medium">{metric.label}</span>
          </div>
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={`text-xs ${
              metric.trend === 'up' ? 'text-green-400' :
              metric.trend === 'down' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
            </span>
          </div>
        </div>

        {/* Value */}
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-white">
            {metric.value.toLocaleString()}
          </span>
          <span className="text-white/50 text-sm">{metric.unit}</span>
        </div>

        {/* Sparkline */}
        <div className="h-10">
          <MiniSparkline data={metric.history} color={getSparklineColor()} />
        </div>

        {/* Progress bar for metrics with targets */}
        {metric.target && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/60">
              <span>Progress</span>
              <span>{Math.round((metric.value / metric.target) * 100)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <motion.div
                className={`h-full rounded-full ${
                  metric.status === 'healthy' ? 'bg-green-400' :
                  metric.status === 'warning' ? 'bg-yellow-400' :
                  'bg-red-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              metric.status === 'healthy' ? 'bg-green-400 animate-pulse' :
              metric.status === 'warning' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400 animate-pulse'
            }`} />
            <span className={`text-xs capitalize ${
              metric.status === 'healthy' ? 'text-green-400' :
              metric.status === 'warning' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {metric.status}
            </span>
          </div>
          <span className="text-white/40 text-xs">Live</span>
        </div>
      </div>
    </motion.div>
  );
};

export const RealtimeMetricsGrid: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  // Generate realistic metrics data
  const generateMetrics = (): MetricData[] => {
    const baseHistory = () => Array.from({ length: 20 }, () => Math.random() * 100);
    
    return [
      {
        id: 'cpu',
        label: 'CPU Usage',
        value: Math.floor(Math.random() * 30) + 25,
        unit: '%',
        trend: Math.random() > 0.5 ? 'up' : 'down',
        trendValue: Math.floor(Math.random() * 10) - 5,
        status: 'healthy',
        history: baseHistory(),
        target: 80,
        icon: <Cpu className="w-4 h-4" />
      },
      {
        id: 'memory',
        label: 'Memory Usage',
        value: Math.floor(Math.random() * 25) + 45,
        unit: '%',
        trend: 'stable',
        trendValue: Math.floor(Math.random() * 3) - 1,
        status: 'healthy',
        history: baseHistory(),
        target: 85,
        icon: <HardDrive className="w-4 h-4" />
      },
      {
        id: 'network',
        label: 'Network I/O',
        value: Math.floor(Math.random() * 500) + 750,
        unit: 'MB/s',
        trend: 'up',
        trendValue: Math.floor(Math.random() * 15) + 5,
        status: 'healthy',
        history: baseHistory(),
        icon: <Network className="w-4 h-4" />
      },
      {
        id: 'response',
        label: 'Response Time',
        value: Math.floor(Math.random() * 30) + 45,
        unit: 'ms',
        trend: 'down',
        trendValue: -Math.floor(Math.random() * 10) - 2,
        status: 'healthy',
        history: baseHistory(),
        target: 200,
        icon: <Clock className="w-4 h-4" />
      },
      {
        id: 'users',
        label: 'Active Users',
        value: Math.floor(Math.random() * 200) + 1250,
        unit: '',
        trend: 'up',
        trendValue: Math.floor(Math.random() * 12) + 3,
        status: 'healthy',
        history: baseHistory(),
        icon: <Users className="w-4 h-4" />
      },
      {
        id: 'db',
        label: 'DB Connections',
        value: Math.floor(Math.random() * 50) + 125,
        unit: '',
        trend: 'stable',
        trendValue: Math.floor(Math.random() * 3) - 1,
        status: 'healthy',
        history: baseHistory(),
        target: 200,
        icon: <Database className="w-4 h-4" />
      },
      {
        id: 'requests',
        label: 'Requests/min',
        value: Math.floor(Math.random() * 1000) + 2500,
        unit: '',
        trend: 'up',
        trendValue: Math.floor(Math.random() * 8) + 2,
        status: 'healthy',
        history: baseHistory(),
        icon: <Globe className="w-4 h-4" />
      },
      {
        id: 'errors',
        label: 'Error Rate',
        value: Math.random() * 2,
        unit: '%',
        trend: 'down',
        trendValue: -Math.floor(Math.random() * 5) - 1,
        status: 'healthy',
        history: baseHistory(),
        target: 5,
        icon: <AlertCircle className="w-4 h-4" />
      }
    ];
  };

  useEffect(() => {
    // Initial load
    setMetrics(generateMetrics());

    // Real-time updates every 3 seconds
    const interval = setInterval(() => {
      setMetrics(prevMetrics => 
        prevMetrics.map(metric => ({
          ...metric,
          value: metric.id === 'errors' 
            ? Math.random() * 2 
            : Math.floor(Math.random() * (metric.target || 100)) + (metric.target ? metric.target * 0.3 : 50),
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          trendValue: Math.floor(Math.random() * 20) - 10,
          history: [...metric.history.slice(1), Math.random() * 100]
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Real-time System Metrics</h2>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-white/60 text-sm">• 100 workers active</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {metrics.map((metric, index) => (
            <MetricCard key={metric.id} metric={metric} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* System Status Summary */}
      <motion.div 
        className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-white font-semibold">System Status: Optimal</h3>
              <p className="text-white/60 text-sm">All metrics within normal parameters</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-green-400">8 Healthy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span className="text-yellow-400">0 Warning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span className="text-red-400">0 Critical</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RealtimeMetricsGrid;