import React from 'react';
import { 
  Box, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Typography,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Groups as TeamsIcon,
  LocationOn as VenueIcon,
  Settings as SettingsIcon,
  BarChart as AnalyticsIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  VideoCall as MediaIcon,
  SportsFootball as FootballIcon,
  SportsTennis as TennisIcon,
  SportsBasketball as BasketballIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../dashboard/RoleDashboard';
import GradientText from '../common/GradientText';

interface NavigationRailProps {
  role: UserRole;
}

const NavigationRail: React.FC<NavigationRailProps> = ({ role }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Define navigation items based on user role
  const getNavigationItems = (role: UserRole) => {
    const commonItems = [
      { 
        text: 'Dashboard', 
        icon: <DashboardIcon />, 
        path: '/' 
      },
      { 
        text: 'Schedules', 
        icon: <CalendarIcon />, 
        path: '/schedules' 
      },
    ];
    
    const roleSpecificItems = {
      team: [
        { text: 'My Team', icon: <TeamsIcon />, path: '/my-team' },
        { text: 'Venues', icon: <VenueIcon />, path: '/venues' },
      ],
      official: [
        { text: 'My Assignments', icon: <CalendarIcon />, path: '/assignments' },
        { text: 'Officials', icon: <PersonIcon />, path: '/officials' },
      ],
      admin: [
        { text: 'Teams', icon: <TeamsIcon />, path: '/teams' },
        { text: 'Venues', icon: <VenueIcon />, path: '/venues' },
        { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
        { text: 'Integrations', icon: <LinkIcon />, path: '/integrations/notion' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
      ],
      media: [
        { text: 'Media Access', icon: <MediaIcon />, path: '/media-access' },
        { text: 'Coverage', icon: <NotificationsIcon />, path: '/coverage' },
      ],
    };
    
    return [...commonItems, ...roleSpecificItems[role]];
  };
  
  const navigationItems = getNavigationItems(role);
  
  const getSportItems = () => [
    { text: 'Football', icon: <FootballIcon />, path: '/sports/football' },
    { text: 'Basketball', icon: <BasketballIcon />, path: '/sports/basketball' },
    { text: 'Tennis', icon: <TennisIcon />, path: '/sports/tennis' },
  ];
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <Box
      sx={{
        height: '100%',
        background: theme.palette.mode === 'dark' 
          ? 'rgba(17, 25, 40, 0.75)' 
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <GradientText variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          FlexTime
        </GradientText>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {role === 'team' && 'Team Dashboard'}
          {role === 'official' && 'Official Dashboard'}
          {role === 'admin' && 'Admin Dashboard'}
          {role === 'media' && 'Media Dashboard'}
        </Typography>
      </Box>
      
      <Divider />
      
      {/* Main navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 2 }}>
        <List sx={{ px: 2 }}>
          {navigationItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 2,
                mb: 1,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(0, 102, 204, 0.2)' 
                    : 'rgba(0, 102, 204, 0.1)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(0, 102, 204, 0.3)' 
                      : 'rgba(0, 102, 204, 0.2)',
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) 
                    ? theme.palette.primary.main 
                    : theme.palette.text.primary,
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          ))}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Sports section */}
        <Typography 
          variant="overline" 
          sx={{ 
            px: 3, 
            color: theme.palette.text.secondary,
            fontWeight: 500,
            display: 'block',
            mb: 1
          }}
        >
          Sports
        </Typography>
        
        <List sx={{ px: 2 }}>
          {getSportItems().map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 2,
                mb: 1,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(0, 102, 204, 0.2)' 
                    : 'rgba(0, 102, 204, 0.1)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(0, 102, 204, 0.3)' 
                      : 'rgba(0, 102, 204, 0.2)',
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) 
                    ? theme.palette.primary.main 
                    : theme.palette.text.primary,
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
      
      {/* User section */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0066cc, #00c2ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              mr: 2,
            }}
          >
            {role.charAt(0).toUpperCase()}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {role === 'team' && 'Team Manager'}
              {role === 'official' && 'Official'}
              {role === 'admin' && 'Administrator'}
              {role === 'media' && 'Media Representative'}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {role.charAt(0).toUpperCase() + role.slice(1)} Role
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NavigationRail;
