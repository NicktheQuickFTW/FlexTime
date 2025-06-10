/**
 * FlexTime Animation System
 * Export all animation components and utilities
 */

// All imports at the top
import PageTransitionsDefault from './PageTransitions';
import { AnimationProvider, useAnimation, withAnimationOptimization } from './AnimationProvider';
import AnimationHooksDefault from './AnimationHooks';
import AnimationConstantsDefault from './AnimationConstants';

// Main transition components  
export const {
  PageTransition,
  StaggerContainer,
  RouteTransition,
  CardTransition,
  ModalTransition,
  DrawerTransition,
  LoadingTransition,
  ListItemTransition,
} = PageTransitionsDefault;

// Animation provider and context
export { AnimationProvider, useAnimation, withAnimationOptimization };

// Animation hooks
export const {
  usePageTransition,
  useScrollAnimation,
  useStaggeredAnimation,
  useRouteAnimation,
  useModalAnimation,
  useOptimizedAnimation,
} = AnimationHooksDefault;

// Route transition wrapper (disabled for Next.js compatibility)
// export {
//   RouteTransitionWrapper,
// } from './RouteTransitionWrapper';

// Animation constants and configurations (imported at top)
export const {
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
} = AnimationConstantsDefault;

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
  // RouteTransitionWrapper, // Disabled for Next.js
  
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