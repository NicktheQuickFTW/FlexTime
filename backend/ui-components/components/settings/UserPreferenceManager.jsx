/**
 * User Preference Manager
 * 
 * This component allows users to manage their preferences for FlexTime's
 * features, including recommendation types, sports interests, and personalization settings.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Card, CardContent, Typography, Grid, Button, Switch,
  FormControlLabel, Slider, TextField, Chip, Divider, Alert,
  Select, MenuItem, Paper, IconButton, FormControl, InputLabel
} from '@mui/material';
import { 
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  SportsSoccer, SportsTennis, SportsBasketball, SportsFootball, 
  SportsBaseball, SportsHockey
} from '@mui/icons-material';

// Sport type to icon mapping
const SPORT_ICONS = {
  soccer: <SportsSoccer />,
  tennis: <SportsTennis />,
  basketball: <SportsBasketball />,
  football: <SportsFootball />,
  baseball: <SportsBaseball />,
  hockey: <SportsHockey />
};

/**
 * User Preference Manager Component
 */
const UserPreferenceManager = ({
  preferences,
  feedbackHistory,
  onSavePreferences,
  onResetPreferences,
  loading,
  availableSports,
  userId
}) => {
  const [userPrefs, setUserPrefs] = useState({ ...preferences });
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  
  // Initialize with default values if needed
  useEffect(() => {
    if (preferences) {
      setUserPrefs({ ...preferences });
    } else {
      setUserPrefs({
        general: {
          enablePersonalization: true,
          minimumConfidence: 0.6,
          autoApplyThreshold: 0.9,
          showExplanations: true
        },
        sports: {
          favoriteSports: [],
          sportPreferences: {}
        },
        recommendations: {
          preferredTypes: [],
          priorityFactors: {
            conflicts: 0.8,
            travelDistance: 0.6,
            venuePreference: 0.7,
            restDays: 0.5
          }
        },
        notifications: {
          email: true,
          inApp: true,
          frequency: 'daily'
        }
      });
    }
  }, [preferences]);
  
  // Handle preference changes
  const handlePrefChange = (section, field, value) => {
    setUserPrefs(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };
  
  // Handle nested preference changes
  const handleNestedPrefChange = (section, parentField, field, value) => {
    setUserPrefs(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentField]: {
          ...prev[section][parentField],
          [field]: value
        }
      }
    }));
    setUnsavedChanges(true);
  };
  
  // Save preferences
  const savePreferences = () => {
    if (onSavePreferences && typeof onSavePreferences === 'function') {
      onSavePreferences(userPrefs);
      setUnsavedChanges(false);
    }
  };
  
  // Reset preferences
  const resetPreferences = () => {
    if (onResetPreferences && typeof onResetPreferences === 'function') {
      onResetPreferences();
      setUnsavedChanges(false);
    } else {
      setUserPrefs({ ...preferences });
      setUnsavedChanges(false);
    }
  };
  
  // Add a sport to favorites
  const addSportToFavorites = (sport) => {
    if (!userPrefs.sports.favoriteSports.includes(sport)) {
      const newFavorites = [...userPrefs.sports.favoriteSports, sport];
      handlePrefChange('sports', 'favoriteSports', newFavorites);
    }
  };
  
  // Remove a sport from favorites
  const removeSportFromFavorites = (sport) => {
    const newFavorites = userPrefs.sports.favoriteSports.filter(s => s !== sport);
    handlePrefChange('sports', 'favoriteSports', newFavorites);
  };
  
  // Add a recommendation type to preferred types
  const addRecommendationType = (type) => {
    if (!userPrefs.recommendations.preferredTypes.includes(type)) {
      const newTypes = [...userPrefs.recommendations.preferredTypes, type];
      handlePrefChange('recommendations', 'preferredTypes', newTypes);
    }
  };
  
  // Remove a recommendation type from preferred types
  const removeRecommendationType = (type) => {
    const newTypes = userPrefs.recommendations.preferredTypes.filter(t => t !== type);
    handlePrefChange('recommendations', 'preferredTypes', newTypes);
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">Loading preferences...</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          FlexTime Personalization Settings
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Customize how the scheduling recommendation system works for you
        </Typography>
      </Box>
      
      {unsavedChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes to your preferences
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Settings
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              <Button 
                variant={activeSection === 'general' ? 'contained' : 'text'}
                fullWidth
                onClick={() => setActiveSection('general')}
              >
                General Settings
              </Button>
              <Button 
                variant={activeSection === 'sports' ? 'contained' : 'text'}
                fullWidth
                onClick={() => setActiveSection('sports')}
              >
                Sport Preferences
              </Button>
              <Button 
                variant={activeSection === 'recommendations' ? 'contained' : 'text'}
                fullWidth
                onClick={() => setActiveSection('recommendations')}
              >
                Recommendation Settings
              </Button>
              <Button 
                variant={activeSection === 'notifications' ? 'contained' : 'text'}
                fullWidth
                onClick={() => setActiveSection('notifications')}
              >
                Notification Settings
              </Button>
              <Button 
                variant={activeSection === 'feedback' ? 'contained' : 'text'}
                fullWidth
                onClick={() => setActiveSection('feedback')}
              >
                My Feedback History
              </Button>
            </Box>
            
            <Box sx={{ mt: 4 }}>
              <Button 
                variant="contained" 
                color="primary"
                fullWidth
                onClick={savePreferences}
                disabled={!unsavedChanges}
                startIcon={<SaveIcon />}
              >
                Save Preferences
              </Button>
              <Button 
                variant="outlined" 
                color="error"
                fullWidth
                onClick={resetPreferences}
                sx={{ mt: 1 }}
                startIcon={<DeleteIcon />}
              >
                Reset
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              {/* General Settings */}
              {activeSection === 'general' && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">General Settings</Typography>
                  </Box>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPrefs.general.enablePersonalization}
                        onChange={(e) => handlePrefChange('general', 'enablePersonalization', e.target.checked)}
                      />
                    }
                    label="Enable AI Personalization"
                  />
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Minimum Confidence Threshold
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Only show recommendations with confidence above this level
                  </Typography>
                  <Slider
                    value={userPrefs.general.minimumConfidence}
                    onChange={(e, value) => handlePrefChange('general', 'minimumConfidence', value)}
                    step={0.05}
                    marks
                    min={0}
                    max={1}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                    sx={{ maxWidth: 400, ml: 2 }}
                  />
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                    Auto-Apply Threshold
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Automatically apply recommendations above this confidence level
                  </Typography>
                  <Slider
                    value={userPrefs.general.autoApplyThreshold}
                    onChange={(e, value) => handlePrefChange('general', 'autoApplyThreshold', value)}
                    step={0.05}
                    marks
                    min={0.7}
                    max={1}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                    sx={{ maxWidth: 400, ml: 2 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPrefs.general.showExplanations}
                        onChange={(e) => handlePrefChange('general', 'showExplanations', e.target.checked)}
                      />
                    }
                    label="Show AI Explanations"
                    sx={{ mt: 2, display: 'block' }}
                  />
                </Box>
              )}
              
              {/* Sport Preferences */}
              {activeSection === 'sports' && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SportsBasketball sx={{ mr: 1 }} />
                    <Typography variant="h6">Sport Preferences</Typography>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Favorite Sports
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Select the sports you're most interested in for personalized recommendations
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, mb: 3 }}>
                    {userPrefs.sports.favoriteSports.map((sport) => (
                      <Chip
                        key={sport}
                        label={sport}
                        icon={SPORT_ICONS[sport] || null}
                        onDelete={() => removeSportFromFavorites(sport)}
                      />
                    ))}
                    
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel id="add-sport-label">Add Sport</InputLabel>
                      <Select
                        labelId="add-sport-label"
                        value=""
                        label="Add Sport"
                        onChange={(e) => {
                          if (e.target.value) addSportToFavorites(e.target.value);
                        }}
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          <em>Select Sport</em>
                        </MenuItem>
                        {availableSports?.filter(sport => !userPrefs.sports.favoriteSports.includes(sport)).map((sport) => (
                          <MenuItem key={sport} value={sport}>
                            {sport}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  {userPrefs.sports.favoriteSports.map((sport) => (
                    <Box key={sport} sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {sport.charAt(0).toUpperCase() + sport.slice(1)} Preferences
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" gutterBottom>
                            Preferred Start Times
                          </Typography>
                          <TextField
                            size="small"
                            label="Weekday"
                            type="time"
                            value={(userPrefs.sports.sportPreferences[sport]?.preferredStartTimes?.weekday) || '19:00'}
                            onChange={(e) => {
                              const newPrefs = {
                                ...userPrefs.sports.sportPreferences[sport] || {},
                                preferredStartTimes: {
                                  ...(userPrefs.sports.sportPreferences[sport]?.preferredStartTimes || {}),
                                  weekday: e.target.value
                                }
                              };
                              handleNestedPrefChange('sports', 'sportPreferences', sport, newPrefs);
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                            sx={{ mr: 2 }}
                          />
                          <TextField
                            size="small"
                            label="Weekend"
                            type="time"
                            value={(userPrefs.sports.sportPreferences[sport]?.preferredStartTimes?.weekend) || '15:00'}
                            onChange={(e) => {
                              const newPrefs = {
                                ...userPrefs.sports.sportPreferences[sport] || {},
                                preferredStartTimes: {
                                  ...(userPrefs.sports.sportPreferences[sport]?.preferredStartTimes || {}),
                                  weekend: e.target.value
                                }
                              };
                              handleNestedPrefChange('sports', 'sportPreferences', sport, newPrefs);
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" gutterBottom>
                            Time Between Games
                          </Typography>
                          <FormControl size="small" fullWidth>
                            <InputLabel id={`min-rest-${sport}-label`}>Minimum Rest (Days)</InputLabel>
                            <Select
                              labelId={`min-rest-${sport}-label`}
                              value={(userPrefs.sports.sportPreferences[sport]?.minRestDays) || 1}
                              label="Minimum Rest (Days)"
                              onChange={(e) => {
                                const newPrefs = {
                                  ...userPrefs.sports.sportPreferences[sport] || {},
                                  minRestDays: e.target.value
                                };
                                handleNestedPrefChange('sports', 'sportPreferences', sport, newPrefs);
                              }}
                            >
                              {[0, 1, 2, 3, 4, 5, 6, 7].map((days) => (
                                <MenuItem key={days} value={days}>
                                  {days} {days === 1 ? 'day' : 'days'}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Box>
              )}
              
              {/* Recommendation Settings */}
              {activeSection === 'recommendations' && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Recommendation Settings</Typography>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Preferred Recommendation Types
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Select the types of recommendations you're most interested in
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, mb: 3 }}>
                    {userPrefs.recommendations.preferredTypes.map((type) => (
                      <Chip
                        key={type}
                        label={type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        onDelete={() => removeRecommendationType(type)}
                      />
                    ))}
                    
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel id="add-rec-type-label">Add Recommendation Type</InputLabel>
                      <Select
                        labelId="add-rec-type-label"
                        value=""
                        label="Add Recommendation Type"
                        onChange={(e) => {
                          if (e.target.value) addRecommendationType(e.target.value);
                        }}
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          <em>Select Type</em>
                        </MenuItem>
                        {['schedule_optimization', 'conflict_resolution', 'venue_allocation', 'pattern_based']
                          .filter(type => !userPrefs.recommendations.preferredTypes.includes(type))
                          .map((type) => (
                            <MenuItem key={type} value={type}>
                              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Priority Factors
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Set the importance of different factors in recommendations
                  </Typography>
                  
                  <Box sx={{ maxWidth: 500, mt: 2 }}>
                    <Grid container spacing={2}>
                      {Object.entries(userPrefs.recommendations.priorityFactors).map(([factor, value]) => (
                        <Grid item xs={12} key={factor}>
                          <Typography variant="body2" gutterBottom>
                            {factor.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Slider
                            value={value}
                            onChange={(e, newValue) => {
                              const newFactors = {
                                ...userPrefs.recommendations.priorityFactors,
                                [factor]: newValue
                              };
                              handlePrefChange('recommendations', 'priorityFactors', newFactors);
                            }}
                            step={0.1}
                            marks
                            min={0}
                            max={1}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(val) => `${(val * 100).toFixed(0)}%`}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
              )}
              
              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Notification Settings</Typography>
                  </Box>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPrefs.notifications.email}
                        onChange={(e) => handlePrefChange('notifications', 'email', e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPrefs.notifications.inApp}
                        onChange={(e) => handlePrefChange('notifications', 'inApp', e.target.checked)}
                      />
                    }
                    label="In-App Notifications"
                    sx={{ display: 'block', mt: 1 }}
                  />
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Notification Frequency
                  </Typography>
                  
                  <FormControl size="small" sx={{ minWidth: 200, mt: 1 }}>
                    <InputLabel id="notification-frequency-label">Frequency</InputLabel>
                    <Select
                      labelId="notification-frequency-label"
                      value={userPrefs.notifications.frequency}
                      label="Frequency"
                      onChange={(e) => handlePrefChange('notifications', 'frequency', e.target.value)}
                    >
                      <MenuItem value="realtime">Real-time</MenuItem>
                      <MenuItem value="daily">Daily Summary</MenuItem>
                      <MenuItem value="weekly">Weekly Summary</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
              
              {/* Feedback History */}
              {activeSection === 'feedback' && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">My Feedback History</Typography>
                  </Box>
                  
                  {feedbackHistory && feedbackHistory.length > 0 ? (
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Your past feedback helps personalize recommendations
                      </Typography>
                      
                      {feedbackHistory.map((feedback, index) => (
                        <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">
                              {feedback.recommendationType || 'Recommendation'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {new Date(feedback.timestamp).toLocaleDateString()}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              Rating:
                            </Typography>
                            <Chip 
                              label={`${feedback.rating}/5`}
                              color={feedback.rating >= 4 ? 'success' : feedback.rating >= 3 ? 'primary' : 'error'}
                              size="small"
                            />
                          </Box>
                          
                          {feedback.comments && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              "{feedback.comments}"
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      You haven't provided any feedback on recommendations yet.
                      When you rate or provide feedback, it will appear here.
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

UserPreferenceManager.propTypes = {
  preferences: PropTypes.object,
  feedbackHistory: PropTypes.array,
  onSavePreferences: PropTypes.func,
  onResetPreferences: PropTypes.func,
  loading: PropTypes.bool,
  availableSports: PropTypes.array,
  userId: PropTypes.string
};

UserPreferenceManager.defaultProps = {
  loading: false,
  feedbackHistory: [],
  availableSports: ['basketball', 'football', 'baseball', 'soccer', 'hockey', 'tennis']
};

export default UserPreferenceManager;