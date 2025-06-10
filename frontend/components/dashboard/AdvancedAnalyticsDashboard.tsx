/**
 * Advanced Analytics Dashboard
 * 
 * Revolutionary dashboard built with 21st-dev Magic AI design principles
 * Features comprehensive monitoring, real-time analytics, and glassmorphic UI
 * Optimized for ultimate performance
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Activity, BarChart3, Brain, Clock, Database, Globe, 
  Monitor, Pulse, Server, Sparkles, TrendingUp, Users,
  Zap, AlertTriangle, CheckCircle, Eye, Cpu, HardDrive,
  Network, Timer, Gauge, Target, Layers, Shield,
  LineChart, PieChart, AreaChart, Play, Pause, RefreshCw,
  Download, Share, Settings, Filter, Search, Calendar,
  MapPin, Wifi, Battery, Signal, Volume2, Bell
} from 'lucide-react';

import dashboardAnalyticsService, { 
  SystemMetrics, 
  SchedulingMetrics, 
  GameAnalytics, 
  AIInsights,
  ChartDataPoint 
} from '@/services/dashboardAnalyticsService';

import campusContactsService from '@/services/campusContactsService';
import financialAnalyticsService from '@/services/financialAnalyticsService';

// Real-time Chart Component with Magic AI visualization
const MagicChart: React.FC<{
  data: ChartDataPoint[];
  type: 'line' | 'area' | 'bar';
  height?: number;
  color?: string;
  animated?: boolean;
}> = ({ data, type, height = 200, color = '#00bfff', animated = true }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);
  
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2, ease: "easeInOut" },
        opacity: { duration: 0.5 }
      }
    }
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      <svg width="100%" height="100%" className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {type === 'line' && (
          <motion.path
            d={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - (point.value / maxValue) * 80;
              return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
            }).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="2"
            filter="url(#glow)"
            variants={animated ? pathVariants : {}}
            initial={animated ? "hidden" : "visible"}
            animate={isInView ? "visible" : "hidden"}
          />
        )}
        
        {type === 'area' && (
          <motion.path
            d={`${data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - (point.value / maxValue) * 80;
              return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
            }).join(' ')} L 100% 100% L 0% 100% Z`}
            fill={`url(#gradient-${type})`}
            stroke={color}
            strokeWidth="2"
            variants={animated ? pathVariants : {}}
            initial={animated ? "hidden" : "visible"}
            animate={isInView ? "visible" : "hidden"}
          />
        )}
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - (point.value / maxValue) * 80;
          
          return (
            <motion.circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="3"
              fill={color}
              initial={{ scale: 0, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="cursor-pointer"
            >
              <title>{`${point.label}: ${point.value}`}</title>
            </motion.circle>
          );
        })}
      </svg>
    </div>
  );
};

// Glassmorphic Metric Card with 21st-dev design
const GlassmorphicMetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
}> = ({ title, value, subtitle, icon, trend, trendValue, variant = 'primary', animated = true }) => {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);
  
  useEffect(() => {
    if (animated && typeof value === 'number') {
      const increment = value / 50;
      const timer = setInterval(() => {
        setDisplayValue(prev => {
          const nextValue = typeof prev === 'number' ? prev + increment : increment;
          if (nextValue >= value) {
            clearInterval(timer);
            return value;
          }
          return nextValue;
        });
      }, 20);
      
      return () => clearInterval(timer);
    }
  }, [value, animated]);

  const variantStyles = {
    primary: 'border-accent/30 bg-accent/10 shadow-accent/20 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:shadow-cyan-500/20',
    success: 'border-green-400/30 bg-green-500/10 shadow-green-500/20',
    warning: 'border-yellow-400/30 bg-yellow-500/10 shadow-yellow-500/20',
    danger: 'border-red-400/30 bg-red-500/10 shadow-red-500/20'
  };

  const iconColors = {
    primary: 'text-accent dark:text-cyan-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400'
  };

  return (
    <motion.div
      className={`ft-glass-card relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${variantStyles[variant]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-12 h-12 rounded-xl ${variantStyles[variant]} flex items-center justify-center mb-4`}>
            <div className={iconColors[variant]}>
              {icon}
            </div>
          </div>
          
          <h3 className="text-muted-foreground text-sm font-medium mb-2 ft-font-ui">{title}</h3>
          
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-foreground ft-font-brand">
              {typeof displayValue === 'number' && animated 
                ? Math.floor(displayValue).toLocaleString()
                : value.toLocaleString()
              }
            </span>
            {subtitle && (
              <span className="text-muted-foreground text-sm ft-font-body">{subtitle}</span>
            )}
          </div>
          
          {trend && trendValue && (
            <div className="flex items-center mt-2 space-x-1">
              <TrendingUp 
                className={`w-4 h-4 ${
                  trend === 'up' ? 'text-green-400' : 
                  trend === 'down' ? 'text-red-400 rotate-180' : 
                  'text-gray-400'
                }`} 
              />
              <span className={`text-sm ${
                trend === 'up' ? 'text-green-400' : 
                trend === 'down' ? 'text-red-400' : 
                'text-gray-400'
              }`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// AI Insights Panel with Magic AI design
const AIInsightsPanel: React.FC<{ insights: AIInsight[] }> = ({ insights }) => {
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <Sparkles className="w-5 h-5" />;
      case 'prediction': return <Brain className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'recommendation': return <Target className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'optimization': return 'text-cyan-400 bg-cyan-500/20';
      case 'prediction': return 'text-purple-400 bg-purple-500/20';
      case 'warning': return 'text-red-400 bg-red-500/20';
      case 'recommendation': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="ft-glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center">
          <Brain className="w-6 h-6 text-accent dark:text-cyan-400 mr-3" />
          AI Insights
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm font-medium">Live Analysis</span>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="cursor-pointer"
            onClick={() => setSelectedInsight(insight)}
          >
            <div className="ft-glass-card bg-muted/20 hover:bg-muted/30 transition-all duration-200">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                  {getInsightIcon(insight.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-foreground font-semibold text-sm">{insight.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {Math.round(insight.confidence)}% confidence
                      </span>
                      {insight.action_required && (
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-sm line-clamp-2">{insight.description}</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <Gauge className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-xs">
                        Impact: {insight.impact_score}/10
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {insight.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// System Health Monitor - Fixed padding and spacing
const SystemHealthMonitor: React.FC<{ metrics: SystemMetrics }> = ({ metrics }) => {
  const healthItems = [
    { label: 'CPU Usage', value: metrics.cpu_usage, max: 100, unit: '%', icon: <Cpu className="w-4 h-4" /> },
    { label: 'Memory', value: metrics.memory_usage, max: 100, unit: '%', icon: <HardDrive className="w-4 h-4" /> },
    { label: 'Network I/O', value: metrics.network_io, max: 2000, unit: 'MB/s', icon: <Network className="w-4 h-4" /> },
    { label: 'Response Time', value: metrics.response_time, max: 200, unit: 'ms', icon: <Timer className="w-4 h-4" /> }
  ];

  return (
    <div className="ft-glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center">
          <Monitor className="w-6 h-6 text-green-400 mr-3" />
          System Health
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm">All Systems Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {healthItems.map((item, index) => {
          const percentage = (item.value / item.max) * 100;
          const getHealthColor = (pct: number) => {
            if (pct < 60) return 'bg-green-500';
            if (pct < 80) return 'bg-yellow-500';
            return 'bg-red-500';
          };

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="ft-glass-card bg-muted/20 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="text-accent dark:text-cyan-400">{item.icon}</div>
                  <span className="text-foreground text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-foreground text-sm font-bold">
                  {item.value.toFixed(1)}{item.unit}
                </span>
              </div>
              
              <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-full ${getHealthColor(percentage)} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Main Advanced Analytics Dashboard Component
export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [schedulingMetrics, setSchedulingMetrics] = useState<SchedulingMetrics | null>(null);
  const [gameAnalytics, setGameAnalytics] = useState<GameAnalytics[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  // Load initial data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [system, scheduling, games, insights, chart] = await Promise.all([
          dashboardAnalyticsService.getSystemMetrics(),
          dashboardAnalyticsService.getSchedulingMetrics(),
          dashboardAnalyticsService.getGameAnalytics(),
          dashboardAnalyticsService.getAIInsights(),
          dashboardAnalyticsService.getChartData('cpu_usage', selectedTimeframe)
        ]);

        setSystemMetrics(system);
        setSchedulingMetrics(scheduling);
        setGameAnalytics(games);
        setAIInsights(insights);
        setChartData(chart);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [selectedTimeframe]);

  // Real-time updates
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(async () => {
      try {
        const [system, scheduling] = await Promise.all([
          dashboardAnalyticsService.getSystemMetrics(),
          dashboardAnalyticsService.getSchedulingMetrics()
        ]);
        
        setSystemMetrics(system);
        setSchedulingMetrics(scheduling);
      } catch (error) {
        console.error('Failed to update real-time data:', error);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  // Campus Contacts Summary Component
  const CampusContactsSummary: React.FC = () => {
    const stats = campusContactsService.getContactStatistics();
    const emergencyContacts = campusContactsService.getEmergencyContacts();
    const conferenceStaff = campusContactsService.getConferenceStaff();

    return (
      <div className="ft-glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            <Users className="w-6 h-6 text-accent dark:text-cyan-400 mr-3" />
            Campus Contacts Directory
          </h3>
          <button className="px-4 py-2 bg-accent/20 text-accent dark:bg-cyan-500/20 dark:text-cyan-300 rounded-lg text-sm hover:bg-accent/30 transition-colors">
            View All Contacts
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalContacts}</div>
            <div className="text-muted-foreground text-sm">Total Contacts</div>
          </div>
          <div className="bg-muted/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.availabilityBreakdown.available}</div>
            <div className="text-muted-foreground text-sm">Available Now</div>
          </div>
          <div className="bg-muted/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.emergencyContacts}</div>
            <div className="text-muted-foreground text-sm">Emergency</div>
          </div>
          <div className="bg-muted/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-accent dark:text-cyan-400">{stats.institutions}</div>
            <div className="text-muted-foreground text-sm">Institutions</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emergency Contacts */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
              Emergency Contacts
            </h4>
            <div className="space-y-2">
              {emergencyContacts.slice(0, 3).map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-3 bg-muted/20 rounded-xl"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3">
                    {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground font-medium text-sm truncate">{contact.name}</div>
                    <div className="text-muted-foreground text-xs truncate">{contact.sportRole}</div>
                  </div>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                </motion.div>
              ))}
              {emergencyContacts.length > 3 && (
                <div className="text-muted-foreground text-xs text-center py-2">
                  +{emergencyContacts.length - 3} more emergency contacts
                </div>
              )}
            </div>
          </div>

          {/* Conference Staff */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <Building className="w-4 h-4 text-purple-400 mr-2" />
              Conference Administration
            </h4>
            <div className="space-y-2">
              {conferenceStaff.slice(0, 3).map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-3 bg-muted/20 rounded-xl"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3">
                    {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground font-medium text-sm truncate">{contact.name}</div>
                    <div className="text-muted-foreground text-xs truncate">{contact.sportRole}</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    contact.availability === 'available' ? 'bg-green-400 animate-pulse' :
                    contact.availability === 'busy' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                </motion.div>
              ))}
              {conferenceStaff.length > 3 && (
                <div className="text-muted-foreground text-xs text-center py-2">
                  +{conferenceStaff.length - 3} more conference staff
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Financial Summary Component
  const FinancialSummary: React.FC = () => {
    const performanceSummary = financialAnalyticsService.getPerformanceSummary();
    
    return (
      <div className="ft-glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            <DollarSign className="w-6 h-6 text-accent dark:text-cyan-400 mr-3" />
            Financial Overview
          </h3>
          <button className="px-4 py-2 bg-accent/20 text-accent dark:bg-cyan-500/20 dark:text-cyan-300 rounded-lg text-sm hover:bg-accent/30 transition-colors">
            View Full Dashboard
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              ${(performanceSummary.revenue.total / 1000000).toFixed(1)}M
            </div>
            <div className="text-muted-foreground text-sm">Total Revenue</div>
            <div className="text-green-400 text-xs mt-1">
              +{performanceSummary.revenue.growth.toFixed(1)}% YoY
            </div>
          </div>
          
          <div className="bg-muted/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              ${(performanceSummary.expenses.total / 1000000).toFixed(1)}M
            </div>
            <div className="text-muted-foreground text-sm">Total Expenses</div>
            <div className="text-red-400 text-xs mt-1">
              {performanceSummary.expenses.variance.toFixed(1)}% variance
            </div>
          </div>
          
          <div className="bg-muted/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-accent dark:text-cyan-400">
              {performanceSummary.budget.utilization.toFixed(1)}%
            </div>
            <div className="text-muted-foreground text-sm">Budget Utilization</div>
            <div className="text-yellow-400 text-xs mt-1">
              {performanceSummary.budget.alertCount} alerts
            </div>
          </div>
          
          <div className="bg-muted/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              ${((performanceSummary.revenue.total - performanceSummary.expenses.total) / 1000000).toFixed(1)}M
            </div>
            <div className="text-muted-foreground text-sm">Net Income</div>
            <div className="text-green-400 text-xs mt-1">
              Positive margin
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Budget Status */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <Target className="w-4 h-4 text-green-400 mr-2" />
              Budget Performance
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                  <span className="text-foreground text-sm">On Track</span>
                </div>
                <span className="text-green-400 text-sm">
                  {10 - performanceSummary.budget.areasOverBudget} areas
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-2" />
                  <span className="text-foreground text-sm">Over Budget</span>
                </div>
                <span className="text-red-400 text-sm">
                  {performanceSummary.budget.areasOverBudget} areas
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                  <span className="text-foreground text-sm">Staff Efficiency</span>
                </div>
                <span className="text-blue-400 text-sm">
                  {performanceSummary.staff.avgEfficiency.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Streams */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 text-cyan-400 mr-2" />
              Top Revenue Categories
            </h4>
            <div className="space-y-2">
              {[
                { name: 'Media Rights', amount: 380, trend: '+8.5%' },
                { name: 'NCAA Revenue', amount: 45, trend: '+4.1%' },
                { name: 'Partnerships', amount: 35, trend: '+12.3%' }
              ].map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/20 rounded-xl"
                >
                  <div>
                    <div className="text-foreground text-sm font-medium">{category.name}</div>
                    <div className="text-green-400 text-xs">{category.trend}</div>
                  </div>
                  <div className="text-cyan-400 text-sm font-bold">
                    ${category.amount}M
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!systemMetrics || !schedulingMetrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="text-foreground text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold ft-font-ui">Loading Analytics Dashboard...</p>
          <p className="text-accent text-sm mt-2 ft-font-body">Optimized for performance</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="ft-container space-y-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent mb-4 ft-font-brand">
            HELiiX INTELLIGIANCE
          </h1>
          <p className="text-xl text-secondary max-w-3xl mx-auto ft-font-body tracking-wide">
            Synthesizing complex data streams into actionable insights through quantum-accelerated neural processing
          </p>
          
          {/* Controls */}
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className={`ft-glass-button flex items-center space-x-2 ${
                isRealTimeEnabled 
                  ? 'ft-glass-button-neon' 
                  : 'opacity-60'
              }`}
            >
              {isRealTimeEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRealTimeEnabled ? 'Live' : 'Paused'}</span>
            </button>
            
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="ft-glass-input"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassmorphicMetricCard
            title="System Uptime"
            value={systemMetrics.uptime}
            subtitle="%"
            icon={<Shield className="w-6 h-6" />}
            trend="stable"
            trendValue="99.9%"
            variant="success"
          />
          
          <GlassmorphicMetricCard
            title="Active Connections"
            value={systemMetrics.active_connections}
            icon={<Users className="w-6 h-6" />}
            trend="up"
            trendValue="+12%"
            variant="primary"
          />
          
          <GlassmorphicMetricCard
            title="Schedules Created"
            value={schedulingMetrics.schedules_today}
            subtitle="today"
            icon={<Calendar className="w-6 h-6" />}
            trend="up"
            trendValue="+8%"
            variant="success"
          />
          
          <GlassmorphicMetricCard
            title="Response Time"
            value={systemMetrics.response_time}
            subtitle="ms"
            icon={<Zap className="w-6 h-6" />}
            trend="down"
            trendValue="-15ms"
            variant="success"
          />
        </div>

        {/* Charts and Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Chart - Fixed padding */}
          <div className="ft-glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground flex items-center">
                <LineChart className="w-6 h-6 text-accent dark:text-cyan-400 mr-3" />
                System Performance
              </h3>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-accent/20 text-accent dark:bg-cyan-500/20 dark:text-cyan-300 rounded-lg text-sm">CPU</button>
                <button className="px-3 py-1 bg-muted/20 text-muted-foreground rounded-lg text-sm">Memory</button>
                <button className="px-3 py-1 bg-muted/20 text-muted-foreground rounded-lg text-sm">Network</button>
              </div>
            </div>
            <MagicChart 
              data={chartData} 
              type="area" 
              height={300} 
              color="#00bfff" 
              animated={true}
            />
          </div>

          {/* System Health */}
          <SystemHealthMonitor metrics={systemMetrics} />
        </div>

        {/* AI Insights and Game Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Insights - Takes 2 columns */}
          <div className="lg:col-span-2">
            <AIInsightsPanel insights={aiInsights} />
          </div>
          
          {/* Game Analytics Summary */}
          <div className="ft-glass-card p-6">
            <h3 className="text-xl font-bold text-foreground flex items-center mb-6">
              <BarChart3 className="w-6 h-6 text-purple-400 mr-3" />
              Game Analytics
            </h3>
            
            <div className="space-y-4">
              {gameAnalytics.slice(0, 6).map((sport, index) => (
                <motion.div
                  key={sport.sport}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/20 rounded-xl"
                >
                  <div>
                    <h4 className="text-foreground font-medium text-sm">{sport.sport}</h4>
                    <p className="text-muted-foreground text-xs">
                      {sport.games_completed}/{sport.games_scheduled} games
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-accent dark:text-cyan-400 font-bold text-sm">
                      {sport.venue_utilization}%
                    </div>
                    <div className="text-muted-foreground text-xs">utilization</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Campus Contacts Summary */}
        <div className="mt-8">
          <CampusContactsSummary />
        </div>

        {/* Financial Summary */}
        <div className="mt-8">
          <FinancialSummary />
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;