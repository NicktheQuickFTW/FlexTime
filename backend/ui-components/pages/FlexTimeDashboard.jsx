/**
 * FlexTime Dashboard
 * 
 * This dashboard provides access to FlexTime's advanced scheduling features,
 * including recommendations, pattern analysis, insights, and preferences.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Recommend as RecommendIcon,
  Timeline as PatternIcon,
  Insights as InsightIcon,
  Settings as PreferencesIcon
} from '@mui/icons-material';

// Import visualizer components
import RecommendationVisualizer from '../components/analytics/RecommendationVisualizer';
import PatternVisualizer from '../components/analytics/PatternVisualizer';
import LearningInsightsDashboard from '../components/analytics/LearningInsightsDashboard';
import UserPreferenceManager from '../components/settings/UserPreferenceManager';

// Import necessary hooks and services
import { useFlexApp } from '../hooks/useFlexApp';
import { getScheduleById } from '../../services/schedule_service';

/**
 * Tab panel component to display content for each tab
 */
const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`flextime-tabpanel-${index}`}
    aria-labelledby={`flextime-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

/**
 * Main FlexTime Dashboard component
 */
const FlexTimeDashboard = ({ activeTab = "dashboard" }) => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { schedulingService } = useFlexApp();
  
  // State management
  const [tabValue, setTabValue] = useState(0);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map the activeTab prop to the corresponding tab index
  useEffect(() => {
    const tabMap = {
      "dashboard": 0,
      "recommendations": 1,
      "patterns": 2,
      "insights": 3,
      "preferences": 4
    };
    
    setTabValue(tabMap[activeTab] || 0);
  }, [activeTab]);

  // Load schedule data if a scheduleId is provided
  useEffect(() => {
    if (scheduleId) {
      setLoading(true);
      setError(null);
      
      getScheduleById(scheduleId)
        .then(data => {
          setSchedule(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error loading schedule:", err);
          setError("Failed to load schedule data. Please try again later.");
          setLoading(false);
        });
    }
  }, [scheduleId]);

  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Update URL based on selected tab
    const paths = [
      `/flextime/dashboard${scheduleId ? `/${scheduleId}` : ''}`,
      `/flextime/recommendations${scheduleId ? `/${scheduleId}` : ''}`,
      `/flextime/patterns${scheduleId ? `/${scheduleId}` : ''}`,
      `/flextime/insights`,
      `/flextime/preferences`
    ];
    
    navigate(paths[newValue]);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="FlexTime dashboard tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<RecommendIcon />} label="Dashboard" />
            <Tab icon={<RecommendIcon />} label="Recommendations" />
            <Tab icon={<PatternIcon />} label="Patterns" />
            <Tab icon={<InsightIcon />} label="Insights" />
            <Tab icon={<PreferencesIcon />} label="Preferences" />
          </Tabs>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : (
          <>
            {/* Dashboard Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h4" gutterBottom>
                FlexTime Dashboard
              </Typography>
              <Typography variant="h6" gutterBottom>
                {schedule ? `Schedule: ${schedule.name}` : 'No schedule selected'}
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
                <RecommendationVisualizer 
                  scheduleId={scheduleId} 
                  limit={3}
                  preview={true}
                />
                <PatternVisualizer 
                  scheduleId={scheduleId}
                  limit={3}
                  preview={true}
                />
              </Box>
            </TabPanel>
            
            {/* Recommendations Tab */}
            <TabPanel value={tabValue} index={1}>
              <RecommendationVisualizer scheduleId={scheduleId} />
            </TabPanel>
            
            {/* Patterns Tab */}
            <TabPanel value={tabValue} index={2}>
              <PatternVisualizer scheduleId={scheduleId} />
            </TabPanel>
            
            {/* Insights Tab */}
            <TabPanel value={tabValue} index={3}>
              <LearningInsightsDashboard />
            </TabPanel>
            
            {/* Preferences Tab */}
            <TabPanel value={tabValue} index={4}>
              <UserPreferenceManager />
            </TabPanel>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default FlexTimeDashboard;