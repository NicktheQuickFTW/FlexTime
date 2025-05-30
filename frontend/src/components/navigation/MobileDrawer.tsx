import React from 'react';
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  IconButton,
  useTheme,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Groups as TeamsIcon,
  LocationOn as VenueIcon,
  Settings as SettingsIcon,
  BarChart as AnalyticsIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Integration as IntegrationIcon,
  SportsFootball as FootballIcon,
  SportsTennis as TennisIcon,
  SportsBasketball as BasketballIcon,
  SportsBaseball as BaseballIcon,
  Sports as SportsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeContext } from '../../contexts/ThemeContext';
import { UserRole } from '../dashboard/RoleDashboard';
import GradientText from '../common/GradientText';
import ThemeToggle from '../common/ThemeToggle';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  role?: UserRole;
}

/**
 * MobileDrawer component provides navigation menu for mobile devices
 * Features glassmorphic design and role-based navigation items
 */
export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  role = 'admin'
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { themeMode } = useThemeContext();

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
        { text: 'Integrations', icon: <IntegrationIcon />, path: '/integrations/notion' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
      ],
      media: [
        { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
        { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
      ],
    };
    
    return [...commonItems, ...roleSpecificItems[role]];
  };

  const getSportItems = () => [
    { text: 'Football', icon: <FootballIcon />, path: '/sports/football' },
    { text: 'Basketball', icon: <BasketballIcon />, path: '/sports/basketball' },
    { text: 'Baseball', icon: <BaseballIcon />, path: '/sports/baseball' },
    { text: 'Tennis', icon: <TennisIcon />, path: '/sports/tennis' },
    { text: 'All Sports', icon: <SportsIcon />, path: '/sports' },
  ];

  const navigationItems = getNavigationItems(role);
  const sportItems = getSportItems();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'team': return 'Team Manager';
      case 'official': return 'Official';
      case 'admin': return 'Administrator';
      case 'media': return 'Media Representative';
      default: return 'User';
    }
  };

  const getFlexTimeLogo = () => {
    return themeMode === 'dark' 
      ? '/assets/logos/flextime/flextime-white.jpg' 
      : '/assets/logos/flextime/flextime-black.jpg';
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 320,
          background: themeMode === 'dark' 
            ? 'rgba(17, 25, 40, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
      ModalProps={{
        sx: {
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
          },
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              src={getFlexTimeLogo()}
              alt="FlexTime"
              sx={{
                height: 32,
                width: 'auto',
                mr: 2,
              }}
            />
            <GradientText variant="h6" sx={{ fontWeight: 700 }}>
              FlexTime
            </GradientText>
          </Box>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <ThemeToggle size="small" />
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: themeMode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* User Info */}
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #0066cc, #00c2ff)',
                color: 'white',
                fontWeight: 'bold',
                mr: 2,
              }}
            >
              {role.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {getRoleDisplayName(role)}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ color: theme.palette.text.secondary }}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)} Role
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Navigation Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', py: 2 }}>
          {/* Main Navigation */}
          <List sx={{ px: 2 }}>
            {navigationItems.map((item) => (
              <ListItemButton
                key={item.text}
                onClick={() => handleNavigate(item.path)}
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

          {/* Sports Section */}
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
            {sportItems.map((item) => (
              <ListItemButton
                key={item.text}
                onClick={() => handleNavigate(item.path)}
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

        {/* Footer Actions */}
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <List sx={{ p: 0 }}>
            <ListItemButton
              onClick={() => handleNavigate('/profile')}
              sx={{
                borderRadius: 2,
                mb: 1,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: 40 }}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItemButton>
            
            <ListItemButton
              onClick={() => handleNavigate('/settings')}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: 40 }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default MobileDrawer;