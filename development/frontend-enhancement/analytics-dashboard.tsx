/**
 * Comprehensive Analytics Dashboard for FlexTime
 * 
 * Features:
 * - Interactive charts and visualizations
 * - Schedule performance metrics
 * - Real-time data updates
 * - Customizable report builder
 * - Export functionality
 * - Predictive analytics
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  LinearProgress,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Assessment as ReportIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  Tune as FilterIcon,
  Timeline as TimelineIcon,
  PieChart as PieIcon,
  BarChart as BarIcon,
  ShowChart as LineIcon,
  TableChart as TableIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Fullscreen as FullscreenIcon,
  Share as ShareIcon,
  Star as StarIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  ComposedChart
} from 'recharts';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

// Analytics data interfaces
interface ScheduleMetrics {
  totalGames: number;
  scheduledGames: number;
  conflicts: number;
  optimizationScore: number;
  travelEfficiency: number;
  venueUtilization: number;
  averageRestDays: number;
  backToBackGames: number;
  conflicts: {
    venue: number;
    travel: number;
    rest: number;
    television: number;
  };
}

interface TeamAnalytics {
  teamId: string;
  teamName: string;
  homeGames: number;
  awayGames: number;
  totalTravelMiles: number;
  averageRestDays: number;
  conflictCount: number;
  optimizationScore: number;
  weekendGames: number;
  nationalTVGames: number;
}

interface VenueAnalytics {
  venueId: string;
  venueName: string;
  utilizationRate: number;
  capacityEfficiency: number;
  gamesScheduled: number;
  averageAttendance: number;
  revenueGenerated: number;
  maintenanceCost: number;
}

interface TimeSeriesData {
  date: string;
  scheduledGames: number;
  conflicts: number;
  optimizationScore: number;
  travelMiles: number;
  attendance: number;
}

interface PredictiveAnalytics {
  conflictProbability: number;
  optimalScheduleScore: number;
  attendancePrediction: number;
  revenueForecast: number;
  recommendations: string[];
}

// Chart component interfaces
interface ChartProps {
  data: any[];
  title: string;
  height?: number;
  loading?: boolean;
  onExport?: () => void;
  onFullscreen?: () => void;
}

// Custom Chart Components
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}> = ({ title, value, change, icon, color, subtitle }) => {
  const theme = useTheme();
  const cardColor = color || theme.palette.primary.main;
  
  return (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${alpha(cardColor, 0.1)}, ${alpha(cardColor, 0.05)})`,
      border: `1px solid ${alpha(cardColor, 0.2)}`
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ color: cardColor }}>
            {icon}
          </Box>
          {change !== undefined && (
            <Chip
              label={`${change > 0 ? '+' : ''}${change}%`}
              size="small"
              color={change > 0 ? 'success' : change < 0 ? 'error' : 'default'}
            />
          )}
        </Box>
        
        <Typography variant="h4" fontWeight={700} color={cardColor} gutterBottom>
          {value}
        </Typography>
        
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const ScheduleOptimizationChart: React.FC<ChartProps> = ({ 
  data, 
  title, 
  height = 300, 
  loading,
  onExport,
  onFullscreen 
}) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Paper sx={{ p: 3, height }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        <Stack direction="row" spacing={1}>
          {onExport && (
            <Tooltip title="Export Chart">
              <IconButton size="small" onClick={onExport}>
                <ExportIcon />
              </IconButton>
            </Tooltip>
          )}
          {onFullscreen && (
            <Tooltip title="Fullscreen">
              <IconButton size="small" onClick={onFullscreen}>
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
      
      <ResponsiveContainer width="100%" height={height - 80}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
          <XAxis 
            dataKey="date" 
            stroke={theme.palette.text.secondary}
            fontSize={12}
          />
          <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
          <RechartsTooltip 
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8
            }}
          />
          <Legend />
          <Bar 
            dataKey="scheduledGames" 
            fill={theme.palette.primary.main} 
            name="Scheduled Games" 
            opacity={0.8}
          />
          <Line 
            type="monotone" 
            dataKey="optimizationScore" 
            stroke={theme.palette.success.main} 
            strokeWidth={3}
            name="Optimization Score"
          />
          <Area 
            type="monotone" 
            dataKey="conflicts" 
            fill={theme.palette.error.main} 
            stroke={theme.palette.error.main}
            opacity={0.3}
            name="Conflicts"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
};

const TeamPerformanceRadar: React.FC<ChartProps & { teams: TeamAnalytics[] }> = ({ 
  teams, 
  title, 
  height = 400 
}) => {
  const theme = useTheme();
  
  const radarData = useMemo(() => {
    if (!teams.length) return [];
    
    const metrics = ['homeGames', 'awayGames', 'optimizationScore', 'averageRestDays', 'weekendGames'];
    
    return metrics.map(metric => {
      const dataPoint: any = { metric: metric.replace(/([A-Z])/g, ' $1').trim() };
      
      teams.forEach(team => {
        dataPoint[team.teamName] = team[metric as keyof TeamAnalytics];
      });
      
      return dataPoint;
    });
  }, [teams]);

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main
  ];

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      
      <ResponsiveContainer width="100%" height={height - 60}>
        <RadarChart data={radarData}>
          <PolarGrid stroke={alpha(theme.palette.divider, 0.3)} />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          />
          <PolarRadiusAxis 
            tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
            tickCount={4}
          />
          {teams.slice(0, 5).map((team, index) => (
            <Radar
              key={team.teamId}
              name={team.teamName}
              dataKey={team.teamName}
              stroke={colors[index]}
              fill={colors[index]}
              fillOpacity={0.1}
              strokeWidth={2}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

const VenueUtilizationTreemap: React.FC<ChartProps & { venues: VenueAnalytics[] }> = ({ 
  venues, 
  title, 
  height = 400 
}) => {
  const theme = useTheme();
  
  const treemapData = useMemo(() => {
    return venues.map(venue => ({
      name: venue.venueName,
      size: venue.utilizationRate * 100,
      fill: venue.utilizationRate > 0.8 
        ? theme.palette.success.main 
        : venue.utilizationRate > 0.6 
          ? theme.palette.warning.main 
          : theme.palette.error.main
    }));
  }, [venues, theme]);

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      
      <ResponsiveContainer width="100%" height={height - 60}>
        <Treemap
          data={treemapData}
          dataKey="size"
          ratio={4/3}
          stroke={theme.palette.background.paper}
          strokeWidth={2}
        />
      </ResponsiveContainer>
    </Paper>
  );
};

// Main Analytics Dashboard Component
interface AnalyticsDashboardProps {
  scheduleId?: string;
  sport?: string;
  dateRange?: [Date, Date];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  scheduleId,
  sport = 'football',
  dateRange
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  // Data states
  const [metrics, setMetrics] = useState<ScheduleMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics[]>([]);
  const [venueAnalytics, setVenueAnalytics] = useState<VenueAnalytics[]>([]);
  const [predictiveData, setPredictiveData] = useState<PredictiveAnalytics | null>(null);

  // Filters
  const [timeFilter, setTimeFilter] = useState('30d');
  const [teamFilter, setTeamFilter] = useState('all');
  const [metricFilter, setMetricFilter] = useState('all');

  // Mock data generation (replace with actual API calls)
  const generateMockData = useCallback(() => {
    // Mock schedule metrics
    const mockMetrics: ScheduleMetrics = {
      totalGames: 144,
      scheduledGames: 132,
      conflicts: 8,
      optimizationScore: 87.3,
      travelEfficiency: 78.9,
      venueUtilization: 82.1,
      averageRestDays: 6.2,
      backToBackGames: 12,
      conflicts: {
        venue: 3,
        travel: 2,
        rest: 2,
        television: 1
      }
    };

    // Mock time series data
    const mockTimeSeries: TimeSeriesData[] = Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), 29 - i), 'MMM dd'),
      scheduledGames: Math.floor(Math.random() * 10) + 5,
      conflicts: Math.floor(Math.random() * 3),
      optimizationScore: Math.random() * 20 + 80,
      travelMiles: Math.random() * 1000 + 500,
      attendance: Math.random() * 20000 + 30000
    }));

    // Mock team analytics
    const teams = ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati'];
    const mockTeamAnalytics: TeamAnalytics[] = teams.map((name, i) => ({
      teamId: `team-${i}`,
      teamName: name,
      homeGames: Math.floor(Math.random() * 8) + 6,
      awayGames: Math.floor(Math.random() * 8) + 6,
      totalTravelMiles: Math.random() * 10000 + 5000,
      averageRestDays: Math.random() * 3 + 5,
      conflictCount: Math.floor(Math.random() * 3),
      optimizationScore: Math.random() * 20 + 75,
      weekendGames: Math.floor(Math.random() * 6) + 4,
      nationalTVGames: Math.floor(Math.random() * 4) + 1
    }));

    // Mock venue analytics
    const venues = ['Stadium A', 'Arena B', 'Field C', 'Complex D'];
    const mockVenueAnalytics: VenueAnalytics[] = venues.map((name, i) => ({
      venueId: `venue-${i}`,
      venueName: name,
      utilizationRate: Math.random() * 0.4 + 0.6,
      capacityEfficiency: Math.random() * 0.3 + 0.7,
      gamesScheduled: Math.floor(Math.random() * 20) + 10,
      averageAttendance: Math.random() * 20000 + 30000,
      revenueGenerated: Math.random() * 500000 + 250000,
      maintenanceCost: Math.random() * 50000 + 25000
    }));

    // Mock predictive analytics
    const mockPredictive: PredictiveAnalytics = {
      conflictProbability: Math.random() * 0.3 + 0.1,
      optimalScheduleScore: Math.random() * 10 + 90,
      attendancePrediction: Math.random() * 5000 + 45000,
      revenueForecast: Math.random() * 100000 + 400000,
      recommendations: [
        'Consider moving 3 games to reduce travel conflicts',
        'Optimize venue scheduling for better utilization',
        'Review rest day policies for player wellness',
        'Increase weekend game allocation for attendance'
      ]
    };

    setMetrics(mockMetrics);
    setTimeSeriesData(mockTimeSeries);
    setTeamAnalytics(mockTeamAnalytics);
    setVenueAnalytics(mockVenueAnalytics);
    setPredictiveData(mockPredictive);
  }, []);

  // Load data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      generateMockData();
      setLoading(false);
    }, 1000);
  }, [generateMockData, scheduleId, sport, dateRange]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      generateMockData();
      setRefreshing(false);
    }, 500);
  }, [generateMockData]);

  // Export functionality
  const handleExport = useCallback((format: 'csv' | 'pdf' | 'xlsx') => {
    console.log(`Exporting analytics data as ${format}`);
    setExportDialogOpen(false);
  }, []);

  // Tab panels
  const TabPanel: React.FC<{ children: React.ReactNode; value: number; index: number }> = ({
    children,
    value,
    index
  }) => (
    <div hidden={value !== index} style={{ height: '100%' }}>
      {value === index && children}
    </div>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {sport.charAt(0).toUpperCase() + sport.slice(1)} Schedule Analytics
              {scheduleId && ` • Schedule ${scheduleId}`}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDialogOpen(true)}
            >
              Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => setExportDialogOpen(true)}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>
        </Box>
        
        {refreshing && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>

      {/* Key Metrics */}
      {metrics && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Optimization Score"
              value={`${metrics.optimizationScore}%`}
              change={2.3}
              icon={<TrendingIcon />}
              color={theme.palette.success.main}
              subtitle="Schedule efficiency rating"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Conflicts"
              value={metrics.conflicts}
              change={-12}
              icon={<WarningIcon />}
              color={theme.palette.error.main}
              subtitle="Scheduling conflicts detected"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Travel Efficiency"
              value={`${metrics.travelEfficiency}%`}
              change={1.8}
              icon={<TimelineIcon />}
              color={theme.palette.info.main}
              subtitle="Optimized travel routing"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Venue Utilization"
              value={`${metrics.venueUtilization}%`}
              change={-0.5}
              icon={<PieIcon />}
              color={theme.palette.warning.main}
              subtitle="Facility usage rate"
            />
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Team Analysis" />
          <Tab label="Venue Analytics" />
          <Tab label="Predictive Insights" />
        </Tabs>
        
        <Box sx={{ flexGrow: 1, p: 2 }}>
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={2} sx={{ height: '100%' }}>
              <Grid item xs={12} lg={8}>
                <ScheduleOptimizationChart
                  data={timeSeriesData}
                  title="Schedule Optimization Over Time"
                  height={400}
                  onExport={() => handleExport('csv')}
                />
              </Grid>
              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Conflict Breakdown
                  </Typography>
                  {metrics && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(metrics.conflicts).map(([key, value]) => ({
                            name: key.charAt(0).toUpperCase() + key.slice(1),
                            value
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {Object.entries(metrics.conflicts).map((_, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={[
                                theme.palette.error.main,
                                theme.palette.warning.main,
                                theme.palette.info.main,
                                theme.palette.success.main
                              ][index]} 
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} lg={8}>
                <TeamPerformanceRadar
                  teams={teamAnalytics}
                  title="Team Performance Comparison"
                  data={[]}
                  height={500}
                />
              </Grid>
              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Team Rankings
                  </Typography>
                  <Stack spacing={1}>
                    {teamAnalytics
                      .sort((a, b) => b.optimizationScore - a.optimizationScore)
                      .slice(0, 5)
                      .map((team, index) => (
                        <Card key={team.teamId} variant="outlined">
                          <CardContent sx={{ py: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="h6" color="primary">
                                #{index + 1}
                              </Typography>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {team.teamName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Score: {team.optimizationScore.toFixed(1)}%
                                </Typography>
                              </Box>
                              <Chip
                                label={`${team.conflictCount} conflicts`}
                                size="small"
                                color={team.conflictCount === 0 ? 'success' : 'warning'}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <VenueUtilizationTreemap
                  venues={venueAnalytics}
                  title="Venue Utilization Overview"
                  data={[]}
                  height={400}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={2}>
              {predictiveData && (
                <>
                  <Grid item xs={12} md={4}>
                    <MetricCard
                      title="Conflict Probability"
                      value={`${(predictiveData.conflictProbability * 100).toFixed(1)}%`}
                      icon={<WarningIcon />}
                      color={theme.palette.warning.main}
                      subtitle="Likelihood of future conflicts"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <MetricCard
                      title="Optimal Score Prediction"
                      value={`${predictiveData.optimalScheduleScore.toFixed(1)}%`}
                      icon={<StarIcon />}
                      color={theme.palette.success.main}
                      subtitle="Achievable optimization score"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <MetricCard
                      title="Revenue Forecast"
                      value={`$${(predictiveData.revenueForecast / 1000).toFixed(0)}K`}
                      icon={<TrendingIcon />}
                      color={theme.palette.primary.main}
                      subtitle="Projected season revenue"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        AI Recommendations
                      </Typography>
                      <Stack spacing={1}>
                        {predictiveData.recommendations.map((recommendation, index) => (
                          <Alert key={index} severity="info" variant="outlined">
                            {recommendation}
                          </Alert>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                </>
              )}
            </Grid>
          </TabPanel>
        </Box>
      </Paper>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Analytics Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose your preferred export format:
          </Typography>
          <Stack spacing={1}>
            <Button onClick={() => handleExport('csv')} startIcon={<TableIcon />}>
              CSV Spreadsheet
            </Button>
            <Button onClick={() => handleExport('pdf')} startIcon={<ReportIcon />}>
              PDF Report
            </Button>
            <Button onClick={() => handleExport('xlsx')} startIcon={<ExportIcon />}>
              Excel Workbook
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Analytics Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                  <MenuItem value="7d">Last 7 days</MenuItem>
                  <MenuItem value="30d">Last 30 days</MenuItem>
                  <MenuItem value="90d">Last 90 days</MenuItem>
                  <MenuItem value="1y">Last year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Team</InputLabel>
                <Select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                  <MenuItem value="all">All Teams</MenuItem>
                  {teamAnalytics.map(team => (
                    <MenuItem key={team.teamId} value={team.teamId}>
                      {team.teamName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Metric</InputLabel>
                <Select value={metricFilter} onChange={(e) => setMetricFilter(e.target.value)}>
                  <MenuItem value="all">All Metrics</MenuItem>
                  <MenuItem value="optimization">Optimization</MenuItem>
                  <MenuItem value="conflicts">Conflicts</MenuItem>
                  <MenuItem value="travel">Travel</MenuItem>
                  <MenuItem value="venue">Venue Usage</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setFilterDialogOpen(false)}>
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnalyticsDashboard;