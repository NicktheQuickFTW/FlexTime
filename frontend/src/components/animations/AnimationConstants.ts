/**
 * Animation constants and configurations for FlexTime
 * Provides consistent timing, easing, and animation patterns across the application
 */

// Duration constants (in seconds)
export const ANIMATION_DURATION = {
  INSTANT: 0.0,
  FAST: 0.15,
  NORMAL: 0.3,
  SLOW: 0.5,
  EXTRA_SLOW: 0.8,
} as const;

// Easing functions
export const ANIMATION_EASING = {
  LINEAR: 'linear',
  EASE_IN: 'easeIn',
  EASE_OUT: 'easeOut',
  EASE_IN_OUT: 'easeInOut',
  SPRING: [0.6, 0.01, -0.05, 0.9],
  BOUNCE: [0.68, -0.55, 0.265, 1.55],
} as const;

// Spring animation configurations
export const SPRING_CONFIG = {
  GENTLE: {
    type: 'spring',
    stiffness: 120,
    damping: 14,
  },
  WOBBLY: {
    type: 'spring',
    stiffness: 180,
    damping: 12,
  },
  STIFF: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
  },
  SLOW: {
    type: 'spring',
    stiffness: 80,
    damping: 14,
  },
} as const;

// Common animation variants
export const FADE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const SLIDE_UP_VARIANTS = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
} as const;

export const SLIDE_DOWN_VARIANTS = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
} as const;

export const SLIDE_LEFT_VARIANTS = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
} as const;

export const SLIDE_RIGHT_VARIANTS = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
} as const;

export const SCALE_VARIANTS = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
} as const;

export const BLUR_VARIANTS = {
  initial: { opacity: 0, filter: 'blur(10px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(10px)' },
} as const;

// Stagger timing
export const STAGGER_TIMING = {
  FAST: 0.05,
  NORMAL: 0.1,
  SLOW: 0.15,
  EXTRA_SLOW: 0.2,
} as const;

// Page transition configurations
export const PAGE_TRANSITIONS = {
  DASHBOARD: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: ANIMATION_DURATION.NORMAL, ease: ANIMATION_EASING.EASE_OUT },
  },
  SCHEDULE: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
    transition: { duration: ANIMATION_DURATION.SLOW, ease: ANIMATION_EASING.EASE_IN_OUT },
  },
  CONSTRAINTS: {
    initial: { opacity: 0, filter: 'blur(5px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(5px)' },
    transition: { duration: ANIMATION_DURATION.NORMAL },
  },
  ADMIN: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: { duration: ANIMATION_DURATION.SLOW, ease: ANIMATION_EASING.EASE_IN_OUT },
  },
} as const;

// Interaction animations
export const HOVER_SCALE = {
  scale: 1.02,
  transition: { duration: ANIMATION_DURATION.FAST },
} as const;

export const HOVER_LIFT = {
  y: -2,
  scale: 1.01,
  transition: { duration: ANIMATION_DURATION.FAST },
} as const;

export const TAP_SCALE = {
  scale: 0.98,
  transition: { duration: ANIMATION_DURATION.FAST },
} as const;

// Loading animations
export const LOADING_VARIANTS = {
  PULSE: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: ANIMATION_EASING.EASE_IN_OUT,
    },
  },
  SPIN: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: ANIMATION_EASING.LINEAR,
    },
  },
  BOUNCE: {
    y: [-5, 0, -5],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: ANIMATION_EASING.EASE_IN_OUT,
    },
  },
} as const;

// Modal animations
export const MODAL_VARIANTS = {
  BACKDROP: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: ANIMATION_DURATION.FAST },
  },
  CONTENT: {
    initial: { opacity: 0, scale: 0.8, y: 50 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 50 },
    transition: { duration: ANIMATION_DURATION.NORMAL, ease: ANIMATION_EASING.EASE_OUT },
  },
} as const;

// Drawer animations
export const DRAWER_VARIANTS = {
  LEFT: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
  RIGHT: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },
  TOP: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
  },
  BOTTOM: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
} as const;

// Sport-specific animations (for themed transitions)
export const SPORT_TRANSITIONS = {
  FOOTBALL: {
    initial: { opacity: 0, rotateY: -15 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: 15 },
  },
  BASKETBALL: {
    initial: { opacity: 0, scale: 0.8, rotate: -5 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    exit: { opacity: 0, scale: 0.8, rotate: 5 },
  },
  BASEBALL: {
    initial: { opacity: 0, x: -30, rotate: -10 },
    animate: { opacity: 1, x: 0, rotate: 0 },
    exit: { opacity: 0, x: 30, rotate: 10 },
  },
  SOFTBALL: {
    initial: { opacity: 0, y: 20, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.9 },
  },
} as const;

// Performance optimization settings
export const PERFORMANCE_CONFIG = {
  REDUCED_MOTION: {
    duration: ANIMATION_DURATION.INSTANT,
    transition: { duration: 0 },
  },
  LOW_PERFORMANCE: {
    duration: ANIMATION_DURATION.FAST,
    ease: ANIMATION_EASING.LINEAR,
    type: 'tween',
  },
} as const;

// Viewport breakpoints for responsive animations
export const ANIMATION_BREAKPOINTS = {
  MOBILE: '(max-width: 768px)',
  TABLET: '(min-width: 769px) and (max-width: 1024px)',
  DESKTOP: '(min-width: 1025px)',
} as const;

const animationConstants = {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  SPRING_CONFIG,
  FADE_VARIANTS,
  SLIDE_UP_VARIANTS,
  SLIDE_DOWN_VARIANTS,
  SLIDE_LEFT_VARIANTS,
  SLIDE_RIGHT_VARIANTS,
  SCALE_VARIANTS,
  BLUR_VARIANTS,
  STAGGER_TIMING,
  PAGE_TRANSITIONS,
  HOVER_SCALE,
  HOVER_LIFT,
  TAP_SCALE,
  LOADING_VARIANTS,
  MODAL_VARIANTS,
  DRAWER_VARIANTS,
  SPORT_TRANSITIONS,
  PERFORMANCE_CONFIG,
  ANIMATION_BREAKPOINTS,
};

export default animationConstants;