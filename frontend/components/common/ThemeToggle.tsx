import React from 'react';
import { IconButton, IconButtonProps, Tooltip } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';
import useReducedMotion from '../../hooks/useReducedMotion';

interface ThemeToggleProps extends Omit<IconButtonProps, 'onClick'> {
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * A button that toggles between light and dark theme modes
 * 
 * @param tooltipPlacement - The placement of the tooltip (default: 'bottom')
 * @param props - Additional IconButton props
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({
  tooltipPlacement = 'bottom',
  ...props
}) => {
  const { themeMode, toggleThemeMode } = useThemeContext();
  const prefersReducedMotion = useReducedMotion();
  
  // Determine icon and tooltip text based on current theme mode
  const isDarkMode = themeMode === 'dark';
  const icon = isDarkMode ? <LightModeIcon /> : <DarkModeIcon />;
  const tooltipText = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';
  
  // Define transition styles respecting reduced motion preference
  const transitionStyle = prefersReducedMotion 
    ? {} 
    : { 
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        '&:hover': {
          transform: 'rotate(12deg) scale(1.1)',
        }
      };
  
  return (
    <Tooltip title={tooltipText} placement={tooltipPlacement}>
      <IconButton
        onClick={toggleThemeMode}
        color="inherit"
        aria-label={tooltipText}
        sx={{
          color: isDarkMode ? 'primary.light' : 'primary.main',
          ...transitionStyle,
          ...props.sx
        }}
        {...props}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
