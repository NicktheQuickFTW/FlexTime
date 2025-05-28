import React, { useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Groups as TeamsIcon,
  LocationOn as VenueIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import SportSelector from '../components/common/SportSelector';
import ThemeToggle from '../components/common/ThemeToggle';
import VantaBackground from '../components/common/VantaBackground';
import { useThemeContext } from '../contexts/ThemeContext';

const drawerWidth = 240;

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentSport } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleDrawer = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Schedules', icon: <CalendarIcon />, path: '/schedules' },
    { text: 'Teams', icon: <TeamsIcon />, path: '/teams' },
    { text: 'Venues', icon: <VenueIcon />, path: '/venues' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar for larger screens */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              border: 'none',
              background: theme.palette.mode === 'dark' 
                ? 'rgba(17, 25, 40, 0.75)' 
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)'
            },
          }}
        >
          <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              FlexTime
            </Typography>
          </Toolbar>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItemButton 
                key={item.text} 
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '0 30px 30px 0',
                  mx: 1,
                  my: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 102, 204, 0.08)',
                  }
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      )}

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* AppBar */}
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{
            background: theme.palette.mode === 'dark' 
              ? 'rgba(17, 25, 40, 0.75)' 
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleDrawer}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Box sx={{ flexGrow: 1 }}>
              <SportSelector />
            </Box>
            
            <ThemeToggle />
          </Toolbar>
        </AppBar>

        {/* Mobile drawer */}
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={toggleDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              background: theme.palette.mode === 'dark' 
                ? 'rgba(17, 25, 40, 0.9)' 
                : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
            }
          }}
        >
          <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              FlexTime
            </Typography>
          </Toolbar>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItemButton 
                key={item.text} 
                onClick={() => {
                  navigate(item.path);
                  toggleDrawer();
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>

        {/* Main content with VantaBackground */}
        <VantaBackground 
          effect={currentSport?.includes('Basketball') ? 'net' : 'waves'}
          options={{
            speed: 0.8,
            waveHeight: 10,
            zoom: 0.75
          }}
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column' 
          }}
        >
          <Container 
            maxWidth="xl" 
            sx={{ 
              py: 4, 
              flexGrow: 1,
              position: 'relative',
              zIndex: 1
            }}
          >
            <Outlet />
          </Container>
        </VantaBackground>
      </Box>
    </Box>
  );
};

export default MainLayout;
