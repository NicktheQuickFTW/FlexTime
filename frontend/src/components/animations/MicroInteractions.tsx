import React, { useState, useRef, useEffect, ReactNode, MouseEvent } from 'react';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { styled, useTheme, alpha } from '@mui/material/styles';
import { CircularProgress } from '@mui/material';

// Following [Playbook: Frontend Enhancement Suite] design principles
// Glassmorphic components with backdrop filters and sport-specific theming

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  elevation?: 'low' | 'medium' | 'high';
  glassEffect?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'sportAccent';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  loading?: boolean;
}

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'sportAccent';
  thickness?: number;
  glassmorphic?: boolean;
}

interface PulseIndicatorProps {
  active?: boolean;
  color?: string;
  size?: number;
  intensity?: 'low' | 'medium' | 'high';
}

interface FloatingActionProps {
  children: ReactNode;
  onClick?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offset?: number;
  delay?: number;
}

// Styled components following the glassmorphic design system
const StyledHoverCard = styled(motion.div, {
  shouldForwardProp: (prop) => 
    prop !== 'elevation' && prop !== 'glassEffect',
})<{ elevation: string; glassEffect: boolean }>(
  ({ theme, elevation, glassEffect }) => {
    const elevationMap = {
      low: '0 4px 12px rgba(0, 0, 0, 0.1)',
      medium: '0 8px 24px rgba(0, 0, 0, 0.15)',
      high: '0 16px 40px rgba(0, 0, 0, 0.2)',
    };

    const hoverElevationMap = {
      low: '0 8px 20px rgba(0, 0, 0, 0.15)',
      medium: '0 12px 32px rgba(0, 0, 0, 0.2)',
      high: '0 20px 48px rgba(0, 0, 0, 0.25)',
    };

    return {
      borderRadius: '16px',
      cursor: 'pointer',
      position: 'relative',
      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
      boxShadow: elevationMap[elevation as keyof typeof elevationMap],
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      
      ...(glassEffect && {
        backgroundColor: alpha(theme.palette.background.paper, 0.7),
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }),

      '&:hover': {
        boxShadow: hoverElevationMap[elevation as keyof typeof hoverElevationMap],
        transform: 'translateY(-4px)',
        borderColor: alpha(theme.palette.primary.main, 0.3),
      },

      '&:active': {
        transform: 'translateY(-2px)',
      },

      '&.disabled': {
        cursor: 'not-allowed',
        opacity: 0.6,
        '&:hover': {
          transform: 'none',
          boxShadow: elevationMap[elevation as keyof typeof elevationMap],
        },
      },
    };
  }
);

const StyledRippleButton = styled(motion.button, {
  shouldForwardProp: (prop) => 
    prop !== 'variant' && prop !== 'color' && prop !== 'size',
})<{ variant: string; color: string; size: string }>(
  ({ theme, variant, color, size }) => {
    const sizeMap = {
      small: { padding: '8px 16px', fontSize: '0.875rem' },
      medium: { padding: '10px 24px', fontSize: '1rem' },
      large: { padding: '12px 32px', fontSize: '1.125rem' },
    };

    const colorMap = {
      primary: theme.palette.primary,
      secondary: theme.palette.secondary,
      sportAccent: theme.palette.sportAccent,
    };

    const selectedColor = colorMap[color as keyof typeof colorMap] || colorMap.primary;
    const selectedSize = sizeMap[size as keyof typeof sizeMap];

    return {
      ...selectedSize,
      borderRadius: '30px',
      border: 'none',
      fontWeight: 600,
      textTransform: 'none',
      fontFamily: theme.typography.fontFamily,
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      outline: 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

      ...(variant === 'contained' && {
        background: `linear-gradient(135deg, ${selectedColor.main}, ${selectedColor.light})`,
        color: selectedColor.contrastText,
        boxShadow: `0 4px 12px ${alpha(selectedColor.main, 0.3)}`,
        
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 20px ${alpha(selectedColor.main, 0.4)}`,
        },
      }),

      ...(variant === 'outlined' && {
        backgroundColor: 'transparent',
        color: selectedColor.main,
        border: `2px solid ${selectedColor.main}`,
        
        '&:hover': {
          backgroundColor: alpha(selectedColor.main, 0.08),
          transform: 'translateY(-2px)',
        },
      }),

      ...(variant === 'text' && {
        backgroundColor: 'transparent',
        color: selectedColor.main,
        
        '&:hover': {
          backgroundColor: alpha(selectedColor.main, 0.08),
        },
      }),

      '&:active': {
        transform: 'scale(0.98)',
      },

      '&:disabled': {
        cursor: 'not-allowed',
        opacity: 0.6,
        '&:hover': {
          transform: 'none',
        },
      },
    };
  }
);

const StyledLoadingContainer = styled(motion.div, {
  shouldForwardProp: (prop) => prop !== 'glassmorphic',
})<{ glassmorphic: boolean }>(({ theme, glassmorphic }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  
  ...(glassmorphic && {
    padding: '12px',
    borderRadius: '50%',
    backgroundColor: alpha(theme.palette.background.paper, 0.7),
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  }),
}));

const StyledPulseIndicator = styled(motion.div)<{ 
  color: string; 
  size: number; 
  intensity: string; 
}>(({ color, size, intensity }) => {
  const intensityMap = {
    low: 0.6,
    medium: 0.8,
    high: 1.0,
  };

  return {
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: color,
    opacity: intensityMap[intensity as keyof typeof intensityMap],
  };
});

const StyledFloatingAction = styled(motion.div)<{
  position: string;
  offset: number;
}>(({ position, offset }) => {
  const positionMap = {
    'bottom-right': { bottom: offset, right: offset },
    'bottom-left': { bottom: offset, left: offset },
    'top-right': { top: offset, right: offset },
    'top-left': { top: offset, left: offset },
  };

  return {
    position: 'fixed',
    ...positionMap[position as keyof typeof positionMap],
    zIndex: 1000,
    borderRadius: '50%',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    cursor: 'pointer',
  };
});

// Animation variants following Material Design principles
const cardVariants = {
  initial: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const floatingVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: { 
      type: 'spring',
      stiffness: 260,
      damping: 20,
    }
  },
  hover: {
    scale: 1.1,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
    transition: { duration: 0.2 }
  },
};

// Ripple effect implementation
const createRipple = (event: MouseEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  const rippleStyles = `
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 600ms linear;
    background-color: rgba(255, 255, 255, 0.6);
    pointer-events: none;
  `;

  circle.style.cssText = rippleStyles;

  const ripple = button.querySelector('.ripple');
  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);

  // Add keyframe animation for ripple
  if (!document.querySelector('#ripple-animation')) {
    const style = document.createElement('style');
    style.id = 'ripple-animation';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
};

/**
 * Enhanced hover card with glassmorphic design and smooth animations
 * Following [Playbook: Frontend Enhancement Suite] design principles
 */
export const HoverCard: React.FC<HoverCardProps> = ({ 
  children, 
  className = '', 
  elevation = 'medium',
  glassEffect = true,
  disabled = false,
  onClick 
}) => {
  return (
    <StyledHoverCard
      className={`ft-hover-card ft-hover-card--${elevation} ${disabled ? 'disabled' : ''} ${className}`}
      elevation={elevation}
      glassEffect={glassEffect}
      variants={cardVariants}
      initial="initial"
      whileHover={!disabled ? "hover" : undefined}
      whileTap={!disabled ? "tap" : undefined}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </StyledHoverCard>
  );
};

/**
 * Ripple effect button with Material Design animations
 * Supports multiple variants and glassmorphic styling
 */
export const RippleButton: React.FC<RippleButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  loading = false,
  ...props 
}) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      createRipple(event);
      onClick?.(event);
    }
  };

  return (
    <StyledRippleButton
      className={`ft-ripple-button ft-ripple-button--${variant} ft-ripple-button--${color} ${className}`}
      variant={variant}
      color={color}
      size={size}
      variants={buttonVariants}
      initial="initial"
      whileHover={!disabled && !loading ? "hover" : undefined}
      whileTap={!disabled && !loading ? "tap" : undefined}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <CircularProgress size={16} color="inherit" />
            Loading...
          </motion.div>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </StyledRippleButton>
  );
};

/**
 * Glassmorphic loading spinner with smooth animations
 * Integrates with theme system for sport-specific colors
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'primary',
  thickness = 4,
  glassmorphic = true 
}) => {
  const theme = useTheme();
  
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 56,
  };

  const colorMap = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    sportAccent: theme.palette.sportAccent.main,
  };

  const spinnerSize = sizeMap[size];
  const spinnerColor = colorMap[color];

  return (
    <StyledLoadingContainer
      glassmorphic={glassmorphic}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CircularProgress 
        size={spinnerSize} 
        thickness={thickness}
        sx={{ color: spinnerColor }}
      />
    </StyledLoadingContainer>
  );
};

/**
 * Animated pulse indicator for status display
 * Uses sport-specific colors from theme system
 */
export const PulseIndicator: React.FC<PulseIndicatorProps> = ({ 
  active = true,
  color = '#00c2ff',
  size = 12,
  intensity = 'medium'
}) => {
  return (
    <StyledPulseIndicator
      color={color}
      size={size}
      intensity={intensity}
      variants={pulseVariants}
      animate={active ? "pulse" : undefined}
    />
  );
};

/**
 * Floating action component with entrance animations
 * Supports multiple positioning options
 */
export const FloatingAction: React.FC<FloatingActionProps> = ({
  children,
  onClick,
  position = 'bottom-right',
  offset = 24,
  delay = 0
}) => {
  return (
    <StyledFloatingAction
      position={position}
      offset={offset}
      variants={floatingVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      onClick={onClick}
      transition={{ delay }}
    >
      {children}
    </StyledFloatingAction>
  );
};

/**
 * Staggered animation container for lists
 * Creates smooth entrance animations for multiple items
 */
export const StaggerContainer: React.FC<{ children: ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0.1 
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Individual stagger item component
 * Used within StaggerContainer for coordinated animations
 */
export const StaggerItem: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.6, ease: 'easeOut' }
        },
      }}
    >
      {children}
    </motion.div>
  );
};

// Animation constants for consistent usage
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export const ANIMATION_EASINGS = {
  easeOut: [0.4, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  spring: { type: 'spring', stiffness: 260, damping: 20 },
} as const;

export const ELEVATION_SHADOWS = {
  low: '0 4px 12px rgba(0, 0, 0, 0.1)',
  medium: '0 8px 24px rgba(0, 0, 0, 0.15)',
  high: '0 16px 40px rgba(0, 0, 0, 0.2)',
} as const;

// Export all components
export default {
  HoverCard,
  RippleButton,
  LoadingSpinner,
  PulseIndicator,
  FloatingAction,
  StaggerContainer,
  StaggerItem,
};