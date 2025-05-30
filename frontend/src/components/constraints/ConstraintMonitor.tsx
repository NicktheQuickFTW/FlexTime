import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Stack,
  Button,
  Badge,
  Divider,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Constraint, ConstraintType, ConstraintCategory } from '../../types';

interface ConstraintMonitorProps {
  scheduleId: number;
  constraints: Constraint[];
}

interface ConstraintMetrics {
  totalConstraints: number;
  activeConstraints: number;
  satisfiedConstraints: number;
  violatedConstraints: number;
  partiallyMetConstraints: number;
  averageSatisfactionRate: number;
  performanceScore: number;
  lastUpdated: string;
}

interface ConstraintStatus {
  constraintId: number;
  status: 'satisfied' | 'violated' | 'partial' | 'pending';
  satisfactionRate: number;
  violations: number;
  lastChecked: string;
  message?: string;
}

interface PerformanceData {
  timestamp: string;
  satisfactionRate: number;
  violations: number;
  processingTime: number;
}

const ConstraintMonitor: React.FC<ConstraintMonitorProps> = ({
  scheduleId,
  constraints
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<ConstraintMetrics>({
    totalConstraints: 0,
    activeConstraints: 0,
    satisfiedConstraints: 0,
    violatedConstraints: 0,
    partiallyMetConstraints: 0,
    averageSatisfactionRate: 0,
    performanceScore: 0,
    lastUpdated: new Date().toISOString()
  });
  const [constraintStatuses, setConstraintStatuses] = useState<ConstraintStatus[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    initializeMonitoring();
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [constraints]);

  const initializeMonitoring = async () => {
    setLoading(true);
    await updateMetrics();
    generateMockPerformanceHistory();
    setLoading(false);
  };

  const updateMetrics = async () => {
    setRefreshing(true);
    
    // Simulate fetching constraint statuses
    const statuses = constraints.map(constraint => {
      const random = Math.random();
      let status: ConstraintStatus['status'];
      let satisfactionRate: number;
      
      if (random > 0.8) {
        status = 'violated';
        satisfactionRate = Math.random() * 0.5;
      } else if (random > 0.6) {
        status = 'partial';
        satisfactionRate = 0.5 + Math.random() * 0.3;
      } else {
        status = 'satisfied';
        satisfactionRate = 0.8 + Math.random() * 0.2;
      }

      return {
        constraintId: constraint.constraint_id!,
        status,
        satisfactionRate,
        violations: status === 'violated' ? Math.floor(Math.random() * 5) + 1 : 0,
        lastChecked: new Date().toISOString(),
        message: status === 'violated' ? 'Constraint cannot be satisfied with current schedule' : undefined
      };
    });

    setConstraintStatuses(statuses);

    // Calculate metrics
    const satisfied = statuses.filter(s => s.status === 'satisfied').length;
    const violated = statuses.filter(s => s.status === 'violated').length;
    const partial = statuses.filter(s => s.status === 'partial').length;
    const avgSatisfaction = statuses.reduce((acc, s) => acc + s.satisfactionRate, 0) / statuses.length;

    setMetrics({
      totalConstraints: constraints.length,
      activeConstraints: constraints.length,
      satisfiedConstraints: satisfied,
      violatedConstraints: violated,
      partiallyMetConstraints: partial,
      averageSatisfactionRate: avgSatisfaction,
      performanceScore: calculatePerformanceScore(avgSatisfaction, violated),
      lastUpdated: new Date().toISOString()
    });

    // Add to performance history
    setPerformanceHistory(prev => [
      ...prev.slice(-100), // Keep last 100 data points
      {
        timestamp: new Date().toISOString(),
        satisfactionRate: avgSatisfaction,
        violations: violated,
        processingTime: Math.random() * 50 + 10
      }
    ]);

    setRefreshing(false);
  };

  const calculatePerformanceScore = (satisfactionRate: number, violations: number): number => {
    const violationPenalty = violations * 0.1;
    return Math.max(0, Math.min(100, satisfactionRate * 100 - violationPenalty * 10));
  };

  const generateMockPerformanceHistory = () => {
    const history: PerformanceData[] = [];
    const now = new Date();
    
    for (let i = 24; i > 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      history.push({
        timestamp: timestamp.toISOString(),
        satisfactionRate: 0.7 + Math.random() * 0.3,
        violations: Math.floor(Math.random() * 5),
        processingTime: Math.random() * 50 + 10
      });
    }
    
    setPerformanceHistory(history);
  };

  const getStatusColor = (status: ConstraintStatus['status']) => {
    switch (status) {
      case 'satisfied': return theme.palette.success.main;
      case 'violated': return theme.palette.error.main;
      case 'partial': return theme.palette.warning.main;
      case 'pending': return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: ConstraintStatus['status']) => {
    switch (status) {
      case 'satisfied': return <CheckCircleIcon />;
      case 'violated': return <ErrorIcon />;
      case 'partial': return <WarningIcon />;
      case 'pending': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  const getConstraintById = (id: number) => {
    return constraints.find(c => c.constraint_id === id);
  };

  const formatConstraintType = (type: ConstraintType): string => {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  };

  // Prepare data for charts
  const categoryData = Object.values(ConstraintCategory).map(category => ({
    name: category,
    count: constraints.filter(c => c.category === category).length,
    satisfied: constraintStatuses.filter(s => {
      const constraint = getConstraintById(s.constraintId);
      return constraint?.category === category && s.status === 'satisfied';
    }).length
  }));

  const priorityData = [
    { name: 'High (8-10)', value: constraints.filter(c => c.priority >= 8).length },
    { name: 'Medium (5-7)', value: constraints.filter(c => c.priority >= 5 && c.priority < 8).length },
    { name: 'Low (1-4)', value: constraints.filter(c => c.priority < 5).length }
  ];

  const COLORS = [theme.palette.error.main, theme.palette.warning.main, theme.palette.success.main];

  const radarData = Object.values(ConstraintType).map(type => {
    const typeConstraints = constraints.filter(c => c.type === type);
    const typeStatuses = constraintStatuses.filter(s => {
      const constraint = getConstraintById(s.constraintId);
      return constraint?.type === type;
    });
    
    return {
      type: formatConstraintType(type).split(' ').slice(0, 2).join(' '),
      satisfaction: typeStatuses.length > 0 
        ? (typeStatuses.reduce((acc, s) => acc + s.satisfactionRate, 0) / typeStatuses.length) * 100
        : 0
    };
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Constraint Monitoring Dashboard</Typography>
        <Button
          startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={updateMetrics}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4">
                    {metrics.performanceScore.toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Performance Score
                  </Typography>
                </Box>
                <SpeedIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={metrics.performanceScore}
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
                color={metrics.performanceScore > 80 ? 'success' : metrics.performanceScore > 60 ? 'warning' : 'error'}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4">
                    {(metrics.averageSatisfactionRate * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Satisfaction
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderColor: 'error.main', borderWidth: metrics.violatedConstraints > 0 ? 2 : 0, borderStyle: 'solid' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" color={metrics.violatedConstraints > 0 ? 'error' : 'text.primary'}>
                    {metrics.violatedConstraints}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Violations
                  </Typography>
                </Box>
                <Badge badgeContent={metrics.violatedConstraints} color="error">
                  <ErrorIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />
                </Badge>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4">
                    {metrics.totalConstraints}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Constraints
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Performance Trend
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis yAxisId="left" domain={[0, 1]} />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="satisfactionRate"
                  stroke={theme.palette.success.main}
                  name="Satisfaction Rate"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="violations"
                  stroke={theme.palette.error.main}
                  name="Violations"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Priority Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Category Performance */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Category Performance
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="count" fill={theme.palette.primary.main} name="Total" />
                <Bar dataKey="satisfied" fill={theme.palette.success.main} name="Satisfied" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Constraint Type Satisfaction
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="type" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Satisfaction %"
                  dataKey="satisfaction"
                  stroke={theme.palette.primary.main}
                  fill={theme.palette.primary.main}
                  fillOpacity={0.6}
                />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Status Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Constraint Status Details
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Satisfaction</TableCell>
                <TableCell>Violations</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {constraintStatuses.map((status) => {
                const constraint = getConstraintById(status.constraintId);
                if (!constraint) return null;

                return (
                  <TableRow key={status.constraintId}>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(status.status)}
                        label={status.status}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(status.status),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>{formatConstraintType(constraint.type)}</TableCell>
                    <TableCell>{constraint.category}</TableCell>
                    <TableCell>
                      <Chip
                        label={constraint.priority}
                        size="small"
                        color={constraint.priority >= 8 ? 'error' : constraint.priority >= 5 ? 'warning' : 'success'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={status.satisfactionRate * 100}
                          sx={{ width: 100, height: 6 }}
                          color={status.satisfactionRate > 0.8 ? 'success' : status.satisfactionRate > 0.5 ? 'warning' : 'error'}
                        />
                        <Typography variant="caption">
                          {(status.satisfactionRate * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {status.violations > 0 && (
                        <Chip
                          label={status.violations}
                          size="small"
                          color="error"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {status.message && (
                        <Tooltip title={status.message}>
                          <InfoIcon fontSize="small" color="action" />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Alert for Critical Issues */}
      {metrics.violatedConstraints > 0 && (
        <Alert severity="error" sx={{ mt: 3 }}>
          <AlertTitle>Constraint Violations Detected</AlertTitle>
          {metrics.violatedConstraints} constraint(s) are currently violated. Review the detailed status table above and consider using the Conflict Resolver to address these issues.
        </Alert>
      )}
    </Box>
  );
};

export default ConstraintMonitor;