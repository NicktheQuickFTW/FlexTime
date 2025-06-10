import React from 'react';
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Groups as TeamsIcon,
  BarChart as AnalyticsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../contexts/ThemeContext';

interface BottomNavigationProps {
  show?: boolean;
}

/**
 * BottomNavigation component for mobile devices
 * Provides quick access to main app sections with glassmorphic design
 */
export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  show = true 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { themeMode } = useThemeContext();

  // Don't show on desktop or when explicitly hidden
  const isMobile = window.innerWidth <= 768;
  if (!show || !isMobile) {
    return null;
  }

  // Navigation items for bottom navigation
  const navigationItems = [
    {
      label: 'Dashboard',
      value: '/',
      icon: <DashboardIcon />,
    },
    {
      label: 'Schedules',
      value: '/schedules',
      icon: <CalendarIcon />,
    },
    {
      label: 'Teams',
      value: '/teams',
      icon: <TeamsIcon />,
    },
    {
      label: 'Analytics',
      value: '/analytics',
      icon: <AnalyticsIcon />,
    },
    {
      label: 'Profile',
      value: '/profile',
      icon: <PersonIcon />,
    },
  ];

  // Get current value based on pathname
  const getCurrentValue = () => {
    const currentPath = location.pathname;
    
    // Exact match for home
    if (currentPath === '/') return '/';
    
    // Find matching navigation item
    const matchingItem = navigationItems.find(item => 
      item.value !== '/' && currentPath.startsWith(item.value)
    );
    
    return matchingItem?.value || '/';
  };

  const currentValue = getCurrentValue();

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.bottomNavigation,
        background: themeMode === 'dark' 
          ? 'rgba(17, 25, 40, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${theme.palette.divider}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: themeMode === 'dark'
            ? 'linear-gradient(90deg, transparent, rgba(0, 102, 204, 0.5), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(0, 102, 204, 0.3), transparent)',
        },
      }}
      elevation={0}
    >
      <MuiBottomNavigation
        value={currentValue}
        onChange={handleChange}
        sx={{
          backgroundColor: 'transparent',
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            color: theme.palette.text.secondary,
            minWidth: 'auto',
            paddingTop: '8px',
            paddingBottom: '8px',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 600,
              },
            },
            '&:hover': {
              color: theme.palette.primary.light,
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            fontWeight: 500,
            lineHeight: 1.2,
            marginTop: '4px',
            '&.Mui-selected': {
              fontSize: '0.75rem',
            },
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.25rem',
          },
        }}
      >
        {navigationItems.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            sx={{
              position: 'relative',
              '&.Mui-selected::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '32px',
                height: '3px',
                backgroundColor: theme.palette.primary.main,
                borderRadius: '0 0 2px 2px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              },
            }}
          />
        ))}
      </MuiBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation;