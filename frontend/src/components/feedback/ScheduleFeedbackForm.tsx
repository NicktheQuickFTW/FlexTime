import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  FormControl, 
  FormControlLabel, 
  FormLabel, 
  Radio, 
  RadioGroup, 
  Slider, 
  TextField, 
  Typography 
} from '@mui/material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

interface ScheduleFeedbackFormProps {
  scheduleId: string;
  sportType: string;
  onFeedbackSubmitted?: () => void;
}

interface FeedbackMetrics {
  travelDistance: number;
  homeAwayBalance: number;
  restPeriods: number;
  venueUtilization: number;
  constraintSatisfaction: number;
}

const ScheduleFeedbackForm: React.FC<ScheduleFeedbackFormProps> = ({ 
  scheduleId, 
  sportType,
  onFeedbackSubmitted 
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [rating, setRating] = useState<number>(3);
  const [comment, setComment] = useState<string>('');
  const [metrics, setMetrics] = useState<FeedbackMetrics>({
    travelDistance: 3,
    homeAwayBalance: 3,
    restPeriods: 3,
    venueUtilization: 3,
    constraintSatisfaction: 3
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleMetricChange = (metric: keyof FeedbackMetrics) => (event: Event, newValue: number | number[]) => {
    setMetrics({
      ...metrics,
      [metric]: newValue as number
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('/api/feedback/schedule', {
        scheduleId,
        sportType,
        rating,
        comment,
        metrics
      });
      
      if (response.data.success) {
        enqueueSnackbar('Feedback submitted successfully. Thank you!', { variant: 'success' });
        
        // Reset form
        setRating(3);
        setComment('');
        setMetrics({
          travelDistance: 3,
          homeAwayBalance: 3,
          restPeriods: 3,
          venueUtilization: 3,
          constraintSatisfaction: 3
        });
        
        // Call callback if provided
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }
      } else {
        enqueueSnackbar('Failed to submit feedback: ' + response.data.error, { variant: 'error' });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      enqueueSnackbar('An error occurred while submitting feedback. Please try again.', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const metricLabels = {
    travelDistance: 'Travel Distance Optimization',
    homeAwayBalance: 'Home/Away Game Balance',
    restPeriods: 'Rest Periods Between Games',
    venueUtilization: 'Venue Utilization',
    constraintSatisfaction: 'Constraint Satisfaction'
  };

  return (
    <Card>
      <CardHeader 
        title="Schedule Feedback" 
        subheader="Your feedback helps us improve future schedules" 
      />
      <Divider />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <FormControl component="fieldset">
              <FormLabel component="legend">Overall Schedule Rating</FormLabel>
              <RadioGroup
                row
                name="rating"
                value={rating.toString()}
                onChange={(e) => setRating(parseInt(e.target.value))}
              >
                <FormControlLabel value="1" control={<Radio />} label="Poor" />
                <FormControlLabel value="2" control={<Radio />} label="Fair" />
                <FormControlLabel value="3" control={<Radio />} label="Good" />
                <FormControlLabel value="4" control={<Radio />} label="Very Good" />
                <FormControlLabel value="5" control={<Radio />} label="Excellent" />
              </RadioGroup>
            </FormControl>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Specific Aspects
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Rate each aspect of the schedule from 1 (Poor) to 5 (Excellent)
            </Typography>
            
            {Object.entries(metricLabels).map(([key, label]) => (
              <Box key={key} sx={{ my: 2 }}>
                <Typography id={`${key}-slider-label`} gutterBottom>
                  {label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Slider
                    value={metrics[key as keyof FeedbackMetrics]}
                    onChange={handleMetricChange(key as keyof FeedbackMetrics)}
                    aria-labelledby={`${key}-slider-label`}
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={5}
                  />
                  <Typography>
                    {metrics[key as keyof FeedbackMetrics]}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
          
          <Box>
            <TextField
              fullWidth
              label="Additional Comments"
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              variant="outlined"
              placeholder="Please share any specific feedback about this schedule..."
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setRating(3);
                setComment('');
                setMetrics({
                  travelDistance: 3,
                  homeAwayBalance: 3,
                  restPeriods: 3,
                  venueUtilization: 3,
                  constraintSatisfaction: 3
                });
              }}
            >
              Reset
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ScheduleFeedbackForm;
