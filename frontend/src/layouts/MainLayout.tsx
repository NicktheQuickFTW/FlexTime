/**
 * MainLayout Component - FlexTime Grid System
 * 
 * Complete responsive layout implementation with CSS Grid system following
 * FlexTime design principles: glassmorphic components, content containment,
 * and futuristic aesthetic with Big 12 Conference branding.
 * 
 * Based on [Playbook: Frontend Enhancement Suite] specifications.
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Fade,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Groups as TeamsIcon,
  LocationOn as VenueIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';

// Enhanced interface definitions following FlexTime architecture
interface MainLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  panel?: React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
}

interface TopAppBarProps {
  onMenuToggle: () => void;
  isMobile: boolean;
  headerContent?: React.ReactNode;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  variant: 'permanent' | 'temporary';
  children?: React.ReactNode;
}

interface FlexTimeGridSystemProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  panel?: React.ReactNode;
  sidebarCollapsed?: boolean;
  panelCollapsed?: boolean;
}

// FlexTime CSS Variables and Grid System Constants
const FLEXTIME_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  SIDEBAR_COLLAPSED_WIDTH: 72,
  PANEL_WIDTH: 360,
  HEADER_HEIGHT: 72,
  GRID_GAP: 24,
  BORDER_RADIUS: 16,
  BACKDROP_BLUR: 'blur(20px)',
  ANIMATION_DURATION: 300,
  BREAKPOINTS: {
    mobile: 768,
    tablet: 1024,
    desktop: 1440,
    wide: 1920
  }
};

// Enhanced CSS-in-JS styles following FlexTime design system
const getFlexTimeStyles = (theme: any, isMobile: boolean, sidebarCollapsed: boolean) => ({
  // Main grid system container
  ftGridSystem: {
    display: 'grid',
    gridTemplateAreas: isMobile 
      ? `"header header header"
         "main main main"` 
      : `"sidebar header panel"
         "sidebar main panel"`,
    gridTemplateColumns: isMobile 
      ? '1fr'
      : `${sidebarCollapsed ? FLEXTIME_CONSTANTS.SIDEBAR_COLLAPSED_WIDTH : FLEXTIME_CONSTANTS.SIDEBAR_WIDTH}px 1fr ${FLEXTIME_CONSTANTS.PANEL_WIDTH}px`,
    gridTemplateRows: `${FLEXTIME_CONSTANTS.HEADER_HEIGHT}px 1fr`,
    minHeight: '100vh',
    gap: 0,
    background: theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, #0a0e17 0%, #1a1f2e 50%, #0f1419 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.palette.mode === 'dark'
        ? 'radial-gradient(circle at 20% 80%, rgba(0, 191, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.08) 0%, transparent 50%)'
        : 'radial-gradient(circle at 20% 80%, rgba(0, 191, 255, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.03) 0%, transparent 50%)',
      pointerEvents: 'none',
      zIndex: 0
    }
  },

  // Header styles with glassmorphic effect
  ftHeader: {
    gridArea: 'header',
    background: theme.palette.mode === 'dark'
      ? 'rgba(17, 25, 40, 0.8)'
      : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: FLEXTIME_CONSTANTS.BACKDROP_BLUR,
    borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 1100,
    transition: `all ${FLEXTIME_CONSTANTS.ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
  },

  // Sidebar with enhanced glassmorphic design
  ftSidebar: {
    gridArea: 'sidebar',
    background: theme.palette.mode === 'dark'
      ? 'rgba(17, 25, 40, 0.75)'
      : 'rgba(255, 255, 255, 0.75)',
    backdropFilter: FLEXTIME_CONSTANTS.BACKDROP_BLUR,
    borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
    boxShadow: theme.palette.mode === 'dark'
      ? '8px 0 32px rgba(0, 0, 0, 0.3)'
      : '8px 0 32px rgba(0, 0, 0, 0.05)',
    display: isMobile ? 'none' : 'flex',
    flexDirection: 'column',
    width: sidebarCollapsed ? FLEXTIME_CONSTANTS.SIDEBAR_COLLAPSED_WIDTH : FLEXTIME_CONSTANTS.SIDEBAR_WIDTH,
    transition: `all ${FLEXTIME_CONSTANTS.ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    overflow: 'hidden',
    position: 'relative'
  },

  // Main content area with proper containment
  ftMain: {
    gridArea: 'main',
    padding: FLEXTIME_CONSTANTS.GRID_GAP,
    overflow: 'auto',
    position: 'relative',
    zIndex: 1,
    // Content containment - NO OVERFLOW as specified in FlexTime principles
    width: '100%',
    maxWidth: '100%',
    minHeight: 0, // Important for flex children
    display: 'flex',
    flexDirection: 'column'
  },

  // Right panel with analytics/tools
  ftPanel: {
    gridArea: 'panel',
    background: theme.palette.mode === 'dark'
      ? 'rgba(17, 25, 40, 0.75)'
      : 'rgba(255, 255, 255, 0.75)',
    backdropFilter: FLEXTIME_CONSTANTS.BACKDROP_BLUR,
    borderLeft: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
    boxShadow: theme.palette.mode === 'dark'
      ? '-8px 0 32px rgba(0, 0, 0, 0.3)'
      : '-8px 0 32px rgba(0, 0, 0, 0.05)',
    display: isMobile ? 'none' : 'flex',
    flexDirection: 'column',
    padding: FLEXTIME_CONSTANTS.GRID_GAP,
    overflow: 'auto',
    width: FLEXTIME_CONSTANTS.PANEL_WIDTH,
    transition: `all ${FLEXTIME_CONSTANTS.ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
  },

  // Responsive mobile adjustments
  mobileOverrides: {
    '@media (max-width: 768px)': {
      ftGridSystem: {
        gridTemplateAreas: `"header"
                           "main"`,
        gridTemplateColumns: '1fr',
        gridTemplateRows: `${FLEXTIME_CONSTANTS.HEADER_HEIGHT}px 1fr`
      },
      ftMain: {
        padding: FLEXTIME_CONSTANTS.GRID_GAP / 2
      }
    }
  }
});

/**
 * TopAppBar Component with FlexTime branding and controls
 */
const TopAppBar: React.FC<TopAppBarProps> = ({ onMenuToggle, isMobile, headerContent }) => {
  const theme = useTheme();
  const router = useRouter();
  
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'transparent',
        color: theme.palette.text.primary
      }}
    >
      <Toolbar sx={{ minHeight: FLEXTIME_CONSTANTS.HEADER_HEIGHT }}>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open menu"
            edge="start"
            onClick={onMenuToggle}
            sx={{ 
              mr: 2,
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: 'rgba(0, 191, 255, 0.08)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {/* FlexTime Logo and Branding */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(90deg, #00bfff 0%, #0088ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            FlexTime
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              ml: 1, 
              color: theme.palette.text.secondary,
              fontWeight: 500
            }}
          >
            Big 12 Conference
          </Typography>
        </Box>
        
        {/* Dynamic header content */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          {headerContent}
        </Box>
        
        {/* Page indicator */}
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 0.5,
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(0, 191, 255, 0.1)'
              : 'rgba(0, 191, 255, 0.08)',
            borderRadius: 8,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.2)' : 'rgba(0, 191, 255, 0.15)'}`
          }}
        >
          <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            {router.pathname.split('/')[1] || 'Dashboard'}
          </Typography>
        </Paper>
      </Toolbar>
    </AppBar>
  );
};

/**
 * Enhanced Sidebar Component with navigation and collapsible state
 */
const FlexTimeSidebar: React.FC<SidebarProps & { collapsed?: boolean; onToggleCollapse?: () => void; children?: React.ReactNode }> = ({ 
  isOpen, 
  onClose, 
  variant, 
  collapsed = false, 
  onToggleCollapse,
  children 
}) => {
  const theme = useTheme();
  const router = useRouter();
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', color: '#00bfff' },
    { text: 'FT Builder', icon: <CalendarIcon />, path: '/builder', color: '#00d9ff' },
    { text: 'Schedules', icon: <CalendarIcon />, path: '/schedules', color: '#ff6b35' },
    { text: 'Teams', icon: <TeamsIcon />, path: '/teams', color: '#e91e63' },
    { text: 'Venues', icon: <VenueIcon />, path: '/venues', color: '#2e7d32' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', color: '#9c27b0' },
  ];
  
  const sidebarContent = (
    <>
      {/* Sidebar Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Collapse in={!collapsed} orientation="horizontal">
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              Navigation
            </Typography>
          </Collapse>
          {variant === 'permanent' && onToggleCollapse && (
            <IconButton onClick={onToggleCollapse} size="small">
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          )}
          {variant === 'temporary' && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      
      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const isActive = router.pathname === item.path;
          return (
            <ListItemButton 
              key={item.text}
              onClick={() => {
                router.push(item.path);
                if (variant === 'temporary') onClose();
              }}
              sx={{
                borderRadius: collapsed ? '50%' : '12px',
                mx: 0.5,
                my: 0.5,
                minHeight: 48,
                backgroundColor: isActive 
                  ? `${item.color}15` 
                  : 'transparent',
                border: isActive 
                  ? `1px solid ${item.color}30`
                  : '1px solid transparent',
                '&:hover': {
                  backgroundColor: `${item.color}08`,
                  transform: 'translateX(4px)',
                  borderColor: `${item.color}20`
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                justifyContent: collapsed ? 'center' : 'flex-start'
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: isActive ? item.color : theme.palette.text.secondary,
                  minWidth: collapsed ? 'auto' : 40,
                  mr: collapsed ? 0 : 1
                }}
              >
                {item.icon}
              </ListItemIcon>
              <Collapse in={!collapsed} orientation="horizontal">
                <ListItemText 
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: isActive ? item.color : theme.palette.text.primary,
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.9rem'
                    }
                  }}
                />
              </Collapse>
            </ListItemButton>
          );
        })}
      </List>
      
      {/* Custom sidebar content */}
      {children && (
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          {children}
        </Box>
      )}
    </>
  );
  
  if (variant === 'temporary') {
    return (
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: FLEXTIME_CONSTANTS.SIDEBAR_WIDTH,
            background: theme.palette.mode === 'dark'
              ? 'rgba(17, 25, 40, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: FLEXTIME_CONSTANTS.BACKDROP_BLUR,
            border: 'none'
          }
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }
  
  return (
    <Box sx={getFlexTimeStyles(theme, false, collapsed).ftSidebar}>
      {sidebarContent}
    </Box>
  );
};

/**
 * FlexTimeGridSystem - Core grid layout component
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FlexTimeGridSystem: React.FC<FlexTimeGridSystemProps> = ({ 
  children, 
  sidebar, 
  panel, 
  sidebarCollapsed = false, 
  panelCollapsed = false 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const styles = getFlexTimeStyles(theme, isMobile, sidebarCollapsed);
  
  return (
    <Box sx={styles.ftGridSystem}>
      {sidebar && (
        <Box sx={styles.ftSidebar}>
          {sidebar}
        </Box>
      )}
      
      <Box sx={styles.ftMain}>
        {children}
      </Box>
      
      {panel && !panelCollapsed && (
        <Box sx={styles.ftPanel}>
          {panel}
        </Box>
      )}
    </Box>
  );
};

/**
 * Main Layout Component - Entry point with complete responsive implementation
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  sidebar, 
  panel, 
  headerContent, 
  className 
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) {
      setSidebarCollapsed(true);
    } else if (!isMobile) {
      setSidebarCollapsed(false);
    }
  }, [isTablet, isMobile]);
  
  const toggleMobileDrawer = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  const styles = getFlexTimeStyles(theme, isMobile, sidebarCollapsed);
  
  return (
    <Box className={className} sx={styles.ftGridSystem}>
      {/* Header */}
      <Box sx={styles.ftHeader}>
        <TopAppBar 
          onMenuToggle={toggleMobileDrawer}
          isMobile={isMobile}
          headerContent={headerContent}
        />
      </Box>
      
      {/* Desktop Sidebar */}
      {!isMobile && (
        <FlexTimeSidebar
          isOpen={true}
          onClose={() => {}}
          variant="permanent"
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        >
          {sidebar}
        </FlexTimeSidebar>
      )}
      
      {/* Mobile Drawer */}
      <FlexTimeSidebar
        isOpen={mobileOpen}
        onClose={toggleMobileDrawer}
        variant="temporary"
      >
        {sidebar}
      </FlexTimeSidebar>
      
      {/* Main Content */}
      <Box sx={styles.ftMain}>
        <Fade in timeout={300}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {children}
          </Box>
        </Fade>
      </Box>
      
      {/* Right Panel */}
      {panel && !isMobile && (
        <Box sx={styles.ftPanel}>
          {panel}
        </Box>
      )}
    </Box>
  );
};

// Export both named and default for flexibility
export default MainLayout;
