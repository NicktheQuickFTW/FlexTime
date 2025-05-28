/**
 * Context7 Pattern Visualizer Component
 * 
 * This component renders detected patterns using interactive visualizations,
 * providing insights into scheduling patterns and recommendations.
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Tooltip, Legend, 
         CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Tabs, Tab, Card, CardContent, Typography, Box, Chip, 
         CircularProgress, Button, Select, MenuItem, FormControl, 
         InputLabel, Grid, Paper, Divider } from '@mui/material';
import { blue, red, green, purple, orange, teal, amber, indigo } from '@mui/material/colors';

// Pattern type to color mapping
const PATTERN_COLORS = {
  scheduling: blue[500],
  attendance: green[500],
  performance: purple[500],
  travel: orange[500],
  venue: teal[500],
  basketball: red[500],
  football: amber[700],
  baseball: indigo[500],
  soccer: green[700],
  hockey: blue[700],
  seasonal: purple[700],
  crossSport: orange[700],
  default: blue[300]
};

// Confidence level thresholds
const CONFIDENCE_THRESHOLDS = {
  high: 0.75,
  medium: 0.5
};

/**
 * Format pattern data for visualization
 * 
 * @param {Array} patterns - Pattern data
 * @param {string} groupBy - Grouping field
 * @returns {Array} Formatted data for charts
 */
const formatPatternData = (patterns, groupBy = 'patternType') => {
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
    return [];
  }
  
  const groupedData = patterns.reduce((acc, pattern) => {
    const key = pattern[groupBy] || 'unknown';
    if (!acc[key]) {
      acc[key] = { name: key, count: 0, patterns: [], avgConfidence: 0 };
    }
    
    acc[key].count += 1;
    acc[key].patterns.push(pattern);
    acc[key].avgConfidence = (acc[key].patterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / acc[key].patterns.length);
    
    return acc;
  }, {});
  
  return Object.values(groupedData).sort((a, b) => b.count - a.count);
};

/**
 * Pattern Visualizer Component
 */
const PatternVisualizer = ({ 
  patterns, 
  insights,
  loading, 
  onPatternSelect,
  sportFilter,
  onSportFilterChange
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [groupedPatterns, setGroupedPatterns] = useState([]);
  const [filteredPatterns, setFilteredPatterns] = useState([]);
  const [groupBy, setGroupBy] = useState('patternType');
  
  // Chart references for exporting
  const chartRefs = {
    distribution: useRef(null),
    confidence: useRef(null),
    timeline: useRef(null)
  };
  
  // Process and group patterns when data changes
  useEffect(() => {
    if (!patterns || loading) return;
    
    // Apply sport filter if provided
    const filtered = sportFilter 
      ? patterns.filter(p => p.sportType === sportFilter || p.patternType === sportFilter)
      : patterns;
    
    setFilteredPatterns(filtered);
    setGroupedPatterns(formatPatternData(filtered, groupBy));
  }, [patterns, sportFilter, groupBy, loading]);
  
  // Handle pattern selection
  const handlePatternClick = (pattern) => {
    if (onPatternSelect && typeof onPatternSelect === 'function') {
      onPatternSelect(pattern);
    }
  };
  
  // Handle grouping change
  const handleGroupingChange = (event) => {
    setGroupBy(event.target.value);
  };
  
  // Handle sport filter change
  const handleSportFilterChange = (event) => {
    if (onSportFilterChange && typeof onSportFilterChange === 'function') {
      onSportFilterChange(event.target.value);
    }
  };
  
  // Get a color for a pattern type
  const getPatternColor = (type) => {
    return PATTERN_COLORS[type] || PATTERN_COLORS.default;
  };
  
  // Get confidence level label
  const getConfidenceLevel = (confidence) => {
    if (confidence >= CONFIDENCE_THRESHOLDS.high) return 'High';
    if (confidence >= CONFIDENCE_THRESHOLDS.medium) return 'Medium';
    return 'Low';
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Loading pattern data...
        </Typography>
      </Box>
    );
  }
  
  // Render empty state
  if (!patterns || patterns.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" color="textSecondary" align="center">
            No pattern data available
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            Try adjusting your filters or wait for more data to be collected.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Pattern Analysis
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="pattern-group-label">Group By</InputLabel>
            <Select
              labelId="pattern-group-label"
              value={groupBy}
              label="Group By"
              onChange={handleGroupingChange}
            >
              <MenuItem value="patternType">Pattern Type</MenuItem>
              <MenuItem value="sportType">Sport Type</MenuItem>
              <MenuItem value="source">Pattern Source</MenuItem>
            </Select>
          </FormControl>
          
          {onSportFilterChange && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="sport-filter-label">Sport Filter</InputLabel>
              <Select
                labelId="sport-filter-label"
                value={sportFilter || ''}
                label="Sport Filter"
                onChange={handleSportFilterChange}
              >
                <MenuItem value="">All Sports</MenuItem>
                <MenuItem value="basketball">Basketball</MenuItem>
                <MenuItem value="football">Football</MenuItem>
                <MenuItem value="baseball">Baseball</MenuItem>
                <MenuItem value="soccer">Soccer</MenuItem>
                <MenuItem value="hockey">Hockey</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>
      
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 2 }}
      >
        <Tab label="Overview" value="overview" />
        <Tab label="Pattern Distribution" value="distribution" />
        <Tab label="Confidence Levels" value="confidence" />
        <Tab label="Pattern Timeline" value="timeline" />
        <Tab label="Insights" value="insights" />
      </Tabs>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pattern Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Patterns:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {filteredPatterns.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Average Confidence:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {(filteredPatterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / 
                      (filteredPatterns.length || 1)).toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Pattern Types:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {new Set(filteredPatterns.map(p => p.patternType)).size}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Top Pattern Categories
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {groupedPatterns.slice(0, 5).map((group) => (
                    <Chip 
                      key={group.name}
                      label={`${group.name} (${group.count})`}
                      style={{ backgroundColor: getPatternColor(group.name), color: '#fff' }}
                      size="small"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pattern Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart ref={chartRefs.distribution}>
                    <Pie
                      data={groupedPatterns}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.name}: ${entry.count}`}
                    >
                      {groupedPatterns.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPatternColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} patterns`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Patterns
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {filteredPatterns
                    .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt))
                    .slice(0, 5)
                    .map((pattern, index) => (
                      <Paper 
                        key={pattern.id || index}
                        elevation={0}
                        variant="outlined"
                        sx={{ 
                          p: 2, 
                          mb: 1,
                          borderLeft: `4px solid ${getPatternColor(pattern.patternType)}`,
                          cursor: 'pointer'
                        }}
                        onClick={() => handlePatternClick(pattern)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle1">
                              {pattern.name || `Pattern #${pattern.id || index + 1}`}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {pattern.description || 'No description available'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Chip 
                              label={`${(pattern.confidence * 100).toFixed(0)}%`}
                              size="small"
                              color={pattern.confidence > 0.7 ? 'success' : pattern.confidence > 0.5 ? 'warning' : 'error'}
                              variant="outlined"
                            />
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                              {new Date(pattern.detectedAt).toLocaleDateString()}
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
      
      {/* Pattern Distribution Tab */}
      {activeTab === 'distribution' && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pattern Type Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={groupedPatterns} ref={chartRefs.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="Number of Patterns" 
                  isAnimationActive={false}
                >
                  {groupedPatterns.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPatternColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Confidence Levels Tab */}
      {activeTab === 'confidence' && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Confidence Levels by Pattern Type
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={groupedPatterns} ref={chartRefs.confidence}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 1]} tickFormatter={(value) => `${value * 100}%`} />
                <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                <Legend />
                <Bar 
                  dataKey="avgConfidence" 
                  name="Average Confidence" 
                  isAnimationActive={false}
                >
                  {groupedPatterns.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPatternColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Pattern Timeline Tab */}
      {activeTab === 'timeline' && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pattern Detection Timeline
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={
                  // Group patterns by detection date
                  Object.entries(
                    filteredPatterns.reduce((acc, pattern) => {
                      const dateKey = new Date(pattern.detectedAt).toLocaleDateString();
                      if (!acc[dateKey]) {
                        acc[dateKey] = { date: dateKey, count: 0 };
                      }
                      acc[dateKey].count += 1;
                      return acc;
                    }, {})
                  ).map(([, value]) => value)
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                }
                ref={chartRefs.timeline}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Patterns Detected" 
                  stroke={blue[500]} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pattern Insights
            </Typography>
            
            {!insights || Object.keys(insights).length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center">
                No insights available for the current patterns
              </Typography>
            ) : (
              <Box>
                {Object.entries(insights).map(([key, value], index) => (
                  <Paper 
                    key={key}
                    elevation={0}
                    variant="outlined"
                    sx={{ p: 2, mb: 2 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Typography>
                    
                    {typeof value === 'object' ? (
                      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                        {Object.entries(value).map(([subKey, subValue]) => (
                          <li key={subKey}>
                            <Typography variant="body2">
                              <strong>{subKey}:</strong> {
                                typeof subValue === 'object' 
                                  ? JSON.stringify(subValue) 
                                  : subValue
                              }
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography variant="body2">
                        {value}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

PatternVisualizer.propTypes = {
  patterns: PropTypes.array,
  insights: PropTypes.object,
  loading: PropTypes.bool,
  onPatternSelect: PropTypes.func,
  sportFilter: PropTypes.string,
  onSportFilterChange: PropTypes.func
};

PatternVisualizer.defaultProps = {
  patterns: [],
  insights: {},
  loading: false
};

export default PatternVisualizer;
