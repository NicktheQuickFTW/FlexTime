import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Slider, 
  Grid, 
  Rating, 
  Snackbar, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import { Feedback, Send } from '@mui/icons-material';

/**
 * Component for submitting feedback on a schedule to the Intelligence Engine
 */
const ScheduleFeedbackForm = ({ scheduleId, sportType, onFeedbackSubmitted }) => {
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');
  const [metrics, setMetrics] = useState({
    travelDistance: 0.5,
    homeAwayBalance: 0.5,
    restPeriods: 0.5,
    venueUtilization: 0.5
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleMetricChange = (metric) => (event, newValue) => {
    setMetrics({
      ...metrics,
      [metric]: newValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scheduleId) {
      setError('Schedule ID is required');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/intelligence-engine/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduleId,
          sportType,
          rating,
          comment,
          metrics
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setComment('');
        // Don't reset rating and metrics to allow for multiple similar submissions
        
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(data);
        }
      } else {
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  const metricLabels = {
    travelDistance: 'Travel Distance',
    homeAwayBalance: 'Home/Away Balance',
    restPeriods: 'Rest Periods',
    venueUtilization: 'Venue Utilization'
  };

  const getMetricValueLabel = (value) => {
    if (value < 0.2) return 'Poor';
    if (value < 0.4) return 'Fair';
    if (value < 0.6) return 'Good';
    if (value < 0.8) return 'Very Good';
    return 'Excellent';
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Feedback color="primary" />
          <Typography variant="h6" component="h2" ml={1}>
            Schedule Feedback
          </Typography>
        </Box>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography gutterBottom>Overall Rating</Typography>
              <Box display="flex" alignItems="center">
                <Rating
                  name="schedule-rating"
                  value={rating}
                  onChange={(event, newValue) => {
                    setRating(newValue);
                  }}
                  precision={0.5}
                  size="large"
                />
                <Typography ml={2}>{rating} / 5</Typography>
              </Box>
            </Grid>
            
            {Object.entries(metrics).map(([metric, value]) => (
              <Grid item xs={12} key={metric}>
                <Typography id={`${metric}-slider-label`} gutterBottom>
                  {metricLabels[metric]}: <strong>{getMetricValueLabel(value)}</strong>
                </Typography>
                <Slider
                  value={value}
                  onChange={handleMetricChange(metric)}
                  aria-labelledby={`${metric}-slider-label`}
                  valueLabelDisplay="auto"
                  valueLabelFormat={getMetricValueLabel}
                  step={0.1}
                  marks
                  min={0}
                  max={1}
                />
              </Grid>
            ))}
            
            <Grid item xs={12}>
              <TextField
                label="Comments"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                placeholder="Please provide any additional feedback about this schedule..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                endIcon={loading ? <CircularProgress size={20} /> : <Send />}
                fullWidth
              >
                Submit Feedback
              </Button>
            </Grid>
          </Grid>
        </form>
        
        <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="success">
            Feedback submitted successfully!
          </Alert>
        </Snackbar>
        
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

export default ScheduleFeedbackForm;
