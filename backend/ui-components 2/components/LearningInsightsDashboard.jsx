/**
 * Context7 Learning Insights Dashboard
 * 
 * This component renders a dashboard for visualizing learning insights and 
 * analytics from the Context7 adaptive learning system.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, Card, CardContent, Typography, Grid, Divider, 
  CircularProgress, Tab, Tabs, Paper, Button
} from '@mui/material';
import {
  Timeline, LineChart, Line, BarChart, Bar, PieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart, Scatter, ScatterChart, ZAxis
} from 'recharts';
import { 
  blue, red, green, orange, purple, teal, amber, 
  grey, indigo, deepPurple, lightBlue, pink 
} from '@mui/material/colors';

// Array of colors for charts
const CHART_COLORS = [
  blue[500], red[500], green[500], orange[500], purple[500], 
  teal[500], amber[500], indigo[500], deepPurple[500], lightBlue[500]
];

// Key metrics to monitor and their descriptions
const KEY_METRICS = {
  recommendationAcceptanceRate: 'Percentage of recommendations accepted by users',
  averageFeedbackScore: 'Average rating given to recommendations',
  patternDetectionAccuracy: 'Accuracy of detected patterns',
  conflictResolutionSuccess: 'Percentage of conflicts successfully resolved',
  learningRate: 'Rate at which the system is improving over time',
  userSatisfaction: 'Overall user satisfaction with recommendations'
};

/**
 * Format date for display
 * 
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return dateString;
  }
};

/**
 * Format percentage for display
 * 
 * @param {number} value - Value between 0 and 1
 * @returns {string} Formatted percentage
 */
const formatPercentage = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Learning Insights Dashboard Component
 */
const LearningInsightsDashboard = ({
  insights,
  feedbackStats,
  learningProgress,
  metricsHistory,
  loading,
  onTimeRangeChange,
  onExportData
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Loading learning insights...
        </Typography>
      </Box>
    );
  }
  
  // Render no data state
  if (!insights || !feedbackStats) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" align="center" gutterBottom>
            No learning insights available
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            The system has not collected enough data to generate insights.
            As users interact with recommendations, data will be gathered and analyzed.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  // Prepare data for overview metrics
  const overviewMetrics = [
    {
      label: 'Recommendation Acceptance',
      value: insights.recommendationAcceptanceRate || 0,
      format: formatPercentage,
      description: 'The percentage of recommendations accepted by users',
      color: blue[500]
    },
    {
      label: 'Average Feedback Score',
      value: feedbackStats.averageRating || 0,
      format: (val) => val.toFixed(1),
      description: 'Average rating out of 5 given by users',
      color: green[500]
    },
    {
      label: 'Pattern Detection Accuracy',
      value: insights.patternDetectionAccuracy || 0,
      format: formatPercentage,
      description: 'Accuracy of pattern detection based on feedback',
      color: purple[500]
    },
    {
      label: 'Learning Efficiency',
      value: insights.learningEfficiency || 0,
      format: formatPercentage,
      description: 'How efficiently the system is learning from feedback',
      color: orange[500]
    }
  ];
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Learning Insights Dashboard
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Context7 adaptive learning system analytics and insights
        </Typography>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" value="overview" />
          <Tab label="Feedback Analysis" value="feedback" />
          <Tab label="Learning Progress" value="learning" />
          <Tab label="Trends" value="trends" />
        </Tabs>
        
        <Box>
          <Button 
            variant={timeRange === '7d' ? 'contained' : 'outlined'} 
            size="small" 
            sx={{ mr: 1 }}
            onClick={() => handleTimeRangeChange('7d')}
          >
            7d
          </Button>
          <Button 
            variant={timeRange === '30d' ? 'contained' : 'outlined'} 
            size="small" 
            sx={{ mr: 1 }}
            onClick={() => handleTimeRangeChange('30d')}
          >
            30d
          </Button>
          <Button 
            variant={timeRange === 'all' ? 'contained' : 'outlined'} 
            size="small"
            onClick={() => handleTimeRangeChange('all')}
          >
            All
          </Button>
        </Box>
      </Box>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {overviewMetrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      {metric.label}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ color: metric.color }}>
                      {metric.format(metric.value)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {metric.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Learning Progress Over Time
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={metricsHistory || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                        />
                        <YAxis 
                          yAxisId="left"
                          tickFormatter={formatPercentage} 
                          domain={[0, 1]}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          domain={[0, 5]}
                        />
                        <Tooltip formatter={(value, name) => {
                          if (name === 'averageFeedbackScore') return [value.toFixed(1), 'Avg Feedback'];
                          return [formatPercentage(value), name];
                        }} />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="recommendationAcceptanceRate"
                          name="Recommendation Acceptance"
                          stroke={blue[500]}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="patternDetectionAccuracy"
                          name="Pattern Detection Accuracy"
                          stroke={purple[500]}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="averageFeedbackScore"
                          name="Avg Feedback Score"
                          stroke={green[500]}
                          activeDot={{ r:-8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recommendation Types Acceptance
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={feedbackStats.byRecommendationType || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="acceptanceRate"
                          nameKey="type"
                          label={({ type, acceptanceRate }) => `${type}: ${formatPercentage(acceptanceRate)}`}
                        >
                          {feedbackStats.byRecommendationType?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatPercentage(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key Areas of Improvement
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {insights.improvementAreas?.map((area, index) => (
                      <Paper 
                        key={index}
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          mb: 2, 
                          borderLeft: `4px solid ${CHART_COLORS[index % CHART_COLORS.length]}`
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom>
                          {area.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {area.description}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" color="textSecondary" sx={{ mr: 1 }}>
                            Improvement Potential:
                          </Typography>
                          <Box
                            sx={{
                              width: 100,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: grey[200],
                              position: 'relative',
                              overflow: 'hidden',
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${area.potentialImpact * 100}%`,
                                bgcolor: CHART_COLORS[index % CHART_COLORS.length],
                                borderRadius: 3
                              }
                            }}
                          />
                          <Typography variant="caption" sx={{ ml: 1 }}>
                            {formatPercentage(area.potentialImpact)}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      
      {/* Feedback Analysis Tab */}
      {activeTab === 'feedback' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Feedback Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={feedbackStats.ratingDistribution || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        name="Number of Ratings" 
                        fill={blue[500]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Feedback Over Time
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={feedbackStats.ratingTrend || []}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="averageRating"
                        name="Average Rating"
                        stroke={green[500]}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Feedback by Recommendation Type
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={feedbackStats.byRecommendationType || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis yAxisId="left" orientation="left" tickFormatter={formatPercentage} domain={[0, 1]} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="acceptanceRate" 
                        name="Acceptance Rate" 
                        fill={blue[500]} 
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="averageRating" 
                        name="Average Rating" 
                        fill={green[500]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Common Feedback Themes
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {feedbackStats.commonThemes?.map((theme, index) => (
                    <Paper 
                      key={index}
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        borderLeft: `4px solid ${CHART_COLORS[index % CHART_COLORS.length]}`
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle1" gutterBottom>
                            {theme.theme}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {theme.description}
                          </Typography>
                        </Box>
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="h6" sx={{ color: theme.sentiment === 'positive' ? green[500] : theme.sentiment === 'negative' ? red[500] : blue[500] }}>
                            {formatPercentage(theme.frequency)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            of feedback
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Learning Progress Tab */}
      {activeTab === 'learning' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Learning Curve
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={learningProgress?.curve || []}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="iteration" />
                      <YAxis tickFormatter={formatPercentage} domain={[0, 1]} />
                      <Tooltip formatter={(value) => [formatPercentage(value), 'Performance']} />
                      <Area 
                        type="monotone" 
                        dataKey="performance" 
                        stroke={blue[700]} 
                        fill={blue[100]} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Feature Importance
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={learningProgress?.featureImportance?.slice().sort((a, b) => b.importance - a.importance) || []}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 1]} tickFormatter={formatPercentage} />
                      <YAxis type="category" dataKey="feature" width={100} />
                      <Tooltip formatter={(value) => [formatPercentage(value), 'Importance']} />
                      <Bar 
                        dataKey="importance" 
                        fill={purple[500]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Adaptation Effectiveness
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={learningProgress?.adaptation || []}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis 
                        tickFormatter={formatPercentage}
                        domain={[0, 1]}
                      />
                      <Tooltip formatter={(value, name) => {
                        return [formatPercentage(value), name];
                      }} />
                      <Legend />
                      {['recommendationQuality', 'adaptationRate', 'userSatisfaction', 'systemAccuracy'].map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={CHART_COLORS[index % CHART_COLORS.length]}
                          activeDot={{ r: 8 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics Trends
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 10, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="userSatisfaction" 
                        type="number" 
                        name="User Satisfaction" 
                        domain={[0, 1]}
                        tickFormatter={formatPercentage}
                      />
                      <YAxis 
                        dataKey="recommendationAcceptanceRate" 
                        type="number" 
                        name="Acceptance Rate"
                        domain={[0, 1]}
                        tickFormatter={formatPercentage}
                      />
                      <ZAxis 
                        dataKey="patternDetectionAccuracy" 
                        range={[40, 400]} 
                        name="Pattern Detection Accuracy" 
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          return [formatPercentage(value), name];
                        }}
                        cursor={{ strokeDasharray: '3 3' }}
                      />
                      <Legend />
                      <Scatter 
                        name="Performance Metrics"
                        data={metricsHistory || []} 
                        fill={blue[500]}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance by Sport Type
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={insights.sportTypePerformance || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sportType" />
                      <YAxis tickFormatter={formatPercentage} domain={[0, 1]} />
                      <Tooltip formatter={(value) => [formatPercentage(value), 'Performance']} />
                      <Legend />
                      <Bar 
                        dataKey="recommendationAcceptance" 
                        name="Recommendation Acceptance" 
                        fill={blue[500]} 
                      />
                      <Bar 
                        dataKey="userSatisfaction" 
                        name="User Satisfaction" 
                        fill={green[500]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pattern Detection by Accuracy
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={insights.patternAccuracyTrend || []}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis 
                        tickFormatter={formatPercentage}
                        domain={[0, 1]}
                      />
                      <Tooltip formatter={(value) => [formatPercentage(value), 'Accuracy']} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="scheduling"
                        stroke={blue[500]}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="attendance"
                        stroke={green[500]}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="performance"
                        stroke={purple[500]}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {onExportData && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            onClick={onExportData}
          >
            Export Analytics Data
          </Button>
        </Box>
      )}
    </Box>
  );
};

LearningInsightsDashboard.propTypes = {
  insights: PropTypes.object,
  feedbackStats: PropTypes.object,
  learningProgress: PropTypes.object,
  metricsHistory: PropTypes.array,
  loading: PropTypes.bool,
  onTimeRangeChange: PropTypes.func,
  onExportData: PropTypes.func
};

LearningInsightsDashboard.defaultProps = {
  loading: false,
  metricsHistory: []
};

export default LearningInsightsDashboard;
