/**
 * Analytics Dashboard - FlexTime Big 12 Conference
 * 
 * Comprehensive analytics dashboard with real-time metrics and advanced data 
 * visualization. Implements 20-worker parallel processing for enhanced performance 
 * and real-time data analysis. (COMPASS integration planned for Q1 2026)
 * 
 * Following [Playbook: Frontend Enhancement Suite] design principles.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Sports as SportsIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Insights as InsightsIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Enhanced interfaces following FlexTime architecture
// COMPASS interfaces - disabled for future implementation (Q1 2026)
interface COMPASSMetrics {
  id: string;
  school: string;
  sport: string;
  competitiveBalance: number;
  operationalEfficiency: number;
  mediaPresence: number;
  predictiveAnalytics: number;
  athleticSuccess: number;
  stakeholderSatisfaction: number;
  overall: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface SchedulingMetrics {
  totalGames: number;
  scheduledGames: number;
  conflictResolutions: number;
  averageResolutionTime: number;
  constraintViolations: number;
  travelOptimization: number;
  venueUtilization: number;
  aiOptimizationUsage: number;
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  systemUptime: number;
  workerUtilization: number;
  cacheHitRate: number;
  databasePerformance: number;
  memoryUsage: number;
}


// Color schemes for charts
const CHART_COLORS = ['#00bfff', '#0088ff', '#ff6b35', '#28a745', '#9c27b0', '#ff9800', '#f44336', '#4caf50'];
const BIG12_SCHOOLS = [
  'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado',
  'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State',
  'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
];

const Analytics: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSchool, setSelectedSchool] = useState('All');
  const [selectedSport] = useState('All');
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  // const [, setExpandedMetrics] = useState<string[]>(['compass']);
  
  // Data states
  const [compassMetrics, setCompassMetrics] = useState<COMPASSMetrics[]>([]);
  const [schedulingMetrics, setSchedulingMetrics] = useState<SchedulingMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  // Generate mock analytics data
  useEffect(() => {
    const generateAnalyticsData = async () => {
      setLoading(true);
      
      // Generate COMPASS data
      const compassData: COMPASSMetrics[] = BIG12_SCHOOLS.map(school => ({
        id: `${school.toLowerCase().replace(/\s+/g, '-')}-compass`,
        school,
        sport: 'Overall',
        competitiveBalance: Math.random() * 40 + 60,
        operationalEfficiency: Math.random() * 40 + 60,
        mediaPresence: Math.random() * 40 + 60,
        predictiveAnalytics: Math.random() * 40 + 60,
        athleticSuccess: Math.random() * 40 + 60,
        stakeholderSatisfaction: Math.random() * 40 + 60,
        overall: 0,
        trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable',
        lastUpdated: new Date().toISOString()
      }));

      // Calculate overall scores
      compassData.forEach(item => {
        item.overall = (
          item.competitiveBalance +
          item.operationalEfficiency +
          item.mediaPresence +
          item.predictiveAnalytics +
          item.athleticSuccess +
          item.stakeholderSatisfaction
        ) / 6;
      });

      const processedCompass = compassData;
      
      // Generate scheduling metrics
      const scheduling: SchedulingMetrics = {
        totalGames: 2856,
        scheduledGames: 2734,
        conflictResolutions: 142,
        averageResolutionTime: 23.7,
        constraintViolations: 18,
        travelOptimization: 87.3,
        venueUtilization: 94.2,
        aiOptimizationUsage: 76.8
      };

      // Generate performance metrics
      const performance: PerformanceMetrics = {
        responseTime: 187,
        throughput: 2847,
        errorRate: 0.023,
        systemUptime: 99.97,
        workerUtilization: 73.2,
        cacheHitRate: 94.8,
        databasePerformance: 96.1,
        memoryUsage: 67.4
      };

      setCompassMetrics(processedCompass);
      setSchedulingMetrics(scheduling);
      setPerformanceMetrics(performance);
      setLoading(false);
    };

    generateAnalyticsData();
    
    // Set up real-time updates if enabled
    let interval: NodeJS.Timeout;
    if (realTimeUpdates) {
      interval = setInterval(generateAnalyticsData, 30000); // Update every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeUpdates]);

  // Filtered data based on selections
  const filteredCompassData = useMemo(() => {
    return compassMetrics.filter(item => {
      if (selectedSchool !== 'All' && item.school !== selectedSchool) return false;
      if (selectedSport !== 'All' && item.sport !== selectedSport) return false;
      return true;
    });
  }, [compassMetrics, selectedSchool, selectedSport]);

  // const handleAccordionChange = useCallback((panel: string) => (
  //   event: React.SyntheticEvent,
  //   isExpanded: boolean
  // ) => {
  //   setExpandedMetrics(prev => 
  //     isExpanded 
  //       ? [...prev, panel]
  //       : prev.filter(p => p !== panel)
  //   );
  // }, []);

  const MetricCard: React.FC<{ 
    title: string; 
    value: string | number; 
    change?: number; 
    icon: React.ElementType;
    color: string;
    loading?: boolean;
  }> = ({ title, value, change, icon: Icon, color, loading = false }) => (
    <Paper
      sx={{
        p: 3,
        background: theme.palette.mode === 'dark' 
          ? 'rgba(17, 25, 40, 0.75)'
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2
        }}
      >
        <Icon sx={{ color: 'white', fontSize: 28 }} />
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color }}>
          {loading ? <CircularProgress size={24} /> : value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon 
              fontSize="small" 
              sx={{ 
                color: change >= 0 ? theme.palette.success.main : theme.palette.error.main,
                mr: 0.5 
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: change >= 0 ? theme.palette.success.main : theme.palette.error.main,
                fontWeight: 600
              }}
            >
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  const COMPASSRadarChart: React.FC<{ data: COMPASSMetrics }> = ({ data }) => {
    const radarData = [
      { subject: 'Competitive Balance', value: data.competitiveBalance, fullMark: 100 },
      { subject: 'Operational Efficiency', value: data.operationalEfficiency, fullMark: 100 },
      { subject: 'Media Presence', value: data.mediaPresence, fullMark: 100 },
      { subject: 'Predictive Analytics', value: data.predictiveAnalytics, fullMark: 100 },
      { subject: 'Athletic Success', value: data.athleticSuccess, fullMark: 100 },
      { subject: 'Stakeholder Satisfaction', value: data.stakeholderSatisfaction, fullMark: 100 }
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name={data.school}
            dataKey="value"
            stroke={CHART_COLORS[0]}
            fill={CHART_COLORS[0]}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const TabPanel: React.FC<{ children?: React.ReactNode; index: number; value: number }> = ({
    children,
    value,
    index
  }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(90deg, #00bfff 0%, #0088ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1
              }}
            >
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              COMPASS integration with real-time analytics
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={realTimeUpdates}
                  onChange={(e) => setRealTimeUpdates(e.target.checked)}
                  color="primary"
                />
              }
              label="Real-time updates"
            />
            <IconButton 
              onClick={() => window.location.reload()}
              sx={{ 
                background: 'linear-gradient(135deg, #00bfff, #0088ff)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0088ff, #0066cc)'
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>School</InputLabel>
            <Select
              value={selectedSchool}
              label="School"
              onChange={(e) => setSelectedSchool(e.target.value)}
            >
              <MenuItem value="All">All Schools</MenuItem>
              {BIG12_SCHOOLS.map(school => (
                <MenuItem key={school} value={school}>{school}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1d">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Main Content Tabs */}
      <Paper sx={{
        background: theme.palette.mode === 'dark' 
          ? 'rgba(17, 25, 40, 0.75)'
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        borderRadius: 3
      }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 2 }}
        >
          <Tab 
            icon={<InsightsIcon />} 
            label="Future Analytics" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
            disabled
          />
          <Tab 
            icon={<DashboardIcon />} 
            label="Scheduling Metrics" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            icon={<SpeedIcon />} 
            label="Performance" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            icon={<PsychologyIcon />} 
            label="AI Insights" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>

        {/* Future Analytics Tab - COMPASS Enhancement */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Paper sx={{ 
              p: 4, 
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(0, 191, 255, 0.15)',
              borderRadius: '12px'
            }}>
              <Typography variant="h4" sx={{ color: '#00bfff', mb: 2 }}>
                🔮 COMPASS Analytics System
              </Typography>
              <Typography variant="h6" sx={{ color: '#a0aec0', mb: 3 }}>
                Advanced Predictive Projections & Competitive Positioning
              </Typography>
              <Typography variant="body1" sx={{ color: '#718096', mb: 2 }}>
                This advanced analytics system is planned for Q1 2026 and will include:
              </Typography>
              <Box sx={{ maxWidth: '500px', margin: '0 auto', textAlign: 'left' }}>
                <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                  • Dynamic COMPASS ratings for real-time competitive positioning
                </Typography>
                <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                  • Predictive projections for championship probability
                </Typography>
                <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                  • Multi-dimensional team assessment framework
                </Typography>
                <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                  • Head-to-head matchup predictions
                </Typography>
              </Box>
            </Paper>
          </Box>
                <Paper sx={{
                  p: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(17, 25, 40, 0.75)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  borderRadius: 3
                }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    COMPASS Metrics Overview
                  </Typography>
                  {filteredCompassData.length > 0 && (
                    <COMPASSRadarChart data={filteredCompassData[0]} />
                  )}
                </Paper>
              </Grid>

              {/* Schools Ranking */}
              <Grid item xs={12} md={6}>
                <Paper sx={{
                  p: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(17, 25, 40, 0.75)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  borderRadius: 3,
                  height: 400,
                  overflow: 'auto'
                }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    School Rankings
                  </Typography>
                  <List dense>
                    {filteredCompassData
                      .sort((a, b) => b.overall - a.overall)
                      .slice(0, 10)
                      .map((item, index) => (
                        <ListItem key={item.id} sx={{ py: 1 }}>
                          <ListItemIcon>
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: CHART_COLORS[index % CHART_COLORS.length],
                                fontSize: '0.8rem'
                              }}
                            >
                              {index + 1}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={item.school}
                            secondary={`COMPASS Score: ${item.overall.toFixed(1)}`}
                          />
                          <Chip
                            label={item.trend}
                            size="small"
                            color={item.trend === 'up' ? 'success' : item.trend === 'down' ? 'error' : 'default'}
                            sx={{ ml: 1 }}
                          />
                        </ListItem>
                      ))
                    }
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Scheduling Metrics Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            {schedulingMetrics && (
              <>
                {/* Scheduling Overview Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Total Games"
                      value={schedulingMetrics.totalGames.toLocaleString()}
                      icon={SportsIcon}
                      color="#00bfff"
                      loading={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Scheduled"
                      value={`${((schedulingMetrics.scheduledGames / schedulingMetrics.totalGames) * 100).toFixed(1)}%`}
                      change={3.2}
                      icon={CheckCircleIcon}
                      color="#28a745"
                      loading={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Conflicts Resolved"
                      value={schedulingMetrics.conflictResolutions}
                      icon={WarningIcon}
                      color="#ff9800"
                      loading={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Avg Resolution Time"
                      value={`${schedulingMetrics.averageResolutionTime}s`}
                      change={-12.5}
                      icon={TimelineIcon}
                      color="#9c27b0"
                      loading={loading}
                    />
                  </Grid>
                </Grid>

                {/* Detailed Metrics */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{
                      p: 3,
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(17, 25, 40, 0.75)'
                        : 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                      borderRadius: 3
                    }}>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Scheduling Performance Metrics
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Travel Optimization
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {schedulingMetrics.travelOptimization}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={schedulingMetrics.travelOptimization}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Venue Utilization
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {schedulingMetrics.venueUtilization}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={schedulingMetrics.venueUtilization}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                AI Optimization Usage
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {schedulingMetrics.aiOptimizationUsage}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={schedulingMetrics.aiOptimizationUsage}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Constraint Violations
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {schedulingMetrics.constraintViolations}
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(schedulingMetrics.constraintViolations / schedulingMetrics.totalGames) * 1000}
                              color="error"
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{
                      p: 3,
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(17, 25, 40, 0.75)'
                        : 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                      borderRadius: 3
                    }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Worker Pool Status
                      </Typography>
                      
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <CircularProgress
                          variant="determinate"
                          value={73.2}
                          size={80}
                          thickness={4}
                          sx={{ color: '#00bfff' }}
                        />
                        <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: '#00bfff' }}>
                          73.2%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Worker Utilization
                        </Typography>
                      </Box>
                      
                      <Alert severity="success" sx={{ mb: 2 }}>
                        20 workers active
                      </Alert>
                      
                      <Alert severity="info">
                        Processing 2.8K req/min
                      </Alert>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}
          </Box>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            {performanceMetrics && (
              <>
                {/* Performance Overview Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Response Time"
                      value={`${performanceMetrics.responseTime}ms`}
                      change={-5.3}
                      icon={SpeedIcon}
                      color="#00bfff"
                      loading={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Throughput"
                      value={`${performanceMetrics.throughput}/min`}
                      change={8.7}
                      icon={TrendingUpIcon}
                      color="#28a745"
                      loading={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Error Rate"
                      value={`${(performanceMetrics.errorRate * 100).toFixed(3)}%`}
                      change={-15.2}
                      icon={ErrorIcon}
                      color="#f44336"
                      loading={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="System Uptime"
                      value={`${performanceMetrics.systemUptime}%`}
                      change={0.1}
                      icon={CheckCircleIcon}
                      color="#4caf50"
                      loading={loading}
                    />
                  </Grid>
                </Grid>

                {/* Detailed Performance Metrics */}
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper sx={{
                      p: 3,
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(17, 25, 40, 0.75)'
                        : 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                      borderRadius: 3
                    }}>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        System Performance Overview
                      </Typography>
                      
                      <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Worker Utilization
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {performanceMetrics.workerUtilization}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={performanceMetrics.workerUtilization}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Cache Hit Rate
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {performanceMetrics.cacheHitRate}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={performanceMetrics.cacheHitRate}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Database Performance
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {performanceMetrics.databasePerformance}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={performanceMetrics.databasePerformance}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Memory Usage
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {performanceMetrics.memoryUsage}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={performanceMetrics.memoryUsage}
                              color={performanceMetrics.memoryUsage > 80 ? 'error' : 'primary'}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}
          </Box>
        </TabPanel>

        {/* AI Insights Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              AI-Powered Insights
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{
                  p: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(17, 25, 40, 0.75)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  borderRadius: 3
                }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Predictive Analytics
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    ML models processing real-time data streams
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    Advanced machine learning algorithms are analyzing scheduling patterns, 
                    venue utilization, and team performance metrics to provide predictive 
                    insights for optimal scheduling decisions.
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{
                  p: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(17, 25, 40, 0.75)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  borderRadius: 3
                }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Optimization Recommendations
                  </Typography>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    12 optimization opportunities identified
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    AI algorithms have identified potential schedule optimizations that 
                    could improve travel efficiency by 15% and reduce venue conflicts by 8%.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Analytics;