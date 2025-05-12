import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Typography
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  DirectionsCar as CarIcon,
  Balance as BalanceIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { ScheduleService } from '../../services/api';

interface ScheduleMetricsProps {
  scheduleId: number;
}

interface Metrics {
  totalTravelDistance: number;
  averageTravelDistance: number;
  maxTravelDistance: number;
  homeAwayBalance: number;
  constraintViolations: number;
  teamMetrics: Record<string, TeamMetrics>;
}

interface TeamMetrics {
  name: string;
  totalTravelDistance: number;
  homeGames: number;
  awayGames: number;
  consecutiveAwayGames: number;
  consecutiveHomeGames: number;
  restDays: number;
}

const ScheduleMetrics: React.FC<ScheduleMetricsProps> = ({ scheduleId }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ScheduleService.getScheduleMetrics(scheduleId);
      if (response.success && response.data) {
        setMetrics(response.data);
      } else {
        setError(response.error || 'Failed to fetch schedule metrics');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Typography>Unable to load schedule metrics</Typography>
      </Paper>
    );
  }

  // If no metrics data is available yet, show placeholder
  if (!metrics) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No metrics available
        </Typography>
        <Typography color="text.secondary">
          Metrics will be available after schedule optimization or when games are added.
        </Typography>
      </Paper>
    );
  }

  // For demo purposes, let's create some sample metrics data
  // In a real implementation, this would come from the API
  const sampleMetrics: Metrics = {
    totalTravelDistance: 24680,
    averageTravelDistance: 1540,
    maxTravelDistance: 2800,
    homeAwayBalance: 0.92,
    constraintViolations: 2,
    teamMetrics: {
      'Arizona': {
        name: 'University of Arizona',
        totalTravelDistance: 3200,
        homeGames: 8,
        awayGames: 8,
        consecutiveAwayGames: 2,
        consecutiveHomeGames: 3,
        restDays: 4
      },
      'ASU': {
        name: 'Arizona State University',
        totalTravelDistance: 3100,
        homeGames: 9,
        awayGames: 7,
        consecutiveAwayGames: 2,
        consecutiveHomeGames: 2,
        restDays: 5
      },
      'BYU': {
        name: 'BYU',
        totalTravelDistance: 3800,
        homeGames: 8,
        awayGames: 8,
        consecutiveAwayGames: 3,
        consecutiveHomeGames: 2,
        restDays: 3
      },
      'UCF': {
        name: 'UCF',
        totalTravelDistance: 4200,
        homeGames: 7,
        awayGames: 9,
        consecutiveAwayGames: 3,
        consecutiveHomeGames: 2,
        restDays: 4
      }
    }
  };

  // Use sample metrics for now
  const displayMetrics = metrics || sampleMetrics;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Schedule Metrics
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 280px', minWidth: '250px', maxWidth: '300px' }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <CarIcon sx={{ fontSize: 40, mr: 2, color: '#8C1D40' }} />
              <Box>
                <Typography variant="h5" component="div">
                  {displayMetrics.totalTravelDistance.toLocaleString()} mi
                </Typography>
                <Typography color="text.secondary">
                  Total Travel Distance
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 280px', minWidth: '250px', maxWidth: '300px' }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <BalanceIcon sx={{ fontSize: 40, mr: 2, color: '#00A3E0' }} />
              <Box>
                <Typography variant="h5" component="div">
                  {displayMetrics.homeAwayBalance.toFixed(2)}
                </Typography>
                <Typography color="text.secondary">
                  Home/Away Balance
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 280px', minWidth: '250px', maxWidth: '300px' }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <TimelineIcon sx={{ fontSize: 40, mr: 2, color: '#FFC627' }} />
              <Box>
                <Typography variant="h5" component="div">
                  {displayMetrics.averageTravelDistance.toLocaleString()} mi
                </Typography>
                <Typography color="text.secondary">
                  Avg Travel Distance
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 280px', minWidth: '250px', maxWidth: '300px' }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, mr: 2, color: displayMetrics.constraintViolations > 0 ? '#F44336' : '#66BB6A' }} />
              <Box>
                <Typography variant="h5" component="div">
                  {displayMetrics.constraintViolations}
                </Typography>
                <Typography color="text.secondary">
                  Constraint Violations
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Team Metrics */}
      <Typography variant="h6" gutterBottom>
        Team Metrics
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {Object.entries(displayMetrics.teamMetrics).map(([teamId, teamMetric]) => (
          <Box sx={{ flex: '1 1 45%', minWidth: '300px' }} key={teamId}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {teamMetric.name}
              </Typography>
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Travel Distance
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {teamMetric.totalTravelDistance.toLocaleString()} mi
                  </Typography>
                </Box>
                
                <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Home/Away Games
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {teamMetric.homeGames} / {teamMetric.awayGames}
                  </Typography>
                </Box>
                
                <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Max Consecutive Away
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {teamMetric.consecutiveAwayGames}
                  </Typography>
                </Box>
                
                <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Max Consecutive Home
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {teamMetric.consecutiveHomeGames}
                  </Typography>
                </Box>
                
                <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Avg Rest Days
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {teamMetric.restDays}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ScheduleMetrics;
