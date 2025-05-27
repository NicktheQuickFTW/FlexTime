import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress, Alert, Box, Chip, Divider } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LightbulbOutlined, TrendingUp, Feedback, SportsSoccer, SportsTennis, SportsFootball } from '@mui/icons-material';

/**
 * Component to display Intelligence Engine insights for scheduling
 */
const IntelligenceEngineInsights = ({ sportType, conferenceId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/intelligence-engine/insights?sportType=${sportType}${conferenceId ? `&conferenceId=${conferenceId}` : ''}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch insights: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setInsights(data.insights);
        } else {
          throw new Error(data.error || 'Failed to fetch insights');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInsights();
  }, [sportType, conferenceId]);
  
  const getSportIcon = (sport) => {
    switch (sport.toLowerCase()) {
      case 'basketball':
        return <SportsSoccer />;
      case 'tennis':
        return <SportsTennis />;
      case 'football':
        return <SportsFootball />;
      default:
        return <SportsSoccer />;
    }
  };
  
  const prepareOptimizationData = () => {
    if (!insights || !insights.optimization || !insights.optimization.averageImprovement) {
      return [];
    }
    
    const { averageImprovement } = insights.optimization;
    return Object.entries(averageImprovement).map(([key, value]) => ({
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      improvement: value
    }));
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  
  if (!insights) {
    return <Alert severity="info">No insights available for this selection.</Alert>;
  }
  
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        {getSportIcon(sportType)}
        <Typography variant="h5" component="h2" ml={1}>
          Intelligence Engine Insights: {insights.sportType}
          {insights.conferenceId && ` - ${insights.conferenceId}`}
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Schedule Generation Insights */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <LightbulbOutlined color="primary" />
                <Typography variant="h6" component="h3" ml={1}>
                  Schedule Generation
                </Typography>
              </Box>
              
              <Typography variant="body1" gutterBottom>
                <strong>Recommended Algorithm:</strong> {insights.scheduleGeneration?.recommendedAlgorithm || 'N/A'}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Average Quality:</strong> {insights.scheduleGeneration?.averageQuality 
                  ? `${(insights.scheduleGeneration.averageQuality * 100).toFixed(1)}%` 
                  : 'N/A'}
              </Typography>
              
              {insights.scheduleGeneration?.commonIssues && (
                <>
                  <Typography variant="body1" gutterBottom>
                    <strong>Common Issues:</strong>
                  </Typography>
                  <ul>
                    {insights.scheduleGeneration.commonIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Optimization Insights */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp color="primary" />
                <Typography variant="h6" component="h3" ml={1}>
                  Optimization
                </Typography>
              </Box>
              
              <Typography variant="body1" gutterBottom>
                <strong>Most Effective Strategy:</strong> {insights.optimization?.mostEffectiveStrategy || 'N/A'}
              </Typography>
              
              {insights.optimization?.averageImprovement && (
                <Box mt={2} height={200}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Average Improvements:</strong>
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareOptimizationData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: '% Improvement', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="improvement" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Feedback Insights */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Feedback color="primary" />
                <Typography variant="h6" component="h3" ml={1}>
                  User Feedback
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Average Rating:</strong> {insights.feedback?.averageRating 
                      ? insights.feedback.averageRating.toFixed(1) + '/5.0'
                      : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Lowest Rated Metric:</strong> {insights.feedback?.lowestRatedMetric 
                      ? insights.feedback.lowestRatedMetric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                      : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Recommended Focus:</strong>
                  </Typography>
                  {insights.feedback?.recommendedFocus && (
                    <Chip 
                      label={insights.feedback.recommendedFocus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                      color="primary" 
                    />
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default IntelligenceEngineInsights;
