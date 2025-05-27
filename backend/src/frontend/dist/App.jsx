/**
 * FlexTime Application with Context7 Integration
 * 
 * This is the main application component that integrates all FlexTime features,
 * including the Context7-enhanced capabilities for intelligent scheduling.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  ThemeProvider, createTheme, 
  CssBaseline, Box, Drawer, AppBar, Toolbar, 
  Typography, Divider, List, IconButton,
  ListItem, ListItemIcon, ListItemText, Menu, MenuItem,
  Tooltip, Avatar, Badge, CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  CalendarMonth as CalendarIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Place as PlaceIcon,
  Settings as SettingsIcon,
  AccountCircle,
  NotificationsOutlined,
  Psychology as PsychologyIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';

// Import regular FlexTime components
import Dashboard from './pages/Dashboard';
import ScheduleList from './pages/ScheduleList';
import ScheduleEditor from './pages/ScheduleEditor';
import TeamManager from './pages/TeamManager';
import VenueManager from './pages/VenueManager';
import Settings from './pages/Settings';

// Import Context7 enhanced components
import C7Dashboard from './pages/C7Dashboard';
import C7Navigation from './components/c7/C7Navigation';

// Import authentication services
import { getCurrentUser, logout } from '../services/auth_service';

// Create theme with primary and secondary colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

/**
 * Main Application Component
 */
const App = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [c7Enabled, setC7Enabled] = useState(
    localStorage.getItem('c7Enabled') !== 'false' // Default to true
  );
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Authentication error:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Handle user menu open
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  // Handle user menu close
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  // Handle logout
  const handleLogout = async () => {
    handleUserMenuClose();
    try {
      await logout();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Handle schedule selection
  const handleScheduleSelect = (schedule) => {
    setActiveSchedule(schedule);
  };
  
  // Toggle Context7 features
  const toggleC7Features = () => {
    const newValue = !c7Enabled;
    setC7Enabled(newValue);
    localStorage.setItem('c7Enabled', newValue);
  };
  
  // If still loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // Navigation items
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Schedules', icon: <CalendarIcon />, path: '/schedules' },
    { text: 'Teams', icon: <PeopleIcon />, path: '/teams' },
    { text: 'Venues', icon: <PlaceIcon />, path: '/venues' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];
  
  // Conditionally add Context7 navigation item
  if (c7Enabled) {
    navItems.push({
      text: 'Context7 Dashboard',
      icon: <PsychologyIcon />,
      path: `/c7/dashboard${activeSchedule ? `/${activeSchedule.id}` : ''}`
    });
  }
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          {/* App Bar */}
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleDrawer}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                FlexTime
                {activeSchedule && (
                  <Typography component="span" variant="subtitle1" sx={{ ml: 2 }}>
                    {activeSchedule.name}
                  </Typography>
                )}
              </Typography>
              
              {/* Context7 Navigation - only if enabled */}
              {c7Enabled && (
                <C7Navigation 
                  scheduleId={activeSchedule?.id}
                  sportType={activeSchedule?.sportType}
                  variant="icon"
                />
              )}
              
              {/* Notifications */}
              <IconButton color="inherit">
                <Badge badgeContent={4} color="error">
                  <NotificationsOutlined />
                </Badge>
              </IconButton>
              
              {/* User Menu */}
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleUserMenuOpen}
                  size="large"
                  edge="end"
                  color="inherit"
                  aria-label="account of current user"
                  aria-haspopup="true"
                  sx={{ ml: 2 }}
                >
                  <Avatar 
                    alt={currentUser.name}
                    src={currentUser.avatarUrl}
                    sx={{ width: 32, height: 32 }}
                  >
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleUserMenuClose}>Profile</MenuItem>
                <MenuItem onClick={handleUserMenuClose}>My account</MenuItem>
                <Divider />
                <MenuItem onClick={toggleC7Features}>
                  {c7Enabled ? 'Disable Context7 Features' : 'Enable Context7 Features'}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>
          
          {/* Side Drawer */}
          <Drawer
            variant="persistent"
            open={drawerOpen}
            sx={{
              width: 240,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 240,
                boxSizing: 'border-box',
              },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={toggleDrawer}>
                  <ChevronLeftIcon />
                </IconButton>
              </Box>
              <Divider />
              <List>
                {navItems.map((item) => (
                  <ListItem button key={item.text} component="a" href={item.path}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ p: 2 }}>
                {c7Enabled && (
                  <Typography variant="caption" color="textSecondary">
                    Enhanced with Context7 AI
                  </Typography>
                )}
              </Box>
            </Box>
          </Drawer>
          
          {/* Main Content */}
          <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
            <Toolbar /> {/* Spacer to push content below app bar */}
            <Routes>
              {/* Standard FlexTime Routes */}
              <Route path="/" element={<Dashboard onScheduleSelect={handleScheduleSelect} />} />
              <Route path="/schedules" element={<ScheduleList onScheduleSelect={handleScheduleSelect} />} />
              <Route path="/schedules/:scheduleId" element={<ScheduleEditor onScheduleSelect={handleScheduleSelect} />} />
              <Route path="/teams" element={<TeamManager />} />
              <Route path="/venues" element={<VenueManager />} />
              <Route path="/settings" element={<Settings />} />
              
              {/* Context7 Enhanced Routes - only accessible if enabled */}
              {c7Enabled && (
                <>
                  <Route path="/c7/dashboard" element={<C7Dashboard />} />
                  <Route path="/c7/dashboard/:scheduleId" element={<C7Dashboard />} />
                  <Route path="/c7/recommendations" element={<C7Dashboard activeTab="recommendations" />} />
                  <Route path="/c7/recommendations/:scheduleId" element={<C7Dashboard activeTab="recommendations" />} />
                  <Route path="/c7/patterns" element={<C7Dashboard activeTab="patterns" />} />
                  <Route path="/c7/patterns/:scheduleId" element={<C7Dashboard activeTab="patterns" />} />
                  <Route path="/c7/insights" element={<C7Dashboard activeTab="insights" />} />
                  <Route path="/c7/preferences" element={<C7Dashboard activeTab="preferences" />} />
                </>
              )}
              
              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
