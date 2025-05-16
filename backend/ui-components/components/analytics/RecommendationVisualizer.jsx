/**
 * Schedule Recommendation Visualizer
 * 
 * This component visualizes schedule recommendations provided by the FlexTime 
 * recommendation engine, allowing users to interact with and apply recommendations.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Card, CardContent, CardActions, Typography, Box, Chip, Button, 
  Accordion, AccordionSummary, AccordionDetails, Divider, Rating,
  Grid, IconButton, LinearProgress, Paper, List, ListItem, 
  ListItemText, ListItemIcon, TextField, Tooltip
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon, 
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Timeline as TimelineIcon,
  Compare as CompareIcon,
  CalendarToday as CalendarIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { blue, green, orange, red, grey } from '@mui/material/colors';

// Styled components for visual elements
const ConfidenceIndicator = styled(Box)(({ theme, value }) => {
  const getColor = () => {
    if (value >= 0.8) return green[500];
    if (value >= 0.6) return blue[500];
    if (value >= 0.4) return orange[500];
    return red[500];
  };
  
  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    '& .indicator': {
      width: '100%',
      height: 8,
      borderRadius: 4,
      backgroundColor: grey[200],
      position: 'relative',
      overflow: 'hidden',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${value * 100}%`,
        backgroundColor: getColor(),
        borderRadius: 4
      }
    }
  };
});

const ChangeIndicator = styled(Chip)(({ theme, changeType }) => {
  const getStyle = () => {
    switch (changeType) {
      case 'move':
        return { backgroundColor: blue[100], color: blue[800] };
      case 'add':
        return { backgroundColor: green[100], color: green[800] };
      case 'remove':
        return { backgroundColor: red[100], color: red[800] };
      case 'swap':
        return { backgroundColor: orange[100], color: orange[800] };
      default:
        return { backgroundColor: grey[100], color: grey[800] };
    }
  };
  
  return { ...getStyle() };
});

/**
 * Recommendation Visualizer Component
 */
const RecommendationVisualizer = ({
  recommendations,
  loading,
  onApplyRecommendation,
  onRateRecommendation,
  onDismissRecommendation,
  currentSchedule,
  sportTypes,
  userPreferences
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [filteredRecs, setFilteredRecs] = useState([]);
  const [feedbackText, setFeedbackText] = useState({});
  const [filters, setFilters] = useState({
    type: 'all',
    minConfidence: 0.5,
    sportType: 'all'
  });
  
  // Filter recommendations based on confidence, type, etc.
  useEffect(() => {
    if (!recommendations || loading) return;
    
    let filtered = [...recommendations];
    
    // Apply minimum confidence filter
    if (filters.minConfidence > 0) {
      filtered = filtered.filter(rec => rec.confidence >= filters.minConfidence);
    }
    
    // Apply recommendation type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(rec => rec.type === filters.type);
    }
    
    // Apply sport type filter
    if (filters.sportType !== 'all') {
      filtered = filtered.filter(rec => rec.sportType === filters.sportType);
    }
    
    // Sort by confidence
    filtered.sort((a, b) => b.confidence - a.confidence);
    
    setFilteredRecs(filtered);
  }, [recommendations, filters, loading]);
  
  // Handle accordion expansion
  const handleAccordionChange = (id) => (event, isExpanded) => {
    setExpandedId(isExpanded ? id : null);
  };
  
  // Handle applying a recommendation
  const handleApply = (recommendation) => {
    if (onApplyRecommendation && typeof onApplyRecommendation === 'function') {
      onApplyRecommendation(recommendation);
    }
  };
  
  // Handle rating a recommendation
  const handleRate = (recommendation, rating) => {
    if (onRateRecommendation && typeof onRateRecommendation === 'function') {
      const feedback = feedbackText[recommendation.id] || '';
      onRateRecommendation(recommendation, rating, feedback);
    }
  };
  
  // Handle dismissing a recommendation
  const handleDismiss = (recommendation) => {
    if (onDismissRecommendation && typeof onDismissRecommendation === 'function') {
      onDismissRecommendation(recommendation);
    }
  };
  
  // Handle feedback text change
  const handleFeedbackChange = (id, text) => {
    setFeedbackText(prev => ({ ...prev, [id]: text }));
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        <Typography variant="body1" gutterBottom>
          Generating recommendations...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }
  
  // Render empty state
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              p: 4 
            }}
          >
            <InfoIcon 
              sx={{ 
                fontSize: 48, 
                color: blue[300], 
                mb: 2 
              }} 
            />
            <Typography variant="h6" gutterBottom>
              No Recommendations Available
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              The recommendation engine hasn't generated any suggestions for the current schedule.
              Try adjusting parameters or making modifications to trigger new recommendations.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state for filtered recommendations
  if (filteredRecs.length === 0 && recommendations.length > 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              p: 3 
            }}
          >
            <InfoIcon 
              sx={{ 
                fontSize: 40, 
                color: orange[300], 
                mb: 2 
              }} 
            />
            <Typography variant="h6" gutterBottom>
              No Matching Recommendations
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              No recommendations match your current filters. Try adjusting your filter criteria.
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={() => setFilters({
                type: 'all',
                minConfidence: 0.5,
                sportType: 'all'
              })}
            >
              Reset Filters
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  // Helper function to get icon for recommendation type
  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'schedule_optimization':
        return <TimelineIcon />;
      case 'conflict_resolution':
        return <CompareIcon />;
      case 'venue_allocation':
        return <PlaceIcon />;
      default:
        return <CalendarIcon />;
    }
  };
  
  // Helper function to get recommendation type label
  const getRecommendationTypeLabel = (type) => {
    switch (type) {
      case 'schedule_optimization':
        return 'Schedule Optimization';
      case 'conflict_resolution':
        return 'Conflict Resolution';
      case 'venue_allocation':
        return 'Venue Allocation';
      case 'pattern_based':
        return 'Pattern-Based';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };
  
  // Helper function to render change impact
  const renderChangeImpact = (change) => {
    if (!change) return null;
    
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Affected Games:
        </Typography>
        <List dense>
          {change.affectedGames.map((game, index) => (
            <ListItem key={`game-${index}`} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {game.changeType === 'move' && <TimelineIcon fontSize="small" color="primary" />}
                {game.changeType === 'add' && <CheckCircleIcon fontSize="small" color="success" />}
                {game.changeType === 'remove' && <WarningIcon fontSize="small" color="error" />}
                {game.changeType === 'swap' && <CompareIcon fontSize="small" color="warning" />}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="body2">
                    {game.teams || 'Game'} {game.details || ''}
                  </Typography>
                }
                secondary={
                  <ChangeIndicator 
                    label={game.changeType}
                    changeType={game.changeType}
                    size="small"
                    variant="outlined"
                  />
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };
  
  // Helper function to render personalized note if available
  const renderPersonalizedNote = (recommendation) => {
    // If we have user preferences and this recommendation was personalized
    if (userPreferences && recommendation.personalized) {
      return (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: blue[50], borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon fontSize="small" color="primary" />
            Personalized Recommendation
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {recommendation.personalizedNote || 'This recommendation was tailored based on your preferences and feedback history.'}
          </Typography>
        </Box>
      );
    }
    return null;
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Schedule Recommendations
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {filteredRecs.length} recommendation{filteredRecs.length !== 1 ? 's' : ''} generated by FlexTime
        </Typography>
      </Box>
      
      {filteredRecs.map((recommendation) => (
        <Accordion
          key={recommendation.id}
          expanded={expandedId === recommendation.id}
          onChange={handleAccordionChange(recommendation.id)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`recommendation-${recommendation.id}-content`}
            id={`recommendation-${recommendation.id}-header`}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                {getRecommendationIcon(recommendation.type)}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">
                  {recommendation.title || getRecommendationTypeLabel(recommendation.type)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {recommendation.description && recommendation.description.length > 80
                    ? `${recommendation.description.substring(0, 80)}...`
                    : recommendation.description}
                </Typography>
              </Box>
              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                <Tooltip title={`Confidence: ${Math.round(recommendation.confidence * 100)}%`}>
                  <Chip 
                    label={`${Math.round(recommendation.confidence * 100)}%`}
                    size="small"
                    color={
                      recommendation.confidence >= 0.8 ? 'success' :
                      recommendation.confidence >= 0.6 ? 'primary' :
                      recommendation.confidence >= 0.4 ? 'warning' : 'error'
                    }
                  />
                </Tooltip>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1">
                  {recommendation.description}
                </Typography>
                
                {renderPersonalizedNote(recommendation)}
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Confidence Assessment:
                  </Typography>
                  <ConfidenceIndicator value={recommendation.confidence}>
                    <Box className="indicator" />
                    <Typography variant="body2">
                      {Math.round(recommendation.confidence * 100)}%
                    </Typography>
                  </ConfidenceIndicator>
                </Box>
                
                {recommendation.impact && renderChangeImpact(recommendation.impact)}
                
                {recommendation.insights && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Insights:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="body2">
                        {recommendation.insights}
                      </Typography>
                    </Paper>
                  </Box>
                )}
                
                {recommendation.patternBased && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Based on Pattern:
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 1.5,
                        borderLeft: `4px solid ${blue[500]}`
                      }}
                    >
                      <Typography variant="body2">
                        <strong>{recommendation.pattern?.name || 'Pattern'}</strong>: {recommendation.pattern?.description || 'Pattern-based recommendation'}
                      </Typography>
                    </Paper>
                  </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Rate this recommendation:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating
                      name={`rating-${recommendation.id}`}
                      value={recommendation.userRating || 0}
                      onChange={(event, newValue) => {
                        handleRate(recommendation, newValue);
                      }}
                    />
                    <Box sx={{ ml: 2 }}>
                      <IconButton 
                        color="primary"
                        onClick={() => handleRate(recommendation, 5)}
                      >
                        <ThumbUpIcon />
                      </IconButton>
                      <IconButton 
                        color="error"
                        onClick={() => handleRate(recommendation, 1)}
                      >
                        <ThumbDownIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <TextField
                    label="Additional Feedback"
                    multiline
                    rows={2}
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={feedbackText[recommendation.id] || ''}
                    onChange={(e) => handleFeedbackChange(recommendation.id, e.target.value)}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
          <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleDismiss(recommendation)}
            >
              Dismiss
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleApply(recommendation)}
            >
              Apply Recommendation
            </Button>
          </CardActions>
        </Accordion>
      ))}
    </Box>
  );
};

RecommendationVisualizer.propTypes = {
  recommendations: PropTypes.array,
  loading: PropTypes.bool,
  onApplyRecommendation: PropTypes.func,
  onRateRecommendation: PropTypes.func,
  onDismissRecommendation: PropTypes.func,
  currentSchedule: PropTypes.object,
  sportTypes: PropTypes.array,
  userPreferences: PropTypes.object
};

RecommendationVisualizer.defaultProps = {
  recommendations: [],
  loading: false,
  sportTypes: []
};

export default RecommendationVisualizer;