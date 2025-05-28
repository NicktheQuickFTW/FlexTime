import React, { useState, useEffect } from 'react';
import { Chart } from 'react-chartjs-2';
import { 
  Card, CardContent, CardHeader, Grid, Typography, 
  Divider, Button, Chip, List, ListItem, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from './ui/elements';

/**
 * Advanced Metrics Dashboard Component
 * 
 * Displays comprehensive metrics and visualizations for schedule performance
 * across multiple dimensions.
 */
const AdvancedMetricsDashboard = ({ scheduleId, onRecommendationSelect }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Fetch metrics data
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/metrics/advanced/${scheduleId}?includeBaseMetrics=true&includePredictive=true`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }
        
        const data = await response.json();
        setMetrics(data.metrics);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (scheduleId) {
      fetchMetrics();
    }
  }, [scheduleId]);

  // Handle loading and error states
  if (loading) return <div>Loading advanced metrics...</div>;
  if (error) return <div>Error loading metrics: {error}</div>;
  if (!metrics) return <div>No metrics data available</div>;

  // Extract composite scores for display
  const compositeScores = metrics.compositeScores || {};

  // Helper function to render score component
  const renderScoreCard = (title, score) => {
    if (!score || typeof score !== 'object') return null;

    // Determine color based on score
    let color = '#f44336'; // red
    if (score.score >= 80) color = '#4caf50'; // green
    else if (score.score >= 60) color = '#ff9800'; // orange

    return (
      <Card>
        <CardHeader title={title.replace(/([A-Z])/g, ' $1').trim()} />
        <CardContent>
          <Box 
            sx={{ 
              position: 'relative', 
              height: '120px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <Box 
              sx={{ 
                position: 'absolute', 
                width: `${score.score}%`, 
                height: '20px', 
                backgroundColor: color,
                borderRadius: '10px'
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                position: 'absolute', 
                top: '40px',
                fontWeight: 'bold'
              }}
            >
              {score.score}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                position: 'absolute',
                top: '80px',
                fontWeight: 'medium'
              }}
            >
              {score.category}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Helper function to render recommendations
  const renderRecommendations = () => {
    const recommendations = metrics.recommendations || [];
    
    if (recommendations.length === 0) {
      return <Typography>No recommendations available</Typography>;
    }
    
    return (
      <List>
        {recommendations.map((rec, index) => (
          <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2, p: 2, borderRadius: '4px', bgcolor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ flex: 1 }}>
                {rec.recommendation}
              </Typography>
              <Chip 
                label={rec.impact.toUpperCase()} 
                color={
                  rec.impact === 'high' ? 'error' :
                  rec.impact === 'medium' ? 'warning' : 'info'
                } 
                sx={{ ml: 2 }}
              />
            </Box>
            <Typography variant="body2" color="textSecondary">
              {rec.details}
            </Typography>
            <Box sx={{ width: '100%', mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onRecommendationSelect && onRecommendationSelect(rec)}
              >
                Apply Recommendation
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>
    );
  };

  // Helper function to render predictive outcomes
  const renderPredictiveOutcomes = () => {
    const outcomes = metrics.predictiveOutcomes || {};
    
    if (Object.keys(outcomes).length === 0) {
      return <Typography>No predictive outcomes available</Typography>;
    }
    
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Prediction</TableCell>
              <TableCell>Key Factors</TableCell>
              <TableCell>Confidence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(outcomes).map(([category, outcome]) => (
              <TableRow key={category}>
                <TableCell component="th" scope="row">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TableCell>
                <TableCell>
                  {Object.entries(outcome)
                    .filter(([key]) => !['keyFactors', 'confidence'].includes(key))
                    .map(([key, value]) => (
                      <Typography key={key} variant="body2">
                        <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value}
                      </Typography>
                    ))}
                </TableCell>
                <TableCell>
                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                    {outcome.keyFactors?.map((factor, i) => (
                      <li key={i}>
                        <Typography variant="body2">{factor}</Typography>
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>{outcome.confidence}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Helper function to render breakdown of composite scores
  const renderScoreBreakdown = (scoreKey) => {
    const score = compositeScores[scoreKey];
    if (!score || !score.breakdown) return null;
    
    const breakdown = score.breakdown;
    
    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader title={`${scoreKey.replace(/([A-Z])/g, ' $1').trim()} Breakdown`} />
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Component</TableCell>
                  <TableCell align="right">Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(breakdown).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                    <TableCell align="right">
                      {typeof value === 'number' ? 
                        (value > 1 ? value.toFixed(1) : (value * 100).toFixed(1) + '%') : 
                        value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Render tabs
  const renderTabs = () => {
    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'recommendations', label: 'Recommendations' },
      { id: 'predictive', label: 'Predictive Outcomes' },
      { id: 'details', label: 'Detailed Metrics' }
    ];
    
    return (
      <Box sx={{ display: 'flex', mb: 3, borderBottom: '1px solid #ddd' }}>
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'contained' : 'text'}
            onClick={() => setActiveTab(tab.id)}
            sx={{ mx: 1 }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <Typography variant="h5" gutterBottom>
              Composite Success Metrics
            </Typography>
            <Grid container spacing={3}>
              {Object.keys(compositeScores).map(key => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  {renderScoreCard(key, compositeScores[key])}
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                Top 3 Recommendations
              </Typography>
              <List>
                {(metrics.recommendations || []).slice(0, 3).map((rec, index) => (
                  <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2, p: 2, borderRadius: '4px', bgcolor: '#f5f5f5' }}>
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ flex: 1 }}>
                        {rec.recommendation}
                      </Typography>
                      <Chip 
                        label={rec.impact.toUpperCase()} 
                        color={
                          rec.impact === 'high' ? 'error' :
                          rec.impact === 'medium' ? 'warning' : 'info'
                        } 
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {rec.details}
                    </Typography>
                  </ListItem>
                ))}
              </List>
              <Button variant="outlined" onClick={() => setActiveTab('recommendations')}>
                View All Recommendations
              </Button>
            </Box>
          </>
        );
        
      case 'recommendations':
        return (
          <>
            <Typography variant="h5" gutterBottom>
              Schedule Improvement Recommendations
            </Typography>
            {renderRecommendations()}
          </>
        );
        
      case 'predictive':
        return (
          <>
            <Typography variant="h5" gutterBottom>
              Predictive Outcomes
            </Typography>
            {renderPredictiveOutcomes()}
          </>
        );
        
      case 'details':
        return (
          <>
            <Typography variant="h5" gutterBottom>
              Detailed Metrics Breakdown
            </Typography>
            
            {Object.keys(compositeScores).map(key => (
              <Box key={key} sx={{ mb: 4 }}>
                {renderScoreBreakdown(key)}
              </Box>
            ))}
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Advanced Schedule Metrics
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {metrics.scheduleName} ({metrics.sport} {metrics.season})
      </Typography>
      
      <Divider sx={{ my: 3 }} />
      
      {renderTabs()}
      {renderTabContent()}
    </div>
  );
};

export default AdvancedMetricsDashboard;