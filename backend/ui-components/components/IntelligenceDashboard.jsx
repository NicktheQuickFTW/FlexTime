import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Divider,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Dashboard, 
  Memory, 
  Insights, 
  Feedback, 
  History,
  Menu as MenuIcon,
  Refresh
} from '@mui/icons-material';

import IntelligenceEngineMonitor from './IntelligenceEngineMonitor';
import IntelligenceEngineInsights from './IntelligenceEngineInsights';
import ScheduleFeedbackForm from './ScheduleFeedbackForm';
import ExperienceExplorer from './ExperienceExplorer';

/**
 * Dashboard component for Intelligence Engine monitoring and management
 */
const IntelligenceDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const refreshCurrentView = () => {
    // This would trigger a refresh of the current component
    // Implementation depends on how the child components are structured
    console.log('Refreshing current view');
    window.location.reload();
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Dashboard
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <IntelligenceEngineMonitor />
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Quick Stats</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box p={2} textAlign="center" bgcolor={theme.palette.background.default} borderRadius={1}>
                      <Typography variant="body2" color="textSecondary">Total Experiences</Typography>
                      <Typography variant="h4">--</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box p={2} textAlign="center" bgcolor={theme.palette.background.default} borderRadius={1}>
                      <Typography variant="body2" color="textSecondary">API Requests Today</Typography>
                      <Typography variant="h4">--</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box p={2} textAlign="center" bgcolor={theme.palette.background.default} borderRadius={1}>
                      <Typography variant="body2" color="textSecondary">Avg Response Time</Typography>
                      <Typography variant="h4">-- ms</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box p={2} textAlign="center" bgcolor={theme.palette.background.default} borderRadius={1}>
                      <Typography variant="body2" color="textSecondary">Schedules Generated</Typography>
                      <Typography variant="h4">--</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                <Box p={3} display="flex" justifyContent="center" alignItems="center" height="200px">
                  <Typography variant="body1" color="textSecondary">
                    Activity data will be displayed here
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        );
      case 1: // Insights
        return <IntelligenceEngineInsights sportType="basketball" conferenceId="big12" />;
      case 2: // Feedback
        return <ScheduleFeedbackForm scheduleId="demo_schedule_123" sportType="basketball" />;
      case 3: // Experiences
        return <ExperienceExplorer />;
      default:
        return <div>Unknown tab</div>;
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box display="flex" alignItems="center">
            <Memory color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              HELiiX Intelligence Engine
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={refreshCurrentView}
            size="small"
          >
            Refresh
          </Button>
        </Toolbar>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="intelligence engine tabs"
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          centered={!isMobile}
        >
          <Tab icon={<Dashboard />} label="Dashboard" />
          <Tab icon={<Insights />} label="Insights" />
          <Tab icon={<Feedback />} label="Feedback" />
          <Tab icon={<History />} label="Experiences" />
        </Tabs>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {renderTabContent()}
      </Container>
    </Box>
  );
};

export default IntelligenceDashboard;
