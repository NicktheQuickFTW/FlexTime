/**
 * FlexTime Animation System
 * Export all animation components and utilities
 */

// Main transition components
export {
  PageTransition,
  StaggerContainer,
  RouteTransition,
  CardTransition,
  ModalTransition,
  DrawerTransition,
  LoadingTransition,
  ListItemTransition,
} from './PageTransitions';

// Animation provider and context
export {
  AnimationProvider,
  useAnimation,
  withAnimationOptimization,
} from './AnimationProvider';

// Animation hooks
export {
  usePageTransition,
  useScrollAnimation,
  useStaggeredAnimation,
  useRouteAnimation,
  useModalAnimation,
  useOptimizedAnimation,
} from './AnimationHooks';

// Route transition wrapper
export {
  RouteTransitionWrapper,
} from './RouteTransitionWrapper';

// Animation constants and configurations
export {
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
} from './AnimationConstants';

// Type exports
export type {
  PageTransitionProps,
  StaggerContainerProps,
  RouteTransitionProps,
} from './PageTransitions';

// Default export with all components
const AnimationSystem = {
  // Components
  PageTransition,
  StaggerContainer,
  RouteTransition,
  CardTransition,
  ModalTransition,
  DrawerTransition,
  LoadingTransition,
  ListItemTransition,
  RouteTransitionWrapper,
  
  // Provider
  AnimationProvider,
  
  // Hooks
  useAnimation,
  usePageTransition,
  useScrollAnimation,
  useStaggeredAnimation,
  useRouteAnimation,
  useModalAnimation,
  useOptimizedAnimation,
  
  // HOC
  withAnimationOptimization,
};

export default AnimationSystem;