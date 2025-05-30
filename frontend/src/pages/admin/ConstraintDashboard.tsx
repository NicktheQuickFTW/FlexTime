import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  LinearProgress,
  Menu,
  MenuItem,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Rule as RuleIcon,
  Analytics as AnalyticsIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  HealthAndSafety as HealthIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Color palette for charts
const COLORS = ['#0066cc', '#3399ff', '#00c2ff', '#00f2ff', '#FF9800', '#28A745'];

interface SystemMetrics {
  constraintCount: number;
  activeSchedules: number;
  conflictResolutions: number;
  systemHealth: number;
  apiResponseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  lastUpdated: string;
}

interface ConstraintStat {
  type: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'resolve';
}

const ConstraintDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [constraintStats, setConstraintStats] = useState<ConstraintStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = autoRefresh ? setInterval(fetchDashboardData, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls - in production, these would be real API endpoints
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setMetrics({
        constraintCount: 156,
        activeSchedules: 12,
        conflictResolutions: 89,
        systemHealth: 94,
        apiResponseTime: 125,
        cpuUsage: 42,
        memoryUsage: 68,
        lastUpdated: new Date().toISOString()
      });

      setConstraintStats([
        { type: 'Rest Days', count: 45, percentage: 28.8, trend: 'up' },
        { type: 'Venue Availability', count: 38, percentage: 24.4, trend: 'stable' },
        { type: 'Travel Distance', count: 32, percentage: 20.5, trend: 'down' },
        { type: 'Back-to-Back Games', count: 25, percentage: 16.0, trend: 'up' },
        { type: 'Team Preferences', count: 16, percentage: 10.3, trend: 'stable' }
      ]);

      setRecentActivity([
        {
          id: '1',
          user: 'Admin User',
          action: 'Updated constraint',
          target: 'Basketball Rest Days',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          type: 'update'
        },
        {
          id: '2',
          user: 'Schedule Manager',
          action: 'Resolved conflict',
          target: 'Venue Double Booking',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          type: 'resolve'
        },
        {
          id: '3',
          user: 'System',
          action: 'Auto-optimized',
          target: 'Football Travel Routes',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          type: 'update'
        }
      ]);

      // Generate performance data for the last 24 hours
      const perfData = Array.from({ length: 24 }, (_, i) => ({
        time: `${23 - i}:00`,
        responseTime: Math.floor(Math.random() * 50) + 100,
        throughput: Math.floor(Math.random() * 200) + 300
      }));
      setPerformanceData(perfData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting dashboard data...');
    handleMenuClose();
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return '#28A745';
    if (health >= 70) return '#FF9800';
    return '#DC3545';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ fontSize: 16, color: '#28A745' }} />;
      case 'down':
        return <TrendingDownIcon sx={{ fontSize: 16, color: '#DC3545' }} />;
      default:
        return null;
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'create':
        return <CheckCircleIcon sx={{ fontSize: 16, color: '#28A745' }} />;
      case 'update':
        return <SettingsIcon sx={{ fontSize: 16, color: '#0066cc' }} />;
      case 'delete':
        return <WarningIcon sx={{ fontSize: 16, color: '#DC3545' }} />;
      case 'resolve':
        return <CheckCircleIcon sx={{ fontSize: 16, color: '#FF9800' }} />;
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Constraint System Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage scheduling constraints across all sports
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <IconButton 
            onClick={fetchDashboardData}
            color="primary"
            sx={{ border: '1px solid rgba(0, 102, 204, 0.3)' }}
          >
            <RefreshIcon />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export Report
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/admin/constraints/new')}
            sx={{
              background: 'linear-gradient(135deg, #0066cc, #3399ff)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0052a3, #297acc)'
              }
            }}
          >
            Add Constraint
          </Button>
        </Box>
      </Box>

      {/* System Status Alert */}
      {metrics && metrics.systemHealth < 80 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          System health is below optimal levels. Check the System Health panel for details.
        </Alert>
      )}

      {/* Metrics Grid */}
      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Constraints
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {metrics?.constraintCount}
                  </Typography>
                  <Chip
                    label="+12% this week"
                    size="small"
                    sx={{ mt: 1, bgcolor: 'rgba(40, 167, 69, 0.1)', color: '#28A745' }}
                  />
                </Box>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #0066cc, #3399ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RuleIcon sx={{ color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Active Schedules
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {metrics?.activeSchedules}
                  </Typography>
                  <Chip
                    label="2 pending"
                    size="small"
                    sx={{ mt: 1, bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#FF9800' }}
                  />
                </Box>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #3399ff, #00c2ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ScheduleIcon sx={{ color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Conflicts Resolved
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {metrics?.conflictResolutions}
                  </Typography>
                  <Chip
                    label="98% success rate"
                    size="small"
                    sx={{ mt: 1, bgcolor: 'rgba(40, 167, 69, 0.1)', color: '#28A745' }}
                  />
                </Box>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #00c2ff, #00f2ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircleIcon sx={{ color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    System Health
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {metrics?.systemHealth}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics?.systemHealth || 0}
                    sx={{
                      mt: 1,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(0, 0, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getHealthColor(metrics?.systemHealth || 0),
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${getHealthColor(metrics?.systemHealth || 0)}, ${getHealthColor(metrics?.systemHealth || 0)}99)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HealthIcon sx={{ color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Constraint Distribution */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Constraint Distribution
                </Typography>
                <IconButton size="small" onClick={handleMenuOpen}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={constraintStats}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.type}: ${entry.percentage}%`}
                  >
                    {constraintStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Chart */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  System Performance (24h)
                </Typography>
                <Box display="flex" gap={2}>
                  <Chip 
                    label={`Avg: ${metrics?.apiResponseTime}ms`} 
                    size="small"
                    color="primary"
                  />
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066cc" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0066cc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#0066cc" 
                    fillOpacity={1} 
                    fill="url(#colorResponse)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Constraint Types */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Constraint Types
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {constraintStats.map((stat, index) => (
                  <Box key={index}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2">{stat.type}</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight={600}>
                          {stat.count}
                        </Typography>
                        {getTrendIcon(stat.trend)}
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stat.percentage}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(0, 0, 0, 0.08)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: COLORS[index % COLORS.length],
                          borderRadius: 3
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Activity
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/audit-log')}
                >
                  View All
                </Button>
              </Box>
              <Box display="flex" flexDirection="column" gap={2}>
                {recentActivity.map((activity) => (
                  <Box 
                    key={activity.id}
                    display="flex" 
                    alignItems="center" 
                    gap={2}
                    p={2}
                    borderRadius={2}
                    bgcolor="rgba(0, 0, 0, 0.02)"
                  >
                    <Box 
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'rgba(0, 102, 204, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Box>
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={600}>
                        {activity.user} {activity.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.target} • {new Date(activity.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<HealthIcon />}
                    onClick={() => navigate('/admin/system-health')}
                    sx={{ py: 1.5 }}
                  >
                    System Health
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate('/admin/users')}
                    sx={{ py: 1.5 }}
                  >
                    User Management
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={() => navigate('/admin/audit-log')}
                    sx={{ py: 1.5 }}
                  >
                    Audit Log
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AnalyticsIcon />}
                    onClick={() => navigate('/admin/analytics')}
                    sx={{ py: 1.5 }}
                  >
                    Analytics
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleExport}>Export as PDF</MenuItem>
        <MenuItem onClick={handleExport}>Export as CSV</MenuItem>
        <MenuItem onClick={() => { setAutoRefresh(!autoRefresh); handleMenuClose(); }}>
          {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ConstraintDashboard;