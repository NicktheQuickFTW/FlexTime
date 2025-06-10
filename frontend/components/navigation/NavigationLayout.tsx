import React, { useState, useEffect } from 'react';
import {
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useThemeContext } from '../../contexts/ThemeContext';
import { UserRole } from '../dashboard/RoleDashboard';
import TopAppBar from './TopAppBar';
import NavigationRail from './NavigationRail';
import BottomNavigation from './BottomNavigation';
import MobileDrawer from './MobileDrawer';

interface NavigationLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBreadcrumbs?: boolean;
  role?: UserRole;
  showBottomNav?: boolean;
}

/**
 * NavigationLayout component provides a complete navigation structure
 * Automatically handles responsive behavior between desktop and mobile layouts
 * Follows the FlexTime design system with glassmorphic effects
 */
export const NavigationLayout: React.FC<NavigationLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  showBreadcrumbs = true,
  role = 'admin',
  showBottomNav = true,
}) => {
  const theme = useTheme();
  const { themeMode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close mobile drawer when switching to desktop
  useEffect(() => {
    if (!isMobile && mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile, mobileDrawerOpen]);

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleMobileDrawerClose = () => {
    setMobileDrawerOpen(false);
  };

  // Navigation rail width for desktop layout
  const navigationRailWidth = 280;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top App Bar */}
      <TopAppBar
        title={title}
        subtitle={subtitle}
        actions={actions}
        showBreadcrumbs={showBreadcrumbs}
        showMenuButton={isMobile}
        onMenuClick={handleMobileDrawerToggle}
      />

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Desktop Navigation Rail */}
        {!isMobile && (
          <Box
            sx={{
              width: navigationRailWidth,
              flexShrink: 0,
              display: 'flex',
            }}
          >
            <NavigationRail role={role} />
          </Box>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            backgroundColor: themeMode === 'dark' 
              ? 'rgba(10, 15, 30, 0.3)' 
              : 'rgba(248, 250, 252, 0.8)',
            backgroundImage: themeMode === 'dark'
              ? 'radial-gradient(circle at 20% 80%, rgba(0, 102, 204, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 194, 255, 0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 80%, rgba(0, 102, 204, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 194, 255, 0.05) 0%, transparent 50%)',
            position: 'relative',
            // Add bottom padding for mobile bottom navigation
            pb: isMobile && showBottomNav ? '64px' : 0,
          }}
        >
          {/* Content Container */}
          <Box
            sx={{
              height: '100%',
              overflow: 'auto',
              p: { xs: 2, sm: 3, md: 4 },
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={handleMobileDrawerClose}
        role={role}
      />

      {/* Mobile Bottom Navigation */}
      {isMobile && showBottomNav && (
        <BottomNavigation show={true} />
      )}
    </Box>
  );
};

export default NavigationLayout;