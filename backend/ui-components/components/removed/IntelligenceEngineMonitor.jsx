import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  CircularProgress, 
  Alert, 
  Chip,
  Button,
  Paper,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Memory, 
  CheckCircle, 
  Error, 
  Warning, 
  Refresh, 
  Storage, 
  CloudQueue,
  Timeline,
  BarChart,
  Speed
} from '@mui/icons-material';

/**
 * Component to monitor the Intelligence Engine status and performance
 */
const IntelligenceEngineMonitor = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/intelligence-engine/status');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Cleanup function
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh]);

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
  };

  const getStatusColor = (isConnected) => {
    return isConnected ? 'success' : 'error';
  };

  const getStatusIcon = (isConnected) => {
    return isConnected ? <CheckCircle /> : <Error />;
  };

  const getMemoryUsagePercentage = (used, total) => {
    if (!used || !total) return 0;
    return (used / total) * 100;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Memory color="primary" />
            <Typography variant="h5" component="h2" ml={1}>
              Intelligence Engine Monitor
            </Typography>
          </Box>
          <Box>
            <Tooltip title="Refresh Status">
              <IconButton onClick={fetchStatus} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button 
              variant={autoRefresh ? "contained" : "outlined"} 
              color={autoRefresh ? "primary" : "inherit"}
              onClick={toggleAutoRefresh}
              size="small"
              sx={{ ml: 1 }}
            >
              {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
            </Button>
          </Box>
        </Box>
        
        {loading && !status ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error && !status ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Main Status */}
            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Connection Status
                </Typography>
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={2}>
                  <Chip 
                    icon={status?.success ? <CheckCircle /> : <Error />}
                    label={status?.success ? "Connected" : "Disconnected"}
                    color={status?.success ? "success" : "error"}
                    variant="outlined"
                    sx={{ mb: 2, fontSize: '1.1rem', py: 2, px: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Version: {status?.version || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Uptime: {formatUptime(status?.uptime)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            {/* Database Connections */}
            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Database Connections
                </Typography>
                <Box mt={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Storage color={getStatusColor(status?.connections?.mongodb)} sx={{ mr: 1 }} />
                        <Typography variant="body1">MongoDB</Typography>
                      </Box>
                      <Chip 
                        label={status?.connections?.mongodb ? "Connected" : "Disconnected"}
                        color={getStatusColor(status?.connections?.mongodb)}
                        size="small"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <CloudQueue color={getStatusColor(status?.connections?.redis)} sx={{ mr: 1 }} />
                        <Typography variant="body1">Redis</Typography>
                      </Box>
                      <Chip 
                        label={status?.connections?.redis ? "Connected" : "Disconnected"}
                        color={getStatusColor(status?.connections?.redis)}
                        size="small"
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
            
            {/* API Usage */}
            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  API Usage
                </Typography>
                <Box mt={2}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Requests Today</Typography>
                      <Typography variant="h4">{status?.stats?.requestsToday || 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Total Requests</Typography>
                      <Typography variant="h4">{status?.stats?.totalRequests || 0}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
            
            {/* Experience Stats */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Experience Storage
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box mb={1}>
                      <Typography variant="body2" color="textSecondary">Total Experiences</Typography>
                      <Typography variant="h4">{status?.stats?.experienceCount || 0}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box mb={1}>
                      <Typography variant="body2" color="textSecondary">By Type</Typography>
                      {status?.stats?.experiencesByType ? (
                        Object.entries(status.stats.experiencesByType).map(([type, count]) => (
                          <Box key={type} display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="body2">
                              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                            <Chip label={count} size="small" />
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2">No data available</Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* Performance Metrics */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box mb={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">Memory Usage</Typography>
                        <Typography variant="body2">
                          {status?.stats?.memoryUsed ? `${(status.stats.memoryUsed / 1024 / 1024).toFixed(2)} MB / 
                                                        ${(status.stats.memoryTotal / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={getMemoryUsagePercentage(status?.stats?.memoryUsed, status?.stats?.memoryTotal)}
                        sx={{ mt: 1, mb: 2 }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Speed color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="body2" color="textSecondary">Avg Response Time</Typography>
                        <Typography variant="body1">{status?.stats?.avgResponseTime ? `${status.stats.avgResponseTime.toFixed(2)} ms` : 'N/A'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Timeline color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="body2" color="textSecondary">Active Connections</Typography>
                        <Typography variant="body1">{status?.stats?.activeConnections || 0}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {lastUpdated && (
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Typography variant="caption" color="textSecondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default IntelligenceEngineMonitor;
