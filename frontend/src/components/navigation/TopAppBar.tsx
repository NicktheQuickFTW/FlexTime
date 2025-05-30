import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link as MuiLink,
  Stack
} from '@mui/material';
import {
  Menu as MenuIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useThemeContext } from '../../contexts/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';
import GradientText from '../common/GradientText';

interface TopAppBarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBreadcrumbs?: boolean;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

/**
 * TopAppBar component that provides navigation, branding, and common actions
 * Follows the FlexTime design system with glassmorphic effects and responsive design
 */
export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  subtitle,
  actions,
  showBreadcrumbs = true,
  onMenuClick,
  showMenuButton = false
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { themeMode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { label: 'Dashboard', path: '/', icon: <HomeIcon fontSize="small" /> }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      breadcrumbs.push({
        label,
        path: currentPath,
        icon: null
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Get FlexTime logo based on theme
  const getFlexTimeLogo = () => {
    const logoPath = themeMode === 'dark' 
      ? '/assets/logos/flextime/flextime-white.jpg' 
      : '/assets/logos/flextime/flextime-black.jpg';
    return logoPath;
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: themeMode === 'dark' 
          ? 'rgba(17, 25, 40, 0.85)' 
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.appBar,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 64, sm: 72 },
          px: { xs: 2, sm: 3 },
          py: 1,
        }}
      >
        {/* Left Section: Menu Button + Logo + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {/* Mobile menu button */}
          {showMenuButton && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={onMenuClick}
              sx={{ 
                mr: 2,
                display: { md: 'none' },
                color: theme.palette.text.primary,
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* FlexTime Logo */}
          <Box
            component="img"
            src={getFlexTimeLogo()}
            alt="FlexTime"
            sx={{
              height: { xs: 32, sm: 40 },
              width: 'auto',
              mr: 2,
              cursor: 'pointer',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
            onClick={() => navigate('/')}
          />

          {/* Title Section */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {title ? (
              <Box>
                <GradientText
                  variant={isMobile ? "h6" : "h5"}
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mb: subtitle ? 0.5 : 0,
                  }}
                >
                  {title}
                </GradientText>
                {subtitle && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>
            ) : (
              <GradientText
                variant={isMobile ? "h6" : "h5"}
                sx={{
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/')}
              >
                FlexTime
              </GradientText>
            )}

            {/* Breadcrumbs - Desktop only */}
            {showBreadcrumbs && !isMobile && location.pathname !== '/' && (
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                sx={{
                  mt: 0.5,
                  '& .MuiBreadcrumbs-ol': {
                    alignItems: 'center',
                  },
                  '& .MuiBreadcrumbs-separator': {
                    color: theme.palette.text.disabled,
                  },
                }}
              >
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return isLast ? (
                    <Typography
                      key={crumb.path}
                      variant="caption"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {crumb.icon}
                      {crumb.label}
                    </Typography>
                  ) : (
                    <MuiLink
                      key={crumb.path}
                      component={Link}
                      to={crumb.path}
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': {
                          color: theme.palette.primary.main,
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {crumb.icon}
                      {crumb.label}
                    </MuiLink>
                  );
                })}
              </Breadcrumbs>
            )}
          </Box>
        </Box>

        {/* Right Section: Actions */}
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Search Button - Hidden on mobile */}
          {!isMobile && (
            <Tooltip title="Search">
              <IconButton
                color="inherit"
                sx={{
                  color: theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: themeMode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              sx={{
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: themeMode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <NotificationsIcon />
            </IconButton>
          </Tooltip>

          {/* Theme Toggle */}
          <ThemeToggle
            tooltipPlacement="bottom"
            sx={{
              '&:hover': {
                backgroundColor: themeMode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          />

          {/* Settings - Hidden on mobile */}
          {!isMobile && (
            <Tooltip title="Settings">
              <IconButton
                color="inherit"
                onClick={() => navigate('/settings')}
                sx={{
                  color: theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: themeMode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Profile */}
          <Tooltip title="Profile">
            <IconButton
              color="inherit"
              onClick={() => navigate('/profile')}
              sx={{
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: themeMode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <PersonIcon />
            </IconButton>
          </Tooltip>

          {/* Custom Actions */}
          {actions}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default TopAppBar;